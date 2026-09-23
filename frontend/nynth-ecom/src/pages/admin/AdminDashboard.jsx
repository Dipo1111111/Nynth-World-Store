import { useState, useEffect, useMemo, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { subscribeOrders, subscribePresence, getAllOrders } from "../../api/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
    Package,
    TrendingUp,
    Truck,
    BellRing,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import AdminPWAPrompt from "../../components/admin/AdminPWAPrompt";
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, ArcElement, Filler,
} from 'chart.js';
import toast from "react-hot-toast";
import { chartPalette, sparklineOptions, areaGradient, doughnutOptions } from "../../lib/charts";
import { useCountUp, useStaggerReveal } from "../../lib/motion";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

// --- UTILITIES ---
const getDateBoundaries = (filter, isPrevious = false) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    let days = 0;
    if (filter === 'today') days = 1;
    else if (filter === 'yesterday') days = 1;
    else if (filter === '7d') days = 7;
    else if (filter === '30d') days = 30;
    else if (filter === 'all') days = 3650; // roughly 10 years

    if (filter === 'yesterday') {
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() - 1);
    } else {
        start.setDate(start.getDate() - (days - 1));
    }

    if (isPrevious) {
        start.setDate(start.getDate() - days);
        end.setDate(end.getDate() - days);
    }

    return { start, end, days };
};

const calculateGrowth = (current, prev) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
};

const generateSparklineData = (orders, start, days, valueType = 'sales') => {
    const dataPoints = Array(days).fill(0);
    const labels = Array(days).fill('');

    // Safety check for 'all' time which would create huge arrays
    if (days > 365) return { dataPoints: [], labels: [] };

    orders.forEach(o => {
        if (!o.created_at?.seconds) return;
        const oDate = new Date(o.created_at.seconds * 1000);
        const dayDiff = Math.floor((oDate - start) / (1000 * 60 * 60 * 24));
        if (dayDiff >= 0 && dayDiff < days) {
            if (valueType === 'sales') {
                dataPoints[dayDiff] += (o.total || 0);
            } else if (valueType === 'revenue') {
                if (o.payment_status === 'paid' || o.payment_status === 'success') {
                    dataPoints[dayDiff] += (o.total || 0);
                }
            } else {
                dataPoints[dayDiff] += 1;
            }
        }
    });
    return { dataPoints, labels };
};

// Muted status palette — reads as part of the same design system as the cards.
const ADMIN_STATUS_COLORS = {
    processing: '#d97706',
    pending: '#f59e0b',
    confirmed: '#0284c7',
    packaging: '#2563eb',
    shipped: '#7c3aed',
    delivered: '#059669',
    failed: '#e11d48',
    cancelled: '#64748b',
};
const STATUS_LABELS = {
    processing: 'Processing',
    pending: 'Pending',
    confirmed: 'Confirmed',
    packaging: 'Packaging',
    shipped: 'Shipped',
    delivered: 'Delivered',
    failed: 'Payment failed',
    cancelled: 'Cancelled',
};

const isPaid = (o) => o.payment_status === 'paid' || o.payment_status === 'success';

const GrowthBadge = ({ value }) => {
    const isUp = value >= 0;
    const colorClass = isUp ? "text-emerald-300" : "text-rose-300";
    const Icon = isUp ? ArrowUpRight : ArrowDownRight;
    return (
        <span className={`flex items-center text-xs font-extrabold tracking-tight tabular-nums ${colorClass}`}>
            <Icon size={14} className="mr-0.5" />
            {Math.abs(value).toFixed(1)}%
        </span>
    );
};

