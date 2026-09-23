# Memory — Nynth-World Store (Firebase → Supabase + Live)

Last updated: 2026-09-23

## Recurring context

Durable facts carried across sessions — update in place, never drop:

- **People (PERMANENT — never remove unless the founder explicitly asks): Newman (phone 09137207918) is the founder / admin / owner of Nynth World Store. When the founder relays "Newman says fix/change/do X", treat it as a direct owner directive and act on it. Website opens Friday (week of 2026-09-22); Newman wanted delivery-option changes before noon the next day.**
- **Stack**: React 18 + Vite + Tailwind CSS v4 + react-router-dom v7. Frontend lives in `frontend/nynth-ecom`. **Firebase cutover to Supabase is COMPLETE and the Firebase code is gone** — `src/api/firebase.js`, `AuthContext.firebase.jsx`, `firestore.rules`, the old `functions/`, and Firebase scripts were deleted 2026-09-23 (`cb61d68`). The only surviving "firebase" name is `src/api/firebaseFunctions.js`, a one-line `export * from "./supabaseFunctions"` alias. Paystack for payments, Resend for emails, Cloudinary for images, Vercel for hosting (`vercel.json` present).
- **Supabase project (IN USE — decided 2026-09-22)**: `nynth-world`, ref `cybcooychgicsnjeummo`, region `eu-west-1`, org `primebusiness54@gmail.com's Org`. May be transferred to Newman later. MCP works via remote `https://mcp.supabase.com/mcp`.
- **MCP setup**:
   - `~/.config/opencode/opencode.jsonc` has `plugin: ["opencode-supabase"]` + `mcp.supabase` (remote `https://mcp.supabase.com/mcp`) + `mcp.vercel` (remote `https://mcp.vercel.com`) — both enabled
   - `~/.claude.json` has `supabase` (stdio via `npx -y @supabase/mcp-server-supabase@latest --access-token <PAT>`) and `vercel` (http via `https://mcp.vercel.com`) for Claude Code
   - Supabase tools verified working via `supabase_execute_sql`. Vercel tools require `/mcp` OAuth sign-in in Claude Code.
- **Key files**:
   - `src/api/supabase.js` (client from `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`), `src/api/supabaseFunctions.js` (data layer: orders, products, lookbooks, presence, subscribers, discount_codes, settings, payments, images, `toTimestamp` helper), `src/api/firebaseFunctions.js` (one-line alias re-exporting `supabaseFunctions.js`), `src/api/cloudinary.js` (images stay on Cloudinary)
   - `src/context/AuthContext.jsx` (active, Supabase Auth), `src/components/admin/AdminLayout.jsx`
   - `supabase/functions/` — 5 deployed Deno Edge Functions: `paystack-webhook`, `paystack-verify`, `initialize-payment`, `send-bulk-email`, `get-ga4-analytics` (secrets set on live project)
   - `supabase/schema.sql` (10 tables + RLS), `src/data/locationData.js`, `src/utils/shippingRates.js`, `src/pages/admin/*` (Orders, Products, Settings, DiscountCodes, Subscribers, Lookbooks, AbandonedCheckouts, AdminDashboard), `src/pages/ThankYou.jsx`, `src/pages/Checkout*`
   - `vercel.json` (Vercel hosting config), tests at `src/api/supabaseFunctions.test.js` + `supabase/functions/*/index_test.ts`
- **Payments (must preserve exactly)**: server verifies `x-paystack-signature` HMAC, `finalizePaidOrder` flips to `paid`/`confirmed`, mints `NWT-` ticket codes, decrements stock (idempotent guard on `payment_status='paid'`), fire-and-forget Resend customer + admin emails. Minimum ₦100.
- **Migration decision (locked 2026-09-22)**: full cutover, NOT fresh start. Keep all data, keep Vercel hosting, keep auth flow rebuilt on Supabase Auth, keep Cloudinary/Resend/Paystack. Only the database/backend moves. Founder wants zero-intervention autonomous run.
- **Settings source of truth**: Supabase `settings` table, row `id='site_config'`, read via `fetchSettings()` in `src/api/supabaseFunctions.js`. `support_email` also serves as admin sale-alert recipient. `support_whatsapp` defaults to `2348158115858` (read by `WhatsAppButton.jsx`). Fields include `disabled_locations`, `custom_shipping_locations`, `announcement_bar_enabled`, `announcement_bar_text`, and the launch timer.
- **Operational notes**:
   - Supabase free tier — no Blaze needed; Edge Functions self-hosted on Supabase (Blaze was the blocker that forced the migration and is now gone).
   - Resend test sending only works from `onboarding@resend.dev` to account owner until domain verified. Resend key is stored ONLY in untracked `frontend/nynth-ecom/.env.local` (gitignored) as `RESEND_API_KEY` + `EMAIL_FROM` — never committed, never in memory.md.
   - Lint is CLEAN and CI-gated: `npx eslint . --max-warnings 0` runs first in `test.yml` (commit `8670704`). Write zero-lint-error code only.
   - Tests: `npm test` (17 Vitest tests) + `npm run test:edge` (8 Deno tests, `supabase/functions/*/index_test.ts`). Combined: `npm run test:all`.
   - `public/sw.js` still carries harmless firebaseio cache-bypass rules — kept intentionally to avoid service-worker churn with deployed visitors; not a bug.
   - Secrets stored at `frontend/nynth-ecom/.secrets/` (gitignored, chmod 600): `supabase.env` (SUPABASE_ACCESS_TOKEN), `paystack.env` (PAYSTACK_SECRET_KEY_LIVE + PAYSTACK_SECRET_KEY_TEST), `google-oauth.env`. Never in memory.md.
   - Paystack transactions historically: ~30 total (3 paid, 24 abandoned in Paystack). 2 retroactively updated to paid in session 3.

