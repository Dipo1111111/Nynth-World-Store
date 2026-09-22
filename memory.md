# Memory — Nynth-World Store (Firebase → Supabase + Live)

Last updated: 2026-09-23

## Recurring context

Durable facts carried across sessions — update in place, never drop:

- **People (PERMANENT — never remove unless the founder explicitly asks): Newman (phone 09137207918) is the founder / admin / owner of Nynth World Store. When the founder relays "Newman says fix/change/do X", treat it as a direct owner directive and act on it. Website opens Friday (week of 2026-09-22); Newman wanted delivery-option changes before noon the next day.**
- **Stack**: React 18 + Vite + Tailwind CSS v4 + react-router-dom v7. Frontend lives in `frontend/nynth-ecom`. **Firebase cutover to Supabase is COMPLETE** — `firebase.js` is now a shim (`db = supabase`), `firebaseFunctions.js` delegates to `supabaseFunctions.js`. Zero Firestore imports remain in any imported source file. Paystack for payments, Resend for emails, Cloudinary for images, Vercel for hosting (`vercel.json` present).
- **Supabase project (IN USE — decided 2026-09-22)**: `nynth-world`, ref `cybcooychgicsnjeummo`, region `eu-west-1`, org `primebusiness54@gmail.com's Org`. May be transferred to Newman later. MCP works via remote `https://mcp.supabase.com/mcp`.
- **MCP setup**:
   - `~/.config/opencode/opencode.jsonc` has `plugin: ["opencode-supabase"]` + `mcp.supabase` (remote `https://mcp.supabase.com/mcp`) + `mcp.vercel` (remote `https://mcp.vercel.com`) — both enabled
   - `~/.claude.json` has `supabase` (stdio via `npx -y @supabase/mcp-server-supabase@latest --access-token <PAT>`) and `vercel` (http via `https://mcp.vercel.com`) for Claude Code
   - Supabase tools verified working via `supabase_execute_sql`. Vercel tools require `/mcp` OAuth sign-in in Claude Code.
- **Key files**:
   - `src/api/firebase.js` (cutover shim: `auth = supabase.auth`, `db = supabase`, `storage`, `functions`), `src/api/firebaseFunctions.js` (delegates all exports to `supabaseFunctions.js`), `src/api/supabaseFunctions.js` (~270 lines: orders, products, lookbooks, presence, subscribers, discount_codes, settings, payments, images, `toTimestamp` helper)
   - `src/context/AuthContext.jsx` (active), `src/api/cloudinary.js` (images stay on Cloudinary)
   - `functions/index.js` (5 exports → Deno Edge Functions in `supabase/functions/`: `paystack-webhook`, `paystack-verify`, `initialize-payment`, `send-bulk-email`, `get-ga4-analytics`)
   - `src/data/locationData.js`, `src/utils/shippingRates.js`, `src/components/admin/ShippingRatesEditor.jsx`, `src/pages/admin/Settings.jsx`, `src/pages/admin/Orders.jsx`, `src/pages/admin/AdminDashboard.jsx`, `src/pages/ThankYou.jsx`, `src/pages/Checkout*`, `firestore.rules`
   - `vercel.json` (Vercel hosting config), `src/context/AuthContext.firebase.jsx` / `AuthContext.supabase.jsx` (dead backups, NOT imported)
