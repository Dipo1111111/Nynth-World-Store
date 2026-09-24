// paystack-webhook - verifies x-paystack-signature HMAC-SHA512 (Web Crypto), finalizes
// order (paid/confirmed, NWT tickets, stock decrement, idempotent on paid),
// fire-and-forget Resend emails. No JWT (Paystack calls it) - set verify_jwt=false.
// The paid transition is conditional on the order still being pending, so a
// concurrent paystack-verify call cannot double-mint codes, double-decrement
// stock, or double-email. Email copy lives in _shared/email.ts.
// Secrets (dashboard, NOT in code): PAYSTACK_SECRET_KEY, RESEND_API_KEY, EMAIL_FROM,
// ADMIN_NOTIFY_EMAIL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { naira, ticketCodes, ticketPassBlock, itemsText, customerHtml, adminHtml, sendResend } from "../_shared/email.ts";

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
      // Conditional transition: only the first finalizer wins.
      const { data: claimed } = await supabase.from("orders").update({ payment_status: "paid", order_status: "confirmed", payment_reference: reference, payment_gateway: "paystack", is_test: isTest, tickets: codes.length ? codes : order.tickets, paid_at: new Date().toISOString() }).eq("id", orderId).eq("payment_status", "pending").select("id");
      if (claimed && claimed.length > 0) {
        for (const item of order.items ?? []) {
          const { data: p } = await supabase.from("products").select("stock_quantity").eq("id", item.id).maybeSingle();
          if (p) await supabase.from("products").update({ stock_quantity: Math.max(0, (p.stock_quantity ?? 0) - (item.quantity || 1)) }).eq("id", item.id);
        }
        const adminTo = Deno.env.get("ADMIN_NOTIFY_EMAIL") ?? "";
        const adminList = adminTo.split(",").map((s) => s.trim()).filter(Boolean);
        let customerSent = false, adminSent = false;
        const shortId = orderId.slice(0, 8).toUpperCase();
        const storeUrl = (Deno.env.get("STORE_URL") || "https://www.nynthworld.com").replace(/\/+$/, "");
        const orderUrl = `${storeUrl}/order/${orderId}?ref=${encodeURIComponent(reference ?? "")}`;
        const ticketBlock = codes.length ? ticketPassBlock(codes, storeUrl) : "";
        if (order.customer?.email) { try { await sendResend(order.customer.email, "Your NYNTH order is confirmed #" + shortId, customerHtml(order, { shortId, ticketBlock, orderUrl })); customerSent = true; } catch(e) { console.error(e); } }
        for (const admin of adminList) { try { await sendResend(admin, "New NYNTH sale: " + naira(order.total), adminHtml(order, { shortId, reference, itemsHtml: itemsText(order.items) })); adminSent = true; } catch(e) { console.error(e); } }
        if (customerSent || adminSent) {
          await supabase.from("orders").update({ customer_confirmation_sent_at: customerSent ? new Date().toISOString() : null, admin_notification_sent_at: adminSent ? new Date().toISOString() : null }).eq("id", orderId);
        }
      }
    } else {
      // Already finalized earlier - still correct the mode stamp (covers orders
      // created before the is_test column existed).
      await supabase.from("orders").update({ is_test: isTest }).eq("id", orderId);
    }
    return new Response("Success", { status: 200 });
  } catch (e) { console.error(e); return new Response("Transaction failed", { status: 500 }); }
});
