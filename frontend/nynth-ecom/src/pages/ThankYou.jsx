import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";

const REDIRECT_SECONDS = 8;

const ThankYou = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Support both popup flow (ref=xxx) and Paystack redirect flow (reference=xxx / trxref=xxx)
  const reference = searchParams.get("ref") || searchParams.get("reference") || searchParams.get("trxref") || "";
  const orderId = searchParams.get("orderId") || "";

  const { clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const cleared = useRef(false);

  // Clear the cart once
  useEffect(() => {
    if (!cleared.current && reference) {
      cleared.current = true;
      clearCart();
    }
  }, [reference, clearCart]);

  // Celebration: confetti + mount animation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
    return () => clearInterval(interval);
  }, []);

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/shop", { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-inter">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center section-pad py-20 relative">
        <div className={`max-w-2xl w-full text-center transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>

          {/* Green Circled Checkmark */}
          <div className="w-28 h-28 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-8 shadow-lg shadow-emerald-500/25">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="text-[24px] md:text-[34px] font-bold tracking-tight leading-tight mb-3">
            CONGRATULATIONS!
          </h1>

          <p className="text-[18px] md:text-[24px] font-extrabold tracking-[0.12em] uppercase text-emerald-600 mb-5 leading-tight">
            Welcome to NYNTH World
          </p>

          <p className="text-[12px] md:text-[14px] text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
            Your payment went through and your order is being confirmed.
            We are packaging it with care and will update you the moment it ships.
          </p>

          {reference && (
            <div className="inline-block bg-black text-white rounded-xl px-8 py-5 mb-10 shadow-lg">
              <p className="text-[9px] tracking-[0.25em] text-gray-400 font-bold uppercase mb-1.5">Your Order Reference</p>
              <p className="text-[18px] md:text-[20px] font-extrabold tracking-[0.08em]">#{reference.slice(0, 10).toUpperCase()}</p>
            </div>
          )}

          {!reference && orderId && (
            <div className="inline-block bg-black text-white rounded-xl px-8 py-5 mb-10 shadow-lg">
              <p className="text-[9px] tracking-[0.25em] text-gray-400 font-bold uppercase mb-1.5">Your Order Reference</p>
              <p className="text-[18px] md:text-[20px] font-extrabold tracking-[0.08em]">#{orderId.slice(0, 10).toUpperCase()}</p>
            </div>
          )}

          <p className="text-[10px] tracking-[0.2em] text-gray-400 font-bold uppercase mb-12 leading-relaxed">
            A confirmation email has been sent to your inbox.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {currentUser && (
              <Link
                to="/account"
                className="px-12 py-5 border border-black text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-gray-50 transition-all text-center"
              >
                View Orders
              </Link>
            )}
            <Link
              to="/shop"
              className="px-12 py-5 bg-black text-white text-[11px] font-bold tracking-[0.3em] uppercase hover:opacity-90 transition-all flex items-center justify-center gap-4 text-center"
            >
              Continue Shopping
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Auto-redirect countdown */}
          <div className="mt-14 flex flex-col items-center gap-4">
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#efefef" strokeWidth="3" />
                <circle
                  cx="28" cy="28" r="24" fill="none" stroke="#000" strokeWidth="3"
                  strokeDasharray={150.8}
                  strokeDashoffset={150.8 * (1 - countdown / REDIRECT_SECONDS)}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[14px] font-extrabold text-black">{countdown}</span>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">Redirecting to shop</p>
            <button
              onClick={() => navigate("/shop", { replace: true })}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black hover:text-gray-600 transition-colors"
            >
              <RotateCcw size={12} /> Go to shop now
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ThankYou;
