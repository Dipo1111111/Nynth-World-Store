import { useState, useEffect, useMemo, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { subscribeOrders, subscribePresence, getAllOrders } from "../../api/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { 
 Package, 
 TrendingUp, 
 CreditCard, 
 Truck, 
 BellRing, 
 ArrowUpRight, 
 ArrowDownRight 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import AdminPWAPrompt from "../../components/admin/AdminPWAPrompt";
import { Line, Doughnut } from 'react-chartjs-2';
import { 
 Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, 
 Title, Tooltip, Legend, ArcElement, Filler 
} from 'chart.js';
import toast from "react-hot-toast";

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

const STATUS_COLORS = {
 processing: '#fbbf24',
 pending: '#facc15',
 confirmed: '#0ea5e9',
 packaging: '#3b82f6',
 shipped: '#8b5cf6',
 delivered: '#10b981',
 failed: '#f43f5e',
 cancelled: '#6b7280',
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

const AdminDashboard = () => {
 const { currentUser, logout, isAdmin } = useAuth();
 const navigate = useNavigate();
 
 const [orders, setOrders] = useState(null);
 const [loading, setLoading] = useState(true);
 const [globalFilter, setGlobalFilter] = useState("all");
 const [paymentFilter, setPaymentFilter] = useState("paid");
 
 const [liveVisitors, setLiveVisitors] = useState(0);
 const alertedStatus = useRef(new Map());
 const alertsBooted = useRef(false);

 // --- LIVE VISITORS ---
 useEffect(() => {
 const unsubscribe = subscribePresence(setLiveVisitors);
 return () => unsubscribe();
 }, []);

 // --- REALTIME ORDERS (single source of truth) ---
 useEffect(() => {
 getAllOrders().then(data => { setOrders(data); setLoading(false); }).catch(() => setLoading(false));
 const unsubscribe = subscribeOrders((liveOrders) => {
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

 const triggerSaleAlert = (order, kind) => {
 try {
 const audio = new Audio('/sounds/cha-ching.mp3');
 audio.play().catch(e => console.log('Audio playback blocked', e));
 } catch (err) {}

 const customer = order.customer?.firstName || order.customer?.email || "a customer";
 const amount = `₦${(order.total || 0).toLocaleString()}`;

 if (kind === 'paid') {
 if ('Notification' in window && Notification.permission === 'granted') {
 new Notification('NYNTH 💰 Sale confirmed!', {
 body: `${amount} collected from ${customer}`,
 icon: '/favicon.png'
 });
 }
 toast.success(`💰 Paid: ${amount} from ${customer}`, { duration: 6000, position: 'top-right' });
 } else if (kind === 'confirmed') {
 if ('Notification' in window && Notification.permission === 'granted') {
 new Notification('NYNTH ✅ Payment confirmed!', {
 body: `${amount} from ${customer} is now paid`,
 icon: '/favicon.png'
 });
 }
 toast.success(`✅ Payment confirmed: ${amount} from ${customer}`, { duration: 6000, position: 'top-right' });
 } else {
 if ('Notification' in window && Notification.permission === 'granted') {
 new Notification('NYNTH 🛍️ New order!', {
 body: `${amount} from ${customer} - pending payment`,
 icon: '/favicon.png'
 });
 }
 toast("🛍️ New order: " + amount + " from " + customer + " (awaiting payment)", { duration: 6000, position: 'top-right', icon: '🧾' });
 }
 };

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
 const topProducts = Object.values(productMap).sort((a,b) => b.quantity - a.quantity).slice(0, 5);

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

 const getSparklineConfig = (dataPoints, color) => ({
 labels: dataPoints.map((_, i) => i.toString()),
 datasets: [{
 data: dataPoints,
 borderColor: color,
 backgroundColor: (context) => {
 const ctx = context.chart.ctx;
 const gradient = ctx.createLinearGradient(0, 0, 0, 50); // height approx
 gradient.addColorStop(0, `${color}40`); // slight visible top (25% opacity)
 gradient.addColorStop(1, `${color}00`); // fade to transparent bottom
 return gradient;
 },
 tension: 0.35,
 fill: true,
 borderWidth: 1.5,
 pointRadius: 0,
 pointHoverRadius: 0,
 }]
 });

 const sparkChartOptions = {
 responsive: true,
 maintainAspectRatio: false,
 plugins: { legend: { display: false }, tooltip: { enabled: false } },
 scales: { 
 x: { display: false }, 
 y: { display: false, min: 0 } 
 },
 layout: { padding: { top: 5, bottom: 0, left: -5, right: -5 } },
 };

 const statusLabels = Object.keys(dashboardData?.statusBreakdown || {}).map(s => STATUS_LABELS[s] || s.charAt(0).toUpperCase() + s.slice(1));
 const statusChartData = {
 labels: statusLabels.length ? statusLabels : ['No data'],
 datasets: [{
 data: statusLabels.length
 ? Object.keys(dashboardData.statusBreakdown).map(s => dashboardData.statusBreakdown[s])
 : [1],
 backgroundColor: statusLabels.length
 ? Object.keys(dashboardData.statusBreakdown).map(s => STATUS_COLORS[s] || '#9ca3af')
 : ['#e5e7eb'],
 borderWidth: 2,
 borderColor: '#ffffff',
 hoverOffset: 4,
 }],
 };

 const doughnutOptions = {
 responsive: true,
 maintainAspectRatio: false,
 cutout: '75%',
 plugins: {
 legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 11, family: 'Inter' } } },
 tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, displayColors: false }
 },
 };

 // --- TREND RENDERER ---
 const GrowthBadge = ({ value }) => {
 const isUp = value >= 0;
 const colorClass = isUp ? "text-emerald-600" : "text-rose-600";
 const Icon = isUp ? ArrowUpRight : ArrowDownRight;
 return (
 <span className={`flex items-center text-xs font-semibold ${colorClass}`}>
 <Icon size={14} className="mr-0.5" />
 {Math.abs(value).toFixed(1)}%
 </span>
 );
 };

const PAYMENT_PILLS = {
 pending: "bg-gray-50 text-gray-600",
 paid: "bg-gray-50 text-green-500",
 success: "bg-gray-50 text-green-500",
 failed: "bg-gray-50 text-red-500",
 cancelled: "bg-gray-50 text-gray-400",
 refunded: "bg-gray-50 text-gray-400",
};

const PaymentPill = ({ status }) => {
 const normalized = isPaid({ payment_status: status }) ? 'paid' : (status || 'pending');
 return (
 <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 border border-gray-200 inline-block ${PAYMENT_PILLS[normalized] || PAYMENT_PILLS.pending}`}>
 {normalized === 'paid' ? 'Paid' : (status || 'pending')}
 </span>
 );
};

 const FilterChips = ({ value, onChange }) => {
 const options = [
 { id: 'all', label: 'All orders' },
 { id: 'pending', label: '⏳ Pending' },
 { id: 'paid', label: '✅ Paid' },
 { id: 'delivered', label: '📦 Delivered' },
 ];
 return (
 <div className="flex flex-wrap items-center gap-1.5">
 {options.map(option => (
 <button
 key={option.id}
 onClick={() => onChange(option.id)}
 className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
 value === option.id
 ? 'bg-black text-white border-black'
 : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
 }`}
 >
 {option.label}
 </button>
 ))}
 </div>
 );
 };

 return (
 <AdminLayout>
 <AdminPWAPrompt />
 
 {/* Header & Global Filter */}
 <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <h1 className="text-2xl font-bold text-gray-900">Overview dashboard</h1>
 {isAdmin ? (
 <span className="bg-gray-50 text-green-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border border-emerald-100">
 Verified Admin
 </span>
 ) : (
 <span className="bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border border-amber-100">
 Standard Role
 </span>
 )}
 </div>
 <p className="text-sm text-gray-500">View and analyze your store's performance.</p>
 </div>
 <div className="flex items-center gap-3">
 <select
 value={globalFilter}
 onChange={(e) => setGlobalFilter(e.target.value)}
 className="bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 cursor-pointer"
 >
 <option value="today">Today</option>
 <option value="yesterday">Yesterday</option>
 <option value="7d">Last 7 days</option>
 <option value="30d">Last 30 days</option>
 <option value="all">All time</option>
 </select>
 </div>
 </header>

 {loading || !dashboardData ? (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
 </div>
 ) : (
 <>
 {/* Top Stats Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
 
 {/* 1. Total Sales - paid orders only (real money in) */}
 <Card className="bg-white border-gray-200 shadow-sm transition-shadow">
 <CardContent className="p-5">
 <p className="text-sm font-medium text-gray-600 mb-1">Total sales (paid)</p>
 <div className="flex items-end justify-between mb-4">
 <h3 className="text-2xl font-bold text-gray-900">₦{dashboardData.totalSales.toLocaleString()}</h3>
 <GrowthBadge value={dashboardData.salesGrowth} />
 </div>
 <div className="text-xs text-gray-400 font-medium mb-1">
 {dashboardData.paidCount} paid order{dashboardData.paidCount === 1 ? '' : 's'}
 </div>
 <div className="h-14 w-full mt-3">
 {dashboardData.salesSpark.dataPoints.length > 0 ? (
 <Line data={getSparklineConfig(dashboardData.salesSpark.dataPoints, '#10b981')} options={sparkChartOptions} />
 ) : (
 <div className="text-[10px] text-gray-300 flex items-end h-full">No trend data for this period</div>
 )}
 </div>
 </CardContent>
 </Card>

 {/* 2. Pending payment - surfaced for attention, NEVER added to sales */}
 <Card className="bg-white border-gray-200 border shadow-sm transition-shadow">
 <CardContent className="p-5">
 <p className="text-sm font-medium text-amber-700 mb-1 flex items-center gap-1.5">
 <BellRing size={13} /> Pending payment
 </p>
 <div className="flex items-end justify-between mb-4">
 <h3 className="text-2xl font-bold text-gray-900">₦{dashboardData.pendingValue.toLocaleString()}</h3>
 <GrowthBadge value={dashboardData.pendingGrowth} />
 </div>
 <div className="text-xs text-amber-600 font-medium mb-1">
 {dashboardData.pendingCount} order{dashboardData.pendingCount === 1 ? '' : 's'} awaiting payment
 </div>
 <div className="mt-3">
 <Button
 variant="outline"
 size="sm"
 onClick={() => navigate('/admin/orders')}
 className="w-full text-xs hover:border-amber-400"
 >
 Review pending orders →
 </Button>
 </div>
 </CardContent>
 </Card>

 {/* 3. Total orders (paid) */}
 <Card className="bg-white border-gray-200 shadow-sm flex flex-col justify-center">
 <CardContent className="p-4 flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-gray-600">Total orders (paid)</p>
 <h3 className="text-2xl font-bold text-gray-900 mt-1">{dashboardData.ordersCount.toLocaleString()}</h3>
 {dashboardData.ordersSpark.dataPoints.length > 0 && (
 <div className="h-8 w-28 mt-1">
 <Line data={getSparklineConfig(dashboardData.ordersSpark.dataPoints, '#8b5cf6')} options={sparkChartOptions} />
 </div>
 )}
 </div>
 <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
 <Package size={20} className="text-gray-400" />
 </div>
 </CardContent>
 </Card>

 {/* 4. Live visitors + Delivered */}
 <div className="flex flex-col gap-4 md:gap-5">
 <Card className="bg-white border-gray-200 shadow-sm flex-1 flex flex-col justify-center">
 <CardContent className="p-4 flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
 Online store visitors
 </p>
 <h3 className="text-2xl font-bold text-gray-900 mt-1">{liveVisitors}</h3>
 </div>
 <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
 <BellRing size={20} className="text-emerald-500" />
 </div>
 </CardContent>
 </Card>
 
 <Card className="bg-white border-gray-200 shadow-sm flex-1 flex flex-col justify-center">
 <CardContent className="p-4 flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-gray-600">Delivered</p>
 <h3 className="text-2xl font-bold text-gray-900 mt-1">{dashboardData.deliveredCount}</h3>
 </div>
 <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
 <Truck size={20} className="text-emerald-500" />
 </div>
 </CardContent>
 </Card>
 </div>
 </div>

 {/* Secondary Grid (Lists and Doughnut) */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-8">
 
 {/* Top Products */}
 <Card className="border-gray-200 shadow-sm lg:col-span-1">
 <CardHeader className="border-b border-gray-50 pb-4">
 <CardTitle className="text-base font-semibold text-gray-900">Top products by units sold</CardTitle>
 </CardHeader>
 <CardContent className="p-0">
 {dashboardData.topProducts.length === 0 ? (
 <div className="p-8 text-center text-sm text-gray-500">No product sales in this period.</div>
 ) : (
 <div className="divide-y divide-gray-100">
 {dashboardData.topProducts.map((prod, i) => (
 <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden bg-white shrink-0">
 <img src={prod.image || "/placeholder.jpg"} className="w-full h-full object-cover" alt="" />
 </div>
 <p className="text-sm font-medium text-gray-800 line-clamp-1">{prod.title}</p>
 </div>
 <div className="text-right ml-4 shrink-0">
 <p className="text-sm font-bold text-gray-900">{prod.quantity}</p>
 <p className="text-xs text-gray-500">₦{prod.revenue.toLocaleString()}</p>
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* Recent Orders List */}
 <Card className="border-gray-200 shadow-sm lg:col-span-1">
 <CardHeader className="border-b border-gray-50 pb-4 flex flex-col gap-3">
 <div className="flex flex-row items-center justify-between">
 <CardTitle className="text-base font-semibold text-gray-900">Recent orders</CardTitle>
 <Link to="/admin/orders" className="text-xs font-semibold text-blue-600 hover:underline">View all</Link>
 </div>
 <FilterChips value={paymentFilter} onChange={setPaymentFilter} />
 </CardHeader>
 <CardContent className="p-0">
 {dashboardData.recentList.length === 0 ? (
 <div className="p-8 text-center text-sm text-gray-500">
 {paymentFilter === 'all'
 ? 'No recent orders.'
 : `No ${paymentFilter} orders in this period.`}
 </div>
 ) : (
 <div className="divide-y divide-gray-100">
 {dashboardData.recentList.map((order) => (
 <div key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
 <div className="min-w-0">
 <p className="text-sm font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
 <p className="text-xs text-gray-500 truncate mt-0.5">
 {order.customer?.firstName} {order.customer?.lastName}
 </p>
 </div>
 <div className="text-right shrink-0">
 <p className="text-sm font-semibold text-gray-900">₦{order.total?.toLocaleString()}</p>
 <PaymentPill status={order.payment_status} />
 </div>
 </div>
 ))}
 </div>
 )}
 </CardContent>
 </Card>

 {/* Order Status Doughnut */}
 <Card className="border-gray-200 shadow-sm lg:col-span-1">
 <CardHeader className="border-b border-gray-50 pb-4">
 <CardTitle className="text-base font-semibold text-gray-900">Fulfillment status</CardTitle>
 </CardHeader>
 <CardContent className="p-5 flex flex-col justify-center h-[calc(100%-65px)]">
 {Object.values(dashboardData.statusBreakdown).reduce((a,b)=>a+b, 0) === 0 ? (
 <div className="text-center text-sm text-gray-500 my-auto">No data for this period.</div>
 ) : (
 <div className="h-48 w-full relative">
 <Doughnut data={statusChartData} options={doughnutOptions} />
 <div className="absolute inset-0 pb-[30px] flex items-center justify-center pointer-events-none flex-col">
 <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase mt-2">All</span>
 <span className="text-2xl font-bold text-gray-900 leading-none mt-1">{dashboardData.ordersCount}</span>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 </div>
 </>
 )}
 </AdminLayout>
 );
};

export default AdminDashboard;