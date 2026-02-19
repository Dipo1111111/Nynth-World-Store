import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingBag, Search, Menu, X, User } from "lucide-react";
import logo from "../../assets/nynth-logo.png";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../context/SettingsContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { totalItems } = useCart();
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Updated navLinks to match shop categories
  const navLinks = [
    { name: "Explore", to: "/" },
    { name: "Apparel", to: "/shop?category=hoodies" },
    { name: "Homeware", to: "/shop?category=homeware" },
    { name: "Accessories", to: "/shop?category=accessories" },
    { name: "Drinkware", to: "/shop?category=drinkware" },
  ];

  // Helper to check if a nav link is active
  const isNavLinkActive = (linkTo) => {
    if (linkTo === "/shop" && location.pathname === "/shop") {
      return true;
    }

    // Check if the current URL matches the link's query params
    if (linkTo.includes("?")) {
      const [path, query] = linkTo.split("?");
      if (location.pathname === path && location.search.includes(query)) {
        return true;
      }
    }

    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="section-pad py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt={`${settings.site_name} Logo`}
              className="h-10 md:h-12 w-auto invert"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = isNavLinkActive(link.to);
              return (
                <NavLink
                  key={link.name}
                  to={link.to}
                  className={`
                    font-inter text-sm font-medium hover:text-black transition-colors
                    ${isActive ? "text-black" : "text-gray-600"}
                  `}
                >
                  {link.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Side Icons */}
          <div className="flex items-center gap-3 md:gap-4">
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="relative animate-fadeIn">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 md:w-64 px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-black transition-all"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-3 top-2 text-gray-400 hover:text-black"
                >
                  <X size={14} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden md:block"
                aria-label="Search"
              >
                <Search size={20} className="text-gray-700" />
              </button>
            )}

            {/* Auth Link */}
            {currentUser ? (
              <Link
                to="/account"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Account"
                title="My Account"
              >
                <User size={20} className="text-gray-700" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Sign In"
                title="Sign In"
              >
                <User size={20} className="text-gray-700" />
              </Link>
            )}

            <Link
              to="/cart"
              className="p-2 relative hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingBag size={20} className="text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[11px] text-white font-medium">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pt-6 pb-4 border-t border-gray-100 mt-4 animate-fadeIn">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => {
                const isActive = isNavLinkActive(link.to);
                return (
                  <NavLink
                    key={link.name}
                    to={link.to}
                    className={`
                      py-2 font-inter text-base font-medium
                      ${isActive ? "text-black border-l-4 border-black pl-4" : "text-gray-600 pl-6"}
                      hover:pl-5 transition-all
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