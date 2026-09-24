// src/utils/shopConfig.js - single source of truth for the Shop page layout
// settings that the admin can control: category tab order and the bold tickets
// band (position, scope, and how many tickets it shows).

export const TICKETS_CATEGORY = "tickets";

export const DEFAULT_CATEGORY_ORDER = [
  "all",
  "tees",
  "hoodies",
  "headwear",
  "accessories",
  "pants",
  "polo",
  "sleeves",
  TICKETS_CATEGORY,
];

export const BAND_POSITIONS = ["top", "bottom", "hidden"];

export const BAND_SCOPES = ["all", "tickets_only"];

export const DEFAULT_BAND_LIMIT = 3;

export const categoryLabel = (cat) => (cat === "tees" ? "t-shirts" : cat);

export const normalizeCategoryOrder = (order) => {
  if (!Array.isArray(order)) return [...DEFAULT_CATEGORY_ORDER];
  const seen = new Set();
  const out = [];
  for (const cat of order) {
    if (typeof cat !== "string") continue;
    const key = cat.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  if (!seen.has("all")) out.unshift("all");
  return out.length ? out : [...DEFAULT_CATEGORY_ORDER];
};

export const normalizeBandPosition = (value) =>
  BAND_POSITIONS.includes(value) ? value : "top";

export const normalizeBandScope = (value) =>
  BAND_SCOPES.includes(value) ? value : "all";

export const normalizeBandLimit = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_BAND_LIMIT;
  return Math.max(1, Math.min(6, Math.floor(n)));
};