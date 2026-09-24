# Memory — Nynth-World Store (admin craft + email + tickets session)

Last updated: 2026-09-24, mid session (Newman shop-page feedback)

## Recurring context

- **People (PERMANENT):** Newman (phone 09137207918) is founder/admin/owner. "Newman says X" = direct owner directive. Owner alert inboxes: newmanyange14@gmail.com, nynthworld@gmail.com, primebusiness54@gmail.com.
- **Stack:** React 18 + Vite + Tailwind v4 + react-router-dom v7. Frontend in `frontend/nynth-ecom`. Backend fully Supabase (project `nynth-world`, ref `cybcooychgicsnjeummo`, eu-west-1). `src/api/firebaseFunctions.js` is a one-line alias over `supabaseFunctions.js`. Paystack payments, Resend emails, Cloudinary images, Vercel hosting.
- **Standing user rules (never violate):** no em dashes anywhere (copy, chat, code). Zero `style={{}}` except dnd-kit in Products.jsx. Consume `src/components/ui/` primitives. No new npm deps without explicit approval (exception granted this session: `react-qr-code` for ticket passes). Never commit/push unless user says "push". Gate before finishing: `npm run lint` (zero warnings), `npm test`, `npm run test:edge`, `npm run build`, `node scripts/verify-dist.mjs`, `impeccable detect --json` on touched UI.
- **MCP:** `~/.config/opencode/opencode.jsonc` has `opencode-supabase` plugin + remote Supabase MCP, enabled. Verified present 2026-09-23. Next session can drive DB via MCP.
- **Secrets (locations only, never values):** `frontend/nynth-ecom/.secrets/` (gitignored): `supabase.env`, `paystack.env` (TEST+LIVE keys), `google-oauth.env`, `resend.env`. Server secrets on Supabase project: RESEND_API_KEY, EMAIL_FROM (`NYNTH WORLD <hello@nynthworld.com>`), ADMIN_NOTIFY_EMAIL (3 owners, comma list), PAYSTACK_SECRET_KEY, SUPABASE_* keys. Paystack still TEST mode keys server side at last check.
- **Email:** domain nynthworld.com verified on Resend (eu-west-1, 2026-09-23). All outbound from hello@nynthworld.com; any @nynthworld.com sender works, no extra DNS. Buyer gets confirmation; all 3 owners get sale alerts.
- **Orders model:** `is_test` stamped from Paystack `domain` field at verify/webhook (fixed this session; was secret-prefix, caused mislabels). Frontend reads `isTest` from `is_test`. Test traffic excluded from all metrics. Paid test rows kept: 6 existed, 3 live-key ones flipped to live, 25 pending test rows deleted.
- **Ticket model:** products with `category === "tickets"` need eventDateTime + venue. Codes `NWT-XXXXXXXX` minted at payment finalize. Ticket objects carry `used`/`used_at`. Pass pages at `/ticket/:code` (public view, admin-only admit). Door Check-In at `/admin/check-in`.
- **Storefront visibility rule:** `isLiveProduct` in supabaseFunctions.js. Hidden or exact-zero-stock never lists; null stock stays visible.
- **Key files:** `src/App.jsx` (routes), `src/components/admin/AdminLayout.jsx` (nav, `.admin-app` scope, title h1), `src/index.css` (tokens, `.admin-app`, keyframes), `supabase/functions/` now 6 fns (added `ticket-lookup`), `scripts/verify-dist.mjs` + `scripts/smoke-live.mjs`, `src/utils/edge-cases.test.js`, `src/pages/admin/CheckIn.jsx`, `src/pages/TicketPass.jsx`, `src/pages/OrderDetails.jsx`.

## What was built (this session)

- **Shop page admin controls (Newman feedback, 2026-09-24):** new settings `shop_category_order` (array), `tickets_band_position` (top/bottom/hidden), `tickets_band_scope` (all/tickets_only), `tickets_band_limit` (1-6). Admin Settings > "Shop page" section with category tab reorder/hide/restore + bold tickets band placement/scope/count. Shop.jsx reads `src/utils/shopConfig.js` (single source of truth). Desktop + mobile tabs now use the same admin order.
- **Ticket emails carry event info:** `paystack-verify` + `paystack-webhook` now send buyer cards per pass with event title, WAT date/time, venue, price, code, "Open your pass" link; admin items line appends event date + venue for ticket items. HTML-escaped.
- **Tests:** 62 Vitest (added shopConfig cases), 11 Deno (added ticket-email-event-detail case in paystack-verify). Gate green: lint 0/0, 62 Vitest, 11 Deno, build, verify-dist. impeccable not installed this env.
- **Ticket flow audit + full fix (2026-09-24):** root cause of Newman's repeat complaint was twofold: (a) deployed paystack fns were stale (pre event-details), redeployed; (b) guests can never read orders via RLS, so thank-you/order pages showed nothing. New `order-lookup` edge fn (orderId + Paystack ref, no PII) backs guest reads on ThankYou + new public `/order/:id?ref=` route (linked from buyer email). Finalize hardened: init stamps payment_reference, verify accepts orderId fallback + rejects ref/order mismatch, paid transition is pending-conditional (no double mint/stock/email). Door: CheckIn now via ticket-lookup with test/unpaid/cancelled states + event date/venue; TicketPass mirrors those states. Tickets-only email copy fixed, admin ship-to line conditional. Products blocks zero-stock tickets with explicit message + hint. Checkout Paystack metadata carries event/venue/price. Email builders centralized in `_shared/email.ts`. Gate: lint 0, 64 Vitest, 19 Deno, build, verify-dist. Functions live: paystack-verify v21, webhook v19, initialize v12, ticket-lookup v2, order-lookup v1.
- **Paystack cutover:** still TEST mode. Newman's ticket examples were a different vendor; no seat/row/QR-format requirement was requested yet.

