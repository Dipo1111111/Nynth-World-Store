// ============================================================================
// shippingRates.js
// ----------------------------------------------------------------------------
// Merges the hardcoded base prices in src/data/locationData.js with the
// admin's overrides stored in Firestore (settings.site_config.shipping_rates)
// and returns the *effective* prices used at checkout.
//
// Firestore override shape:
//   shipping_rates: {
//     lagos:     { [area]: <number> },
//     abuja:     { [area]: <number> },
//     interstate:{ [state]: { home: <number>, park: <number> } }
//   }
// Only changed values are stored; everything else falls back to the base map.
// ============================================================================

import {
    LAGOS_SHIPPING_DATA,
    ABUJA_SHIPPING_DATA,
    INTERSTATE_SHIPPING_DATA
} from "../data/locationData";

const safeRates = (settings) =>
    (settings && settings.shipping_rates) || { lagos: {}, abuja: {}, interstate: {} };

// --- Lagos ----------------------------------------------------------------
export function effectiveLagosRates(settings) {
    const overrides = safeRates(settings).lagos || {};
    const out = {};
    for (const area of Object.keys(LAGOS_SHIPPING_DATA)) {
        const base = LAGOS_SHIPPING_DATA[area];
        out[area] = {
            ...base,
            price: overrides[area] != null ? Number(overrides[area]) : base.price
        };
    }
    return out;
}

export function getLagosPrice(area, settings) {
    const base = LAGOS_SHIPPING_DATA[area];
    if (!base) return 0;
    const override = safeRates(settings).lagos?.[area];
    return override != null ? Number(override) : base.price;
}

// --- Abuja ----------------------------------------------------------------
export function effectiveAbujaRates(settings) {
    const overrides = safeRates(settings).abuja || {};
    const out = {};
    for (const area of Object.keys(ABUJA_SHIPPING_DATA)) {
        const base = ABUJA_SHIPPING_DATA[area];
        out[area] = {
            ...base,
            price: overrides[area] != null ? Number(overrides[area]) : base.price
        };
    }
    return out;
}

export function getAbujaPrice(area, settings) {
    const base = ABUJA_SHIPPING_DATA[area];
    if (!base) return 0;
    const override = safeRates(settings).abuja?.[area];
    return override != null ? Number(override) : base.price;
}

// --- Interstate ------------------------------------------------------------
export function effectiveInterstateRates(settings) {
    const overrides = safeRates(settings).interstate || {};
    const out = {};
    for (const state of Object.keys(INTERSTATE_SHIPPING_DATA)) {
        const base = INTERSTATE_SHIPPING_DATA[state];
        const o = overrides[state];
        out[state] = {
            home: o?.home != null ? Number(o.home) : base.home,
            park: o?.park != null ? Number(o.park) : base.park
        };
    }
    return out;
}

export function getInterstatePrices(state, settings) {
    const base = INTERSTATE_SHIPPING_DATA[state];
    if (!base) return null;
    const o = safeRates(settings).interstate?.[state];
    return {
        home: o?.home != null ? Number(o.home) : base.home,
        park: o?.park != null ? Number(o.park) : base.park
    };
}
