import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import PageHeader from "../../components/admin/PageHeader";
import { fetchEventFinance, getAllOrders } from "../../api/firebaseFunctions";
import { Loader2, Wallet, Landmark, Percent, Undo2 } from "lucide-react";
import toast from "react-hot-toast";

const naira = (v) => `\u20A6${Number(v ?? 0).toLocaleString()}`;

const Stat = ({ label, value, note, icon: Icon }) => (
  <div className="admin-panel rounded-xl admin-panel-inset px-5 py-4">
    <div className="flex items-center gap-1.5 mb-1.5">
      {Icon && <Icon size={11} className="text-[var(--admin-ink)]/35" />}
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--admin-ink)]/42">{label}</p>
    </div>
    <p className="text-xl font-extrabold tracking-tight tabular-nums">{value}</p>
    {note && <p className="text-[10px] text-[var(--admin-ink)]/40 mt-1">{note}</p>}
  </div>
);

// Ticket money, kept apart from the clothing ledger. The point of this page is
// that an organizer's proceeds never get mistaken for NYNTH income: only the
// commission column is ours.
export default function TicketPlatform() {
  const [finance, setFinance] = useState([]);
  const [storeRevenue, setStoreRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, orders] = await Promise.all([fetchEventFinance(), getAllOrders()]);
      setFinance(rows);
      // Clothing only: test traffic and anything bought through a ticket section.
      setStoreRevenue(
        orders
          .filter((o) => o.payment_status === "paid" && !o.isTest && o.salesChannel === "store")
          .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
      );
    } catch (e) {
      toast.error(e.message || "Could not load ticket finances");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totals = finance.reduce(
    (acc, f) => ({
      sold: acc.sold + Number(f.tickets_sold ?? 0),
      used: acc.used + Number(f.tickets_used ?? 0),
      gross: acc.gross + Number(f.gross_collected ?? 0),
      refunded: acc.refunded + Number(f.refunded ?? 0),
      fees: acc.fees + Number(f.payment_fees ?? 0),
      commission: acc.commission + Number(f.nynth_commission ?? 0),
      share: acc.share + Number(f.organizer_share ?? 0),
    }),
    { sold: 0, used: 0, gross: 0, refunded: 0, fees: 0, commission: 0, share: 0 }
  );

  const netOwed = totals.gross - totals.fees - totals.commission;

  return (
    <AdminLayout title="Ticket Platform">
      <div className="max-w-6xl">
        <PageHeader description="Ticket money is tracked separately from the clothing business. What an organizer sells is not NYNTH income: only the commission is. Everything below is live traffic, Paystack test orders excluded." />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[var(--admin-ink)]/25" size={28} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <Stat label="Collected" value={naira(totals.gross)} note="gross ticket money" icon={Wallet} />
              <Stat label="Processing fees" value={naira(totals.fees)} note="what the gateway took" icon={Landmark} />
              <Stat label="Refunded" value={naira(totals.refunded)} note="returned to buyers" icon={Undo2} />
              <Stat label="NYNTH commission" value={naira(totals.commission)} note="our income from tickets" icon={Percent} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              <Stat label="Owed to organizers" value={naira(netOwed)} note="collected less fees and our cut" />
              <Stat label="Tickets sold" value={String(totals.sold)} />
              <Stat label="Admitted" value={String(totals.used)} note="entry status used" />
              <Stat label="Clothing revenue" value={naira(storeRevenue)} note="separate ledger, for contrast" />
            </div>

            {finance.length === 0 ? (
              <div className="admin-panel admin-panel-dashed rounded-xl p-12 text-center">
                <Wallet size={28} className="mx-auto mb-3 text-[var(--admin-ink)]/25" />
                <p className="text-sm text-[var(--admin-ink)]/65">
                  No live ticket sales yet. Figures appear the moment a real ticket is paid for.
                </p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--admin-ink)]/42 mb-4">
                  By event
                </p>
                {/* Desktop */}
                <div className="hidden md:block admin-panel rounded-xl overflow-x-auto">
                  <table className="w-full admin-table">
                    <thead>
                      <tr className="border-b border-[var(--admin-ink)]/10 bg-[var(--admin-ink)]/[0.05]">
                        {["Event", "Sold", "In", "Collected", "Fees", "Refunded", "NYNTH cut", "Owed to organizer"].map((h) => (
                          <th key={h} className="text-left text-[10px] font-bold uppercase tracking-widest text-[var(--admin-ink)]/42 px-5 py-3 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--admin-ink)]/10">
                      {finance.map((f) => {
                        const owed =
                          Number(f.gross_collected ?? 0) -
                          Number(f.payment_fees ?? 0) -
                          Number(f.nynth_commission ?? 0);
                        return (
                          <tr key={f.event_id} className="hover:bg-[var(--admin-ink)]/[0.04] transition-colors">
                            <td className="px-5 py-4 text-sm font-bold uppercase">{f.event_title || f.event_id}</td>
                            <td className="px-5 py-4 text-sm tabular-nums">{f.tickets_sold}</td>
                            <td className="px-5 py-4 text-sm tabular-nums text-[var(--admin-ink)]/60">{f.tickets_used}</td>
                            <td className="px-5 py-4 text-sm tabular-nums">{naira(f.gross_collected)}</td>
                            <td className="px-5 py-4 text-sm tabular-nums text-[var(--admin-ink)]/60">{naira(f.payment_fees)}</td>
                            <td className="px-5 py-4 text-sm tabular-nums text-[var(--admin-ink)]/60">{naira(f.refunded)}</td>
                            <td className="px-5 py-4 text-sm tabular-nums text-[var(--tint-emerald-fg)]">{naira(f.nynth_commission)}</td>
                            <td className="px-5 py-4 text-sm tabular-nums">{naira(owed)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="md:hidden space-y-3">
                  {finance.map((f) => (
                    <div key={f.event_id} className="admin-panel rounded-xl p-5">
                      <p className="text-sm font-bold uppercase mb-3">{f.event_title || f.event_id}</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ["Collected", naira(f.gross_collected)],
                          ["Fees", naira(f.payment_fees)],
                          ["Refunded", naira(f.refunded)],
                          ["NYNTH cut", naira(f.nynth_commission)],
                        ].map(([l, v]) => (
                          <div key={l}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--admin-ink)]/42 mb-1">{l}</p>
                            <p className="text-sm font-extrabold tabular-nums">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
