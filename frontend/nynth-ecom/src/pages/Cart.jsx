// src/pages/cart.jsx - REDESIGNED
import React from "react";
import { useCart } from "../context/CartContext.jsx";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import SEO from "../components/SEO";
import { useSettings } from "../context/SettingsContext";
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
      <SEO title="Shopping Bag" />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 md:px-8 py-20 lg:py-32 flex flex-col min-h-screen">
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
          <h1 className="text-[11px] font-bold tracking-[0.2em] uppercase">YOUR CART ({cartItems.length})</h1>
        </div>

        {/* Free Shipping Progress */}
        <div className="mb-10">
          <div className="flex justify-between text-[10px] tracking-widest font-bold uppercase mb-3">
            <span>You have unlocked free shipping!</span>
          </div>
          <div className="w-full h-[2px] bg-gray-200">
            <div className="h-full bg-black w-full"></div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 flex flex-col gap-6 mb-16">
          {cartItems.map((item) => (
            <div
              key={`${item.id}-${item.color}-${item.size}`}
              className="flex items-start gap-6 border-b border-gray-100 pb-6 last:border-0"
            >
              {/* Product Image */}
              <Link to={`/product/${item.id}`} className="w-20 aspect-[4/5] bg-[#eaeaea] overflow-hidden flex-shrink-0 transition-opacity hover:opacity-90 relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-[80%] h-[80%] object-contain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
              </Link>

              {/* Product Details */}
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-1">
                  <Link to={`/product/${item.id}`} className="text-[9px] md:text-[10px] tracking-[0.1em] font-bold uppercase text-black">
                    {item.name}
                  </Link>
                  <button
                    onClick={() => removeFromCart(item)}
                    className="text-gray-400 hover:text-black transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 size={12} strokeWidth={2} />
                  </button>
                </div>

                <p className="text-[9px] tracking-[0.1em] text-gray-500 uppercase mb-4">
                  SIZE: {item.size}
                </p>

                <div className="flex justify-between items-end mt-auto">
                  {/* Quantity Control - Minimal */}
                  <div className="flex items-center gap-4 text-black text-[10px]">
                    <button
                      onClick={() => updateQuantity(item, Math.max(1, item.quantity - 1))}
                      className="hover:opacity-50 disabled:opacity-20"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={10} strokeWidth={2} />
                    </button>
                    <span className="font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item, item.quantity + 1)}
                      className="hover:opacity-50"
                    >
                      <Plus size={10} strokeWidth={2} />
                    </button>
                  </div>

                  <p className="text-[9px] md:text-[10px] font-bold tracking-widest text-black">
                    {settings?.currency_symbol || "₦"}{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cross Sell Section */}
        <div className="mb-12">
          <h3 className="text-[9px] font-bold tracking-[0.2em] uppercase mb-6 text-black border-t border-gray-100 pt-6">YOU MIGHT ALSO LIKE</h3>
          <div className="grid grid-cols-3 gap-1">
            {/* Mock items for aesthetic */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white group cursor-pointer border border-transparent hover:border-gray-200">
                <div className="aspect-[4/5] bg-[#eaeaea] relative overflow-hidden mb-3">
                  <div className="w-[80%] h-[80%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-300 animate-pulse"></div>
                </div>
                <div className="flex justify-between items-center px-1 pb-2">
                  <span className="text-[8px] font-bold uppercase tracking-widest">N126,200</span>
                  <Plus size={10} className="text-gray-400 group-hover:text-black" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary & Checkout strictly at bottom */}
        <div className="mt-auto border-t border-gray-100 pt-6">
          <Link to="#" className="w-full flex justify-between items-center text-[9px] tracking-[0.2em] font-bold uppercase text-black mb-6 hover:opacity-70">
            <span>SHIPPING & RETURNS</span>
            <ArrowRight size={10} />
          </Link>

          <div className="flex justify-between font-bold text-[11px] tracking-[0.2em] uppercase mb-6 text-black">
            <span>TOTAL</span>
            <span>
              {settings?.currency_symbol || "₦"}{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} NGN
            </span>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full bg-black text-white py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            SAFE CHECK OUT
          </button>

          <div className="mt-4 flex justify-center gap-2 opacity-50 flex-wrap">
            {/* Stubbing out payment icons */}
            <div className="h-4 w-6 bg-gray-200 rounded-sm"></div>
            <div className="h-4 w-6 bg-gray-200 rounded-sm"></div>
            <div className="h-4 w-6 bg-gray-200 rounded-sm"></div>
            <div className="h-4 w-6 bg-gray-200 rounded-sm"></div>
          </div>
        </div>
      </main>      <Footer />
    </div>
  );
}
