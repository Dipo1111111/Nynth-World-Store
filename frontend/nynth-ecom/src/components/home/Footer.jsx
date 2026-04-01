import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Youtube, Plus, Minus } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import Logo from "../common/Logo";
import { addSubscriber } from "../../api/firebaseFunctions";
import toast from "react-hot-toast";

const AccordionSection = ({ title, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-black/5 md:border-none">
      {/* Mobile: Clickable header with +/- toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 md:py-0 md:pointer-events-none"
      >
        <h4 className="text-[10px] tracking-[0.3em] font-bold uppercase text-black">{title}</h4>
        <span className="md:hidden text-gray-400">
          {open ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>
      {/* Content: hidden on mobile unless open, always visible on desktop */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:max-h-none md:opacity-100 md:mt-4 ${
          open ? "max-h-72 opacity-100 mb-4" : "max-h-0 opacity-0 md:max-h-none md:opacity-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default function Footer() {
  const { settings } = useSettings();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const socialLinks = [
    { icon: <Instagram size={18} />, href: settings?.instagram_url || "https://www.instagram.com/nynthworld/", label: "Instagram" },
    { 
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ), 
      href: settings?.twitter_url || "https://x.com/nynthworld", 
      label: "X" 
    },
    { 
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.12-3.44-3.17-3.44-5.59.02-2.31 1.34-4.38 3.4-5.45 1.48-.79 3.24-1 4.88-.63v4.06c-1.22-.38-2.61-.15-3.62.67-.77.56-1.22 1.47-1.2 2.45.02 1.25.79 2.41 1.95 2.87 1.25.48 2.7.28 3.73-.55.74-.58 1.2-1.47 1.24-2.42.06-4.5.02-9.01.03-13.51.01-1.6-.01-3.21.02-4.81T12.53.02z" />
        </svg>
      ), 
      href: settings?.tiktok_url || "https://www.tiktok.com/@nynthworld?_r=1&_t=ZS-951aMhEFEki", 
      label: "TikTok" 
    },
    { icon: <Youtube size={18} />, href: "https://www.youtube.com/@nynthworld", label: "YouTube" },
  ];

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const result = await addSubscriber(email.trim(), "footer");
      if (result.success) {
        if (result.message === "ALREADY_ADDED") {
          toast("YOU ARE ALREADY ON THE LIST", {
            icon: "ℹ️",
            style: { borderRadius: "0px", background: "#000", color: "#fff", fontSize: "10px", letterSpacing: "0.2em" },
          });
        } else {
          toast.success("YOU'RE ON THE LIST", {
            style: { borderRadius: "0px", background: "#000", color: "#fff", fontSize: "10px", letterSpacing: "0.2em" },
          });
          setEmail("");
        }
      } else {
        toast.error((result.message || "SOMETHING WENT WRONG").toUpperCase(), {
          style: { borderRadius: "0px", background: "#000", color: "#fff", fontSize: "10px", letterSpacing: "0.2em" },
        });
      }
    } catch {
      toast.error("SOMETHING WENT WRONG", {
        style: { borderRadius: "0px", background: "#000", color: "#fff", fontSize: "10px", letterSpacing: "0.2em" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-white text-black border-t border-black/5 safe-bottom">

      {/* Newsletter Section */}
      <div className="section-pad py-16 border-b border-black/5">
        <div className="max-w-md mx-auto text-center">
          <h3 className="text-[11px] tracking-[0.3em] font-bold uppercase text-black mb-8">
            SIGN UP FOR EARLY ACCESS
          </h3>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR EMAIL"
              required
              className="flex-1 border border-black/10 px-4 py-3 text-[10px] tracking-[0.2em] font-bold uppercase outline-none focus:border-black transition-colors bg-transparent placeholder:text-black/20"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="bg-black text-white px-6 py-3 text-[10px] tracking-[0.3em] font-bold uppercase hover:bg-black/80 transition-colors disabled:opacity-40"
            >
              {loading ? "..." : "JOIN"}
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="section-pad py-10 md:py-14">
        {/* Mobile: stacked accordion. Desktop: 4-col grid */}
        <div className="md:grid md:grid-cols-4 md:gap-10 mb-14">

          <AccordionSection title="SHOP">
            <ul className="space-y-4">
              {[
                { name: "ALL PRODUCTS", to: "/shop" },
                { name: "T-SHIRTS", to: "/shop?category=tees" },
                { name: "HOODIES", to: "/shop?category=hoodies" },
                { name: "HEADWEAR", to: "/shop?category=headwear" },
                { name: "SLEEVES", to: "/shop?category=sleeves" },
                { name: "POLO", to: "/shop?category=polo" },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.to} className="text-[10px] tracking-[0.2em] font-bold text-gray-400 hover:text-black transition-colors uppercase">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="HELP">
            <ul className="space-y-4">
              {[
                { name: "CONTACT", to: "/contact" },
                { name: "LOOKBOOK", to: "/lookbook" },
                { name: "SHIPPING & RETURNS", to: "/shipping" },
                { name: "TRACK ORDER", to: "/account" },
                { name: "FAQ", to: "/contact" },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.to} className="text-[10px] tracking-[0.2em] font-bold text-gray-400 hover:text-black transition-colors uppercase">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="ABOUT">
            <ul className="space-y-4">
              {[
                { name: "OUR STORY", to: "/our-story" },
                { name: "PRIVACY POLICY", to: "/privacy-policy" },
                { name: "TERMS OF SERVICE", to: "/terms-of-service" },
              ].map((link) => (
                <li key={link.name}>
                  <Link to={link.to} className="text-[10px] tracking-[0.2em] font-bold text-gray-400 hover:text-black transition-colors uppercase">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="FOLLOW US">
            <ul className="space-y-4">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] tracking-[0.2em] font-bold text-gray-400 hover:text-black uppercase transition-colors flex items-center gap-3"
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </AccordionSection>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-black/5 pt-10 flex flex-col items-center gap-6 text-center">
          <Link to="/" className="inline-block">
            <Logo size="default" />
          </Link>

          {/* Social Icons Row - horizontal */}
          <div className="flex items-center gap-6">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors"
                aria-label={link.label}
              >
                {link.icon}
              </a>
            ))}
          </div>

          {/* Legal links - horizontal */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/terms-of-service" className="text-[9px] tracking-[0.2em] font-bold text-gray-400 hover:text-black uppercase transition-colors">Terms of Service</Link>
            <Link to="/privacy-policy" className="text-[9px] tracking-[0.2em] font-bold text-gray-400 hover:text-black uppercase transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="text-[9px] tracking-[0.2em] font-bold text-gray-400 hover:text-black uppercase transition-colors">Contact</Link>
            <Link to="/shipping" className="text-[9px] tracking-[0.2em] font-bold text-gray-400 hover:text-black uppercase transition-colors">Shipping</Link>
          </div>

          <p className="text-[8px] tracking-[0.3em] font-bold text-gray-300 uppercase">
            © {new Date().getFullYear()} NYNTH WORLD. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
}
