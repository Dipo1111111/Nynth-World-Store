import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAllOrders } from "../../api/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    LogOut,
    ChevronDown,
    ChevronRight,
    MapPin,
    Mail,
    Phone,
    User,
    Menu,
    X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import Logo from "../../components/common/Logo";
import StatusDropdown from "../../components/admin/StatusDropdown";
import toast from "react-hot-toast";

const Orders = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        document.title = "Nynth World Store Admin";
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await getAllOrders();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const toggleOrderExpansion = (orderId) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    const handleStatusChange = (orderId, newStatus) => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId
                    ? { ...order, order_status: newStatus }
                    : order
            )
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

    return (
        <AdminLayout title="Orders">
            <header className="mb-6 md:mb-8 sr-only">
                <h1 className="text-2xl md:text-3xl font-space font-bold mb-2">Orders</h1>
                <p className="text-gray-500 text-sm md:text-base">Manage and track all customer orders.</p>
            </header>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading orders...</p>
                    </div>
                </div>
            ) : orders.length === 0 ? (
                <Card className="border-gray-100 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Package className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                        <p className="text-gray-500 text-sm">Orders will appear here once customers start purchasing.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base md:text-lg font-space">All Orders ({orders.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Customer</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Date</th>
                                        <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {orders.map((order) => {
                                        const isExpanded = expandedOrders.has(order.id);
                                        return (
                                            <React.Fragment key={order.id}>
                                                <tr className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 md:px-6 py-4">
                                                        <button
                                                            onClick={() => toggleOrderExpansion(order.id)}
                                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                                        >
                                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                        <span className="font-mono text-xs md:text-sm font-medium">#{order.id.slice(0, 8)}</span>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                                        <div>
                                                            <p className="font-medium text-sm">{order.customer?.firstName} {order.customer?.lastName}</p>
                                                            <p className="text-xs text-gray-500">{order.customer?.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                        <StatusDropdown
                                                            orderId={order.id}
                                                            currentStatus={order.order_status || 'pending'}
                                                            onStatusChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                                                        />
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500 hidden sm:table-cell">
                                                        {order.created_at?.seconds
                                                            ? new Date(order.created_at.seconds * 1000).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })
                                                            : 'N/A'}
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right font-medium text-sm md:text-base">
                                                        ₦{order.total?.toLocaleString()}
                                                    </td>
                                                </tr>

                                                {/* Expanded Row */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="6" className="px-4 md:px-6 py-6 bg-gray-50">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                {/* Order Items */}
                                                                <div>
                                                                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm md:text-base">
                                                                        <Package size={16} />
                                                                        Order Items
                                                                    </h4>
                                                                    <div className="space-y-3">
                                                                        {order.items?.map((item, idx) => (
                                                                            <div key={idx} className="flex gap-4 p-3 bg-white rounded-lg border border-gray-100">
                                                                                <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="font-medium text-sm truncate">{item.name || item.title}</p>
                                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                                        {item.size || item.selectedSize} / {item.color || item.selectedColor}
                                                                                    </p>
                                                                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <p className="font-medium text-sm">₦{(item.price * item.quantity).toLocaleString()}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                {/* Customer & Shipping Info */}
                                                                <div className="space-y-6">
                                                                    {/* Shipping Address */}
                                                                    <div>
                                                                        <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm md:text-base">
                                                                            <MapPin size={16} />
                                                                            Shipping Address
                                                                        </h4>
                                                                        <div className="p-4 bg-white rounded-lg border border-gray-100 space-y-2">
                                                                            <p className="font-medium text-sm">{order.customer?.firstName} {order.customer?.lastName}</p>
                                                                            <p className="text-sm text-gray-600">{order.customer?.address}</p>
                                                                            <p className="text-sm text-gray-600">{order.customer?.city}, {order.customer?.state}</p>
                                                                            <p className="text-sm text-gray-600">{order.customer?.country}</p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Contact Info */}
                                                                    <div>
                                                                        <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm md:text-base">
                                                                            <User size={16} />
                                                                            Contact Information
                                                                        </h4>
                                                                        <div className="p-4 bg-white rounded-lg border border-gray-100 space-y-3">
                                                                            <div className="flex items-center gap-2 text-sm">
                                                                                <Mail size={14} className="text-gray-400" />
                                                                                <span className="truncate">{order.customer?.email}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-sm">
                                                                                <Phone size={14} className="text-gray-400" />
                                                                                <span>{order.customer?.phone}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Order Summary */}
                                                                    <div>
                                                                        <h4 className="font-semibold mb-4 text-sm md:text-base">Order Summary</h4>
                                                                        <div className="p-4 bg-white rounded-lg border border-gray-100 space-y-2">
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-gray-600">Subtotal</span>
                                                                                <span>₦{order.subtotal?.toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm">
                                                                                <span className="text-gray-600">Shipping</span>
                                                                                <span>₦{(order.shippingFee || order.shipping_fee)?.toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between font-semibold pt-2 border-t border-gray-100">
                                                                                <span>Total</span>
                                                                                <span>₦{order.total?.toLocaleString()}</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm pt-2">
                                                                                <span className="text-gray-600">Payment Status</span>
                                                                                <span className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                                                                    {order.payment_status || 'pending'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </AdminLayout>
    );
};

export default Orders;
