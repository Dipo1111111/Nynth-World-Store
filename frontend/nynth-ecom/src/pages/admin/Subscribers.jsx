import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchSubscribers, getAllOrders } from "../../api/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Users,
    Mail,
    Search,
    CheckSquare,
    Square,
    Send,
    X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import toast from "react-hot-toast";

const Subscribers = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
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

    return (
        <AdminLayout title="Subscribers">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                {/* Search Bar */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search emails..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-lg focus:outline-none focus:border-black transition-colors text-sm"
                    />
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap bg-gray-100 p-1 rounded-lg w-full sm:w-auto gap-1">
                    {["all", "waitlist", "newsletter", "abandoned", "customers"].map((f) => (
                        <button
                            key={f}
                            onClick={() => { setActiveFilter(f); setSelectedEmails(new Set()); }}
                            className={`min-w-0 flex-grow sm:flex-none text-center px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                activeFilter === f 
                                    ? "bg-white text-black shadow-sm" 
                                    : "text-gray-500 hover:text-black"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline"
                        onClick={toggleSelectAll}
                        className="text-[10px] tracking-widest font-bold uppercase h-9 px-4 border-gray-100 hover:border-black transition-colors"
                    >
                        {selectedEmails.size === filteredSubscribers.length && filteredSubscribers.length > 0 ? "Deselect All" : "Select All"}
                    </Button>

                    {/* Send Email Button */}
                    {selectedEmails.size > 0 && (
                        <Button 
                            onClick={() => setShowEmailModal(true)}
                            className="bg-black text-white hover:bg-gray-800 text-[10px] tracking-widest font-bold uppercase h-9 px-4 shrink-0 transition-all animate-fadeIn"
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                        <p className="text-gray-500 font-space text-sm">Loading subscribers...</p>
                    </div>
                </div>
            ) : filteredSubscribers.length === 0 ? (
                <Card className="border-gray-100 shadow-sm">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Users className="h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium mb-2 font-space">
                            {activeFilter === 'abandoned' ? 'No abandoned checkouts found' : activeFilter === 'customers' ? 'No customers found' : 'No subscribers found'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                            {activeFilter === 'abandoned' ? 'Abandoned checkouts with an email will appear here.' : activeFilter === 'customers' ? 'Successful purchases will appear here.' : 'Signups from the website will appear here.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-gray-50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-space">
                                {activeFilter === 'all' ? 'All Subscribers' : activeFilter === 'abandoned' ? 'Abandoned Checkouts' : activeFilter === 'customers' ? 'Customers' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1) + ' Signups'}
                                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full font-sans tracking-normal">
                                    {filteredSubscribers.length}
                                </span>
                            </CardTitle>

                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Mobile Card View */}
                        <div className="sm:hidden divide-y divide-gray-50">
                            {filteredSubscribers.map((sub) => (
                                <div key={sub.id} className="p-4 bg-white flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <button onClick={() => toggleEmail(sub.email)} className="focus:outline-none shrink-0">
                                                {selectedEmails.has(sub.email) ? (
                                                    <CheckSquare size={18} className="text-black" />
                                                ) : (
                                                    <Square size={18} className="text-gray-300" />
                                                )}
                                            </button>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 flex-1">
                                                <div className="w-8 h-8 rounded-full bg-black text-white hidden sm:flex items-center justify-center flex-shrink-0">
                                                    <Mail size={12} />
                                                </div>
                                                <span className="text-xs font-bold text-gray-900 break-all uppercase tracking-tight">
                                                    {sub.email}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                            sub.source === 'waitlist' 
                                                ? "bg-black text-white" 
                                                : sub.source === 'abandoned'
                                                ? "bg-red-50 text-red-500"
                                                : sub.source === 'customers'
                                                ? "bg-green-50 text-green-600"
                                                : "bg-gray-100 text-gray-600"
                                        }`}>
                                            {sub.source || 'newsletter'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px]">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
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
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest w-10">
                                            <button onClick={toggleSelectAll}>
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
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredSubscribers.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <button onClick={() => toggleEmail(sub.email)} className="focus:outline-none">
                                                    {selectedEmails.has(sub.email) ? (
                                                        <CheckSquare size={16} className="text-black" />
                                                    ) : (
                                                        <Square size={16} className="text-gray-300" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all">
                                                        <Mail size={14} />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 font-inter">{sub.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                                    sub.source === 'waitlist' 
                                                        ? "bg-black text-white" 
                                                        : sub.source === 'abandoned'
                                                        ? "bg-red-50 text-red-500"
                                                        : sub.source === 'customers'
                                                        ? "bg-green-50 text-green-600"
                                                        : "bg-gray-100 text-gray-600"
                                                }`}>
                                                    {sub.source || 'newsletter'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-bold font-space">Send Email</h3>
                            <button 
                                onClick={() => setShowEmailModal(false)}
                                className="text-gray-400 hover:text-black"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="text-sm text-gray-500">
                                <span className="font-bold text-black">{selectedEmails.size}</span> recipient{selectedEmails.size !== 1 ? 's' : ''} selected
                            </div>
                            <p className="text-xs text-gray-400">
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
