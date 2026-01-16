import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../api/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import { LogOut, Package, User, MapPin, ChevronRight, ShoppingBag } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { Badge } from "../components/ui/badge";

export default function Account() {
    const { currentUser, logout, isAdmin } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        // Real-time listener for user orders
        const q = query(
            collection(db, "orders"),
            where("userId", "==", currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => (b.created_at?.seconds || 0) - (a.created_at?.seconds || 0));

            setOrders(ordersData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching orders:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = "/";
        } catch (error) {
            console.error("Failed to logout", error);
        }
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case "pending": return "warning";
            case "processing": return "info";
            case "shipped": return "default";
            case "delivered": return "success";
            case "cancelled": return "destructive";
            default: return "secondary";
        }
    };

    if (!currentUser) return null;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            <main className="flex-1 section-pad bg-gray-50/50">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col items-start gap-2 mb-8">
                        <h1 className="font-space text-3xl font-bold">My Account</h1>
                        <p className="text-gray-500">Manage your orders and account settings.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                        {/* Sidebar / Profile Info */}
                        <div className="md:col-span-4 lg:col-span-3">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
                                <div className="flex flex-col items-center text-center mb-8 pt-4">
                                    <div className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shrink-0">
                                        {currentUser.photoURL ? (
                                            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            currentUser.displayName?.charAt(0) || <User />
                                        )}
                                    </div>
                                    <h2 className="font-space font-bold text-xl px-2">{currentUser.displayName || "User"}</h2>
                                    <p className="text-gray-500 text-sm break-all px-2">{currentUser.email}</p>
                                    {isAdmin && (
                                        <div className="mt-2">
                                            <Badge variant="outline">Admin</Badge>
                                        </div>
                                    )}
                                </div>

                                <nav className="space-y-1 mb-8">
                                    <button className="flex items-center gap-3 w-full p-3 bg-black text-white rounded-xl text-sm font-medium transition-all shadow-md">
                                        <Package size={18} />
                                        My Orders
                                        <ChevronRight size={16} className="ml-auto opacity-70" />
                                    </button>
                                    {/* Future: Add Address Book, Wishlist etc */}
                                </nav>

                                <div className="pt-6 border-t border-gray-100">
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 w-full p-3 rounded-xl transition-colors text-sm font-medium"
                                    >
                                        <LogOut size={18} />
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content / Orders */}
                        <div className="md:col-span-8 lg:col-span-9 space-y-6">
                            {isAdmin && (
                                <div className="bg-black text-white p-6 rounded-2xl shadow-lg flex justify-between items-center bg-[url('/noise.png')]">
                                    <div>
                                        <h3 className="font-space font-bold text-lg mb-1">Admin Dashboard</h3>
                                        <p className="text-gray-400 text-sm">Manage store overview and orders.</p>
                                    </div>
                                    <Link to="/admin" className="bg-white text-black px-6 py-3 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors">
                                        Go to Dashboard
                                    </Link>
                                </div>
                            )}

                            <h2 className="font-space text-lg font-bold flex items-center gap-2">
                                <Package size={20} />
                                Recent Orders
                            </h2>

                            {loading ? (
                                <div className="flex justify-center p-12 bg-white rounded-2xl border border-gray-100">
                                    <Loader2 className="animate-spin text-gray-400" size={32} />
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl border border-gray-100 text-center shadow-sm">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                                        <ShoppingBag size={24} />
                                    </div>
                                    <h3 className="font-space font-bold text-lg mb-2">No orders yet</h3>
                                    <p className="text-gray-500 mb-8 max-w-sm mx-auto">Looks like you haven't made any purchases yet. Check out our latest drops.</p>
                                    <Link to="/shop" className="bg-black text-white px-8 py-3 rounded-xl font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity">
                                        Start Shopping <ChevronRight size={16} />
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((order) => (
                                        <div key={order.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-6 border-b border-gray-50">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-space font-bold">Order #{order.id.slice(0, 8)}</span>
                                                        <Badge variant={getStatusVariant(order.order_status)} className="capitalize">
                                                            {order.order_status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        Placed on {new Date(order.created_at?.seconds * 1000).toLocaleDateString(undefined, {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500 mb-0.5">Total Amount</p>
                                                    <p className="font-space font-bold text-lg">₦{order.total?.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="flex gap-4 p-2 rounded-lg group-hover:bg-gray-50/50 transition-colors">
                                                        <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1 py-1">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        {item.selectedSize} / {item.selectedColor}
                                                                    </p>
                                                                </div>
                                                                <span className="text-sm font-medium">
                                                                    ₦{(item.price * item.quantity).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-400 mt-2">Qty: {item.quantity}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Order Footer - e.g. Tracking info could go here */}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
