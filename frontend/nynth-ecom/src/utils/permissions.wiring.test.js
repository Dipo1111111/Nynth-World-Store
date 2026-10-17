// Every admin page that mutates something must gate its buttons on a
// permission. Postgres refuses the write either way, so a missing gate here is
// not a security hole, but it is a broken promise: the brief promises a Vice
// Admin can "monitor products and orders (but not edit)", and a Delete button
// that throws an RLS error on click is not that.
//
// The founder holds every permission, so can() is true for them with no
// special case and none of these pages change behaviour for the founder.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ALL_PERMISSION_KEYS } from "./permissions";

const src = (p) => readFileSync(resolve(process.cwd(), p), "utf8");

const GATED = [
  ["src/pages/admin/Products.jsx", "store.products.manage", ["canManageProduct", "canCreateProduct"]],
  ["src/pages/admin/Orders.jsx", "store.orders.manage", ["canManageOrders"]],
  ["src/pages/admin/DiscountCodes.jsx", "store.discounts.manage", ["canManageCodes"]],
  ["src/pages/admin/Subscribers.jsx", "store.subscribers.email", ["canEmailSubscribers"]],
  ["src/pages/admin/Lookbooks.jsx", "store.lookbooks.manage", ["canManageLookbooks"]],
  ["src/pages/admin/CheckIn.jsx", "ticketing.verify", ["can("]],
  ["src/pages/admin/Events.jsx", "ticketing.events.edit", ["canEdit"]],
];

// Read-only pages do not gate in-page controls, because they have none. They
// are gated by the route instead, asserted here against App.jsx.
const ROUTE_GATED = [
  ["/admin/ticket-platform", "ticketing.revenue.view"],
  ["/admin/staff", "staff.manage"],
  ["/admin/settings", "store.settings.manage"],
  ["/admin/discount-codes", "store.discounts.view"],
  ["/admin/subscribers", "store.subscribers.view"],
  ["/admin/lookbooks", "store.lookbooks.view"],
  ["/admin/abandoned-checkouts", "store.carts.view"],
  ["/admin/check-in", "ticketing.verify"],
  ["/admin/events", "ticketing.events.view"],
  ["/admin/orders", "store.orders.view"],
];

describe("admin pages gate their mutating controls", () => {
  for (const [file, permission, markers] of GATED) {
    it(`${file} reads ${permission}`, () => {
      const text = src(file);
      expect(ALL_PERMISSION_KEYS).toContain(permission);
      expect(text).toContain(permission);
      for (const marker of markers) {
        expect(text).toContain(marker);
      }
    });
  }
});

describe("admin routes are permission gated, not founder-only", () => {
  const app = src("src/App.jsx");
  for (const [path, permission] of ROUTE_GATED) {
    it(`${path} requires ${permission}`, () => {
      expect(ALL_PERMISSION_KEYS).toContain(permission);
      const at = app.indexOf(`path="${path}"`);
      expect(at).toBeGreaterThan(-1);
      // The guard sits within the same route element block.
      const block = app.slice(at, at + 400);
      expect(block).toContain(permission);
      expect(block).not.toContain("requireAdmin={true}");
    });
  }

  it("no admin route is left on the founder-only guard", () => {
    // staff.manage and store.finance.view are in no role's defaults, so the
    // founder-only guard was never needed and only hid staff from pages they
    // were entitled to.
    expect(app).not.toContain("requireAdmin={true}");
  });
});

describe("the door never loses its test-ticket gate", () => {
  // Regression guard. The atomic rewrite of Check-In (commit 345beca) dropped
  // the old client-side isTest check and the replacement function did not carry
  // the rule, so a Paystack test ticket became admissible. Both halves are
  // asserted here: the panel in React, and the rule in the SQL.
  it("CheckIn.jsx still branches on is_test", () => {
    const text = src("src/pages/admin/CheckIn.jsx");
    expect(text).toContain("is_test");
    expect(text).toContain('state: "test"');
    expect(text).toContain('state === "test"');
  });

  it("CheckIn.jsx has a test panel with no admit button", () => {
    const text = src("src/pages/admin/CheckIn.jsx");
    const start = text.indexOf('result?.state === "test"');
    expect(start).toBeGreaterThan(-1);
    const panel = text.slice(start, text.indexOf('result?.state === "blocked"'));
    expect(panel).toContain("Next code");
    expect(panel).not.toContain("confirmEntry");
  });

  it("verify_ticket_entry refuses a test ticket in the database", () => {
    const sql = src("supabase/migrations/20261017190000_verify_ticket_blocks_test.sql");
    expect(sql).toContain("if t.is_test then");
    // The refusal must sit ahead of the paid check, so a test ticket is never
    // reported as payable either.
    expect(sql.indexOf("if t.is_test then")).toBeLessThan(sql.indexOf("if t.payment_status <> 'paid' then"));
    expect(sql).toContain("'reason', 'test'");
  });
});
