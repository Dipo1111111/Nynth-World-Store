import { describe, it, expect } from "vitest";
import {
    DEFAULT_PRODUCT_NOTE,
    DEFAULT_PRODUCT_NOTE_TITLE,
    DEFAULT_RETURNS_PAGE_POLICY,
    isProductNoteEnabled,
    resolveProductNote,
    resolveReturnsPagePolicy,
} from "./productCopy";

describe("resolveProductNote", () => {
    it("falls back to the built-in copy when nothing is configured", () => {
        const note = resolveProductNote(null, undefined);
        expect(note.title).toBe(DEFAULT_PRODUCT_NOTE_TITLE);
        expect(note.text).toBe(DEFAULT_PRODUCT_NOTE);
    });

    it("uses the store-level default when the product has no override", () => {
        const note = resolveProductNote(
            { id: "tee-1", productNote: "" },
            { product_note_title: "SHIPPING", product_note_text: "Ships in 2 days." }
        );
        expect(note.title).toBe("SHIPPING");
        expect(note.text).toBe("Ships in 2 days.");
    });

    it("lets a single product override the store default", () => {
        const note = resolveProductNote(
            { id: "tee-1", productNote: "HAND WASH ONLY\nNo returns on sale items." },
            { product_note_text: "Ships in 2 days." }
        );
        expect(note.text).toBe("HAND WASH ONLY\nNo returns on sale items.");
    });

    it("treats a whitespace-only product note as no override", () => {
        const note = resolveProductNote(
            { productNote: "   \n  " },
            { product_note_text: "Store copy." }
        );
        expect(note.text).toBe("Store copy.");
    });

    it("treats a whitespace-only store note as no override", () => {
        const note = resolveProductNote({}, { product_note_text: "   " });
        expect(note.text).toBe(DEFAULT_PRODUCT_NOTE);
    });

    it("resolves the per-product title, then the store title, then the default", () => {
        expect(resolveProductNote({ productNoteTitle: "CARE" }, { product_note_title: "STORE" }).title).toBe("CARE");
        expect(resolveProductNote({}, { product_note_title: "STORE" }).title).toBe("STORE");
        expect(resolveProductNote({}, {}).title).toBe(DEFAULT_PRODUCT_NOTE_TITLE);
    });

    it("trims surrounding whitespace but keeps internal line breaks", () => {
        const note = resolveProductNote({ productNote: "\n  A\n\nB  \n" }, {});
        expect(note.text).toBe("A\n\nB");
    });

    it("ignores non-string values instead of rendering them", () => {
        const note = resolveProductNote({ productNote: { html: "<b>x</b>" } }, { product_note_text: 42 });
        expect(note.text).toBe(DEFAULT_PRODUCT_NOTE);
    });
});

describe("isProductNoteEnabled", () => {
    it("is on unless the admin explicitly turns it off", () => {
        expect(isProductNoteEnabled(undefined)).toBe(true);
        expect(isProductNoteEnabled({})).toBe(true);
        expect(isProductNoteEnabled({ product_note_enabled: true })).toBe(true);
        expect(isProductNoteEnabled({ product_note_enabled: false })).toBe(false);
    });
});

describe("resolveReturnsPagePolicy", () => {
    it("returns the default when the setting was never saved", () => {
        expect(resolveReturnsPagePolicy(undefined)).toBe(DEFAULT_RETURNS_PAGE_POLICY);
        expect(resolveReturnsPagePolicy({})).toBe(DEFAULT_RETURNS_PAGE_POLICY);
    });

    it("returns the saved copy when present", () => {
        expect(resolveReturnsPagePolicy({ returns_page_policy: "Final sale." })).toBe("Final sale.");
    });

    it("returns null so the page can hide the block when cleared on purpose", () => {
        expect(resolveReturnsPagePolicy({ returns_page_policy: "" })).toBeNull();
        expect(resolveReturnsPagePolicy({ returns_page_policy: "  \n " })).toBeNull();
    });
});

describe("the defaults", () => {
    it("no longer advertise a fixed return window on product pages", () => {
        expect(DEFAULT_PRODUCT_NOTE).not.toMatch(/\breturn/i);
        expect(DEFAULT_PRODUCT_NOTE).not.toMatch(/\b7\s*days?\b/i);
    });

    it("keep the dispatch copy the founder asked to stay", () => {
        expect(DEFAULT_PRODUCT_NOTE).toContain("PRE-ORDER");
        expect(DEFAULT_PRODUCT_NOTE).toContain("Production: 2-5 business days");
    });
});
