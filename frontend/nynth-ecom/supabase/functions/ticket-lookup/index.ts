// ticket-lookup — public ticket pass verification. No JWT (buyers and door
// staff open it from a link or scan). Returns minimal pass data only: never
// emails, addresses, phones, or totals.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const { code } = await req.json().catch(() => ({}));
  const normalized = String(code ?? "").trim().toUpperCase();
  if (!normalized) return Response.json({ found: false }, { headers: corsHeaders });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const { data: orders, error } = await supabase.from("orders").select("id,tickets,customer,payment_status,order_status,is_test").not("tickets", "is", null);
    if (error) throw error;
    for (const order of orders ?? []) {
      const ticket = (order.tickets ?? []).find((t: any) => String(t.code ?? "").toUpperCase() === normalized);
      if (ticket) {
        return Response.json({
          found: true,
          used: ticket.used === true,
          used_at: ticket.used_at ?? null,
          code: ticket.code,
          title: ticket.title ?? "NYNTH WORLD Event",
          eventDateTime: ticket.eventDateTime ?? null,
          venue: ticket.venue ?? null,
          orderId: order.id,
          buyer: order.customer?.firstName ?? null,
          payment_status: order.payment_status ?? null,
          order_status: order.order_status ?? null,
          isTest: order.is_test === true,
        }, { headers: corsHeaders });
      }
    }
    return Response.json({ found: false }, { headers: corsHeaders });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "lookup failed" }, { status: 500, headers: corsHeaders });
  }
}

if (import.meta.main) Deno.serve(handler);
