import React, { useState, useEffect, useMemo } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchSubscribers, getAllOrders } from "../../api/firebaseFunctions";
import {
 Users,
 Mail,
 Search,
 CheckSquare,
 Square,
 Send,
 X,
 UserPlus,
 ShoppingBag,
 TrendingDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useCountUp } from "../../lib/motion";
import toast from "react-hot-toast";

const SOURCE_CONFIG = {
 waitlist: { label: "Waitlist", className: "bg-black text-white border-black" },
 newsletter: { label: "Newsletter", className: "bg-slate-100 text-slate-600 border-slate-200" },
 abandoned: { label: "Abandoned", className: "bg-amber-50 text-amber-700 border-amber-100" },
 customers: { label: "Customer", className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
};

const SourceBadge = ({ source }) => {
 const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.newsletter;
 return (
 <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${config.className}`}>
 {config.label}
 </span>
 );
};

const StatIcon = ({ icon: Icon, className }) => (
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${className}`}>
 <Icon size={17} strokeWidth={2} />
 </div>
);

const Subscribers = () => {
 const [subscribers, setSubscribers] = useState([]);
 const [filteredSubscribers, setFilteredSubscribers] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState("");
 const [activeFilter, setActiveFilter] = useState("all");
 const [selectedEmails, setSelectedEmails] = useState(new Set());
 const [showEmailModal, setShowEmailModal] = useState(false);

 useEffect(() => {
 document.title = "Nynth World Store Admin | Subscribers";
 fetchData();
 }, []);

 const fetchData = async () => {
 setLoading(true);
 try {
 const data = await fetchSubscribers();

 // Also fetch raw orders
 const rawOrders = await getAllOrders();
 const abandonedOrders = rawOrders.filter(o =>
 o.payment_status === 'pending' ||
 !o.payment_status
 );

 const completedOrders = rawOrders.filter(o =>
 o.payment_status === 'paid' ||
 o.payment_status === 'success'
 );

 // Create "subscriber" objects for abandoned checkouts
 const abandonedSubscribers = abandonedOrders
 .filter(o => o.customer?.email)
 .map(o => ({
 id: `abandoned_${o.id}`,
 email: o.customer.email,
 source: "abandoned",
 status: "active",
 subscribed_at: o.created_at,
 firstName: o.customer.firstName,
 lastName: o.customer.lastName,
 orderId: o.id
 }));

 // Create "subscriber" objects for completed checkouts
 const customerSubscribers = completedOrders
 .filter(o => o.customer?.email)
 .map(o => ({
 id: `customer_${o.id}`,
 email: o.customer.email,
 source: "customers",
 status: "active",
 subscribed_at: o.created_at,
 firstName: o.customer.firstName,
 lastName: o.customer.lastName,
 orderId: o.id
 }));

 const combinedData = [...data, ...abandonedSubscribers, ...customerSubscribers];
 setSubscribers(combinedData);
 setFilteredSubscribers(combinedData);
 } catch (error) {
 console.error('Error fetching subscribers:', error);
 toast.error('Failed to load subscribers');
 } finally {
 setLoading(false);
 }
 };



 const toggleSelectAll = () => {
 if (selectedEmails.size === filteredSubscribers.length) {
 setSelectedEmails(new Set());
 } else {
 setSelectedEmails(new Set(filteredSubscribers.map(sub => sub.email)));
 }
 };

 const toggleEmail = (email) => {
 const newSelected = new Set(selectedEmails);
 if (newSelected.has(email)) {
 newSelected.delete(email);
 } else {
 newSelected.add(email);
 }
 setSelectedEmails(newSelected);
 };

 const handleSendEmail = () => {
 const emails = Array.from(selectedEmails).join(',');
 const mailtoUrl = `mailto:?bcc=${encodeURIComponent(emails)}`;
 window.location.href = mailtoUrl;
 setShowEmailModal(false);
 setSelectedEmails(new Set());
 toast.success("Opening email client...");
 };

 useEffect(() => {
 let results = subscribers;

 // 1. Filter by source FIRST so we don't accidentally remove an abandoned checkout because they are also on the waitlist
 if (activeFilter !== "all") {
 results = results.filter(sub => sub.source === activeFilter);
 }

 // 2. Filter by search term
 if (searchTerm) {
 const term = searchTerm.toLowerCase();
 results = results.filter(sub =>
 sub.email?.toLowerCase().includes(term) ||
 sub.id?.toLowerCase().includes(term)
 );
 }

 // 3. Deduplicate by email
 const uniqueMap = new Map();
 results.forEach(sub => {
 const email = sub.email?.trim().toLowerCase();
 if (!email) return;
 if (!uniqueMap.has(email)) {
 uniqueMap.set(email, sub);
 }
 });
 results = Array.from(uniqueMap.values());

 setFilteredSubscribers(results);
 }, [searchTerm, activeFilter, subscribers]);

 const formatDate = (timestamp) => {
 if (!timestamp || !timestamp.seconds) return 'N/A';
 return new Date(timestamp.seconds * 1000).toLocaleString('en-US', {
 year: 'numeric',
 month: 'short',
 day: 'numeric',
 hour: '2-digit',
 minute: '2-digit'
 });
 };

 // Count-up stats (live across the whole dataset, not the filtered view).
 const stats = useMemo(() => {
 const unique = Array.from(
 new Map(subscribers.map(s => [s.email?.trim().toLowerCase(), s])).values()
 );
 return {
 total: unique.length,
 waitlist: unique.filter(s => s.source === 'waitlist').length,
 customers: unique.filter(s => s.source === 'customers').length,
 abandoned: unique.filter(s => s.source === 'abandoned').length,
 };
 }, [subscribers]);

 const totalRef = useCountUp(stats.total);
 const waitlistRef = useCountUp(stats.waitlist);
 const customersRef = useCountUp(stats.customers);
 const abandonedRef = useCountUp(stats.abandoned);

 return (
 <AdminLayout title="Subscribers">
 {/* Summary strip */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
 <Card hover className="border-black/[0.06]">
 <CardContent className="p-4">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Audience</span>
 <StatIcon icon={Users} className="bg-slate-100 text-slate-600" />
 </div>
 <h3 className="text-xl font-bold text-gray-900"><span ref={totalRef}>0</span></h3>
 </CardContent>
 </Card>
 <Card hover className="border-black/[0.06]">
 <CardContent className="p-4">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Waitlist Signups</span>
 <StatIcon icon={UserPlus} className="bg-violet-50 text-violet-600" />
 </div>
 <h3 className="text-xl font-bold text-gray-900"><span ref={waitlistRef}>0</span></h3>
 </CardContent>
 </Card>
 <Card hover className="border-black/[0.06]">
 <CardContent className="p-4">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Customers</span>
 <StatIcon icon={ShoppingBag} className="bg-emerald-50 text-emerald-600" />
 </div>
 <h3 className="text-xl font-bold text-gray-900"><span ref={customersRef}>0</span></h3>
 </CardContent>
 </Card>
 <Card hover className="border-black/[0.06]">
 <CardContent className="p-4">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Abandoned Checkouts</span>
 <StatIcon icon={TrendingDown} className="bg-amber-50 text-amber-600" />
 </div>
 <h3 className="text-xl font-bold text-gray-900"><span ref={abandonedRef}>0</span></h3>
 </CardContent>
 </Card>
 </div>

 {/* Toolbar: search + segmented filters + actions */}
 <div className="admin-toolbar mb-6">
 <div className="relative flex-1 min-w-[200px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
 <input
 type="text"
 placeholder="Search emails..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-10 pr-4 py-2 bg-white border border-black/[0.08] rounded-lg focus-ring text-sm placeholder:text-gray-400"
 />
 </div>

 <div className="segmented-control w-full sm:w-auto">
 {["all", "waitlist", "newsletter", "abandoned", "customers"].map((f) => (
 <button
 key={f}
 onClick={() => { setActiveFilter(f); setSelectedEmails(new Set()); }}
 className={`segmented-control__item flex-grow sm:flex-none capitalize ${activeFilter === f ? "segmented-control__item--active" : ""}`}
 >
 {f}
 </button>
 ))}
 </div>

 <div className="flex items-center gap-2">
 <Button
 variant="outline"
 onClick={toggleSelectAll}
 className="text-[10px] tracking-widest font-bold uppercase h-9 px-4"
 >
 {selectedEmails.size === filteredSubscribers.length && filteredSubscribers.length > 0 ? "Deselect All" : "Select All"}
 </Button>

 {/* Send Email Button */}
 {selectedEmails.size > 0 && (
 <Button
 onClick={() => setShowEmailModal(true)}
 className="text-[10px] tracking-widest font-bold uppercase h-9 px-4 shrink-0 transition-all animate-fadeIn"
 >
 <Send size={14} className="mr-2" />
 Email {selectedEmails.size}
 </Button>
 )}
 </div>
 </div>

 {loading ? (
 <div className="flex items-center justify-center h-64">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-2 border-black/10 border-t-black mx-auto mb-4"></div>
 <p className="text-gray-500 text-sm">Loading subscribers...</p>
 </div>
 </div>
 ) : filteredSubscribers.length === 0 ? (
 <Card className="border-black/[0.06]">
 <CardContent className="flex flex-col items-center justify-center py-16">
 <div className="w-16 h-16 rounded-2xl bg-black/[0.04] flex items-center justify-center mb-4">
 <Users className="h-8 w-8 text-gray-300" />
 </div>
 <h3 className="text-lg font-medium mb-2">
 {activeFilter === 'abandoned' ? 'No abandoned checkouts found' : activeFilter === 'customers' ? 'No customers found' : 'No subscribers found'}
 </h3>
 <p className="text-gray-500 text-sm">
 {activeFilter === 'abandoned' ? 'Abandoned checkouts with an email will appear here.' : activeFilter === 'customers' ? 'Successful purchases will appear here.' : 'Signups from the website will appear here.'}
 </p>
 </CardContent>
 </Card>
 ) : (
 <Card className="border-black/[0.06] overflow-hidden">
 <CardHeader className="border-b border-black/[0.06]">
 <div className="flex items-center justify-between">
 <CardTitle className="text-base">
 {activeFilter === 'all' ? 'All Subscribers' : activeFilter === 'abandoned' ? 'Abandoned Checkouts' : activeFilter === 'customers' ? 'Customers' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1) + ' Signups'}
 <span className="ml-2 px-2 py-0.5 bg-black/[0.05] text-gray-500 text-[10px] rounded-lg font-sans tracking-normal">
 {filteredSubscribers.length}
 </span>
 </CardTitle>

 </div>
 </CardHeader>
 <CardContent className="p-0">
 {/* Mobile Card View */}
 <div className="sm:hidden divide-y divide-black/[0.04]">
 {filteredSubscribers.map((sub) => (
 <div key={sub.id} className="p-4 bg-white flex flex-col gap-3">
 <div className="flex items-start justify-between gap-2">
 <div className="flex items-center gap-3 min-w-0 flex-1">
 <button onClick={() => toggleEmail(sub.email)} className="focus-ring shrink-0 rounded" aria-label="Toggle select">
 {selectedEmails.has(sub.email) ? (
 <CheckSquare size={18} className="text-black" />
 ) : (
 <Square size={18} className="text-gray-300" />
 )}
 </button>
 <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
 <div className="w-8 h-8 rounded-lg bg-black text-white hidden sm:flex items-center justify-center flex-shrink-0">
 <Mail size={12} />
 </div>
 <span className="text-xs font-bold text-gray-900 break-all uppercase tracking-tight">
 {sub.email}
 </span>
 </div>
 </div>
 <SourceBadge source={sub.source} />
 </div>
 <div className="flex items-center justify-between text-[10px]">
 <div className="flex items-center gap-1.5">
 <div className={`w-1.5 h-1.5 rounded-lg ${sub.status === 'active' ? 'bg-emerald-500' : 'bg-black/[0.15]'}`}></div>
 <span className="text-gray-500 font-bold uppercase tracking-widest">{sub.status || 'active'}</span>
 </div>
 <span className="text-gray-400 font-bold uppercase tracking-widest">
 {formatDate(sub.subscribed_at).split(',')[0]}
 </span>
 </div>
 </div>
 ))}
 </div>

 {/* Desktop Table View */}
 <div className="hidden sm:block overflow-x-auto">
 <table className="w-full admin-table">
 <thead>
 <tr className="bg-black/[0.02]">
 <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest w-10">
 <button onClick={toggleSelectAll} className="focus-ring rounded" aria-label="Select all">
 {selectedEmails.size === filteredSubscribers.length && filteredSubscribers.length > 0 ? (
 <CheckSquare size={16} className="text-black" />
 ) : (
 <Square size={16} className="text-gray-400" />
 )}
 </button>
 </th>
 <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
 <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Source</th>
 <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
 <th className="px-4 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Signed Up</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-black/[0.05] bg-white">
 {filteredSubscribers.map((sub) => (
 <tr key={sub.id} className="transition-colors group hover:bg-black/[0.02]">
 <td className="px-4 py-4 whitespace-nowrap">
 <button onClick={() => toggleEmail(sub.email)} className="focus-ring rounded" aria-label="Toggle select">
 {selectedEmails.has(sub.email) ? (
 <CheckSquare size={16} className="text-black" />
 ) : (
 <Square size={16} className="text-gray-300" />
 )}
 </button>
 </td>
 <td className="px-4 py-4 whitespace-nowrap">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-black/[0.04] flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
 <Mail size={14} />
 </div>
 <span className="text-sm font-medium text-gray-900 font-inter">{sub.email}</span>
 </div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <SourceBadge source={sub.source} />
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="flex items-center gap-2">
 <div className={`w-1.5 h-1.5 rounded-lg ${sub.status === 'active' ? 'bg-emerald-500' : 'bg-black/[0.15]'}`}></div>
 <span className="text-xs text-gray-600 capitalize">{sub.status || 'active'}</span>
 </div>
 </td>
 <td className="px-4 py-4 whitespace-nowrap text-right">
 <span className="text-xs text-gray-500 font-inter">{formatDate(sub.subscribed_at)}</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Email Modal */}
 {showEmailModal && (
 <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl shadow-raised max-w-lg w-full max-h-[90vh] overflow-y-auto border border-black/[0.06]">
 <div className="flex items-center justify-between p-6 border-b border-black/[0.06]">
 <div>
 <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">BCC Campaign</p>
 <h3 className="text-lg font-bold text-gray-900">Send Email</h3>
 </div>
 <button
 onClick={() => setShowEmailModal(false)}
 className="focus-ring p-2 hover:bg-black/[0.04] rounded-lg text-gray-400 hover:text-black transition-colors"
 >
 <X size={20} />
 </button>
 </div>
 <div className="p-6 space-y-4">
 <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
 <Mail size={16} className="text-emerald-600 shrink-0" />
 <div className="text-sm text-emerald-800">
 <span className="font-bold">{selectedEmails.size}</span> recipient{selectedEmails.size !== 1 ? 's' : ''} selected
 </div>
 </div>
 <p className="text-xs text-gray-400 leading-relaxed">
 Click the button below to open your email client with all recipients added as BCC. You'll compose and send the email yourself.
 </p>
 <div className="flex gap-3 pt-2">
 <Button
 variant="outline"
 onClick={() => setShowEmailModal(false)}
 className="flex-1"
 >
 Cancel
 </Button>
 <Button
 onClick={handleSendEmail}
 className="flex-1 bg-black text-white hover:bg-gray-800"
 >
 <Mail size={14} className="mr-2" />
 Open Email
 </Button>
 </div>
 </div>
 </div>
 </div>
 )}
 </AdminLayout>
 );
};

export default Subscribers;