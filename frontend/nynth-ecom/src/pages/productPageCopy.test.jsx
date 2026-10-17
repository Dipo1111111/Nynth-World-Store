import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Static wiring checks. The storefront rendering itself needs a browser, but
// these guard the two regressions that matter most: the hardcoded 7-day return
// badge coming back, and the editable copy losing its admin controls.
const here = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(here, "..");

const read = (rel) => readFileSync(path.join(srcRoot, rel), "utf8");

describe("product page", () => {
    const productDetail = read("pages/ProductDetail.jsx");

    it("no longer shows a 7-day return policy badge", () => {
        expect(productDetail).not.toMatch(/7\s*DAYS?\s*RETURN\s*POLICY/i);
        expect(productDetail).not.toMatch(/7\s*days?\s*return/i);
    });

    it("renders the editable note instead of inline copy", () => {
        expect(productDetail).toContain("resolveProductNote");
        expect(productDetail).toContain("productNote.title");
        expect(productDetail).toContain("productNote.text");
        expect(productDetail).not.toContain("This item is available on a pre-order basis.");
    });

    it("preserves line breaks in the note", () => {
        expect(productDetail).toContain("whitespace-pre-line");
    });

    it("can hide the panel from settings", () => {
        expect(productDetail).toContain("isProductNoteEnabled");
        expect(productDetail).toContain("showProductNote");
    });
});

describe("admin controls", () => {
    it("exposes the store default in Settings", () => {
        const settingsPage = read("pages/admin/Settings.jsx");
        expect(settingsPage).toContain("product_note_text");
        expect(settingsPage).toContain("product_note_title");
        expect(settingsPage).toContain("product_note_enabled");
        expect(settingsPage).toContain("returns_page_policy");
    });

    it("exposes the per-product override in Products", () => {
        const productsPage = read("pages/admin/Products.jsx");
        expect(productsPage).toContain("productNote");
        expect(productsPage).toContain("productNoteTitle");
        expect(productsPage).toContain("Product page note");
    });

    it("exposes revenue privacy controls in Settings", () => {
        const settingsPage = read("pages/admin/Settings.jsx");
        expect(settingsPage).toContain("revenue_display");
        expect(settingsPage).toContain("setRevenueDisplay");
    });

    it("renders the dashboard figure through RevenueValue", () => {
        const dashboard = read("pages/admin/AdminDashboard.jsx");
        expect(dashboard).toContain("RevenueValue");
        expect(dashboard).toContain("settings?.revenue_display");
    });
});

describe("shipping page", () => {
    it("reads the return policy from settings so it can be cleared", () => {
        const shippingPage = read("pages/ShippingReturns.jsx");
        expect(shippingPage).toContain("resolveReturnsPagePolicy");
        expect(shippingPage).not.toMatch(/We operate a 4-day return policy/);
    });
});