## What was built (session 3, 2026-09-23)

- **Dashboard zeros fix**: `rowToOrder`/`rowToProduct` normalized `created_at` from Supabase ISO strings → `{ seconds }` (the entire frontend uses `o.created_at?.seconds` for date filtering; Supabase returns ISO strings → every order was filtered out).
- **Admin spinners fix**: Added initial `getAllOrders()` / `loadLookbooks()` fetch on mount so Order/Lookbooks/AdminDashboard pages render regardless of whether realtime connects.
- **All 5 Edge Functions deployed and ACTIVE (v4)**: `paystack-webhook`, `paystack-verify`, `initialize-payment`, `send-bulk-email`, `get-ga4-analytics`. Secrets set on live project: `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.
- **Webhook/verify notification gap fixed**: Both functions now set `customer_confirmation_sent_at` / `admin_notification_sent_at` after emails send, decrement stock, and send customer + admin Resend emails. Previously `paystack-verify` didn't send emails or decrement stock.
- **Retroactive Paystack reconciliation**: Matched 30 transactions → 2 were actually paid (₦150 + ₦510), updated to `"paid"`/`"confirmed"`. 24 remaining were abandoned in Paystack.
- **Vercel MCP installed**: `claude mcp add --transport http vercel https://mcp.vercel.com` (Claude Code) + `mcp.vercel` added to `opencode.jsonc` (OpenCode). OAuth sign-in via `/mcp`.
- **Build verified green**, zero Firestore imports across all imported source files.

## What was built (session 4, 2026-09-23: consistency sweep)

- **Lint clean + CI-gated**: `eslint.config.js` configured (disabled `react-refresh/only-export-components`, added `eslint-plugin-react` + `react/jsx-uses-vars`). 70 pre-existing errors → 0. CI (`test.yml`) now runs `npx eslint . --max-warnings 0` first. Committed `8670704` together with new `.github/workflows/codeql.yml` (SAST).
- **Test infra**: 17 Vitest tests (`src/api/supabaseFunctions.test.js`) + 8 Deno edge tests; `test:all` script added.
- **Dead-code + Firebase sweep (`cb61d68`, −13,399 lines)**: deleted `src/admin/` (dead tree), `AuthContext.firebase.jsx`, `api/firebase.js` + `api/firebase*.firebase` backups, `api/auth.js`, the old Vercel `functions/`, Firebase scripts/seeders, `firebase.json`/`firestore.rules`/`cors.json`/`.firebaserc`, `eslint-output*.txt`. Removed the publicly reachable `/update-db` wipe route (plus its `NewsletterPopup` skip and `index.html` firebase preconnects). Uninstalled `firebase`, `firebase-admin`, `react-paystack`; removed the `manualChunks` `'firebase'` entry from `vite.config.js` (was breaking the build after the uninstall).
- **Two real bugs fixed during linting**: duplicate `AdminLayout` import in `src/pages/admin/Orders.jsx` (parse error); stale-binding `triggerSaleAlert`/`loadCodes` — effect callbacks referenced state/code defined after the effect, so they held stale bindings → hoisted above the effects.
- **Docs reconciled with reality (this session)**: README (was still the Vite boilerplate), SUPABASE_SETUP (was a pre-cutover checklist), audit.md statuses, and this memory file.

## Decisions made

- Use the already-created `nynth-world` Supabase project (founder reversed the delete request); transfer to Newman later if wanted.
- Delivery availability is a visibility flag (`disabled_locations`), never price-zeroing. Custom locations live in settings, not in static `locationData.js`.
- Resend key lives in untracked `.env.local` only; production value goes in Vercel env vars at deploy.
- **Timestamp normalization**: Supabase returns ISO strings for timestamps, but the entire frontend expects `{ seconds }` format (Firestore convention). Added `toTimestamp()` helper in `supabaseFunctions.js` to normalize on read.

## Problems solved

