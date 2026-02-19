import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAdminAnalytics, getAllOrders } from "../../api/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../../api/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import {
    LayoutDashboard,
    Package,
    LogOut,
    TrendingUp,
    CreditCard,
    Truck,
    CheckCircle2,
    Menu,
    X
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
    ArcElement
);

const AdminDashboard = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [seenOrderIds, setSeenOrderIds] = useState(new Set());

    useEffect(() => {
        document.title = "Nynth World Store Admin";
        fetchDashboardData();
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
        if (loading) return; // Don't listen until initial load is done

        const q = query(
            collection(db, "orders"),
            orderBy("created_at", "desc"),
            limit(5) // Check last 5 orders
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const orderId = change.doc.id;
                    const order = change.doc.data();

                    // Only show notification if we haven't seen this order before
                    if (!seenOrderIds.has(orderId)) {
                        // Mark as seen
                        setSeenOrderIds(prev => new Set([...prev, orderId]));

                        // 🔔 Cha-Ching Logic
                        try {
                            const audio = new Audio('/sounds/cha-ching.mp3');
                            audio.play().catch(e => console.log('Audio playback failed - interaction required', e));
                        } catch (err) {
                            console.error('Audio error:', err);
                        }

                        // 📱 System Notification
                        if (Notification.permission === 'granted') {
                            new Notification('NYNTH 💰 New Order!', {
                                body: `₦${order.total?.toLocaleString()} from ${order.customer?.firstName || 'Customer'}`,
                                icon: '/favicon.png'
                            });
                        }

                        // Show toast notification
                        toast.success(
                            `🛍️ New order: ₦${order.total?.toLocaleString()} from ${order.customer?.firstName || 'Customer'}`,
                            {
                                duration: 5000,
                                position: 'top-right'
                            }
                        );

                        // Refresh dashboard data
                        fetchDashboardData();
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [loading, seenOrderIds]);

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

    const revenueChartData = {
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
                borderWidth: 2,
            },
        ],
    };

    const statusChartData = {
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
                    '#fbbf24',
                    '#3b82f6',
                    '#8b5cf6',
                    '#10b981',
                ],
                borderWidth: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function (value) {
                        return '₦' + value.toLocaleString();
                    }
                }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
            },
        },
    };

    return (
        <AdminLayout title="Dashboard">
            <AdminPWAPrompt />
            {/* Main Content */}
            <header className="mb-6 md:mb-8 sr-only">
                <h1 className="text-2xl md:text-3xl font-space font-bold mb-2">Dashboard</h1>
                <p className="text-gray-500 text-sm md:text-base">Welcome back! Here's what's happening with your store.</p>
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
                        <Card className="border-gray-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                                <TrendingUp className="h-4 w-4 text-gray-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-space">₦{analytics?.totalRevenue?.toLocaleString() || 0}</div>
                                <p className="text-xs text-gray-500 mt-1">From paid orders</p>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                                <Package className="h-4 w-4 text-gray-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-space">{analytics?.totalOrders || 0}</div>
                                <p className="text-xs text-gray-500 mt-1">All time</p>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
                                <Truck className="h-4 w-4 text-gray-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-space">{analytics?.pendingOrders || 0}</div>
                                <p className="text-xs text-gray-500 mt-1">Awaiting fulfillment</p>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-100 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
                                <CheckCircle2 className="h-4 w-4 text-gray-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-space">{analytics?.completedOrders || 0}</div>
                                <p className="text-xs text-gray-500 mt-1">Delivered orders</p>
                            </CardContent>
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
                                    <Line data={revenueChartData} options={chartOptions} />
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
