import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Ticket, Check, Minus, Plus, ArrowRight, Zap, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { getOptimizedImageUrl } from "../../api/cloudinary";
import ProductCard from "../products/ProductCard";
import { fetchProducts } from "../../api/firebaseFunctions";
import { formatEventDateParts, eventHasPassed } from "../../utils/tickets";
import { useCart } from "../../context/CartContext";

const LAGOS_TIMEZONE = "Africa/Lagos";

const useCountdown = (eventDateTime) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!eventDateTime) return null;
  const target = new Date(eventDateTime).getTime();
  const diff = target - now;
  if (isNaN(diff) || diff <= 0) return { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    ended: false,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const GlossySheen = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,transparent_30%,rgba(255,255,255,0.10)_46%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0.10)_54%,transparent_70%)]"></div>
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(120%_60%_at_85%_-10%,rgba(255,255,255,0.14)_0%,transparent_55%)]"></div>
  </div>
);

const Countdown = ({ eventDateTime }) => {
  const countdown = useCountdown(eventDateTime);
  if (!countdown || countdown.ended) return null;
  const cells = [
    { label: "DAYS", value: countdown.days },
    { label: "HRS", value: countdown.hours },
    { label: "MIN", value: countdown.minutes },
    { label: "SEC", value: countdown.seconds },
  ];
  return (
    <div className="flex items-center gap-3">
      {cells.map((c) => (
        <div key={c.label} className="border border-white/15 px-3 py-2 text-center min-w-[58px] bg-white/5 backdrop-blur-sm">
          <p className="text-xl md:text-2xl font-bold tracking-tight tabular-nums">{String(c.value).padStart(2, "0")}</p>
          <p className="text-[7px] tracking-[0.25em] font-bold uppercase text-zinc-400 mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

export default function EventPage({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [merch, setMerch] = useState([]);
  const { addToCart } = useCart();

  const images = product.images?.length ? product.images : [product.image, product.thumbnail].filter(Boolean);
  const hero = getOptimizedImageUrl(images[0], { width: 1600 }) || "/placeholder.jpg";
  const passed = eventHasPassed(product.eventDateTime);
  const soldOut = !product.inStock || Number(product.stockQuantity) <= 0;
  const unavailable = soldOut || passed;
  const maxQty = Math.max(1, Math.min(10, Number(product.stockQuantity) > 0 ? Number(product.stockQuantity) : 10));
  const { date, time } = formatEventDateParts(product.eventDateTime);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const all = await fetchProducts();
        if (!active) return;
        const others = all.filter((p) => p.category !== "tickets").slice(0, 4);
        setMerch(others);
      } catch {
        // cross-sell is non-critical
      }
    })();
    return () => { active = false; };
  }, []);

  const handleAdd = async () => {
    if (unavailable || !product.id) return;
    try {
      setAdding(true);
      await addToCart(product, quantity, "", "");
      toast.success(`${quantity} ticket${quantity > 1 ? "s" : ""} added`);
    } catch {
      toast.error("Failed to add tickets");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-black text-white">
      {/* Hero */}
      <section className="relative min-h-[72vh] flex flex-col justify-end overflow-hidden">
        <img src={hero} alt={product.title || product.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>
        <GlossySheen />

        <div className="relative w-full max-w-[1200px] mx-auto px-5 md:px-10 pb-12 pt-32">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="inline-flex items-center gap-1.5 bg-white text-black text-[8px] font-bold tracking-[0.25em] uppercase px-3 py-1.5">
              <Ticket size={11} /> {soldOut ? "SOLD OUT" : passed ? "EVENT ENDED" : "INSTANT E-TICKET"}
            </span>
            <span className="inline-flex items-center gap-1.5 border border-white/25 text-zinc-300 text-[8px] font-bold tracking-[0.25em] uppercase px-3 py-1.5">
              <Zap size={11} /> NO DELIVERY · NO FEES
            </span>
          </div>

          <h1 className="text-3xl md:text-6xl font-bold tracking-tight uppercase leading-[1.02] max-w-3xl">
            {product.title || product.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-6 text-[11px] md:text-[12px] tracking-[0.2em] uppercase font-bold text-zinc-300">
            <span className="flex items-center gap-2"><Calendar size={14} className="text-white" /> {date}</span>
            <span className="flex items-center gap-2"><Clock size={14} className="text-white" /> {time} (WAT)</span>
            <span className="flex items-center gap-2"><MapPin size={14} className="text-white" /> {product.venue || "EVENT VENUE TBA"}</span>
          </div>

          <div className="mt-10">
            <p className="text-[8px] tracking-[0.3em] font-bold uppercase text-zinc-400 mb-3">LIVE COUNTDOWN</p>
            <Countdown eventDateTime={product.eventDateTime} />
          </div>
        </div>
      </section>

      {/* Info + Buy strip */}
      <section className="border-y border-white/10">
        <div className="w-full max-w-[1200px] mx-auto px-5 md:px-10 py-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-start">
          <div className="space-y-5 max-w-xl">
            <p className="text-[9px] tracking-[0.3em] font-bold uppercase text-zinc-400">About this event</p>
            <p className="text-[13px] leading-[1.9] text-zinc-300 whitespace-pre-line">
              {product.description || "Your ticket grants entry to this NYNTH World event. E-tickets are delivered instantly to your email after checkout - no delivery, no location needed, no fee."}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {["INSTANT EMAIL DELIVERY", "SCAN TO ENTER", "SHARE WITH FRIENDS"].map((b) => (
                <span key={b} className="border border-white/15 px-3 py-2 text-[8px] tracking-[0.25em] font-bold uppercase text-zinc-400">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Buy panel */}
          <div className="w-full md:w-[320px] bg-white text-black p-6 relative">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[8px] tracking-[0.25em] font-bold uppercase text-gray-500">Ticket price</span>
              <span className="text-xl font-bold">{Number(product.price || 0).toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between border border-black/10 mb-5">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={unavailable}
                className="w-12 h-12 flex items-center justify-center hover:bg-black hover:text-white transition-colors disabled:opacity-30"
              >
                <Minus size={16} />
              </button>
              <span className="text-[12px] font-bold tracking-widest">QTY {quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                disabled={unavailable}
                className="w-12 h-12 flex items-center justify-center hover:bg-black hover:text-white transition-colors disabled:opacity-30"
              >
                <Plus size={16} />
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={unavailable || adding}
              className="w-full bg-black text-white py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:opacity-80 transition-opacity flex items-center justify-center gap-3 disabled:opacity-30"
            >
              {adding ? (
                "ADDING..."
              ) : soldOut ? (
                "SOLD OUT"
              ) : passed ? (
                "EVENT ENDED"
              ) : (
                <>
                  <ShoppingBag size={15} /> GET TICKETS
                </>
              )}
            </button>
            {unavailable ? (
              <p className="text-[9px] tracking-widest uppercase font-bold text-red-600 mt-3 text-center">
                {soldOut ? "All tickets have been sold" : "This event has passed"}
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 mt-4">
                <span className="flex items-center gap-2 text-[9px] tracking-[0.2em] uppercase font-bold text-gray-600"><Check size={12} /> Free delivery - it's an e-ticket</span>
                <span className="flex items-center gap-2 text-[9px] tracking-[0.2em] uppercase font-bold text-gray-600"><Check size={12} /> No location needed</span>
                <span className="flex items-center gap-2 text-[9px] tracking-[0.2em] uppercase font-bold text-gray-600"><Check size={12} /> Instant e-ticket codes by email</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cross-sell: turn ticket interest into brand traffic */}
      {merch.length > 0 && (
        <section className="w-full">
          <div className="flex items-center justify-between px-5 md:px-10 py-4 bg-white text-black">
            <span className="text-[9px] tracking-[0.3em] font-bold uppercase">After the show - shop the collection</span>
            <Link to="/shop" className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.25em] font-bold uppercase hover:opacity-60 transition-opacity">
              SHOP NOW <ArrowRight size={12} />
            </Link>
          </div>
          <div className="bg-white grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 px-5 md:px-10 py-8">
            {merch.map((p) => (
              <ProductCard key={p.id} product={p} displayMode="view" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}