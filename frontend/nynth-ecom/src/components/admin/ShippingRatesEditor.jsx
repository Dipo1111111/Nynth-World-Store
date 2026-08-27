import React, { useState } from "react";
import { Pencil, Truck, Save, RotateCcw, Check } from "lucide-react";
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

// Inline-editable price chip. region/key identify the override slot.
function PriceChip({ editingKey, value, isOverridden, onEdit, onCommit, onReset }) {
    const isEditing = editingKey !== null;

    if (isEditing) {
        return (
            <input
                autoFocus
                type="number"
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

    const rates = settings.shipping_rates || EMPTY_SHIPPING_RATES;
    const lagosRates = effectiveLagosRates(settings);
    const abujaRates = effectiveAbujaRates(settings);
    const interstateRates = effectiveInterstateRates(settings);

    // --- writers ----------------------------------------------------------
    const writeSingle = (region, key, value, baseValue) => {
        setSettings((prev) => {
            const regionMap = { ...(prev.shipping_rates?.[region] || {}) };
            if (value === "" || value == null) {
                delete regionMap[key];
            } else {
                const num = Number(value);
                if (Number.isNaN(num)) return prev;
                if (num === baseValue) delete regionMap[key];
                else regionMap[key] = num;
            }
            return { ...prev, shipping_rates: { ...prev.shipping_rates, [region]: regionMap } };
        });
    };

    const writeInterstate = (state, field, value) => {
        setSettings((prev) => {
            const regionMap = { ...(prev.shipping_rates?.interstate || {}) };
            const base = INTERSTATE_SHIPPING_DATA[state];
            const cur = regionMap[state] || { home: base.home, park: base.park };
            const home = field === "home" ? (value === "" ? base.home : Number(value)) : cur.home;
            const park = field === "park" ? (value === "" ? base.park : Number(value)) : cur.park;
            if (home === base.home && park === base.park) delete regionMap[state];
            else regionMap[state] = { home, park };
            return { ...prev, shipping_rates: { ...prev.shipping_rates, interstate: regionMap } };
        });
    };

    const applyBulk = (region, group, value) => {
        const num = Number(value);
        if (value === "" || Number.isNaN(num)) {
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
        const num = Number(value);
        if (value === "" || Number.isNaN(num)) {
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
        } finally {
            setSaving(false);
        }
    };

    // --- render groups (Lagos + Abuja share the single-price layout) ------
    const singleGroups = [
        { region: "lagos", title: "Lagos (Within City)", groups: LAGOS_ZONES, rates: lagosRates },
        {
            region: "abuja",
            title: "Abuja",
            groups: [{ id: "abuja", name: "Abuja", price: null, areas: Object.keys(ABUJA_SHIPPING_DATA) }],
            rates: abujaRates
        }
    ];

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Truck size={18} className="text-gray-400" />
                    <h3 className="font-bold text-lg">Shipping Rates</h3>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-60 transition-all"
                >
                    {saving ? <Save size={14} className="animate-pulse" /> : <Save size={14} />}
                    {saving ? "Saving..." : "Save Rates"}
                </button>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6 leading-relaxed">
                Click the pen icon on any location to edit its price. Use a zone's bulk field to update every area in that zone at once. Changes apply at checkout as soon as you Save Rates.
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
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Set all to</span>
                                            <span className="text-gray-400 text-xs font-bold">{currencySymbol}</span>
                                            <input
                                                type="number"
                                                value={bulk[bulkKey] || ""}
                                                onChange={(e) => setBulk((prev) => ({ ...prev, [bulkKey]: e.target.value }))}
                                                placeholder="₦"
                                                className="w-24 px-2 py-1 border border-gray-200 rounded text-[11px] font-bold tabular-nums focus:border-black transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => applyBulk(region, group, bulk[bulkKey])}
                                                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded hover:opacity-80 transition-opacity"
                                            >
                                                <Check size={12} /> Apply
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {group.areas.map((area) => {
                                            const base = LAGOS_SHIPPING_DATA[area]?.price ?? ABUJA_SHIPPING_DATA[area]?.price;
                                            const effective = r[area]?.price ?? base;
                                            const overridden = rates[region]?.[area] != null;
                                            const eKey = `${region}:${area}`;
                                            return (
                                                <div
                                                    key={area}
                                                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                        overridden ? "border-black/20 bg-gray-50" : "border-black/10 bg-white"
                                                    }`}
                                                >
                                                    <span className="truncate mr-2 text-gray-700">{area}</span>
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
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
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
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Set all to</span>
                                        <span className="text-gray-400 text-xs font-bold">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            value={bulk[bulkKey] || ""}
                                            onChange={(e) => setBulk((prev) => ({ ...prev, [bulkKey]: e.target.value }))}
                                            placeholder="₦"
                                            className="w-24 px-2 py-1 border border-gray-200 rounded text-[11px] font-bold tabular-nums focus:border-black transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => applyBulkInterstate(null, group, bulk[bulkKey])}
                                            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-black text-white px-3 py-1.5 rounded hover:opacity-80 transition-opacity"
                                        >
                                            <Check size={12} /> Apply
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {group.states.map((state) => {
                                        const base = INTERSTATE_SHIPPING_DATA[state];
                                        const eff = interstateRates[state] || base;
                                        const overridden = rates.interstate?.[state] != null;
                                        return (
                                            <div
                                                key={state}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${
                                                    overridden ? "border-black/20 bg-gray-50" : "border-black/10 bg-white"
                                                }`}
                                            >
                                                <span className="truncate mr-2 text-gray-700">{state}</span>
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
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
