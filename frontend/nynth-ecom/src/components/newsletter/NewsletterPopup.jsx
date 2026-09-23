import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X, Mail } from "lucide-react";
import { addSubscriber } from "../../api/firebaseFunctions";
import toast from "react-hot-toast";

const SEEN_KEY = "nynth_newsletter_popup_seen";

// Routes where an interrupting popup would hurt the flow.
const SKIP_PREFIXES = ["/checkout", "/thank-you", "/admin", "/login", "/signup", "/account", "/waitlist-confirmation"];

export default function NewsletterPopup() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(SEEN_KEY, "true");
  };

  const skipRoute = SKIP_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (skipRoute) return;
    if (localStorage.getItem(SEEN_KEY) === "true") return;
    const timer = setTimeout(() => setVisible(true), 1800);
    return () => clearTimeout(timer);
  }, [skipRoute]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setLoading(true);
    try {
      const result = await addSubscriber(value, "popup");
      if (result.success) {
        toast.success(result.message === "ALREADY_ADDED" ? "YOU'RE ALREADY ON THE LIST" : "WELCOME TO THE FAMILY");
      } else {
        toast.error((result.message || "SOMETHING WENT WRONG").toUpperCase());
      }
      localStorage.setItem(SEEN_KEY, "true");
      setVisible(false);
    } catch {
      toast.error("SOMETHING WENT WRONG");
      localStorage.setItem(SEEN_KEY, "true");
      setVisible(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-5"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Join the NYNTH list"
    >
      <div
        className="bg-white w-full max-w-md relative p-8 md:p-12 animate-fadeIn border-t-4 border-black"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close newsletter popup"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black transition-colors"
        >
          <X size={16} />
        </button>

        <p className="text-[9px] tracking-[0.3em] font-bold text-gray-400 uppercase mb-6">NYNTH WORLD</p>
        <h2 className="text-[20px] md:text-[24px] font-bold tracking-[0.1em] uppercase leading-tight mb-4">
          JOIN THE LIST
        </h2>
        <p className="text-[10px] leading-[2] tracking-[0.05em] text-gray-500 uppercase mb-8">
          Restricted drops. Early access. Member-only exclusives. Be the first through the door.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <Mail size={14} className="absolute left-4 top-4 text-gray-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="EMAIL ADDRESS"
              className="w-full pl-11 pr-4 py-4 text-[10px] tracking-[0.2em] uppercase border border-black/10 focus:border-black outline-none placeholder-gray-300"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "SIGNING UP..." : "SIGN ME UP"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-[8px] tracking-[0.25em] font-bold text-gray-300 uppercase">NO SPAM · UNSUBSCRIBE ANYTIME</p>
          <button
            onClick={dismiss}
            className="text-[9px] tracking-[0.2em] uppercase underline underline-offset-4 text-gray-400 hover:text-black transition-colors"
          >
            No thanks - just browsing
          </button>
        </div>
      </div>
    </div>
  );
}