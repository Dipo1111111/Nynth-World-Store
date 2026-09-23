import { handler } from "./index.ts";
import { assertEquals } from "jsr:@std/assert";

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
