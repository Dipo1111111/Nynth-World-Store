# Memory — Nynth-World Store (Newman fix batch + checkout restructure shipped)

Last updated: 2026-10-07 (session complete; follow-up batch in progress)

## Follow-up batch (2026-10-07 late, BUILT, not pushed, gates green)

- Done: removed JOHN/DOE name placeholders AND the JOHN@EXAMPLE.COM email placeholder (labels First Name/Last Name/Email kept); removed the Preferred Delivery Date/Time picker box from section 3 and the now-unused `minDeliveryDate` const; replaced it with one small gray note: "Prefer a certain delivery date or time? Just add it to your special instructions above (optional)."; Special Instructions placeholder now leads with "DELIVERY NOTES, PREFERRED DATE, ...". form keys `deliveryDate`/`deliveryTimeWindow` kept (stay "", email templates skip the pref line when empty). Files: Checkout.jsx only. Newman's philosophy quote: "Easy, clean, minimal, but exceptional."

## Recurring context

- **People (PERMANENT):** Newman (phone 09137207918) is founder/admin/owner. "Newman says X" = direct owner directive. Owner alert inboxes: newmanyange14@gmail.com, nynthworld@gmail.com, primebusiness54@gmail.com. An external developer (pobbagency@gmail.com) builds a separate admin tool against this DB (collections/drops + waitlist emails); he has direct SQL access (created the `collections` table himself). Newman relays requirements as WhatsApp screenshots from a "WEBSITE OBS SURVEY DEPARTMENT" group, often including competitor/reference-site screenshots mixed with our own.
- **Live site:** `https://www.nynthworld.com` (Vercel, auto-deploy on push to `main`). Verify a deploy by grepping the served bundle for a string UNIQUE to the change (`curl -s https://www.nynthworld.com/ | grep -o 'assets/index-[^"]*\.js'` then fetch it). Generic strings like "Contact Information" give false positives; use markers like "Zip Code (Optional)". Deploy takes ~1-3 min, poll.
- **Live request tracing (launch-day gold):** Management API unified logs: `GET "https://api.supabase.com/v1/projects/cybcooychgicsnjeummo/analytics/endpoints/logs?sql=<urlencoded>&iso_timestamp_start=...Z&iso_timestamp_end=...Z"` with Bearer token from `.secrets/supabase.env`. Table `logs`, filter `source`: `edge_logs` = per-HTTP-request rows via `log_attributes['request.path']`, `['request.method']`, `['request.search']`, `['response.status_code']`. The old `logs.all` endpoint is removed. Statement bodies/params are NOT logged. `postgrest_logs` is heartbeat noise.
- **Supabase MCP is connected to the WRONG project** (`Atomic Xp` llwlgzujsyxlseiqiwsp); it lists nynth-world but SQL runs against the wrong DB (verified: `discount_codes` count = 0). Use the Management API instead: `curl -X POST "https://api.supabase.com/v1/projects/cybcooychgicsnjeummo/database/query" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"query": "..."}'` with token from `frontend/nynth-ecom/.secrets/supabase.env`. `.env.local` must NOT be shell-sourced (line 9 breaks zsh); parse key=value in python instead.
- **Stale-tab gotcha (PERMANENT lesson):** after any push, users keep running the pre-fix JS in old tabs. Hard refresh (Cmd+Shift+R) first when someone reports "still broken"; verify server side before changing code.
- **Stack:** React 18 + Vite + Tailwind v4 + react-router-dom v7. Frontend in `frontend/nynth-ecom`. Backend fully Supabase (project `nynth-world`, ref `cybcooychgicsnjeummo`, eu-west-1). `src/api/firebaseFunctions.js` is a one-line alias over `supabaseFunctions.js`. Paystack payments, Resend emails, Cloudinary images, Vercel hosting. Footer is rendered per-page (imported by ~19 page components; Lookbook and LockPage have none).
- **Standing user rules (never violate):** no em dashes anywhere (copy, chat, code). Zero `style={{}}` except dnd-kit in Products.jsx. Consume `src/components/ui/` primitives. No new npm deps without explicit approval. Never commit/push unless user says "push". Gate before finishing: `npm run lint` (zero warnings), `npm test`, `npm run test:edge`, `npm run build`, `node scripts/verify-dist.mjs`, `npx impeccable detect --json` on touched UI.
- **Newman triage rules (2026-10-07):** do only what he explicitly asked; do not ask him questions to clarify (owner's instruction); AB test layout idea and abandoned-checkout follow-up reminder system were explicitly ignored; competitor-screenshot redesigns get deferred when he signals "later".
- **Secrets (locations only, never values):** `frontend/nynth-ecom/.secrets/` (gitignored): `supabase.env` (SUPABASE_ACCESS_TOKEN), `paystack.env` (TEST+LIVE keys), `google-oauth.env`, `resend.env` (RESEND_API_KEY + EMAIL_FROM; opened in TextEdit for Newman to copy when sharing with the admin-tool dev). `frontend/nynth-ecom/.env.local` (gitignored) holds live keys with test fallbacks. Server secrets on Supabase project: RESEND_API_KEY, EMAIL_FROM, ADMIN_NOTIFY_EMAIL, PAYSTACK_SECRET_KEY, SUPABASE_* keys.
- **Orders model:** `is_test` stamped from Paystack `domain` at verify/webhook. Frontend derives test-mode from `VITE_PAYSTACK_PUBLIC_KEY` starting with `pk_test_`. Test traffic excluded from metrics. Order `customer` jsonb stores the ENTIRE checkout form via `{...form}` spread, so new form fields (specialInstructions, zip) persist with no schema change.
- **Delivery / free delivery:** ALL non-ticket products `deliveryFeeEnabled=false`, `settings.free_delivery_enabled=true`, every order ships free. Page-top marquee + Shop strip removed 2026-09-27 (commit `79cf192`). Cart/Checkout/ProductDetail free-delivery lines stay.
- **Discount codes:** table `discount_codes`; guest validation via SECURITY DEFINER RPC `public.validate_discount(p_code)` (anon+authenticated). Pattern to copy for any future shopper-facing check (do NOT loosen RLS to let anon read secret-ish tables). Code `MEMBER` (20%) expired 2026-10-04.
- **Lock/drop model:** site-wide lock settings in `settings.data` (`lock_page_enabled`, `lock_epoch`, `lock_password`, `lock_timer_*`, `launch_date`); admin Settings edits them. `collections` table (id bigint identity BY DEFAULT, name, slug, launch_date timestamptz, status text, password text, created_at) written by the external admin tool; `status='live'` (exact lowercase) marks the active drop. Storefront `fetchLiveCollection()` reads it (newest id) and falls back to settings when none. RLS: `collections_public_read` (select using true, password included = parity with old settings.lock_password) + `collections_admin_write` (is_admin()). `lock_epoch` force-relock must stay intact. Lock unlock is client-side compare + localStorage (`nynth_site_unlocked`, `nynth_lock_epoch`). No FK between collections and subscribers. Table still EMPTY as of 2026-10-07.
- **subscribers model:** `id text` (default `('sub-' || gen_random_uuid()::text)`; 171 pre-existing rows backfilled with id = email), `email text unique`, `source text` ('waitlist'|'newsletter'|'popup'|'footer'), `collection_id text` (stores collections.id as a string; send stringified), `notified boolean`, `created_at`. RLS: insert anyone, read/write admin only (keep it that way). Admin Subscribers page counts off `source`.
- **Price display convention (since 2026-10-07):** whole naira only, plain `toLocaleString()`, NO decimals, NO foreign currency line. `src/utils/currency.js` (foreignPriceLabel, NGN_PER_USD/GBP) is now an unused leftover file; renders were removed from ProductCard + ProductDetail per Newman.
- **Checkout structure (since 2026-10-07):** left column = numbered collapsible sections via local `CheckoutSection` component in `Checkout.jsx` (1 Contact Information, 2 Delivery Details, 3 Delivery Method), `openSections` state, force-open on submit. Form KEYS unchanged (`address`, `city`, `state`, `zip`, `specialInstructions`) even where labels changed (Street Address, Zip Code (Optional), Phone Number). Selects use relative-wrapper + ChevronDown (the4 appearance-none ones); house `.focus-ring` class on interactive controls.
- **Key files:** `src/pages/Checkout.jsx` (CheckoutSection + sections), `src/api/supabaseFunctions.js`, `src/context/SettingsContext.jsx` (liveCollection), `src/pages/LockPage.jsx`, `src/components/home/Header.jsx` (navLinks incl. NEWSLETTER hash link), `src/components/home/Footer.jsx` (newsletter section id="newsletter", phone/address), `src/components/products/ProductCard.jsx`, `src/pages/ProductDetail.jsx`, `src/pages/Shop.jsx`, `src/pages/admin/Settings.jsx`, `src/App.jsx`, `src/context/CartContext.jsx`, `src/utils/shippingRates.js`, `supabase/schema.sql`, `scripts/verify-dist.mjs`.

## What was built (2026-10-07, both batches pushed and live)

**Batch 1 (commit `96f39f3`, live-verified):**
- Removed the "APPROX $x / £y" line from ProductCard + ProductDetail (both orientations) and removed `.00` price decimals (dropped `minimumFractionDigits: 2`, compare-at included).
- Checkout: state defaults to `SELECT STATE` placeholder (was Abuja), `PLEASE SELECT YOUR STATE` validation, shipping fee 0 until state chosen, ChevronDown arrows on all 4 bare selects.
- Affordances: discount code boxed with solid black APPLY; every underlined checkout input/select got `hover:border-black/40` + `.focus-ring` (8 via replaceAll).
- Header `NEWSLETTER` nav item (`to: "#newsletter"`, `<a>` branch, desktop `hidden lg:block`, mobile closes menu); Footer newsletter section got `id="newsletter"` + `scroll-mt-24`; footer shows phone (tel: link) + location above copyright.

**Batch 2 (commit `fcacd53`, live-verified):**
- Checkout restructured into numbered collapsible sections per Newman's reference screenshots ("Simpler terms"): section 1 Contact Information (names/email/phone + NEW Special Instructions textarea 0/500 counter), section 2 Delivery Details (State*|City grid, Street Address rename, NEW Zip Code using pre-existing unrendered `form.zip`), section 3 Delivery Method (Lagos note / home+park radios / no-state hint, Preferred Delivery Date box, NEW View Shipping Policy Link to /shipping). Required labels got `*`; page h1 now sr-only; Order Summary shipping fallback says "Select state" before "Select area".

## Decisions made

- Labels can change but form keys never do (orders/customer jsonb and downstream admin views depend on them; new fields ride the `{...form}` spread).
- Newsletter ask satisfied with a header anchor button pointing at the pre-existing footer form (footer form already existed; the button was the missing entry point).
- Competitor-style extras NOT added: no Country field, no name field on newsletter (would need a subscribers column = DB change, which Newman deferred), no prices on delivery-method radios (summary carries the fee; avoids free-delivery inconsistency).
- `react-hooks/set-state-in-effect` rejects `Promise.allSettled` inside an effect-called loader; sequential try/catch shape passes (SettingsContext pattern).

## Problems solved

- Deploy verification: "Contact Information" matched the OLD bundle (false positive); unique markers ("SELECT STATE", "Zip Code (Optional)" + "View Shipping Policy") confirmed the real deploys (`index-Bo3wKQsy.js`, `index-Bubmhr5R.js`).
- ProductCard JSX splice left an extra `</div>` (lint parse error "Adjacent JSX elements") - fixed by keeping the ADD TO BAG button inside the info div.
- Lint rule conflict in SettingsContext solved by sequential try/catch loader shape.

## Current state

- Working tree CLEAN; both batches pushed: `96f39f3` + `dfee50b` (fix batch) and `fcacd53` + `d577618` (checkout restructure). Both deploys live-verified. Gates green at push time (lint zero, 86 vitest, 19 edge, build + verify-dist, impeccable []).
- Live site now serves: whole-naira prices with no currency line, SELECT STATE checkout with arrows and numbered collapsible sections, special instructions + zip fields, NEWSLETTER header button, footer phone/location.

## Next session starts with

1. Run `/remember restore`.
2. Get Newman/dev confirmation the new checkout works end to end on a real order (sections collapse, special instructions land in `orders.customer`).
3. Still open: external dev's end-to-end test once he creates a `status='live'` collection row; `MEMBER` discount code expired 2026-10-04 (confirm and clean up); zone-disable delivery-fee button (deferred); server-side amount recompute in `initialize-payment` (hardening); `src/utils/currency.js` is dead code (delete only if Newman agrees).
4. Deferred by Newman: any further checkout redesign beyond what shipped; AB test layout; abandoned-checkout follow-up reminder emails.

## Open questions

- Whether the dev's tool reads collections via anon key (sees all rows incl. passwords) or direct SQL; what other `status` values he uses besides 'live'.
- Currency viewer rates question is moot unless Newman asks for the $/£ line back (file kept but unused).
