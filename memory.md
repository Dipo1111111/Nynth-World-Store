# Memory — Post-Purchase Flow: Emails, Admin Alerts, Real-Time Order Updates

Last updated: 2026-09-11

## Recurring context

Durable facts carried across sessions — update in place, never drop:

- **Stack**: React 18 + Vite + Tailwind CSS v4 + react-router-dom v7. Frontend lives in `frontend/nynth-ecom`. Firebase (Firestore, Auth, Storage). Paystack for payments (kept only `onSuccess` handler, removed legacy `callback`). Cloud Functions at `frontend/nynth-ecom/functions` (Firebase project `nynth-world`, region `us-central1, via `setGlobalOptions`).
- **Settings source of truth**: Firestore doc `settings/site_config`, read via `fetchSettings()` in `src/api/firebaseFunctions.js`. Frontend `settings` state is defaults until fetched. Write via `updateSettings()`. `support_email` also serves as the admin sale-alert recipient.
- **Firestore collections**: `settings/site_config`, `products`, `orders`, `discount_codes`, `subscribers`, `users` (admin role), `mail` (Track Email extension).
- **Key files**: `src/pages/admin/Settings.jsx` (admin settings), `src/context/SettingsContext.jsx` (public settings consumption), `src/pages/Checkout.jsx` (own sticky header; computes real shipping per Lagos/Abuja/Interstate), `src/data/locationData.js` (shipping data + `disabled_locations`), `src/api/firebaseFunctions.js`, `src/pages/OurStory.jsx` (public story page — its fallback defaults must mirror `STORY_DEFAULTS` in Settings.jsx), `src/pages/admin/Orders.jsx` (realtime order table), `src/pages/ThankYou.jsx` (post-purchase celebration), `functions/index.js` (Paystack webhook + Resend email helpers).
- **Stylesheets**: both `src/index.css` and `src/styles/globals.css` are imported in `main.jsx`. `.admin-settings-form` class on the Settings form is used by the Safari no-zoom CSS rule.
- **Payments**: verified ONLY server-side by the `paystackWebhook` Cloud Function. Client `verifyOrderPayment` is deprecated and just returns true; orders sit at `payment_status: "pending"` until the webhook marks them `paid` + `order_status: "confirmed"` and decrements stock. The webhook validates the `x-paystack-signature` HMAC against `PAYSTACK_SECRET_KEY`, so Paystack must post to `https://us-central1-nynth-world.cloudfunctions.net/paystackWebhook`.
- **Transactional email**: sent from the webhook via Resend HTTP API (`fetch`), fire-and-forget (failures logged, never fail the webhook). Neither the customer confirmation nor the new-order flow works until `RESEND_API_KEY` is set.
- **Operational notes**:
  - Google sign-in would need `nynthworld.com` added to Firebase Console → Authentication → Authorized domains; owner hid it instead.
  - Firestore rules for `products` are `allow write: if true`; `orders` allow admin read/update + guest create (drives the realtime admin Orders subscription). Stock decrement validated in the webhook transaction.
  - Contact page address is hardcoded, not read from Firestore.
  - Official email @nynthworld.com requires external email hosting (not set up). Resend test sending only works from `onboarding@resend.dev` to the account owner until a verified domain is added in Resend.
  - `src/admin/AdminDashboard.jsx` and `src/admin/sections/Orders.jsx` are empty dead files — the real admin dashboard is `src/pages/admin/AdminDashboard.jsx`.
- **Dev/build**: `npm run build` passes. Full-repo ESLint has many pre-existing errors across files (unused vars etc.) — do not treat as regression. `PaymentStatusDropdown` in Orders.jsx takes `({ status, onStatusChange })` — do NOT pass `orderId` (would trip the file's `no-unused-vars` eslint rule).

## What was built

Session focus: founder reported the admin panel didn't show newer test orders, emails weren't fancy (only Paystack's own notifications), and wanted customers to "feel something" after purchase plus a new-sale alert for nynthworld@gmail.com.

1. **Webhook emails + admin alert** (`functions/index.js`):
   - Added `naira`, `esc`, `orderItemsRows`, `emailShell`, `getSiteSettings`, `sendResendEmail`, `buildCustomerConfirmationHtml` (customer confirmation with item images, delivery details, payment summary), `buildAdminAlertHtml` (new-sale alert with total, customer, address, items, totals), and `sendOrderNotifications`.
   - `paystackWebhook`: marks paid (`paid_at`, `payment_reference`, `payment_gateway`), decrements stock, then fire-and-forget sends the fancy customer email + admin alert via `sendOrderNotifications`, stamping `customer_confirmation_sent_at`/`admin_notification_sent_at` only when Resend actually returned an `id`. A new `orderWasProcessed` flag ensures a duplicate webhook delivery (already-paid order) does NOT re-send notifications. Secrets list now includes `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`. Admin recipient = `settings.support_email || process.env.ADMIN_NOTIFY_EMAIL || "nynthworld@gmail.com"`. Used `metadata?.orderId` (optional chaining).
2. **Real-time admin order tracking** (`src/pages/admin/Orders.jsx` + `src/api/firebaseFunctions.js`):
   - Added `subscribeOrders` (`onSnapshot`, `orderBy("created_at","desc")`), `fetchOrder`, `updateOrderPaymentStatus`; removed the old paid-only hard filter so ALL orders (pending included) appear instantly.
   - Payment status now shows as badge + dropdown with a filter (paid / pending / delivered / failed / cancelled / all). Quick-edit dropdown in the expanded order row and mobile card calls `updateOrderPaymentStatus`. Summary counts paid revenue vs `unpaidOrders`. CSV export includes Payment Status. Expanded row colSpan updated 6→7.
3. **Celebration page** (`src/pages/ThankYou.jsx`): rewritten to read `ref`, `reference`, `trxref` (handles both Paystack popup and redirect flows), fires confetti, shows big "CONGRATULATIONS! Welcome to NYNTH World", clears the cart once (guarded by a `cleared` ref), auto-redirects to `/shop` after an 8s SVG countdown ring, plus a manual "Go to shop now" button.
4. **Checkout popup-closed flow** (`src/pages/Checkout.jsx`): `onClose` now polls the order up to 6 attempts × 2s via `fetchOrder`; if found paid → clear cart + redirect to ThankYou; otherwise shows the "Payment window closed" error toast.

## Decisions made

- Emails go through Resend HTTP API in the webhook (same pattern as existing `sendBulkEmail`) rather than a transactional extension or client-side calls (client calls can't read/write order state safely, and `mail` collection extension wasn't configured for HTML order emails).
- Email sending is fire-and-forget from the webhook so a Resend outage can never fail a Paystack callback (order is already paid by then).
- Admin alert + customer confirmation share the same onboard-black/emerald email shell to keep brand consistency.
- `onClose` polling uses `fetchOrder` (a plain `getDoc`) so it doesn't depend on realtime rules or admin auth — guests can poll their own order.
- Sent-confirmation flags are only stamped when Resend returns an `id` (skip when `RESEND_API_KEY` unset) so the admin dashboard timestamps reflect real deliveries, not skips.

## Problems solved

- "Admin panel didn't show my test orders" — Orders page fetched once on mount and filtered to paid-only orders; older/pending test orders never rendered. Fixed with a realtime subscription + dropped paid-only filter.
- "Emails aren't fancy / I only got Paystack's" — the webhook's email step had been removed (comment: "REMOVED: Requires Blaze Plan") and nothing else sent confirmation mail. Re-added via Resend in the webhook (Resend is usable on Spark; the old note was wrong).
- "Customer should feel something" — ThankYou rewritten with confetti + congratulations + welcome branding + auto-return to shop; checkout honors the case where customers pay and close the popup before redirect.
- Duplicate webhook deliveries previously re-triggered notification paths; now guarded by `orderWasProcessed`. Notifications also no longer stamp "sent" when skipped for a missing API key.

## Current state

- `node --check functions/index.js` ✓, frontend `npm run build` ✓. ESLint on changed files shows only pre-existing errors (verified against `HEAD` via `git stash`); the only new lint error introduced this session (`orderId` unused in `PaymentStatusDropdown`) was fixed.
- Working tree still contains the user's unrelated uncommitted deletions (`.agent/`, `claude/skills`) and two untracked PDFs (CityRiders rate cards) — left uncommitted intentionally.
- NOT deployed: functions + secrets + Paystack webhook URL are still to be set up (see next steps).

## Next session starts with

Deployment checklist (founder must run, or agent runs with credentials):
1. Set function secrets: `firebase functions:secrets:set RESEND_API_KEY`, and optionally `EMAIL_FROM` (default `NYNTH WORLD <onboarding@resend.dev>`) and `ADMIN_NOTIFY_EMAIL` (default `nynthworld@gmail.com`). Fire in the `functions/` directory.
2. Deploy: `firebase deploy --only functions` (project `nynth-world`).
3. In the Paystack dashboard → Settings → Webhooks, set the webhook URL to `https://us-central1-nynth-world.cloudfunctions.net/paystackWebhook` (the signature check requires Paystack to send `x-paystack-signature`).
4. In Resend: add a verified sending domain if emails must reach arbitrary customer inboxes; until then `onboarding@resend.dev` only delivers to the account owner. Verify the `mail` collection / Track Email extension isn't double-sending.
5. Live test: make a small paid order → expect (a) instant pending order in admin, (b) webhook flips it to paid + confirms, (c) customer gets the fancy confirmation, (d) founder gets the "🔔 New NYNTH sale" alert.
6. Verify admin can quick-set payment status from the dropdown and it persists + flows to the CSV/filters.

## Open questions

- Resend domain: does the founder want to verify a custom domain (e.g. `@nynthworld.com`) so confirmation/admin emails land in arbitrary inboxes, or keep `onboarding@resend.dev` testing?
- Admin sale-alert recipient: `settings/site_config.support_email` takes priority over `ADMIN_NOTIFY_EMAIL`/default — confirm `support_email` is set to the address that should receive new-sale alerts.
- Dead `placeholder` attributes remain on the Our Story inputs (never visible now that fields are pre-filled) — fine to remove or leave.
- The user's uncommitted deletions (`.agent/`, `claude/skills`) — confirm they're intentional before matching commit.