import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Ticket, Mail } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import ProductCard from "../components/products/ProductCard";
import { fetchOrder, fetchOrderByReference, fetchProducts, verifyOrderPayment } from "../api/firebaseFunctions";
import { trackConversion } from "../utils/monitoring";
import { isTicketItem, ticketCount, formatEventDate } from "../utils/tickets";

const ThankYou = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();

  // Support both popup flow (ref=xxx) and Paystack redirect flow (reference=xxx / trxref=xxx)
  const reference = searchParams.get("ref") || searchParams.get("reference") || searchParams.get("trxref") || "";
  const orderId = searchParams.get("orderId") || "";

  const { clearCart } = useCart();
  const [mounted, setMounted] = useState(false);
  const cleared = useRef(false);

  const [order, setOrder] = useState(null);
  const [orderLoaded, setOrderLoaded] = useState(false);
  const [merch, setMerch] = useState([]);
  const finalized = useRef(false);

  // Direct reads fail RLS for guests, so fall back to proving ownership with
  // the Paystack reference from the redirect URL.
  const loadOrder = async () => {
    if (!orderId) { setOrderLoaded(true); return; }
    try {
      const direct = await fetchOrder(orderId);
      if (direct) { setOrder(direct); return; }
      if (reference) {
        const viaLookup = await fetchOrderByReference(orderId, reference);
        if (viaLookup) setOrder(viaLookup);
      }
    } catch { /* keep generic success state */ } finally {
      setOrderLoaded(true);
    }
  };

  // Finalize the order server-side (idempotent: webhook/popup may have done it
  // already) so guests landing here from the Paystack redirect still get their
  // order marked paid, tickets minted and confirmation email queued.
  useEffect(() => {
    if (!reference || finalized.current) return;
    finalized.current = true;
    verifyOrderPayment(orderId, reference)
      .then((res) => {
        if (!res?.alreadyPaid) {
          trackConversion("purchase", { order_id: orderId, reference });
        }
        // The first order load can race the server finalize that mints the
        // pass codes, so reload once verify settles and pick up order.tickets.
        return loadOrder();
      })
      .catch((err) => console.error("Finalization check failed:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, orderId]);

  const orderHasTickets = order?.items?.some((i) => isTicketItem(i)) || false;
  const orderTicketCount = order ? ticketCount(order.items) : 0;

  // Load the order so ticket buyers get their e-ticket message.
  // Guests cannot read orders directly (RLS), the reference fallback covers them.
  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

          {orderId && orderLoaded && !order && (
            <p className="text-[10px] tracking-[0.2em] text-gray-400 font-bold uppercase mb-12 leading-relaxed -mt-8">
              Still confirming your payment - your tickets land in your inbox the moment it clears. Keep this page open a little longer.
            </p>
          )}

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
            {(order.items || [])
              .filter((i) => isTicketItem(i))
              .map((item, idx) => {
                const passes = (order.tickets || []).filter((t) => t.productId === item.id);
                return (
                  <div key={idx} className="w-full max-w-xl border border-white/15 bg-white/[0.04] px-5 py-4 mb-3 text-left">
                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase">{item.name || item.title}</p>
                    <p className="text-[10px] tracking-[0.18em] uppercase text-zinc-400 mt-1.5">
                      {item.eventDateTime ? formatEventDate(item.eventDateTime) : "DATE TBC"}
                      {item.venue ? ` · ${item.venue}` : ""}
                    </p>
                    {passes.length > 0 ? (
                      <div className="mt-2.5 space-y-1.5">
                        {passes.map((t) => (
                          <Link key={t.code} to={`/ticket/${t.code}`} className="flex items-center justify-between gap-3 text-[10px] font-bold tracking-[0.18em] uppercase text-white hover:text-zinc-300 transition-colors">
                            <span className="font-mono">{t.code}</span>
                            <span className="underline underline-offset-4 decoration-white/30">Open your pass</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[9px] tracking-[0.2em] uppercase text-zinc-500 mt-2">Pass codes are on the way to your inbox</p>
                    )}
                  </div>
                );
              })}
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