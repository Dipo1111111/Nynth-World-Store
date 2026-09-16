const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const crypto = require("crypto");
const QRCode = require("qrcode");

// Set global options to ensure region alignment
setGlobalOptions({ region: "us-central1" });

admin.initializeApp();
const db = admin.firestore();

// ---------------------------------------------------------------
// EMAIL HELPERS (Resend) - order confirmation + admin new-sale alert
// ---------------------------------------------------------------

const naira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");

const esc = (str) =>
    String(str == null ? "" : str).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));

const orderItemsRows = (items = []) =>
    items
        .map((item) => {
            const name = esc(item.name || item.title || "Item");
            const isTicket = item.category === "tickets";
            const options = isTicket
                ? ["E-TICKET", formatEventDateText(item.eventDateTime)].filter(Boolean).join(" · ")
                : [item.size || item.selectedSize, item.color || item.selectedColor]
                    .filter(Boolean)
                    .map(esc)
                    .join(" / ");
            const image = item.image || item.thumbnail || "";
            const lineTotal = naira((item.price || 0) * (item.quantity || 1));
            return `
            <tr>
              <td style="padding:16px;border-bottom:1px solid #efefef;vertical-align:middle;">
                <table cellpadding="0" cellspacing="0"><tr>
                  ${image ? `<td style="padding-right:12px;"><img src="${esc(image)}" width="56" height="72" style="width:56px;height:72px;object-fit:cover;border-radius:4px;display:block;" alt="" /></td>` : ""}
                  <td style="vertical-align:middle;">
                    <div style="font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:.05em;color:#0a0a0a;text-transform:uppercase;">${name}</div>
                    ${options ? `<div style="font-family:Inter,Arial,sans-serif;font-size:11px;letter-spacing:.08em;color:#777;text-transform:uppercase;margin-top:3px;">${options}</div>` : ""}
                    <div style="font-family:Inter,Arial,sans-serif;font-size:11px;color:#999;margin-top:3px;">Qty ${item.quantity || 1}</div>
                  </td>
                </tr></table>
              </td>
              <td style="padding:16px;border-bottom:1px solid #efefef;text-align:right;vertical-align:middle;font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:700;color:#0a0a0a;white-space:nowrap;">${lineTotal}</td>
            </tr>`;
        })
        .join("");

const formatEventDateText = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    try {
        return d
            .toLocaleString("en-GB", {
                timeZone: "Africa/Lagos",
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            })
            .toUpperCase();
    } catch (e) {
        return "";
    }
};

// Generates one unique e-ticket code per ticket. Codes are the source of truth
// at the gate - the QR code simply encodes the code for fast scanning.
function generateTicketCodes(items = []) {
    const used = new Set();
    const tickets = [];
    for (const item of items || []) {
        if (item.category !== "tickets") continue;
        const qty = item.quantity || 1;
        for (let i = 0; i < qty; i++) {
            let code;
            do {
                code = "NWT-" + crypto.randomBytes(4).toString("hex").toUpperCase();
            } while (used.has(code));
            used.add(code);
            tickets.push({
                code,
                productId: item.id,
                title: item.name || item.title || "NYNTH WORLD Event",
                eventDateTime: item.eventDateTime || null,
                venue: item.venue || null,
                price: item.price || 0,
            });
        }
    }
    return tickets;
}

// Builds QR data-URLs for tickets in memory. Used by the confirmation email only -
// Firestore keeps the plain codes, the QR is regenerated on demand.
async function buildEticketQrs(tickets = []) {
    const qrByCode = {};
    for (const t of tickets) {
        try {
            qrByCode[t.code] = await QRCode.toDataURL(`NYNTH:${t.code}`, {
                margin: 1,
                width: 220,
                errorCorrectionLevel: "M",
            });
        } catch (e) {
            qrByCode[t.code] = "";
        }
    }
    return qrByCode;
}

const hasPhysicalItemsInOrder = (items = []) => items.some((i) => i.category !== "tickets");

