// src/utils/permissions.js - the catalogue of what each role may do.
//
// This mirrors public.staff_role_defaults() in
// supabase/migrations/20261017180000_staff_roles_and_ticketing.sql exactly.
// Postgres is the enforcement point; this file only drives the admin UI, so
// hiding a button is never what keeps data private. permissions.test.js fails
// if the two ever drift apart.

export const PERMISSION_GROUPS = [
  {
    key: "store",
    label: "NYNTH WORLD STORE",
    blurb: "The clothing business.",
    permissions: [
      { key: "store.products.view", label: "View live products, prices and descriptions" },
      { key: "store.products.manage", label: "Add, edit and delete products" },
      { key: "store.orders.view", label: "View website orders" },
      { key: "store.orders.manage", label: "Change order status and refunds" },
      { key: "store.carts.view", label: "View abandoned carts" },
      { key: "store.customers.view", label: "View customer activity" },
      { key: "store.customers.email", label: "Email abandoned cart buyers" },
      { key: "store.subscribers.view", label: "View subscribers" },
      { key: "store.subscribers.email", label: "Email subscribers" },
      { key: "store.subscribers.manage", label: "Edit and delete subscribers" },
      { key: "store.discounts.view", label: "View discount codes" },
      { key: "store.discounts.manage", label: "Create and edit discount codes" },
      { key: "store.lookbooks.view", label: "View lookbooks" },
      { key: "store.lookbooks.manage", label: "Create and delete lookbooks" },
      { key: "store.finance.view", label: "Company financial dashboard" },
      { key: "store.settings.manage", label: "Edit site settings" },
      { key: "staff.manage", label: "Create staff and change roles" },
    ],
  },
  {
    key: "ticketing",
    label: "NYNTH WORLD TICKETING",
    blurb: "Events, organizers and the door.",
    permissions: [
      { key: "ticketing.events.view", label: "View events" },
      { key: "ticketing.events.edit", label: "Edit assigned event details" },
      { key: "ticketing.tickets.manage", label: "Manage ticket categories and cancel or reissue" },
      { key: "ticketing.orders.view", label: "View their ticket orders" },
      { key: "ticketing.attendees.view", label: "View attendee details" },
      { key: "ticketing.verify", label: "Verify tickets at the entrance" },
      { key: "ticketing.revenue.view", label: "View their event revenue" },
      { key: "ticketing.refunds.manage", label: "Refund payments" },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
);

export const PERMISSION_LABEL = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => [p.key, p.label]))
);

export const ROLES = [
  {
    key: "vice_admin",
    label: "Vice Admin",
    blurb: "Oversees operations without the financial dashboard. Cannot change products.",
    defaults: [
      "store.products.view",
      "store.orders.view",
      "store.carts.view",
      "store.customers.view",
      "store.customers.email",
      "store.subscribers.view",
      "store.subscribers.email",
      "store.discounts.view",
      "store.lookbooks.view",
      "ticketing.events.view",
      "ticketing.orders.view",
      "ticketing.attendees.view",
    ],
    scopedByEvent: false,
  },
  {
    key: "ticket_organizer",
    label: "Ticket Organizer",
    blurb: "Runs their own event end to end, including its revenue. Sees nothing of the clothing store.",
    defaults: [
      "ticketing.events.view",
      "ticketing.events.edit",
      "ticketing.tickets.manage",
      "ticketing.orders.view",
      "ticketing.attendees.view",
      "ticketing.verify",
      "ticketing.revenue.view",
      "ticketing.refunds.manage",
    ],
    scopedByEvent: true,
  },
  {
    key: "ticket_admin",
    label: "Ticketing Admin",
    blurb: "Runs the door and the ticket list for assigned events. No event edits, no revenue.",
    defaults: [
      "ticketing.events.view",
      "ticketing.orders.view",
      "ticketing.attendees.view",
      "ticketing.verify",
    ],
    scopedByEvent: true,
  },
  {
    key: "ticket_staff",
    label: "Ticketing Staff",
    blurb: "Verification and event management only. View issued tickets, verify entry, change nothing.",
    defaults: [
      "ticketing.events.view",
      "ticketing.orders.view",
      "ticketing.attendees.view",
      "ticketing.verify",
    ],
    scopedByEvent: true,
  },
];

export const ROLE_KEYS = ROLES.map((r) => r.key);

export const roleMeta = (role) => ROLES.find((r) => r.key === role) ?? null;

// The role's defaults as a map, ready to be merged with overrides.
export const roleDefaults = (role) => {
  const meta = roleMeta(role);
  if (!meta) return {};
  return Object.fromEntries(meta.defaults.map((key) => [key, true]));
};

// The role's defaults as a list of keys, which is what most callers want.
export const rolePermissionKeys = (role) => [...(roleMeta(role)?.defaults ?? [])];

// Mirrors `defaults || overrides` in my_permissions(): a per-person override
// wins over the role default in both directions, so the founder can turn any
// single permission on or off without inventing a new role.
export function effectivePermissions(role, overrides = {}) {
  const out = roleDefaults(role);
  for (const [key, value] of Object.entries(overrides ?? {})) {
    if (!ALL_PERMISSION_KEYS.includes(key)) continue;
    if (value === true) out[key] = true;
    else delete out[key];
  }
  return out;
}

// The permission editor's one move.
//
// A click always flips the current value, and the stored override is only the
// difference from the role default. The first version of this compared
// `roleDefaults.includes(key) === on` and then wrote the CURRENT value back,
// so every click on a permission that matched its default was a no-op. That is
// why nothing on the Staff page ticked.
export function togglePermissionOverride(role, overrides, key) {
  if (!ALL_PERMISSION_KEYS.includes(key)) return { ...(overrides ?? {}) };
  const current = effectivePermissions(role, overrides)[key] === true;
  const next = !current;
  const defaults = roleDefaults(role);
  const out = { ...(overrides ?? {}) };
  if (next === Boolean(defaults[key])) delete out[key];
  else out[key] = next;
  return out;
}

export function can(permissions, key) {
  if (!key) return false;
  return permissions?.[key] === true;
}

// Which permission unlocks each admin page. Kept here so the nav, the routes
// and the tests all read the same list.
export const PAGE_PERMISSIONS = {
  "/admin": null, // dashboard is the landing for anybody with staff access
  "/admin/orders": "store.orders.view",
  "/admin/abandoned-checkouts": "store.carts.view",
  "/admin/products": "store.products.view",
  "/admin/events": "ticketing.events.view",
  "/admin/check-in": "ticketing.verify",
  "/admin/discount-codes": "store.discounts.view",
  "/admin/lookbooks": "store.lookbooks.view",
  "/admin/subscribers": "store.subscribers.view",
  "/admin/ticket-platform": "ticketing.revenue.view",
  "/admin/staff": "staff.manage",
  "/admin/settings": "store.settings.manage",
};
