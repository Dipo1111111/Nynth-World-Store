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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { totalItems } = useCart();
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
        className={`fixed top-0 z-50 w-full transition-colors duration-300 py-4 ${isScrolled ? "bg-white border-b border-gray-100" : "bg-transparent border-transparent"}`}
      >      <div className="px-4 md:px-10 lg:px-20">
          <div className="relative flex items-center justify-between">

            {/* Left: Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-10">
              {navLinks.map((link) => {
                const isActive = isNavLinkActive(link.to);
                return (
                  <NavLink
                    key={link.name}
                    to={link.to}
                    className={`
                    font-inter text-[10px] tracking-[0.25em] font-bold hover:text-black transition-all duration-500 relative group
                    ${isActive ? "text-black" : "text-gray-400"}
                  `}
                  >
                    {link.name}
                    <span className={`absolute -bottom-1 left-0 w-0 h-[1px] bg-black transition-all duration-500 group-hover:w-full ${isActive ? "w-full" : ""}`} />
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
                <form onSubmit={handleSearch} className="absolute right-0 top-full mt-4 flex items-center animate-fadeIn bg-white/90 backdrop-blur-md p-2 border border-gray-100 md:relative md:top-auto md:mt-0 md:mr-4 md:bg-transparent md:border-0 md:p-0">
                  <input
                    autoFocus
                    type="text"
                    placeholder="SEARCH..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 md:w-48 bg-transparent border-b border-black text-[10px] tracking-widest font-inter focus:outline-none py-1 uppercase font-bold"
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

              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2 relative hover:opacity-70 transition-opacity"
                aria-label="Shopping bag"
              >
                <ShoppingBag size={18} className="text-gray-900" strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[8px] text-white font-bold font-inter">
                    {totalItems > 99 ? "99" : totalItems}
                  </span>
                )}
              </button>
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
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
