import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Package, Image as ImageIcon, Settings, LogOut, Home, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout({ children, title }) {
    const location = useLocation();
    const { logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Products", href: "/admin/products", icon: ShoppingBag },
        { label: "Orders", href: "/admin/orders", icon: Package },
        { label: "Lookbooks", href: "/admin/lookbooks", icon: ImageIcon },
        { label: "Settings", href: "/admin/settings", icon: Settings },
    ];

    const isActive = (path) => {
        if (path === "/admin" && location.pathname === "/admin") return true;
        if (path !== "/admin" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Desktop & Mobile */}
            <aside className={`
                w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-40 transition-transform duration-300 md:translate-x-0
                ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
                flex flex-col
            `}>
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="font-space font-bold text-xl tracking-tighter">NYNTH</span>
                        <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">ADMIN</span>
                    </Link>
                    <button onClick={toggleMobileMenu} className="md:hidden p-2 text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                ? "bg-black text-white"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors mb-1"
                    >
                        <Home size={18} />
                        View Store
                    </Link>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={toggleMobileMenu}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* Mobile Header */}
                <header className="bg-white border-b border-gray-200 p-4 md:hidden flex items-center justify-between sticky top-0 z-20">
                    <span className="font-space font-bold text-lg">NYNTH ADMIN</span>
                    <button onClick={toggleMobileMenu} className="p-2 text-gray-600">
                        <Menu size={24} />
                    </button>
                </header>

                <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
                    {title && (
                        <div className="mb-6 md:mb-8">
                            <h1 className="font-space text-2xl md:text-3xl font-bold">{title}</h1>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
