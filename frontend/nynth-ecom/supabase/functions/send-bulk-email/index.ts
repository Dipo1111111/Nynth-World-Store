// send-bulk-email - admin only (checks users.role), sends via Resend.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
Deno.serve(async (req) => {
  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: "Bearer " + jwt } } });
  const { data: { user } } = await supabase.auth.getUser(jwt);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: profile } = await admin.from("users").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  const { emails, subject, body } = await req.json();
  const key = Deno.env.get("RESEND_API_KEY") ?? "";
  const from = Deno.env.get("EMAIL_FROM") || "Nynth <onboarding@resend.dev>";
  let sent = 0, failed = 0;
  for (const email of emails ?? []) {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key }, body: JSON.stringify({ from, to: email, subject, html: "<p>" + String(body).replace(/\n/g, "<br>") + "</p>" }) });
    r.ok ? sent++ : failed++;
  }
  return Response.json({ success: true, sent, failed });
});