// Icon chip — shared tile treatment for stat cards.
const StatIcon = ({ icon: Icon, className }) => (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${className}`}>
        <Icon size={18} strokeWidth={2} />
    </div>
);

// Sparkline for a stat card.
const Sparkline = ({ color, points }) => {
    const data = useMemo(() => ({
        labels: points.map((_, i) => i.toString()),
        datasets: [{
            data: points,
            borderColor: color,
            backgroundColor: (context) => areaGradient(color, context.chart.ctx, 50),
            tension: 0.4,
            fill: true,
            borderWidth: 1.5,
            pointRadius: 0,
            pointHoverRadius: 0,
        }],
    }), [points, color]);

    if (!points.length) {
        return <div className="text-[10px] text-[#EDEAE2]/35 flex items-end h-full">No trend data for this period</div>;
    }
    return <Line data={data} options={sparklineOptions} />;
};

const SegmentedFilter = ({ options, value, onChange }) => (
    <div className="segmented-control">
        {options.map(option => (
            <button
                key={option.id}
                onClick={() => onChange(option.id)}
                className={`segmented-control__item ${value === option.id ? "segmented-control__item--active" : ""}`}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${option.dot || "bg-current"}`} />
                {option.label}
            </button>
        ))}
    </div>
);

const DashboardSkeleton = () => (
    <div className="space-y-6 md:space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-[#0a0a0a] shadow-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="skeleton h-4 w-24" />
                        <div className="skeleton h-10 w-10 rounded-lg" />
                    </div>
                    <div className="skeleton h-7 w-20 mb-3" />
                    <div className="skeleton h-14 w-full" />
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl border border-white/10 bg-[#0a0a0a] shadow-card p-5">
                    <div className="skeleton h-5 w-40 mb-5" />
                    <div className="skeleton h-32 w-full" />
                </div>
            ))}
        </div>
    </div>
);

