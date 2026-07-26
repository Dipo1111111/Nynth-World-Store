import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";

const ThankYou = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("ref");
  const { clearCart } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Trigger premium confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    if (reference) {
      clearCart();
    }

    return () => clearInterval(interval);
  }, [reference, clearCart]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-inter">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center section-pad py-20 relative">
        <div className={`max-w-xl w-full text-center transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>

          {/* Green Circled Checkmark */}
          <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-10 shadow-lg shadow-emerald-500/20">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 className="text-[28px] md:text-[36px] font-bold tracking-tight leading-tight mb-4">
            THANK YOU FOR YOUR ORDER
          </h1>

          <p className="text-[18px] md:text-[22px] font-semibold tracking-[0.15em] uppercase text-emerald-600 mb-6">
            Welcome to NYNTH World
          </p>

          <p className="text-[11px] tracking-[0.2em] text-gray-400 font-bold uppercase mb-14 leading-relaxed max-w-md mx-auto">
            Your order reference is <span className="text-black">{reference || "NY-000000"}</span>.
            A confirmation email has been sent to your inbox.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ThankYou;
