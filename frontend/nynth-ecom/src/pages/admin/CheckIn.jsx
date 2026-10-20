import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";
import AdminButton from "../../components/admin/AdminButton";
import { useAuth } from "../../context/AuthContext";
import { verifyTicketEntry, lookupTicketStatus } from "../../api/firebaseFunctions";
import { formatEventDate } from "../../utils/tickets";
import { Ticket, Search, Check, XCircle, AlertTriangle, ShieldCheck, Lock } from "lucide-react";

const PAYMENT_CHIP = {
  paid: "bg-[var(--tint-emerald-bg)] text-[var(--tint-emerald-fg)] border-[var(--tint-emerald-line)]",
  pending: "bg-[var(--tint-amber-bg)] text-[var(--tint-amber-fg)] border-[var(--tint-amber-line)]",
  failed: "bg-[var(--tint-rose-bg)] text-[var(--tint-rose-fg)] border-[var(--tint-rose-line)]",
  refunded: "bg-[var(--tint-slate-bg)] text-[var(--tint-slate-fg)] border-[var(--tint-slate-line)]",
};

const TICKET_CHIP = {
  valid: "bg-[var(--tint-emerald-bg)] text-[var(--tint-emerald-fg)] border-[var(--tint-emerald-line)]",
  cancelled: "bg-[var(--tint-slate-bg)] text-[var(--tint-slate-fg)] border-[var(--tint-slate-line)]",
  revoked: "bg-[var(--tint-rose-bg)] text-[var(--tint-rose-fg)] border-[var(--tint-rose-line)]",
};

