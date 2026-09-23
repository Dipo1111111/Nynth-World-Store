import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { getAllOrders } from "../../api/firebaseFunctions";
import {
 LayoutDashboard,
 Package,
 ChevronDown,
 ChevronRight,
 MapPin,
 Mail,
 Phone,
 User,
 Search,
 Download,
 TrendingUp,
 Ticket,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useCountUp } from "../../lib/motion";
import { formatEventDate } from "../../utils/tickets";
import toast from "react-hot-toast";

const StatIcon = ({ icon: Icon, className }) => (
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${className}`}>
 <Icon size={17} strokeWidth={2} />
 </div>
);

const AbandonedCheckouts = () => {
 const [orders, setOrders] = useState([]);
 const [filteredOrders, setFilteredOrders] = useState([]);
 const [loading, setLoading] = useState(true);
 const [expandedOrders, setExpandedOrders] = useState(new Set());

 // Filters
 const [searchTerm, setSearchTerm] = useState("");
 const [statusFilter, setStatusFilter] = useState("all");
 const [monthFilter, setMonthFilter] = useState("all");

 useEffect(() => {
 document.title = "Nynth World Store Admin - Abandoned Checkouts";
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
 // STRICT FILTER: Only show orders that are PENDING (Abandoned)
 const abandoned = data.filter(o =>
 o.payment_status === 'pending' ||
 !o.payment_status // catch-all for incomplete
 );
 setOrders(abandoned);
 setFilteredOrders(abandoned);
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
 totalPotentionalRevenue: filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0),
 totalAbandoned: filteredOrders.length,
 };

 const abandonedRef = useCountUp(summary.totalAbandoned);
 const revenueRef = useCountUp(summary.totalPotentionalRevenue);

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
 <AdminLayout title="Abandoned Checkouts">
 {/* Bookkeeping Summary Row */}
 <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
 <Card hover className="border-white/10">
 <CardContent className="p-4">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42">Total Abandoned</span>
 <StatIcon icon={Package} className="bg-amber-500/[0.14] text-amber-300" />
 </div>
 <h3 className="text-xl font-bold text-[#EDEAE2]"><span ref={abandonedRef}>0</span></h3>
 </CardContent>
 </Card>
 <Card hover className="border-white/10">
 <CardContent className="p-4">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/42">Potential Revenue Lost</span>
 <StatIcon icon={TrendingUp} className="bg-rose-500/[0.14] text-rose-300" />
 </div>
 <h3 className="text-xl font-bold text-[#EDEAE2]">
 <span className="text-sm text-[#EDEAE2]/55 font-semibold">₦</span>
 <span ref={revenueRef}>0</span>
 </h3>
 </CardContent>
 </Card>
 </div>

 {/* Filters & Search */}
 <div className="admin-toolbar mb-6">
 <div className="flex-1 min-w-[200px] relative">
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
 className="admin-control cursor-pointer hidden"
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 >
 <option value="all">All Status</option>
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
 const hasTickets = order.items?.some(i => i.category === "tickets");
 return (
 <div key={order.id} className="p-4 bg-[#131316] flex flex-col gap-3">
 <div className="flex items-start justify-between gap-2">
 <div className="flex items-center gap-2 min-w-0 flex-1">
 <button
 onClick={() => toggleOrderExpansion(order.id)}
 className="focus-ring w-8 h-8 rounded-lg bg-white/[0.09] flex items-center justify-center text-[#EDEAE2]/42 hover:text-[#EDEAE2] transition-colors shrink-0"
 >
 {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
 </button>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <span className="font-bold text-xs uppercase tracking-tight block truncate">#{order.id.slice(0, 8)}</span>
 {hasTickets && (
 <span className="bg-[#0c0c0c] text-white text-[8px] px-1.5 py-0.5 rounded-lg font-bold uppercase tracking-wider shrink-0">E-TICKET</span>
 )}
 </div>
 <p className="text-[10px] text-[#EDEAE2]/42 font-bold uppercase tracking-widest mt-0.5 truncate">
 {order.customer?.firstName} • {order.created_at?.seconds ? new Date(order.created_at.seconds * 1000).toLocaleDateString() : 'N/A'}
 </p>
 {order.customer?.email && (
 <p className="text-[10px] text-[#EDEAE2]/42 mt-0.5 truncate lowercase">
 {order.customer.email}
 </p>
 )}
 </div>
 </div>
 <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
 <span className="font-bold text-sm leading-none mt-1">₦{order.total?.toLocaleString()}</span>
 <span className="text-xs text-rose-300 font-bold uppercase tracking-widest">ABANDONED</span>
 </div>
 </div>

 {/* Expanded Row Content for Mobile */}
 {isExpanded && (
 <div className="mt-2 pt-3 border-t border-white/[0.08]">
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

 {/* Order Summary */}
 <div>
 <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 uppercase tracking-wider">
 <LayoutDashboard size={14}/> Summary
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
 <thead>
 <tr className="bg-white/[0.05] border-b border-white/10">
 <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-[#EDEAE2]/55 uppercase tracking-wider w-12"></th>
 <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-[#EDEAE2]/55 uppercase tracking-wider">Order ID</th>
 <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-[#EDEAE2]/55 uppercase tracking-wider hidden md:table-cell">Customer</th>
 <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-[#EDEAE2]/55 uppercase tracking-wider">Status</th>
 <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-[#EDEAE2]/55 uppercase tracking-wider hidden sm:table-cell">Date</th>
 <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-[#EDEAE2]/55 uppercase tracking-wider">Total</th>
 </tr>
 </thead>
 <tbody className="bg-[#131316] divide-y divide-white/10">
 {filteredOrders.map((order) => {
 const isExpanded = expandedOrders.has(order.id);
 const hasTickets = order.items?.some(i => i.category === "tickets");
 return (
 <React.Fragment key={order.id}>
 <tr className="transition-colors hover:bg-white/[0.05]">
 <td className="px-4 md:px-6 py-4">
 <button
 onClick={() => toggleOrderExpansion(order.id)}
 className="focus-ring rounded text-[#EDEAE2]/42 hover:text-[#EDEAE2]/65 transition-colors"
 >
 {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
 </button>
 </td>
 <td className="px-4 md:px-6 py-4 whitespace-nowrap">
 <div className="flex items-center gap-2">
 <span className="font-mono text-xs md:text-sm font-medium">#{order.id.slice(0, 8)}</span>
 {hasTickets && (
 <span className="bg-[#0c0c0c] text-white text-[8px] px-1.5 py-0.5 rounded-lg font-bold uppercase tracking-wider shrink-0">E-TICKET</span>
 )}
 </div>
 </td>
 <td className="px-4 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
 <div>
 <p className="font-medium text-sm">{order.customer?.firstName} {order.customer?.lastName}</p>
 <p className="text-xs text-[#EDEAE2]/55">{order.customer?.email}</p>
 </div>
 </td>
 <td className="px-4 md:px-6 py-4 whitespace-nowrap">
 <span className="text-xs text-rose-300 font-bold uppercase tracking-widest bg-rose-500/[0.14] px-2.5 py-1 rounded-lg border border-rose-500/25">ABANDONED</span>
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
 <td colSpan="6" className="px-4 md:px-6 py-6 bg-white/[0.02]">
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
 window.location.href = `mailto:${order.customer?.email}?subject=Did you forget something? (Order #${order.id.slice(0,8)})&body=Hi ${order.customer?.firstName},%0D%0A%0D%0AWe noticed you left some items in your cart...`
 }}
 className="focus-ring flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.11] hover:bg-white/[0.15] text-[#EDEAE2] text-[10px] font-bold uppercase tracking-wider rounded transition-colors shrink-0"
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
 <span className="text-[#EDEAE2]/55">Payment Status</span>
 <span className="text-xs text-rose-300 font-bold uppercase tracking-widest">ABANDONED</span>
 </div>
 <div className="space-y-2 pt-3 border-t border-white/10 font-inter">
 <div className="flex justify-between text-xs text-[#EDEAE2]/55">
 <span>Subtotal</span>
 <span>₦{order.subtotal?.toLocaleString()}</span>
 </div>
 <div className="flex justify-between text-xs text-[#EDEAE2]/55">
 <span>Shipping Fee</span>
 <span>₦{(order.shippingFee || order.shipping_fee)?.toLocaleString()}</span>
 </div>
 <div className="flex justify-between font-bold text-base pt-2 border-t border-white/10">
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

export default AbandonedCheckouts;