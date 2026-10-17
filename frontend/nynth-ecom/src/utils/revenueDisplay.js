// Revenue figure shown on the admin dashboard.
//
// The founder wants the number masked at first glance, revealed on click, and
// able to display a manually set figure instead of the ledger total. A manual
// figure is marked with a red dot so it is obvious, at a glance, that the
// number on screen is not the ledger.
//
// Persisted shape (settings.data.revenue_display):
//   { hide_by_default: boolean, override: number | null }

export const REVENUE_MASK = "****.***";

export const DEFAULT_REVENUE_DISPLAY = {
    hide_by_default: true,
    override: null,
};

/** Coerce anything the settings form can produce into a non-negative number. */
export function toAmount(value) {
    if (value === null || value === undefined || value === "") return null;
    if (typeof value === "number") {
        return Number.isFinite(value) && value >= 0 ? value : null;
    }
    const cleaned = String(value).replace(/[^\d.-]/g, "");
    if (cleaned === "") return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function normalizeRevenueDisplay(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    return {
        hide_by_default: source.hide_by_default !== false,
        override: toAmount(source.override),
    };
}

export function formatNaira(amount, symbol = "\u20A6") {
    const value = toAmount(amount) ?? 0;
    return `${symbol}${value.toLocaleString("en-US")}`;
}

/**
 * Resolve what the dashboard should show.
 * @param {number} ledgerAmount total the orders actually produced
 * @param {{hide_by_default?: boolean, override?: number|null}} rawDisplay settings.revenue_display
 */
export function resolveRevenue(ledgerAmount, rawDisplay) {
    const display = normalizeRevenueDisplay(rawDisplay);
    const ledger = toAmount(ledgerAmount) ?? 0;
    const isOverride = display.override !== null;
    return {
        ledger,
        value: isOverride ? display.override : ledger,
        isOverride,
        hideByDefault: display.hide_by_default,
    };
}

/** Text for the lead metric: masked until revealed, formatted when revealed. */
export function revenueText({ value }, revealed, symbol = "\u20A6") {
    return revealed ? formatNaira(value, symbol) : REVENUE_MASK;
}
