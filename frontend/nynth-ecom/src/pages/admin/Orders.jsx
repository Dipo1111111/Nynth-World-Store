import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { subscribeOrders, getAllOrders, updateOrderPaymentStatus } from "../../api/firebaseFunctions";
import {
    Package,
    ChevronDown,
    ChevronRight,
    MapPin,
    Mail,
    Phone,
    User,
    Search,
    Download,
    Calendar,
    CreditCard,
    TrendingUp,
    Ticket,
} from "lucide-react";
import { formatEventDate } from "../../utils/tickets";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import StatusDropdown from "../../components/admin/StatusDropdown";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
import toast from "react-hot-toast";
import { useCountUp } from "../../lib/motion";

const PAYMENT_STATUS_CONFIG = {
    paid: { label: "Paid", className: "bg-emerald-500/[0.14] text-emerald-300 border-emerald-500/25" },
    pending: { label: "Pending", className: "bg-amber-500/[0.14] text-amber-300 border-amber-500/25" },
    failed: { label: "Failed", className: "bg-rose-500/[0.14] text-rose-300 border-rose-500/25" },
    refunded: { label: "Refunded", className: "bg-slate-500/[0.18] text-slate-400 border-slate-500/30" },
};

const PaymentStatusBadge = ({ status }) => {
    const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.pending;
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${config.className}`}>
            {config.label}
        </span>
    );
};

const TestBadge = () => (
    <span className="bg-amber-500/25 text-amber-200 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">TEST</span>
);

const ETicketBadge = () => (
    <span className="bg-[#0c0c0c] text-white text-[8px] px-1.5 py-0.5 rounded-lg font-bold uppercase tracking-wider shrink-0">E-TICKET</span>
);

const PaymentStatusDropdown = ({ status, onStatusChange }) => {
    const config = PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.pending;
    return (
        <Select value={status} onValueChange={(next) => onStatusChange(next)}>
            <SelectTrigger
                className={`rounded-lg border px-4 py-1 text-xs font-medium ${config.className} hover:opacity-80 transition-opacity w-auto min-w-[110px]`}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(PAYMENT_STATUS_CONFIG).map(([value, cfg]) => (
                    <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${cfg.className.split(' ')[0]}`} />
                            {cfg.label}
                        </span>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

