import { describe, it, expect, vi, beforeEach } from "vitest";

// Controllable fake for the Supabase client. `record` captures every call so
// tests can assert exact payloads, and whether insert accidentally selects
// (the guest RLS bug from checkout: insert + .select("id") failed for guests).
const h = vi.hoisted(() => {
  const record = [];
  let queryResult = { data: null, error: null };
  let invokeResult = { data: null, error: null };
  let authUser = null;

  const buildChain = () => {
    const q = {
      then: (res, rej) => Promise.resolve(queryResult).then(res, rej),
      catch: (rej) => Promise.resolve(queryResult).catch(rej),
      finally: (cb) => Promise.resolve(queryResult).finally(cb),
    };
    ["select", "order", "eq", "in", "ilike", "contains", "limit", "maybeSingle", "single"].forEach((m) => {
      q[m] = (...args) => { record.push({ method: m, args }); return q; };
    });
    ["insert", "update", "upsert", "delete"].forEach((m) => {
      q[m] = (...args) => { record.push({ method: m, args }); return q; };
    });
    return q;
  };

  return {
    supabase: {
      from: vi.fn((table) => { record.push({ method: "from", args: [table] }); return buildChain(); }),
      auth: {
        getUser: vi.fn(async () => ({ data: { user: authUser }, error: null })),
      },
      functions: {
        invoke: vi.fn(async () => invokeResult),
      },
      channel: vi.fn(() => ({ on: vi.fn(() => ({ subscribe: vi.fn() })) })),
      removeChannel: vi.fn(),
      rpc: vi.fn(),
    },
    record,
    setQuery: (result) => { queryResult = result; },
    setInvoke: (result) => { invokeResult = result; },
    setAuthUser: (user) => { authUser = user; },
    reset: () => {
      record.length = 0;
      queryResult = { data: null, error: null };
      invokeResult = { data: null, error: null };
      authUser = null;
    },
  };
});

vi.mock("./supabase", () => ({ supabase: h.supabase }));
vi.mock("./cloudinary", () => ({
  uploadImageToCloudinary: vi.fn(),
  uploadMultipleImagesToCloudinary: vi.fn(),
}));

import {
  addOrder,
  addProduct,
  updateProduct,
  deleteProduct,
  markTicketUsed,
  fetchProducts,
  fetchRelatedProducts,
  searchProducts,
  fetchProductsByCategory,
  fetchOrder,
  getAllOrders,
  validateDiscountCode,
  initializePayment,
  verifyOrderPayment,
} from "./supabaseFunctions";

beforeEach(() => h.reset());

describe("finalNumber guard (checkout NaN-total bug)", () => {
  it("inserts wallet-safe numbers into the orders table", async () => {
    h.setInvoke({ data: null, error: null });
    h.setAuthUser(null);
    await addOrder({
      userId: null,
      customer: { email: "a@b.com" },
      items: [],
      subtotal: NaN,
      shippingFee: undefined,
      discountAmount: Number("not-a-number"),
      total: NaN,
    });

    const insert = h.record.find((c) => c.method === "insert");
    const payload = insert.args[0];
    expect(payload.subtotal).toBe(0);
    expect(payload.shipping_fee).toBe(0);
    expect(payload.discount_amount).toBe(0);
    expect(payload.total).toBe(0);
  });

  it("inserts with NO .select() so guests pass RLS (checkout 400 bug)", async () => {
    h.setInvoke({ data: null, error: null });
    h.setAuthUser(null);
    await addOrder({ items: [], total: 100 });

    const ops = h.record.map((c) => c.method);
    expect(ops).toContain("insert");
    expect(ops).not.toContain("select");
  });

  it("uses the provided order id and maps user_id for a guest to null", async () => {
    h.setInvoke({ data: null, error: null });
    h.setAuthUser(null);
    const id = await addOrder({ id: "fixed-id", items: [], total: 100 });

    expect(id).toBe("fixed-id");
    const payload = h.record.find((c) => c.method === "insert").args[0];
    expect(payload.user_id).toBeNull();
    expect(payload.payment_status).toBe("pending");
    expect(payload.order_status).toBe("pending");
  });

  it("stamps is_test from the order payload so the UI can separate test traffic", async () => {
    h.setInvoke({ data: null, error: null });
    h.setAuthUser(null);
    await addOrder({ items: [], total: 100, isTest: true });
    const payload = h.record.find((c) => c.method === "insert").args[0];
    expect(payload.is_test).toBe(true);

    h.reset();
    h.setInvoke({ data: null, error: null });
    await addOrder({ items: [], total: 100, isTest: false });
    const payload2 = h.record.find((c) => c.method === "insert").args[0];
    expect(payload2.is_test).toBe(false);
  });

  it("falls back to the signed-in user id when no order.userId", async () => {
    h.setInvoke({ data: null, error: null });
    h.setAuthUser({ id: "user-123" });
    await addOrder({ items: [], total: 100 });

    const payload = h.record.find((c) => c.method === "insert").args[0];
    expect(payload.user_id).toBe("user-123");
  });
});

