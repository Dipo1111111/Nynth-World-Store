import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchSubscribers, mergeSubscriberDuplicates } from "../../api/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Users,
    Mail,
    Search,
    Filter,
    Calendar,
    ArrowRight
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
    const [isMerging, setIsMerging] = useState(false);

    useEffect(() => {
        document.title = "Nynth World Store Admin | Subscribers";
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await fetchSubscribers();
            setSubscribers(data);
            setFilteredSubscribers(data);
        } catch (error) {
            console.error('Error fetching subscribers:', error);
            toast.error('Failed to load subscribers');
        } finally {
            setLoading(false);
        }
    };

    const handleMerge = async () => {
        if (!window.confirm("This will find all duplicate emails and merge them into single entries (keeping the oldest signup). Proceed?")) return;
        
        setIsMerging(true);
        try {
            const result = await mergeSubscriberDuplicates();
            if (result.success) {
                toast.success(`Succesfully merged ${result.mergedCount} duplicates.`);
                fetchData();
            }
        } catch (error) {
            toast.error("Failed to merge duplicates");
        } finally {
            setIsMerging(false);
        }
    };

    useEffect(() => {
        let results = subscribers;
        
        // 1. Deduplicate by email first (Frontend safety)
        const uniqueMap = new Map();
        results.forEach(sub => {
            const email = sub.email?.trim().toLowerCase();
            if (!email) return;
            // Keep the one we have, or if it's new, add it. 
            // Since subscribers is ordered by date desc, this keeps the NEWEST by default.
            // But we might want the OLDEST as the 'primary'. 
            // Let's actually sort by date before deduplicating to be sure.
            if (!uniqueMap.has(email)) {
                uniqueMap.set(email, sub);
            }
        });
        results = Array.from(uniqueMap.values());

        // 2. Filter by source
        if (activeFilter !== "all") {
            results = results.filter(sub => sub.source === activeFilter);
        }
        
        // 3. Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            results = results.filter(sub => 
                sub.email?.toLowerCase().includes(term) ||
                sub.id?.toLowerCase().includes(term)
            );
        }
        
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
                <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto overflow-x-auto no-scrollbar max-w-full">
                    {["all", "waitlist", "newsletter"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                                activeFilter === f 
                                    ? "bg-white text-black shadow-sm" 
                                    : "text-gray-500 hover:text-black"
                            }`}
                        >
                            {f}
                        </button>
                    ))}
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
                        <h3 className="text-lg font-medium mb-2 font-space">No subscribers found</h3>
                        <p className="text-gray-500 text-sm">Signups from the website will appear here.</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-gray-50">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-space">
                                {activeFilter === 'all' ? 'All Subscribers' : activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1) + ' Signups'}
                                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded-full font-sans tracking-normal">
                                    {filteredSubscribers.length}
                                </span>
                            </CardTitle>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleMerge}
                                disabled={isMerging}
                                className="text-[10px] tracking-widest font-bold uppercase border-black/10 hover:bg-black hover:text-white transition-all h-8"
                            >
                                {isMerging ? "Merging..." : "Clean Duplicates"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Mobile Card View */}
                        <div className="sm:hidden divide-y divide-gray-50">
                            {filteredSubscribers.map((sub) => (
                                <div key={sub.id} className="p-4 bg-white flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0">
                                                <Mail size={12} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-900 truncate uppercase tracking-tight">
                                                {sub.email}
                                            </span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                            sub.source === 'waitlist' 
                                                ? "bg-black text-white" 
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
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Source</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-4 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Signed Up</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredSubscribers.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
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
        </AdminLayout>
    );
};

export default Subscribers;
