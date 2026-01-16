// src/pages/checkout.jsx - REDESIGNED
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext"; // Import useAuth
import { addOrder, verifyOrderPayment } from "../api/firebaseFunctions";
import { useNavigate } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { ArrowLeft, Lock, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { useSettings } from "../context/SettingsContext";
import { trackConversion } from "../utils/monitoring";

import logo from "../assets/nynth-logo.png";

const Checkout = () => {
  const { settings } = useSettings();
  const { cartItems, totalAmount, clearCart } = useCart();
  const { currentUser } = useAuth(); // Get current user
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const [loading, setLoading] = useState(false);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (currentUser) {
      const [first, ...last] = (currentUser.displayName || "").split(" ");
      setForm(prev => ({
        ...prev,
        firstName: first || "",
        lastName: last.join(" ") || "",
        email: currentUser.email || ""
      }));
    }
  }, [currentUser]);

  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [isOrderCompleted, setIsOrderCompleted] = useState(false); // New state to prevent redirect loop

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setPaystackLoaded(true); // Set state on load
    script.onerror = () => toast.error("Failed to load payment system");
    document.body.appendChild(script);

    // Cleanup to prevent multiple scripts if revisited
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Redirect if cart is empty, ONLY if order is not completed
  useEffect(() => {
    if (!isOrderCompleted && cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, navigate, isOrderCompleted]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const payWithPaystack = (orderId, totalToPay) => {
    if (!window.PaystackPop) {
      toast.error("Payment system not loaded yet. Please refresh.");
      return;
    }

    try {
      console.log("Paystack Debug:", {
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: form.email,
        amount: totalToPay * 100,
        paystackObj: window.PaystackPop
      });

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: form.email,
        amount: totalToPay * 100, // kobo
        currency: "NGN",
        metadata: {
          orderId,
          items: cartItems.map(item => ({
            id: item.id,
            title: item.title,
            quantity: item.quantity,
            size: item.selectedSize,
            color: item.selectedColor
          })),
          customerName: `${form.firstName} ${form.lastName}`,
        },
        callback: (response) => {
          const handleSuccess = async () => {
            setIsOrderCompleted(true); // Flag order as complete so we don't redirect to cart

            // 1. Verify payment in DB (Client-side trigger)
            await verifyOrderPayment(orderId, response.reference);

            // 2. Track the conversion
            trackConversion("purchase", {
              order_id: orderId,
              amount: totalToPay,
              reference: response.reference
            });

            // 3. Clear cart and redirect
            clearCart();
            // We use setTimeout to ensure state updates (like clearCart) have processed 
            // and the redirect effect has run (and was skipped due to flag)
            setTimeout(() => {
              navigate(`/thank-you?ref=${response.reference}`);
            }, 100);
          };
          handleSuccess();
        },
        onClose: () => {
          toast("Payment window closed.");
        },
      });

      handler.openIframe();
    } catch (error) {
      console.error("Paystack initialization error:", error);
      toast.error(`Payment Error: ${error.message}`);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.address || !form.city) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      // Shipping Logic (Simple flat rate from settings)
      const shippingFee = settings.shipping_fee;
      const grandTotal = totalAmount + shippingFee;

      // Create order in Firestore
      const orderData = {
        customer: form,
        userId: currentUser ? currentUser.uid : null, // Link to user
        items: cartItems,
        subtotal: totalAmount,
        shippingFee,
        total: grandTotal,
        payment_status: "pending",
        order_status: "pending", // Start as pending until payment confirmed
        payment_method: "paystack",
        createdAt: new Date(),
      };

      const orderId = await addOrder(orderData);

      if (!orderId) {
        throw new Error("Order creation failed.");
      }

      // Open Paystack popup
      payWithPaystack(orderId, grandTotal);

    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const shipping = settings.shipping_fee;
  const grandTotal = totalAmount + shipping;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Simplified Header for Checkout */}
      <header className="py-6 px-6 md:px-10 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/cart")}
            className="text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <img src={logo} alt="NYNTH" className="h-8 md:h-10 w-auto invert" />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Lock size={14} />
          <span>Secure Checkout</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full grid lg:grid-cols-2">
        {/* Left Column: Form */}
        <div className="p-6 md:p-10 lg:p-16 lg:border-r border-gray-100">
          <h1 className="font-space text-2xl md:text-3xl font-bold mb-8">Shipping Information</h1>

          <form onSubmit={handleCheckout} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black transition-colors"
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black transition-colors"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black transition-colors"
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black transition-colors"
                placeholder="+234..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black transition-colors"
                placeholder="123 Street Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black transition-colors"
                  placeholder="Lagos"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">State</label>
                <input
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-black transition-colors"
                  placeholder="Lagos"
                />
              </div>
            </div>

            <div className="pt-8">
              <button
                type="submit"
                disabled={loading || !paystackLoaded}
                className="w-full bg-black text-white py-4 rounded-xl font-medium text-lg hover:opacity-90 disabled:opacity-70 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard size={20} />
                    Pay {settings.currency_symbol}{grandTotal.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Summary */}
        <div className="bg-gray-50 p-6 md:p-10 lg:p-16 h-full border-l border-gray-100 hidden lg:block">
          <h2 className="font-space text-2xl font-bold mb-8">Order Summary</h2>

          <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {cartItems.map((item) => (
              <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4">
                <div className="w-20 h-24 bg-white rounded-lg overflow-hidden border border-gray-200 relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-gray-500 text-white text-xs flex items-center justify-center rounded-full">
                    {item.quantity}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">
                    {item.selectedSize} / {item.selectedColor}
                  </p>
                  <p className="text-sm font-medium mt-1">₦{item.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-6 border-t border-gray-200">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{settings.currency_symbol}{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span className="text-black font-medium">{settings.currency_symbol}{shipping.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex justify-between font-space font-bold text-2xl mt-6 pt-6 border-t border-gray-200">
            <span>Total</span>
            <span>{settings.currency_symbol}{grandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Summary for Mobile (Accordion style or bottom sheet could go here) */}
        <div className="lg:hidden p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between font-space font-bold text-xl mb-4">
            <span>Total</span>
            <span>{settings.currency_symbol}{grandTotal.toLocaleString()}</span>
          </div>
          <div className="text-sm text-gray-500 mb-4">
            {cartItems.length} items in cart
          </div>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={`${item.id}-${item.selectedSize}`} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.quantity}x {item.title}</span>
                <span>₦{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