describe("rowToProduct (stale data snapshot bug)", () => {
  it("lets the column override a stale snapshot inside data", async () => {
    h.setQuery({ data: [{ id: "p1", is_public: true, best_seller: false, stock_quantity: 3, display_order: 4, data: { isPublic: false, bestSeller: true } }], error: null });
    const [p] = await fetchProducts();
    expect(p.isPublic).toBe(true);
    expect(p.bestSeller).toBe(false);
    expect(p.inStock).toBe(true);
    expect(p.stockQuantity).toBe(3);
    expect(p.displayOrder).toBe(4);
  });

  it("filters hidden products out of the public listing", async () => {
    h.setQuery({ data: [{ id: "hidden", is_public: false, stock_quantity: 1, data: {} }, { id: "shown", is_public: true, stock_quantity: 1, data: {} }], error: null });
    const list = await fetchProducts();
    expect(list.map((p) => p.id)).toEqual(["shown"]);
  });
});

describe("rowToOrder", () => {
  it("reads money fields as numbers and maps firebase-style aliases", async () => {
    h.setQuery({ data: [{ id: "o1", user_id: null, customer: {}, items: [], tickets: [], subtotal: "1500", shipping_fee: "2500", discount_amount: null, discount_code: null, total: "4000", payment_status: "pending", order_status: "pending", payment_reference: null, paid_at: null, is_test: false }], error: null });
    const [o] = await getAllOrders();
    expect(o.subtotal).toBe(1500);
    expect(o.shippingFee).toBe(2500);
    expect(o.shipping_fee).toBe(2500);
    expect(o.total).toBe(4000);
    expect(o.isTest).toBe(false);
  });

  it("maps is_test true so admin can badge/exclude test traffic", async () => {
    h.setQuery({ data: [{ id: "o2", is_test: true, items: [], tickets: [], customer: {} }], error: null });
    const [o] = await getAllOrders();
    expect(o.isTest).toBe(true);
  });

  it("normalizes created_at ISO strings to firebase-style { seconds } so date/month filtering works (dashboard-zeros regression)", async () => {
    const iso = "2026-09-23T00:34:59.007Z";
    h.setQuery({ data: [{ id: "o5", is_test: false, items: [], tickets: [], customer: {}, created_at: iso }], error: null });
    const [o] = await getAllOrders();
    expect(o.created_at).not.toBeNull();
    // Firestore-style {seconds} drops sub-second precision by design.
    expect(o.created_at.seconds).toBe(Math.floor(new Date(iso).getTime() / 1000));
  });

  it("does not crash when created_at is missing (legacy rows render with no date, never as zero)", async () => {
    h.setQuery({ data: [{ id: "o6", is_test: false, items: [], tickets: [], customer: {} }], error: null });
    const [o] = await getAllOrders();
    expect(o.created_at).toBeNull();
    expect(o.id).toBe("o6");
  });

  it("serves test and live orders together so the admin live filter is the only split point (never hides live orders in the data layer)", async () => {
    h.setQuery({
      data: [
        { id: "live-1", is_test: false, items: [], tickets: [], customer: {}, created_at: "2026-09-01T10:00:00Z" },
        { id: "test-1", is_test: true, items: [], tickets: [], customer: {}, created_at: "2026-09-02T10:00:00Z" },
      ],
      error: null,
    });
    const list = await getAllOrders();
    expect(list).toHaveLength(2);
    expect(list.map((o) => o.isTest)).toEqual([false, true]);
    expect(list.every((o) => o.created_at?.seconds)).toBe(true);
  });

  it("returns an empty object for a missing order", async () => {
    h.setQuery({ data: null, error: null });
    const o = await fetchOrder("missing");
    expect(o).toBeNull();
  });
});

