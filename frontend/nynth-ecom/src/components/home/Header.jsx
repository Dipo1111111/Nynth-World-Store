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

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { totalItems } = useCart();
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
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
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md border-b border-gray-100 py-3" : "bg-transparent py-5"
        }`}
    >
      <div className="px-4 md:px-10 lg:px-20">
        <div className="relative flex items-center justify-between">

          {/* Left: Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = isNavLinkActive(link.to);
              return (
                <NavLink
                  key={link.name}
                  to={link.to}
                  className={`
                    font-inter text-[11px] tracking-[0.2em] font-medium hover:text-black transition-colors
                    ${isActive ? "text-black" : "text-gray-500"}
                  `}
                >
                  {link.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile Menu Button (Left on mobile) */}
          <button
            className="md:hidden p-2 -ml-2 text-black"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Center: Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link to="/" className="flex items-center">
              <Logo size="lg" className="invert" />
            </Link>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-1 md:gap-2">
            {!isSearchOpen && (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:opacity-70 transition-opacity"
                aria-label="Search"
              >
                <Search size={18} className="text-gray-900" strokeWidth={1.5} />
              </button>
            )}

            {isSearchOpen && (
              <form onSubmit={handleSearch} className="absolute right-full mr-4 flex items-center animate-fadeIn">
                <input
                  autoFocus
                  type="text"
                  placeholder="SEARCH..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 md:w-48 bg-transparent border-b border-black text-[10px] tracking-widest font-inter focus:outline-none py-1"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="ml-2"
                >
                  <X size={14} />
                </button>
              </form>
            )}

            <Link
              to={currentUser ? "/account" : "/login"}
              className="p-2 hover:opacity-70 transition-opacity"
              aria-label="Account"
            >
              <User size={18} className="text-gray-900" strokeWidth={1.5} />
            </Link>

            <Link
              to="/cart"
              className="p-2 relative hover:opacity-70 transition-opacity"
              aria-label="Shopping bag"
            >
              <ShoppingBag size={18} className="text-gray-900" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[8px] text-white font-bold font-inter">
                  {totalItems > 99 ? "99" : totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden pt-8 pb-4 animate-fadeIn bg-white absolute top-full left-0 w-full h-screen px-4 border-t border-gray-100 z-[60]">
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => {
                const isActive = isNavLinkActive(link.to);
                return (
                  <NavLink
                    key={link.name}
                    to={link.to}
                    className={`
                      text-lg tracking-[0.2em] font-medium font-inter
                      ${isActive ? "text-black" : "text-gray-400"}
                    `}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
