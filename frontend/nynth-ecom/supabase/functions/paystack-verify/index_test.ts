import { handler } from "./index.ts";
import { assertEquals, assert } from "jsr:@std/assert";

const env = {
  SUPABASE_URL: "https://db.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "svc-key",
  PAYSTACK_SECRET_KEY: "sk_test_xyz",
  ADMIN_NOTIFY_EMAIL: "admin@nynth.com",
  RESEND_API_KEY: "re_xyz",
  EMAIL_FROM: "NYNTH WORLD <onboarding@resend.dev>",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

Deno.test("OPTIONS preflight returns 200 with CORS headers so browsers can call it", async () => {
  const res = await handler(new Request("https://x.supabase.co/functions/v1/paystack-verify", {
    method: "OPTIONS",
    headers: { Origin: "https://www.nynthworld.com", "Access-Control-Request-Method": "POST" },
  }));
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("missing reference returns a CORS-enabled 400", async () => {
  const res = await handler(new Request("https://x.supabase.co/functions/v1/paystack-verify", {
    method: "POST",
    headers: { Origin: "https://www.nynthworld.com", "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }));
  assertEquals(res.status, 400);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("finalizes a pending order after a successful Paystack charge", async () => {
  const realFetch = globalThis.fetch;
  const patches: any[] = [];
  let resendCalls = 0;

  (globalThis as any).fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url);
    const method = init?.method ?? "GET";

    if (u.includes("api.paystack.co")) {
      return jsonResponse({ status: true, message: "ok", data: { status: "success", reference: "REF1", metadata: { orderId: "ord-9" } } });
    }
    if (u.includes("api.resend.com")) {
      resendCalls++;
      return jsonResponse({ id: "email-1" });
    }
    if (u.includes("/rest/v1/orders")) {
      if (method === "PATCH") {
        patches.push(JSON.parse(String(init?.body)));
        return jsonResponse([]);
      }
      return jsonResponse({ id: "ord-9", user_id: null, customer: { email: "buyer@x.com", firstName: "Ada" }, items: [], total: 15000, payment_status: "pending", order_status: "pending", tickets: [] });
    }
    if (u.includes("/rest/v1/products")) {
      if (method === "PATCH") return jsonResponse([]);
      return jsonResponse({ id: "prd1", stock_quantity: 5 });
    }
    return jsonResponse({ message: "unhandled " + u }, 500);
  };

  for (const [k, v] of Object.entries(env)) Deno.env.set(k, v);

  try {
    const res = await handler(new Request("https://x.supabase.co/functions/v1/paystack-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: "REF1" }),
    }));
    assertEquals(res.status, 200);
    const json = await res.json();
    assertEquals(json.success, true);
    assertEquals(json.alreadyPaid, false);
    assertEquals(json.orderId, "ord-9");
    assert(patches.some((p) => p.payment_status === "paid" && p.order_status === "confirmed"));
    assert(patches.some((p) => p.is_test === true), "order finalized under sk_test_ keys must be stamped is_test so test traffic never counts as live");
    assertEquals(resendCalls, 2, "customer + admin confirmation emails should both be attempted");
  } finally {
    (globalThis as any).fetch = realFetch;
  }
});

Deno.test("returns alreadyPaid true and sends no mails for an already-paid order", async () => {
  const realFetch = globalThis.fetch;
  let resendCalls = 0;

  (globalThis as any).fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url);
    if (u.includes("api.paystack.co")) {
      return jsonResponse({ status: true, message: "ok", data: { status: "success", reference: "REF1", metadata: { orderId: "ord-9" } } });
    }
    if (u.includes("api.resend.com")) {
      resendCalls++;
      return jsonResponse({ id: "email-1" });
    }
    if (u.includes("/rest/v1/orders")) {
      return jsonResponse({ id: "ord-9", items: [], payment_status: "paid", order_status: "confirmed", tickets: [] });
    }
    return jsonResponse({ message: "unhandled " + u }, 500);
  };

  for (const [k, v] of Object.entries(env)) Deno.env.set(k, v);

  try {
    const res = await handler(new Request("https://x.supabase.co/functions/v1/paystack-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: "REF1" }),
    }));
    const json = await res.json();
    assertEquals(json.alreadyPaid, true);
    assertEquals(resendCalls, 0);
  } finally {
    (globalThis as any).fetch = realFetch;
  }
});