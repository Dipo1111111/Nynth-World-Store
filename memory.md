# Memory — Nynth-World Store (launch-day discount codes fixed + pushed)

Last updated: 2026-09-27 (~17:10)

## Recurring context

- **People (PERMANENT):** Newman (phone 09137207918) is founder/admin/owner. "Newman says X" = direct owner directive. Owner alert inboxes: newmanyange14@gmail.com, nynthworld@gmail.com, primebusiness54@gmail.com.
- **Stack:** React 18 + Vite + Tailwind v4 + react-router-dom v7. Frontend in `frontend/nynth-ecom`. Backend fully Supabase (project `nynth-world`, ref `cybcooychgicsnjeummo`, eu-west-1). `src/api/firebaseFunctions.js` is a one-line alias over `supabaseFunctions.js`. Paystack payments, Resend emails, Cloudinary images, Vercel hosting (auto-deploy on push to `main`).
- **Standing user rules (never violate):** no em dashes anywhere (copy, chat, code). Zero `style={{}}` except dnd-kit in Products.jsx. Consume `src/components/ui/` primitives. No new npm deps without explicit approval. Never commit/push unless user says "push". Gate before finishing: `npm run lint` (zero warnings), `npm test`, `npm run test:edge`, `npm run build`, `node scripts/verify-dist.mjs`, `npx impeccable detect --json` on touched UI.
- **Secrets (locations only, never values):** `frontend/nynth-ecom/.secrets/` (gitignored): `supabase.env` (SUPABASE_ACCESS_TOKEN), `paystack.env` (TEST+LIVE keys), `google-oauth.env`, `resend.env`. `frontend/nynth-ecom/.env.local` (gitignored) holds live keys with test fallbacks. Server secrets on Supabase project: RESEND_API_KEY, EMAIL_FROM, ADMIN_NOTIFY_EMAIL, PAYSTACK_SECRET_KEY, SUPABASE_* keys. `VITE_PAYSTACK_PUBLIC_KEY` mirrored in Supabase secrets.
- **DB writes without MCP:** Supabase MCP is connected to the WRONG project. Use the Management API: `curl -X POST "https://api.supabase.com/v1/projects/cybcooychgicsnjeummo/database/query" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"query": "..."}'`. Token in `.secrets/supabase.env`.
- **Orders model:** `is_test` stamped from Paystack `domain` at verify/webhook. Frontend derives test-mode from `VITE_PAYSTACK_PUBLIC_KEY` starting with `pk_test_`. Test traffic excluded from metrics. Order `customer` jsonb stores the checkout form incl. `deliveryDate`/`deliveryTimeWindow`.
- **Delivery fees:** per-product `deliveryFeeEnabled` in product `data` jsonb; admin toggles in Products.jsx. `cartNeedsShipping(items)` in `src/utils/shippingRates.js`. Cart items carry the flag (CartContext fixed).
- **Free delivery:** ALL non-ticket products have `deliveryFeeEnabled=false`, `settings.free_delivery_enabled=true`. Every order ships free nationwide. Top marquee banner DISABLED 2026-09-27 per Newman (`settings.marquee_enabled=false`; text preserved in `marquee_text`, re-toggle from Admin > Settings).
- **Currency viewer:** `src/utils/currency.js` → `foreignPriceLabel` shows "APPROX $x / £y" (NGN_PER_USD=1500, NGN_PER_GBP=2000). Static rates; update when they drift.
- **Ticket model:** `category === "tickets"` needs eventDateTime + venue. Codes `NWT-XXXXXXXX` minted at finalize. Pass pages `/ticket/:code`. Door Check-In `/admin/check-in`. Don't break sold-out/countdown flow.
- **Storefront visibility rule (per Newman):** `isLiveProduct` hides ONLY hidden (`isPublic === false`). Sold-out stays visible with SOLD OUT badge. Null stock visible.
- **Discount codes (NEW durable):** table `discount_codes` (`id text NOT NULL no default` - client MUST generate id `dc-<ts>-<rand>`, `code` unique upper, `percent_off`/`amount_off`, `active`, `expires_at timestamptz`). RLS is admin-only for the table. Checkout validation goes through SECURITY DEFINER RPC `public.validate_discount(p_code)` (anon/authenticated can execute; returns jsonb `{valid, code, percent_off, amount_off | error, reason}`). Admin API layer maps form shape `{code,type,value,expiresAt,isActive}` to DB columns in `supabaseFunctions.js`; `addDiscountCode` returns `{success, id | error}`. "Go timer"/countdown components must not be touched when editing promo/campaign UI.
- **Key files:** `src/api/supabaseFunctions.js`, `src/pages/Checkout.jsx`, `src/pages/admin/DiscountCodes.jsx`, `src/App.jsx`, `src/context/CartContext.jsx`, `src/utils/shippingRates.js`, `src/utils/currency.js`, `supabase/schema.sql`, `supabase/functions/_shared/email.ts`, `supabase/functions/initialize-payment/index.ts`, `supabase/functions/paystack-webhook/index.ts`, `scripts/verify-dist.mjs`.

