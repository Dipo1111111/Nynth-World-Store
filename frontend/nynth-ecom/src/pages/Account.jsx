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
        <div className="min-h-screen bg-white flex flex-col font-inter">
            <Header />

            <main className="flex-1 section-pad bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col items-start gap-4 mb-20">
                        <h1 className="hero-title text-black text-left">ACCOUNT</h1>
                        <p className="text-[10px] tracking-[0.3em] font-bold text-gray-400 uppercase">Manage your profile and artifacts.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
                        {/* Sidebar / Profile Info */}
                        <div className="lg:col-span-3">
                            <div className="space-y-12 lg:sticky lg:top-32">
                                <div className="flex flex-col items-start">
                                    <div className="w-24 h-24 bg-black text-white flex items-center justify-center text-3xl font-bold mb-8 shrink-0">
                                        {currentUser.photoURL ? (
                                            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            currentUser.displayName?.charAt(0) || <User size={32} />
                                        )}
                                    </div>
                                    <h2 className="text-[16px] tracking-widest font-bold uppercase mb-2">{currentUser.displayName || "User"}</h2>
                                    <p className="text-[11px] tracking-wider text-gray-400 uppercase font-bold break-all">{currentUser.email}</p>

                                    {isAdmin && (
                                        <div className="mt-4">
                                            <span className="text-[9px] tracking-[0.2em] font-bold uppercase bg-black text-white px-3 py-1">Admin Access</span>
                                        </div>
                                    )}
                                </div>

                                <nav className="flex flex-col gap-4">
                                    <button className="flex items-center justify-between w-full py-4 border-b border-black text-[11px] font-bold tracking-[0.3em] uppercase transition-all">
                                        Orders
                                        <ChevronRight size={14} />
                                    </button>
                                    {/* Future extensions */}
                                </nav>

                                <div className="pt-8">
                                    <button
                                        onClick={handleLogout}
                                        className="text-[10px] tracking-[0.3em] font-bold text-gray-400 hover:text-black uppercase transition-all"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content / Orders */}
                        <div className="lg:col-span-9 space-y-12">
                            {isAdmin && (
                                <div className="border border-black p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                    <div className="space-y-2">
                                        <h3 className="text-[14px] tracking-[0.2em] font-bold uppercase">Control Panel</h3>
                                        <p className="text-[11px] text-gray-400 tracking-wider uppercase font-bold">Comprehensive store management.</p>
                                    </div>
                                    <Link to="/admin" className="w-full md:w-auto bg-black text-white px-10 py-5 text-[11px] font-bold tracking-[0.3em] uppercase hover:opacity-90 transition-all text-center">
                                        Enter Dashboard
                                    </Link>
                                </div>
                            )}

                            <div className="space-y-10">
                                <h2 className="text-[12px] tracking-[0.3em] font-bold text-gray-400 uppercase border-b border-gray-100 pb-4">
                                    Recent Activity
                                </h2>

                                {loading ? (
                                    <div className="flex justify-center p-20 border border-gray-100">
                                        <Loader2 className="animate-spin text-black" size={32} />
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="border border-gray-100 p-20 text-center">
                                        <h3 className="text-[14px] tracking-widest font-bold uppercase mb-4">No artifacts discovered</h3>
                                        <p className="text-[11px] text-gray-400 tracking-wider uppercase font-bold mb-10">Your collection is empty.</p>
                                        <Link to="/shop" className="inline-block bg-black text-white px-12 py-5 text-[11px] font-bold tracking-[0.3em] uppercase hover:opacity-90 transition-all">
                                            Explore Collection
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {orders.map((order) => (
                                            <div key={order.id} className="border border-gray-100 p-8 hover:border-black transition-all group">
                                                <div className="flex flex-col md:flex-row justify-between md:items-start gap-8 mb-10 pb-8 border-b border-gray-100">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-[13px] tracking-widest font-bold uppercase">ID: {order.id.slice(0, 8)}</span>
                                                            <span className={`text-[9px] tracking-[0.2em] font-bold uppercase px-3 py-1 ${order.order_status === 'delivered' ? 'bg-green-50 text-green-700' :
                                                                    order.order_status === 'shipped' ? 'bg-blue-50 text-blue-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                                }`}>
                                                                {order.order_status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-400 tracking-wider uppercase font-bold">
                                                            Registered {new Date(order.created_at?.seconds * 1000).toLocaleDateString(undefined, {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="md:text-right space-y-2">
                                                        <p className="text-[10px] tracking-[0.2em] text-gray-400 font-bold uppercase">Transaction Total</p>
                                                        <p className="text-[18px] tracking-widest font-bold">₦{order.total?.toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-6">
                                                    {order.items?.map((item, idx) => (
                                                        <div key={idx} className="flex gap-6 items-center">
                                                            <div className="w-16 h-20 bg-gray-50 flex-shrink-0">
                                                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                                                                <div className="col-span-2">
                                                                    <p className="text-[12px] tracking-widest font-bold uppercase truncate">{item.name || item.title}</p>
                                                                    <p className="text-[10px] text-gray-400 tracking-wider uppercase font-bold mt-1">
                                                                        {item.size || item.selectedSize} / {item.color || item.selectedColor}
                                                                    </p>
                                                                </div>
                                                                <p className="text-[11px] font-bold tracking-widest text-center">QTY: {item.quantity}</p>
                                                                <p className="text-[11px] font-bold tracking-widest text-right">₦{(item.price * item.quantity).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
