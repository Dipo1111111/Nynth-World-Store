// Edited copy for the product page "Shipping & Returns" panel and the
// standalone /shipping page.
//
// Precedence for the product page panel, highest first:
//   1. product.productNote      (edited per product in Admin > Products)
//   2. settings.product_note_text (edited in Admin > Settings > Product page)
//   3. DEFAULT_PRODUCT_NOTE
//
// The /shipping page policy is settings.returns_page_policy. Leaving that
// string empty on purpose hides the RETURN POLICY block, so the policy can be
// removed without shipping a code change.

export const DEFAULT_PRODUCT_NOTE_TITLE = "SHIPPING & RETURNS";

export const DEFAULT_PRODUCT_NOTE = [
    "PRE-ORDER",
    "",
    "This item is available on a pre-order basis.",
    "",
    "Each piece is individually produced after your order is confirmed to ensure the highest quality and attention to detail.",
    "",
    "Production: 2-5 business days",
    "Dispatch: Orders are dispatched within 1-3 business days after production is completed.",
].join("\n");

export const DEFAULT_RETURNS_PAGE_POLICY = [
    "We operate a 4-day return policy. This means you have 4 days after receiving your item to request a return.",
    "To be eligible, items must be returned in the same condition they were received - unworn, unused, with all tags intact and in original packaging. Proof of purchase is required.",
    "Returns are only accepted in cases of incorrect items or verified defects. All requests are subject to approval.",
].join("\n\n");

const asText = (value) => (typeof value === "string" ? value : "");

const hasText = (value) => asText(value).trim().length > 0;

/**
 * Resolve the product page note for one product.
 * @returns {{ title: string, text: string }}
 */
export function resolveProductNote(product, settings) {
    const productTitle = asText(product?.productNoteTitle);
    const settingTitle = asText(settings?.product_note_title);

    const productText = asText(product?.productNote);
    const settingText = asText(settings?.product_note_text);

    return {
        title: hasText(productTitle)
            ? productTitle.trim()
            : hasText(settingTitle)
                ? settingTitle.trim()
                : DEFAULT_PRODUCT_NOTE_TITLE,
        text: hasText(productText)
            ? productText.trim()
            : hasText(settingText)
                ? settingText.trim()
                : DEFAULT_PRODUCT_NOTE,
    };
}

/** The panel can be switched off entirely from Admin > Settings > Product page. */
export function isProductNoteEnabled(settings) {
    return settings?.product_note_enabled !== false;
}

/**
 * Return policy body for the /shipping page.
 * `null` means the admin cleared it on purpose and the block should not render.
 */
export function resolveReturnsPagePolicy(settings) {
    const raw = settings?.returns_page_policy;
    if (raw === undefined || raw === null) return DEFAULT_RETURNS_PAGE_POLICY;
    const text = asText(raw).trim();
    return text.length > 0 ? text : null;
}
