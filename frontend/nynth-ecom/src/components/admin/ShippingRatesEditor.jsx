import React, { useState, useRef, useEffect } from "react";
import { Pencil, Truck, Save, RotateCcw, Check, Power, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import {
    LAGOS_ZONES,
    INTERSTATE_REGIONS,
    LAGOS_SHIPPING_DATA,
    ABUJA_SHIPPING_DATA,
    INTERSTATE_SHIPPING_DATA,
    EMPTY_SHIPPING_RATES
} from "../../data/locationData";
import {
    effectiveLagosRates,
    effectiveAbujaRates,
    effectiveInterstateRates
} from "../../utils/shippingRates";

// Strip currency symbols / thousands separators and parse to a number.
// Returns NaN when there are no usable digits (e.g. empty, "abc", or "₦").
const parseAmount = (raw) => {
    if (raw == null) return NaN;
    const cleaned = String(raw).replace(/[^0-9.]/g, "");
    if (cleaned === "" || cleaned === ".") return NaN;
    const num = Number(cleaned);
    return Number.isNaN(num) ? NaN : num;
};

// Inline-editable price chip. region/key identify the override slot.
function PriceChip({ editingKey, value, isOverridden, onEdit, onCommit, onReset }) {
    const isEditing = editingKey !== null;

    if (isEditing) {
        return (
            <input
                autoFocus
                type="text"
                inputMode="decimal"
                defaultValue={value}
                onBlur={(e) => onCommit(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") onEdit(null);
                }}
                className="w-20 px-2 py-1 text-right border border-black rounded text-[11px] font-bold tabular-nums focus:outline-none"
            />
        );
    }

    return (
        <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-bold tabular-nums ${isOverridden ? "text-black" : "text-gray-500"}`}>
                {value.toLocaleString()}
            </span>
            {isOverridden && (
                <button
                    type="button"
                    title="Reset to base price"
                    onClick={onReset}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                >
                    <RotateCcw size={11} />
                </button>
            )}
            <button
                type="button"
                title="Edit price"
                onClick={onEdit}
                className="text-gray-300 hover:text-black transition-colors"
            >
                <Pencil size={12} />
            </button>
        </div>
    );
}

export default function ShippingRatesEditor({ settings, setSettings, currencySymbol = "₦", onSaveRates }) {
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(null); // `${region}:${key}` or `${region}:${state}:${field}`
    const [bulk, setBulk] = useState({});          // `${region}:${groupId}` -> string
    const [adding, setAdding] = useState(null);     // group key with open add-form, or null
    const [newLoc, setNewLoc] = useState({ name: "", price: "", speed: "" });

    // Tracks whether there are staged edits not yet published by Save Rates.
    const baselineRef = useRef(JSON.stringify(settings.shipping_rates ?? EMPTY_SHIPPING_RATES));
    const [dirty, setDirty] = useState(false);
    useEffect(() => {
        setDirty(JSON.stringify(settings.shipping_rates ?? EMPTY_SHIPPING_RATES) !== baselineRef.current);
    }, [settings.shipping_rates]);

    const rates = settings.shipping_rates || EMPTY_SHIPPING_RATES;
    const lagosRates = effectiveLagosRates(settings);
    const abujaRates = effectiveAbujaRates(settings);
    const interstateRates = effectiveInterstateRates(settings);

    // --- writers ----------------------------------------------------------
    const writeSingle = (region, key, value, baseValue) => {
        if (value === "" || value == null) {
            setSettings((prev) => {
                const regionMap = { ...(prev.shipping_rates?.[region] || {}) };
                delete regionMap[key];
                return { ...prev, shipping_rates: { ...prev.shipping_rates, [region]: regionMap } };
            });
            return;
        }
        const num = parseAmount(value);
        if (Number.isNaN(num)) {
            toast.error("Enter a valid amount");
            return;
        }
        setSettings((prev) => {
            const regionMap = { ...(prev.shipping_rates?.[region] || {}) };
            if (num === baseValue) delete regionMap[key];
            else regionMap[key] = num;
            return { ...prev, shipping_rates: { ...prev.shipping_rates, [region]: regionMap } };
        });
    };

    const writeInterstate = (state, field, value) => {
        const parsed = value === "" || value == null ? null : parseAmount(value);
        if (parsed !== null && Number.isNaN(parsed)) {
            toast.error("Enter a valid amount");
            return;
        }
        setSettings((prev) => {
            const regionMap = { ...(prev.shipping_rates?.interstate || {}) };
            const base = INTERSTATE_SHIPPING_DATA[state];
            const cur = regionMap[state] || { home: base.home, park: base.park };
            const home = field === "home" ? (value === "" || value == null ? base.home : parsed) : cur.home;
            const park = field === "park" ? (value === "" || value == null ? base.park : parsed) : cur.park;
            if (home === base.home && park === base.park) delete regionMap[state];
            else regionMap[state] = { home, park };
            return { ...prev, shipping_rates: { ...prev.shipping_rates, interstate: regionMap } };
        });
    };

    // --- enable/disable (writes disabled_locations, prices untouched) -----------
    const disabledFor = (region) => settings.disabled_locations?.[region] || [];
    const isAreaDisabled = (region, key) => disabledFor(region).includes(key);
    const toggleArea = (region, key) => {
        setSettings((prev) => {
            const cur = prev.disabled_locations?.[region] || [];
            const updated = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
            return { ...prev, disabled_locations: { ...prev.disabled_locations, [region]: updated } };
        });
    };
    const setZoneDisabled = (region, keys, disable) => {
        setSettings((prev) => {
            const cur = prev.disabled_locations?.[region] || [];
            const updated = disable
                ? [...new Set([...cur, ...keys])]
                : cur.filter((k) => !keys.includes(k));
            return { ...prev, disabled_locations: { ...prev.disabled_locations, [region]: updated } };
        });
        toast.success(disable ? "Zone disabled — hidden at checkout, prices kept" : "Zone enabled — back live at checkout");
    };

    // --- custom locations (stored in settings.custom_shipping_locations) --------
    const addCustomLocation = (region, groupAreas, isInterstate = false) => {
        const name = (newLoc.name ?? "").trim();
        const price = parseAmount(newLoc.price);
        if (!name) { toast.error("Enter a location name"); return; }
        if (Number.isNaN(price)) { toast.error("Enter a valid price"); return; }
        if (groupAreas.includes(name)) { toast.error("That location already exists"); return; }
        setSettings((prev) => {
            const cur = { ...(prev.custom_shipping_locations?.[region] || {}) };
            cur[name] = isInterstate
                ? { home: price, park: price }
                : { price, speed: newLoc.speed?.trim() || undefined };
            return { ...prev, custom_shipping_locations: { ...prev.custom_shipping_locations, [region]: cur } };
        });
        setNewLoc({ name: "", price: "", speed: "" });
        setAdding(null);
        toast.success(`Added ${name} — press Save All Settings to publish`);
    };
    const deleteCustomLocation = (region, name) => {
        if (!window.confirm(`Delete custom location "${name}"?`)) return;
        setSettings((prev) => {
            const cur = { ...(prev.custom_shipping_locations?.[region] || {}) };
            delete cur[name];
            const ratesMap = { ...(prev.shipping_rates?.[region] || {}) };
            delete ratesMap[name];
            const dis = (prev.disabled_locations?.[region] || []).filter((k) => k !== name);
            return {
                ...prev,
                custom_shipping_locations: { ...prev.custom_shipping_locations, [region]: cur },
                shipping_rates: { ...prev.shipping_rates, [region]: ratesMap },
                disabled_locations: { ...prev.disabled_locations, [region]: dis }
            };
        });
    };

    const applyBulk = (region, group, value) => {
        const trimmed = (value ?? "").toString().trim();
        if (trimmed === "") return; // empty bulk field = nothing to apply, not an error
        const num = parseAmount(trimmed);
        if (Number.isNaN(num)) {
            toast.error("Enter a valid amount");
            return;
        }
        setSettings((prev) => {
            const regionMap = { ...(prev.shipping_rates?.[region] || {}) };
            group.areas.forEach((area) => {
                const base = LAGOS_SHIPPING_DATA[area]?.price ?? ABUJA_SHIPPING_DATA[area]?.price;
                if (num === base) delete regionMap[area];
                else regionMap[area] = num;
            });
            return { ...prev, shipping_rates: { ...prev.shipping_rates, [region]: regionMap } };
        });
        setBulk((prev) => ({ ...prev, [`${region}:${group.id}`]: "" }));
        toast.success(`Updated ${group.areas.length} areas in ${group.name}`);
    };

    const applyBulkInterstate = (region, group, value) => {
        const trimmed = (value ?? "").toString().trim();
        if (trimmed === "") return; // empty bulk field = nothing to apply, not an error
        const num = parseAmount(trimmed);
        if (Number.isNaN(num)) {
            toast.error("Enter a valid amount");
            return;
        }
        setSettings((prev) => {
            const regionMap = { ...(prev.shipping_rates?.interstate || {}) };
            group.states.forEach((state) => {
                const base = INTERSTATE_SHIPPING_DATA[state];
                if (num === base.home && num === base.park) delete regionMap[state];
                else regionMap[state] = { home: num, park: num };
            });
            return { ...prev, shipping_rates: { ...prev.shipping_rates, interstate: regionMap } };
        });
        setBulk((prev) => ({ ...prev, [`interstate:${group.id}`]: "" }));
        toast.success(`Updated ${group.states.length} states in ${group.name}`);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSaveRates();
            baselineRef.current = JSON.stringify(settings.shipping_rates ?? EMPTY_SHIPPING_RATES);
            setDirty(false);
        } finally {
            setSaving(false);
        }
    };

    // --- render groups (Lagos + Abuja share the single-price layout) ------
    const customLagos = Object.keys(settings.custom_shipping_locations?.lagos || {});
    const customAbuja = Object.keys(settings.custom_shipping_locations?.abuja || {});
    const customInterstate = Object.keys(settings.custom_shipping_locations?.interstate || {});
    const lagosGroups = LAGOS_ZONES.map((g) =>
        g.id === "other" ? { ...g, areas: [...g.areas, ...customLagos] } : g
    );
    const singleGroups = [
        { region: "lagos", title: "Lagos (Within City)", groups: lagosGroups, rates: lagosRates },
        {
            region: "abuja",
            title: "Abuja",
            groups: [{ id: "abuja", name: "Abuja", price: null, areas: [...Object.keys(ABUJA_SHIPPING_DATA), ...customAbuja] }],
            rates: abujaRates
        }
    ];

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Truck size={18} className="text-gray-400" />
                    <h3 className="font-bold text-lg">Shipping Rates</h3>
                    {dirty && (
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Unsaved
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !dirty}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    {saving ? <Save size={14} className="animate-pulse" /> : <Save size={14} />}
                    {saving ? "Saving..." : "Save Rates"}
                </button>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6 leading-relaxed">
                Edit one location with its pen (press Enter to confirm). Or fill a whole zone at once with "Set all". Edits stage below - hit <span className="text-black">Save Rates</span> to publish them to checkout.
            </p>

            {/* LAGOS + ABUJA */}
            {singleGroups.map(({ region, title, groups, rates: r }) => (
                <div key={region} className="mb-8">
                    <h4 className="text-sm font-bold text-black uppercase tracking-tight mb-4">{title}</h4>
                    <div className="space-y-5">
                        {groups.map((group) => {
                            const bulkKey = `${region}:${group.id}`;
                            const editedCount = group.areas.filter((a) => rates[region]?.[a] != null).length;
                            return (
                                <div key={group.id} className="border border-gray-100 rounded-lg p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-bold uppercase tracking-widest text-black">{group.name}</span>
                                            {group.price != null && (
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                                                    base {currencySymbol}{group.price.toLocaleString()}
                                                </span>
                                            )}
                                            {editedCount > 0 && (
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-black bg-gray-900 px-2 py-0.5 rounded text-white">
                                                    {editedCount} edited
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap justify-end">
                                            {(() => {
                                                const allOff = group.areas.length > 0 && group.areas.every((a) => isAreaDisabled(region, a));
                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => setZoneDisabled(region, group.areas, !allOff)}
                                                        title={allOff ? "Enable this whole zone at checkout" : "Disable this whole zone at checkout (prices kept)"}
                                                        className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-opacity hover:opacity-80 ${allOff ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}
                                                    >
                                                        <Power size={12} /> {allOff ? "Enable zone" : "Disable zone"}
                                                    </button>
                                                );
                                            })()}
                                            <button
                                                type="button"
                                                onClick={() => { setAdding(adding === `${region}:${group.id}` ? null : `${region}:${group.id}`); setNewLoc({ name: "", price: "", speed: "" }); }}
                                                title="Add a new location to this zone"
                                                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-dashed border-gray-300 text-gray-600 hover:border-black hover:text-black transition-colors"
                                            >
                                                <Plus size={12} /> Add location
                                            </button>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Set all to</span>
                                            <span className="text-gray-400 text-xs font-bold">{currencySymbol}</span>
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                value={bulk[bulkKey] || ""}
                                                onChange={(e) => setBulk((prev) => ({ ...prev, [bulkKey]: e.target.value }))}
                                                placeholder="₦"
                                                className="w-24 px-2 py-1 border border-gray-200 rounded text-[11px] font-bold tabular-nums focus:border-black transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => applyBulk(region, group, bulk[bulkKey])}
                                                disabled={(bulk[bulkKey] ?? "").toString().trim() === ""}
                                                title="Fill every area in this zone with one price"
                                                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Check size={12} /> Set all
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {group.areas.map((area) => {
                                            const customDef = settings.custom_shipping_locations?.[region]?.[area];
                                            const base = LAGOS_SHIPPING_DATA[area]?.price ?? ABUJA_SHIPPING_DATA[area]?.price ?? Number(customDef?.price ?? 0);
                                            const effective = r[area]?.price ?? base;
                                            const overridden = rates[region]?.[area] != null;
                                            const off = isAreaDisabled(region, area);
                                            const eKey = `${region}:${area}`;
                                            return (
                                                <div
                                                    key={area}
                                                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                        off ? "border-gray-100 bg-gray-50 opacity-60" : overridden ? "border-black/20 bg-gray-50" : "border-black/10 bg-white"
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-1.5 min-w-0 mr-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleArea(region, area)}
                                                            title={off ? `Enable ${area} at checkout` : `Disable ${area} at checkout (price kept)`}
                                                            className={`shrink-0 rounded-full p-1 transition-colors ${off ? "bg-gray-200 text-gray-400 hover:bg-green-100 hover:text-green-700" : "bg-green-100 text-green-700 hover:bg-gray-200 hover:text-gray-500"}`}
                                                        >
                                                            <Power size={11} />
                                                        </button>
                                                        <span className={`truncate ${off ? "text-gray-300 line-through" : "text-gray-700"}`}>{area}</span>
                                                        {customDef && (
                                                            <span className="shrink-0 text-[8px] font-bold uppercase tracking-widest bg-black text-white px-1.5 py-0.5 rounded">Custom</span>
                                                        )}
                                                    </span>
                                                    <span className="flex items-center gap-0.5 shrink-0">
                                                        <span className="text-gray-400 text-[10px] font-bold mr-0.5">{currencySymbol}</span>
                                                        <PriceChip
                                                            editingKey={editing === eKey ? eKey : null}
                                                            value={effective}
                                                            isOverridden={overridden}
                                                            onEdit={(k) => setEditing(k === null ? null : eKey)}
                                                            onCommit={(v) => { writeSingle(region, area, v, base); setEditing(null); }}
                                                            onReset={() => writeSingle(region, area, "", base)}
                                                        />
                                                        {customDef && (
                                                            <button
                                                                type="button"
                                                                title={`Delete custom location ${area}`}
                                                                onClick={() => deleteCustomLocation(region, area)}
                                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {adding === `${region}:${group.id}` && (
                                        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-dashed border-gray-200 pt-3">
                                            <label className="flex flex-col gap-1">
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Location name</span>
                                                <input
                                                    type="text"
                                                    value={newLoc.name}
                                                    onChange={(e) => setNewLoc((p) => ({ ...p, name: e.target.value }))}
                                                    placeholder="e.g. Sangotedo Phase 2"
                                                    className="w-44 px-2 py-1.5 border border-gray-200 rounded text-[11px] font-bold focus:border-black transition-colors"
                                                />
                                            </label>
                                            <label className="flex flex-col gap-1">
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Price ({currencySymbol})</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={newLoc.price}
                                                    onChange={(e) => setNewLoc((p) => ({ ...p, price: e.target.value }))}
                                                    placeholder="4500"
                                                    className="w-24 px-2 py-1.5 border border-gray-200 rounded text-[11px] font-bold tabular-nums focus:border-black transition-colors"
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => addCustomLocation(region, [...group.areas, ...Object.keys(settings.custom_shipping_locations?.[region] || {})])}
                                                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-black text-white px-3 py-2 rounded hover:opacity-80 transition-opacity"
                                            >
                                                <Check size={12} /> Add
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAdding(null)}
                                                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black px-2 py-2 transition-colors"
                                            >
                                                <X size={12} /> Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* INTERSTATE */}
            <div>
                <h4 className="text-sm font-bold text-black uppercase tracking-tight mb-4">Interstate (Out of Lagos)</h4>
                <div className="space-y-5">
                    {INTERSTATE_REGIONS.map((group) => {
                        const bulkKey = `interstate:${group.id}`;
                        const editedCount = group.states.filter((s) => rates.interstate?.[s] != null).length;
                        return (
                            <div key={group.id} className="border border-gray-100 rounded-lg p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-black">{group.name}</span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                                            base {currencySymbol}{group.price.toLocaleString()}
                                        </span>
                                        {editedCount > 0 && (
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-black bg-gray-900 px-2 py-0.5 rounded text-white">
                                                {editedCount} edited
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap justify-end">
                                        {(() => {
                                            const allOff = group.states.length > 0 && group.states.every((s) => isAreaDisabled("interstate", s));
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => setZoneDisabled("interstate", group.states, !allOff)}
                                                    title={allOff ? "Enable this whole region at checkout" : "Disable this whole region at checkout (prices kept)"}
                                                    className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-opacity hover:opacity-80 ${allOff ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}
                                                >
                                                    <Power size={12} /> {allOff ? "Enable region" : "Disable region"}
                                                </button>
                                            );
                                        })()}
                                        <button
                                            type="button"
                                            onClick={() => { setAdding(adding === `interstate:${group.id}` ? null : `interstate:${group.id}`); setNewLoc({ name: "", price: "", speed: "" }); }}
                                            title="Add a new state to this region"
                                            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border border-dashed border-gray-300 text-gray-600 hover:border-black hover:text-black transition-colors"
                                        >
                                            <Plus size={12} /> Add location
                                        </button>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Set all to</span>
                                        <span className="text-gray-400 text-xs font-bold">{currencySymbol}</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={bulk[bulkKey] || ""}
                                            onChange={(e) => setBulk((prev) => ({ ...prev, [bulkKey]: e.target.value }))}
                                            placeholder="₦"
                                            className="w-24 px-2 py-1 border border-gray-200 rounded text-[11px] font-bold tabular-nums focus:border-black transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => applyBulkInterstate(null, group, bulk[bulkKey])}
                                            disabled={(bulk[bulkKey] ?? "").toString().trim() === ""}
                                            title="Fill every state in this region with one price"
                                            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <Check size={12} /> Set all
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {group.states.map((state) => {
                                        const customDef = settings.custom_shipping_locations?.interstate?.[state];
                                        const base = INTERSTATE_SHIPPING_DATA[state] || (customDef ? { home: Number(customDef.home ?? 0), park: Number(customDef.park ?? 0) } : null);
                                        const eff = interstateRates[state] || base;
                                        if (!eff) return null;
                                        const overridden = rates.interstate?.[state] != null;
                                        const off = isAreaDisabled("interstate", state);
                                        return (
                                            <div
                                                key={state}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                    off ? "border-gray-100 bg-gray-50 opacity-60" : overridden ? "border-black/20 bg-gray-50" : "border-black/10 bg-white"
                                                }`}
                                            >
                                                <span className="flex items-center gap-1.5 min-w-0 mr-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleArea("interstate", state)}
                                                        title={off ? `Enable ${state} at checkout` : `Disable ${state} at checkout (price kept)`}
                                                        className={`shrink-0 rounded-full p-1 transition-colors ${off ? "bg-gray-200 text-gray-400 hover:bg-green-100 hover:text-green-700" : "bg-green-100 text-green-700 hover:bg-gray-200 hover:text-gray-500"}`}
                                                    >
                                                        <Power size={11} />
                                                    </button>
                                                    <span className={`truncate ${off ? "text-gray-300 line-through" : "text-gray-700"}`}>{state}</span>
                                                    {customDef && (
                                                        <>
                                                            <span className="shrink-0 text-[8px] font-bold uppercase tracking-widest bg-black text-white px-1.5 py-0.5 rounded">Custom</span>
                                                            <button
                                                                type="button"
                                                                title={`Delete custom location ${state}`}
                                                                onClick={() => deleteCustomLocation("interstate", state)}
                                                                className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </>
                                                    )}
                                                </span>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Home</span>
                                                        <PriceChip
                                                            editingKey={editing === `interstate:${state}:home` ? `interstate:${state}:home` : null}
                                                            value={eff.home}
                                                            isOverridden={overridden && eff.home !== base.home}
                                                            onEdit={() => setEditing(`interstate:${state}:home`)}
                                                            onCommit={(v) => { writeInterstate(state, "home", v); setEditing(null); }}
                                                            onReset={() => writeInterstate(state, "home", "")}
                                                        />
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Park</span>
                                                        <PriceChip
                                                            editingKey={editing === `interstate:${state}:park` ? `interstate:${state}:park` : null}
                                                            value={eff.park}
                                                            isOverridden={overridden && eff.park !== base.park}
                                                            onEdit={() => setEditing(`interstate:${state}:park`)}
                                                            onCommit={(v) => { writeInterstate(state, "park", v); setEditing(null); }}
                                                            onReset={() => writeInterstate(state, "park", "")}
                                                        />
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                    {adding === `interstate:${group.id}` && (
                                        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-dashed border-gray-200 pt-3">
                                            <label className="flex flex-col gap-1">
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">State name</span>
                                                <input
                                                    type="text"
                                                    value={newLoc.name}
                                                    onChange={(e) => setNewLoc((p) => ({ ...p, name: e.target.value }))}
                                                    placeholder="e.g. Bayelsa"
                                                    className="w-44 px-2 py-1.5 border border-gray-200 rounded text-[11px] font-bold focus:border-black transition-colors"
                                                />
                                            </label>
                                            <label className="flex flex-col gap-1">
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Price ({currencySymbol})</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    value={newLoc.price}
                                                    onChange={(e) => setNewLoc((p) => ({ ...p, price: e.target.value }))}
                                                    placeholder="8500"
                                                    className="w-24 px-2 py-1.5 border border-gray-200 rounded text-[11px] font-bold tabular-nums focus:border-black transition-colors"
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => addCustomLocation("interstate", [...group.states, ...customInterstate], true)}
                                                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-black text-white px-3 py-2 rounded hover:opacity-80 transition-opacity"
                                            >
                                                <Check size={12} /> Add
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAdding(null)}
                                                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-black px-2 py-2 transition-colors"
                                            >
                                                <X size={12} /> Cancel
                                            </button>
                                        </div>
                                    )}
                            </div>
                        );
                    })}
                    {customInterstate.filter((s) => !Object.keys(INTERSTATE_SHIPPING_DATA).includes(s)).length > 0 && (
                        <div className="border border-dashed border-gray-200 rounded-lg p-4">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-black">Custom states</span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                                {customInterstate.filter((s) => !Object.keys(INTERSTATE_SHIPPING_DATA).includes(s)).map((state) => {
                                    const eff = interstateRates[state];
                                    if (!eff) return null;
                                    const off = isAreaDisabled("interstate", state);
                                    return (
                                        <div key={state} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${off ? "border-gray-100 bg-gray-50 opacity-60" : "border-black/10 bg-white"}`}>
                                            <span className="flex items-center gap-1.5 min-w-0 mr-2">
                                                <button type="button" onClick={() => toggleArea("interstate", state)} className={`shrink-0 rounded-full p-1 transition-colors ${off ? "bg-gray-200 text-gray-400" : "bg-green-100 text-green-700"}`}>
                                                    <Power size={11} />
                                                </button>
                                                <span className={`truncate ${off ? "text-gray-300 line-through" : "text-gray-700"}`}>{state}</span>
                                                <span className="shrink-0 text-[8px] font-bold uppercase tracking-widest bg-black text-white px-1.5 py-0.5 rounded">Custom</span>
                                                <button type="button" title={`Delete ${state}`} onClick={() => deleteCustomLocation("interstate", state)} className="shrink-0 text-gray-300 hover:text-red-500 transition-colors">
                                                    <Trash2 size={12} />
                                                </button>
                                            </span>
                                            <span className="text-[11px] font-bold tabular-nums">{currencySymbol}{Number(eff.home ?? 0).toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
