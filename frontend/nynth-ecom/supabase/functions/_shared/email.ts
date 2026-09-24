// Shared: Resend send + NWT ticket codes + order email builders. Deno Edge
// Function code. No secrets hardcoded. Both finalize functions
// (paystack-verify, paystack-webhook) import from here so the buyer email can
// never drift between the popup and webhook paths again.
export function naira(n: number) { return "\u20A6" + Number(n || 0).toLocaleString("en-NG"); }

export function escapeHtml(s: unknown) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

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

export function hasPhysicalItems(items: any[] = []) {
  return (items ?? []).some((i: any) => i.category !== "tickets");
}

export function eventLine(t: any): string {
  if (!t.eventDateTime) return "";
  const d = new Date(t.eventDateTime);
  if (isNaN(d.getTime())) return "";
  try {
    const label = d.toLocaleString("en-GB", {
      timeZone: "Africa/Lagos",
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).toUpperCase();
    return `<p style="margin:2px 0 0;font-size:13px;color:#555555">${label} WAT</p>`;
  } catch {
    return "";
  }
}

export function ticketPassBlock(codes: any[], storeUrl: string): string {
  if (!codes.length) return "";
  const cards = codes.map((t: any) => {
    const meta = t.price ? ` · ${naira(t.price)}` : "";
    return `<div style="margin:10px 0;padding:12px 14px;border:1px solid #e8e8e8;border-radius:8px">`
      + `<p style="margin:0 0 2px"><strong>${escapeHtml(t.title)}</strong></p>`
      + eventLine(t)
      + (t.venue ? `<p style="margin:2px 0 0;font-size:13px;color:#555555">${escapeHtml(t.venue)}</p>` : "")
      + `<p style="margin:6px 0 0;font-size:12px;color:#555555">Pass code: <strong style="font-family:monospace">${escapeHtml(t.code)}</strong>${meta}</p>`
      + `<p style="margin:4px 0 0"><a href="${storeUrl}/ticket/${escapeHtml(t.code)}" style="color:#111111;font-weight:bold">Open your pass</a></p>`
      + `</div>`;
  }).join("");
  return `<p style="margin:16px 0 0">Your e-ticket passes:</p>` + cards;
}

export function itemsText(items: any[]): string {
  return (items ?? []).map((i: any) => {
    let line = `${escapeHtml(i.name || i.title || "Item")} x${i.quantity || 1}`;
    if (i.category === "tickets") {
      if (i.eventDateTime) {
        const d = new Date(i.eventDateTime);
        if (!isNaN(d.getTime())) {
          try {
            line += " · " + d.toLocaleDateString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" }).toUpperCase();
          } catch { /* ignore */ }
        }
      }
      if (i.venue) line += " · " + escapeHtml(i.venue);
    }
    return line;
  }).join("<br>");
}

export function customerHtml(order: any, opts: { shortId: string; ticketBlock: string; orderUrl: string }): string {
  const ticketsOnly = !hasPhysicalItems(order.items);
  const heading = ticketsOnly ? "You're in." : "Order confirmed.";
  const body = ticketsOnly
    ? `<p>Thanks ${order.customer?.firstName ?? "there"}, your payment of ${naira(order.total)} went through. Your e-ticket passes are below and in your inbox. Order <strong>#${opts.shortId}</strong> - no delivery, nothing to wait for. Present a pass at the gate.</p>`
    : `<p>Thanks ${order.customer?.firstName ?? "there"}, your payment of ${naira(order.total)} went through. Order <strong>#${opts.shortId}</strong> is being prepared.</p>`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111111;line-height:1.6">`
    + `<p style="font-size:11px;letter-spacing:3px;font-weight:bold;margin:0">NYNTH WORLD</p>`
    + `<h1 style="font-size:24px;margin:8px 0 16px">${heading}</h1>`
    + body
    + opts.ticketBlock
    + `<p><a href="${opts.orderUrl}" style="color:#111111;font-weight:bold">View your order</a></p>`
    + `<p style="color:#666666;font-size:13px">Questions? Just reply to this email.</p></div>`;
}

export function adminHtml(order: any, opts: { shortId: string; reference: string; itemsHtml: string }): string {
  const shipLine = hasPhysicalItems(order.items)
    ? `<p><strong>Ship to:</strong> ${order.customer?.address ?? ""}, ${order.customer?.city ?? ""}, ${order.customer?.state ?? ""}</p>`
    : `<p><strong>Fulfilment:</strong> e-tickets only, no shipping.</p>`;
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#111111;line-height:1.6">`
    + `<p style="font-size:11px;letter-spacing:3px;font-weight:bold;margin:0">NYNTH WORLD - NEW SALE</p>`
    + `<h1 style="font-size:24px;margin:8px 0 16px">${naira(order.total)} paid.</h1>`
    + `<p>Order <strong>#${opts.shortId}</strong> just confirmed. Paystack ref ${opts.reference}.</p>`
    + `<p><strong>Buyer:</strong> ${(order.customer?.firstName ?? "") + " " + (order.customer?.lastName ?? "")} (${order.customer?.email ?? "no email"}, ${order.customer?.phone ?? "no phone"})</p>`
    + shipLine
    + `<p><strong>Items:</strong><br>${opts.itemsHtml}</p></div>`;
}

export async function sendResend(to: string, subject: string, html: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) { console.warn("RESEND_API_KEY not set - skipping email to " + to); return { skipped: true }; }
  const from = Deno.env.get("EMAIL_FROM") || "NYNTH WORLD <hello@nynthworld.com>";
  const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key }, body: JSON.stringify({ from, to, subject, html }) });
  if (!res.ok) throw new Error("Resend error " + res.status);
  return res.json();
}
