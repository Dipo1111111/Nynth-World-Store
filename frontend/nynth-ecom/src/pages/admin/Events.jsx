import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchProducts, getAllOrders, updateProduct, fetchEventTickets } from "../../api/firebaseFunctions";
import { useAuth } from "../../context/AuthContext";
import { summarizeEvents, summarizeTotals } from "../../utils/eventStats";
import { formatEventDate } from "../../utils/tickets";
import { Calendar, MapPin, Eye, EyeOff, ArrowUpRight, Ticket, Plus, Lock, TicketCheck } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_CHIP = {
  live: "bg-emerald-500/[0.14] text-emerald-300 border-emerald-500/25",
  hidden: "bg-white/[0.07] text-[var(--admin-ink)]/60 border-[var(--admin-ink)]/15",
  soldout: "bg-rose-500/[0.14] text-rose-300 border-rose-500/25",
  ended: "bg-white/[0.07] text-[var(--admin-ink)]/40 border-[var(--admin-ink)]/15",
};

const STATUS_LABEL = { live: "ON SALE", hidden: "HIDDEN", soldout: "SOLD OUT", ended: "ENDED" };

// One command view per event: sold, left, checked in, revenue, plus the
// levers Newman reaches for (hide/show, open check-in, jump to edit).
// Test traffic never counts; the note under the totals says so.
//
// Scoping is enforced by the database: a staff member assigned to two events
// only ever receives those two events' products and orders here, so there is
// nothing to filter out in the browser. What this page decides is which
// affordances to offer, not who can see what.
export default function Events() {
  const { can, isAdmin, canAccessEvents } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const canEdit = can("ticketing.events.edit");
  const canSeeRevenue = can("ticketing.revenue.view");
  const canVerify = can("ticketing.verify");

  const load = async () => {
    try {
      const [products, orders, issued] = await Promise.all([
        fetchProducts({ admin: true }),
        getAllOrders(),
        can("ticketing.orders.view") ? fetchEventTickets() : Promise.resolve([]),
      ]);
      setSummaries(summarizeEvents(products, orders));
      setTickets(issued);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleVisibility = async (s) => {
    setToggling(s.id);
    try {
      await updateProduct(s.id, { isPublic: !s.isPublic });
      setSummaries((prev) =>
        prev.map((x) =>
          x.id === s.id
            ? { ...x, isPublic: !x.isPublic, status: !x.isPublic ? (x.status === "hidden" ? "live" : x.status) : "hidden" }
            : x
        )
      );
      toast.success(s.isPublic ? "Event hidden from the storefront" : "Event is live on the storefront");
    } catch (e) {
      toast.error(e.message || "Could not update visibility");
    } finally {
      setToggling(null);
    }
  };

  const totals = summarizeTotals(summaries);
  const issuedByEvent = tickets.reduce((acc, t) => {
    acc[t.event_id] = (acc[t.event_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AdminLayout title="Events">
      <div className="max-w-5xl">
        <p className="text-sm text-[var(--admin-ink)]/55 mb-6">
          Every event you are allowed to see. Dates, venue, and prices are edited in Products; this page runs the show.
        </p>

        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {[
              ["EVENTS", String(totals.events)],
              ["TICKETS SOLD", String(totals.sold)],
              canSeeRevenue ? ["REVENUE", `₦${totals.revenue.toLocaleString()}`] : ["CODES ISSUED", String(tickets.length)],
              ["CHECKED IN", `${totals.checkedIn}/${totals.codes}`],
            ].map(([label, value]) => (
              <div key={label} className="border border-[var(--admin-ink)]/10 rounded-2xl bg-white/[0.03] px-5 py-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--admin-ink)]/42 mb-1.5">{label}</p>
                <p className="text-xl font-extrabold tracking-tight tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        )}
        {!loading && (
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--admin-ink)]/35 mb-8">
            Live orders only - test purchases never count here
          </p>
        )}

        {loading && <p className="text-sm text-[var(--admin-ink)]/50 tracking-widest uppercase font-bold">Loading events</p>}

        {!loading && summaries.length === 0 && (
          <div className="border border-dashed border-[var(--admin-ink)]/15 rounded-2xl p-10 text-center">
            <Ticket size={28} className="mx-auto mb-3 text-[var(--admin-ink)]/25" />
            <p className="text-sm text-[var(--admin-ink)]/65 mb-2">
              {isAdmin ? "No events yet. Create one as a Tickets product and it lands here." : "No events are assigned to you yet."}
            </p>
            {isAdmin && (
              <Link
                to="/admin/products"
                className="inline-flex items-center gap-2 mt-4 bg-[var(--admin-accent)] text-[var(--admin-on-ink)] px-6 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all focus-ring"
              >
                <Plus size={14} /> New event
              </Link>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {summaries.map((s) => {
            const filled = s.capacity ? Math.round((s.sold / s.capacity) * 10) : 0;
            const inScope = isAdmin || canAccessEvents(s.id);
            return (
              <div key={s.id} className="border border-[var(--admin-ink)]/10 rounded-2xl bg-white/[0.03] p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h2 className="text-base font-extrabold tracking-tight uppercase truncate">{s.title}</h2>
                    <p className="text-xs text-[var(--admin-ink)]/55 mt-1.5 flex items-center gap-1.5">
                      <Calendar size={11} className="shrink-0" />
                      {s.eventDateTime ? formatEventDate(s.eventDateTime) : "DATE TBC"}
                    </p>
                    {s.venue && (
                      <p className="text-xs text-[var(--admin-ink)]/55 mt-1 flex items-center gap-1.5">
                        <MapPin size={11} className="shrink-0" /> {s.venue}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 text-[8px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider border ${STATUS_CHIP[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 py-4 border-y border-[var(--admin-ink)]/10 mb-4">
                  {[
                    ["SOLD", String(s.sold)],
                    ["LEFT", s.remaining == null ? "OPEN" : String(s.remaining)],
                    ["IN", `${s.checkedIn}/${s.codes}`],
                    canSeeRevenue ? ["₦", s.revenue.toLocaleString()] : ["CODES", String(issuedByEvent[s.id] ?? 0)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--admin-ink)]/42 mb-1">{label}</p>
                      <p className="text-sm font-extrabold tabular-nums">{value}</p>
                    </div>
                  ))}
                </div>

                {s.capacity != null ? (
                  <div className="flex gap-1 mb-5" aria-label={`${s.sold} of ${s.capacity} sold`}>
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span key={i} className={`h-1.5 flex-1 rounded-full ${i < filled ? "bg-emerald-400" : "bg-[var(--admin-ink)]/10"}`} />
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--admin-ink)]/35 mb-5">
                    Open capacity - {s.sold} sold so far
                  </p>
                )}

                {!canSeeRevenue && (
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--admin-ink)]/35 mb-4 flex items-center gap-1.5">
                    <Lock size={10} /> Revenue is not part of your access
                  </p>
                )}
                {!canVerify && (
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--admin-ink)]/35 mb-4 flex items-center gap-1.5">
                    <Lock size={10} /> Door verification is not part of your access
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {canEdit && inScope && (
                    <button
                      onClick={() => toggleVisibility(s)}
                      disabled={toggling === s.id}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[var(--admin-ink)]/15 text-[9px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/75 hover:text-[var(--admin-ink)] transition-colors disabled:opacity-40 focus-ring"
                    >
                      {s.isPublic ? <EyeOff size={12} /> : <Eye size={12} />}
                      {toggling === s.id ? "Saving" : s.isPublic ? "Hide" : "Show"}
                    </button>
                  )}
                  <Link
                    to={`/product/${s.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[var(--admin-ink)]/15 text-[9px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/75 hover:text-[var(--admin-ink)] transition-colors focus-ring"
                  >
                    View <ArrowUpRight size={12} />
                  </Link>
                  {canVerify && inScope && (
                    <Link
                      to="/admin/check-in"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-[var(--admin-ink)]/15 text-[9px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/75 hover:text-[var(--admin-ink)] transition-colors focus-ring"
                    >
                      <TicketCheck size={12} /> Check-in
                    </Link>
                  )}
                  {canEdit && inScope && (
                    <Link
                      to="/admin/products"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[var(--admin-accent)] text-[var(--admin-on-ink)] text-[9px] font-bold uppercase tracking-widest hover:opacity-90 transition-all focus-ring"
                    >
                      Edit details
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
