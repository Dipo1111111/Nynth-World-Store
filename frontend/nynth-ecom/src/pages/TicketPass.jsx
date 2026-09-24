import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/home/Header";
import Footer from "../components/home/Footer";
import SEO from "../components/SEO";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabase";
import { markTicketUsed } from "../api/supabaseFunctions";
import { formatEventDate, eventHasPassed } from "../utils/tickets";
import { Ticket, Check, XCircle, AlertTriangle } from "lucide-react";
import QRCode from "react-qr-code";

// Public ticket pass: opened from the email link or a door scan.
// Anyone can see validity + event. Only signed-in admins can mark used.
export default function TicketPass() {
    const { code } = useParams();
    const { isAdmin } = useAuth();
    const [pass, setPass] = useState(null);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data, error } = await supabase.functions.invoke("ticket-lookup", {
                    body: { code },
                });
                if (!cancelled) setPass(error ? { found: false, error: true } : data);
            } catch {
                if (!cancelled) setPass({ found: false, error: true });
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [code]);

    const confirmEntry = async () => {
        if (!pass?.orderId) return;
        setMarking(true);
        try {
            const updated = await markTicketUsed(pass.orderId, pass.code);
            setPass({ ...pass, used: true, used_at: updated.used_at });
        } catch {
            // Someone may have admitted it first: refetch so the pass shows the truth.
            try {
                const { data } = await supabase.functions.invoke("ticket-lookup", { body: { code: pass.code } });
                if (data?.found) setPass(data);
                else setPass({ ...pass, error: true });
            } catch {
                setPass({ ...pass, error: true });
            }
        } finally {
            setMarking(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-black flex flex-col">
            <SEO title={`Ticket ${code} | NYNTH`} description="NYNTH WORLD e-ticket pass." />
            <Header />
            <main className="flex-1 flex items-center justify-center section-pad">
                <div className="text-center max-w-md w-full">
                    {loading && <p className="text-sm text-black/50 tracking-widest uppercase font-bold">Checking ticket</p>}

                    {!loading && (!pass?.found) && (
                        <>
                            <XCircle size={40} className="mx-auto mb-4 text-black/25" />
                            <p className="text-[11px] tracking-[0.3em] font-bold uppercase text-black/40 mb-3">Ticket check</p>
                            <h1 className="text-3xl font-extrabold tracking-tight mb-3">Code not found</h1>
                            <p className="text-sm text-black/60 mb-8">No paid order carries this code. Check the spelling or contact us.</p>
                            <Link to="/shop" className="bg-black text-white px-8 py-4 text-[10px] tracking-[0.3em] font-bold uppercase">Back to shop</Link>
                        </>
                    )}

                    {!loading && pass?.found && (
                        <>
                            <p className="text-[11px] tracking-[0.3em] font-bold uppercase text-black/40 mb-3">
                                {pass.order_status === "cancelled" || (pass.payment_status && pass.payment_status !== "paid")
                                    ? "No longer valid"
                                    : pass.isTest
                                        ? "Test pass"
                                        : pass.used ? "Already used" : eventHasPassed(pass.eventDateTime) ? "Event ended" : "Valid e-ticket"}
                            </p>
                            <div className={`border p-8 mb-6 ${pass.used ? "border-amber-300 bg-amber-50" : "border-black"}`}>
                                {!pass.used && !eventHasPassed(pass.eventDateTime) && !pass.isTest && pass.order_status !== "cancelled" && (!pass.payment_status || pass.payment_status === "paid") && (
                                    <div className="bg-white p-4 inline-block mb-4">
                                        <QRCode value={`${window.location.origin}/ticket/${pass.code}`} size={200} level="M" />
                                    </div>
                                )}
                                <p className="font-mono text-2xl font-bold tracking-widest mb-2">{pass.code}</p>
                                <p className="text-sm font-bold uppercase tracking-widest">{pass.title}</p>
                                {pass.eventDateTime && <p className="text-xs text-black/60 mt-1">{formatEventDate(pass.eventDateTime)}</p>}
                                {pass.venue && <p className="text-xs text-black/60">{pass.venue}</p>}
                                {pass.used && (
                                    <p className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                                        <AlertTriangle size={12} /> Admitted{pass.used_at ? ` ${new Date(pass.used_at).toLocaleString()}` : ""}
                                    </p>
                                )}
                                {pass.isTest && (
                                    <p className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black/50">
                                        <AlertTriangle size={12} /> Test pass - not a live ticket
                                    </p>
                                )}
                                {(pass.order_status === "cancelled" || (pass.payment_status && pass.payment_status !== "paid")) && (
                                    <p className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black/50">
                                        <AlertTriangle size={12} /> {pass.order_status === "cancelled" ? "Order cancelled or refunded" : "Order never paid"}
                                    </p>
                                )}
                            </div>
                            {!pass.used && !eventHasPassed(pass.eventDateTime) && !pass.isTest && pass.order_status !== "cancelled" && (!pass.payment_status || pass.payment_status === "paid") && isAdmin && (
                                <button
                                    onClick={confirmEntry}
                                    disabled={marking}
                                    className="w-full bg-black text-white px-8 py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Check size={14} />
                                    {marking ? "Marking" : "Admit - mark used"}
                                </button>
                            )}
                            {!pass.used && !isAdmin && pass.buyer && (
                                <p className="text-sm text-black/60">See you there, {pass.buyer}.</p>
                            )}
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
