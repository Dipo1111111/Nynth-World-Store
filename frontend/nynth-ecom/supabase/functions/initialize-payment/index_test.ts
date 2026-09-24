import { handler } from "./index.ts";
import { assertEquals, assert } from "jsr:@std/assert";

Deno.test("OPTIONS preflight returns 200 with CORS headers so browsers can call it", async () => {
  const res = await handler(new Request("https://x.supabase.co/functions/v1/initialize-payment", {
    method: "OPTIONS",
    headers: { Origin: "https://www.nynthworld.com", "Access-Control-Request-Method": "POST" },
  }));
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("missing amount/email returns a CORS-enabled 400", async () => {
  const res = await handler(new Request("https://x.supabase.co/functions/v1/initialize-payment", {
    method: "POST",
    headers: { Origin: "https://www.nynthworld.com", "Content-Type": "application/json" },
    body: JSON.stringify({}),
  }));
  assertEquals(res.status, 400);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("rejects amounts under 100 NGN", async () => {
  const res = await handler(new Request("https://x.supabase.co/functions/v1/initialize-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 99, email: "a@b.com" }),
  }));
  assertEquals(res.status, 400);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("calls Paystack with kobo amount and bakes orderId into the callback URL", async () => {
  const realFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedBody: any = null;
  let stamped: any = null;
  (globalThis as any).fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
    const u = String(url);
    if (u.includes("/rest/v1/orders")) {
      stamped = JSON.parse(String(init?.body));
      return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
    }
    capturedUrl = u;
    capturedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      status: true,
      data: { authorization_url: "https://checkout.paystack.com/xyz", reference: "REF1" },
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  Deno.env.set("SUPABASE_URL", "https://db.supabase.co");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "svc-key");
  try {
    const res = await handler(new Request("https://x.supabase.co/functions/v1/initialize-payment", {
      method: "POST",
      headers: { Origin: "https://store.example.com", "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 150, email: "a@b.com", metadata: { orderId: "ord-9" } }),
    }));
    assertEquals(res.status, 200);
    const json = await res.json();
    assertEquals(json.authorization_url, "https://checkout.paystack.com/xyz");
    assertEquals(json.reference, "REF1");
    assert(capturedUrl.startsWith("https://api.paystack.co/transaction/initialize"));
    assertEquals(capturedBody.amount, 15000);
    assertEquals(capturedBody.callback_url, "https://store.example.com/thank-you?orderId=ord-9");
    assertEquals(stamped?.payment_reference, "REF1", "the Paystack reference must be stamped on the order for later recovery");
  } finally {
    (globalThis as any).fetch = realFetch;
  }
});