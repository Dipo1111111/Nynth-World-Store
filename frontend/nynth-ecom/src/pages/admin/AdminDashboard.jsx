import { useState, useEffect, useMemo } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAdminAnalytics, getAllOrders } from "../../api/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../../api/firebase";
import { collection, query, orderBy, limit, onSnapshot, getDocs, deleteDoc, doc } from "firebase/firestore";
import {
    LayoutDashboard,
    Package,
    LogOut,
    TrendingUp,
    CreditCard,
    Truck,
    CheckCircle2,
    Menu,
    X,
    BellRing,
    ShoppingBag
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import Logo from "../../components/common/Logo";
import AdminPWAPrompt from "../../components/admin/AdminPWAPrompt";
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import toast from "react-hot-toast";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

const AdminDashboard = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [seenOrderIds, setSeenOrderIds] = useState(new Set());
    const [sessionStartTime] = useState(Date.now());
    const [liveVisitors, setLiveVisitors] = useState(0);

    useEffect(() => {
        document.title = "Nynth World Store Admin";
        fetchDashboardData();
    }, []);

    // Real-time live visitors from Firestore presence collection
    useEffect(() => {
        const TWO_MINUTES = 2 * 60 * 1000;
        const presenceRef = collection(db, 'presence');

        const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
            const now = Date.now();
            let active = 0;
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const lastSeen = data.last_seen?.toMillis?.() || 0;
                // Count sessions active within last 2 minutes
                if ((now - lastSeen) < TWO_MINUTES) {
                    active++;
                }
            });
            setLiveVisitors(active);
        });

        return () => unsubscribe();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [analyticsData, orders] = await Promise.all([
                getAdminAnalytics(),
                getAllOrders()
            ]);

            console.log('Dashboard - Analytics:', analyticsData);
            setAnalytics(analyticsData);
            setRecentOrders(orders.slice(0, 5));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // Real-time order notifications
    useEffect(() => {
        if (loading) return;

        const q = query(
            collection(db, "orders"),
            orderBy("created_at", "desc"),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const orderId = change.doc.id;
                    const order = change.doc.data();
                    const orderTime = order.created_at?.seconds ? order.created_at.seconds * 1000 : Date.now();

                    // Only notify if:
                    // 1. We haven't seen this ID in this session
                    // 2. The order was created AFTER the dashboard was opened (with a small buffer)
                    if (!seenOrderIds.has(orderId) && orderTime > (sessionStartTime - 5000)) {
                        // Mark as seen immediately
                        setSeenOrderIds(prev => new Set([...prev, orderId]));

                        // 🔔 Cha-Ching logic in separate function for reuse
                        triggerSaleAlert(order);

                        // Refresh analytics
                        fetchDashboardData();
                    } else if (!seenOrderIds.has(orderId)) {
                        // Just mark as seen without alert
                        setSeenOrderIds(prev => new Set([...prev, orderId]));
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [loading, seenOrderIds, sessionStartTime]);

    const triggerSaleAlert = (order = null) => {
        // 🔔 Cha-Ching logic
        try {
            const audio = new Audio('/sounds/cha-ching.mp3');
            audio.play().catch(e => console.log('Audio playback blocked - interaction required', e));
        } catch (err) {
            console.error('Audio error:', err);
        }

        // 📱 System Notification
        if (Notification.permission === 'granted') {
            new Notification('NYNTH 💰 New Order!', {
                body: order
                    ? `₦${order.total?.toLocaleString()} from ${order.customer?.firstName || 'Customer'}`
                    : "Test alert working correctly!",
                icon: '/favicon.png'
            });
        }

        // Show toast notification
        toast.success(
            order
                ? `🛍️ New order: ₦${order.total?.toLocaleString()} from ${order.customer?.firstName || 'Customer'}`
                : "🔔 Sales alerts are active!",
            {
                duration: 5000,
                position: 'top-right',
                icon: '💰'
            }
        );
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Prepare chart data
    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    };

    const revenueChartData = useMemo(() => ({
        labels: getLast7Days().map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Revenue',
                data: getLast7Days().map(date => analytics?.revenueByDate?.[date] || 0),
                borderColor: '#000000',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                tension: 0.4,
                fill: true,
                borderWidth: 3,
                pointRadius: 4,
                pointBackgroundColor: '#000000',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointHoverRadius: 6,
            },
        ],
    }), [analytics]);

    const statusChartData = useMemo(() => ({
        labels: ['Pending', 'Packaging', 'Shipped', 'Delivered'],
        datasets: [
            {
                data: [
                    analytics?.statusBreakdown?.pending || 0,
                    analytics?.statusBreakdown?.packaging || 0,
                    analytics?.statusBreakdown?.shipped || 0,
                    analytics?.statusBreakdown?.delivered || 0,
                ],
                backgroundColor: [
                    '#fbbf24', // amber-400
                    '#3b82f6', // blue-500
                    '#8b5cf6', // violet-500
                    '#10b981', // emerald-500
                ],
                hoverOffset: 4,
                borderWidth: 0,
            },
        ],
    }), [analytics]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 14, family: 'Inter' },
                bodyFont: { size: 13, family: 'Inter' },
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return '₦' + context.parsed.y.toLocaleString();
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    font: { size: 10 },
                    color: '#94a3b8'
                }
            },
            y: {
                beginAtZero: true,
                border: { dash: [4, 4], display: false },
                grid: {
                    color: '#f1f5f9',
                },
                ticks: {
                    font: { size: 10 },
                    color: '#94a3b8',
                    callback: function (value) {
                        if (value >= 1000) return '₦' + (value / 1000) + 'k';
                        return '₦' + value;
                    }
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 11, family: 'Inter' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                displayColors: true,
                boxPadding: 6
            }
        },
    };

    return (
        <AdminLayout>
            <AdminPWAPrompt />
            {/* Main Content */}
            <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-4xl font-space font-bold mb-2 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 text-sm md:text-base">Welcome! You're currently monitoring live sales.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerSaleAlert()}
                        className="text-[10px] tracking-widest font-bold uppercase border-black/10 hover:bg-black hover:text-white transition-all flex items-center gap-2"
                    >
                        <BellRing size={14} />
                        Test Alerts
                    </Button>
                </div>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading analytics...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
                        {[
                            { title: "Total Revenue", value: `₦${analytics?.totalRevenue?.toLocaleString() || 0}`, icon: TrendingUp, desc: "From paid orders", color: "text-emerald-500", bg: "bg-emerald-50" },
                            { title: "Total Orders", value: analytics?.totalOrders || 0, icon: Package, desc: "All time", color: "text-blue-500", bg: "bg-blue-50" },
                            { title: "Pending Orders", value: analytics?.pendingOrders || 0, icon: Truck, desc: "Awaiting fulfillment", color: "text-amber-500", bg: "bg-amber-50" },
                            { title: "Live Visitors", value: liveVisitors, icon: BellRing, desc: "Active right now", color: "text-rose-500", bg: "bg-rose-50" },
                        ].map((stat, i) => (
                            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all duration-300 group cursor-default overflow-hidden relative">
                                <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${stat.color}`}>
                                    <stat.icon size={80} strokeWidth={1} />
                                </div>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-[10px] tracking-[0.1em] font-bold uppercase text-gray-400">{stat.title}</CardTitle>
                                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold font-space tracking-tight">{stat.value}</div>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">{stat.desc}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Secondary Stats (Visits/Clicks) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                        <Card className="border-none shadow-sm bg-black text-white p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] tracking-[0.2em] font-bold uppercase text-gray-400 mb-1">Total Store Visits</p>
                                <h3 className="text-4xl font-bold font-space">{analytics?.visits?.toLocaleString() || 0}</h3>
                            </div>
                            <div className="p-4 bg-white/10 rounded-full">
                                <TrendingUp className="h-8 w-8 text-white" />
                            </div>
                        </Card>
                        <Card className="border-none shadow-sm bg-white border border-black/5 p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] tracking-[0.2em] font-bold uppercase text-gray-400 mb-1">Product Interactions</p>
                                <h3 className="text-4xl font-bold font-space">{analytics?.clicks?.toLocaleString() || 0}</h3>
                            </div>
                            <div className="p-4 bg-black/5 rounded-full">
                                <ShoppingBag className="h-8 w-8 text-black" />
                            </div>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                        <Card className="lg:col-span-2 border-gray-100 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base md:text-lg font-space">Revenue Trend (Last 7 Days)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <Line
                                        data={revenueChartData}
                                        options={chartOptions}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-100 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base md:text-lg font-space">Order Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64">
                                    <Doughnut data={statusChartData} options={doughnutOptions} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Orders */}
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base md:text-lg font-space">Recent Orders</CardTitle>
                                <Link to="/admin/orders">
                                    <Button variant="outline" size="sm" className="border-gray-200">View All</Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {recentOrders.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                                    <p>No orders yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentOrders.map((order) => (
                                        <div key={order.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">#{order.id.slice(0, 8)}</p>
                                                <p className="text-sm text-gray-500 truncate">{order.customer?.firstName} {order.customer?.lastName}</p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="font-medium">₦{order.total?.toLocaleString()}</p>
                                                <p className="text-xs text-gray-500">
                                                    {order.created_at?.seconds
                                                        ? new Date(order.created_at.seconds * 1000).toLocaleDateString()
                                                        : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </AdminLayout>
    );
};

export default AdminDashboard;
