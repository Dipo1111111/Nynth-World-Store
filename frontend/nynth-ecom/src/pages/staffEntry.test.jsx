import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The staff panel bug is a wiring bug, not a database bug: the permission
// layer was correct, but nothing sent a staff member to it. These assertions
// hold the entry points in place.
const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "..");
const read = (rel) => readFileSync(path.join(src, rel), "utf8");

describe("a staff email lands on their duties", () => {
  it("sends staff to the admin after login, not to the shop", () => {
    const login = read("pages/Login.jsx");
    expect(login).toContain("postAuthTarget");
    expect(login).toContain("accessLoading");
    expect(login).toContain("isStaff");
    expect(login).not.toContain('return "/shop"');
  });

  it("does the same on signup", () => {
    const signup = read("pages/Signup.jsx");
    expect(signup).toContain("postAuthTarget");
    expect(signup).not.toContain("getRedirectTarget");
  });

  it("offers the workspace on the account page to staff, not only the founder", () => {
    const account = read("pages/Account.jsx");
    expect(account).toContain("isStaff");
    expect(account).toMatch(/\{isStaff && \(/);
    expect(account).toContain("Workspace");
  });

  it("gives staff a dashboard link on the storefront header", () => {
    const header = read("components/home/Header.jsx");
    expect(header).toContain("isStaff");
    expect(header).toMatch(/to="\/admin"/);
  });
});

describe("ticket roles are scoped, not stuck", () => {
  it("lets any event-scoped role be assigned events, door staff included", () => {
    const staffAccess = read("pages/admin/StaffAccess.jsx");
    expect(staffAccess).toContain("scopedByEvent");
    expect(staffAccess).toMatch(/isScoped\(form\.role\)/);
    // The old code only allowed the organizer and the admin to be scoped,
    // which left ticketing staff unable to verify a single ticket.
    expect(staffAccess).not.toMatch(/eventIds:\s*canDirect/);
  });

  it("warns when a scoped person is saved with no events", () => {
    expect(read("pages/admin/StaffAccess.jsx")).toContain("No events assigned yet");
  });

  it("wires the permission toggles to the tested helper", () => {
    const staffAccess = read("pages/admin/StaffAccess.jsx");
    expect(staffAccess).toContain("togglePermissionOverride");
    // The old local arithmetic swallowed the click whenever the permission
    // matched its role default, which was most of them.
    expect(staffAccess).not.toContain("roleDefaults.includes(key) === on");
  });

  it("sends a ticket-only account to its workspace instead of an empty overview", () => {
    const dashboard = read("pages/admin/AdminDashboard.jsx");
    expect(dashboard).toContain("hasStoreWorkspace");
    expect(dashboard).toContain('"/admin/events"');
  });

  it("defines the store workspace once, in the auth context", () => {
    const auth = read("context/AuthContext.jsx");
    expect(auth).toContain("hasStoreWorkspace");
    expect(auth).toContain("STORE_WORKSPACE_PERMISSIONS");
  });
});
