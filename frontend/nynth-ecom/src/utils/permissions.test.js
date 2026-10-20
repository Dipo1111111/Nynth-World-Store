// The permission catalogue in src/utils/permissions.js has to agree with
// public.staff_role_defaults() in Postgres, key for key and value for value.
// Postgres is the enforcement point, so drift here would show the founder a
// control that does not actually do anything (or hide one that does).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ALL_PERMISSION_KEYS,
  ROLES,
  PERMISSION_LABEL,
  PAGE_PERMISSIONS,
  effectivePermissions,
  rolePermissionKeys,
  roleMeta,
  togglePermissionOverride,
} from "./permissions";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261017180000_staff_roles_and_ticketing.sql"),
  "utf8"
);

// The four role blocks inside staff_role_defaults(), in source order.
const defaultsBlock = sql.slice(
  sql.indexOf("create or replace function public.staff_role_defaults"),
  sql.indexOf("create or replace function public.current_staff_role")
);

const sqlRoleDefaults = () => {
  const out = {};
  for (const match of defaultsBlock.matchAll(/when '([a-z_]+)' then '(\{[\s\S]*?\})'::jsonb/g)) {
    const [, role, json] = match;
    out[role] = Object.keys(JSON.parse(json));
  }
  return out;
};

describe("permission catalogue", () => {
  const sqlDefaults = sqlRoleDefaults();

  it("declares the same roles as Postgres", () => {
    expect(Object.keys(sqlDefaults).sort()).toEqual(ROLES.map((r) => r.key).sort());
  });

  it("grants exactly the keys Postgres grants, per role", () => {
    for (const role of ROLES) {
      expect([...rolePermissionKeys(role.key)].sort()).toEqual([...sqlDefaults[role.key]].sort());
    }
  });

  it("uses only keys the catalogue knows about", () => {
    for (const role of ROLES) {
      for (const key of rolePermissionKeys(role.key)) {
        expect(ALL_PERMISSION_KEYS).toContain(key);
      }
    }
  });

  it("labels every permission", () => {
    for (const key of ALL_PERMISSION_KEYS) {
      expect(typeof PERMISSION_LABEL[key]).toBe("string");
    }
  });

  it("gives nobody staff.manage by default, and nobody the whole shop but the founder", () => {
    for (const role of ROLES) {
      expect(rolePermissionKeys(role.key)).not.toContain("staff.manage");
      expect(rolePermissionKeys(role.key)).not.toContain("store.finance.view");
    }
  });

  it("keeps ticketing roles away from the clothing store", () => {
    for (const key of ["ticket_organizer", "ticket_admin", "ticket_staff"]) {
      for (const granted of rolePermissionKeys(key)) {
        expect(granted.startsWith("store.")).toBe(false);
      }
    }
  });

  it("keeps the Vice Admin out of finances and away from product edits", () => {
    const vice = rolePermissionKeys("vice_admin");
    expect(vice).not.toContain("store.finance.view");
    expect(vice).not.toContain("store.products.manage");
    expect(vice).not.toContain("ticketing.revenue.view");
    expect(vice).toContain("store.carts.view");
  });

  it("scopes only the ticketing roles by event", () => {
    expect(ROLES.filter((r) => r.scopedByEvent).map((r) => r.key).sort())
      .toEqual(["ticket_admin", "ticket_organizer", "ticket_staff"]);
  });
});

describe("effectivePermissions", () => {
  it("returns the role defaults when there are no overrides", () => {
    expect(Object.keys(effectivePermissions("ticket_staff")).sort())
      .toEqual([...rolePermissionKeys("ticket_staff")].sort());
  });

  it("lets the founder turn one permission on", () => {
    const out = effectivePermissions("ticket_staff", { "ticketing.revenue.view": true });
    expect(out["ticketing.revenue.view"]).toBe(true);
  });

  it("lets the founder turn one permission off", () => {
    const out = effectivePermissions("vice_admin", { "store.orders.view": false });
    expect(out["store.orders.view"]).toBeUndefined();
    expect(out["store.carts.view"]).toBe(true);
  });

  it("ignores keys the catalogue does not know", () => {
    const out = effectivePermissions("vice_admin", { "not.a.permission": true });
    expect(out["not.a.permission"]).toBeUndefined();
  });

  it("survives missing or malformed overrides", () => {
    expect(Object.keys(effectivePermissions("vice_admin", undefined)).length).toBeGreaterThan(0);
    expect(Object.keys(effectivePermissions("vice_admin", null)).length).toBeGreaterThan(0);
  });

  it("returns nothing for an unknown role", () => {
    expect(effectivePermissions("nope")).toEqual({});
    expect(roleMeta("nope")).toBeNull();
  });
});

describe("page permissions", () => {
  it("only names permissions the catalogue knows", () => {
    for (const needed of Object.values(PAGE_PERMISSIONS)) {
      if (!needed) continue;
      for (const key of Array.isArray(needed) ? needed : [needed]) {
        expect(ALL_PERMISSION_KEYS).toContain(key);
      }
    }
  });

  it("leaves the dashboard open to any staff role", () => {
    expect(PAGE_PERMISSIONS["/admin"]).toBeNull();
  });

  it("gates staff management behind staff.manage, which no role defaults to", () => {
    expect(PAGE_PERMISSIONS["/admin/staff"]).toBe("staff.manage");
    for (const role of ROLES) {
      expect(rolePermissionKeys(role.key)).not.toContain("staff.manage");
    }
  });
});

describe("togglePermissionOverride", () => {
  it("turns a default permission off and back on", () => {
    const off = togglePermissionOverride("vice_admin", {}, "store.orders.view");
    expect(off["store.orders.view"]).toBe(false);
    expect(effectivePermissions("vice_admin", off)["store.orders.view"]).toBeUndefined();

    const on = togglePermissionOverride("vice_admin", off, "store.orders.view");
    expect(on["store.orders.view"]).toBeUndefined();
    expect(effectivePermissions("vice_admin", on)["store.orders.view"]).toBe(true);
  });

  it("grants a permission the role does not have by default", () => {
    const on = togglePermissionOverride("vice_admin", {}, "store.settings.manage");
    expect(on["store.settings.manage"]).toBe(true);
    expect(effectivePermissions("vice_admin", on)["store.settings.manage"]).toBe(true);

    const off = togglePermissionOverride("vice_admin", on, "store.settings.manage");
    expect(off["store.settings.manage"]).toBeUndefined();
  });

  it("leaves the other overrides alone", () => {
    const base = { "store.settings.manage": true, "store.orders.manage": false };
    const next = togglePermissionOverride("vice_admin", base, "store.orders.view");
    expect(next["store.settings.manage"]).toBe(true);
    expect(next["store.orders.manage"]).toBe(false);
  });

  it("flips exactly one click, for every role and every permission", () => {
    // The reported bug: clicking a permission that matched the role default
    // deleted the override and wrote the current value back, so the checkbox
    // never moved. One click must always change the effective value.
    for (const role of ROLES.map((r) => r.key)) {
      for (const key of ALL_PERMISSION_KEYS) {
        const before = effectivePermissions(role, {})[key] === true;
        const next = togglePermissionOverride(role, {}, key);
        const after = effectivePermissions(role, next)[key] === true;
        expect(after, `${role} ${key}`).toBe(!before);
      }
    }
  });

  it("ignores a key that is not in the catalogue", () => {
    expect(togglePermissionOverride("vice_admin", {}, "nope.nope")).toEqual({});
  });
});
