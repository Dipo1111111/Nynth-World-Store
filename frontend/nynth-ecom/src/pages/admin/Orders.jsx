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
    X,
    Search,
    Filter,
    Download,
    Calendar,
    CreditCard,
    TrendingUp
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
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [monthFilter, setMonthFilter] = useState("all");

    useEffect(() => {
        document.title = "Nynth World Store Admin - Orders";
        fetchOrders();
    }, []);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders, searchTerm, statusFilter, monthFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await getAllOrders();
            // STRICT FILTER: Only show orders that have been PAID
            const paidOnly = data.filter(o => 
                o.payment_status === 'paid' || 
                o.payment_status === 'success' ||
                o.order_status === 'delivered' // safety for legacy
            );
            setOrders(paidOnly);
            setFilteredOrders(paidOnly);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let result = [...orders];

        // Search Filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(o => 
                o.id.toLowerCase().includes(term) || 
                o.customer?.firstName?.toLowerCase().includes(term) ||
                o.customer?.lastName?.toLowerCase().includes(term) ||
                o.customer?.email?.toLowerCase().includes(term)
            );
        }

        // Status Filter
        if (statusFilter !== "all") {
            result = result.filter(o => (o.order_status || "pending") === statusFilter);
        }

        // Month Filter
        if (monthFilter !== "all") {
            const [year, month] = monthFilter.split("-");
            result = result.filter(o => {
                if (!o.created_at?.seconds) return false;
                const d = new Date(o.created_at.seconds * 1000);
                return d.getFullYear() === parseInt(year) && d.getMonth() === parseInt(month);
            });
        }

        setFilteredOrders(result);
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

    const downloadCSV = () => {
        if (filteredOrders.length === 0) return;

        const headers = ["Order ID", "Date", "Customer", "Email", "Status", "Total (₦)"];
        const rows = filteredOrders.map(o => [
            o.id,
            o.created_at?.seconds ? new Date(o.created_at.seconds * 1000).toLocaleDateString() : 'N/A',
            `${o.customer?.firstName} ${o.customer?.lastName}`,
            o.customer?.email,
            o.order_status || 'pending',
            o.total || 0
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `nynth_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Downloaded");
    };

    // Calculate Summary from filtered orders
    const summary = {
        totalRevenue: filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        totalOrders: filteredOrders.length,
        pendingOrders: filteredOrders.filter(o => o.order_status !== 'delivered').length,
        paidOrders: filteredOrders.filter(o => o.payment_status === 'paid' || o.payment_status === 'success' || o.order_status === 'delivered').length
    };

    // Generate unique months for filter
    const months = Array.from(new Set(orders.map(o => {
        if (!o.created_at?.seconds) return null;
        const d = new Date(o.created_at.seconds * 1000);
        return `${d.getFullYear()}-${d.getMonth()}`;
    }))).filter(Boolean).sort().reverse();

    const getMonthName = (monthStr) => {
        const [year, month] = monthStr.split("-");
        return new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    return (
        <AdminLayout title="Orders">
            {/* Bookkeeping Summary Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-gray-100 shadow-sm bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <TrendingUp size={16} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Net Revenue</span>
                        </div>
                        <h3 className="text-xl font-bold">₦{summary.totalRevenue.toLocaleString()}</h3>
                    </CardContent>
                </Card>
                <Card className="border-gray-100 shadow-sm bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Package size={16} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Orders</span>
                        </div>
                        <h3 className="text-xl font-bold">{summary.totalOrders}</h3>
                    </CardContent>
                </Card>
                <Card className="border-gray-100 shadow-sm bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                <Calendar size={16} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Waitlist/Pending</span>
                        </div>
                        <h3 className="text-xl font-bold">{summary.pendingOrders}</h3>
                    </CardContent>
                </Card>
                <Card className="border-gray-100 shadow-sm bg-white">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                <CreditCard size={16} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Completed Sales</span>
                        </div>
                        <h3 className="text-xl font-bold">{summary.paidOrders}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by Order ID or Customer..." 
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-black/5"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select 
                        className="bg-gray-50 border-none rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-black/5 min-w-[120px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="packaging">Packaging</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select 
                        className="bg-gray-50 border-none rounded-lg text-sm px-3 py-2 focus:ring-1 focus:ring-black/5 min-w-[120px]"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                    >
                        <option value="all">All Months</option>
                        {months.map(m => (
                            <option key={m} value={m}>{getMonthName(m)}</option>
                        ))}
                    </select>
                    <Button 
                        variant="outline" 
                        className="bg-white border-gray-200 text-gray-600 hover:text-black gap-2"
                        onClick={downloadCSV}
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Export CSV</span>
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading orders...</p>
                    </div>
                </div>
            ) : filteredOrders.length === 0 ? (
                <Card className="border-gray-100 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Package className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No orders found</h3>
                        <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base md:text-lg font-space uppercase">Records ({filteredOrders.length})</CardTitle>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">Scroll through transaction history</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-gray-50">
                            {filteredOrders.map((order) => {
                                const isExpanded = expandedOrders.has(order.id);
                                return (
                                    <div key={order.id} className="p-4 bg-white flex flex-col gap-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <button
                                                    onClick={() => toggleOrderExpansion(order.id)}
                                                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors shrink-0"
                                                >
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <span className="font-bold text-xs uppercase tracking-tight block truncate">#{order.id.slice(0, 8)}</span>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5 truncate">
                                                        {order.customer?.firstName} • {order.created_at?.seconds ? new Date(order.created_at.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                                                <span className="font-bold text-sm leading-none mt-1">₦{order.total?.toLocaleString()}</span>
                                                <div className="scale-[0.8] origin-right -mr-2">
                                                    <StatusDropdown
                                                        orderId={order.id}
                                                        currentStatus={order.order_status || 'pending'}
                                                        onStatusChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Expanded Row Content for Mobile */}
                                        {isExpanded && (
                                            <div className="mt-2 pt-3 border-t border-gray-50">
                                                <div className="grid grid-cols-1 gap-6">
                                                    {/* Order Items */}
                                                    <div>
                                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                            <Package size={14} />
                                                            Order Items
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {order.items?.map((item, idx) => (
                                                                <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                                    <div className="w-14 h-16 bg-white rounded overflow-hidden flex-shrink-0 border border-black/5">
                                                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-[11px] truncate uppercase">{item.name || item.title}</p>
                                                                        <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest font-bold">
                                                                            {item.size || item.selectedSize} / {item.color || item.selectedColor}
                                                                        </p>
                                                                        <p className="text-[10px] text-gray-500 font-medium mt-1">Qty: {item.quantity}</p>
                                                                    </div>
                                                                    <div className="text-right pt-1 flex flex-col justify-between">
                                                                        <p className="font-bold text-xs">₦{(item.price * item.quantity).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Contact & Shipping */}
                                                    <div className="space-y-5">
                                                        <div>
                                                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                                <MapPin size={14} /> Shipping
                                                            </h4>
                                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                                                                <p className="font-bold text-xs truncate uppercase">{order.customer?.firstName} {order.customer?.lastName}</p>
                                                                <p className="text-[11px] text-gray-600 line-clamp-2 uppercase leading-relaxed">{order.customer?.address}</p>
                                                                <p className="text-[11px] text-gray-600 uppercase">{order.customer?.city}, {order.customer?.state}</p>
                                                                <div className="flex items-center gap-2 text-[11px] text-gray-600 pt-1 border-t border-gray-200 mt-2">
                                                                    <Phone size={12} className="text-gray-400" />
                                                                    <span>{order.customer?.phone}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Order Summary */}
                                                        <div>
                                                            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 uppercase tracking-wider">
                                                                <LayoutDashboard size={14}/> Summary
                                                            </h4>
                                                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 space-y-3 font-inter">
                                                                <div className="flex justify-between text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                                                                    <span>Subtotal</span>
                                                                    <span className="text-right">₦{order.subtotal?.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                                                                    <span>Shipping</span>
                                                                    <span className="text-right">₦{(order.shippingFee || order.shipping_fee)?.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between font-space font-bold text-sm pt-3 border-t border-gray-200 uppercase">
                                                                    <span>Total</span>
                                                                    <span className="text-right">₦{order.total?.toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
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
                                    {filteredOrders.map((order) => {
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
                                                                             <div className="flex items-center justify-between">
                                                                                 <div className="flex items-center gap-2 text-sm">
                                                                                     <Mail size={14} className="text-gray-400" />
                                                                                     <span className="truncate">{order.customer?.email}</span>
                                                                                 </div>
                                                                                 {order.customer?.email && (
                                                                                     <button 
                                                                                         onClick={(e) => {
                                                                                             e.stopPropagation();
                                                                                             window.location.href = `mailto:${order.customer?.email}?subject=Your Nynth World Order #${order.id.slice(0,8)}&body=Dear ${order.customer?.firstName},%0D%0A%0D%0ACongratulations on your order!`
                                                                                         }}
                                                                                         className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-black text-[10px] font-bold uppercase tracking-wider rounded transition-colors shrink-0"
                                                                                     >
                                                                                         <Mail size={12} /> Email Buyer
                                                                                     </button>
                                                                                 )}
                                                                             </div>
                                                                             <div className="flex items-center gap-2 text-sm">
                                                                                 <Phone size={14} className="text-gray-400" />
                                                                                 <span>{order.customer?.phone}</span>
                                                                             </div>
                                                                         </div>
                                                                     </div>

                                                                     {/* Order Summary */}
                                                                     <div>
                                                                         <h4 className="font-semibold mb-4 text-sm md:text-base">Order Status & Summary</h4>
                                                                         <div className="p-4 bg-white rounded-xl border border-gray-100 space-y-3">
                                                                             <div className="flex justify-between items-center text-sm">
                                                                                 <span className="text-gray-500">Order Status</span>
                                                                                 <StatusDropdown
                                                                                     orderId={order.id}
                                                                                     currentStatus={order.order_status || 'pending'}
                                                                                     onStatusChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                                                                                 />
                                                                             </div>
                                                                             <div className="space-y-2 pt-3 border-t border-gray-50 font-inter">
                                                                                 <div className="flex justify-between text-xs text-gray-500">
                                                                                     <span>Subtotal</span>
                                                                                     <span>₦{order.subtotal?.toLocaleString()}</span>
                                                                                 </div>
                                                                                 <div className="flex justify-between text-xs text-gray-500">
                                                                                     <span>Shipping Fee</span>
                                                                                     <span>₦{(order.shippingFee || order.shipping_fee)?.toLocaleString()}</span>
                                                                                 </div>
                                                                                 <div className="flex justify-between font-space font-bold text-base pt-2 border-t border-gray-100">
                                                                                     <span>Grand Total</span>
                                                                                     <span>₦{order.total?.toLocaleString()}</span>
                                                                                 </div>
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
