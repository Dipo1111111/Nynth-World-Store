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
import { LAGOS_SHIPPING_DATA } from "../data/locationData";

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
    state: "Lagos",
    zip: "",
  });
  const [shippingFee, setShippingFee] = useState(0);

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

  useEffect(() => {
    if (form.city && LAGOS_SHIPPING_DATA[form.city]) {
      setShippingFee(LAGOS_SHIPPING_DATA[form.city]);
    } else {
      setShippingFee(settings.shipping_fee || 0);
    }
  }, [form.city, settings.shipping_fee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const payWithPaystack = (orderId, totalToPay) => {
    if (!window.PaystackPop) {
      toast.error("Payment system not loaded yet. Please refresh.");
      return;
    }

    try {
      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: form.email,
        amount: totalToPay * 100, // kobo
        currency: "NGN",
        metadata: {
          orderId,
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            size: item.size,
            color: item.color
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
      // Shipping Logic (Dynamic based on city)
      const grandTotal = totalAmount + shippingFee;

      // Create order in Firestore
      const orderData = {
        customer: form,
        userId: currentUser ? currentUser.uid : null, // Link to user
        items: cartItems,
        subtotal: totalAmount,
        shippingFee: shippingFee,
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

  const grandTotal = totalAmount + shippingFee;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-inter">
      {/* Simplified Header for Checkout */}
      <header className="py-6 px-4 md:px-10 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/cart")}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <Logo size="default" className="invert" />
        </div>
        <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-gray-400">
          <Lock size={12} />
          <span>Secure</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full grid lg:grid-cols-2">
        {/* Left Column: Form */}
        <div className="p-6 md:p-10 lg:p-16 lg:border-r border-gray-100">
          <h1 className="text-[12px] tracking-[0.3em] font-bold uppercase mb-12 text-gray-400">Shipping Details</h1>

          <form onSubmit={handleCheckout} className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] tracking-widest uppercase font-bold text-gray-400">First Name</label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-b border-gray-100 focus:border-black transition-all outline-none text-[13px] tracking-wider uppercase font-medium bg-transparent"
                  placeholder="JOHN"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] tracking-widest uppercase font-bold text-gray-400">Last Name</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-b border-gray-100 focus:border-black transition-all outline-none text-[13px] tracking-wider uppercase font-medium bg-transparent"
                  placeholder="DOE"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] tracking-widest uppercase font-bold text-gray-400">Email Address</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border-b border-gray-100 focus:border-black transition-all outline-none text-[13px] tracking-wider font-medium bg-transparent"
                placeholder="JOHN@EXAMPLE.COM"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] tracking-widest uppercase font-bold text-gray-400">Phone</label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border-b border-gray-100 focus:border-black transition-all outline-none text-[13px] tracking-wider font-medium bg-transparent"
                placeholder="+234..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] tracking-widest uppercase font-bold text-gray-400">Delivery Address</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full px-4 py-3 border-b border-gray-100 focus:border-black transition-all outline-none text-[13px] tracking-wider uppercase font-medium bg-transparent"
                placeholder="123 STREET NAME"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] tracking-widest uppercase font-bold text-gray-400">City / Area</label>
                <select
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-b border-gray-100 focus:border-black transition-all outline-none text-[13px] tracking-widest uppercase font-medium bg-transparent appearance-none"
                >
                  <option value="">SELECT AREA</option>
                  {Object.keys(LAGOS_SHIPPING_DATA).sort().map((area) => (
                    <option key={area} value={area}>
                      {area.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] tracking-widest uppercase font-bold text-gray-400">State</label>
                <input
                  name="state"
                  value="LAGOS"
                  disabled
                  className="w-full px-4 py-3 border-b border-gray-100 text-[#CCCCCC] text-[13px] tracking-widest font-medium bg-transparent cursor-not-allowed uppercase"
                />
              </div>
            </div>

            <div className="pt-12">
              <button
                type="submit"
                disabled={loading || !paystackLoaded}
                className="w-full bg-black text-white py-5 text-[11px] font-bold tracking-[0.3em] uppercase hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-4"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard size={18} />
                    Pay {settings.currency_symbol}{grandTotal.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Summary */}
        <div className="bg-[#F9F9F9] p-6 md:p-10 lg:p-16 h-full border-l border-gray-100">
          <h2 className="text-[12px] tracking-[0.3em] font-bold uppercase mb-12 text-gray-400">Order Summary</h2>

          <div className="space-y-8 mb-12 max-h-[500px] overflow-y-auto pr-4 no-scrollbar">
            {cartItems.map((item) => (
              <div key={`${item.id}-${item.selectedSize}`} className="flex gap-6">
                <div className="w-20 h-28 bg-white overflow-hidden border border-gray-100 relative flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[9px] flex items-center justify-center font-bold">
                    {item.quantity}
                  </span>
                </div>
                <div className="py-1">
                  <h3 className="text-[13px] tracking-widest font-bold uppercase mb-2">{item.title}</h3>
                  <p className="text-[10px] text-gray-400 tracking-widest uppercase mb-4">
                    {item.selectedSize} / {item.selectedColor}
                  </p>
                  <p className="text-[12px] font-bold">{settings.currency_symbol}{item.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6 pt-8 border-t border-gray-200">
            <div className="flex justify-between text-[11px] tracking-widest uppercase">
              <span className="text-gray-400">Subtotal</span>
              <span className="font-bold">{settings.currency_symbol}{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[11px] tracking-widest uppercase">
              <span className="text-gray-400">Shipping</span>
              <span className="text-black font-bold uppercase">
                {form.city ? `${form.city} — ${settings.currency_symbol}${shippingFee.toLocaleString()}` : "Select area"}
              </span>
            </div>
          </div>

          <div className="flex justify-between text-[18px] tracking-[0.1em] font-bold uppercase mt-10 pt-10 border-t border-gray-200">
            <span>Total</span>
            <span>{settings.currency_symbol}{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
