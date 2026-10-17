import { describe, it, expect } from "vitest";
import {
    DEFAULT_REVENUE_DISPLAY,
    REVENUE_MASK,
    formatNaira,
    normalizeRevenueDisplay,
    resolveRevenue,
    revenueText,
    toAmount,
} from "./revenueDisplay";

describe("toAmount", () => {
    it("accepts numbers and numeric strings", () => {
        expect(toAmount(1200)).toBe(1200);
        expect(toAmount("1200000")).toBe(1200000);
        expect(toAmount("1,200,000")).toBe(1200000);
        expect(toAmount(" ₦1,200 ")).toBe(1200);
    });

    it("treats empty, invalid and negative values as unset", () => {
        expect(toAmount("")).toBeNull();
        expect(toAmount(null)).toBeNull();
        expect(toAmount(undefined)).toBeNull();
        expect(toAmount("abc")).toBeNull();
        expect(toAmount(-5)).toBeNull();
        expect(toAmount(NaN)).toBeNull();
    });

    it("keeps zero, which is a real figure", () => {
        expect(toAmount(0)).toBe(0);
        expect(toAmount("0")).toBe(0);
    });
});

describe("normalizeRevenueDisplay", () => {
    it("masks by default and has no manual figure", () => {
        expect(normalizeRevenueDisplay(undefined)).toEqual({ hide_by_default: true, override: null });
        expect(DEFAULT_REVENUE_DISPLAY).toEqual({ hide_by_default: true, override: null });
    });

    it("keeps an explicit reveal preference", () => {
        expect(normalizeRevenueDisplay({ hide_by_default: false }).hide_by_default).toBe(false);
    });

    it("normalizes a string override persisted from the form", () => {
        expect(normalizeRevenueDisplay({ override: "1200000" }).override).toBe(1200000);
        expect(normalizeRevenueDisplay({ override: "" }).override).toBeNull();
    });
});

describe("resolveRevenue", () => {
    it("shows the ledger total when no manual figure is set", () => {
        const resolved = resolveRevenue(48200, undefined);
        expect(resolved.value).toBe(48200);
        expect(resolved.ledger).toBe(48200);
        expect(resolved.isOverride).toBe(false);
    });

    it("shows the manual figure instead of the ledger and flags it", () => {
        const resolved = resolveRevenue(48200, { override: 1200000 });
        expect(resolved.value).toBe(1200000);
        expect(resolved.ledger).toBe(48200);
        expect(resolved.isOverride).toBe(true);
    });

    it("does not crash on a missing ledger total", () => {
        expect(resolveRevenue(undefined, undefined).value).toBe(0);
    });
});

describe("revenueText", () => {
    it("masks until revealed, then formats", () => {
        const resolved = resolveRevenue(48200, undefined);
        expect(revenueText(resolved, false)).toBe(REVENUE_MASK);
        expect(revenueText(resolved, true)).toBe("₦48,200");
    });

    it("uses the provided currency symbol", () => {
        expect(revenueText(resolveRevenue(1200, undefined), true, "$")).toBe("$1,200");
    });
});

describe("formatNaira", () => {
    it("groups thousands and prefixes the symbol", () => {
        expect(formatNaira(1200)).toBe("₦1,200");
        expect(formatNaira(1200000)).toBe("₦1,200,000");
        expect(formatNaira(0)).toBe("₦0");
    });

    it("falls back to zero for junk input", () => {
        expect(formatNaira("not a number")).toBe("₦0");
    });
});

describe("REVENUE_MASK", () => {
    it("is the exact mask the founder asked for", () => {
        expect(REVENUE_MASK).toBe("****.***");
    });
});
