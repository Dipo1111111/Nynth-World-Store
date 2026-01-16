// src/pages/cart.jsx - REDESIGNED
import React from "react";
import { useCart } from "../context/CartContext.jsx";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";

import { useSettings } from "../context/SettingsContext"; // Added import

import { useAuth } from "../context/AuthContext.jsx";

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { settings } = useSettings();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  // Use shipping fee from settings, fallback to 0 if not loaded yet
  const shipping = settings?.shipping_fee || 0;
  const total = subtotal + shipping;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    if (!currentUser) {
      toast.error("Please sign in to continue to checkout");
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
      return;
    }

    navigate("/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center section-pad">
          <h1 className="font-space text-4xl mb-6">Your bag is empty</h1>
          <p className="font-inter text-gray-500 mb-8 text-center max-w-md">
            Looks like you haven't added anything to your cart yet.
            Explore our latest collections to find your new favorites.
          </p>
          <Link
            to="/shop"
            className="bg-black text-white px-8 py-4 rounded-full font-medium hover:scale-105 transition-transform inline-flex items-center gap-2"
          >
            Start Shopping <ArrowRight size={18} />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Header />

      <main className="flex-1 section-pad max-w-7xl mx-auto w-full">
        <h1 className="font-space text-4xl md:text-5xl font-bold mb-12">Shopping Bag ({cartItems.length})</h1>

        <div className="grid lg:grid-cols-3 gap-12 lg:gap-20">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-8">
            {cartItems.map((item) => (
              <div
                key={`${item.id}-${item.color}-${item.size}`}
                className="flex gap-6 border-b border-gray-100 pb-8 last:border-0"
              >
                {/* Product Image */}
                <Link to={`/product/${item.id}`} className="w-24 h-32 md:w-32 md:h-40 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Product Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Link to={`/product/${item.id}`} className="font-space text-xl font-bold hover:underline">
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeFromCart(item)}
                        className="text-gray-400 hover:text-black transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="text-sm font-inter text-gray-500 space-y-1">
                      <p>Size: <span className="text-black">{item.size}</span></p>
                      <p>Color: <span className="text-black">{item.color}</span></p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    {/* Quantity Control */}
                    <div className="flex items-center border border-gray-200 rounded-lg h-10">
                      <button
                        onClick={() => updateQuantity(item, Math.max(1, item.quantity - 1))}
                        className="w-10 h-full flex items-center justify-center hover:bg-gray-50 text-gray-600"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item, item.quantity + 1)}
                        className="w-10 h-full flex items-center justify-center hover:bg-gray-50 text-gray-600"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <p className="font-space font-bold text-lg">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="text-sm text-gray-500 hover:text-black underline transition-colors"
            >
              Clear Shopping Bag
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-8 rounded-2xl sticky top-24">
              <h2 className="font-space text-2xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 font-inter text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-black">
                    {settings?.currency_symbol || "₦"}{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="text-black font-medium">
                    {settings?.currency_symbol || "₦"}{shipping.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-between font-space font-bold text-xl mb-8">
                <span>Total</span>
                <span>
                  {settings?.currency_symbol || "₦"}{total.toLocaleString()}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-black text-white py-4 rounded-xl font-medium text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 group"
              >
                Checkout
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 font-inter">
                  Secure Checkout. Easy Returns. Authenticity Guaranteed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
