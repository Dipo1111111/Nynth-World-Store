// paystack-verify — popup fallback: verifies reference with Paystack, finalizes same
// as webhook. No JWT (guests use it) — set verify_jwt=false.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function ticketCodes(items: any[] = []) {
  const used = new Set<string>(); const out: any[] = [];
  for (const item of items ?? []) {
    if (item.category !== "tickets") continue;
    for (let i = 0; i < (item.quantity || 1); i++) {
      const bytes = crypto.getRandomValues(new Uint8Array(4));
      const code = "NWT-" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
      if (used.has(code)) continue;
      used.add(code);
      out.push({ code, productId: item.id, title: item.name || item.title || "NYNTH WORLD Event", eventDateTime: item.eventDateTime ?? null, venue: item.venue ?? null, price: item.price || 0 });
    }
  }
  return out;
}

Deno.serve(async (req) => {
  const { reference } = await req.json().catch(() => ({}));
  if (!reference) return Response.json({ error: "reference required" }, { status: 400 });
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
  const res = await fetch("https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference), { headers: { Authorization: "Bearer " + secret } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.status || body.data?.status !== "success") return Response.json({ error: body.message ?? "verification failed" }, { status: 400 });
  const orderId = body.data?.metadata?.orderId;
  if (!orderId) return Response.json({ error: "No orderId in metadata" }, { status: 404 });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return Response.json({ error: "order not found" }, { status: 404 });
  if (order.payment_status === "paid") return Response.json({ success: true, orderId, alreadyPaid: true });
  const codes = ticketCodes(order.items);
  await supabase.from("orders").update({ payment_status: "paid", order_status: "confirmed", payment_reference: reference, tickets: codes.length ? codes : order.tickets, paid_at: new Date().toISOString() }).eq("id", orderId);
  return Response.json({ success: true, orderId, alreadyPaid: false });
});
