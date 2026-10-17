# Memory - Nynth-World Store (product page copy + revenue privacy)

Last updated: 2026-10-17 (evening session; pushed to main)

## Recurring context

- **People (PERMANENT):** Newman (phone 09137207918) is founder/admin/owner. "Newman says X" = direct owner directive. Owner alert inboxes: newmanyange14@gmail.com, nynthworld@gmail.com, primebusiness54@gmail.com. An external developer (pobbagency@gmail.com) builds a separate admin tool against this DB (collections/drops + waitlist emails); he has direct SQL access (created the `collections` table himself). Newman relays requirements as WhatsApp screenshots and voicemail transcripts, often mixing competitor/reference-site screenshots with our own, and writes in fragmented bursts that need interpretation into concrete edits.
- **Newman's design philosophy (2026-10-07):** "Easy, clean, minimal, but exceptional."
- **Live site:** `https://www.nynthworld.com` (Vercel, auto-deploy on push to `main`). Verify a deploy by grepping the served bundle for a string UNIQUE to the change (`curl -s https://www.nynthworld.com/ | grep -o 'assets/index-[^"]*\.js'` then fetch it). Generic strings give false positives. Deploy takes ~1-3 min, poll. Last verified bundle: `index-CQSoQgq9.js` (2026-10-07; not re-verified after the 2026-10-17 push).
- **Platform spec:** the owner's 13-page platform brief lives at `/Users/igbojuwooladipupo/Downloads/NYNTH WORLD PLATFORM .pdf` (roles: Main Admin, Vice Admin, Ticket Admin, Ticket Staff; per-event scoping; revenue privacy). Most of it is already built (admin panel, events, ticketing, check-in, discount codes, lookbooks, abandoned checkouts). The unimplemented parts are the full RBAC/permission model and per-event organizer isolation; `users.role` only allows `admin|customer` today (`supabase/schema.sql:21`) and every admin route is gated by `ProtectedRoute requireAdmin` only.
- **Supabase MCP is connected to the WRONG project** (`Atomic Xp` llwlgzujsyxlseiqiwsp); SQL runs against the wrong DB. Use the Management API instead: `curl -X POST "https://api.supabase.com/v1/projects/cybcooychgicsnjeummo/database/query" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"query": "..."}'` with token from `frontend/nynth-ecom/.secrets/supabase.env`. `.env.local` must NOT be shell-sourced (line 9 breaks zsh); parse key=value in python instead.
- **Stale-tab gotcha (PERMANENT lesson):** after any push, users keep running the pre-fix JS in old tabs. Hard refresh (Cmd+Shift+R) first when someone reports "still broken"; verify server side before changing code. Bare apex domain 307-redirects to www.
- **Stack:** React 18 + Vite + Tailwind v4 + react-router-dom v7. Frontend in `frontend/nynth-ecom`. Backend fully Supabase (project `nynth-world`, ref `cybcooychgicsnjeummo`, eu-west-1). `src/api/firebaseFunctions.js` is a one-line alias over `supabaseFunctions.js`. Paystack payments, Resend emails, Cloudinary images, Vercel hosting. Footer is rendered per-page (imported by ~19 page components; Lookbook and LockPage have none).
- **Standing user rules (never violate):** no em dashes anywhere (copy, chat, code). Zero `style={{}}` except dnd-kit in Products.jsx. Consume `src/components/ui/` primitives. No new npm deps without explicit approval. Never commit/push unless user says "push". Gate before finishing: `npm run lint` (zero warnings), `npm test`, `npm run test:edge`, `npm run build`, `node scripts/verify-dist.mjs`, `npx impeccable detect --json` on touched UI.
- **Newman triage rules (2026-10-07):** do only what he explicitly asked; do NOT ask him clarifying questions (owner's instruction); user (Dipo) does want an interpretation cross-check before pushing ambiguous batches, then says "push".
- **Secrets (locations only, never values):** `frontend/nynth-ecom/.secrets/` (gitignored): `supabase.env` (SUPABASE_ACCESS_TOKEN), `paystack.env`, `google-oauth.env`, `resend.env`. `frontend/nynth-ecom/.env.local` (gitignored). Server secrets live on the Supabase project.
- **Orders model:** `is_test` stamped from Paystack `domain`. Test traffic excluded from metrics. Order `customer` jsonb stores the ENTIRE checkout form via `{...form}` spread, so new form fields persist with no schema change.
- **Product page copy (since 2026-10-17, PERMANENT):** the "7 DAYS RETURN POLICY" badge is gone from `ProductDetail.jsx` (both desktop and mobile). The SHIPPING & RETURNS accordion renders `resolveProductNote(product, settings)` from `src/utils/productCopy.js`. Precedence: `product.productNote` / `product.productNoteTitle` (per product, Admin > Products > Edit) > `settings.product_note_text` / `product_note_title` (Admin > Settings > Product page) > `DEFAULT_PRODUCT_NOTE`. `settings.product_note_enabled === false` hides the panel entirely. Rendered with `whitespace-pre-line`, so blank lines survive. Do not hardcode policy copy into ProductDetail again.
- **Shipping page copy (since 2026-10-17):** `/shipping` RETURN POLICY body is `settings.returns_page_policy`, split on blank lines into paragraphs. Missing/null shows the default; explicitly emptied string hides the block. Distinct semantics from the product note (fallback vs hide) and that is deliberate.
- **Revenue privacy (since 2026-10-17, PERMANENT):** `settings.revenue_display = { hide_by_default: boolean, override: number|null }` inside `settings.data` jsonb, no migration needed. Dashboard Net sales renders through `src/components/admin/RevenueValue.jsx`: masked to `****.***` on first paint when `hide_by_default`, eye button reveals (choice is component state, never persisted, so a reload masks again), `override` replaces the ledger figure and draws a red dot. Only the headline is dressed; orders, reports, and the ledger are untouched.
- **Delivery / free delivery:** ALL non-ticket products `deliveryFeeEnabled=false`, `settings.free_delivery_enabled=true`, every order ships free.
- **Discount codes:** table `discount_codes`; guest validation via SECURITY DEFINER RPC `public.validate_discount(p_code)`. Code `MEMBER` (20%) expired 2026-10-04.
- **Lock/drop model:** site-wide lock settings in `settings.data`; `collections` table written by the external admin tool; `status='live'` marks the active drop. `lock_epoch` force-relock must stay intact. Lock unlock is client-side + localStorage. Table still EMPTY as of 2026-10-07.
- **subscribers model:** `id text`, `email text unique`, `source text`, `collection_id text`, `notified boolean`, `created_at`. RLS: insert anyone, read/write admin only.
- **Price display convention:** whole naira only, plain `toLocaleString()`, NO decimals, NO foreign currency line. `src/utils/currency.js` is unused leftover.
- **Key files:** `src/pages/ProductDetail.jsx`, `src/utils/productCopy.js`, `src/utils/revenueDisplay.js`, `src/components/admin/RevenueValue.jsx`, `src/pages/admin/Settings.jsx`, `src/pages/admin/Products.jsx`, `src/pages/admin/AdminDashboard.jsx`, `src/pages/ShippingReturns.jsx`, `src/context/SettingsContext.jsx`, `src/api/supabaseFunctions.js`, `src/pages/Checkout.jsx`, `src/pages/LockPage.jsx`, `supabase/schema.sql`, `scripts/verify-dist.mjs`.

## What was built (2026-10-17, pushed to main)

- `src/utils/productCopy.js` (new): `DEFAULT_PRODUCT_NOTE`, `DEFAULT_PRODUCT_NOTE_TITLE`, `DEFAULT_RETURNS_PAGE_POLICY`, `resolveProductNote`, `isProductNoteEnabled`, `resolveReturnsPagePolicy`.
- `src/utils/revenueDisplay.js` (new): `REVENUE_MASK = "****.***"`, `toAmount`, `normalizeRevenueDisplay`, `formatNaira`, `resolveRevenue`, `revenueText`.
- `src/components/admin/RevenueValue.jsx` (new): masked figure, eye toggle, red dot for a manual figure, count-up animation.
- `src/pages/ProductDetail.jsx`: removed both 7-day badges; both shipping/returns accordions now read the resolver; panel can be hidden.
- `src/pages/admin/Products.jsx`: per-product "Product page note" block (panel title + text), wired into `initialFormState` and `handleEdit`.
- `src/pages/admin/Settings.jsx`: new "Product page" section (show/hide, title, text with restore-default, shipping page return policy) and "Revenue" section (hide by default, manual figure with live preview); nav entries added; defaults and merge logic extended.
- `src/pages/ShippingReturns.jsx`: return policy rendered from settings, block hidden when cleared.
- `src/pages/admin/AdminDashboard.jsx`: Net sales uses `RevenueValue` with `settings.revenue_display`.
- `src/context/SettingsContext.jsx`: seeds the new keys so first paint is correct before the fetch resolves.
- Tests: `src/utils/productCopy.test.js` (14), `src/utils/revenueDisplay.test.js` (14), `src/pages/productPageCopy.test.jsx` (9 static wiring guards).

## Decisions made

- Policy copy is data, not code: defaults live in utils, edits live in `settings.data`, so Newman changes wording without a deploy.
- Product note precedence is per product > store > built-in. A whitespace-only value counts as "not set" so a stray space cannot blank the panel.
- `/shipping` uses empty-string-means-hidden while the product panel uses empty-means-fallback. Different intents: removing policy versus leaving a field alone.
- The manual revenue figure is a display setting, not a written ledger value. Real totals stay truthful for reports and emails; only the dashboard headline is dressed, and the red dot is the tell.
- Reveal state stays local to the component on purpose. Persisting it would leave the figure exposed on the next load.
- No jsdom in the repo, so new tests are pure-function tests plus static source-wiring guards (same style as `adminRoutes.test.jsx`).

## Problems solved

- ProductDetail had the same hardcoded shipping/returns copy duplicated for desktop and mobile. Both now share one resolver, so a copy edit lands in both layouts.
- `react-hooks/set-state-in-effect` rejected the first RevenueValue (effect syncing reveal state to settings). Fixed by deriving `revealChoice ?? !hideByDefault` instead of a state-syncing effect.
- Repo standing rules caught two slips before commit: `&mdash;` in new admin copy and a `style={{}}` in RevenueValue. Replaced with " - " and Tailwind text sizes.
- `npx impeccable` is no longer installed or cached locally, so that UI gate could not run offline this session (it tries to download `impeccable@4.6.0`).

## Current state

- Gates green: `npm run lint` exit 0, `npm test` 123 passed (86 baseline + 37 new), `npm run test:edge` 19 passed, `npm run build` OK, `node scripts/verify-dist.mjs` OK. `npx impeccable` unavailable.
- Shipped and pushed to `main` (commit `5389706`, plus the memory commit that follows it). Working tree clean afterwards.
- Live behaviour after Vercel rebuild: product pages show no 7-day return badge; the SHIPPING & RETURNS panel reads the store default; dashboard Net sales is masked until the eye is clicked.

## Next session starts with

1. Run `/remember restore`.
2. Have Newman confirm the panel copy on a live product page and set the store default once in Admin > Settings > Product page (title + text).
3. If he wants the dressed number now, set the manual figure in Admin > Settings > Revenue (the red dot will confirm it is active).
4. Still open from earlier sessions: external dev's end-to-end test once a `status='live'` collection row exists; `MEMBER` discount code expired 2026-10-04; server-side amount recompute in `initialize-payment`; `src/utils/currency.js` dead code.

## Open questions

- Whether Newman wants a per-product panel title or only the body text. Both are wired; the title field can be removed from the product form if it is noise.
- Whether the RBAC brief (Vice Admin, Ticket Admin, Ticket Staff, per-event scoping) should be built next, and whether `users.role` should grow beyond `admin|customer` or a separate `staff_roles` table should hold scoped permissions.
- Whether to add `impeccable` as a devDependency so the UI gate works offline.
