import React, { useState, useEffect, useMemo, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { subscribeOrders, subscribePresence, getAllOrders } from "../../api/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import AdminPWAPrompt from "../../components/admin/AdminPWAPrompt";
import { useCountUp, useStaggerReveal } from "../../lib/motion";
import toast from "react-hot-toast";
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, ArcElement, Filler,
} from 'chart.js';
import { Doughnut } from "react-chartjs-2";
import { doughnutOptions } from "../../lib/charts";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

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
    else if (filter === 'all') days = 3650;
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

const ADMIN_STATUS_COLORS = {
    processing: '#d97706', pending: '#f59e0b', confirmed: '#0284c7',
    packaging: '#2563eb', shipped: '#7c3aed', delivered: '#059669',
    failed: '#e11d48', cancelled: '#64748b',
};
const STATUS_LABELS = {
    processing: 'Processing', pending: 'Pending', confirmed: 'Confirmed',
    packaging: 'Packaging', shipped: 'Shipped', delivered: 'Delivered',
    failed: 'Payment failed', cancelled: 'Cancelled',
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
    <div className="space-y-5 md:space-y-6">
        <div className="border border-white/10 bg-[#0a0a0a] rounded-2xl p-6 md:p-8">
            <div className="skeleton h-4 w-32 mb-4" />
            <div className="skeleton h-14 w-48 mb-4" />
            <div className="flex gap-8">
                {[0, 1, 2].map(i => <div key={i} className="skeleton h-10 w-16" />)}
            </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
            <div className="lg:col-span-7 border border-white/10 bg-[#0a0a0a] rounded-2xl p-5">
                <div className="skeleton h-5 w-36 mb-4" />
                {[0, 1, 2, 3].map(i => <div key={i} className="skeleton h-10 w-full mb-3" />)}
            </div>
            <div className="lg:col-span-5 flex flex-col gap-4 md:gap-5">
                <div className="border border-white/10 bg-[#0a0a0a] rounded-2xl p-5">
                    <div className="skeleton h-5 w-32 mb-4" />
                    <div className="skeleton h-48 w-full" />
                </div>
                <div className="border border-white/10 bg-[#0a0a0a] rounded-2xl p-5">
                    <div className="skeleton h-5 w-32 mb-4" />
                    {[0, 1, 2].map(i => <div key={i} className="skeleton h-8 w-full mb-3" />)}
                </div>
            </div>
        </div>
    </div>
);

