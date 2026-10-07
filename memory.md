# Memory — Nynth-World Store (Newman's website fixes batch: checkout affordances + price display)

Last updated: 2026-10-07 (new session, build in progress)

## Recurring context

- **People (PERMANENT):** Newman (phone 09137207918) is founder/admin/owner. "Newman says X" = direct owner directive. Owner alert inboxes: newmanyange14@gmail.com, nynthworld@gmail.com, primebusiness54@gmail.com. An external developer (pobbagency@gmail.com) is building a separate admin tool against this DB (collections/drops + waitlist emails); he has direct SQL access to the project (he created the `collections` table himself).
- **Live site:** `https://www.nynthworld.com` (Vercel, auto-deploy on push to `main`). To confirm which build is live: `curl -s https://www.nynthworld.com/ | grep -o 'assets/index-[^"]*\.js'` then grep that bundle for a known string from the change.
- **Live request tracing (launch-day gold):** Management API unified logs: `GET "https://api.supabase.com/v1/projects/cybcooychgicsnjeummo/analytics/endpoints/logs?sql=<urlencoded>&iso_timestamp_start=...Z&iso_timestamp_end=...Z"` with Bearer token from `.secrets/supabase.env`. Table `logs`, filter `source`: `edge_logs` = per-HTTP-request rows via `log_attributes['request.path']`, `['request.method']`, `['request.search']`, `['response.status_code']`. The old `logs.all` endpoint is removed. Statement bodies/params are NOT logged. `postgrest_logs` is heartbeat noise.
- **Supabase MCP is connected to the WRONG project** (`Atomic Xp` llwlgzujsyxlseiqiwsp); it lists nynth-world but SQL runs against the wrong DB (verified: `discount_codes` count = 0). Use the Management API instead: `curl -X POST "https://api.supabase.com/v1/projects/cybcooychgicsnjeummo/database/query" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"query": "..."}'` with token from `frontend/nynth-ecom/.secrets/supabase.env`. `.env.local` must NOT be shell-sourced (line 9 breaks zsh); parse key=value in python instead.
- **Stale-tab gotcha (PERMANENT lesson):** after any push, users keep running the pre-fix JS in old tabs. Hard refresh (Cmd+Shift+R) first when someone reports "still broken"; verify server side before changing code.
- **Stack:** React 18 + Vite + Tailwind v4 + react-router-dom v7. Frontend in `frontend/nynth-ecom`. Backend fully Supabase (project `nynth-world`, ref `cybcooychgicsnjeummo`, eu-west-1). `src/api/firebaseFunctions.js` is a one-line alias over `supabaseFunctions.js`. Paystack payments, Resend emails, Cloudinary images, Vercel hosting.
- **Standing user rules (never violate):** no em dashes anywhere (copy, chat, code). Zero `style={{}}` except dnd-kit in Products.jsx. Consume `src/components/ui/` primitives. No new npm deps without explicit approval. Never commit/push unless user says "push". Gate before finishing: `npm run lint` (zero warnings), `npm test`, `npm run test:edge`, `npm run build`, `node scripts/verify-dist.mjs`, `npx impeccable detect --json` on touched UI.
- **Secrets (locations only, never values):** `frontend/nynth-ecom/.secrets/` (gitignored): `supabase.env` (SUPABASE_ACCESS_TOKEN), `paystack.env` (TEST+LIVE keys), `google-oauth.env`, `resend.env` (RESEND_API_KEY + EMAIL_FROM; Newman may share this with the admin-tool dev on request). `frontend/nynth-ecom/.env.local` (gitignored) holds live keys with test fallbacks. Server secrets on Supabase project: RESEND_API_KEY, EMAIL_FROM, ADMIN_NOTIFY_EMAIL, PAYSTACK_SECRET_KEY, SUPABASE_* keys.
- **Orders model:** `is_test` stamped from Paystack `domain` at verify/webhook. Frontend derives test-mode from `VITE_PAYSTACK_PUBLIC_KEY` starting with `pk_test_`. Test traffic excluded from metrics.
- **Delivery / free delivery:** ALL non-ticket products `deliveryFeeEnabled=false`, `settings.free_delivery_enabled=true`, every order ships free. Page-top marquee + Shop strip removed 2026-09-27 (commit `79cf192`, marquee off in DB). Cart/Checkout/ProductDetail free-delivery lines stay.
- **Discount codes:** table `discount_codes`; guest validation via SECURITY DEFINER RPC `public.validate_discount(p_code)` (anon+authenticated). Pattern to copy for any future shopper-facing check (do NOT loosen RLS to let anon read secret-ish tables).
- **Lock/drop model (2026-10-03):** site-wide lock settings still live in `settings.data` (`lock_page_enabled`, `lock_epoch`, `lock_password`, `lock_timer_*`, `launch_date`); admin Settings page edits them. `collections` table (id bigint identity BY DEFAULT, name, slug, launch_date timestamptz, status text, password text, created_at) written by the external admin tool; `status='live'` (exact lowercase) marks the active drop. Storefront `fetchLiveCollection()` reads that row (newest id) and falls back to settings when none. RLS: `collections_public_read` (select using true, password included, parity with old settings.lock_password) + `collections_admin_write` (is_admin()). `lock_epoch` force-relock semantics must stay intact. Lock page unlock is client-side compare + localStorage (`nynth_site_unlocked`, `nynth_lock_epoch`). No FK between collections and subscribers.
- **subscribers model:** `id text` (default `('sub-' || gen_random_uuid()::text)`; the 171 pre-existing rows are backfilled with id = email), `email text unique`, `source text` ('waitlist'|'newsletter'|'popup'|'footer'), `collection_id text` (stores collections.id as a string, send it stringified), `notified boolean`, `created_at`. RLS: insert anyone, read/write admin only (keep it that way). Admin Subscribers page counts off `source`.
- **Key files:** `src/api/supabaseFunctions.js`, `src/context/SettingsContext.jsx`, `src/pages/LockPage.jsx`, `src/components/home/Header.jsx`, `src/pages/Checkout.jsx`, `src/pages/Shop.jsx`, `src/pages/admin/DiscountCodes.jsx`, `src/pages/admin/Settings.jsx`, `src/App.jsx`, `src/context/CartContext.jsx`, `src/utils/shippingRates.js`, `supabase/schema.sql`, `supabase/functions/_shared/email.ts`, `scripts/verify-dist.mjs`.