## What was built

- Fixed the entire discount-code path (Newman reported it broken launch-day; the `discount_codes` table was EMPTY - every create had failed):
  1. `addDiscountCode`: was inserting with no `id` (NOT NULL violation) and reading `percentOff`/`amountOff` keys the admin page never sends. Now generates the id, maps `type`/`value` to `percent_off`/`amount_off`, returns `{success, id}` / `{success:false, error}` incl. duplicate-code message.
  2. `updateDiscountCode`: was passing admin keys (`type`, `value`, `isActive`) straight into `.update()` (nonexistent columns). Now maps to DB columns; toggle-only updates work.
  3. `fetchDiscountCodes`: now normalizes DB rows to the admin shape (`type`, `value`, `isActive`, ISO `expiresAt`).
  4. `validateDiscountCode`: was a direct `select` on the admin-RLS table, so guests ALWAYS got "Invalid or inactive code". Now calls the new `validate_discount` RPC (created + applied live, granted to anon/authenticated, added to `supabase/schema.sql`).
  5. `DiscountCodes.jsx`: removed Firestore-era `.seconds` timestamp handling (ISO strings now), added error check on update.
  6. Tests: harness gained `setRpc`; 4 rewritten validate tests + 6 new CRUD tests (78 vitest total, was 72).

## Decisions made

- Guest code validation uses a SECURITY DEFINER Postgres RPC instead of loosening RLS or a new edge function: shoppers cannot read/list code rows (no enumeration), exact-match only, active+expiry checked server-side. Matches the schema comment "validate via Edge Function" intent.

## Problems solved

- Launch-day discount outage: three stacked bugs (null id insert, wrong key mapping, RLS-blocked guest validation). Smoke-tested live: inserted a test row via Management API, RPC returned `{valid:true, percent_off:10}` for correct casing/whitespace input, `{valid:false}` for bogus; test row cleaned up. Table left empty for Newman to create his own code.

## Current state

- All gates green: lint zero warnings, 78 vitest, 19 edge, build OK, verify-dist OK, impeccable [].
- Committed `84748e3` "fix: discount codes..." and PUSHED to `main`; GitHub CI (tests + codeql) passed; Vercel auto-deploys from main. Countdown/timer files untouched.
- Newman can now create codes in Admin > Discount Codes and they validate at checkout once the Vercel deploy lands.

## Next session starts with

1. Run `/remember restore`.
2. Confirm Newman created the launch discount and a customer checkout actually applies it (test with a code + check `orders.discount_amount`/`total`).
3. Zone-disable button for delivery fees remains unbuilt (Newman deferred).

## Open questions

- Paystack amount is client-computed at checkout (pre-existing behavior; discounted total sent to Paystack). Consider server-side total recompute in `initialize-payment` as a hardening task.
- Currency viewer rates still static.