- **Payments (must preserve exactly)**: server verifies `x-paystack-signature` HMAC, `finalizePaidOrder` flips to `paid`/`confirmed`, mints `NWT-` ticket codes, decrements stock (idempotent guard on `payment_status='paid'`), fire-and-forget Resend customer + admin emails. Minimum ₦100.
- **Migration decision (locked 2026-09-22)**: full cutover, NOT fresh start. Keep all data, keep Vercel hosting, keep auth flow rebuilt on Supabase Auth, keep Cloudinary/Resend/Paystack. Only the database/backend moves. Founder wants zero-intervention autonomous run.
- **Settings source of truth**: Firestore doc `settings/site_config`, read via `fetchSettings()` in `src/api/firebaseFunctions.js`. `support_email` also serves as admin sale-alert recipient. `support_whatsapp` defaults to `2348158115858` (read by `WhatsAppButton.jsx`). New field `custom_shipping_locations` holds admin-added locations.
- **Operational notes**:
   - Cloud Functions v2 + outbound + secrets require Blaze — the blocker forcing this migration. No workaround.
   - Resend test sending only works from `onboarding@resend.dev` to account owner until domain verified. Resend key is stored ONLY in untracked `frontend/nynth-ecom/.env.local` (gitignored) as `RESEND_API_KEY` + `EMAIL_FROM` — never committed, never in memory.md.
   - `src/admin/AdminDashboard.jsx` and `src/admin/sections/Orders.jsx` are dead files; real dashboard is `src/pages/admin/AdminDashboard.jsx`.
   - `npm run build` passes; full-repo ESLint has many pre-existing errors — do not treat as regression. New code introduces zero new lint errors.
   - Workspace has unrelated pre-existing git noise (`D ../../.agent/...`, `M ../../memory.md` at repo root level, untracked PDFs) — do not touch.
   - Secrets stored at `frontend/nynth-ecom/.secrets/` (gitignored, chmod 600): `supabase.env` (SUPABASE_ACCESS_TOKEN), `paystack.env` (PAYSTACK_SECRET_KEY_LIVE + PAYSTACK_SECRET_KEY_TEST), `google-oauth.env`, `firebase-service-account.json`. Never in memory.md.
   - 30 Paystack transactions exist: 3 paid, 24 abandoned (user didn't complete payment). 2 retroactively updated to paid in session 3.

## What was built (session 3, 2026-09-23)

- **Dashboard zeros fix**: `rowToOrder`/`rowToProduct` normalized `created_at` from Supabase ISO strings → `{ seconds }` (the entire frontend uses `o.created_at?.seconds` for date filtering; Supabase returns ISO strings → every order was filtered out).
- **Admin spinners fix**: Added initial `getAllOrders()` / `loadLookbooks()` fetch on mount so Order/Lookbooks/AdminDashboard pages render regardless of whether realtime connects.
- **All 5 Edge Functions deployed and ACTIVE (v4)**: `paystack-webhook`, `paystack-verify`, `initialize-payment`, `send-bulk-email`, `get-ga4-analytics`. Secrets set on live project: `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.
- **Webhook/verify notification gap fixed**: Both functions now set `customer_confirmation_sent_at` / `admin_notification_sent_at` after emails send, decrement stock, and send customer + admin Resend emails. Previously `paystack-verify` didn't send emails or decrement stock.
- **Retroactive Paystack reconciliation**: Matched 30 transactions → 2 were actually paid (₦150 + ₦510), updated to `"paid"`/`"confirmed"`. 24 remaining were abandoned in Paystack.
- **Vercel MCP installed**: `claude mcp add --transport http vercel https://mcp.vercel.com` (Claude Code) + `mcp.vercel` added to `opencode.jsonc` (OpenCode). OAuth sign-in via `/mcp`.
- **Build verified green**, zero Firestore imports across all imported source files.

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
- **Admin UI redesign (2026-09-23, /impeccable skill)**: Full brand-compliance pass across all 8 admin pages + 5 shadcn/ui components. Fixed: non-palette colors (`bg-emerald-50`, `bg-amber-50`, `bg-rose-50`, `bg-blue-50`, `bg-purple-50`, `bg-indigo-50`, `bg-orange-50`, `bg-red-50`) → `bg-gray-50`; wrong text colors (`text-emerald-700`, `text-amber-700`, `text-rose-600`, `text-blue-600`, `text-purple-600`, `text-indigo-600`, `text-orange-600`, `text-red-600`) → palette-compliant equivalents; `rounded-full` → `rounded-lg`; `rounded-xl`/`rounded-md` → `rounded-lg`; `shadow-md`/`shadow-xl`/`shadow-2xl` → `shadow-sm`; removed `font-space` class; removed `animate-ping` decorative dots; removed `bg-blue-600` → `bg-black`; removed `blur-3xl` glow; removed `rounded-[2rem]`/`rounded-[2.5rem]` in Lookbooks modal. Shadcn/ui `Card` component: `rounded-xl`→`rounded-lg`, `shadow`→`shadow-sm`. `Button`: `rounded-md`→`rounded-lg`. `Select`: `rounded-md`→`rounded-lg`, `shadow-md`→`shadow-sm`, `rounded-sm`→`rounded-lg`. `Badge`: `rounded-md`→`rounded-lg`, `bg-yellow-500`→`bg-gray-600`, `bg-blue-500`→`bg-black`. STATUS_CONFIG in StatusDropdown now uses `bg-gray-50 text-gray-600` (pending/packaging/shipped), `bg-gray-50 text-green-500` (delivered), `bg-gray-50 text-gray-600` (cancelled). PAYMENT_PILLS in AdminDashboard now uses `bg-gray-50 text-green-500` (paid), `bg-gray-50 text-gray-600` (pending), `bg-gray-50 text-red-500` (failed). Build passes cleanly, zero remaining brand violations.

## Next session starts with

1. Run `/remember restore`.
2. Test Paystack test mode (swap `VITE_PAYSTACK_PUBLIC_KEY` to `pk_test_...` in `.env.local` + set `PAYSTACK_SECRET_KEY` to test secret on deployed functions) to verify purchases work before launch.
3. Admin dashboard redesign (deferred — functionality first).

## Open questions

- Keep Google login? (assumed yes — needs Google Cloud Console redirect `https://cybcooychgicsnjeummo.supabase.co/auth/v1/callback` + Client ID/Secret).
- Confirm `support_email` value for admin sale alerts and Resend domain plan (`onboarding@resend.dev` vs custom `@nynthworld.com`).
- Transfer `nynth-world` project to Newman's Supabase account at some point? (Dashboard → project settings → transfer.)
- Is the Vercel frontend deployment current with the latest commits (including Edge Function fixes)? Verify on next session.
