import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import { verifyTicketEntry, lookupTicketStatus } from "../../api/firebaseFunctions";
import { formatEventDate } from "../../utils/tickets";
import { Ticket, Search, Check, XCircle, AlertTriangle, ShieldCheck, Lock } from "lucide-react";

const PAYMENT_CHIP = {
  paid: "bg-emerald-500/[0.14] text-emerald-300 border-emerald-500/25",
  pending: "bg-amber-500/[0.14] text-amber-300 border-amber-500/25",
  failed: "bg-rose-500/[0.14] text-rose-300 border-rose-500/25",
  refunded: "bg-slate-500/[0.18] text-slate-300 border-slate-500/30",
};

const TICKET_CHIP = {
  valid: "bg-emerald-500/[0.14] text-emerald-300 border-emerald-500/25",
  cancelled: "bg-slate-500/[0.18] text-slate-300 border-slate-500/30",
  revoked: "bg-rose-500/[0.14] text-rose-300 border-rose-500/25",
};

const ENTRY_CHIP = {
  unused: "bg-sky-500/[0.14] text-sky-300 border-sky-500/25",
  used: "bg-white/[0.07] text-[#EDEAE2]/60 border-white/15",
};

const Chip = ({ map, value, children }) => (
  <span
    className={`text-[9px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider border ${map[value] ?? ENTRY_CHIP.unused}`}
  >
    {children ?? value}
  </span>
);

const REASON_COPY = {
  not_found: "No paid order carries this code. Re-type it or turn the buyer away.",
  not_paid: "Not paid. Do not admit.",
  cancelled: "Cancelled. Do not admit.",
  revoked: "Revoked. Do not admit.",
  forbidden: "You do not have permission to verify tickets.",
  forbidden_event: "This ticket belongs to an event you are not assigned to.",
  test: "Test code - not a live ticket. Do not admit.",
  empty: "Type a ticket code first.",
  error: "Something broke on our side. Try again.",
};

