// ============================================================================
// currency.js - foreign-currency price viewer
// ----------------------------------------------------------------------------
// Shows shoppers what a naira price is roughly worth in USD and GBP, rendered
// under product prices in smaller text. Rates are approximate and only need to
// be directionally right; update the two constants below when they drift.
// ============================================================================

export const NGN_PER_USD = 1500;
export const NGN_PER_GBP = 2000;

const usd = (amount) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / NGN_PER_USD);
const gbp = (amount) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount / NGN_PER_GBP);

// "APPROX $20.00 / £15.00" for a ₦30,000 price. Empty string for invalid input.
export function foreignPriceLabel(amount) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return "";
    return `APPROX ${usd(value)} / ${gbp(value)}`;
}