## What was built (earlier session)

- **Black Atelier fixes:** all admin panels/modals true black `#0a0a0a`; tokens `--card/--popover` 0.12, `--secondary/--muted/--accent` 0.14; toolbar/segmented/table/select/tooltip black.
- **Dashboard redesign:** killed 4-card grid; editorial Net sales numeral + ruled counts + segmented commander + asymmetric ledger/doughnut/top-products.
- **Orders touch-up:** weight unification, SECTION_LABEL everywhere, 44px targets, compact dropdown, control heights.
- **Settings UX:** sticky section nav, header dirty pill, black save bar, back-to-top button, toggle gaps.
- **Error screens:** rebuilt NotFound, ErrorBoundary (stale-chunk aware + retry), static 404 in brand language.
- **Guardrails:** `verify-dist`, `smoke-live`, `build.manifest`, CI step, adminRoutes tests (now 9 routes incl. CheckIn).
- **Resend end to end:** domain verified via Vercel DNS, sender hello@, owner alerts to 3 inboxes (test-proven), branded buyer + rich admin emails, multi-recipient support.
- **Ticketing:** Door Check-In page + `markTicketUsed` backend + tests; public TicketPass pages with QR (`react-qr-code`); `ticket-lookup` edge fn; OrderDetails page + Account links; email pass links; "QR" copy corrected to codes; visibility rule hides hidden/sold-out everywhere + tests.
- **Per-product delivery toggle:** `deliveryFeeEnabled` in product modal (tickets default off), `cartNeedsShipping` checkout rule + tests + contract test.
- **Modal centering:** animation transform release + `createPortal` for Products modal; scroll hardening on all admin modals.
- **Status pipeline:** `confirmed` added to StatusDropdown (was mislabeled Pending); pulsing needs-action dots on paid unfulfilled rows.
- **Zoom:** lightbox scales both axes 1-4x; pinch/drag-pan/double-tap on mobile; gallery touch targets 36-44px.
- **WhatsApp:** green `#25D366` "Chat with us" pill, storefront only.
- **Em dash sweep:** 55+ removed, zero left in source/functions/docs. Standing ban in place.
- **Edge harness:** `src/utils/edge-cases.test.js` (14 fast cases). Suite now 56 Vitest + 10 Deno, all green.
- **Commits pushed:** d63099e, 8d3a13b, aaf5cb4, d37991c, 4715930, 6dfcce8, 358de1e, 01315e8, 36652e1, 19da5b3, 3ff971b, eb947b0, b58a152, 4b01d5b, a455ccc, 8926138.

## Problems solved

- Vercel catch-all served index.html for missing chunks (MIME crash); fixed with asset-first rewrite + 404.
- is_test mislabeling from disagreeing frontend/server keys; now stamped from Paystack `domain`.
- Fixed-position breakage from persistent animation transform; plus portal for Products modal.
- Lightbox zoom dead from height-locked object-contain scaling.
- Recommendations/search listed hidden and sold-out products.

## Current state

- Everything listed above is pushed to `main` (through `8926138`) and live functions redeployed (paystack-verify, paystack-webhook, ticket-lookup). Vercel auto-deploys storefront.
- Gate green: lint 0/0, 62 Vitest, 11 Deno, build, verify-dist, detector clean.

## Next session starts with

1. Run `/remember restore`.
2. Security hardening pass (user-queued): RLS audit via Supabase MCP, secret hygiene, webhook/no-JWT review.
3. Then: Products + Abandoned checkouts redesigns, Playwright e2e setup.

## Open questions

- BIMI logo for inbox avatar (needs trademark + cert; user interested, later).
- Paystack TEST vs LIVE cutover timing.
- Any further owner alert addresses to append.
- "Tickets part doesn't send anything related to the ticket or event" recurred after the email fix: causes were stale deployed functions (fixed by redeploy) and guest RLS reads (fixed via order-lookup + public order route). Both closed 2026-09-24.