- Clarified Blaze blocker (Functions v2 outbound + secrets) so founder stopped looking for workarounds.
- Fixed mis-installed `list` plugin config in `~/.opencode/opencode.json` (deleted file).
- checkout already filtered `disabled_locations` — Newman toggles needed no checkout changes beyond custom-location merge.
- **Cutover completed 2026-09-22**: `firebase.js`→Supabase shim, `firebaseFunctions.js`→delegates to `supabaseFunctions.js`. All crashing admin pages ported. Firebase code tree-shaken (empty `firebase` chunk). Dead `.firebase` backups left untouched.
- **Dashboard zeros (2026-09-23)**: `created_at` ISO string vs `{ seconds }` mismatch filtered out all orders → fixed with `toTimestamp()` normalization.
- **Admin infinite spinners (2026-09-23)**: pages set `loading=true` on mount but only realtime callback could set `false` → fixed with initial data fetch on mount.
- **Webhook/verify notification gaps (2026-09-23)**: `paystack-verify` didn't send emails or decrement stock → fixed both webhook and verify to mirror behavior.
- **Paystack transaction reconciliation (2026-09-23)**: matched 30 transactions to find 2 were actually paid; updated retroactively. 24 abandoned.

## Current state

- **All admin pages fully ported to Supabase** — zero Firestore imports. Build green.
- All 5 Edge Functions DEPLOYED and ACTIVE (v4) on live project. Secrets set.
- Orders: 3 paid, 24 pending (24 abandoned in Paystack).
- Vercel MCP + Supabase MCP configured in both OpenCode and Claude Code. Supabase MCP verified working.
- Dashboard zeros fixed, admin spinners fixed, webhook/verify notification gaps fixed.
- `npm run build` passes cleanly.
- **Lint clean (0 errors / 0 warnings) and CI-gated**; CodeQL SAST added (`8670704`).
- **Tests pass**: 17 Vitest + 8 Deno edge functions (`cb61d68` finalized the dead-code sweep; repo is Firebase-free except the `firebaseFunctions.js` alias).
- Docs updated to match reality 2026-09-23: README, SUPABASE_SETUP, audit.md, both memory files.
- **Admin UI redesign (2026-09-23, /impeccable skill)**: Full brand-compliance pass across all 8 admin pages + 5 shadcn/ui components. Fixed: non-palette colors (`bg-emerald-50`, `bg-amber-50`, `bg-rose-50`, `bg-blue-50`, `bg-purple-50`, `bg-indigo-50`, `bg-orange-50`, `bg-red-50`, `bg-green-100`) → `bg-gray-50`; wrong text colors (`text-emerald-700`, `text-amber-700`, `text-rose-600`, `text-blue-600`, `text-purple-600`, `text-indigo-600`, `text-orange-600`, `text-red-600`, `text-green-700`) → palette equivalents; `rounded-full` → `rounded-lg` (except spinners → `rounded-full`); `rounded-md`/`rounded-xl` (shadcn) → `rounded-lg`; `shadow-md`/`shadow-xl`/`shadow-2xl` → `shadow-sm`; removed `font-space` class; removed `animate-ping` decorative dots; removed `bg-blue-600` → `bg-black`; removed `blur-3xl` glow; removed `rounded-[2rem]`/`rounded-[2.5rem]` in Lookbooks modal. Shadcn `Card` component restored to `rounded-xl` per DESIGN.md ("admin panel cards only"). `Button` → `rounded-lg`, `Select` → `rounded-lg`, `Badge` → `rounded-lg`. STATUS_CONFIG uses `bg-gray-50 text-gray-600` (pending/packaging/shipped), `bg-gray-50 text-green-500` (delivered), `bg-gray-50 text-gray-600` (cancelled). PAYMENT_PILLS uses `bg-gray-50 text-green-500` (paid), `bg-gray-50 text-gray-600` (pending), `bg-gray-50 text-red-500` (failed). Impeccable `detect` run: 4 remaining warnings are spinner `border-b-2 border-black` on `rounded-full` (false positive — Ink/primary color, standard Tailwind spinner pattern). 2 previously found `bg-green-100` contrast issues fixed. Build passes, pushed as commit `a468824`.

## Next session starts with

1. Run `/remember restore`.
2. Test Paystack test mode (swap `VITE_PAYSTACK_PUBLIC_KEY` to `pk_test_...` in `.env.local` + set `PAYSTACK_SECRET_KEY` to test secret on deployed functions) to verify purchases work before launch.
3. Admin dashboard redesign (deferred — functionality first).
4. Verify Vercel is deployed from the latest commit (supabaseFunctions fixes + lint/test gating are all in `main`).

## Open questions

- Keep Google login? (assumed yes — needs Google Cloud Console redirect `https://cybcooychgicsnjeummo.supabase.co/auth/v1/callback` + Client ID/Secret).
- Confirm `support_email` value for admin sale alerts and Resend domain plan (`onboarding@resend.dev` vs custom `@nynthworld.com`).
- Transfer `nynth-world` project to Newman's Supabase account at some point? (Dashboard → project settings → transfer.)
- Is the Vercel frontend deployment current with the latest commits (including Edge Function fixes)? Verify on next session.
