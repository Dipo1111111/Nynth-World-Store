import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowRight, RotateCcw, Ticket, Mail } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import ProductCard from "../components/products/ProductCard";
import { fetchOrder, fetchProducts } from "../api/firebaseFunctions";
import { isTicketItem, ticketCount } from "../utils/tickets";

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

  const [order, setOrder] = useState(null);
  const [merch, setMerch] = useState([]);

  const orderHasTickets = order?.items?.some((i) => isTicketItem(i)) || false;
  const orderTicketCount = order ? ticketCount(order.items) : 0;

  // Load the order so ticket buyers get their e-ticket message
  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId)
        .then((doc) => { if (doc) setOrder(doc); })
        .catch(() => {});
    }
  }, [orderId]);

  // Cross-sell: the whole point of selling tickets - turn every ticket buyer into a brand fan
  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((all) => {
        if (!active) return;
        const others = all.filter((p) => p.category !== "tickets").slice(0, 8);
        setMerch(others);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

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
            {orderHasTickets ? "YOU'RE IN!" : "CONGRATULATIONS!"}
          </h1>

          <p className="text-[18px] md:text-[24px] font-extrabold tracking-[0.12em] uppercase text-emerald-600 mb-5 leading-tight">
            {orderHasTickets ? "See you at the show" : "Welcome to NYNTH World"}
          </p>

          <p className="text-[12px] md:text-[14px] text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
            {orderHasTickets
              ? `Your payment went through and ${orderTicketCount} e-ticket${orderTicketCount === 1 ? " is" : "s are"} on the way to your inbox - no delivery, no fees, no waiting.`
              : "Your payment went through and your order is being confirmed. We are packaging it with care and will update you the moment it ships."}
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

      {/* E-ticket confirmation strip */}
      {orderHasTickets && (
        <section className="w-full bg-black text-white py-14">
          <div className="w-full max-w-4xl mx-auto px-5 md:px-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-6">
              <Ticket size={28} />
            </div>
            <h2 className="text-[14px] md:text-[20px] font-bold tracking-[0.15em] uppercase mb-3">
              Your e-ticket{orderTicketCount === 1 ? "" : "s"} are safe with you
            </h2>
            <p className="text-[11px] leading-[1.9] text-zinc-400 max-w-xl mb-6">
              <Mail size={12} className="inline mr-1.5" />
              Sent straight to the email you used at checkout. Present it at the gate - no printing. While you're here, grab the gear for the night.
            </p>
            {order.items
              .filter((i) => isTicketItem(i))
              .map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-bold text-zinc-300 mb-1.5">
                  <span>{item.name || item.title}</span>
                  {item.eventDateTime && <span className="text-zinc-500">· {new Date(item.eventDateTime).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }).toUpperCase()}</span>}
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Cross-sell: ticket buyers → brand traffic */}
      {merch.length > 0 && (
        <section className="w-full bg-white pt-16 pb-20">
          <div className="flex items-end justify-between px-5 md:px-10 mb-8">
            <div>
              <p className="text-[8px] tracking-[0.3em] font-bold text-gray-400 uppercase mb-2">Now that you're in</p>
              <h2 className="text-[13px] md:text-[18px] font-bold tracking-[0.12em] uppercase">Shop the NYNTH collection</h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-[9px] tracking-[0.25em] font-bold uppercase hover:opacity-60 transition-opacity"
            >
              VIEW ALL <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-5 md:px-10">
            {merch.map((p) => (
              <ProductCard key={p.id} product={p} displayMode="view" />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default ThankYou;