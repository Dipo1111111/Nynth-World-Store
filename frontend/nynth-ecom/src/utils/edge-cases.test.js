import { describe, it, expect, vi } from "vitest";

// Edge-case harness: the small flows that break brand perception when they
// fail. Pure logic only, no network, runs in seconds. Add a case every time
// a real bug slips through.
import {
    isTicketItem,
    ticketCount,
    formatEventDate,
    formatEventDateParts,
    eventHasPassed,
    hasTickets,
    hasPhysicalItems,
    nonTicketSubtotal,
} from "./tickets";
import { getLagosPrice, effectiveLagosRates, cartNeedsShipping } from "./shippingRates";
import { getAuthErrorMessage, withRetry } from "./errorHandlers";
import { cn } from "../lib/utils";
import { foreignPriceLabel } from "./currency";
import {
  normalizeCategoryOrder,
  normalizeBandPosition,
  normalizeBandScope,
  normalizeBandLimit,
  categoryLabel,
} from "./shopConfig";

describe("tickets: items that are barely there", () => {
    it("null, undefined, and category-less items are never tickets", () => {
        expect(isTicketItem(null)).toBe(false);
        expect(isTicketItem(undefined)).toBe(false);
        expect(isTicketItem({})).toBe(false);
        expect(isTicketItem({ title: "Tee" })).toBe(false);
    });

    it("counts mixed carts, defaults missing quantity to 1", () => {
        const items = [
            { category: "tickets", quantity: 2 },
            { category: "tickets" },
            { category: "apparel", quantity: 3 },
        ];
        expect(ticketCount(items)).toBe(3);
        expect(ticketCount([])).toBe(0);
        expect(ticketCount()).toBe(0);
    });

    it("all-ticket carts have no physical items (free delivery path)", () => {
        const items = [{ category: "tickets", quantity: 2 }];
        expect(hasTickets(items)).toBe(true);
        expect(hasPhysicalItems(items)).toBe(false);
        expect(hasPhysicalItems([])).toBe(false);
        expect(hasPhysicalItems([{ category: "apparel" }])).toBe(true);
    });

    it("ticket subtotal math ignores tickets, tolerates missing prices", () => {
        const items = [
            { category: "tickets", price: 5000, quantity: 2 },
            { category: "apparel", price: 15000, quantity: 1 },
            { category: "apparel", quantity: 2 },
        ];
        expect(nonTicketSubtotal(items)).toBe(15000);
        expect(nonTicketSubtotal([])).toBe(0);
    });
});

describe("tickets: dates that cannot be trusted", () => {
    it("bad dates render DATE TBC, never crash", () => {
        expect(formatEventDate(null)).toBe("DATE TBC");
        expect(formatEventDate("")).toBe("DATE TBC");
        expect(formatEventDate("not-a-date")).toBe("DATE TBC");
        expect(formatEventDateParts(null)).toEqual({ date: "DATE TBC", time: "" });
    });

    it("past vs future boundary is sane", () => {
        expect(eventHasPassed(null)).toBe(false);
        expect(eventHasPassed("2000-01-01T00:00:00Z")).toBe(true);
        expect(eventHasPassed("2999-01-01T00:00:00Z")).toBe(false);
    });
});

describe("shipping: settings that are half missing", () => {
    it("unknown area is 0, never NaN", () => {
        const price = getLagosPrice("Atlantis", null);
        expect(price).toBe(0);
        expect(Number.isNaN(price)).toBe(false);
    });

    it("null settings still return the base price as a number", () => {
        const rates = effectiveLagosRates(null);
        const firstArea = Object.keys(rates)[0];
        expect(typeof getLagosPrice(firstArea, null)).toBe("number");
    });

    it("an override of 0 stays free (not overridden by base)", () => {
        const rates = effectiveLagosRates(null);
        const firstArea = Object.keys(rates)[0];
        const priced = getLagosPrice(firstArea, { shipping_rates: { lagos: { [firstArea]: 0 } } });
        expect(priced).toBe(0);
    });

    it("string overrides coerce to numbers", () => {
        const rates = effectiveLagosRates(null);
        const firstArea = Object.keys(rates)[0];
        expect(getLagosPrice(firstArea, { shipping_rates: { lagos: { [firstArea]: "2500" } } })).toBe(2500);
    });

    it("fee applies when ANY item needs delivery, none when all are free", () => {
        const shippable = { category: "tees", deliveryFeeEnabled: true };
        const freebie = { category: "tees", deliveryFeeEnabled: false };
        const ticket = { category: "tickets" };
        const legacy = { category: "hoodies" };
        expect(cartNeedsShipping([freebie, shippable])).toBe(true);
        expect(cartNeedsShipping([freebie])).toBe(false);
        expect(cartNeedsShipping([ticket])).toBe(false);
        expect(cartNeedsShipping([legacy])).toBe(true);
        expect(cartNeedsShipping([])).toBe(false);
    });
});

