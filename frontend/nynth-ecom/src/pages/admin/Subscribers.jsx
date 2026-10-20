import React, { useState, useEffect, useMemo } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminModal from "../../components/admin/AdminModal";
import { useAuth } from "../../context/AuthContext";
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
import AdminButton from "../../components/admin/AdminButton";
import AdminCard from "../../components/admin/AdminCard";
import AdminBadge from "../../components/admin/AdminBadge";
import { AdminInput } from "../../components/admin/AdminInput";
import StatCard from "../../components/admin/StatCard";
import { useCountUp } from "../../lib/motion";
import toast from "react-hot-toast";

// The four sources are statuses, so they use the status palette. They were
// raw Tailwind values before, which is why the newsletter badge was light
// grey on light grey and could not be read on the paper admin.
const SOURCE_CONFIG = {
 waitlist: { label: "Waitlist", variant: "ink" },
 newsletter: { label: "Newsletter", variant: "slate" },
 abandoned: { label: "Abandoned", variant: "amber" },
 customers: { label: "Customer", variant: "emerald" },
};

const SourceBadge = ({ source }) => {
 const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.newsletter;
 return <AdminBadge variant={config.variant}>{config.label}</AdminBadge>;
};

const Subscribers = () => {
 const { can: canAny } = useAuth();
 // Reading the list is one permission, emailing it is another.
 const canEmailSubscribers = canAny("store.subscribers.email");
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
  let date = null;
  if (!timestamp) return 'N/A';
  if (typeof timestamp === 'object' && timestamp.seconds) {
  date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
  date = timestamp;
  } else if (typeof timestamp === 'number') {
  date = new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
  } else if (typeof timestamp === 'string') {
  const parsed = new Date(timestamp);
  if (!isNaN(parsed.getTime())) date = parsed;
  }
  if (!date || isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', {
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
 <StatCard label="Total Audience" value={<span ref={totalRef}>0</span>} icon={Users} tint="slate" />
 <StatCard label="Waitlist Signups" value={<span ref={waitlistRef}>0</span>} icon={UserPlus} tint="violet" />
 <StatCard label="Customers" value={<span ref={customersRef}>0</span>} icon={ShoppingBag} tint="emerald" />
 <StatCard label="Abandoned Checkouts" value={<span ref={abandonedRef}>0</span>} icon={TrendingDown} tint="amber" />
 </div>

 {/* Toolbar: search + segmented filters + actions */}
 <div className="admin-toolbar mb-6">
 <div className="flex-1 min-w-[200px]">
 <AdminInput
 type="text"
 icon={Search}
 placeholder="Search emails..."
 aria-label="Search subscribers"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
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
 <AdminButton
 variant="secondary"
 size="sm"
 onClick={toggleSelectAll}
 >
 {selectedEmails.size === filteredSubscribers.length && filteredSubscribers.length > 0 ? "Deselect All" : "Select All"}
 </AdminButton>

 {/* Send Email Button */}
 {canEmailSubscribers && selectedEmails.size > 0 && (
 <AdminButton
 size="sm"
 icon={Send}
 onClick={() => setShowEmailModal(true)}
 className="shrink-0 animate-fadeIn"
 >
 Email {selectedEmails.size}
 </AdminButton>
 )}
 </div>
 </div>

 {loading ? (
 <div className="flex items-center justify-center h-64">
 <div className="text-center">
 <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--admin-ink)]/18 border-t-[var(--admin-ink)]/35 mx-auto mb-4"></div>
 <p className="text-[var(--admin-ink)]/55 text-sm">Loading subscribers...</p>
 </div>
 </div>
 ) : filteredSubscribers.length === 0 ? (
 <AdminCard>
 <div className="flex flex-col items-center justify-center py-16">
 <div className="w-16 h-16 rounded-xl bg-[var(--admin-ink)]/[0.06] flex items-center justify-center mb-4">
 <Users className="h-8 w-8 text-[var(--admin-ink)]/35" />
 </div>
 <h3 className="text-lg font-medium mb-2">
 {activeFilter === 'abandoned' ? 'No abandoned checkouts found' : activeFilter === 'customers' ? 'No customers found' : 'No subscribers found'}
 </h3>
 <p className="text-[var(--admin-ink)]/55 text-sm">
 {activeFilter === 'abandoned' ? 'Abandoned checkouts with an email will appear here.' : activeFilter === 'customers' ? 'Successful purchases will appear here.' : 'Signups from the website will appear here.'}
 </p>
 </div>
 </AdminCard>
 ) : (
 <AdminCard className="overflow-hidden">
 <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--admin-ink)]/10">
 <h3 className="text-base font-semibold">
 {activeFilter === 'all' ? 'All Subscribers' : activeFilter === 'abandoned' ? 'Abandoned Checkouts' : activeFilter === 'customers' ? 'Customers' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1) + ' Signups'}
 <span className="ml-2 px-2 py-0.5 bg-[var(--admin-ink)]/[0.06] text-[var(--admin-ink)]/60 text-[10px] rounded font-sans tracking-normal">
 {filteredSubscribers.length}
 </span>
 </h3>
 </div>
 <div>
 {/* Mobile Card View */}
 <div className="sm:hidden divide-y divide-[var(--admin-ink)]/10">
 {filteredSubscribers.map((sub) => (
 <div key={sub.id} className="p-4 bg-[var(--admin-surface)] flex flex-col gap-3">
 <div className="flex items-start justify-between gap-2">
 <div className="flex items-center gap-3 min-w-0 flex-1">
 <button onClick={() => toggleEmail(sub.email)} className="focus-ring shrink-0 rounded" aria-label="Toggle select">
 {selectedEmails.has(sub.email) ? (
 <CheckSquare size={18} className="text-[var(--admin-ink)]" />
 ) : (
 <Square size={18} className="text-[var(--admin-ink)]/35" />
 )}
 </button>
 <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
 <div className="w-8 h-8 rounded-lg bg-[var(--admin-accent)] text-[var(--admin-on-ink)] hidden sm:flex items-center justify-center flex-shrink-0">
 <Mail size={12} />
 </div>
 <span className="text-xs font-bold text-[var(--admin-ink)] break-all uppercase tracking-tight">
 {sub.email}
 </span>
 </div>
 </div>
 <SourceBadge source={sub.source} />
 </div>
 <div className="flex items-center justify-between text-[10px]">
 <div className="flex items-center gap-1.5">
 <div className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-[var(--tint-emerald-fg)]' : 'bg-[var(--admin-ink)]/25'}`}></div>
 <span className="text-[var(--admin-ink)]/55 font-bold uppercase tracking-widest">{sub.status || 'active'}</span>
 </div>
  <span className="text-[var(--admin-ink)]/42 font-bold uppercase tracking-widest">
  {formatDate(sub.subscribed_at ?? sub.created_at).split(',')[0]}
  </span>
 </div>
 </div>
 ))}
 </div>

 {/* Desktop Table View */}
 <div className="admin-panel rounded-xl hidden sm:block overflow-x-auto">
 <table className="w-full admin-table">
 <thead>
 <tr>
 <th className="px-4 py-4 text-left text-[10px] font-bold text-[var(--admin-ink)]/42 uppercase tracking-widest w-10">
 <button onClick={toggleSelectAll} className="focus-ring rounded" aria-label="Select all">
 {selectedEmails.size === filteredSubscribers.length && filteredSubscribers.length > 0 ? (
 <CheckSquare size={16} className="text-[var(--admin-ink)]" />
 ) : (
 <Square size={16} className="text-[var(--admin-ink)]/42" />
 )}
 </button>
 </th>
 <th className="px-4 py-4 text-left text-[10px] font-bold text-[var(--admin-ink)]/42 uppercase tracking-widest">Email</th>
 <th className="px-6 py-4 text-left text-[10px] font-bold text-[var(--admin-ink)]/42 uppercase tracking-widest">Source</th>
 <th className="px-6 py-4 text-left text-[10px] font-bold text-[var(--admin-ink)]/42 uppercase tracking-widest">Status</th>
 <th className="px-4 py-4 text-right text-[10px] font-bold text-[var(--admin-ink)]/42 uppercase tracking-widest">Signed Up</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[var(--admin-ink)]/10 bg-[var(--admin-surface)]">
 {filteredSubscribers.map((sub) => (
 <tr key={sub.id} className="group">
 <td className="px-4 py-4 whitespace-nowrap">
 <button onClick={() => toggleEmail(sub.email)} className="focus-ring rounded" aria-label="Toggle select">
 {selectedEmails.has(sub.email) ? (
 <CheckSquare size={16} className="text-[var(--admin-ink)]" />
 ) : (
 <Square size={16} className="text-[var(--admin-ink)]/35" />
 )}
 </button>
 </td>
 <td className="px-4 py-4 whitespace-nowrap">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-[var(--admin-ink)]/[0.06] flex items-center justify-center text-[var(--admin-ink)]/42 group-hover:bg-[var(--admin-hover)] transition-colors">
 <Mail size={14} />
 </div>
 <span className="text-sm font-medium text-[var(--admin-ink)] font-inter">{sub.email}</span>
 </div>
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <SourceBadge source={sub.source} />
 </td>
 <td className="px-6 py-4 whitespace-nowrap">
 <div className="flex items-center gap-2">
 <div className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-[var(--tint-emerald-fg)]' : 'bg-[var(--admin-ink)]/25'}`}></div>
 <span className="text-xs text-[var(--admin-ink)]/65 capitalize">{sub.status || 'active'}</span>
 </div>
 </td>
 <td className="px-4 py-4 whitespace-nowrap text-right">
  <span className="text-xs text-[var(--admin-ink)]/55 font-inter">{formatDate(sub.subscribed_at ?? sub.created_at)}</span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </AdminCard>
 )}

 {/* Email Modal */}
 {showEmailModal && (
 <AdminModal
 onClose={() => setShowEmailModal(false)}
 eyebrow="BCC Campaign"
 title="Send Email"
 size="md"
 >
 <div className="space-y-4">
 <div className="flex items-center gap-3 bg-[var(--tint-emerald-bg)] border border-[var(--tint-emerald-line)] rounded-lg px-4 py-3">
 <Mail size={16} className="text-[var(--tint-emerald-fg)] shrink-0" />
 <div className="text-sm text-[var(--tint-emerald-fg)]">
 <span className="font-bold">{selectedEmails.size}</span> recipient{selectedEmails.size !== 1 ? 's' : ''} selected
 </div>
 </div>
 <p className="text-xs text-[var(--admin-ink)]/42 leading-relaxed">
 Click the button below to open your email client with all recipients added as BCC. You'll compose and send the email yourself.
 </p>
 <div className="flex gap-3 pt-2">
 <AdminButton
 variant="secondary"
 size="block"
 onClick={() => setShowEmailModal(false)}
 className="flex-1"
 >
 Cancel
 </AdminButton>
 <AdminButton
 size="block"
 icon={Mail}
 onClick={handleSendEmail}
 className="flex-1"
 >
 Open Email
 </AdminButton>
 </div>
 </div>
 </AdminModal>
 )}
 </AdminLayout>
 );
};

export default Subscribers;