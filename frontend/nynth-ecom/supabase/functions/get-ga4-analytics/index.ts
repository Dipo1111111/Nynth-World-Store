// get-ga4-analytics — admin only. Returns {status:'unconfigured'} until GA_PROPERTY_ID +
// GA_SERVICE_ACCOUNT_KEY (base64 JSON) are set. Full GA Data API call added at cutover.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
Deno.serve(async (req) => {
  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: "Bearer " + jwt } } });
  const { data: { user } } = await supabase.auth.getUser(jwt);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  if (!Deno.env.get("GA_PROPERTY_ID") || !Deno.env.get("GA_SERVICE_ACCOUNT_KEY")) {
    return Response.json({ status: "unconfigured", message: "GA_PROPERTY_ID / GA_SERVICE_ACCOUNT_KEY missing", metrics: {} });
  }
  return Response.json({ status: "success", totalVisits: 0, totalViews: 0, metricsByDate: {} });
});