describe("errors: auth and retries", () => {
    it("unknown auth codes still speak human", () => {
        const msg = getAuthErrorMessage("auth/totally-new-code");
        expect(typeof msg).toBe("string");
        expect(msg.length).toBeGreaterThan(0);
    });

    it("flaky function succeeds within retries", async () => {
        let calls = 0;
        const fn = vi.fn(async () => {
            calls++;
            if (calls < 3) throw new Error("flaky");
            return "ok";
        });
        await expect(withRetry(fn, 3, 1)).resolves.toBe("ok");
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it("dead function throws after retries run out", async () => {
        const fn = vi.fn(async () => { throw new Error("dead"); });
        await expect(withRetry(fn, 2, 1)).rejects.toThrow("dead");
        expect(fn).toHaveBeenCalledTimes(3);
    });
});

describe("styling helper", () => {
    it("cn() resolves conflicting classes instead of stacking them", () => {
        expect(cn("px-4 px-8")).toBe("px-8");
        expect(cn("text-sm", null, undefined, "font-bold")).toContain("font-bold");
    });
});

describe("currency: foreign price viewer", () => {
    it("renders USD and GBP equivalents from a naira price", () => {
        expect(foreignPriceLabel(30000)).toBe("APPROX $20.00 / £15.00");
        expect(foreignPriceLabel(10000)).toBe("APPROX $6.67 / £5.00");
    });

    it("returns empty for missing, zero, or broken prices", () => {
        expect(foreignPriceLabel(0)).toBe("");
        expect(foreignPriceLabel(null)).toBe("");
        expect(foreignPriceLabel(undefined)).toBe("");
        expect(foreignPriceLabel("abc")).toBe("");
        expect(foreignPriceLabel(-5000)).toBe("");
    });
});

describe("shop config: admin-controlled tab order", () => {
    it("missing or broken order falls back to the default", () => {
        expect(normalizeCategoryOrder()).toEqual(["all", "tees", "hoodies", "headwear", "accessories", "pants", "polo", "sleeves", "tickets"]);
        expect(normalizeCategoryOrder([null, "", 4])).toContain("all");
        expect(normalizeCategoryOrder("nope")).toContain("tickets");
        expect(normalizeCategoryOrder([])).toContain("all");
    });

    it("drops duplicates and unknown junk, keeps a single all", () => {
        const out = normalizeCategoryOrder(["all", "tickets", "all", "tees", "tickets", 0]);
        expect(out).toEqual(["all", "tickets", "tees"]);
    });

    it("forces all back in first when an admin hides it", () => {
        const out = normalizeCategoryOrder(["tickets", "tees"]);
        expect(out[0]).toBe("all");
        expect(out).toContain("tickets");
    });

    it("labels t-shirts without touching other categories", () => {
        expect(categoryLabel("tees")).toBe("t-shirts");
        expect(categoryLabel("tickets")).toBe("tickets");
        expect(categoryLabel("all")).toBe("all");
    });
});

describe("shop config: bold tickets band controls", () => {
    it("unknown band position falls back to top, scope to all", () => {
        expect(normalizeBandPosition(undefined)).toBe("top");
        expect(normalizeBandPosition("floating")).toBe("top");
        expect(normalizeBandPosition("bottom")).toBe("bottom");
        expect(normalizeBandPosition("hidden")).toBe("hidden");
        expect(normalizeBandScope(undefined)).toBe("all");
        expect(normalizeBandScope("tickets_only")).toBe("tickets_only");
    });

    it("limit is clamped to a sane range and never NaN", () => {
        expect(normalizeBandLimit()).toBe(3);
        expect(normalizeBandLimit(0)).toBe(1);
        expect(normalizeBandLimit(99)).toBe(6);
        expect(normalizeBandLimit("4")).toBe(4);
        expect(normalizeBandLimit("NaN")).toBe(3);
    });
});