const AdminDashboard = () => {
    const { isAdmin } = useAuth();
    const [orders, setOrders] = useState(null);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("paid");
    const [liveVisitors, setLiveVisitors] = useState(0);
    const alertedStatus = useRef(new Map());
    const alertsBooted = useRef(false);
    const revealScope = useStaggerReveal(".admin-reveal", { enabled: !loading });

    function triggerSaleAlert(order, kind) {
        try { const audio = new Audio('/sounds/cha-ching.mp3'); audio.play().catch(() => console.log('Audio blocked')); } catch {/* autoplay may be blocked */}
        const customer = order.customer?.firstName || order.customer?.email || "a customer";
        const amount = `₦${(order.total || 0).toLocaleString()}`;
        if (kind === 'paid') {
            if ('Notification' in window && Notification.permission === 'granted') new Notification('NYNTH Sale confirmed!', { body: `${amount} from ${customer}`, icon: '/favicon.png' });
            toast.success(`Paid: ${amount} from ${customer}`, { duration: 6000, position: 'top-right' });
        } else if (kind === 'confirmed') {
            if ('Notification' in window && Notification.permission === 'granted') new Notification('NYNTH Payment confirmed!', { body: `${amount} from ${customer} is now paid`, icon: '/favicon.png' });
            toast.success(`Payment confirmed: ${amount} from ${customer}`, { duration: 6000, position: 'top-right' });
        } else {
            if ('Notification' in window && Notification.permission === 'granted') new Notification('NYNTH New order!', { body: `${amount} from ${customer} - pending payment`, icon: '/favicon.png' });
            toast(`New order: ${amount} from ${customer} (awaiting payment)`, { duration: 6000, position: 'top-right', icon: '🧾' });
        }
    }

    useEffect(() => {
        const unsubscribe = subscribePresence(setLiveVisitors);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        getAllOrders().then(data => { setOrders(data.filter(o => !o.isTest)); setLoading(false); }).catch(() => setLoading(false));
        const unsubscribe = subscribeOrders((liveOrders) => {
            liveOrders = liveOrders.filter(o => !o.isTest);
            setOrders(liveOrders);
            setLoading(false);
            if (!alertsBooted.current) {
                liveOrders.forEach((o) => {
                    if (o.created_at?.seconds) {
                        const ageMs = Date.now() - o.created_at.seconds * 1000;
                        if (ageMs < 5 * 60 * 1000) alertedStatus.current.set(o.id, o.payment_status || "pending");
                    }
                });
                alertsBooted.current = true;
                return;
            }
            liveOrders.forEach((order) => {
                const orderId = order.id;
                const status = order.payment_status || "pending";
                const prev = alertedStatus.current.get(orderId);
                const createdRecently = order.created_at?.seconds ? (Date.now() - order.created_at.seconds * 1000) < 10 * 60 * 1000 : false;
                if (!prev && createdRecently) {
                    alertedStatus.current.set(orderId, status);
                    if (isPaid(order)) triggerSaleAlert(order, "paid"); else triggerSaleAlert(order, "pending");
                    return;
                }
                if (prev && prev !== status && isPaid(order)) {
                    alertedStatus.current.set(orderId, status);
                    triggerSaleAlert(order, "confirmed");
                }
            });
        });
        return () => unsubscribe();
    }, []);

    const dashboardData = useMemo(() => {
        if (!orders) return null;
        const currentBounds = getDateBoundaries(globalFilter, false);
        const prevBounds = getDateBoundaries(globalFilter, true);
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
        const prevPaid = prevOrders.filter(isPaid);
        const currentPending = currentOrders.filter(o => !isPaid(o));
        const prevPending = prevOrders.filter(o => !isPaid(o));
        const totalSales = currentPaid.reduce((s, o) => s + (o.total || 0), 0);
        const prevSales = prevPaid.reduce((s, o) => s + (o.total || 0), 0);
        const pendingValue = currentPending.reduce((s, o) => s + (o.total || 0), 0);
        const prevPendingValue = prevPending.reduce((s, o) => s + (o.total || 0), 0);
        const paidCount = currentPaid.length;
        const prevPaidCount = prevPaid.length;
        const pendingCount = currentPending.length;
        const deliveredCount = currentPaid.filter(o => o.order_status === 'delivered').length;
        const prevDeliveredCount = prevPaid.filter(o => o.order_status === 'delivered').length;
        const productMap = {};
        currentPaid.forEach(o => {
            o.items?.forEach(item => {
                if (!productMap[item.id]) productMap[item.id] = { title: item.title || item.name || 'Item', quantity: 0, revenue: 0, image: item.image || item.thumbnail };
                productMap[item.id].quantity += (item.quantity || 1);
                productMap[item.id].revenue += ((item.price || 0) * (item.quantity || 1));
            });
        });
        const topProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
        const statusBreakdown = currentPaid.reduce((acc, o) => {
            const status = o.order_status || 'processing';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const sorted = [...currentOrders].sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));
        const recentList = sorted.filter(o => {
            if (paymentFilter === 'all') return true;
            if (paymentFilter === 'pending') return !isPaid(o);
            if (paymentFilter === 'paid') return isPaid(o);
            if (paymentFilter === 'delivered') return o.order_status === 'delivered';
            return true;
        }).slice(0, 6);
         return { totalSales, salesGrowth: calculateGrowth(totalSales, prevSales), pendingValue, pendingGrowth: calculateGrowth(pendingValue, prevPendingValue), ordersCount: paidCount, ordersGrowth: calculateGrowth(paidCount, prevPaidCount), paidCount, pendingCount, deliveredCount, deliveredGrowth: calculateGrowth(deliveredCount, prevDeliveredCount), topProducts, statusBreakdown, recentList };
    }, [orders, globalFilter, paymentFilter]);

    const statusLabels = Object.keys(dashboardData?.statusBreakdown || {}).map(s => STATUS_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1));
    const statusChartData = {
        labels: statusLabels.length ? statusLabels : ['No data'],
        datasets: [{
            data: statusLabels.length ? Object.keys(dashboardData.statusBreakdown).map(s => dashboardData.statusBreakdown[s]) : [1],
            backgroundColor: statusLabels.length ? Object.keys(dashboardData.statusBreakdown).map(s => ADMIN_STATUS_COLORS[s] || '#9ca3af') : ['#e5e7eb'],
            borderWidth: 0, borderColor: 'transparent', borderRadius: 6, spacing: 2, hoverOffset: 4,
        }],
    };
    const donutOpts = { ...doughnutOptions, cutout: '72%' };

    const PAYMENT_PILLS = { pending: "bg-amber-500/[0.14] text-amber-300", paid: "bg-emerald-500/[0.14] text-emerald-300", success: "bg-emerald-500/[0.14] text-emerald-300", failed: "bg-rose-500/[0.14] text-rose-300", cancelled: "bg-slate-500/[0.18] text-slate-400", refunded: "bg-slate-500/[0.18] text-slate-400" };
    const PaymentPill = ({ status }) => {
        const normalized = isPaid({ payment_status: status }) ? 'paid' : (status || 'pending');
        return <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded border inline-block ${PAYMENT_PILLS[normalized] || PAYMENT_PILLS.pending}`}>{normalized === 'paid' ? 'Paid' : (status || 'pending')}</span>;
    };

    const salesRef = useCountUp(dashboardData?.totalSales || 0);

    const filterOptions = [
        { id: 'all', label: 'All', dot: 'bg-[#EDEAE2]' },
        { id: 'pending', label: 'Pending', dot: 'bg-amber-500' },
        { id: 'paid', label: 'Paid', dot: 'bg-emerald-500' },
        { id: 'delivered', label: 'Delivered', dot: 'bg-violet-500' },
    ];
    const periodLabel = globalFilter === 'today' ? 'Today' : globalFilter === 'yesterday' ? 'Yesterday' : globalFilter === '7d' ? 'Last 7 days' : globalFilter === '30d' ? 'Last 30 days' : 'All time';

    return (
        <AdminLayout>
            <AdminPWAPrompt />
            <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-[-0.02em] text-[#EDEAE2]">Overview</h1>
                        <Badge variant={isAdmin ? "success" : "warning"}>{isAdmin ? "Verified Admin" : "Standard Role"}</Badge>
                    </div>
                    <p className="text-sm text-[#EDEAE2]/55">{periodLabel}. Real-time performance and the paid ledger.</p>
                </div>
                <select value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="admin-control pl-3 pr-8 cursor-pointer">
                    <option value="today">Today</option><option value="yesterday">Yesterday</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="all">All time</option>
                </select>
            </header>

            {/* Commander: segmented filter + live chip */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <SegmentedFilter options={filterOptions} value={paymentFilter} onChange={setPaymentFilter} />
                <span className="inline-flex items-center gap-1.5 text-[10px] text-[#EDEAE2]/45 ml-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{liveVisitors} live
                </span>
            </div>

            {loading || !dashboardData ? <DashboardSkeleton /> : (
                <div ref={revealScope} className="space-y-5 md:space-y-6">
                    {/* Lead metric — editorial block */}
                    <section className="border border-white/10 bg-[#0a0a0a] rounded-2xl p-6 md:p-8">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#EDEAE2]/45 mb-1">Net sales</p>
                                <div className="flex items-end gap-3">
                                    <span className="text-[56px] leading-none font-extrabold tracking-[-0.03em] tabular-nums text-[#EDEAE2]">
                                        <span className="text-xl text-[#EDEAE2]/55 font-semibold">₦</span>
                                        <span ref={salesRef}>0</span>
                                    </span>
                                    <GrowthBadge value={dashboardData.salesGrowth} />
                                </div>
                                <p className="text-sm text-[#EDEAE2]/55 mt-2">Paid orders this period</p>
                            </div>
                            <div className="flex gap-10 md:gap-14 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-white/10 md:ml-10">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#EDEAE2]/45 mb-1">Orders</p>
                                    <p className="text-3xl font-extrabold tabular-nums text-[#EDEAE2]">{dashboardData.paidCount}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#EDEAE2]/45 mb-1">Delivered</p>
                                    <p className="text-3xl font-extrabold tabular-nums text-[#EDEAE2]">{dashboardData.deliveredCount}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300/45 mb-1">Awaiting</p>
                                    <p className="text-3xl font-extrabold tabular-nums text-amber-300">{dashboardData.pendingCount}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Dense editorial row */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
                        {/* Recent orders — 7 cols */}
                        <div className="lg:col-span-7 border border-white/10 bg-[#0a0a0a] rounded-2xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#EDEAE2]/60">Recent orders</h2>
                                <Link to="/admin/orders" className="text-[10px] font-bold uppercase tracking-wider text-[#EDEAE2]/55 hover:text-[#EDEAE2]">View all</Link>
                            </div>
                            <div className="divide-y divide-white/[0.06]">
                                {dashboardData.recentList.length === 0 && <div className="px-5 py-10 text-center text-sm text-[#EDEAE2]/55">No recent orders.</div>}
                                {dashboardData.recentList.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.03] transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[#EDEAE2]">#{order.id.slice(0, 8).toUpperCase()}</p>
                                            <p className="text-xs text-[#EDEAE2]/55 truncate mt-0.5">{order.customer?.firstName} {order.customer?.lastName}</p>
                                        </div>
                                        <div className="text-right shrink-0 ml-4">
                                            <p className="text-sm font-semibold text-[#EDEAE2]">₦{order.total?.toLocaleString()}</p>
                                            <PaymentPill status={order.payment_status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right column */}
                        <div className="lg:col-span-5 flex flex-col gap-4 md:gap-5">
                            <div className="border border-white/10 bg-[#0a0a0a] rounded-2xl p-5">
                                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#EDEAE2]/60 mb-3">Fulfillment</h2>
                                {Object.values(dashboardData.statusBreakdown).reduce((a, b) => a + b, 0) === 0 ? (
                                    <div className="text-center text-sm text-[#EDEAE2]/55 py-8">No data for this period.</div>
                                ) : (
                                    <div className="h-52 w-full chart-wrap flex justify-center">
                                        <Doughnut data={statusChartData} options={donutOpts} />
                                        <div className="chart-donut-center">
                                            <span className="text-[10px] text-[#EDEAE2]/42 font-medium tracking-[0.2em] uppercase">All</span>
                                            <span className="text-2xl font-bold text-[#EDEAE2] leading-none mt-1">{dashboardData.ordersCount}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="border border-white/10 bg-[#0a0a0a] rounded-2xl p-5">
                                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#EDEAE2]/60 mb-3">Top products</h2>
                                {dashboardData.topProducts.length === 0 ? (
                                    <div className="text-center text-sm text-[#EDEAE2]/55 py-8">No product sales in this period.</div>
                                ) : (
                                    <div className="divide-y divide-white/[0.06]">
                                        {dashboardData.topProducts.map((prod, i) => (
                                            <div key={i} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-[10px] font-bold text-[#EDEAE2]/35 w-4 shrink-0">{i + 1}</span>
                                                    <div className="w-8 h-8 rounded border border-white/10 overflow-hidden bg-[#0a0a0a] shrink-0">
                                                        <img src={prod.image || "/placeholder.jpg"} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                    <p className="text-sm font-medium text-[#EDEAE2] line-clamp-1">{prod.title}</p>
                                                </div>
                                                <div className="text-right shrink-0 ml-4">
                                                    <p className="text-sm font-bold text-[#EDEAE2]">{prod.quantity}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminDashboard;