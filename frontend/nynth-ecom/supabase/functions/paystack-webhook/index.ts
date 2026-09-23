// paystack-webhook - verifies x-paystack-signature HMAC-SHA512 (Web Crypto), finalizes
// order (paid/confirmed, NWT tickets, stock decrement, idempotent on paid),
// fire-and-forget Resend emails. No JWT (Paystack calls it) - set verify_jwt=false.
// Secrets (dashboard, NOT in code): PAYSTACK_SECRET_KEY, RESEND_API_KEY, EMAIL_FROM,
// ADMIN_NOTIFY_EMAIL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function validSignature(secret: string, raw: string, sig: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === sig;
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature") ?? "";
  if (!secret || !(await validSignature(secret, raw, sig))) return new Response("Invalid signature", { status: 401 });
  const event = JSON.parse(raw);
  if (event.event !== "charge.success") return new Response("Event acknowledged", { status: 200 });
  // Authoritative test stamp: Paystack itself reports which domain moved the money.
  // Never infer it from local keys, the frontend and server keys can disagree.
  const isTest = (event.data?.domain ?? (secret.startsWith("sk_test_") ? "test" : "live")) === "test";
  const orderId = event.data?.metadata?.orderId;
  const reference = event.data?.reference;
  if (!orderId) return new Response("No orderId in metadata", { status: 400 });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (!order) return new Response("Order not found", { status: 404 });
    if (order.payment_status !== "paid") {
      const codes = order.tickets?.length ? order.tickets : ticketCodes(order.items);
      await supabase.from("orders").update({ payment_status: "paid", order_status: "confirmed", payment_reference: reference, payment_gateway: "paystack", is_test: isTest, tickets: codes.length ? codes : order.tickets, paid_at: new Date().toISOString() }).eq("id", orderId);
      for (const item of order.items ?? []) {
        const { data: p } = await supabase.from("products").select("stock_quantity").eq("id", item.id).maybeSingle();
        if (p) await supabase.from("products").update({ stock_quantity: Math.max(0, (p.stock_quantity ?? 0) - (item.quantity || 1)) }).eq("id", item.id);
      }
      const adminTo = Deno.env.get("ADMIN_NOTIFY_EMAIL") ?? "";
      const adminList = adminTo.split(",").map((s) => s.trim()).filter(Boolean);
      let customerSent = false, adminSent = false;
      const shortId = orderId.slice(0, 8).toUpperCase();
      const storeUrl = (Deno.env.get("STORE_URL") || "https://www.nynthworld.com").replace(/\/+$/, "");
      const ticketBlock = codes.length
        ? `<p style="margin:16px 0 0">Your ticket codes: <strong>${codes.map((t: any) => t.code).join(", ")}</strong></p>`
          + codes.map((t: any) => `<p style="margin:4px 0 0"><a href="${storeUrl}/ticket/${t.code}">Open your pass for ${t.code}</a></p>`).join("")
        : "";
      const customerHtml = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111111;line-height:1.6">`
        + `<p style="font-size:11px;letter-spacing:3px;font-weight:bold;margin:0">NYNTH WORLD</p>`
        + `<h1 style="font-size:24px;margin:8px 0 16px">Order confirmed.</h1>`
        + `<p>Thanks ${order.customer?.firstName ?? "there"}, your payment of ${naira(order.total)} went through. Order <strong>#${shortId}</strong> is being prepared.</p>`
        + ticketBlock
        + `<p style="color:#666666;font-size:13px">Questions? Just reply to this email.</p></div>`;
      const adminHtml = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111111;line-height:1.6">`
        + `<p style="font-size:11px;letter-spacing:3px;font-weight:bold;margin:0">NYNTH WORLD - NEW SALE</p>`
        + `<h1 style="font-size:24px;margin:8px 0 16px">${naira(order.total)} paid.</h1>`
        + `<p>Order <strong>#${shortId}</strong> just confirmed. Paystack ref ${reference}.</p>`
        + `<p><strong>Buyer:</strong> ${(order.customer?.firstName ?? "") + " " + (order.customer?.lastName ?? "")} (${order.customer?.email ?? "no email"}, ${order.customer?.phone ?? "no phone"})</p>`
        + `<p><strong>Ship to:</strong> ${order.customer?.address ?? ""}, ${order.customer?.city ?? ""}, ${order.customer?.state ?? ""}</p>`
        + `<p><strong>Items:</strong><br>${(order.items ?? []).map((i: any) => `${i.name || i.title || "Item"} x${i.quantity || 1}`).join("<br>")}</p></div>`;
      if (order.customer?.email) { try { await sendResend(order.customer.email, "Your NYNTH order is confirmed #" + shortId, customerHtml); customerSent = true; } catch(e) { console.error(e); } }
      for (const admin of adminList) { try { await sendResend(admin, "New NYNTH sale: " + naira(order.total), adminHtml); adminSent = true; } catch(e) { console.error(e); } }
      if (customerSent || adminSent) {
        await supabase.from("orders").update({ customer_confirmation_sent_at: customerSent ? new Date().toISOString() : null, admin_notification_sent_at: adminSent ? new Date().toISOString() : null }).eq("id", orderId);
      }
    } else {
      // Already finalized earlier - still correct the mode stamp (covers orders
      // created before the is_test column existed).
      await supabase.from("orders").update({ is_test: isTest }).eq("id", orderId);
    }
    return new Response("Success", { status: 200 });
  } catch (e) { console.error(e); return new Response("Transaction failed", { status: 500 }); }
});
