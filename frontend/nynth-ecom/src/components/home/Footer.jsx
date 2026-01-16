import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Heart } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import Logo from "../common/Logo";

export default function Footer() {
  const { settings } = useSettings();

  const shopLinks = [
    { name: "All Products", to: "/shop" },
    { name: "New Arrivals", to: "/shop?sort=newest" },
    { name: "Best Sellers", to: "/shop?bestsellers=true" },
    { name: "Hoodies", to: "/shop?category=hoodies" },
    { name: "T-Shirts", to: "/shop?category=tees" },
  ];

  const companyLinks = [
    { name: "Our Story", to: "/about" },
    { name: "Lookbook", to: "/lookbook" },
    { name: "Sustainability", to: "/sustainability" },
  ];

  const supportLinks = [
    { name: "Contact", to: "/contact" },
    { name: "FAQs", to: "/faqs" },
    { name: "Size Guide", to: "/size-guide" },
    { name: "Privacy Policy", to: "/privacy" },
    { name: "Terms of Service", to: "/terms" },
  ];

  const socialLinks = [
    { icon: <Instagram size={20} />, to: settings?.instagram_url || "#" },
    { icon: <Twitter size={20} />, to: settings?.twitter_url || "#" },
  ];

  return (
    <footer className="bg-black text-white">
      <div className="section-pad">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <Logo size="default" />
            </Link>
            <p className="font-inter text-gray-400 text-sm mb-6">
              Minimal streetwear built with craftsmanship. Limited drops. Premium materials.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-white transition-all"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-inter font-semibold mb-6 text-gray-300">Shop</h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="font-inter text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-inter font-semibold mb-6 text-gray-300">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="font-inter text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-inter font-semibold mb-6 text-gray-300">Support</h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.to}
                    className="font-inter text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center bg-transparent">
          <p className="font-inter text-sm text-gray-400">
            © {new Date().getFullYear()} NYNTH WORLD. All rights reserved.
          </p>
          <div className="flex items-center gap-8 mt-4 md:mt-0">
            <p className="font-inter text-sm text-gray-400">
              Made by <a href="https://solomon-olad.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-white hover:underline font-medium">Solomon Olad</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}