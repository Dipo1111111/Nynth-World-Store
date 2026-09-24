// order-lookup - guest order reads. No JWT (guests have no session, and RLS
// blocks them from reading orders). Returns buyer-safe fields only when the
// caller proves ownership with the Paystack reference stamped on the order:
// items, tickets, totals, statuses. Never customer PII, never emails.
// Used by the thank-you page and the public order view. Set verify_jwt=false.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { orderId, reference } = await req.json().catch(() => ({}));
  if (!orderId || !reference) return Response.json({ error: "orderId + reference required" }, { status: 400, headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const { data: order } = await supabase.from("orders").select("id,items,tickets,subtotal,shipping_fee,discount_amount,discount_code,total,payment_status,order_status,payment_reference,is_test,paid_at,created_at").eq("id", orderId).maybeSingle();
    if (!order || order.payment_reference !== reference) {
      return Response.json({ found: false }, { headers: corsHeaders });
    }
    return Response.json({
      found: true,
      id: order.id,
      items: order.items ?? [],
      tickets: order.tickets ?? [],
      subtotal: Number(order.subtotal ?? 0),
      shippingFee: Number(order.shipping_fee ?? 0),
      discountAmount: Number(order.discount_amount ?? 0),
      discountCode: order.discount_code ?? null,
      total: Number(order.total ?? 0),
      payment_status: order.payment_status,
      order_status: order.order_status,
      isTest: order.is_test === true,
      paid_at: order.paid_at ?? null,
      created_at: order.created_at ?? null,
    }, { headers: corsHeaders });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "lookup failed" }, { status: 500, headers: corsHeaders });
  }
}

if (import.meta.main) Deno.serve(handler);
