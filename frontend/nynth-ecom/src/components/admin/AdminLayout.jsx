import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    ShoppingCart,
    Ticket,
    Image as ImageIcon,
    Settings,
    LogOut,
    Home,
    Menu,
    X,
    Users,
    Tag,
    ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Logo from "../common/Logo";

const NAV_GROUPS = [
    {
        label: "Shop",
        items: [
            { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
            { label: "Products", href: "/admin/products", icon: ShoppingBag },
            { label: "Orders", href: "/admin/orders", icon: Package },
            { label: "Door Check-In", href: "/admin/check-in", icon: Ticket },
            { label: "Abandoned Checkouts", href: "/admin/abandoned-checkouts", icon: ShoppingCart },
        ],
    },
    {
        label: "Growth",
        items: [
            { label: "Discount Codes", href: "/admin/discount-codes", icon: Tag },
            { label: "Lookbooks", href: "/admin/lookbooks", icon: ImageIcon },
            { label: "Subscribers", href: "/admin/subscribers", icon: Users },
        ],
    },
    {
        label: "System",
        items: [{ label: "Settings", href: "/admin/settings", icon: Settings }],
    },
];

export default function AdminLayout({ children, title }) {
    const location = useLocation();
    const { logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isActive = (path) => {
        if (path === "/admin" && location.pathname === "/admin") return true;
        if (path !== "/admin" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <div className="min-h-screen admin-app admin-paper flex">
            {/* Sidebar - ink rail */}
            <aside
                className={`
                    w-64 bg-[#0b0b0c] text-white fixed inset-y-0 left-0 z-40 flex flex-col
                    border-r border-white/[0.07]
                    transition-transform duration-300 ease-out md:translate-x-0
                    ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* Brand lockup */}
                <div className="px-6 pt-7 pb-6 flex items-center justify-between">
                    <Link to="/admin" className="flex items-center gap-3 group">
                        <Logo size="sm" className="invert" />
                        <span className="text-[9px] font-bold tracking-[0.4em] text-white/70 group-hover:text-white transition-colors">
                            ADMIN
                        </span>
                    </Link>
                    <button
                        onClick={toggleMobileMenu}
                        className="md:hidden p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 pb-4 space-y-6 overflow-y-auto scrollbar-hide">
                    {NAV_GROUPS.map((group) => (
                        <div key={group.label}>
                            <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
                                {group.label}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const active = isActive(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ease-out ${
                                                active
                                                    ? "bg-[#0a0a0a] text-[#EDEAE2] shadow-card"
                                                    : "text-white/55 hover:text-white hover:bg-white/[0.14] hover:translate-x-0.5"
                                            }`}
                                        >
                                            <item.icon
                                                size={16}
                                                strokeWidth={active ? 2.2 : 1.8}
                                                className="shrink-0"
                                            />
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="px-4 pb-5 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg bg-white/[0.06]">
                        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-[11px] font-bold tracking-wider shrink-0">
                            A
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold">Administrator</p>
                            <p className="text-[10px] text-white/45 flex items-center gap-1">
                                <ShieldCheck size={11} /> Nynth HQ
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/55 hover:text-white hover:bg-white/[0.14] transition-all duration-150"
                    >
                        <Home size={16} strokeWidth={1.8} />
                        View Store
                    </Link>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/55 hover:text-white hover:bg-white/[0.14] transition-all duration-150"
                    >
                        <LogOut size={16} strokeWidth={1.8} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
                    onClick={toggleMobileMenu}
                />
            )}

            {/* Content layer */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0">
                {/* Mobile header */}
                <header className="sticky top-0 z-30 md:hidden flex items-center justify-between px-4 py-3 bg-[#0c0c0c] text-white shadow-card">
                    <Link to="/admin" className="flex items-center gap-2">
                        <Logo size="sm" className="invert h-5" />
                        <span className="text-[8px] font-bold tracking-[0.3em] text-white/70">ADMIN</span>
                    </Link>
                    <button
                        onClick={toggleMobileMenu}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        aria-label="Toggle menu"
                    >
                        <Menu size={20} />
                    </button>
                </header>

                <main className="flex-1 p-6 md:p-10 max-w-[1400px] mx-auto w-full">
                    <div className="animate-admin-fade-up">
                        {title && (
                            <div className="mb-6 md:mb-8">
                                <h1 className="text-[30px] leading-[1.05] md:text-[40px] font-extrabold tracking-[-0.02em]">
                                    {title}
                                </h1>
                            </div>
                        )}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}