const emailShell = (title, inner) => `
<table cellpadding="0" cellspacing="0" width="100%" bgcolor="#f5f5f5" style="width:100%;background:#f5f5f5;padding:32px 0;">
  <tr><td align="center">
    <table cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px;background:#ffffff;">
      <tr><td style="background:#0a0a0a;padding:28px 40px;text-align:center;">
        <div style="font-family:Inter,Arial,sans-serif;font-size:20px;font-weight:800;letter-spacing:.28em;color:#ffffff;">NYNTH<span style="color:#9ca3af;"> WORLD</span></div>
        <div style="font-family:Inter,Arial,sans-serif;font-size:9px;letter-spacing:.4em;color:#9ca3af;margin-top:6px;text-transform:uppercase;">${title}</div>
      </td></tr>
      <tr><td style="padding:40px;">
        ${inner}
      </td></tr>
      <tr><td style="background:#fafafa;border-top:1px solid #efefef;padding:24px 40px;text-align:center;">
        <div style="font-family:Inter,Arial,sans-serif;font-size:10px;letter-spacing:.22em;color:#999;text-transform:uppercase;">BY WINNERS, FOR WINNERS, STAY ABOVE</div>
        <div style="font-family:Inter,Arial,sans-serif;font-size:10px;color:#bbb;margin-top:6px;">© ${new Date().getFullYear()} NYNTH WORLD LTD</div>
      </td></tr>
    </table>
  </td></tr>
</table>`;

async function getSiteSettings() {
    try {
        const doc = await db.collection("settings").doc("site_config").get();
        return doc.exists ? doc.data() : {};
    } catch (e) {
        return {};
    }
}

