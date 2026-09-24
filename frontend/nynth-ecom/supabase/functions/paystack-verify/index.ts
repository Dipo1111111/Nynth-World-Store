// paystack-verify - popup fallback: verifies reference with Paystack, finalizes
// same as webhook: paid/confirmed, NWT tickets, stock decrement, emails, notification
// timestamps. No JWT (guests use it) - set verify_jwt=false.
// Accepts { reference } or { orderId } (falls back to the reference stamped on
// the order at initialize time, so a buyer who lost the redirect URL can retry
// from the order id alone). The paid transition is conditional on the order
// still being pending, so a concurrent webhook finalize cannot double-mint
// codes, double-decrement stock, or double-email.
// Secrets (dashboard, NOT in code): PAYSTACK_SECRET_KEY, RESEND_API_KEY, EMAIL_FROM,
// ADMIN_NOTIFY_EMAIL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { naira, ticketCodes, ticketPassBlock, itemsText, customerHtml, adminHtml, sendResend } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { reference: refIn, orderId: orderIdIn } = await req.json().catch(() => ({}));
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let reference = refIn;
  if (!reference && orderIdIn) {
    const { data: refRow } = await supabase.from("orders").select("payment_reference").eq("id", orderIdIn).maybeSingle();
    reference = refRow?.payment_reference ?? null;
    if (!reference) return Response.json({ error: "no payment reference on this order yet - complete checkout first" }, { status: 404, headers: corsHeaders });
  }
  if (!reference) return Response.json({ error: "reference required" }, { status: 400, headers: corsHeaders });
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
  const res = await fetch("https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference), { headers: { Authorization: "Bearer " + secret } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.status || body.data?.status !== "success") return Response.json({ error: body.message ?? "verification failed" }, { status: 400, headers: corsHeaders });
  // Authoritative test stamp: Paystack itself reports which domain moved the money.
  // Never infer it from local keys, the frontend and server keys can disagree.
  const isTest = (body.data?.domain ?? (secret.startsWith("sk_test_") ? "test" : "live")) === "test";
  const orderId = body.data?.metadata?.orderId ?? orderIdIn;
  if (!orderId) return Response.json({ error: "No orderId in metadata" }, { status: 404, headers: corsHeaders });
  if (orderIdIn && body.data?.metadata?.orderId && body.data.metadata.orderId !== orderIdIn) {
    return Response.json({ error: "reference does not belong to this order" }, { status: 400, headers: corsHeaders });
  }
  try {
    const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (!order) return Response.json({ error: "order not found" }, { status: 404, headers: corsHeaders });
    if (order.payment_status === "paid") return Response.json({ success: true, orderId, alreadyPaid: true }, { headers: corsHeaders });
    const codes = ticketCodes(order.items);
    // Conditional transition: only the first finalizer wins. A concurrent
    // webhook hitting this at the same moment gets zero rows back.
    const { data: claimed } = await supabase.from("orders").update({ payment_status: "paid", order_status: "confirmed", payment_reference: reference, is_test: isTest, tickets: codes.length ? codes : order.tickets, paid_at: new Date().toISOString() }).eq("id", orderId).eq("payment_status", "pending").select("id");
    if (!claimed || claimed.length === 0) {
      return Response.json({ success: true, orderId, alreadyPaid: true }, { headers: corsHeaders });
    }
    for (const item of order.items ?? []) {
      const { data: p } = await supabase.from("products").select("stock_quantity").eq("id", item.id).maybeSingle();
      if (p) await supabase.from("products").update({ stock_quantity: Math.max(0, (p.stock_quantity ?? 0) - (item.quantity || 1)) }).eq("id", item.id);
    }
    const adminTo = Deno.env.get("ADMIN_NOTIFY_EMAIL") ?? "";
    const adminList = adminTo.split(",").map((s) => s.trim()).filter(Boolean);
    let customerSent = false, adminSent = false;
    const shortId = orderId.slice(0, 8).toUpperCase();
    const storeUrl = (Deno.env.get("STORE_URL") || "https://www.nynthworld.com").replace(/\/+$/, "");
    const orderUrl = `${storeUrl}/order/${orderId}?ref=${encodeURIComponent(reference)}`;
    const ticketBlock = codes.length ? ticketPassBlock(codes, storeUrl) : "";
    if (order.customer?.email) { try { await sendResend(order.customer.email, "Your NYNTH order is confirmed #" + shortId, customerHtml(order, { shortId, ticketBlock, orderUrl })); customerSent = true; } catch(e) { console.error(e); } }
    for (const admin of adminList) { try { await sendResend(admin, "New NYNTH sale: " + naira(order.total), adminHtml(order, { shortId, reference, itemsHtml: itemsText(order.items) })); adminSent = true; } catch(e) { console.error(e); } }
    if (customerSent || adminSent) {
      await supabase.from("orders").update({ customer_confirmation_sent_at: customerSent ? new Date().toISOString() : null, admin_notification_sent_at: adminSent ? new Date().toISOString() : null }).eq("id", orderId);
    }
    return Response.json({ success: true, orderId, alreadyPaid: false }, { headers: corsHeaders });
  } catch (e) { console.error(e); return Response.json({ error: "Transaction failed" }, { status: 500, headers: corsHeaders }); }
}

if (import.meta.main) Deno.serve(handler);
