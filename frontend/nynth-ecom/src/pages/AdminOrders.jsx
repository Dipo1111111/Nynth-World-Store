import React, { useState, useEffect } from "react";
import AdminLayout from "../components/admin/AdminLayout";
import { fetchOrders, updateOrderStatus } from "../api/firebaseFunctions";
import { Loader2, Search, Filter, ChevronDown, CheckCircle, Package, Truck, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [updatingId, setUpdatingId] = useState(null);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await fetchOrders();
            // Sort by newest first
            data.sort((a, b) => {
                const timeA = a.created_at?.seconds || 0;
                const timeB = b.created_at?.seconds || 0;
                return timeB - timeA;
            });
            setOrders(data);
            setFilteredOrders(data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        // Poll for new orders every 30 seconds
        const interval = setInterval(loadOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let result = orders;

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(
                (order) =>
                    order.id.toLowerCase().includes(lowerTerm) ||
                    order.customer?.email?.toLowerCase().includes(lowerTerm) ||
                    (order.customer?.firstName + " " + order.customer?.lastName).toLowerCase().includes(lowerTerm)
            );
        }

        if (statusFilter !== "all") {
            result = result.filter((order) => order.order_status === statusFilter);
        }

        setFilteredOrders(result);
    }, [searchTerm, statusFilter, orders]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            setUpdatingId(orderId);
            await updateOrderStatus(orderId, newStatus);
            toast.success(`Order marked as ${newStatus}`);

            // Optimistic update
            setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "delivered": return "bg-green-100 text-green-700 border-green-200";
            case "shipped": return "bg-blue-100 text-blue-700 border-blue-200";
            case "processing": return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "cancelled": return "bg-red-100 text-red-700 border-red-200";
            default: return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    return (
        <AdminLayout title="Orders">
            {/* Payment Security Warning */}
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-4">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Clock size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-orange-800">Verify Payments in Paystack</h4>
                    <p className="text-sm text-orange-700 leading-relaxed">
                        Currently, payment confirmation is done on the client-side. Before shipping any items,
                        <strong> always verify the transaction in your Paystack Dashboard</strong> to ensure it was successful and the amount matches.
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by ID, email, or name..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={20} className="text-gray-400" />
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black bg-white"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders List */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="animate-spin text-gray-400" size={32} />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No orders found matching your criteria.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredOrders.map((order) => (
                            <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
                                    {/* Order Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="font-mono text-sm font-medium text-gray-500">
                                                #{order.id.slice(0, 8)}
                                            </span>
                                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.order_status)}`}>
                                                {order.order_status?.charAt(0).toUpperCase() + order.order_status?.slice(1)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(order.created_at?.seconds * 1000).toLocaleString()}
                                            </span>
                                        </div>

                                        <h3 className="font-medium text-lg mb-1">
                                            {order.customer?.firstName} {order.customer?.lastName}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-4">
                                            {order.items?.length} items • ₦{order.total?.toLocaleString()}
                                        </p>

                                        {/* Collapsible details could go here, for now simpler view */}
                                        <div className="text-sm text-gray-500">
                                            <p>{order.customer?.address}, {order.customer?.city}</p>
                                            <p>{order.customer?.email}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {order.order_status !== "delivered" && order.order_status !== "cancelled" && (
                                            <div className="flex gap-2">
                                                {order.order_status === "pending" && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(order.id, "processing")}
                                                        disabled={updatingId === order.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100"
                                                    >
                                                        <Package size={16} /> Mark Processing
                                                    </button>
                                                )}
                                                {order.order_status === "processing" && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(order.id, "shipped")}
                                                        disabled={updatingId === order.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-300 text-blue-700 bg-blue-50 rounded-lg text-sm font-medium hover:bg-blue-100"
                                                    >
                                                        <Truck size={16} /> Mark Shipped
                                                    </button>
                                                )}
                                                {order.order_status === "shipped" && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(order.id, "delivered")}
                                                        disabled={updatingId === order.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-green-300 text-green-700 bg-green-50 rounded-lg text-sm font-medium hover:bg-green-100"
                                                    >
                                                        <CheckCircle size={16} /> Mark Delivered
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