async function sendResendEmail({ to, subject, html }) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn("RESEND_API_KEY not set - skipping transaction email to " + to);
        return { skipped: true };
    }
    const from = process.env.EMAIL_FROM || "NYNTH WORLD <onboarding@resend.dev>";
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ from, to, subject, html }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Resend error ${response.status}`);
    }
    return response.json();
}

function buildCustomerConfirmationHtml(order, orderId, reference, settings = {}, extras = {}) {
    const customer = order.customer || {};
    const siteName = settings.site_name || "NYNTH WORLD";
    const currency = settings.currency_symbol || "₦";
    const money = (n) => currency + Number(n || 0).toLocaleString("en-NG");
    const shippingFee = order.shippingFee ?? order.shipping_fee ?? 0;

    const items = order.items || [];
    const tickets = extras.tickets || order.tickets || [];
    const qrByCode = extras.qrByCode || {};
    const hasPhysical = hasPhysicalItemsInOrder(items);
    const itemsTable = orderItemsRows(items);

    const ticketCards = tickets
        .map((t) => {
            const qr = qrByCode[t.code] || "";
            const when = formatEventDateText(t.eventDateTime);
            return `
          <table cellpadding="0" cellspacing="0" width="100%" style="width:100%;background:#0a0a0a;border-radius:10px;margin-bottom:14px;">
            <tr><td style="padding:22px 24px;">
              <div style="font-family:Inter,Arial,sans-serif;font-size:9px;letter-spacing:.28em;color:#9ca3af;text-transform:uppercase;font-weight:700;">E-Ticket · Entry Code</div>
              <div style="font-family:ui-monospace,Menlo,monospace;font-size:22px;font-weight:800;letter-spacing:.08em;color:#ffffff;margin-top:6px;">${esc(t.code)}</div>
              <div style="font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;color:#ffffff;text-transform:uppercase;margin-top:12px;">${esc(t.title)}</div>
              <div style="font-family:Inter,Arial,sans-serif;font-size:11px;color:#9ca3af;letter-spacing:.06em;margin-top:4px;">${when ? esc(when) : "Date TBC"}${t.venue ? " · " + esc(t.venue) : ""}</div>
              <table cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  ${qr ? `<td style="padding-right:18px;background:#ffffff;border-radius:8px;padding:8px;"><img src="${qr}" width="120" height="120" style="width:120px;height:120px;display:block;" alt="QR" /></td>` : ""}
                  <td style="vertical-align:middle;">
                    <div style="font-family:Inter,Arial,sans-serif;font-size:8px;letter-spacing:.2em;color:#9ca3af;text-transform:uppercase;">Show this code</div>
                    <div style="font-family:Inter,Arial,sans-serif;font-size:8px;letter-spacing:.2em;color:#9ca3af;text-transform:uppercase;margin-top:2px;">at the gate to enter</div>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>`;
        })
        .join("");

    return emailShell("Order Confirmed", `
      <h1 style="font-family:Inter,Arial,sans-serif;font-size:26px;line-height:1.2;font-weight:800;letter-spacing:.02em;color:#0a0a0a;margin:0 0 8px;">${tickets.length ? "YOU'RE IN" : "CONGRATULATIONS"}${customer.firstName ? ", " + esc(customer.firstName) : ""}!</h1>
      <div style="font-family:Inter,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:.18em;color:#059669;text-transform:uppercase;margin-bottom:18px;">${tickets.length ? "See you at the show" : "Welcome to " + siteName}</div>
      <p style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.7;color:#444;margin:0 0 24px;">${
          tickets.length && !hasPhysical
              ? "Your payment went through and your e-tickets are below. No delivery, no fees - just show the code (or QR) at the gate to enter."
              : tickets.length
                ? "Your payment went through. Your e-tickets are below - show the code (or QR) at the gate. Your merchandise will be shipped separately."
                : "Your payment went through and your order is now being confirmed. We are packaging it with care and will update you the moment it ships."
      }</p>

      <table cellpadding="0" cellspacing="0" width="100%" style="background:#0a0a0a;border-radius:6px;margin-bottom:28px;">
        <tr>
          <td style="padding:16px 20px;">
            <div style="font-family:Inter,Arial,sans-serif;font-size:9px;letter-spacing:.24em;color:#9ca3af;text-transform:uppercase;">Order Reference</div>
            <div style="font-family:ui-monospace,Menlo,monospace;font-size:16px;font-weight:700;color:#ffffff;margin-top:4px;letter-spacing:.04em;">#${esc(orderId || "")}</div>
            <div style="font-family:Inter,Arial,sans-serif;font-size:11px;color:#9ca3af;margin-top:4px;">Paystack Ref: ${esc(reference || "-")}</div>
          </td>
        </tr>
      </table>

      ${tickets.length ? `
      <div style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.24em;color:#0a0a0a;text-transform:uppercase;margin-bottom:10px;">Your E-Tickets${tickets.length > 1 ? " (" + tickets.length + ")" : ""}</div>
      ${ticketCards}
      ` : ""}

      <div style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.24em;color:#0a0a0a;text-transform:uppercase;margin-bottom:10px;">Your Items</div>
      <table cellpadding="0" cellspacing="0" width="100%" style="width:100%;border:1px solid #efefef;border-radius:6px;">
        ${itemsTable || `<tr><td style="padding:16px;color:#999;font-size:13px;">No items recorded.</td></tr>`}
      </table>

      ${hasPhysical ? `
      <div style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.24em;color:#0a0a0a;text-transform:uppercase;margin:28px 0 10px;">Delivery Details</div>
      <table cellpadding="0" cellspacing="0" width="100%" style="width:100%;border:1px solid #efefef;border-radius:6px;">
        <tr><td style="padding:16px 20px;border-bottom:1px solid #efefef;">
          <div style="font-size:12px;font-weight:700;color:#0a0a0a;font-family:Inter,Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em;">${esc(customer.firstName || "")} ${esc(customer.lastName || "")}</div>
          <div style="font-size:12px;color:#666;margin-top:4px;font-family:Inter,Arial,sans-serif;">${esc(customer.address || "")}</div>
          <div style="font-size:12px;color:#666;font-family:Inter,Arial,sans-serif;">${esc(customer.city || "")}${customer.city && customer.state ? ", " : ""}${esc(customer.state || "")}</div>
        </td></tr>
        <tr><td style="padding:12px 20px;">
          <div style="font-size:12px;color:#666;font-family:Inter,Arial,sans-serif;">${esc(customer.phone || "")}</div>
          <div style="font-size:12px;color:#666;font-family:Inter,Arial,sans-serif;margin-top:2px;">${esc(customer.email || "")}</div>
        </td></tr>
      </table>
      ` : `
      <div style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#999;margin-top:22px;letter-spacing:.06em;">An e-ticket needs no delivery - your tickets are in this email. Save it or screenshot your code.</div>
      `}

      <div style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.24em;color:#0a0a0a;text-transform:uppercase;margin:28px 0 10px;">Payment Summary</div>
      <table cellpadding="0" cellspacing="0" width="100%" style="width:100%;border:1px solid #efefef;border-radius:6px;">
        <tr><td style="padding:14px 20px;border-bottom:1px solid #efefef;font-size:13px;color:#666;font-family:Inter,Arial,sans-serif;">Subtotal</td>
            <td style="padding:14px 20px;border-bottom:1px solid #efefef;font-size:13px;font-weight:700;color:#0a0a0a;text-align:right;font-family:Inter,Arial,sans-serif;white-space:nowrap;">${money(order.subtotal)}</td></tr>
        <tr><td style="padding:14px 20px;border-bottom:1px solid #efefef;font-size:13px;color:#666;font-family:Inter,Arial,sans-serif;">Delivery</td>
            <td style="padding:14px 20px;border-bottom:1px solid #efefef;font-size:13px;font-weight:700;color:#0a0a0a;text-align:right;font-family:Inter,Arial,sans-serif;white-space:nowrap;">${shippingFee ? money(shippingFee) : hasPhysical ? "FREE" : "FREE (E-TICKET)"}</td></tr>
        ${order.discountAmount ? `<tr><td style="padding:14px 20px;border-bottom:1px solid #efefef;font-size:13px;color:#047857;font-family:Inter,Arial,sans-serif;">Discount${order.discountCode ? " (" + esc(order.discountCode) + ")" : ""}</td>
            <td style="padding:14px 20px;border-bottom:1px solid #efefef;font-size:13px;font-weight:700;color:#047857;text-align:right;font-family:Inter,Arial,sans-serif;white-space:nowrap;">−${money(order.discountAmount)}</td></tr>` : ""}
        <tr><td style="padding:16px 20px;font-size:14px;font-weight:800;color:#0a0a0a;font-family:Inter,Arial,sans-serif;text-transform:uppercase;">Total Paid</td>
            <td style="padding:16px 20px;font-size:16px;font-weight:800;color:#0a0a0a;text-align:right;font-family:Inter,Arial,sans-serif;white-space:nowrap;">${money(order.total)}</td></tr>
      </table>

      <p style="font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.7;color:#555;margin:28px 0 0;">If you have any questions, just reply to this email - we are happy to help.</p>
      <p style="font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.7;color:#0a0a0a;margin:16px 0 0;font-weight:700;">The ${siteName} Team</p>
    `);
}

function buildAdminAlertHtml(order, orderId, reference, settings = {}) {
    const customer = order.customer || {};
    const orderItems = order.items || [];
    const currency = settings.currency_symbol || "₦";
    const money = (n) => currency + Number(n || 0).toLocaleString("en-NG");
    const tickets = order.tickets || [];
    const hasPhysical = hasPhysicalItemsInOrder(orderItems);

    return emailShell("New Sale", `
      <div style="font-family:Inter,Arial,sans-serif;font-size:9px;letter-spacing:.3em;color:#059669;text-transform:uppercase;font-weight:700;">New order - payment received</div>
      <h1 style="font-family:Inter,Arial,sans-serif;font-size:34px;line-height:1.1;font-weight:800;color:#0a0a0a;margin:8px 0 4px;">${money(order.total)}</h1>
      <div style="font-family:ui-monospace,Menlo,monospace;font-size:13px;color:#777;margin-bottom:26px;">Order #${esc(orderId || "")} · Paystack ${esc(reference || "-")}${tickets.length ? " · " + tickets.length + " e-ticket" + (tickets.length === 1 ? "" : "s") + " 🎟" : ""}</div>

      <table cellpadding="0" cellspacing="0" width="100%" style="width:100%;border:1px solid #efefef;border-radius:6px;margin-bottom:24px;">
        <tr><td style="padding:16px 20px;background:#fafafa;font-size:10px;font-weight:700;letter-spacing:.22em;color:#999;text-transform:uppercase;font-family:Inter,Arial,sans-serif;">Customer</td></tr>
        <tr><td style="padding:16px 20px;border-bottom:1px solid #efefef;">
          <div style="font-size:15px;font-weight:700;color:#0a0a0a;font-family:Inter,Arial,sans-serif;">${esc(customer.firstName || "")} ${esc(customer.lastName || "")}</div>
          <div style="font-size:13px;color:#555;margin-top:3px;font-family:Inter,Arial,sans-serif;">${esc(customer.email || "")} · ${esc(customer.phone || "")}</div>
        </td></tr>
        <tr><td style="padding:16px 20px;">
          ${hasPhysical ? `
          <div style="font-size:11px;font-weight:700;letter-spacing:.2em;color:#999;text-transform:uppercase;font-family:Inter,Arial,sans-serif;margin-bottom:6px;">Shipping Address</div>
          <div style="font-size:13px;color:#333;font-family:Inter,Arial,sans-serif;line-height:1.6;">${esc(customer.address || "")}<br/>${esc(customer.city || "")}${customer.city && customer.state ? ", " : ""}${esc(customer.state || "")}</div>
          ` : `
          <div style="font-size:11px;font-weight:700;letter-spacing:.2em;color:#059669;text-transform:uppercase;font-family:Inter,Arial,sans-serif;">E-ticket order - no delivery needed</div>
          `}
        </td></tr>
      </table>

      <div style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.24em;color:#0a0a0a;text-transform:uppercase;margin-bottom:10px;">Items${tickets.length ? " (tickets auto-delivered)" : ""}</div>
      <table cellpadding="0" cellspacing="0" width="100%" style="width:100%;border:1px solid #efefef;border-radius:6px;">
        ${orderItems.length ? orderItemsRows(order.items) : `<tr><td style="padding:16px;">No items.</td></tr>`}
      </table>

      <table cellpadding="0" cellspacing="0" width="100%" style="width:100%;margin-top:20px;">
        <tr><td style="font-size:13px;color:#666;font-family:Inter,Arial,sans-serif;">Subtotal</td><td style="text-align:right;font-size:13px;font-weight:700;color:#0a0a0a;font-family:Inter,Arial,sans-serif;">${money(order.subtotal)}</td></tr>
        <tr><td style="font-size:13px;color:#666;font-family:Inter,Arial,sans-serif;padding-top:6px;">Delivery</td><td style="text-align:right;font-size:13px;font-weight:700;color:#0a0a0a;font-family:Inter,Arial,sans-serif;padding-top:6px;">${(order.shippingFee ?? order.shipping_fee ?? 0) ? money(order.shippingFee ?? order.shipping_fee) : "FREE"}</td></tr>
        ${order.discountAmount ? `<tr><td style="font-size:13px;color:#047857;font-family:Inter,Arial,sans-serif;padding-top:6px;">Discount (${esc(order.discountCode || "")})</td><td style="text-align:right;font-size:13px;font-weight:700;color:#047857;font-family:Inter,Arial,sans-serif;padding-top:6px;">−${money(order.discountAmount)}</td></tr>` : ""}
        <tr><td style="border-top:1px solid #efefef;padding-top:12px;font-size:14px;font-weight:800;color:#0a0a0a;font-family:Inter,Arial,sans-serif;text-transform:uppercase;">Total</td><td style="border-top:1px solid #efefef;padding-top:12px;text-align:right;font-size:16px;font-weight:800;color:#0a0a0a;font-family:Inter,Arial,sans-serif;">${money(order.total)}</td></tr>
      </table>

      <p style="font-family:Inter,Arial,sans-serif;font-size:12px;color:#777;margin:24px 0 0;line-height:1.6;">Open the admin dashboard to review this order and update its fulfillment status.</p>
    `);
}

exports.paystackWebhook = onRequest(
    { secrets: ["PAYSTACK_SECRET_KEY", "RESEND_API_KEY", "EMAIL_FROM", "ADMIN_NOTIFY_EMAIL"] },
    async (req, res) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        const signature = req.headers["x-paystack-signature"];

        // 1. Verify Signature
        const hash = crypto
            .createHmac("sha512", secret)
            .update(JSON.stringify(req.body))
            .digest("hex");

        if (hash !== signature) {
            console.error("Invalid signature");
            return res.status(401).send("Invalid signature");
        }

        const event = req.body;

        // 2. Handle 'charge.success'
        if (event.event === "charge.success") {
            const reference = event.data?.reference;
            const orderId = event.data?.metadata?.orderId;

            if (!orderId) {
                console.error("No orderId found in metadata");
                return res.status(400).send("No orderId in metadata");
            }

            try {
                const { processed } = await finalizePaidOrder(orderId, reference);
                if (processed) {
                    console.log(`Successfully processed payment (webhook) for Order: ${orderId}`);
                } else {
                    console.log(`Order ${orderId} already marked as paid - duplicate webhook ignored.`);
                }
                return res.status(200).send("Success");
            } catch (error) {
                console.error("Transaction failed: ", error);
                return res.status(500).send("Transaction failed");
            }
        }

        // Return 200 for other events to acknowledge receipt
        res.status(200).send("Event acknowledged");
    }
);

// Marks an order as paid inside a transaction: generates e-ticket codes and
// decrements stock. Idempotent - a second call for an already-paid order is a
// no-op. Shared by the Paystack webhook and the paystackVerify fallback so both
// paths behave identically. Returns { processed }.
async function finalizePaidOrder(orderId, reference) {
    const orderRef = db.collection("orders").doc(orderId);
    let processed = false;

    await db.runTransaction(async (transaction) => {
        const orderDoc = await transaction.get(orderRef);

        if (!orderDoc.exists) {
            throw new Error(`Order ${orderId} does not exist`);
        }

        const orderData = orderDoc.data();

        // Avoid duplicate processing
        if (orderData.payment_status === "paid") {
            return;
        }

        processed = true;

        // A. Update Order Status
        const ticketCodes = orderData.tickets && orderData.tickets.length
            ? orderData.tickets
            : generateTicketCodes(orderData.items);

        transaction.update(orderRef, {
            payment_status: "paid",
            order_status: "confirmed",
            payment_reference: reference,
            payment_gateway: "paystack",
            tickets: ticketCodes.length ? ticketCodes : admin.firestore.FieldValue.delete(),
            paid_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        // B. Decrement Stock
        if (orderData.items && Array.isArray(orderData.items)) {
            for (const item of orderData.items) {
                const productRef = db.collection("products").doc(item.id);
                const productDoc = await transaction.get(productRef);

                if (productDoc.exists) {
                    const currentStock = productDoc.data().stockQuantity || 0;
                    const newStock = Math.max(0, currentStock - (item.quantity || 1));
                    transaction.update(productRef, {
                        stockQuantity: newStock,
                        inStock: newStock > 0,
                        updated_at: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
            }
        }
    });

    // C. Trigger emails - fire-and-forget: a failure here must never fail the
    // payment flow. Only dispatched when this call actually processed the payment.
    if (processed) {
        const paidOrder = await orderRef.get();
        const orderData = paidOrder.exists ? paidOrder.data() : {};
        sendOrderNotifications(orderRef, orderData, orderId, reference)
            .then(() => console.log(`Emails dispatched for order ${orderId}`))
            .catch((err) => console.error(`Email dispatch failed for order ${orderId}:`, err.message));
    }

    return { processed };
}

// 2b. Server-side payment verification (popup flow fallback).
// The Paystack popup calls this from onSuccess. It verifies the transaction
// against Paystack from the trusted backend, then marks the order paid - so an
// order never sits at "pending" even if the dashboard webhook was never wired up.
// Safe for guests: marking paid requires Paystack to confirm the charge, which a
// client alone can never forge. The order to mark is taken from Paystack's own
// metadata, never from a client-supplied id.
exports.paystackVerify = onCall(
    {
        secrets: ["PAYSTACK_SECRET_KEY", "RESEND_API_KEY", "EMAIL_FROM", "ADMIN_NOTIFY_EMAIL"],
    },
    async (request) => {
        const reference = request.data && request.data.reference;
        if (!reference) throw new HttpsError("invalid-argument", "reference is required");

        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) throw new HttpsError("unavailable", "PAYSTACK_SECRET_KEY is not configured");

        const response = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            { headers: { Authorization: `Bearer ${secret}` } }
        ).catch(() => null);

        if (!response) throw new HttpsError("unavailable", "Could not reach Paystack verification API");

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.status) {
            throw new HttpsError("unavailable", data.message || "Paystack verification failed");
        }

        const verified = data.data;
        if (!verified || verified.status !== "success") {
            throw new HttpsError(
                "failed-precondition",
                `Transaction is ${verified ? verified.status : "unknown"} - order was not paid`
            );
        }

        const orderId = verified.metadata && verified.metadata.orderId;
        if (!orderId) throw new HttpsError("not-found", "No orderId in payment metadata");

        const { processed } = await finalizePaidOrder(orderId, reference);
        return { success: true, orderId, alreadyPaid: !processed };
    }
);

// Sends the customer confirmation + admin new-sale alert and marks them on the order.
async function sendOrderNotifications(orderRef, orderData, orderId, reference) {
    const settings = await getSiteSettings();
    const customer = orderData.customer || {};
    const tickets = orderData.tickets || [];
    const qrByCode = tickets.length ? await buildEticketQrs(tickets) : {};

    const notifications = [];

    // 1. Fancy order confirmation to the customer
    if (customer.email) {
        notifications.push(
            sendResendEmail({
                to: customer.email,
                subject: tickets.length
                    ? `Your NYNTH e-ticket${tickets.length === 1 ? "" : "s"} are here - Order #${orderId.slice(0, 8).toUpperCase()}`
                    : `Your NYNTH order is confirmed - Order #${orderId.slice(0, 8).toUpperCase()}`,
                html: buildCustomerConfirmationHtml(orderData, orderId, reference, settings, { tickets, qrByCode }),
            }).then((result) => (result && result.id ? "customer" : "skipped")),
        );
    }

    // 2. Admin "new sale" alert so the founder is aware the moment money lands
    const adminNotifyEmail = settings.support_email || process.env.ADMIN_NOTIFY_EMAIL || "nynthworld@gmail.com";
    if (adminNotifyEmail) {
        notifications.push(
            sendResendEmail({
                to: String(adminNotifyEmail).trim(),
                subject: `🔔 New NYNTH sale: ${naira(orderData.total)}${tickets.length ? " · " + tickets.length + " ticket" + (tickets.length === 1 ? "" : "s") : ""} - ${customer.firstName || "Customer"}`,
                html: buildAdminAlertHtml(orderData, orderId, reference, settings),
            }).then((result) => (result && result.id ? "admin" : "skipped")),
        );
    }

    const results = await Promise.allSettled(notifications);
    const delivered = results.filter((r) => r.status === "fulfilled").map((r) => r.value);

    const update = { updated_at: admin.firestore.FieldValue.serverTimestamp() };
    if (delivered.includes("customer")) update.customer_confirmation_sent_at = admin.firestore.FieldValue.serverTimestamp();
    if (delivered.includes("admin")) update.admin_notification_sent_at = admin.firestore.FieldValue.serverTimestamp();
    await orderRef.update(update).catch(() => {});
}

