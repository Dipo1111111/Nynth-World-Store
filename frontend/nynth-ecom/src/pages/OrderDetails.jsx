import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import SEO from "../components/SEO";
import { useAuth } from "../context/AuthContext";
import { fetchOrder, fetchOrderByReference } from "../api/firebaseFunctions";
import { formatEventDate } from "../utils/tickets";
import { Ticket, ArrowLeft } from "lucide-react";

// Full detail for one of the buyer's orders. Ticket codes link
// out to their public passes, so the pass page is one tap away.
// Guests open this from the email link (/order/:id?ref=...): ownership is
// proven with the Paystack reference because RLS blocks guest reads.
export default function OrderDetails() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const ref = searchParams.get("ref") || "";
    const { currentUser } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await fetchOrder(id);
                let mine = data && (!data.userId || data.userId === currentUser?.id);
                let resolved = mine ? data : null;
                if (!resolved && ref) {
                    const viaLookup = await fetchOrderByReference(id, ref);
                    if (viaLookup) resolved = viaLookup;
                }
                if (!cancelled) setOrder(resolved);
            } catch {
                if (!cancelled) setOrder(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [id, currentUser, ref]);

    return (
        <div className="min-h-screen bg-white text-black flex flex-col">
            <SEO title={`Order ${String(id).slice(0, 8)} | NYNTH`} description="Your NYNTH WORLD order details." />
            <Header />
            <main className="flex-1 section-pad">
                <div className="max-w-3xl mx-auto">
                    <Link to={currentUser ? "/account" : "/shop"} className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] font-bold uppercase text-black/50 hover:text-black mb-8">
                        <ArrowLeft size={13} /> {currentUser ? "All orders" : "Back to shop"}
                    </Link>

                    {loading && <p className="text-sm text-black/50 tracking-widest uppercase font-bold">Loading order</p>}

                    {!loading && !order && (
                        <div className="text-center py-16">
                            <h1 className="text-3xl font-extrabold tracking-tight mb-3">Order not found</h1>
                            <p className="text-sm text-black/60 mb-8">It may belong to a different account, or the link is wrong. Guests should open the order from the link in the confirmation email.</p>
                            <Link to="/account" className="bg-black text-white px-8 py-4 text-[10px] tracking-[0.3em] font-bold uppercase">Back to account</Link>
                        </div>
                    )}

                    {!loading && order && (
                        <>
                            <p className="text-[11px] tracking-[0.3em] font-bold uppercase text-black/40 mb-2">
                                Order #{String(order.id).slice(0, 8).toUpperCase()} - {order.order_status}
                            </p>
                            <h1 className="text-4xl font-extrabold tracking-tight mb-8">₦{order.total?.toLocaleString()}</h1>

                            <div className="border border-black/10 divide-y divide-black/[0.06] mb-8">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 items-center">
                                        <div className="w-16 h-20 bg-gray-50 flex-shrink-0 overflow-hidden">
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[12px] tracking-widest font-bold uppercase truncate">{item.name || item.title}</p>
                                            {item.category === "tickets" ? (
                                                <>
                                                    <p className="text-[10px] text-gray-400 tracking-wider uppercase font-bold mt-1 flex items-center gap-1">
                                                        <Ticket size={11} className="shrink-0" />
                                                        E-TICKET{item.eventDateTime ? ` - ${formatEventDate(item.eventDateTime)}` : ""}{item.venue ? ` · ${item.venue}` : ""}
                                                    </p>
                                                    {(order.tickets || []).filter((t) => t.productId === item.id).map((t, i) => (
                                                        <Link key={i} to={`/ticket/${t.code}`} className="block font-mono text-[11px] font-bold tracking-widest mt-1 underline underline-offset-4 decoration-black/20 hover:decoration-black">
                                                            {t.code} {t.used ? "- USED" : "- VIEW PASS"}
                                                        </Link>
                                                    ))}
                                                </>
                                            ) : (
                                                <p className="text-[10px] text-gray-400 tracking-wider uppercase font-bold mt-1">
                                                    {item.size || item.selectedSize} / {item.color || item.selectedColor} - Qty {item.quantity}
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-[11px] font-bold tracking-widest">₦{(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 text-sm">
                                {(order.customer?.firstName || order.customer?.address) && (
                                    <div>
                                        <p className="text-[10px] tracking-[0.3em] font-bold uppercase text-black/40 mb-2">Shipping</p>
                                        <p className="font-bold uppercase text-xs tracking-widest">{order.customer?.firstName} {order.customer?.lastName}</p>
                                        <p className="text-black/60 text-xs mt-1 uppercase">{order.customer?.address}</p>
                                        <p className="text-black/60 text-xs uppercase">{order.customer?.city}, {order.customer?.state}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] tracking-[0.3em] font-bold uppercase text-black/40 mb-2">Summary</p>
                                    <div className="flex justify-between text-xs text-black/60 uppercase font-bold tracking-widest py-1">
                                        <span>Subtotal</span><span>₦{order.subtotal?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-black/60 uppercase font-bold tracking-widest py-1">
                                        <span>Shipping</span><span>₦{(order.shippingFee || order.shipping_fee)?.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline font-bold pt-2 mt-1 border-t border-black/10">
                                        <span className="text-[11px] uppercase tracking-widest">Total</span>
                                        <span className="text-xl font-extrabold tabular-nums">₦{order.total?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
