// Shared: Resend send + NWT ticket codes. Deno Edge Function code. No secrets hardcoded.
export function naira(n: number) { return "\u20A6" + Number(n || 0).toLocaleString("en-NG"); }
export function ticketCodes(items: any[] = []) {
  const used = new Set<string>(); const out: any[] = [];
  for (const item of items ?? []) {
    if (item.category !== "tickets") continue;
    for (let i = 0; i < (item.quantity || 1); i++) {
      let code: string;
      do { code = "NWT-" + crypto.getRandomValues(new Uint8Array(4)).reduce((s, b) => s + b.toString(16).padStart(2, "0"), "").toUpperCase(); } while (used.has(code));
      used.add(code);
      out.push({ code, productId: item.id, title: item.name || item.title || "NYNTH WORLD Event", eventDateTime: item.eventDateTime ?? null, venue: item.venue ?? null, price: item.price || 0 });
    }
  }
  return out;
}
export async function sendResend(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) { console.warn("RESEND_API_KEY not set - skipping email to " + to); return { skipped: true }; }
  const from = Deno.env.get("EMAIL_FROM") || "NYNTH WORLD <hello@nynthworld.com>";
  const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key }, body: JSON.stringify({ from, to, subject, html }) });
  if (!res.ok) throw new Error("Resend error " + res.status);
  return res.json();
}