const AdminDashboard = () => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState(null);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("paid");

    const [liveVisitors, setLiveVisitors] = useState(0);
    const alertedStatus = useRef(new Map());
    const alertsBooted = useRef(false);

    const palette = useMemo(() => chartPalette(), []);
    const moneyColor = palette["admin-chart-money"] || "#059669";
    const violetColor = palette["admin-chart-violet"] || "#7c3aed";

    const revealScope = useStaggerReveal(".admin-reveal", { enabled: !loading });

    // --- SALE ALERTS (cha-ching + browser notification + toast) ---
    function triggerSaleAlert(order, kind) {
        try {
            const audio = new Audio('/sounds/cha-ching.mp3');
            audio.play().catch(e => console.log('Audio playback blocked', e));
        } catch { /* autoplay may be blocked */ }

        const customer = order.customer?.firstName || order.customer?.email || "a customer";
        const amount = `₦${(order.total || 0).toLocaleString()}`;

        if (kind === 'paid') {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('NYNTH Sale confirmed!', {
                    body: `${amount} collected from ${customer}`,
                    icon: '/favicon.png'
                });
            }
            toast.success(`Paid: ${amount} from ${customer}`, { duration: 6000, position: 'top-right' });
        } else if (kind === 'confirmed') {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('NYNTH Payment confirmed!', {
                    body: `${amount} from ${customer} is now paid`,
                    icon: '/favicon.png'
                });
            }
            toast.success(`Payment confirmed: ${amount} from ${customer}`, { duration: 6000, position: 'top-right' });
        } else {
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('NYNTH New order!', {
                    body: `${amount} from ${customer} - pending payment`,
                    icon: '/favicon.png'
                });
            }
            toast(`New order: ${amount} from ${customer} (awaiting payment)`, { duration: 6000, position: 'top-right', icon: '🧾' });
        }
    }

    // --- LIVE VISITORS ---
    useEffect(() => {
        const unsubscribe = subscribePresence(setLiveVisitors);
        return () => unsubscribe();
    }, []);

    // --- REALTIME ORDERS (single source of truth) ---
    useEffect(() => {
        getAllOrders().then(data => { setOrders(data.filter(o => !o.isTest)); setLoading(false); }).catch(() => setLoading(false));
        const unsubscribe = subscribeOrders((liveOrders) => {
            // Test-mode orders never count in the dashboard: no stats, no cha-ching, no
            // notifications. They belong in the Orders list, badged TEST.
            liveOrders = liveOrders.filter(o => !o.isTest);
            setOrders(liveOrders);
            setLoading(false);

            if (!alertsBooted.current) {
                // First snapshot is history - do not alert on everything already there.
                liveOrders.forEach((o) => {
                    if (o.created_at?.seconds) {
                        const ageMs = Date.now() - o.created_at.seconds * 1000;
                        // Only pre-seed alerts for very recent orders so a reload
                        // still pings what happened moments ago without spamming.
                        if (ageMs < 5 * 60 * 1000) {
                            alertedStatus.current.set(o.id, o.payment_status || "pending");
                        }
                    }
                });
                alertsBooted.current = true;
                return;
            }

            liveOrders.forEach((order) => {
                const orderId = order.id;
                const status = order.payment_status || "pending";
                const prev = alertedStatus.current.get(orderId);
                const createdRecently = order.created_at?.seconds
                    ? (Date.now() - order.created_at.seconds * 1000) < 10 * 60 * 1000
                    : false;

                // New order ever seen → alert once.
                if (!prev && createdRecently) {
                    alertedStatus.current.set(orderId, status);
                    if (isPaid(order)) {
                        triggerSaleAlert(order, "paid");
                    } else {
                        triggerSaleAlert(order, "pending");
                    }
                    return;
                }

                // Payment flipped pending → paid live on this screen.
                if (prev && prev !== status && isPaid(order)) {
                    alertedStatus.current.set(orderId, status);
                    triggerSaleAlert(order, "confirmed");
                }
            });
        });

        return () => unsubscribe();
    }, []);

    // --- DATA CALCULATIONS ---
    const dashboardData = useMemo(() => {
        if (!orders) return null;

        const currentBounds = getDateBoundaries(globalFilter, false);
        const prevBounds = getDateBoundaries(globalFilter, true);

        // All orders in the period (used for counts, pending + recent browsing);
        // headline metrics below are calculated from PAID orders only.
        const currentOrders = orders.filter(o => {
            if (!o.created_at?.seconds) return false;
            const d = new Date(o.created_at.seconds * 1000);
            return d >= currentBounds.start && d <= currentBounds.end;
        });
        const prevOrders = orders.filter(o => {
            if (!o.created_at?.seconds) return false;
            const d = new Date(o.created_at.seconds * 1000);
            return d >= prevBounds.start && d <= prevBounds.end;
        });

        const currentPaid = currentOrders.filter(isPaid);
        const currentPending = currentOrders.filter(o => !isPaid(o));
        const prevPaid = prevOrders.filter(isPaid);
        const prevPending = prevOrders.filter(o => !isPaid(o));

        // Lead metrics come from PAID orders only - real money in.
        // Pending orders are surfaced separately, never added into sales.
        const totalSales = currentPaid.reduce((s, o) => s + (o.total || 0), 0);
        const prevSales = prevPaid.reduce((s, o) => s + (o.total || 0), 0);

        const pendingValue = currentPending.reduce((s, o) => s + (o.total || 0), 0);
        const prevPendingValue = prevPending.reduce((s, o) => s + (o.total || 0), 0);

        const paidCount = currentPaid.length;
        const prevPaidCount = prevPaid.length;
        const pendingCount = currentPending.length;
        const deliveredCount = currentPaid.filter(o => o.order_status === 'delivered').length;
        const prevDeliveredCount = prevPaid.filter(o => o.order_status === 'delivered').length;

        // Top Products - paid orders only
        const productMap = {};
        currentPaid.forEach(o => {
            o.items?.forEach(item => {
                if (!productMap[item.id]) {
                    productMap[item.id] = { title: item.title || item.name || 'Item', quantity: 0, revenue: 0, image: item.image || item.thumbnail };
                }
                productMap[item.id].quantity += (item.quantity || 1);
                productMap[item.id].revenue += ((item.price || 0) * (item.quantity || 1));
            });
        });
        const topProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

        // Sparklines
        const sparkDays = currentBounds.days > 30 ? 30 : currentBounds.days;
        const salesSpark = generateSparklineData(currentPaid, currentBounds.start, sparkDays, 'sales');
        const ordersSpark = generateSparklineData(currentPaid, currentBounds.start, sparkDays, 'count');

        // Status Breakdown for Doughnut (fulfillment) - paid orders only
        const statusBreakdown = currentPaid.reduce((acc, o) => {
            const status = o.order_status || 'processing';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        // Recent orders - newest first, any payment state, filtered by the chips (default: paid).
        const sorted = [...currentOrders].sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
        const recentList = sorted.filter(o => {
            if (paymentFilter === 'all') return true;
            if (paymentFilter === 'pending') return !isPaid(o);
            if (paymentFilter === 'paid') return isPaid(o);
            if (paymentFilter === 'delivered') return o.order_status === 'delivered';
            return true;
        }).slice(0, 6);

        return {
            totalSales, salesGrowth: calculateGrowth(totalSales, prevSales),
            pendingValue, pendingGrowth: calculateGrowth(pendingValue, prevPendingValue),
            ordersCount: paidCount, ordersGrowth: calculateGrowth(paidCount, prevPaidCount),
            paidCount,
            pendingCount,
            deliveredCount, deliveredGrowth: calculateGrowth(deliveredCount, prevDeliveredCount),
            topProducts,
            salesSpark, ordersSpark,
            statusBreakdown,
            recentList,
        };
    }, [orders, globalFilter, paymentFilter]);

    const statusLabels = Object.keys(dashboardData?.statusBreakdown || {}).map(s => STATUS_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1));
    const statusChartData = {
        labels: statusLabels.length ? statusLabels : ['No data'],
        datasets: [{
            data: statusLabels.length
                ? Object.keys(dashboardData.statusBreakdown).map(s => dashboardData.statusBreakdown[s])
                : [1],
            backgroundColor: statusLabels.length
                ? Object.keys(dashboardData.statusBreakdown).map(s => ADMIN_STATUS_COLORS[s] || '#9ca3af')
                : ['#e5e7eb'],
            borderWidth: 3,
            borderColor: 'oklch(1 0 0)',
            borderRadius: 6,
            spacing: 2,
            hoverOffset: 4,
        }],
    };

    const donutOpts = {
        ...doughnutOptions,
        cutout: '72%',
    };

    // --- TREND RENDERER ---
    const PAYMENT_PILLS = {
        pending: "bg-amber-500/[0.14] text-amber-300",
        paid: "bg-emerald-500/[0.14] text-emerald-300",
        success: "bg-emerald-500/[0.14] text-emerald-300",
        failed: "bg-rose-500/[0.14] text-rose-300",
        cancelled: "bg-slate-500/[0.18] text-slate-400",
        refunded: "bg-slate-500/[0.18] text-slate-400",
    };

    const PaymentPill = ({ status }) => {
        const normalized = isPaid({ payment_status: status }) ? 'paid' : (status || 'pending');
        return (
            <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded border inline-block ${PAYMENT_PILLS[normalized] || PAYMENT_PILLS.pending}`}>
                {normalized === 'paid' ? 'Paid' : (status || 'pending')}
            </span>
        );
    };

    const salesRef = useCountUp(dashboardData?.totalSales || 0);
    const ordersRef = useCountUp(dashboardData?.ordersCount || 0);
    const pendingRef = useCountUp(dashboardData?.pendingValue || 0);
    const deliveredRef = useCountUp(dashboardData?.deliveredCount || 0);

    const filterOptions = [
        { id: 'all', label: 'All', dot: 'bg-[#EDEAE2]' },
        { id: 'pending', label: 'Pending', dot: 'bg-amber-500' },
        { id: 'paid', label: 'Paid', dot: 'bg-emerald-500' },
        { id: 'delivered', label: 'Delivered', dot: 'bg-violet-500' },
    ];

    return (
        <AdminLayout>
            <AdminPWAPrompt />

            {/* Page header */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-[-0.02em] text-[#EDEAE2]">Overview</h1>
                        <Badge variant={isAdmin ? "success" : "warning"}>
                            {isAdmin ? "Verified Admin" : "Standard Role"}
                        </Badge>
                    </div>
                    <p className="text-sm text-[#EDEAE2]/55">View and analyze your store's performance.</p>
                </div>
                <select
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="admin-control pl-3 pr-8 cursor-pointer"
                >
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="all">All time</option>
                </select>
            </header>

            {loading || !dashboardData ? (
                <DashboardSkeleton />
            ) : (
                <div ref={revealScope} className="space-y-6 md:space-y-8">
                    {/* Top stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {/* 1. Total Sales - paid orders only (real money in) */}
                        <Card hover className="admin-reveal bg-[#0a0a0a]">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-[#EDEAE2]/65">Total sales (paid)</p>
                                    <StatIcon icon={TrendingUp} className="bg-emerald-500/[0.14] text-emerald-300" />
                                </div>
                                <div className="flex items-end justify-between mb-4">
                                    <h3 className="text-[28px] leading-none font-extrabold tracking-[-0.02em] tabular-nums text-[#EDEAE2]">
                                        <span className="text-xl text-[#EDEAE2]/55 font-semibold">₦</span>
                                        <span ref={salesRef}>0</span>
                                    </h3>
                                    <GrowthBadge value={dashboardData.salesGrowth} />
                                </div>
                                <div className="text-xs text-[#EDEAE2]/42 font-medium mb-1">
                                    {dashboardData.paidCount} paid order{dashboardData.paidCount === 1 ? '' : 's'}
                                </div>
                                <div className="h-14 w-full mt-3">
                                    <Sparkline color={moneyColor} points={dashboardData.salesSpark.dataPoints} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Pending payment - surfaced for attention, NEVER added to sales */}
                        <Card hover className="admin-reveal bg-[#0a0a0a]">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-amber-300">Pending payment</p>
                                    <StatIcon icon={BellRing} className="bg-amber-500/[0.14] text-amber-300" />
                                </div>
                                <div className="flex items-end justify-between mb-4">
                                    <h3 className="text-[28px] leading-none font-extrabold tracking-[-0.02em] tabular-nums text-[#EDEAE2]">
                                        <span className="text-xl text-[#EDEAE2]/55 font-semibold">₦</span>
                                        <span ref={pendingRef}>0</span>
                                    </h3>
                                    <GrowthBadge value={dashboardData.pendingGrowth} />
                                </div>
                                <div className="text-xs text-amber-300 font-medium mb-3">
                                    {dashboardData.pendingCount} order{dashboardData.pendingCount === 1 ? '' : 's'} awaiting payment
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/admin/orders')}
                                    className="w-full text-xs"
                                >
                                    Review pending orders →
                                </Button>
                            </CardContent>
                        </Card>

                        {/* 3. Total orders (paid) */}
                        <Card hover className="admin-reveal bg-[#0a0a0a]">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium text-[#EDEAE2]/65">Total orders (paid)</p>
                                    <StatIcon icon={Package} className="bg-violet-500/[0.14] text-violet-300" />
                                </div>
                                <div className="flex items-end justify-between mb-4">
                                    <h3 className="text-[28px] leading-none font-extrabold tracking-[-0.02em] tabular-nums text-[#EDEAE2]">
                                        <span ref={ordersRef}>0</span>
                                    </h3>
                                    <GrowthBadge value={dashboardData.ordersGrowth} />
                                </div>
                                <div className="text-xs text-[#EDEAE2]/42 font-medium mb-1">
                                    Paid and collected
                                </div>
                                <div className="h-14 w-full mt-3">
                                    <Sparkline color={violetColor} points={dashboardData.ordersSpark.dataPoints} />
                                </div>
                            </CardContent>
                        </Card>

                        {/* 4. Live visitors + Delivered */}
                        <div className="flex flex-col gap-4 md:gap-5">
                            <Card hover className="admin-reveal bg-[#0a0a0a] flex-1 flex flex-col justify-center">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#EDEAE2]/65">Online store visitors</p>
                                        <h3 className="text-2xl font-bold text-[#EDEAE2] mt-1 flex items-center gap-2">
                                            {liveVisitors}
                                            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        </h3>
                                    </div>
                                    <StatIcon icon={Activity} className="bg-sky-500/[0.14] text-sky-300" />
                                </CardContent>
                            </Card>

                            <Card hover className="admin-reveal bg-[#0a0a0a] flex-1 flex flex-col justify-center">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#EDEAE2]/65">Delivered</p>
                                        <h3 className="text-2xl font-bold text-[#EDEAE2] mt-1">
                                            <span ref={deliveredRef}>0</span>
                                        </h3>
                                    </div>
                                    <StatIcon icon={Truck} className="bg-emerald-500/[0.14] text-emerald-300" />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Secondary grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
                        {/* Top Products */}
                        <Card hover className="admin-reveal border-white/10 lg:col-span-1">
                            <CardHeader className="border-b border-white/[0.06] pb-4">
                                <CardTitle className="text-base font-semibold text-[#EDEAE2]">Top products by units sold</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {dashboardData.topProducts.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-[#EDEAE2]/55">No product sales in this period.</div>
                                ) : (
                                    <div className="divide-y divide-white/[0.08]">
                                        {dashboardData.topProducts.map((prod, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 hover:bg-white/[0.05] transition-colors">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-10 h-10 rounded-lg border border-white/10 overflow-hidden bg-[#0a0a0a] shrink-0 shadow-card">
                                                        <img src={prod.image || "/placeholder.jpg"} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                    <p className="text-sm font-medium text-[#E3E0D6] line-clamp-1">{prod.title}</p>
                                                </div>
                                                <div className="text-right ml-4 shrink-0">
                                                    <p className="text-sm font-bold text-[#EDEAE2]">{prod.quantity}</p>
                                                    <p className="text-xs text-[#EDEAE2]/55">₦{prod.revenue.toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Orders List */}
                        <Card hover className="admin-reveal border-white/10 lg:col-span-1">
                            <CardHeader className="border-b border-white/[0.06] pb-4 flex flex-col gap-3">
                                <div className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-base font-semibold text-[#EDEAE2]">Recent orders</CardTitle>
                                    <Link to="/admin/orders" className="text-xs font-semibold text-[#EDEAE2] hover:text-[#EDEAE2] underline underline-offset-4">
                                        View all
                                    </Link>
                                </div>
                                <SegmentedFilter options={filterOptions} value={paymentFilter} onChange={setPaymentFilter} />
                            </CardHeader>
                            <CardContent className="p-0">
                                {dashboardData.recentList.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-[#EDEAE2]/55">
                                        {paymentFilter === 'all'
                                            ? 'No recent orders.'
                                            : `No ${paymentFilter} orders in this period.`}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/[0.08]">
                                        {dashboardData.recentList.map((order) => (
                                            <div key={order.id} className="flex items-center justify-between p-4 hover:bg-white/[0.05] transition-colors">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-[#EDEAE2]">#{order.id.slice(0, 8).toUpperCase()}</p>
                                                    <p className="text-xs text-[#EDEAE2]/55 truncate mt-0.5">
                                                        {order.customer?.firstName} {order.customer?.lastName}
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-semibold text-[#EDEAE2]">₦{order.total?.toLocaleString()}</p>
                                                    <PaymentPill status={order.payment_status} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Order Status Doughnut */}
                        <Card hover className="admin-reveal border-white/10 lg:col-span-1">
                            <CardHeader className="border-b border-white/[0.06] pb-4">
                                <CardTitle className="text-base font-semibold text-[#EDEAE2]">Fulfillment status</CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 flex flex-col justify-center h-[calc(100%-70px)]">
                                {Object.values(dashboardData.statusBreakdown).reduce((a, b) => a + b, 0) === 0 ? (
                                    <div className="text-center text-sm text-[#EDEAE2]/55 my-auto">No data for this period.</div>
                                ) : (
                                    <div className="h-52 w-full chart-wrap">
                                        <Doughnut data={statusChartData} options={donutOpts} />
                                        <div className="chart-donut-center mb-3">
                                            <span className="text-[10px] text-[#EDEAE2]/42 font-medium tracking-[0.2em] uppercase">All</span>
                                            <span className="text-2xl font-bold text-[#EDEAE2] leading-none mt-1">
                                                {dashboardData.ordersCount}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminDashboard;