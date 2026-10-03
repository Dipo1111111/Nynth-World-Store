# Memory — Nynth-World Store (collections/drop integration for external admin tool)

Last updated: 2026-10-03 (session in progress)

## Recurring context

- **People (PERMANENT):** Newman (phone 09137207918) is founder/admin/owner. "Newman says X" = direct owner directive. Owner alert inboxes: newmanyange14@gmail.com, nynthworld@gmail.com, primebusiness54@gmail.com. An external developer (pobbagency@gmail.com) is building a separate admin tool against this DB (collections/drops + waitlist emails); he has direct SQL access to the project (he created the `collections` table himself).
- **Live site:** `https://www.nynthworld.com` (Vercel, auto-deploy on push to `main`). To confirm which build is live: `curl -s https://www.nynthworld.com/ | grep -o 'assets/index-[^"]*\.js'` then grep that bundle for a known string from the change.
- **Live request tracing (launch-day gold):** Management API unified logs: `GET "https://api.supabase.com/v1/projects/cybcooychgicsnjeummo/analytics/endpoints/logs?sql=<urlencoded>&iso_timestamp_start=...Z&iso_timestamp_end=...Z"` with Bearer token from `.secrets/supabase.env`. Table `logs`, filter `source`: `edge_logs` = per-HTTP-request rows via `log_attributes['request.path']`, `['request.method']`, `['request.search']`, `['response.status_code']`. The old `logs.all` endpoint is removed. Statement bodies/params are NOT logged. `postgrest_logs` is heartbeat noise.
- **Supabase MCP is connected to the WRONG project** (`Atomic Xp` llwlgzujsyxlseiqiwsp); it lists nynth-world but SQL runs against the wrong DB (verified: `discount_codes` count = 0). Use the Management API instead: `curl -X POST "https://api.supabase.com/v1/projects/cybcooychgicsnjeummo/database/query" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"query": "..."}'` with token from `frontend/nynth-ecom/.secrets/supabase.env`.
- **Stale-tab gotcha (PERMANENT lesson):** after any push, users keep running the pre-fix JS in old tabs. Hard refresh (Cmd+Shift+R) first when someone reports "still broken"; verify server side before changing code.
- **Stack:** React 18 + Vite + Tailwind v4 + react-router-dom v7. Frontend in `frontend/nynth-ecom`. Backend fully Supabase (project `nynth-world`, ref `cybcooychgicsnjeummo`, eu-west-1). `src/api/firebaseFunctions.js` is a one-line alias over `supabaseFunctions.js`. Paystack payments, Resend emails, Cloudinary images, Vercel hosting.
- **Standing user rules (never violate):** no em dashes anywhere (copy, chat, code). Zero `style={{}}` except dnd-kit in Products.jsx. Consume `src/components/ui/` primitives. No new npm deps without explicit approval. Never commit/push unless user says "push". Gate before finishing: `npm run lint` (zero warnings), `npm test`, `npm run test:edge`, `npm run build`, `node scripts/verify-dist.mjs`, `npx impeccable detect --json` on touched UI.
- **Secrets (locations only, never values):** `frontend/nynth-ecom/.secrets/` (gitignored): `supabase.env` (SUPABASE_ACCESS_TOKEN), `paystack.env` (TEST+LIVE keys), `google-oauth.env`, `resend.env` (RESEND_API_KEY + EMAIL_FROM; Newman may share this with the admin-tool dev on request). `frontend/nynth-ecom/.env.local` (gitignored) holds live keys with test fallbacks. Server secrets on Supabase project: RESEND_API_KEY, EMAIL_FROM, ADMIN_NOTIFY_EMAIL, PAYSTACK_SECRET_KEY, SUPABASE_* keys.
- **Orders model:** `is_test` stamped from Paystack `domain` at verify/webhook. Frontend derives test-mode from `VITE_PAYSTACK_PUBLIC_KEY` starting with `pk_test_`. Test traffic excluded from metrics.
- **Delivery/ free delivery:** ALL non-ticket products `deliveryFeeEnabled=false`, `settings.free_delivery_enabled=true`, every order ships free. Page-top marquee + Shop strip removed 2026-09-27 (commits `79cf192`, marquee off in DB). Cart/Checkout/ProductDetail free-delivery lines stay.
- **Discount codes:** table `discount_codes`; guest validation via SECURITY DEFINER RPC `public.validate_discount(p_code)` (anon+authenticated). Pattern to copy for any future shopper-facing check (do NOT loosen RLS to let anon read secret-ish tables).
- **Lock/drop model (as of 2026-10-03):** site-wide lock settings still live in `settings.data` (`lock_page_enabled`, `lock_epoch`, `lock_password`, `lock_timer_*`, `launch_date`); admin Settings page edits them. NEW: `collections` table (id bigint identity BY DEFAULT, name, slug, launch_date timestamptz, status text, password text, created_at) written by the external admin tool; `status='live'` marks the active drop. Storefront reads the live row (fetchLiveCollection) and falls back to settings when none. `lock_epoch` force-relock semantics must stay intact. Lock page unlock is client-side compare + localStorage (`nynth_site_unlocked`, `nynth_lock_epoch`).
- **subscribers model:** columns `id text`, `email text unique`, `source text` ('waitlist'|'newsletter'|'popup'|'footer'), `created_at`, NEW `collection_id text` (stores collections.id as a string; no FK because types differ), NEW `notified boolean`. RLS: insert anyone, read/write admin only (keep it that way). Admin Subscribers page counts off `source`.
- **Key files:** `src/api/supabaseFunctions.js`, `src/context/SettingsContext.jsx`, `src/pages/LockPage.jsx`, `src/components/home/Header.jsx`, `src/pages/Checkout.jsx`, `src/pages/Shop.jsx`, `src/pages/admin/DiscountCodes.jsx`, `src/pages/admin/Settings.jsx`, `src/App.jsx`, `src/context/CartContext.jsx`, `src/utils/shippingRates.js`, `supabase/schema.sql`, `supabase/functions/_shared/email.ts`, `scripts/verify-dist.mjs`.

## What was built (this session, 2026-10-03, IN PROGRESS)

- Applied RLS policies on the external dev's new `collections` table (live DB): `collections_public_read` (select using true) + `collections_admin_write` (is_admin()). RLS was enabled with zero policies, so anon reads returned nothing.
- Fixed `addSubscriber` in `supabaseFunctions.js`: it returned `true` but all three callers (LockPage, Footer, NewsletterPopup) read `{success, message}`; every waitlist/newsletter signup showed an error toast (and LockPage never reached /waitlist-confirmation) even though the row inserted. Now returns `{success:true, message:"ADDED"|"ALREADY_ADDED"}` / `{success:false, message}` and accepts a 3rd arg `collectionId` (stringified into `collection_id`).
- Added `fetchLiveCollection()` (collections where status='live', newest id, maybeSingle, null when none).
- SettingsContext: `liveCollection` state added, loaded in parallel with settings via `Promise.allSettled` in `refreshSettings`, exposed on context value (done).
- LockPage: consuming `liveCollection` for `launchDate` (countdown) - password override, waitlist `collection_id` pass, and effect deps still to finish.

## Decisions made

- Storefront falls back to `settings.launch_date` / `settings.lock_password` whenever no live collection row exists, so the site behaves exactly as today while `collections` is empty.
- Public SELECT on `collections` (password included) is parity with the old world where `settings.lock_password` was already world-readable via the settings table; treat collection passwords as shareable codes, not secrets. Flagged to the dev in the reply.
- `collections.id` (bigint) vs `subscribers.collection_id` (text) mismatch left as-is (no FK) to avoid breaking the dev's already-built tool; storefront always sends the id as a string.

## Problems solved

- Diagnosed why the admin tool's unlock flow could not work yet: lock page read launch_date/lock_password only from settings, and `collections` was unreadable via RLS (RLS on, zero policies).
- Found the addSubscriber return-shape mismatch that broke all three signup toasts/confirmation navigation (returned `true`, callers read `{success, message}`).
- **Live signup breaker found 2026-10-03:** `subscribers.id` is NOT NULL with NO default; addSubscriber never sends id. All 171 existing rows were backfilled on cutover day (2026-09-22) with id = the email address, so anon inserts since then fail 23502 (lock page, popup, footer, and the external admin tool alike). Fix: DB default `('sub-' || gen_random_uuid()::text)` (live + schema.sql) plus client-generated `sub-<ts>-<rand>` id in addSubscriber, mirroring the discount_codes precedent.

## Current state

- **All code done, gates green, NOT committed/pushed** (standing rule: wait for Newman to say "push"; Vercel auto-deploys on push to main). Gates run 2026-10-03: lint zero, vitest 86, test:edge 19, build + verify-dist OK, impeccable detect [] on LockPage/Header.
- Live DB changes (applied + verified by anon PostgREST round trip, temp rows cleaned up): `collections_public_read` + `collections_admin_write` policies; `subscribers.id` default `('sub-' || gen_random_uuid()::text)`. Verified both insert shapes return 201 with string collection_id stored.
- Code: `addSubscriber` returns `{success, message}` (fixes all three callers' toasts), sends client id `sub-<ts>-<rand>` and optional `collection_id` (stringified); `fetchLiveCollection()` added; SettingsContext loads/exposes `liveCollection` (sequential try/catch shape, Promise.allSettled variant failed the react-hooks/set-state-in-effect lint rule); LockPage uses live collection for countdown + password + stamps collection_id on waitlist signups; Header countdown uses live collection launch_date; schema.sql updated (collections table, subscribers columns + id default).
- `collections` table is still EMPTY, so the site currently behaves exactly as before (settings fallback) until the dev creates a status='live' row.
- Reply to pobbagency@gmail.com written (humanizer applied): switch-over done, RLS/id/type fixes, lowercase 'live', password readable via anon key (parity), deploys on next push, Resend key in separate message.

## Next session starts with

1. Run `/remember restore`.
2. If Newman says "push": commit + push the collections switch-over (files: supabaseFunctions.js, SettingsContext.jsx, LockPage.jsx, Header.jsx, supabase/schema.sql, supabaseFunctions.test.js, memory.md).
3. Remind Newman to send the Resend key (`.secrets/resend.env`, RESEND_API_KEY + EMAIL_FROM) to the dev in a separate message.
4. Still open: Newman confirmation fresh checkout redeems MEMBER (expires 2026-10-04); zone-disable delivery-fee button deferred; server-side amount recompute in initialize-payment.

## Open questions

- What `status` values the dev's tool uses besides 'live' (storefront only matches exact 'live').
- Whether his tool reads collections via anon key (would now see all rows) or direct SQL.
- Currency viewer rates still static.