describe("validateDiscountCode (NaN discount bug)", () => {
  it("returns discountType/discountValue for a percentage code", async () => {
    h.setQuery({ data: { code: "SAVE10", active: true, percent_off: 10, amount_off: null, expires_at: null }, error: null });
    const r = await validateDiscountCode(" save10 ");
    expect(r.valid).toBe(true);
    expect(r.discountType).toBe("percentage");
    expect(r.discountValue).toBe(10);
  });

  it("returns discountType fixed for an amount-off code", async () => {
    h.setQuery({ data: { code: "NGN500", active: true, percent_off: null, amount_off: 500, expires_at: null }, error: null });
    const r = await validateDiscountCode("NGN500");
    expect(r.valid).toBe(true);
    expect(r.discountType).toBe("fixed");
    expect(r.discountValue).toBe(500);
  });

  it("labels inactive/invalid codes", async () => {
    h.setQuery({ data: null, error: null });
    const r = await validateDiscountCode("NOPE");
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });

  it("labels expired codes", async () => {
    h.setQuery({ data: { code: "OLDPASS", active: true, percent_off: 5, expires_at: new Date(Date.now() - 86400000).toISOString() }, error: null });
    const r = await validateDiscountCode("OLDPASS");
    expect(r.valid).toBe(false);
    expect(r.reason).toBe("expired");
  });
});

describe("payment edge function calls", () => {
  it("initializePayment invokes the initialize-payment function with the body", async () => {
    h.setInvoke({ data: { authorization_url: "https://checkout.paystack.com/x", reference: "R1" }, error: null });
    const out = await initializePayment({ amount: 100, email: "a@b.com", metadata: { orderId: "o1" } });
    expect(h.supabase.functions.invoke).toHaveBeenCalledWith("initialize-payment", { body: { amount: 100, email: "a@b.com", metadata: { orderId: "o1" } } });
    expect(out.authorization_url).toContain("checkout.paystack.com");
  });

  it("initializePayment throws when the edge function errors", async () => {
    h.setInvoke({ data: null, error: new Error("boom") });
    await expect(initializePayment({ amount: 100, email: "a@b.com" })).rejects.toThrow("boom");
  });

  it("verifyOrderPayment sends the reference to paystack-verify", async () => {
    h.setInvoke({ data: { success: true, orderId: "o1", alreadyPaid: false }, error: null });
    const out = await verifyOrderPayment("o1", "REF1");
    expect(h.supabase.functions.invoke).toHaveBeenCalledWith("paystack-verify", { body: { reference: "REF1" } });
    expect(out.success).toBe(true);
  });
});
describe("product mutations (admin add/edit/delete must not 400)", () => {
  it("addProduct inserts a normalized payload with safe defaults", async () => {
    h.setQuery({ data: { id: "p1" }, error: null });
    const id = await addProduct({ name: "Tee", category: "APPAREL", price: "15000", stockQuantity: "10" });
    expect(id).toBe("p1");
    const payload = h.record.find((c) => c.method === "insert").args[0];
    expect(payload.name).toBe("Tee");
    expect(payload.category).toBe("apparel");
    expect(payload.price).toBe(15000);
    expect(payload.stock_quantity).toBe(10);
    expect(payload.is_public).toBe(true);
  });

  it("addProduct survives missing price and stock (never NaN to the DB)", async () => {
    h.setQuery({ data: { id: "p2" }, error: null });
    await addProduct({ name: "Cap" });
    const payload = h.record.find((c) => c.method === "insert").args[0];
    expect(payload.price).toBe(0);
    expect(payload.stock_quantity).toBe(0);
    expect(Number.isNaN(payload.price)).toBe(false);
  });

  it("updateProduct patches only provided fields and throws on zero rows", async () => {
    h.setQuery({ data: [{ id: "p1" }], error: null });
    await updateProduct("p1", { price: "20000", isPublic: false });
    const payload = h.record.find((c) => c.method === "update").args[0];
    expect(payload.price).toBe(20000);
    expect(payload.is_public).toBe(false);
    expect(payload.name).toBeUndefined();

    h.reset();
    h.setQuery({ data: [], error: null });
    await expect(updateProduct("ghost", { price: 1 })).rejects.toThrow("no rows affected");
  });

  it("deleteProduct throws on zero rows (RLS misconfig surfaces loudly)", async () => {
    h.setQuery({ data: [{ id: "p1" }], error: null });
    await expect(deleteProduct("p1")).resolves.toBe(true);

    h.reset();
    h.setQuery({ data: [], error: null });
    await expect(deleteProduct("ghost")).rejects.toThrow("no rows affected");
  });
});

