import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    ShoppingBag,
    Package,
    ShoppingCart,
    Ticket,
    Calendar,
    Image as ImageIcon,
    Settings,
    LogOut,
    Home,
    Menu,
    X,
    Users,
    Tag,
    ShieldCheck,
    Landmark,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAdminTheme } from "../../hooks/useAdminTheme";
import { PAGE_PERMISSIONS } from "../../utils/permissions";
import Logo from "../common/Logo";
import { Sun, Moon } from "lucide-react";

// Each item names the permission that opens its page. The founder holds
// everything, so can() is true for them without a special case here.
const NAV_GROUPS = [
    {
        label: "Shop",
        items: [
            { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
            { label: "Products", href: "/admin/products", icon: ShoppingBag, permission: ["store.products.view", "ticketing.events.edit"] },
            { label: "Events", href: "/admin/events", icon: Calendar, permission: "ticketing.events.view" },
            { label: "Orders", href: "/admin/orders", icon: Package, permission: "store.orders.view" },
            { label: "Door Check-In", href: "/admin/check-in", icon: Ticket, permission: "ticketing.verify" },
            { label: "Abandoned Checkouts", href: "/admin/abandoned-checkouts", icon: ShoppingCart, permission: "store.carts.view" },
        ],
    },
    {
        label: "Growth",
        items: [
            { label: "Discount Codes", href: "/admin/discount-codes", icon: Tag, permission: "store.discounts.view" },
            { label: "Lookbooks", href: "/admin/lookbooks", icon: ImageIcon, permission: "store.lookbooks.view" },
            { label: "Subscribers", href: "/admin/subscribers", icon: Users, permission: "store.subscribers.view" },
        ],
    },
    {
        label: "Ticketing",
        items: [
            { label: "Ticket Platform", href: "/admin/ticket-platform", icon: Landmark, permission: "ticketing.revenue.view" },
            { label: "Staff & Access", href: "/admin/staff", icon: ShieldCheck, permission: "staff.manage" },
        ],
    },
    {
        label: "System",
        items: [{ label: "Settings", href: "/admin/settings", icon: Settings, permission: "store.settings.manage" }],
    },
];

const allowedFor = (item, can) => {
    const needed = item.permission ?? PAGE_PERMISSIONS[item.href];
    if (!needed) return true;
    return Array.isArray(needed) ? needed.some((k) => can(k)) : can(needed);
};

export default function AdminLayout({ children, title }) {
    const location = useLocation();
    const { logout, can, isAdmin, access } = useAuth();
    const { theme, toggle } = useAdminTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const roleLabel = isAdmin
        ? "Main Admin"
        : access?.role
          ? { vice_admin: "Vice Admin", ticket_organizer: "Ticket Organizer", ticket_admin: "Ticketing Admin", ticket_staff: "Ticketing Staff" }[access.role]
          : "Staff";
    const initials = (access?.full_name || access?.email || "A")
        .replace(/@.*$/, "")
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0])
        .join("")
        .toUpperCase() || "A";

    const groups = NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) => allowedFor(item, can)),
    })).filter((group) => group.items.length > 0);

    const isActive = (path) => {
        if (path === "/admin" && location.pathname === "/admin") return true;
        if (path !== "/admin" && location.pathname.startsWith(path)) return true;
        return false;
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        // data-theme drives the whole admin token layer. Only the tokens move,
        // so no page knows or cares which theme is on.
        <div className="min-h-screen admin-app admin-paper flex" data-theme={theme}>
            {/* Theme switch. On every admin screen, because reading comfort is
                not a per-page decision. */}
            <button
                type="button"
                onClick={toggle}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                aria-pressed={theme === "light"}
                title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                className="fixed top-4 right-4 z-50 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-[var(--admin-line)] bg-[var(--admin-surface)] text-[var(--admin-ink)] shadow-card hover:bg-[var(--admin-ink)]/[0.06] transition-all focus-ring"
            >
                {theme === "light" ? (
                    <Sun size={14} className="shrink-0" />
                ) : (
                    <Moon size={14} className="shrink-0" />
                )}
                <span className="hidden sm:inline text-[9px] font-bold uppercase tracking-[0.2em]">
                    {theme === "light" ? "Light" : "Dark"}
                </span>
            </button>

            {/* Sidebar - ink rail */}
            <aside
                className={`
                    w-64 bg-[var(--admin-page)] text-[var(--admin-ink)] fixed inset-y-0 left-0 z-40 flex flex-col
                    border-r border-white/[0.07]
                    transition-transform duration-300 ease-out md:translate-x-0
                    ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
                `}
            >
                {/* Brand lockup */}
                <div className="px-6 pt-7 pb-6 flex items-center justify-between">
                    <Link to="/admin" className="flex items-center gap-3 group">
                        <Logo size="sm" className="admin-logo-invert" />
                        <span className="text-[9px] font-bold tracking-[0.4em] text-[var(--admin-ink)]/70 group-hover:text-[var(--admin-ink)] transition-colors">
                            ADMIN
                        </span>
                    </Link>
                    <button
                        onClick={toggleMobileMenu}
                        className="md:hidden p-2 text-[var(--admin-ink)]/60 hover:text-[var(--admin-ink)] hover:bg-[var(--admin-ink)]/10 rounded-lg transition-all"
                        aria-label="Close menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 pb-4 space-y-6 overflow-y-auto scrollbar-hide">
                    {groups.map((group) => (
                        <div key={group.label}>
                            <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--admin-ink)]/30">
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
                                                    ? "bg-[var(--admin-surface)] text-[var(--admin-ink)] shadow-card"
                                                    : "text-[var(--admin-ink)]/55 hover:text-[var(--admin-ink)] hover:bg-white/[0.14] hover:translate-x-0.5"
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
                <div className="px-4 pb-5 pt-3 border-t border-[var(--admin-ink)]/10">
                    <div className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg bg-white/[0.06]">
                        <div className="w-8 h-8 rounded-full bg-[var(--admin-ink)]/15 flex items-center justify-center text-[11px] font-bold tracking-wider shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold truncate">{access?.full_name || "Administrator"}</p>
                            <p className="text-[10px] text-[var(--admin-ink)]/45 flex items-center gap-1 truncate">
                                <ShieldCheck size={11} className="shrink-0" /> {roleLabel}
                            </p>
                        </div>
                    </div>
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[var(--admin-ink)]/55 hover:text-[var(--admin-ink)] hover:bg-white/[0.14] transition-all duration-150"
                    >
                        <Home size={16} strokeWidth={1.8} />
                        View Store
                    </Link>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-[var(--admin-ink)]/55 hover:text-[var(--admin-ink)] hover:bg-white/[0.14] transition-all duration-150"
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
                {/* pr-16 keeps the fixed theme button from sitting on the
                    hamburger on small screens. */}
                <header className="sticky top-0 z-30 md:hidden flex items-center justify-between px-4 py-3 pr-16 bg-[var(--admin-page)] text-[var(--admin-ink)] shadow-card">
                    <Link to="/admin" className="flex items-center gap-2">
                        <Logo size="sm" className="admin-logo-invert h-5" />
                        <span className="text-[8px] font-bold tracking-[0.3em] text-[var(--admin-ink)]/70">ADMIN</span>
                    </Link>
                    <button
                        onClick={toggleMobileMenu}
                        className="p-2 text-[var(--admin-ink)]/70 hover:text-[var(--admin-ink)] hover:bg-[var(--admin-ink)]/10 rounded-lg transition-all"
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