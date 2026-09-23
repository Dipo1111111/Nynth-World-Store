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
import { getLagosPrice, effectiveLagosRates } from "./shippingRates";
import { getAuthErrorMessage, withRetry } from "./errorHandlers";
import { cn } from "../lib/utils";

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
