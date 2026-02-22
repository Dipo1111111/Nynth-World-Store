import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, ArrowRight, ShoppingBag, Mail } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../context/AuthContext";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";

const ThankYou = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("ref");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-inter">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center section-pad py-20 relative">
        <div className={`max-w-xl w-full text-center transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="w-20 h-20 bg-black flex items-center justify-center mx-auto mb-12">
            <Check size={32} className="text-white" strokeWidth={1} />
          </div>

          <h1 className="hero-title text-black mb-6">ORDER CONFIRMED</h1>

          <p className="text-[12px] tracking-[0.2em] text-gray-400 font-bold uppercase mb-12 leading-relaxed">
            Thank you for shopping with NYNTH. Your order reference is <span className="text-black">{reference || "NY-000000"}</span>.
            A confirmation email has been sent to your inbox.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            {currentUser && (
              <Link
                to="/account"
                className="px-12 py-5 border border-black text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-gray-50 transition-all"
              >
                View Collection
              </Link>
            )}
            <Link
              to="/shop"
              className="px-12 py-5 bg-black text-white text-[11px] font-bold tracking-[0.3em] uppercase hover:opacity-90 transition-all flex items-center justify-center gap-4"
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