// 3. Initialize Payment (Redirect Flow)
exports.initializePayment = onCall(
    {
        secrets: ["PAYSTACK_SECRET_KEY"],
        cors: true // Explicitly enable CORS for local development
    },
    async (request) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        const { amount, email, metadata } = request.data;

        if (!amount || !email) {
            throw new Error("Missing required payment details (amount or email)");
        }

        try {
            const response = await fetch("https://api.paystack.co/transaction/initialize", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${secret}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: Math.round(amount * 100), // convert to kobo
                    email,
                    metadata,
                    // Paystack will use the callback_url from settings or you can pass it here
                    callback_url: `${request.rawRequest?.headers?.origin || 'https://nynth.com'}/thank-you`,
                }),
            });

            const data = await response.json();

            if (!data.status) {
                console.error("Paystack Init Error:", data.message);
                throw new Error(data.message || "Failed to initialize payment");
            }

            return {
                authorization_url: data.data.authorization_url,
                reference: data.data.reference,
            };
        } catch (error) {
            console.error("Initialize Payment Error:", error);
            throw new Error(error.message || "Internal server error during payment initialization");
        }
    }
);

// 4. Send Bulk Email via Resend
exports.sendBulkEmail = onCall(
    { cors: true },
    async (request) => {
        if (!request.auth) {
            throw new Error("Unauthorized");
        }

        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            throw new Error("Forbidden: Admin access required");
        }

        const { emails, subject, body } = request.data;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            throw new Error("No recipients provided");
        }
        if (!subject || !body) {
            throw new Error("Subject and body are required");
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            throw new Error("Resend API key not configured");
        }

        try {
            const results = await Promise.allSettled(
                emails.map(async (email) => {
                    const response = await fetch("https://api.resend.com/emails", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${resendApiKey}`,
                        },
                        body: JSON.stringify({
                            from: "Nynth <onboarding@resend.dev>",
                            to: email,
                            subject: subject,
                            html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
                        }),
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || "Failed to send email");
                    }
                    return response.json();
                })
            );

            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            return { success: true, sent: successful, failed };
        } catch (error) {
            console.error("Bulk email error:", error);
            throw new Error(`Failed to send emails: ${error.message}`);
        }
    }
);

// 5. Google Analytics 4 Data API Integration
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

/**
 * Fetches analytics data from Google Analytics 4
 * Requires: GA_PROPERTY_ID and GA_SERVICE_ACCOUNT_KEY (base64 encoded JSON) in environment
 */
exports.getGA4Analytics = onCall(
    { cors: true },
    async (request) => {
        // Only allow admins to fetch analytics
        if (!request.auth || !request.auth.token.email) {
            throw new Error("Unauthorized access to analytics");
        }

        // Check if user is an admin in Firestore
        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            throw new Error("Forbidden: Admin access required");
        }

        const propertyId = process.env.VITE_GA_PROPERTY_ID || request.data.propertyId;
        const serviceAccountKeyB64 = process.env.GA_SERVICE_ACCOUNT_KEY;

        if (!propertyId || !serviceAccountKeyB64) {
            console.warn("GA4 Analytics not configured. Returning empty data.");
            return {
                status: 'unconfigured',
                message: 'Google Analytics Property ID or Service Account Key is missing.',
                metrics: {}
            };
        }

        try {
            const serviceAccountKey = JSON.parse(Buffer.from(serviceAccountKeyB64, 'base64').toString());
            const analyticsDataClient = new BetaAnalyticsDataClient({
                credentials: serviceAccountKey,
            });

            const [response] = await analyticsDataClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [
                    { startDate: '30daysAgo', endDate: 'today' },
                ],
                dimensions: [
                    { name: 'date' },
                ],
                metrics: [
                    { name: 'activeUsers' },
                    { name: 'screenPageViews' },
                    { name: 'sessions' },
                ],
            });

            // Process results into a more frontend-friendly format
            const metricsByDate = {};
            let totalVisits = 0;
            let totalViews = 0;

            response.rows.forEach(row => {
                const date = row.dimensionValues[0].value; // YYYYMMDD
                const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
                
                metricsByDate[formattedDate] = {
                    users: parseInt(row.metricValues[0].value),
                    views: parseInt(row.metricValues[1].value),
                    sessions: parseInt(row.metricValues[2].value)
                };

                totalVisits += parseInt(row.metricValues[0].value);
                totalViews += parseInt(row.metricValues[1].value);
            });

            return {
                status: 'success',
                totalVisits,
                totalViews,
                metricsByDate,
                rawResponse: response // For debugging if needed
            };
        } catch (error) {
            console.error("GA4 Analytics Fetch Error:", error);
            throw new Error(`Failed to fetch GA4 analytics: ${error.message}`);
        }
    }
);