describe("markTicketUsed (door check-in)", () => {
  const orderWith = (tickets) => ({ data: { id: "o1", tickets }, error: null });

  it("marks the matching code used, case-insensitively", async () => {
    h.setQuery(orderWith([{ code: "NWT-ABC", title: "Show" }]));
    const t = await markTicketUsed("o1", "nwt-abc");
    expect(t.used).toBe(true);
    expect(t.used_at).toBeTruthy();
    const payload = h.record.find((c) => c.method === "update").args[0];
    expect(payload.tickets[0].used).toBe(true);
  });

  it("refuses unknown codes and already-used tickets", async () => {
    h.setQuery(orderWith([{ code: "NWT-ABC", title: "Show" }]));
    await expect(markTicketUsed("o1", "NWT-NOPE")).rejects.toThrow("not found");

    h.reset();
    h.setQuery(orderWith([{ code: "NWT-ABC", title: "Show", used: true }]));
    await expect(markTicketUsed("o1", "NWT-ABC")).rejects.toThrow("already used");
  });

  it("refuses blank codes and missing orders", async () => {
    await expect(markTicketUsed("o1", "   ")).rejects.toThrow("ticket code");
    h.setQuery({ data: null, error: null });
    await expect(markTicketUsed("ghost", "NWT-ABC")).rejects.toThrow("Order not found");
  });
});

describe("storefront visibility rule (hidden and sold-out never list)", () => {
  const rows = [
    { id: "live", name: "Live Tee", stock_quantity: 5, is_public: true },
    { id: "hidden", name: "Hidden Tee", stock_quantity: 5, is_public: false },
    { id: "soldout", name: "Gone Tee", stock_quantity: 0, is_public: true },
    { id: "nostock", name: "Mystery Tee", stock_quantity: null, is_public: true },
  ];

  it("recommendations exclude hidden, sold-out, and the current product", async () => {
    h.setQuery({ data: rows, error: null });
    const list = await fetchRelatedProducts("apparel", "live", 4);
    const ids = list.map((p) => p.id);
    expect(ids).not.toContain("hidden");
    expect(ids).not.toContain("soldout");
    expect(ids).not.toContain("live");
    expect(ids).toContain("nostock");
  });

  it("search never surfaces hidden or sold-out products", async () => {
    h.setQuery({ data: rows, error: null });
    const list = await searchProducts("tee");
    const ids = list.map((p) => p.id);
    expect(ids).not.toContain("hidden");
    expect(ids).not.toContain("soldout");
    expect(ids).toContain("live");
  });

  it("category lists never surface hidden or sold-out products", async () => {
    h.setQuery({ data: rows, error: null });
    const list = await fetchProductsByCategory("apparel", 15);
    const ids = list.map((p) => p.id);
    expect(ids).not.toContain("hidden");
    expect(ids).not.toContain("soldout");
    expect(ids).toContain("live");
  });
});

describe("per-product delivery fee switch", () => {
  it("addProduct persists the delivery fee flag into the product data", async () => {
    h.setQuery({ data: { id: "p3" }, error: null });
    await addProduct({ name: "Bonus Tee", price: 10000, deliveryFeeEnabled: false });
    const payload = h.record.find((c) => c.method === "insert").args[0];
    expect(payload.data.deliveryFeeEnabled).toBe(false);
  });
});