const StatIcon = ({ icon: Icon, className }) => (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${className}`}>
        <Icon size={17} strokeWidth={2} />
    </div>
);

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrders, setExpandedOrders] = useState(new Set());

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [monthFilter, setMonthFilter] = useState("all");
    const [testFilter, setTestFilter] = useState("live");

    useEffect(() => {
        document.title = "Nynth World Store Admin - Orders";

        setLoading(true);
        getAllOrders().then(data => { setOrders(data); setLoading(false); }).catch(() => setLoading(false));
        // Realtime subscription: new/sold orders appear instantly, no refresh needed.
        const unsub = subscribeOrders((data) => { setOrders(data); setLoading(false); });
        return () => unsub();
    }, []);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders, searchTerm, statusFilter, paymentFilter, monthFilter, testFilter]);

    const applyFilters = () => {
        let result = [...orders];

        // Test/Live Filter (default: live only — test traffic never counts as normal)
        if (testFilter === "live") {
            result = result.filter(o => !o.isTest);
        } else if (testFilter === "test") {
            result = result.filter(o => o.isTest);
        }

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

        // Fulfillment Status Filter
        if (statusFilter !== "all") {
            result = result.filter(o => (o.order_status || "pending") === statusFilter);
        }

        // Payment Status Filter
        if (paymentFilter !== "all") {
            result = result.filter(o => (o.payment_status || "pending") === paymentFilter);
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

    const handlePaymentStatusChange = (orderId, newStatus) => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId
                    ? { ...order, payment_status: newStatus }
                    : order
            )
        );
        updateOrderPaymentStatus(orderId, newStatus).then((ok) => {
            if (ok) {
                toast.success(`Payment status updated to ${PAYMENT_STATUS_CONFIG[newStatus]?.label || newStatus}`);
            } else {
                toast.error('Failed to update payment status');
            }
        });
    };

    const downloadCSV = () => {
        if (filteredOrders.length === 0) return;

        const headers = ["Order ID", "Date", "Customer", "Email", "Payment Status", "Order Status", "Total (₦)"];
        const rows = filteredOrders.map(o => [
            o.id,
            o.created_at?.seconds ? new Date(o.created_at.seconds * 1000).toLocaleDateString() : 'N/A',
            `${o.customer?.firstName} ${o.customer?.lastName}`,
            o.customer?.email,
            o.payment_status || 'pending',
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

    // Calculate Summary — always LIVE orders only. Test traffic is badged and
    // inspectable but never counted in the bookkeeping numbers.
    const liveOrders = filteredOrders.filter(o => !o.isTest);
    const summary = {
        totalRevenue: liveOrders.reduce((sum, o) => {
            const paid = o.payment_status === 'paid' || o.payment_status === 'success';
            return sum + (paid ? (o.total || 0) : 0);
        }, 0),
        totalOrders: liveOrders.length,
        unpaidOrders: liveOrders.filter(o => o.payment_status !== 'paid' && o.payment_status !== 'success').length,
        paidOrders: liveOrders.filter(o => o.payment_status === 'paid' || o.payment_status === 'success').length,
    };

    const revenueRef = useCountUp(summary.totalRevenue);
    const ordersRef = useCountUp(summary.totalOrders);
    const unpaidRef = useCountUp(summary.unpaidOrders);
    const paidRef = useCountUp(summary.paidOrders);

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
                <Card hover className="border-white/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42">Net Revenue</span>
                            <StatIcon icon={TrendingUp} className="bg-emerald-500/[0.14] text-emerald-300" />
                        </div>
                        <h3 className="text-xl font-bold text-[#EDEAE2]">
                            <span className="text-sm text-[#EDEAE2]/55 font-semibold">₦</span>
                            <span ref={revenueRef}>0</span>
                        </h3>
                    </CardContent>
                </Card>
                <Card hover className="border-white/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42">Total Orders</span>
                            <StatIcon icon={Package} className="bg-violet-500/[0.14] text-violet-300" />
                        </div>
                        <h3 className="text-xl font-bold text-[#EDEAE2]"><span ref={ordersRef}>0</span></h3>
                    </CardContent>
                </Card>
                <Card hover className="border-white/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42">Unpaid Orders</span>
                            <StatIcon icon={Calendar} className="bg-amber-500/[0.14] text-amber-300" />
                        </div>
                        <h3 className="text-xl font-bold text-[#EDEAE2]"><span ref={unpaidRef}>0</span></h3>
                    </CardContent>
                </Card>
                <Card hover className="border-white/10">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42">Completed Sales</span>
                            <StatIcon icon={CreditCard} className="bg-sky-500/[0.14] text-sky-300" />
                        </div>
                        <h3 className="text-xl font-bold text-[#EDEAE2]"><span ref={paidRef}>0</span></h3>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Search */}
            <div className="admin-toolbar mb-6">
                <div className="flex-1 min-w-[220px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#EDEAE2]/42" size={17} />
                    <input
                        type="text"
                        placeholder="Search by Order ID or Customer..."
                        className="w-full pl-10 pr-4 py-2 bg-[#131316] border border-white/14 rounded-lg text-sm focus-ring placeholder:text-[#EDEAE2]/42"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="admin-control cursor-pointer"
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
                    className="admin-control cursor-pointer"
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                >
                    <option value="all">All Payments</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Payment Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                </select>
                <select
                    className="admin-control cursor-pointer"
                    value={testFilter}
                    onChange={(e) => setTestFilter(e.target.value)}
                >
                    <option value="live">Live orders</option>
                    <option value="test">Test orders</option>
                    <option value="all">All orders</option>
                </select>
                <select
                    className="admin-control cursor-pointer"
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
                    className="gap-2"
                    onClick={downloadCSV}
                >
                    <Download size={15} />
                    <span className="hidden sm:inline">Export CSV</span>
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/18 border-t-white/18 mx-auto mb-4"></div>
                        <p className="text-[#EDEAE2]/55">Loading orders...</p>
                    </div>
                </div>
            ) : filteredOrders.length === 0 ? (
                <Card className="border-white/10">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.09] flex items-center justify-center mb-4">
                            <Package className="h-8 w-8 text-[#EDEAE2]/35" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No orders found</h3>
                        <p className="text-[#EDEAE2]/55 text-sm">Try adjusting your search or filters.</p>
                        {testFilter === "live" && orders.some((o) => o.isTest) && (
                            <p className="text-xs text-[#EDEAE2]/42 mt-3 max-w-sm text-center">
                                {orders.filter((o) => o.isTest).length} TEST order{orders.filter((o) => o.isTest).length === 1 ? "" : "s"} are hidden — switch the filter to
                                <span className="text-[#EDEAE2]/65 font-medium"> Test orders </span>or<span className="text-[#EDEAE2]/65 font-medium"> All orders </span>to see them.
                            </p>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-white/10">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base md:text-lg uppercase tracking-wide">Records ({filteredOrders.length})</CardTitle>
                        <p className="text-[10px] font-bold text-[#EDEAE2]/42 uppercase tracking-widest hidden sm:block">Scroll through transaction history</p>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Mobile Card View */}
                        <div className="md:hidden divide-y divide-white/[0.08]">
                            {filteredOrders.map((order) => {
                                const isExpanded = expandedOrders.has(order.id);
                                return (
                                    <div key={order.id} className="p-4 bg-[#131316] flex flex-col gap-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <button
                                                    onClick={() => toggleOrderExpansion(order.id)}
                                                    className="w-8 h-8 rounded-lg bg-white/[0.09] flex items-center justify-center text-[#EDEAE2]/42 hover:text-[#EDEAE2] transition-colors shrink-0"
                                                >
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-xs uppercase tracking-tight block truncate">#{order.id.slice(0, 8)}</span>
                                                        {order.isTest && <TestBadge />}
                                                        {order.items?.some(i => i.category === "tickets") && <ETicketBadge />}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <PaymentStatusBadge status={order.payment_status || 'pending'} />
                                                        <p className="text-[10px] text-[#EDEAE2]/42 font-bold uppercase tracking-widest truncate">
                                                            {order.created_at?.seconds ? new Date(order.created_at.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                        </p>
                                                    </div>
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
                                            <div className="mt-2 pt-3 border-t border-white/[0.06]">
                                                <div className="grid grid-cols-1 gap-6">
                                                    {/* Order Items */}
                                                    <div>
                                                        <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                            <Package size={14} />
                                                            Order Items
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {order.items?.map((item, idx) => (
                                                                <div key={idx} className="flex gap-3 p-3 bg-white/[0.05] rounded-lg border border-white/10">
                                                                    <div className="w-14 h-16 bg-[#131316] rounded overflow-hidden flex-shrink-0 border border-white/10">
                                                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-[11px] truncate uppercase">{item.name || item.title}</p>
                                                                        <p className="text-[9px] text-[#EDEAE2]/55 mt-1 uppercase tracking-widest font-bold">
                                                                            {item.category === "tickets" ? (
                                                                                <span className="inline-flex items-center gap-1">
                                                                                    <Ticket size={10} className="shrink-0" />
                                                                                    E-TICKET{item.eventDateTime ? ` · ${formatEventDate(item.eventDateTime)}` : ""}
                                                                                </span>
                                                                            ) : (
                                                                                `${item.size || item.selectedSize} / ${item.color || item.selectedColor}`
                                                                            )}
                                                                        </p>
                                                                        <p className="text-[10px] text-[#EDEAE2]/55 font-medium mt-1">Qty: {item.quantity}</p>
                                                                    </div>
                                                                    <div className="text-right pt-1 flex flex-col justify-between">
                                                                        <p className="font-bold text-xs">₦{(item.price * item.quantity).toLocaleString()}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {order.tickets?.length > 0 && (
                                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                                <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                                    <Ticket size={14} />
                                                                    E-Ticket Codes
                                                                </h4>
                                                                <div className="space-y-1.5">
                                                                    {order.tickets.map((t, i) => (
                                                                        <div key={i} className="flex items-center justify-between gap-2 bg-[#131316] rounded-lg border border-white/10 px-3 py-2">
                                                                            <span className="font-mono text-[11px] font-bold tracking-wider">{t.code}</span>
                                                                            <span className="text-[9px] text-[#EDEAE2]/55 font-bold uppercase tracking-widest truncate ml-2">{t.title}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Contact & Shipping */}
                                                    <div className="space-y-5">
                                                        <div>
                                                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                                <MapPin size={14} /> Shipping
                                                            </h4>
                                                            <div className="p-4 bg-white/[0.05] rounded-lg border border-white/10 space-y-2">
                                                                <p className="font-bold text-xs truncate uppercase">{order.customer?.firstName} {order.customer?.lastName}</p>
                                                                <p className="text-[11px] text-[#EDEAE2]/65 line-clamp-2 uppercase leading-relaxed">{order.customer?.address}</p>
                                                                <p className="text-[11px] text-[#EDEAE2]/65 uppercase">{order.customer?.city}, {order.customer?.state}</p>
                                                                <div className="flex items-center gap-2 text-[11px] text-[#EDEAE2]/65 pt-1 border-t border-white/14 mt-2">
                                                                    <Phone size={12} className="text-[#EDEAE2]/42" />
                                                                    <span>{order.customer?.phone}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 uppercase tracking-wider">
                                                                <CreditCard size={14} /> Payment
                                                            </h4>
                                                            <div className="p-4 bg-white/[0.05] rounded-lg border border-white/10 flex items-center justify-between">
                                                                <PaymentStatusBadge status={order.payment_status || 'pending'} />
                                                                <PaymentStatusDropdown
                                                                    status={order.payment_status || 'pending'}
                                                                    onStatusChange={(next) => handlePaymentStatusChange(order.id, next)}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Order Summary */}
                                                        <div>
                                                            <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 uppercase tracking-wider">
                                                                <TrendingUp size={14} /> Summary
                                                            </h4>
                                                            <div className="p-4 bg-white/[0.05] rounded-lg border border-white/10 space-y-3 font-inter">
                                                                <div className="flex justify-between text-[11px] text-[#EDEAE2]/55 font-bold uppercase tracking-widest">
                                                                    <span>Subtotal</span>
                                                                    <span className="text-right">₦{order.subtotal?.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between text-[11px] text-[#EDEAE2]/55 font-bold uppercase tracking-widest">
                                                                    <span>Shipping</span>
                                                                    <span className="text-right">₦{(order.shippingFee || order.shipping_fee)?.toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex justify-between font-bold text-sm pt-3 border-t border-white/14 uppercase">
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
                            <table className="w-full admin-table">
                                <thead className="bg-white/[0.05]">
                                    <tr className="border-b border-white/10">
                                        <th className="px-4 md:px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 w-12"></th>
                                        <th className="px-4 md:px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42">Order ID</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 hidden md:table-cell">Customer</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42">Status</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42">Payment</th>
                                        <th className="px-4 md:px-6 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42 hidden sm:table-cell">Date</th>
                                        <th className="px-4 md:px-6 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-[#131316]">
                                    {filteredOrders.map((order) => {
                                        const isExpanded = expandedOrders.has(order.id);
                                        return (
                                            <React.Fragment key={order.id}>
                                                <tr className="border-b border-white/[0.06] hover:bg-white/[0.05] transition-colors">
                                                    <td className="px-4 md:px-6 py-4">
                                                        <button
                                                            onClick={() => toggleOrderExpansion(order.id)}
                                                            className="text-[#EDEAE2]/42 hover:text-[#EDEAE2]/65 transition-colors"
                                                        >
                                                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs md:text-sm font-medium">#{order.id.slice(0, 8)}</span>
                                                            {order.isTest && <TestBadge />}
                                                            {order.items?.some(i => i.category === "tickets") && <ETicketBadge />}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                                        <div>
                                                            <p className="font-medium text-sm">{order.customer?.firstName} {order.customer?.lastName}</p>
                                                            <p className="text-xs text-[#EDEAE2]/55">{order.customer?.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                        <StatusDropdown
                                                            orderId={order.id}
                                                            currentStatus={order.order_status || 'pending'}
                                                            onStatusChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                                                        />
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                                                        <PaymentStatusBadge status={order.payment_status || 'pending'} />
                                                    </td>
                                                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-[#EDEAE2]/55 hidden sm:table-cell">
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
                                                        <td colSpan="7" className="px-4 md:px-6 py-6 bg-white/[0.02]">
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                {/* Order Items */}
                                                                <div>
                                                                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm md:text-base">
                                                                        <Package size={16} />
                                                                        Order Items
                                                                    </h4>
                                                                    <div className="space-y-3">
                                                                        {order.items?.map((item, idx) => (
                                                                            <div key={idx} className="flex gap-4 p-3 bg-[#131316] rounded-lg border border-white/10">
                                                                                <div className="w-16 h-20 bg-white/[0.07] rounded overflow-hidden flex-shrink-0">
                                                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="font-medium text-sm truncate">{item.name || item.title}</p>
                                                                                    <p className="text-xs text-[#EDEAE2]/55 mt-1">
                                                                                        {item.category === "tickets" ? (
                                                                                            <span className="inline-flex items-center gap-1">
                                                                                                <Ticket size={10} className="shrink-0" />
                                                                                                E-TICKET{item.eventDateTime ? ` · ${formatEventDate(item.eventDateTime)}` : ""}
                                                                                            </span>
                                                                                        ) : (
                                                                                            `${item.size || item.selectedSize} / ${item.color || item.selectedColor}`
                                                                                        )}
                                                                                    </p>
                                                                                    <p className="text-xs text-[#EDEAE2]/55">Qty: {item.quantity}</p>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <p className="font-medium text-sm">₦{(item.price * item.quantity).toLocaleString()}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>

                                                                    {order.tickets?.length > 0 && (
                                                                        <div className="mt-4 pt-4 border-t border-white/10">
                                                                            <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                                                                                <Ticket size={16} />
                                                                                E-Ticket Codes
                                                                            </h4>
                                                                            <div className="space-y-2">
                                                                                {order.tickets.map((t, i) => (
                                                                                    <div key={i} className="flex items-center justify-between gap-3 bg-[#131316] rounded-lg border border-white/10 px-3 py-2.5">
                                                                                        <span className="font-mono text-xs font-bold tracking-wider">{t.code}</span>
                                                                                        <span className="text-[10px] text-[#EDEAE2]/55 font-bold uppercase tracking-widest truncate">{t.title}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Customer & Shipping Info */}
                                                                <div className="space-y-6">
                                                                    {/* Shipping Address */}
                                                                    <div>
                                                                        <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm md:text-base">
                                                                            <MapPin size={16} />
                                                                            Shipping Address
                                                                        </h4>
                                                                        <div className="p-4 bg-[#131316] rounded-lg border border-white/10 space-y-2">
                                                                            <p className="font-medium text-sm">{order.customer?.firstName} {order.customer?.lastName}</p>
                                                                            <p className="text-sm text-[#EDEAE2]/65">{order.customer?.address}</p>
                                                                            <p className="text-sm text-[#EDEAE2]/65">{order.customer?.city}, {order.customer?.state}</p>
                                                                            <p className="text-sm text-[#EDEAE2]/65">{order.customer?.country}</p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Contact Info */}
                                                                    <div>
                                                                        <h4 className="font-semibold mb-4 flex items-center gap-2 text-sm md:text-base">
                                                                            <User size={16} />
                                                                            Contact Information
                                                                        </h4>
                                                                        <div className="p-4 bg-[#131316] rounded-lg border border-white/10 space-y-3">
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex items-center gap-2 text-sm">
                                                                                    <Mail size={14} className="text-[#EDEAE2]/42" />
                                                                                    <span className="truncate">{order.customer?.email}</span>
                                                                                </div>
                                                                                {order.customer?.email && (
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            window.location.href = `mailto:${order.customer?.email}?subject=Your Nynth World Order #${order.id.slice(0, 8)}&body=Dear ${order.customer?.firstName},%0D%0A%0D%0ACongratulations on your order!`
                                                                                        }}
                                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.11] hover:bg-white/[0.15] text-[#EDEAE2] text-[10px] font-bold uppercase tracking-wider rounded transition-colors shrink-0"
                                                                                    >
                                                                                        <Mail size={12} /> Email Buyer
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 text-sm">
                                                                                <Phone size={14} className="text-[#EDEAE2]/42" />
                                                                                <span>{order.customer?.phone}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Order Summary */}
                                                                    <div>
                                                                        <h4 className="font-semibold mb-4 text-sm md:text-base">Order Status & Summary</h4>
                                                                        <div className="p-4 bg-[#131316] rounded-lg border border-white/10 space-y-3">
                                                                            <div className="flex justify-between items-center text-sm">
                                                                                <span className="text-[#EDEAE2]/55">Order Status</span>
                                                                                <StatusDropdown
                                                                                    orderId={order.id}
                                                                                    currentStatus={order.order_status || 'pending'}
                                                                                    onStatusChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                                                                                />
                                                                            </div>
                                                                            <div className="flex justify-between items-center text-sm pt-3 border-t border-white/[0.06]">
                                                                                <span className="text-[#EDEAE2]/55">Payment Status</span>
                                                                                <PaymentStatusDropdown
                                                                                    status={order.payment_status || 'pending'}
                                                                                    onStatusChange={(next) => handlePaymentStatusChange(order.id, next)}
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-2 pt-3 border-t border-white/[0.06] font-inter">
                                                                                <div className="flex justify-between text-xs text-[#EDEAE2]/55">
                                                                                    <span>Subtotal</span>
                                                                                    <span>₦{order.subtotal?.toLocaleString()}</span>
                                                                                </div>
                                                                                <div className="flex justify-between text-xs text-[#EDEAE2]/55">
                                                                                    <span>Shipping Fee</span>
                                                                                    <span>₦{(order.shippingFee || order.shipping_fee)?.toLocaleString()}</span>
                                                                                </div>
                                                                                <div className="flex justify-between font-bold text-base pt-2 border-t border-white/14">
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