## What was built (2026-10-03, shipped)

- Storefront switch-over per the external dev's request: LockPage countdown + password and the Header announcement-bar countdown now read the `collections` row with `status='live'`, falling back to `settings.launch_date` / `settings.lock_password` when no drop is live. LockPage waitlist signups now stamp `collection_id`.
- `fetchLiveCollection()` added; SettingsContext loads/exposes `liveCollection` alongside settings so consumers never see intermediate state.
- `addSubscriber` fixed: returns `{success, message}` with `ADDED` / `ALREADY_ADDED` (it returned `true` while all three callers read `{success, message}`, so every signup showed an error toast and LockPage never reached /waitlist-confirmation), generates client id `sub-<ts>-<rand>`, accepts optional `collectionId` (stringified).
- Live DB fixes: `collections` RLS policies (public read, admin write; RLS was on with zero policies so anon reads were empty) and `subscribers.id` default (was NOT NULL with no default, so every anon insert failed 23502: lock page, popup, footer, and the dev's tool).
- `supabase/schema.sql` updated (collections table, subscribers columns + id default). 8 new vitest tests (86 total).

## What was built (2026-10-07, Newman's fix batch, done but NOT pushed)

- **Prices:** removed the "APPROX $x / £y" currency line entirely (foreignPriceLabel render blocks deleted from ProductCard desktop+mobile and ProductDetail desktop+mobile; `src/utils/currency.js` file kept but now unused) and removed the `.00` (dropped `minimumFractionDigits: 2`, prices now plain `toLocaleString()` in both files, compare-at strikethrough included).
- **Checkout state select:** initial `form.state` is now `""` with a `SELECT STATE` placeholder option (was defaulting to Abuja via `availableStates[0]`), added `PLEASE SELECT YOUR STATE` validation before the city check, and the shipping effect returns fee 0 until a state is chosen.
- **Dropdown arrows:** all 4 `appearance-none` checkout selects (state, Lagos area, Abuja area, delivery time) wrapped in a relative container with a `ChevronDown` icon and `pr-10`.
- **Highlighting/affordance (his "let functional options have highlighting"):** discount code input now boxed in a bordered rounded container with a solid black APPLY button (was underline input + ghost button); every underlined checkout input/select gained `hover:border-black/40` + `.focus-ring` (8 occurrences via replaceAll).
- **Newsletter button:** added a `NEWSLETTER` entry to `navLinks` in Header (`to: "#newsletter"`, renders as `<a href>` branch, desktop `hidden lg:block` to avoid crowding the centered logo, mobile menu item closes menu); Footer newsletter section got `id="newsletter"` + `scroll-mt-24`.
- **Footer info:** phone (`settings.support_phone`, tel: link) + location (`settings.office_address`) lines above the copyright, rendered only when set.
- Gates all green pre-push: lint zero, vitest 86, test:edge 19, build + verify-dist OK, impeccable detect [] on all 5 touched files.

## Decisions made

- Fallback to settings whenever no live collection row exists, so the site behaves exactly as before while `collections` is empty.
- Public SELECT on `collections` (password included) accepted as parity with the old world where `settings.lock_password` was already world-readable; told the dev to treat collection passwords as shareable codes.
- `collections.id` (bigint) vs `subscribers.collection_id` (text) mismatch left as-is (no FK) so the dev's already-built tool keeps working; storefront always sends the id as a string.
- Lint lesson: `react-hooks/set-state-in-effect` rejects `Promise.allSettled` destructuring inside a loader called from `useEffect`; the sequential try/catch shape (same as the original refreshSettings) passes.

## Problems solved

- Admin tool unlock flow could not work: lock page read everything from settings and `collections` was unreadable via RLS.
- addSubscriber return-shape mismatch broke all three signup toasts/confirmation navigation.
- **Live signup breaker:** `subscribers.id` NOT NULL with no default meant every anon insert failed 23502 since cutover (existing 171 rows were a day-one backfill with id = email). Fixed with DB default + client-generated id (discount_codes precedent). Verified by anon PostgREST round trip: both insert shapes return 201, string collection_id lands correctly, temp rows cleaned up.

## Current state

- 2026-10-07 batch BUILT, gates green, working tree has uncommitted changes, **NOT pushed** (wait for Newman to say "push"; Vercel deploys on push to main). Files touched: `ProductCard.jsx`, `ProductDetail.jsx`, `Checkout.jsx`, `Header.jsx`, `Footer.jsx`, `memory.md`.
- Deferred to later by Newman: full checkout restructure to numbered collapsible sections with simpler labels ("Simpler terms" screenshots from a reference site; he thinks it may need DB work, it does not). Ignored by Newman: AB test layout idea, abandoned-checkout follow-up reminder system. No questions allowed to be asked of him (his instruction: only do what he explicitly requested).
- From the earlier batch (shipped 2026-10-03): collections/drop switch-over live; `collections` table still EMPTY so storefront still runs on settings fallback until the dev's tool creates a `status='live'` row.

## Next session starts with

1. Run `/remember restore`.
2. If Newman says "push": commit + push the 2026-10-07 batch (files above).
3. Still open: dev's end-to-end test with a live collection row; MEMBER discount code expired 2026-10-04 (confirm/clean up); zone-disable delivery-fee button deferred; server-side amount recompute in `initialize-payment` (hardening); checkout restructure ("simpler terms") deferred.
4. The footer newsletter form already existed; the NEWSLETTER header nav button was the new entry point added for his "email newsletter button" ask.

## Open questions

- What `status` values the dev's tool uses besides 'live' (storefront only matches exact lowercase 'live').
- Whether his tool reads collections via anon key (now sees all rows incl. passwords) or direct SQL.
- Currency viewer rates still static (`src/utils/currency.js`: NGN_PER_USD=1500, NGN_PER_GBP=2000).
