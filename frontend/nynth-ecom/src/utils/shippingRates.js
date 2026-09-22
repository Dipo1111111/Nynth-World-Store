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

const safeCustom = (settings) =>
    (settings && settings.custom_shipping_locations) || { lagos: {}, abuja: {}, interstate: {} };

// --- Lagos ----------------------------------------------------------------
export function effectiveLagosRates(settings) {
    const overrides = safeRates(settings).lagos || {};
    const custom = safeCustom(settings).lagos || {};
    const out = {};
    for (const area of Object.keys(LAGOS_SHIPPING_DATA)) {
        const base = LAGOS_SHIPPING_DATA[area];
        out[area] = {
            ...base,
            price: overrides[area] != null ? Number(overrides[area]) : base.price
        };
    }
    for (const area of Object.keys(custom)) {
        const c = custom[area] || {};
        out[area] = {
            speed: c.speed || "Same Day Delivery",
            custom: true,
            price: overrides[area] != null ? Number(overrides[area]) : Number(c.price ?? 0)
        };
    }
    return out;
}

export function getLagosPrice(area, settings) {
    const base = LAGOS_SHIPPING_DATA[area] || safeCustom(settings).lagos?.[area];
    if (!base) return 0;
    const override = safeRates(settings).lagos?.[area];
    return override != null ? Number(override) : Number(base.price ?? 0);
}

// --- Abuja ----------------------------------------------------------------
export function effectiveAbujaRates(settings) {
    const overrides = safeRates(settings).abuja || {};
    const custom = safeCustom(settings).abuja || {};
    const out = {};
    for (const area of Object.keys(ABUJA_SHIPPING_DATA)) {
        const base = ABUJA_SHIPPING_DATA[area];
        out[area] = {
            ...base,
            price: overrides[area] != null ? Number(overrides[area]) : base.price
        };
    }
    for (const area of Object.keys(custom)) {
        const c = custom[area] || {};
        out[area] = {
            speed: c.speed || "Delivery",
            custom: true,
            price: overrides[area] != null ? Number(overrides[area]) : Number(c.price ?? 0)
        };
    }
    return out;
}

export function getAbujaPrice(area, settings) {
    const base = ABUJA_SHIPPING_DATA[area] || safeCustom(settings).abuja?.[area];
    if (!base) return 0;
    const override = safeRates(settings).abuja?.[area];
    return override != null ? Number(override) : Number(base.price ?? 0);
}

// --- Interstate ------------------------------------------------------------
export function effectiveInterstateRates(settings) {
    const overrides = safeRates(settings).interstate || {};
    const custom = safeCustom(settings).interstate || {};
    const out = {};
    for (const state of Object.keys(INTERSTATE_SHIPPING_DATA)) {
        const base = INTERSTATE_SHIPPING_DATA[state];
        const o = overrides[state];
        out[state] = {
            home: o?.home != null ? Number(o.home) : base.home,
            park: o?.park != null ? Number(o.park) : base.park
        };
    }
    for (const state of Object.keys(custom)) {
        if (out[state]) continue;
        const c = custom[state] || {};
        const o = overrides[state];
        out[state] = {
            custom: true,
            home: o?.home != null ? Number(o.home) : Number(c.home ?? c.price ?? 0),
            park: o?.park != null ? Number(o.park) : Number(c.park ?? c.price ?? 0)
        };
    }
    return out;
}

export function getInterstatePrices(state, settings) {
    const base = INTERSTATE_SHIPPING_DATA[state] || safeCustom(settings).interstate?.[state];
    if (!base) return null;
    const o = safeRates(settings).interstate?.[state];
    return {
        home: o?.home != null ? Number(o.home) : Number(base.home ?? base.price ?? 0),
        park: o?.park != null ? Number(o.park) : Number(base.park ?? base.price ?? 0)
    };
}