const ENTRY_CHIP = {
  unused: "bg-[var(--tint-sky-bg)] text-[var(--tint-sky-fg)] border-[var(--tint-sky-line)]",
  used: "bg-[var(--admin-ink)]/[0.07] text-[var(--admin-ink)]/60 border-[var(--admin-ink)]/15",
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
                <div className="max-w-xl border border-[var(--tint-amber-line)] bg-[var(--tint-amber-fg)]/[0.08] rounded-xl p-8 text-center">
                    <Lock size={26} className="mx-auto mb-3 text-[var(--tint-amber-fg)]" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--tint-amber-fg)] mb-2">
                        Verification is off for your account
                    </p>
                    <p className="text-sm text-[var(--admin-ink)]/60">
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
            <div className="px-3 py-2.5 rounded-lg bg-[var(--admin-ink)]/[0.04] border border-[var(--admin-ink)]/10">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--admin-ink)]/42 mb-1.5">Payment</p>
                <Chip map={PAYMENT_CHIP} value={t.payment_status ?? "pending"} />
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-[var(--admin-ink)]/[0.04] border border-[var(--admin-ink)]/10">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--admin-ink)]/42 mb-1.5">Ticket</p>
                <Chip map={TICKET_CHIP} value={t.ticket_status ?? "valid"} />
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-[var(--admin-ink)]/[0.04] border border-[var(--admin-ink)]/10">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--admin-ink)]/42 mb-1.5">Entry</p>
                <Chip map={ENTRY_CHIP} value={t.entry_status ?? "unused"}>
                    {t.entry_status === "used" ? "USED" : "NOT YET USED"}
                </Chip>
            </div>
        </div>
    );

    return (
        <AdminLayout title="Door Check-In">
            <div className="max-w-xl">
            <PageHeader
            description="Type the ticket code from the buyer's email. The check and the mark happen together in the database, so no code walks in twice, even on a screenshot."
            className="mb-4"
            />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/35 mb-6">
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
                        className="flex-1 min-w-0 px-4 py-3 bg-[var(--admin-surface)] border border-[var(--admin-ink)]/14 rounded-lg font-mono text-sm tracking-wider focus-ring placeholder:text-[var(--admin-ink)]/35 placeholder:font-sans placeholder:tracking-normal"
                    />
                    <AdminButton
                    type="submit"
                    icon={Search}
                    loading={checking}
                    disabled={!code.trim()}
                    size="md"
                    className="shrink-0"
                    >
                    Verify
                    </AdminButton>
                </form>

                {!result && (
                    <div className="border border-dashed border-[var(--admin-ink)]/15 rounded-xl p-10 text-center">
                        <Ticket size={28} className="mx-auto mb-3 text-[var(--admin-ink)]/25" />
                        <p className="text-sm text-[var(--admin-ink)]/45">No code checked yet. Results land here.</p>
                    </div>
                )}

                {result?.state === "valid" && (
                    <div className="border border-[var(--tint-emerald-line)] bg-[var(--tint-emerald-fg)]/[0.08] rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-2 h-2 rounded-full bg-[var(--tint-emerald-fg)] animate-pulse" />
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--tint-emerald-fg)]">Valid ticket - admit one</p>
                        </div>
                        <p className="font-mono text-lg font-bold tracking-wider mb-1">{result.code}</p>
                        <p className="text-sm text-[var(--admin-ink)]/75 mb-1">{t?.event_title}</p>
                        {(t?.event_date_time) && (
                            <p className="text-xs text-[var(--admin-ink)]/55 mb-1">{formatEventDate(t.event_date_time)}</p>
                        )}
                        {t?.ticket_type && (
                            <p className="text-xs text-[var(--admin-ink)]/55 mb-1">Type: {t.ticket_type}</p>
                        )}
                        {t?.holder_name && (
                            <p className="text-xs text-[var(--admin-ink)]/55 mb-4">{t.holder_name}</p>
                        )}
                        {statuses}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={confirmEntry}
                                disabled={marking}
                                className="inline-flex items-center gap-2 bg-[var(--tint-emerald-fg)] text-[var(--admin-on-ink)] px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all focus-ring"
                            >
                                <Check size={14} />
                                {marking ? "Admitting" : "Verify entry"}
                            </button>
                            <button
                                onClick={reset}
                                className="px-6 py-3 rounded-lg border border-[var(--admin-ink)]/15 text-[10px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/65 hover:text-[var(--admin-ink)] transition-colors focus-ring"
                            >
                                Next code
                            </button>
                        </div>
                    </div>
                )}

                {result?.state === "admitted" && (
                    <div className="border border-[var(--tint-emerald-line)] bg-[var(--tint-emerald-fg)]/[0.08] rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck size={15} className="text-[var(--tint-emerald-fg)]" />
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--tint-emerald-fg)]">Entry verified - admit</p>
                        </div>
                        <p className="font-mono text-lg font-bold tracking-wider mb-1">{result.code}</p>
                        <p className="text-sm text-[var(--admin-ink)]/75 mb-4">{t?.event_title}</p>
                        {statuses}
                        <p className="text-xs text-[var(--admin-ink)]/55 mb-1">
                            Verified at {t?.verified_at ? new Date(t.verified_at).toLocaleString() : "just now"}
                        </p>
                        <p className="text-xs text-[var(--admin-ink)]/55 mb-5">Verified by {t?.verified_by || currentUser?.email}</p>
                        <button
                            onClick={reset}
                            className="px-6 py-3 rounded-lg border border-[var(--admin-ink)]/15 text-[10px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/65 hover:text-[var(--admin-ink)] transition-colors focus-ring"
                        >
                            Next code
                        </button>
                    </div>
                )}

                {result?.state === "used" && (
                    <div className="border border-[var(--tint-rose-line)] bg-[var(--tint-rose-fg)]/[0.08] rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={15} className="text-[var(--tint-rose-fg)]" />
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--tint-rose-fg)]">Already used - do not admit</p>
                        </div>
                        <p className="font-mono text-lg font-bold tracking-wider mb-1">{result.code}</p>
                        {t?.event_title && <p className="text-sm text-[var(--admin-ink)]/75 mb-4">{t.event_title}</p>}
                        {statuses}
                        {t?.verified_at && (
                            <p className="text-xs text-[var(--admin-ink)]/55 mb-1">
                                First admitted {new Date(t.verified_at).toLocaleString()}
                            </p>
                        )}
                        {t?.verified_by && (
                            <p className="text-xs text-[var(--admin-ink)]/55 mb-5">Verified by {t.verified_by}</p>
                        )}
                        <button
                            onClick={reset}
                            className="px-6 py-3 rounded-lg border border-[var(--admin-ink)]/15 text-[10px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/65 hover:text-[var(--admin-ink)] transition-colors focus-ring"
                        >
                            Next code
                        </button>
                    </div>
                )}

                {result?.state === "test" && (
                    <div className="border border-[var(--tint-sky-line)] bg-[var(--tint-sky-bg)] rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle size={15} className="text-[var(--tint-sky-fg)]" />
                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--tint-sky-fg)]">Test code - not a live ticket</p>
                        </div>
                        <p className="font-mono text-lg font-bold tracking-wider mb-1">{result.code}</p>
                        {t?.event_title && <p className="text-sm text-[var(--admin-ink)]/75 mb-1">{t.event_title}</p>}
                        {t?.holder_name && <p className="text-xs text-[var(--admin-ink)]/55 mb-4">{t.holder_name}</p>}
                        <p className="text-sm text-[var(--admin-ink)]/65 mb-5">
                            Paid under a Paystack test key. It is not a real sale, so nobody is admitted on it.
                        </p>
                        <button
                            onClick={reset}
                            className="px-6 py-3 rounded-lg border border-[var(--admin-ink)]/15 text-[10px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/65 hover:text-[var(--admin-ink)] transition-colors focus-ring"
                        >
                            Next code
                        </button>
                    </div>
                )}

                {result?.state === "blocked" && (
                    <div className="border border-[var(--tint-rose-line)] bg-[var(--tint-rose-fg)]/[0.08] rounded-xl p-6 text-center">
                        <XCircle size={28} className="mx-auto mb-3 text-[var(--tint-rose-fg)]" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--tint-rose-fg)] mb-2">
                            Do not admit
                        </p>
                        <p className="font-mono text-lg font-bold tracking-wider mb-3">{result.code}</p>
                        {t?.event_title && <p className="text-sm text-[var(--admin-ink)]/75 mb-2">{t.event_title}</p>}
                        <p className="text-sm text-[var(--admin-ink)]/65 mb-5">{REASON_COPY[result.reason] ?? REASON_COPY.error}</p>
                        <button
                            onClick={reset}
                            className="px-6 py-3 rounded-lg border border-[var(--admin-ink)]/15 text-[10px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/65 hover:text-[var(--admin-ink)] transition-colors focus-ring"
                        >
                            Next code
                        </button>
                    </div>
                )}

                {result?.state === "invalid" && (
                    <div className="border border-[var(--tint-rose-line)] bg-[var(--tint-rose-fg)]/[0.08] rounded-xl p-6 text-center">
                        <XCircle size={28} className="mx-auto mb-3 text-[var(--tint-rose-fg)]" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--tint-rose-fg)] mb-2">
                            {result.reason === "forbidden_event" ? "Not your event" : "Code not found"}
                        </p>
                        <p className="text-sm text-[var(--admin-ink)]/65 mb-5">{REASON_COPY[result.reason] ?? REASON_COPY.not_found}</p>
                        <button
                            onClick={reset}
                            className="px-6 py-3 rounded-lg border border-[var(--admin-ink)]/15 text-[10px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/65 hover:text-[var(--admin-ink)] transition-colors focus-ring"
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
