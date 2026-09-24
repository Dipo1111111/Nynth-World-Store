import React, { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { supabase } from "../../api/supabase";
import { markTicketUsed } from "../../api/supabaseFunctions";
import { formatEventDate } from "../../utils/tickets";
import { Ticket, Search, Check, XCircle, AlertTriangle } from "lucide-react";

const CheckIn = () => {
    const [code, setCode] = useState("");
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState(null);
    const [marking, setMarking] = useState(false);

    const verify = async (e) => {
        e?.preventDefault();
        const normalized = code.trim().toUpperCase();
        if (!normalized) return;
        setChecking(true);
        setResult(null);
        try {
            const { data, error } = await supabase.functions.invoke("ticket-lookup", { body: { code: normalized } });
            if (error || !data?.found) {
                setResult({ state: "invalid", code: normalized });
            } else if (data.isTest) {
                setResult({ state: "test", code: normalized, ticket: data });
            } else if (data.order_status === "cancelled") {
                setResult({ state: "blocked", code: normalized, ticket: data, reason: "Order cancelled or refunded - do not admit." });
            } else if (data.payment_status !== "paid") {
                setResult({ state: "blocked", code: normalized, ticket: data, reason: "Not paid - do not admit." });
            } else if (data.used) {
                setResult({ state: "used", code: normalized, ticket: data });
            } else {
                setResult({ state: "valid", code: normalized, ticket: data });
            }
        } catch {
            setResult({ state: "error", code: normalized });
        } finally {
            setChecking(false);
        }
    };

    const confirmEntry = async () => {
        if (!result?.ticket?.orderId) return;
        setMarking(true);
        try {
            const updated = await markTicketUsed(result.ticket.orderId, result.code);
            setResult({ ...result, state: "used", ticket: { ...result.ticket, ...updated } });
        } catch {
            setResult({ ...result, state: "error" });
        } finally {
            setMarking(false);
        }
    };

    const reset = () => { setCode(""); setResult(null); };

    return (
        <AdminLayout title="Door Check-In">
            <div className="max-w-xl">
                <p className="text-sm text-[#EDEAE2]/55 mb-6">
                    Type the ticket code from the buyer's email. Valid codes can be marked used so no code walks in twice. Test, unpaid, and cancelled codes are flagged, never admitted.
                </p>

                <form onSubmit={verify} className="flex gap-3 mb-6">
                    <input
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="NWT-XXXXXXXX"
                        autoComplete="off"
                        spellCheck={false}
                        className="flex-1 min-w-0 px-4 py-3 bg-[#0a0a0a] border border-white/14 rounded-lg font-mono text-sm tracking-wider focus-ring placeholder:text-[#EDEAE2]/35 placeholder:font-sans placeholder:tracking-normal"
                    />
                    <button
                        type="submit"
                        disabled={checking || !code.trim()}
                        className="shrink-0 inline-flex items-center gap-2 bg-[#EDEAE2] text-[#0d0d0f] px-6 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-40 transition-all focus-ring"
                    >
                        <Search size={14} />
                        {checking ? "Checking" : "Verify"}
                    </button>
                </form>

                {!result && (
                    <div className="border border-dashed border-white/15 rounded-2xl p-10 text-center">
                        <Ticket size={28} className="mx-auto mb-3 text-[#EDEAE2]/25" />
                        <p className="text-sm text-[#EDEAE2]/45">No code checked yet. Results land here.</p>
                    </div>
                )}

                {result?.state === "valid" && (
                    <div className="border border-emerald-500/30 bg-emerald-500/[0.08] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">Valid ticket - admit one</p>
                        </div>
                        <p className="font-mono text-lg font-bold tracking-wider mb-1">{result.code}</p>
                        <p className="text-sm text-[#EDEAE2]/75 mb-1">{result.ticket.title}</p>
                        {(result.ticket.eventDateTime || result.ticket.venue) && (
                            <p className="text-xs text-[#EDEAE2]/55 mb-1">
                                {result.ticket.eventDateTime ? formatEventDate(result.ticket.eventDateTime) : ""}
                                {result.ticket.venue ? ` · ${result.ticket.venue}` : ""}
                            </p>
                        )}
                        <p className="text-xs text-[#EDEAE2]/55 mb-5">
                            {result.ticket.buyer ? `${result.ticket.buyer} - ` : ""}Order #{String(result.ticket.orderId || "").slice(0, 8).toUpperCase()}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={confirmEntry}
                                disabled={marking}
                                className="inline-flex items-center gap-2 bg-emerald-400 text-[#0d0d0f] px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all focus-ring"
                            >
                                <Check size={14} />
                                {marking ? "Marking" : "Mark used"}
                            </button>
                            <button
                                onClick={reset}
                                className="px-6 py-3 rounded-lg border border-white/15 text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/65 hover:text-[#EDEAE2] transition-colors focus-ring"
                            >
                                Next code
                            </button>
                        </div>
                    </div>
                )}

                {result?.state === "used" && (
                    <div className="border border-amber-500/30 bg-amber-500/[0.08] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={15} className="text-amber-300" />
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">Already used - do not admit</p>
                        </div>
                        <p className="font-mono text-lg font-bold tracking-wider mb-1">{result.code}</p>
                        {result.ticket?.title && <p className="text-sm text-[#EDEAE2]/75 mb-1">{result.ticket.title}</p>}
                        {(result.ticket?.eventDateTime || result.ticket?.venue) && (
                            <p className="text-xs text-[#EDEAE2]/55 mb-1">
                                {result.ticket.eventDateTime ? formatEventDate(result.ticket.eventDateTime) : ""}
                                {result.ticket.venue ? ` · ${result.ticket.venue}` : ""}
                            </p>
                        )}
                        {result.ticket?.used_at && (
                            <p className="text-xs text-[#EDEAE2]/55 mb-5">Admitted {new Date(result.ticket.used_at).toLocaleString()}</p>
                        )}
                        <button
                            onClick={reset}
                            className="px-6 py-3 rounded-lg border border-white/15 text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/65 hover:text-[#EDEAE2] transition-colors focus-ring"
                        >
                            Next code
                        </button>
                    </div>
                )}

                {result?.state === "test" && (
                    <div className="border border-sky-500/30 bg-sky-500/[0.08] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={15} className="text-sky-300" />
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-300">Test code - not a live ticket</p>
                        </div>
                        <p className="font-mono text-lg font-bold tracking-wider mb-1">{result.code}</p>
                        {result.ticket?.title && <p className="text-sm text-[#EDEAE2]/75 mb-5">{result.ticket.title}</p>}
                        <button
                            onClick={reset}
                            className="px-6 py-3 rounded-lg border border-white/15 text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/65 hover:text-[#EDEAE2] transition-colors focus-ring"
                        >
                            Next code
                        </button>
                    </div>
                )}

                {result?.state === "blocked" && (
                    <div className="border border-rose-500/30 bg-rose-500/[0.08] rounded-2xl p-6 text-center">
                        <XCircle size={28} className="mx-auto mb-3 text-rose-300" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-300 mb-2">
                            Do not admit
                        </p>
                        <p className="font-mono text-lg font-bold tracking-wider mb-1">{result.code}</p>
                        {result.ticket?.title && <p className="text-sm text-[#EDEAE2]/75 mb-2">{result.ticket.title}</p>}
                        <p className="text-sm text-[#EDEAE2]/65 mb-5">{result.reason}</p>
                        <button
                            onClick={reset}
                            className="px-6 py-3 rounded-lg border border-white/15 text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/65 hover:text-[#EDEAE2] transition-colors focus-ring"
                        >
                            Next code
                        </button>
                    </div>
                )}

                {(result?.state === "invalid" || result?.state === "error") && (
                    <div className="border border-rose-500/30 bg-rose-500/[0.08] rounded-2xl p-6 text-center">
                        <XCircle size={28} className="mx-auto mb-3 text-rose-300" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-300 mb-2">
                            {result.state === "invalid" ? "Code not found" : "Check failed"}
                        </p>
                        <p className="text-sm text-[#EDEAE2]/65 mb-5">
                            {result.state === "invalid"
                                ? "No paid order carries this code. Re-type it or turn the buyer away."
                                : "Something broke on our side. Try again."}
                        </p>
                        <button
                            onClick={reset}
                            className="px-6 py-3 rounded-lg border border-white/15 text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/65 hover:text-[#EDEAE2] transition-colors focus-ring"
                        >
                            Try another code
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default CheckIn;
