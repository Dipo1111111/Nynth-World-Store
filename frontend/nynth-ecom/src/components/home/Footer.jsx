import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Youtube, Plus, Minus } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import Logo from "../common/Logo";

export default function Footer() {
  const { settings } = useSettings();
  const [isShopOpen, setIsShopOpen] = useState(false);

  const shopLinks = [
    { name: "ALL PRODUCTS", to: "/shop" },
    { name: "TEES", to: "/shop?category=tees" },
    { name: "HOODIES", to: "/shop?category=hoodies" },
    { name: "HEADWEAR", to: "/shop?category=headwear" },
  ];

  const socialLinks = [
    { icon: <Instagram size={18} />, href: settings?.instagram_url || "https://www.instagram.com/nynthworld/", name: "Instagram" },
    { icon: <Twitter size={18} />, href: settings?.twitter_url || "https://x.com/nynthworld", name: "X (Twitter)" },
    { icon: <Youtube size={18} />, href: "https://www.youtube.com/@nynthworld", name: "YouTube" },
  ];

  const serviceLinks = [
    { name: "CONTACT", to: "/contact" },
    { name: "SHIPPING INFO", to: "/shipping" },
    { name: "RETURNS", to: "/returns" },
    { name: "TRACK ORDER", to: "/account" },
  ];

  return (
    <footer className="bg-white text-black border-t border-black/5 safe-bottom">
      <div className="section-pad py-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-10">
          {/* Shop Section with Toggle */}
          <div className="flex flex-col">
            <button
              onClick={() => setIsShopOpen(!isShopOpen)}
              className="flex items-center justify-between w-full md:w-auto text-[11px] tracking-[0.3em] font-bold uppercase mb-6 group"
            >
              <span>SHOP</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-300 md:hidden">{isShopOpen ? 'HIDE' : 'SHOW'}</span>
                {isShopOpen ? <Minus size={14} className="md:hidden" /> : <Plus size={14} />}
              </div>
            </button>
            <ul className={`space-y-4 transition-all duration-500 overflow-hidden ${isShopOpen ? "max-h-60 opacity-100 mb-6" : "max-h-0 opacity-0 md:max-h-60 md:opacity-100"}`}>
              {shopLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="text-[10px] tracking-[0.2em] font-bold text-gray-400 hover:text-black transition-colors uppercase"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Section */}
          <div>
            <h4 className="text-[11px] tracking-[0.3em] font-bold uppercase mb-8">COMPANY</h4>
            <div className="space-y-6">
              <div>
                <h5 className="text-[9px] tracking-[0.2em] font-bold mb-2 uppercase">About</h5>
                <p className="text-[10px] text-gray-400 leading-relaxed tracking-wider">NYNTH WORLD is a premium minimal streetwear brand built with craftsmanship and purpose.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-[9px] tracking-[0.2em] font-bold mb-1 uppercase">Slogan</h5>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest">By Winners, For Winners</p>
                </div>
                <div>
                  <h5 className="text-[9px] tracking-[0.2em] font-bold mb-1 uppercase">Mission</h5>
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest">Quality & Purpose</p>
                </div>
              </div>
            </div>
          </div>

          {/* Socials Section */}
          <div>
            <h4 className="text-[11px] tracking-[0.3em] font-bold uppercase mb-8">SOCIALS</h4>
            <div className="flex flex-col gap-5">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 text-[10px] tracking-[0.25em] font-bold text-gray-400 hover:text-black transition-all group"
                >
                  <span className="group-hover:scale-110 transition-transform">{link.icon}</span>
                  <span className="uppercase">{link.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Service Section */}
          <div>
            <h4 className="text-[11px] tracking-[0.3em] font-bold uppercase mb-8">SERVICE</h4>
            <div className="flex flex-col gap-5">
              {serviceLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  className="text-[10px] tracking-[0.25em] font-bold text-gray-400 hover:text-black uppercase transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="border-t border-black/5 mt-20 pt-10 flex flex-col md:flex-row justify-between items-center gap-10 bg-transparent">
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link to="/" className="inline-block mb-2 scale-75 origin-left">
              <Logo size="default" />
            </Link>
            <p className="text-[9px] tracking-[0.3em] font-bold text-black uppercase">
              © NYNTH WORLD LTD
            </p>
            <p className="text-[8px] tracking-[0.4em] font-bold text-gray-300 uppercase">
              By Winners, For Winners
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
            <p className="text-[9px] tracking-[0.2em] font-bold text-gray-400 uppercase">
              Made by <span className="text-black">NYNTH WORLD & SOLOMON OLAD</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
