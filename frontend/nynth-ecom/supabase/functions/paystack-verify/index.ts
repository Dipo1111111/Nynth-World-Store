// paystack-verify — popup fallback: verifies reference with Paystack, finalizes
// same as webhook: paid/confirmed, NWT tickets, stock decrement, emails, notification
// timestamps. No JWT (guests use it) — set verify_jwt=false.
// Secrets (dashboard, NOT in code): PAYSTACK_SECRET_KEY, RESEND_API_KEY, EMAIL_FROM,
// ADMIN_NOTIFY_EMAIL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function naira(n: number) { return "\u20A6" + Number(n || 0).toLocaleString("en-NG"); }

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

async function sendResend(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) { console.warn("RESEND_API_KEY not set - skipping email to " + to); return { skipped: true }; }
  const from = Deno.env.get("EMAIL_FROM") || "NYNTH WORLD <hello@nynthworld.com>";
  const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key }, body: JSON.stringify({ from, to, subject, html }) });
  if (!res.ok) throw new Error("Resend error " + res.status);
  return res.json();
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { reference } = await req.json().catch(() => ({}));
  if (!reference) return Response.json({ error: "reference required" }, { status: 400, headers: corsHeaders });
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
  const res = await fetch("https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference), { headers: { Authorization: "Bearer " + secret } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.status || body.data?.status !== "success") return Response.json({ error: body.message ?? "verification failed" }, { status: 400, headers: corsHeaders });
  // Authoritative test stamp: Paystack itself reports which domain moved the money.
  // Never infer it from local keys, the frontend and server keys can disagree.
  const isTest = (body.data?.domain ?? (secret.startsWith("sk_test_") ? "test" : "live")) === "test";
  const orderId = body.data?.metadata?.orderId;
  if (!orderId) return Response.json({ error: "No orderId in metadata" }, { status: 404, headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (!order) return Response.json({ error: "order not found" }, { status: 404, headers: corsHeaders });
    if (order.payment_status === "paid") return Response.json({ success: true, orderId, alreadyPaid: true }, { headers: corsHeaders });
    const codes = ticketCodes(order.items);
    await supabase.from("orders").update({ payment_status: "paid", order_status: "confirmed", payment_reference: reference, is_test: isTest, tickets: codes.length ? codes : order.tickets, paid_at: new Date().toISOString() }).eq("id", orderId);
    for (const item of order.items ?? []) {
      const { data: p } = await supabase.from("products").select("stock_quantity").eq("id", item.id).maybeSingle();
      if (p) await supabase.from("products").update({ stock_quantity: Math.max(0, (p.stock_quantity ?? 0) - (item.quantity || 1)) }).eq("id", item.id);
    }
    const adminTo = Deno.env.get("ADMIN_NOTIFY_EMAIL") ?? "";
    let customerSent = false, adminSent = false;
    const shortId = orderId.slice(0, 8).toUpperCase();
    const ticketBlock = codes.length
      ? `<p style="margin:16px 0 0">Your ticket codes: <strong>${codes.map((t: any) => t.code).join(", ")}</strong></p>`
      : "";
    const customerHtml = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111111;line-height:1.6">`
      + `<p style="font-size:11px;letter-spacing:3px;font-weight:bold;margin:0">NYNTH WORLD</p>`
      + `<h1 style="font-size:24px;margin:8px 0 16px">Order confirmed.</h1>`
      + `<p>Thanks ${order.customer?.firstName ?? "there"}, your payment of ${naira(order.total)} went through. Order <strong>#${shortId}</strong> is being prepared.</p>`
      + ticketBlock
      + `<p style="color:#666666;font-size:13px">Questions? Just reply to this email.</p></div>`;
    const adminHtml = `<p>New paid order <strong>#${orderId}</strong> for ${naira(order.total)}. Paystack ref ${reference}.</p>`;
    if (order.customer?.email) { try { await sendResend(order.customer.email, "Your NYNTH order is confirmed #" + shortId, customerHtml); customerSent = true; } catch(e) { console.error(e); } }
    if (adminTo) { try { await sendResend(adminTo, "New NYNTH sale: " + naira(order.total), adminHtml); adminSent = true; } catch(e) { console.error(e); } }
    if (customerSent || adminSent) {
      await supabase.from("orders").update({ customer_confirmation_sent_at: customerSent ? new Date().toISOString() : null, admin_notification_sent_at: adminSent ? new Date().toISOString() : null }).eq("id", orderId);
    }
    return Response.json({ success: true, orderId, alreadyPaid: false }, { headers: corsHeaders });
  } catch (e) { console.error(e); return Response.json({ error: "Transaction failed" }, { status: 500, headers: corsHeaders }); }
}

if (import.meta.main) Deno.serve(handler);
