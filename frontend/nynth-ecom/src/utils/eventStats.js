import { eventHasPassed } from "./tickets";

// Per-event rollup over the admin product list + all orders. Figures are live
// only: test traffic never counts (payment_status paid, is_test false).
// Capacity is derived as current stock + sold, because the finalize step
// decrements stock on every sale. Null stock means uncapped.
export function summarizeEvents(products = [], orders = []) {
  const events = (products ?? []).filter((p) => p?.category === "tickets");
  const livePaid = (orders ?? []).filter((o) => o && o.payment_status === "paid" && !o.isTest);
  return events.map((p) => {
    let sold = 0;
    let revenue = 0;
    let codes = 0;
    let checkedIn = 0;
    for (const o of livePaid) {
      for (const item of o.items ?? []) {
        if (item?.id === p.id) {
          const qty = item.quantity || 1;
          sold += qty;
          revenue += (item.price || 0) * qty;
        }
      }
      for (const t of o.tickets ?? []) {
        if (t?.productId === p.id) {
          codes += 1;
          if (t.used) checkedIn += 1;
        }
      }
    }
    const stock = p.stockQuantity;
    const status =
      p.isPublic === false
        ? "hidden"
        : eventHasPassed(p.eventDateTime)
          ? "ended"
          : (stock ?? 1) <= 0
            ? "soldout"
            : "live";
    return {
      id: p.id,
      title: p.title || p.name || "Untitled event",
      image: p.image || (p.images && p.images[0]) || null,
      eventDateTime: p.eventDateTime ?? null,
      venue: p.venue ?? null,
      isPublic: p.isPublic !== false,
      sold,
      revenue,
      codes,
      checkedIn,
      capacity: stock == null ? null : stock + sold,
      remaining: stock == null ? null : stock,
      status,
    };
  });
}

export function summarizeTotals(summaries = []) {
  return (summaries ?? []).reduce(
    (acc, s) => ({
      events: acc.events + 1,
      sold: acc.sold + (s.sold || 0),
      revenue: acc.revenue + (s.revenue || 0),
      checkedIn: acc.checkedIn + (s.checkedIn || 0),
      codes: acc.codes + (s.codes || 0),
    }),
    { events: 0, sold: 0, revenue: 0, checkedIn: 0, codes: 0 }
  );
}
