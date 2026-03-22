import { useState, useEffect, useMemo } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAdminAnalytics, fetchSettings } from "../../api/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../../api/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
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

const AdminDashboard = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState("7d");
    
    const [liveVisitors, setLiveVisitors] = useState(0);
    const [seenOrderIds, setSeenOrderIds] = useState(new Set());
    const [sessionStartTime] = useState(Date.now());

    // --- FETCH DATA ---
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [analyticsData] = await Promise.all([
                getAdminAnalytics(),
                fetchSettings() // Just caching basically
            ]);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = "Nynth World Store Admin";
        fetchDashboardData();
    }, []);

    // --- LIVE VISITORS ---
    useEffect(() => {
        const TWO_MINUTES = 2 * 60 * 1000;
        const presenceRef = collection(db, 'presence');

        const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
            const now = Date.now();
            let active = 0;
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const lastSeen = data.last_seen?.toMillis?.() || 0;
                if ((now - lastSeen) < TWO_MINUTES) active++;
            });
            setLiveVisitors(active);
        });
        return () => unsubscribe();
    }, []);

    // --- REALTIME ORDERS NOTIFICATIONS ---
    useEffect(() => {
        if (loading) return;

        const q = query(collection(db, "orders"), orderBy("created_at", "desc"), limit(10));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const orderId = change.doc.id;
                    const order = change.doc.data();
                    const orderTime = order.created_at?.seconds ? order.created_at.seconds * 1000 : Date.now();

                    if (!seenOrderIds.has(orderId) && orderTime > (sessionStartTime - 5000)) {
                        setSeenOrderIds(prev => new Set([...prev, orderId]));
                        triggerSaleAlert(order);
                        fetchDashboardData();
                    } else if (!seenOrderIds.has(orderId)) {
                        setSeenOrderIds(prev => new Set([...prev, orderId]));
                    }
                }
            });
        });
        return () => unsubscribe();
    }, [loading, seenOrderIds, sessionStartTime]);

    const triggerSaleAlert = (order = null) => {
        try {
            const audio = new Audio('/sounds/cha-ching.mp3');
            audio.play().catch(e => console.log('Audio playback blocked', e));
        } catch (err) {}

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('NYNTH 💰 New Order!', {
                body: order ? `₦${order.total?.toLocaleString()} from ${order.customer?.firstName}` : "Test alert!",
                icon: '/favicon.png'
            });
        }

        toast.success(
            order ? `🛍️ New order: ₦${order.total?.toLocaleString()} from ${order.customer?.firstName}` : "🔔 Sales alerts are active!",
            { duration: 5000, position: 'top-right', icon: '💰' }
        );
    };

    // --- DATA CALCULATIONS ---
    const dashboardData = useMemo(() => {
        if (!analytics?.rawOrders) return null;

        const currentBounds = getDateBoundaries(globalFilter, false);
        const prevBounds = getDateBoundaries(globalFilter, true);

        const currentOrders = analytics.rawOrders.filter(o => {
            if (!o.created_at?.seconds) return false;
            const d = new Date(o.created_at.seconds * 1000);
            return d >= currentBounds.start && d <= currentBounds.end;
        });

        const prevOrders = analytics.rawOrders.filter(o => {
            if (!o.created_at?.seconds) return false;
            const d = new Date(o.created_at.seconds * 1000);
            return d >= prevBounds.start && d <= prevBounds.end;
        });

        // Metrics
        const sales = currentOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        const prevSales = prevOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        
        const currentPaid = currentOrders.filter(o => o.payment_status === 'paid' || o.payment_status === 'success');
        const prevPaid = prevOrders.filter(o => o.payment_status === 'paid' || o.payment_status === 'success');
        const revenue = currentPaid.reduce((sum, o) => sum + (o.total || 0), 0);
        const prevRevenue = prevPaid.reduce((sum, o) => sum + (o.total || 0), 0);

        const ordersCount = currentOrders.length;
        const prevOrdersCount = prevOrders.length;
        
        const pendingCount = currentOrders.filter(o => o.order_status !== 'delivered').length;

        // Top Products Calculation
        const productMap = {};
        currentOrders.forEach(o => {
            if (o.payment_status === 'paid' || o.payment_status === 'success') {
                o.items?.forEach(item => {
                    if (!productMap[item.id]) {
                        productMap[item.id] = { title: item.title, quantity: 0, revenue: 0, image: item.image || item.thumbnail };
                    }
                    productMap[item.id].quantity += (item.quantity || 1);
                    productMap[item.id].revenue += ((item.price || 0) * (item.quantity || 1));
                });
            }
        });
        const topProducts = Object.values(productMap).sort((a,b) => b.quantity - a.quantity).slice(0, 5);

        // Sparklines
        const sparkDays = currentBounds.days > 30 ? 30 : currentBounds.days; // Cap sparklines to 30p for rendering
        const salesSpark = generateSparklineData(currentOrders, currentBounds.start, sparkDays, 'sales');
        const revSpark = generateSparklineData(currentOrders, currentBounds.start, sparkDays, 'revenue');
        const ordersSpark = generateSparklineData(currentOrders, currentBounds.start, sparkDays, 'count');

        // Status Breakdown for Doughnut
        const statusBreakdown = currentOrders.reduce((acc, o) => {
            const status = o.order_status || 'pending';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        return {
            sales, salesGrowth: calculateGrowth(sales, prevSales),
            revenue, revGrowth: calculateGrowth(revenue, prevRevenue),
            ordersCount, ordersGrowth: calculateGrowth(ordersCount, prevOrdersCount),
            pendingCount,
            topProducts,
            salesSpark, revSpark, ordersSpark,
            statusBreakdown,
            recentList: currentOrders.slice(0, 6)
        };
    }, [analytics, globalFilter]);

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

    const statusChartData = {
        labels: ['Pending', 'Packaging', 'Shipped', 'Delivered'],
        datasets: [{
            data: [
                dashboardData?.statusBreakdown?.pending || 0,
                dashboardData?.statusBreakdown?.packaging || 0,
                dashboardData?.statusBreakdown?.shipped || 0,
                dashboardData?.statusBreakdown?.delivered || 0,
            ],
            backgroundColor: ['#fbbf24', '#3b82f6', '#8b5cf6', '#10b981'],
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

    return (
        <AdminLayout>
            <AdminPWAPrompt />
            
            {/* Header & Global Filter */}
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-1 text-gray-900">Overview dashboard</h1>
                    <p className="text-sm text-gray-500">View and analyze your store's performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="bg-white border border-gray-200 text-sm font-medium text-gray-700 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 cursor-pointer"
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
                    {/* Top Stats Grid (Shopify Style) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
                        
                        {/* 1. Total Sales (Gross) */}
                        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <p className="text-sm font-medium text-gray-600 mb-1">Total sales</p>
                                <div className="flex items-end justify-between mb-4">
                                    <h3 className="text-2xl font-bold text-gray-900">₦{dashboardData.sales.toLocaleString()}</h3>
                                    <GrowthBadge value={dashboardData.salesGrowth} />
                                </div>
                                <div className="h-14 w-full mt-3">
                                    {dashboardData.salesSpark.dataPoints.length > 0 ? (
                                        <Line data={getSparklineConfig(dashboardData.salesSpark.dataPoints, '#8b5cf6')} options={sparkChartOptions} />
                                    ) : (
                                        <div className="text-[10px] text-gray-300 flex items-end h-full">No trend data for this period</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Total Revenue (Net/Paid) */}
                        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <p className="text-sm font-medium text-gray-600 mb-1">Total revenue (Paid)</p>
                                <div className="flex items-end justify-between mb-4">
                                    <h3 className="text-2xl font-bold text-gray-900">₦{dashboardData.revenue.toLocaleString()}</h3>
                                    <GrowthBadge value={dashboardData.revGrowth} />
                                </div>
                                <div className="h-14 w-full mt-3">
                                    {dashboardData.revSpark.dataPoints.length > 0 ? (
                                        <Line data={getSparklineConfig(dashboardData.revSpark.dataPoints, '#10b981')} options={sparkChartOptions} />
                                    ) : (
                                        <div className="text-[10px] text-gray-300 flex items-end h-full">No trend data for this period</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Total Orders */}
                        <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                <p className="text-sm font-medium text-gray-600 mb-1">Total orders</p>
                                <div className="flex items-end justify-between mb-4">
                                    <h3 className="text-2xl font-bold text-gray-900">{dashboardData.ordersCount.toLocaleString()}</h3>
                                    <GrowthBadge value={dashboardData.ordersGrowth} />
                                </div>
                                <div className="h-14 w-full mt-3">
                                    {dashboardData.ordersSpark.dataPoints.length > 0 ? (
                                        <Line data={getSparklineConfig(dashboardData.ordersSpark.dataPoints, '#3b82f6')} options={sparkChartOptions} />
                                    ) : (
                                        <div className="text-[10px] text-gray-300 flex items-end h-full">No trend data for this period</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* 4. Live Visitors / Pending Orders combo */}
                        <div className="flex flex-col gap-4 md:gap-5">
                            <Card className="bg-white border-gray-200 shadow-sm flex-1 flex flex-col justify-center">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                            Online store visitors
                                            <span className="relative flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                        </p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{liveVisitors}</h3>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-full border border-gray-100">
                                        <BellRing size={20} className="text-gray-400" />
                                    </div>
                                </CardContent>
                            </Card>
                            
                            <Card className="bg-white border-gray-200 shadow-sm flex-1 flex flex-col justify-center">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Pending orders</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{dashboardData.pendingCount}</h3>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-full border border-amber-100">
                                        <Truck size={20} className="text-amber-500" />
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
                            <CardHeader className="border-b border-gray-50 pb-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-base font-semibold text-gray-900">Recent orders</CardTitle>
                                <Link to="/admin/orders" className="text-xs font-semibold text-blue-600 hover:underline">View all</Link>
                            </CardHeader>
                            <CardContent className="p-0">
                                {dashboardData.recentList.length === 0 ? (
                                    <div className="p-8 text-center text-sm text-gray-500">No recent orders.</div>
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
                                                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 px-2 py-0.5 rounded-sm inline-block ${
                                                        order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                        {order.payment_status}
                                                    </p>
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
