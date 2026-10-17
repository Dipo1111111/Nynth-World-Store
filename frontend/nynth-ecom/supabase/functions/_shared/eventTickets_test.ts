import { syncEventTickets } from "./eventTickets.ts";
import { assertEquals, assert } from "jsr:@std/assert";

// A fake supabase-js client that records what the finalizer would write.
function fakeClient(products: Record<string, any> = {}) {
  const upserts: any[] = [];
  return {
    upserts,
    from(table: string) {
      const chain: any = {
        select: (_cols?: string) => chain,
        eq: (_col: string, val: string) => {
          chain._match = val;
          return chain;
        },
        maybeSingle: async () => ({ data: products[chain._match] ?? null, error: null }),
        upsert: (rows: any[]) => {
          upserts.push(rows);
          return Promise.resolve({ data: null, error: null });
        },
      };
      chain.table = table;
      return chain;
    },
  };
}

const order = {
  id: "ord-1",
  customer: { firstName: "Ada", lastName: "Nwosu", email: "ada@example.com" },
  items: [
    { id: "evt-1", name: "Abuja Music Experience", category: "tickets", price: 5000, eventDateTime: "2026-11-01T18:00:00.000Z" },
  ],
  payment_status: "paid",
  is_test: false,
  created_at: "2026-10-01T10:00:00.000Z",
};

Deno.test("mints one row per code, upper-cased, linked to its order", async () => {
  const supabase = fakeClient({ "evt-1": { data: {} } });
  await syncEventTickets(supabase as any, order as any, [
    { code: "nwt-abj-00821", price: 5000, title: "ABUJA MUSIC EXPERIENCE", productId: "evt-1", eventDateTime: "2026-11-01T18:00:00.000Z" },
    { code: "NWT-ABJ-00822", price: 5000, title: "ABUJA MUSIC EXPERIENCE", productId: "evt-1" },
  ]);
  assertEquals(supabase.upserts.length, 1);
  const rows = supabase.upserts[0];
  assertEquals(rows.length, 2);
  assertEquals(rows.map((r: any) => r.code), ["NWT-ABJ-00821", "NWT-ABJ-00822"]);
  assert(rows.every((r: any) => r.order_id === "ord-1"));
  assert(rows.every((r: any) => r.event_id === "evt-1"));
  assert(rows.every((r: any) => r.payment_status === "paid"));
  assert(rows.every((r: any) => r.entry_status === "unused"));
});

Deno.test("carries the buyer's name and email onto the ticket", async () => {
  const supabase = fakeClient({ "evt-1": { data: {} } });
  await syncEventTickets(supabase as any, order as any, [{ code: "A1", price: 5000, productId: "evt-1" }]);
  const row = supabase.upserts[0][0];
  assertEquals(row.holder_name, "Ada Nwosu");
  assertEquals(row.holder_email, "ada@example.com");
});

Deno.test("splits the money: commission to NYNTH, the rest to the organizer", async () => {
  const supabase = fakeClient({ "evt-1": { data: { organizer_staff_id: "sr-7", commission_rate: 15 } } });
  await syncEventTickets(supabase as any, order as any, [{ code: "A1", price: 10000, productId: "evt-1" }]);
  const row = supabase.upserts[0][0];
  assertEquals(row.amount, 10000);
  assertEquals(row.commission_rate, 15);
  assertEquals(row.nynth_commission, 1500);
  assertEquals(row.organizer_share, 8500);
  assertEquals(row.organizer_staff_id, "sr-7");
});

Deno.test("a zero commission still leaves the whole amount to the organizer", async () => {
  const supabase = fakeClient({ "evt-1": { data: {} } });
  await syncEventTickets(supabase as any, order as any, [{ code: "A1", price: 5000, productId: "evt-1" }]);
  const row = supabase.upserts[0][0];
  assertEquals(row.nynth_commission, 0);
  assertEquals(row.organizer_share, 5000);
  assertEquals(row.organizer_staff_id, null);
});

Deno.test("never resurrects an already-admitted ticket", async () => {
  const supabase = fakeClient({ "evt-1": { data: {} } });
  await syncEventTickets(supabase as any, order as any, [
    { code: "A1", price: 5000, productId: "evt-1", used: true, used_at: "2026-11-01T19:00:00.000Z" },
  ]);
  const row = supabase.upserts[0][0];
  assertEquals(row.entry_status, "used");
  assertEquals(row.verified_at, "2026-11-01T19:00:00.000Z");
});

Deno.test("stamps test traffic so it never reaches the live ticket ledger", async () => {
  const supabase = fakeClient({ "evt-1": { data: {} } });
  await syncEventTickets(supabase as any, { ...order, is_test: true } as any, [{ code: "A1", price: 5000, productId: "evt-1" }]);
  assertEquals(supabase.upserts[0][0].is_test, true);
});

Deno.test("skips blank codes rather than minting an unusable row", async () => {
  const supabase = fakeClient({ "evt-1": { data: {} } });
  await syncEventTickets(supabase as any, order as any, [{ code: "  " }, { code: "A1", price: 5000, productId: "evt-1" }]);
  assertEquals(supabase.upserts.length, 1);
  assertEquals(supabase.upserts[0].length, 1);
});

Deno.test("writes nothing at all when there are no codes", async () => {
  const supabase = fakeClient();
  assertEquals(await syncEventTickets(supabase as any, order as any, []), []);
  assertEquals(supabase.upserts.length, 0);
});
