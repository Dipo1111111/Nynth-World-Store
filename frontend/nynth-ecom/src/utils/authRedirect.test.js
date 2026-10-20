import { describe, it, expect } from "vitest";
import { postAuthTarget } from "./authRedirect";

describe("postAuthTarget", () => {
  it("sends staff to their dashboard when they just log in", () => {
    expect(postAuthTarget({ isStaff: true })).toBe("/admin");
  });

  it("sends staff back to the admin page they were trying to open", () => {
    expect(postAuthTarget({ from: "/admin/orders", isStaff: true })).toBe("/admin/orders");
    expect(postAuthTarget({ from: "/admin/check-in", isStaff: true })).toBe("/admin/check-in");
  });

  it("still honours a storefront page a staff member asked for", () => {
    expect(postAuthTarget({ from: "/cart", isStaff: true })).toBe("/cart");
  });

  it("keeps customers on the storefront", () => {
    expect(postAuthTarget({ from: "/cart", isStaff: false })).toBe("/cart");
    expect(postAuthTarget({ isStaff: false })).toBe("/shop");
  });

  it("never sends a customer into the admin", () => {
    expect(postAuthTarget({ from: "/admin", isStaff: false })).toBe("/shop");
    expect(postAuthTarget({ from: "/admin/staff", isStaff: false })).toBe("/shop");
  });

  it("ignores the auth pages themselves so a loop cannot form", () => {
    expect(postAuthTarget({ from: "/login", isStaff: true })).toBe("/admin");
    expect(postAuthTarget({ from: "/signup", isStaff: false })).toBe("/shop");
  });

  it("survives a missing or malformed from", () => {
    expect(postAuthTarget({ from: undefined, isStaff: true })).toBe("/admin");
    expect(postAuthTarget({ from: null, isStaff: false })).toBe("/shop");
    expect(postAuthTarget({ from: 42, isStaff: true })).toBe("/admin");
  });
});
