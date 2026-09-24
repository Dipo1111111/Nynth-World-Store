import { describe, it, expect } from "vitest";
import { summarizeEvents, summarizeTotals } from "./eventStats";

const ticket = (over = {}) => ({
  id: "ev1",
  category: "tickets",
  title: "AFRO FUTURE FEST",
  price: 15000,
  stockQuantity: 80,
  isPublic: true,
  eventDateTime: new Date(Date.now() + 86400000).toISOString(),
  venue: "Eko Convention Centre",
  ...over,
});

const order = (over = {}) => ({
  id: "o1",
  payment_status: "paid",
  isTest: false,
  items: [],
  tickets: [],
  ...over,
});

describe("summarizeEvents", () => {
  it("rolls sold, revenue, codes, and check-ins per event from live paid orders", () => {
    const out = summarizeEvents(
      [ticket()],
      [
        order({
          items: [{ id: "ev1", quantity: 2, price: 15000 }],
          tickets: [
            { code: "NWT-A", productId: "ev1", used: true },
            { code: "NWT-B", productId: "ev1" },
          ],
        }),
      ]
    );
    expect(out).toHaveLength(1);
    expect(out[0].sold).toBe(2);
    expect(out[0].revenue).toBe(30000);
    expect(out[0].codes).toBe(2);
    expect(out[0].checkedIn).toBe(1);
    expect(out[0].capacity).toBe(82);
    expect(out[0].remaining).toBe(80);
    expect(out[0].status).toBe("live");
  });

  it("ignores merch products, test orders, and unpaid orders", () => {
    const out = summarizeEvents(
      [ticket(), { id: "tee1", category: "tees", title: "Tee", stockQuantity: 5 }],
      [
        order({ id: "t1", isTest: true, items: [{ id: "ev1", quantity: 9, price: 15000 }] }),
        order({ id: "p1", payment_status: "pending", items: [{ id: "ev1", quantity: 9, price: 15000 }] }),
      ]
    );
    expect(out).toHaveLength(1);
    expect(out[0].sold).toBe(0);
    expect(out[0].revenue).toBe(0);
  });

  it("flags hidden, ended, and sold-out events", () => {
    const out = summarizeEvents([
      ticket({ id: "h", isPublic: false }),
      ticket({ id: "e", eventDateTime: new Date(Date.now() - 86400000).toISOString() }),
      ticket({ id: "s", stockQuantity: 0 }),
    ]);
    expect(out.find((s) => s.id === "h").status).toBe("hidden");
    expect(out.find((s) => s.id === "e").status).toBe("ended");
    expect(out.find((s) => s.id === "s").status).toBe("soldout");
  });

  it("treats null stock as uncapped capacity", () => {
    const out = summarizeEvents(
      [ticket({ stockQuantity: null })],
      [order({ items: [{ id: "ev1", quantity: 3, price: 15000 }] })]
    );
    expect(out[0].sold).toBe(3);
    expect(out[0].capacity).toBeNull();
    expect(out[0].remaining).toBeNull();
    expect(out[0].status).toBe("live");
  });
});

describe("summarizeTotals", () => {
  it("adds up the headline figures", () => {
    expect(
      summarizeTotals([
        { sold: 2, revenue: 30000, checkedIn: 1, codes: 2 },
        { sold: 1, revenue: 5000, checkedIn: 0, codes: 1 },
      ])
    ).toEqual({ events: 2, sold: 3, revenue: 35000, checkedIn: 1, codes: 3 });
  });
});
