// src/components/home/Header.jsx
import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  User,
  ShoppingBag,
  Menu,
  X,
  Plus
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import Logo from "../common/Logo";
import CartDrawer from "../cart/CartDrawer";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { totalItems, isCartOpen, setIsCartOpen } = useCart();
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { name: "HOME", to: "/" },
    { name: "SHOP", to: "/shop" },
    { name: "CONTACT", to: "/contact" },
  ];

  const isNavLinkActive = (to) => location.pathname === to;

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-500 py-3 safe-top ${isScrolled ? "bg-white border-b border-black/5" : "bg-white/80 backdrop-blur-sm border-transparent"}`}
      >
        <div className="w-full px-6 md:px-10">
          <div className="flex items-center justify-between h-10">

            {/* Left: Navigation (Far Left) */}
            <nav className="flex-1 flex items-center justify-start gap-8">
              {navLinks.map((link) => {
                const isActive = isNavLinkActive(link.to);
                return (
                  <NavLink
                    key={link.name}
                    to={link.to}
                    className={`
                      hidden md:block font-inter text-[9px] tracking-[0.3em] font-bold hover:text-black transition-all duration-300
                      ${isActive ? "text-black" : "text-gray-400"}
                    `}
                  >
                    {link.name}
                  </NavLink>
                );
              })}

              {/* Mobile Menu Button - Visible on Mobile */}
              <button
                className="md:hidden p-1 text-black"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </nav>

            {/* Center: Logo (Absolutely Centered) */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center justify-center">
                <Logo size="default" className="h-8 md:h-10" />
              </Link>
            </div>

            {/* Right: Icons (Far Right) */}
            <div className="flex-1 flex items-center justify-end gap-1 md:gap-3">
              <Link
                to={currentUser ? "/account" : "/login"}
                className="p-1.5 hover:opacity-50 transition-opacity hidden md:flex"
              >
                <User size={16} className="text-black" strokeWidth={2} />
              </Link>

              <button
                onClick={() => setIsCartOpen(true)}
                className="p-1.5 relative hover:opacity-50 transition-opacity"
              >
                <ShoppingBag size={16} className="text-black" strokeWidth={2} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center bg-black text-[7px] text-white font-bold rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

              {!isSearchOpen && (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-1.5 hover:opacity-50 transition-opacity"
                >
                  <Search size={16} className="text-black" strokeWidth={2} />
                </button>
              )}

              {isSearchOpen && (
                <form onSubmit={handleSearch} className="flex items-center">
                  <input
                    autoFocus
                    type="text"
                    placeholder="SEARCH"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-24 md:w-32 bg-transparent text-[8px] tracking-[0.2em] font-inter focus:outline-none border-b border-black pb-0.5 uppercase font-bold"
                  />
                  <button type="button" onClick={() => setIsSearchOpen(false)} className="ml-1">
                    <X size={12} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden pt-12 pb-10 animate-fadeIn bg-white/95 backdrop-blur-xl absolute top-full left-0 w-full h-screen px-4 z-[60]">
            <div className="flex flex-col gap-0">
              {navLinks.map((link) => {
                const isActive = isNavLinkActive(link.to);
                return (
                  <NavLink
                    key={link.name}
                    to={link.to}
                    className={`
                      py-6 border-b border-gray-50 text-[11px] tracking-[0.3em] font-bold uppercase transition-all duration-300
                      ${isActive ? "text-black" : "text-gray-400"}
                    `}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </NavLink>
                );
              })}

              <div className="mt-12 space-y-8">
                <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between text-[11px] tracking-[0.3em] font-bold uppercase text-black">
                  <span>Bag</span>
                  <span className="bg-black text-white px-2 py-0.5 text-[9px]">{totalItems}</span>
                </Link>
                <Link to={currentUser ? "/account" : "/login"} onClick={() => setIsMenuOpen(false)} className="block text-[11px] tracking-[0.3em] font-bold uppercase text-black">
                  {currentUser ? "Account" : "Login"}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
