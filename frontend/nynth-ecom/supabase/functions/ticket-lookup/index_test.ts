import { handler } from "./index.ts";
import { assertEquals, assert } from "jsr:@std/assert";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

Deno.test("OPTIONS preflight returns 200 with CORS headers", async () => {
  const res = await handler(new Request("https://x.supabase.co/functions/v1/ticket-lookup", {
    method: "OPTIONS",
    headers: { Origin: "https://www.nynthworld.com", "Access-Control-Request-Method": "POST" },
  }));
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});

Deno.test("missing or blank code returns found:false without touching the DB", async () => {
  for (const body of [{}, { code: "" }, { code: "   " }]) {
    const res = await handler(new Request("https://x.supabase.co/functions/v1/ticket-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
    assertEquals(res.status, 200);
    assertEquals((await res.json()).found, false);
  }
});

Deno.test("found passes carry payment, order, and test status for door decisions", async () => {
  const realFetch = globalThis.fetch;
  (globalThis as any).fetch = async (url: RequestInfo | URL) => {
    const u = String(url);
    if (u.includes("/rest/v1/orders")) {
      return jsonResponse([{
        id: "ord-9",
        tickets: [{ code: "NWT-AAAA1111", title: "AFRO FUTURE FEST", eventDateTime: "2026-12-01T18:00:00+01:00", venue: "Eko Convention Centre" }],
        customer: { firstName: "Ada" },
        payment_status: "paid",
        order_status: "cancelled",
        is_test: true,
      }]);
    }
    return jsonResponse({ message: "unhandled " + u }, 500);
  };
  try {
    const res = await handler(new Request("https://x.supabase.co/functions/v1/ticket-lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "nwt-aaaa1111" }),
    }));
    const json = await res.json();
    assertEquals(json.found, true);
    assertEquals(json.code, "NWT-AAAA1111");
    assertEquals(json.order_status, "cancelled");
    assertEquals(json.isTest, true);
  } finally {
    (globalThis as any).fetch = realFetch;
  }
});
