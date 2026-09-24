import { handler } from "./index.ts";
import { assertEquals, assert } from "jsr:@std/assert";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

const orderRow = {
  id: "ord-9",
  items: [{ id: "tix1", category: "tickets", quantity: 1, name: "AFRO FUTURE FEST", price: 15000, eventDateTime: "2026-12-01T18:00:00+01:00", venue: "Eko Convention Centre" }],
  tickets: [{ code: "NWT-AAAA1111", productId: "tix1", title: "AFRO FUTURE FEST" }],
  subtotal: 15000,
  shipping_fee: 0,
  discount_amount: 0,
  discount_code: null,
  total: 15000,
  payment_status: "paid",
  order_status: "confirmed",
  payment_reference: "REF9",
  is_test: false,
  paid_at: "2026-09-24T08:00:00Z",
  created_at: "2026-09-24T07:00:00Z",
  customer: { email: "buyer@x.com", firstName: "Ada", phone: "0801", address: "1 Street" },
};

function mockFetch(row: any) {
  const realFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: RequestInfo | URL) => {
    const u = String(url);
    if (u.includes("/rest/v1/orders")) return jsonResponse(row);
    return jsonResponse({ message: "unhandled " + u }, 500);
  };
  return realFetch;
}

Deno.test("OPTIONS preflight returns 200 with CORS headers so browsers can call it", async () => {
  const res = await handler(new Request("https://x.supabase.co/functions/v1/order-lookup", {
    method: "OPTIONS",
    headers: { Origin: "https://www.nynthworld.com", "Access-Control-Request-Method": "POST" },
  }));
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("missing orderId/reference returns a CORS-enabled 400", async () => {
  const res = await handler(new Request("https://x.supabase.co/functions/v1/order-lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId: "ord-9" }),
  }));
  assertEquals(res.status, 400);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("wrong reference returns found:false without leaking the order", async () => {
  const realFetch = mockFetch(orderRow);
  try {
    const res = await handler(new Request("https://x.supabase.co/functions/v1/order-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: "ord-9", reference: "WRONG" }),
    }));
    const json = await res.json();
    assertEquals(json.found, false);
    assert(!("items" in json), "items must not leak on reference mismatch");
  } finally {
    (globalThis as any).fetch = realFetch;
  }
});

Deno.test("matching reference returns items and tickets but never customer PII", async () => {
  const realFetch = mockFetch(orderRow);
  try {
    const res = await handler(new Request("https://x.supabase.co/functions/v1/order-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: "ord-9", reference: "REF9" }),
    }));
    const json = await res.json();
    assertEquals(json.found, true);
    assertEquals(json.items.length, 1);
    assertEquals(json.tickets[0].code, "NWT-AAAA1111");
    assertEquals(json.payment_status, "paid");
    assert(!("customer" in json), "customer PII must never leave this function");
    assert(!JSON.stringify(json).includes("buyer@x.com"), "email must never leak");
  } finally {
    (globalThis as any).fetch = realFetch;
  }
});