// The door. Search a code, read its three statuses, admit it once. The check and
// the write are one statement in Postgres, so a screenshot admitted at one gate
// is refused at the next, with the time and the staff account that took it.
const CheckIn = () => {
    const { can, currentUser } = useAuth();
    const [code, setCode] = useState("");
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState(null);
    const [marking, setMarking] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const verify = async (e) => {
        e?.preventDefault();
        const normalized = code.trim().toUpperCase();
        if (!normalized) return;
        setChecking(true);
        setResult(null);
        try {
            const data = await lookupTicketStatus(normalized);
            if (!data?.found) {
                setResult({ state: "invalid", code: normalized, reason: data?.reason ?? "not_found" });
            } else if (data.is_test) {
                // Paystack test traffic is never a real admission. Flagged, no
                // admit button, matching the behaviour before the atomic rewrite.
                setResult({ state: "test", code: normalized, ticket: data });
            } else if (data.ticket_status !== "valid") {
                setResult({ state: "blocked", code: normalized, ticket: data, reason: data.ticket_status });
            } else if (data.payment_status !== "paid") {
                setResult({ state: "blocked", code: normalized, ticket: data, reason: "not_paid" });
            } else if (data.entry_status === "used") {
                setResult({ state: "used", code: normalized, ticket: data });
            } else {
                setResult({ state: "valid", code: normalized, ticket: data });
            }
        } catch {
            setResult({ state: "invalid", code: normalized, reason: "error" });
        } finally {
            setChecking(false);
        }
    };

    const confirmEntry = async () => {
        if (!result?.code) return;
        setMarking(true);
        try {
            const data = await verifyTicketEntry(result.code);
            if (data?.ok) {
                setResult({ state: "admitted", code: result.code, ticket: data });
            } else if (data?.reason === "already_used") {
                setResult({ state: "used", code: result.code, ticket: data });
            } else {
                setResult({ state: "blocked", code: result.code, ticket: data, reason: data?.reason });
            }
        } catch {
            setResult({ ...result, state: "blocked", reason: "error" });
        } finally {
            setMarking(false);
        }
    };

    const reset = () => { setCode(""); setResult(null); inputRef.current?.focus(); };

    if (!can("ticketing.verify")) {
        return (
            <AdminLayout title="Door Check-In">
                <div className="max-w-xl border border-amber-500/25 bg-amber-500/[0.08] rounded-2xl p-8 text-center">
                    <Lock size={26} className="mx-auto mb-3 text-amber-300" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300 mb-2">
                        Verification is off for your account
                    </p>
                    <p className="text-sm text-[#EDEAE2]/60">
                        Only the founder, an organizer, a ticketing admin or ticketing staff can admit
                        somebody through a door.
                    </p>
                </div>
            </AdminLayout>
        );
    }

    const t = result?.ticket;
    const statuses = t && (
        <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#EDEAE2]/42 mb-1.5">Payment</p>
                <Chip map={PAYMENT_CHIP} value={t.payment_status ?? "pending"} />
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#EDEAE2]/42 mb-1.5">Ticket</p>
                <Chip map={TICKET_CHIP} value={t.ticket_status ?? "valid"} />
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/10">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#EDEAE2]/42 mb-1.5">Entry</p>
                <Chip map={ENTRY_CHIP} value={t.entry_status ?? "unused"}>
                    {t.entry_status === "used" ? "USED" : "NOT YET USED"}
                </Chip>
            </div>
        </div>
    );

    return (
        <AdminLayout title="Door Check-In">
            <div className="max-w-xl">
                <p className="text-sm text-[#EDEAE2]/55 mb-2">
                    Type the ticket code from the buyer's email. The check and the mark happen together
                    in the database, so no code walks in twice, even on a screenshot.
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/35 mb-6">
                    Verifying as {currentUser?.email}
                </p>

                <form onSubmit={verify} className="flex gap-3 mb-6">
                    <input
                        ref={inputRef}
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
                        <p className="text-sm text-[#EDEAE2]/75 mb-1">{t?.event_title}</p>
                        {(t?.event_date_time) && (
                            <p className="text-xs text-[#EDEAE2]/55 mb-1">{formatEventDate(t.event_date_time)}</p>
                        )}
                        {t?.ticket_type && (
                            <p className="text-xs text-[#EDEAE2]/55 mb-1">Type: {t.ticket_type}</p>
                        )}
                        {t?.holder_name && (
                            <p className="text-xs text-[#EDEAE2]/55 mb-4">{t.holder_name}</p>
                        )}
                        {statuses}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={confirmEntry}
                                disabled={marking}
                                className="inline-flex items-center gap-2 bg-emerald-400 text-[#0d0d0f] px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all focus-ring"
                            >
                                <Check size={14} />
                                {marking ? "Admitting" : "Verify entry"}
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

                {result?.state === "admitted" && (
                    <div className="border border-emerald-500/30 bg-emerald-500/[0.08] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck size={15} className="text-emerald-300" />
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">Entry verified - admit</p>
                        </div>
                        <p className="font-mono text-lg font-bold tracking-wider mb-1">{result.code}</p>
                        <p className="text-sm text-[#EDEAE2]/75 mb-4">{t?.event_title}</p>
                        {statuses}
                        <p className="text-xs text-[#EDEAE2]/55 mb-1">
                            Verified at {t?.verified_at ? new Date(t.verified_at).toLocaleString() : "just now"}
                        </p>
                        <p className="text-xs text-[#EDEAE2]/55 mb-5">Verified by {t?.verified_by || currentUser?.email}</p>
                        <button
                            onClick={reset}
                            className="px-6 py-3 rounded-lg border border-white/15 text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/65 hover:text-[#EDEAE2] transition-colors focus-ring"
                        >
                            Next code
                        </button>
                    </div>
                )}

                {result?.state === "used" && (
                    <div className="border border-rose-500/30 bg-rose-500/[0.08] rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={15} className="text-rose-300" />
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-300">Already used - do not admit</p>
                        </div>
                        <p className="font-mono text-lg font-bold tracking-wider mb-1">{result.code}</p>
                        {t?.event_title && <p className="text-sm text-[#EDEAE2]/75 mb-4">{t.event_title}</p>}
                        {statuses}
                        {t?.verified_at && (
                            <p className="text-xs text-[#EDEAE2]/55 mb-1">
                                First admitted {new Date(t.verified_at).toLocaleString()}
                            </p>
                        )}
                        {t?.verified_by && (
                            <p className="text-xs text-[#EDEAE2]/55 mb-5">Verified by {t.verified_by}</p>
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
                        {t?.event_title && <p className="text-sm text-[#EDEAE2]/75 mb-1">{t.event_title}</p>}
                        {t?.holder_name && <p className="text-xs text-[#EDEAE2]/55 mb-4">{t.holder_name}</p>}
                        <p className="text-sm text-[#EDEAE2]/65 mb-5">
                            Paid under a Paystack test key. It is not a real sale, so nobody is admitted on it.
                        </p>
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
                        <p className="font-mono text-lg font-bold tracking-wider mb-3">{result.code}</p>
                        {t?.event_title && <p className="text-sm text-[#EDEAE2]/75 mb-2">{t.event_title}</p>}
                        <p className="text-sm text-[#EDEAE2]/65 mb-5">{REASON_COPY[result.reason] ?? REASON_COPY.error}</p>
                        <button
                            onClick={reset}
                            className="px-6 py-3 rounded-lg border border-white/15 text-[10px] font-bold uppercase tracking-widest text-[#EDEAE2]/65 hover:text-[#EDEAE2] transition-colors focus-ring"
                        >
                            Next code
                        </button>
                    </div>
                )}

                {result?.state === "invalid" && (
                    <div className="border border-rose-500/30 bg-rose-500/[0.08] rounded-2xl p-6 text-center">
                        <XCircle size={28} className="mx-auto mb-3 text-rose-300" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-300 mb-2">
                            {result.reason === "forbidden_event" ? "Not your event" : "Code not found"}
                        </p>
                        <p className="text-sm text-[#EDEAE2]/65 mb-5">{REASON_COPY[result.reason] ?? REASON_COPY.not_found}</p>
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
