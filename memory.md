# Memory — Nynth-World Store (Launch-day features: free delivery, delivery date picker, currency viewer)

Last updated: 2026-09-25, pre-launch (~6 PM same day)

## Recurring context

- **People (PERMANENT):** Newman (phone 09137207918) is founder/admin/owner. "Newman says X" = direct owner directive. Owner alert inboxes: newmanyange14@gmail.com, nynthworld@gmail.com, primebusiness54@gmail.com.
- **Stack:** React 18 + Vite + Tailwind v4 + react-router-dom v7. Frontend in `frontend/nynth-ecom`. Backend fully Supabase (project `nynth-world`, ref `cybcooychgicsnjeummo`, eu-west-1). `src/api/firebaseFunctions.js` is a one-line alias over `supabaseFunctions.js`. Paystack payments, Resend emails, Cloudinary images, Vercel hosting.
- **Standing user rules (never violate):** no em dashes anywhere (copy, chat, code). Zero `style={{}}` except dnd-kit in Products.jsx. Consume `src/components/ui/` primitives. No new npm deps without explicit approval. Never commit/push unless user says "push". Gate before finishing: `npm run lint` (zero warnings), `npm test`, `npm run test:edge`, `npm run build`, `node scripts/verify-dist.mjs`, `npx impeccable detect --json` on touched UI.
- **Secrets (locations only, never values):** `frontend/nynth-ecom/.secrets/` (gitignored): `supabase.env` (SUPABASE_ACCESS_TOKEN), `paystack.env` (TEST+LIVE keys), `google-oauth.env`, `resend.env`. `frontend/nynth-ecom/.env.local` (gitignored) now holds BOTH live keys (with test keys kept as labeled fallbacks). Server secrets on Supabase project: RESEND_API_KEY, EMAIL_FROM, ADMIN_NOTIFY_EMAIL, PAYSTACK_SECRET_KEY, SUPABASE_* keys. `VITE_PAYSTACK_PUBLIC_KEY` also in Supabase secrets (mirrored).
- **DB writes without MCP:** Supabase MCP is connected to the WRONG project (habits/goals tables, not store). Do NOT use MCP SQL for store data. Instead use the Management API with the access token: `curl -X POST "https://api.supabase.com/v1/projects/cybcooychgicsnjeummo/database/query" -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"query": "..."}'`. SUPABASE_ACCESS_TOKEN lives in `.secrets/supabase.env`.
- **Orders model:** `is_test` stamped from Paystack `domain` field at verify/webhook. Frontend derives test-mode from `VITE_PAYSTACK_PUBLIC_KEY` starting with `pk_test_` (`PAYSTACK_IS_TEST` in supabaseFunctions.js). Test traffic excluded from all metrics. Order `customer` is a jsonb that stores the whole checkout form spread, including new `deliveryDate` + `deliveryTimeWindow`.
- **Delivery fees:** per-product switch `deliveryFeeEnabled` lives in product `data` jsonb; admin toggles it in Products.jsx ("Enable Delivery Fee"). `cartNeedsShipping(items)` in `src/utils/shippingRates.js` returns true when ANY item has the flag !== false. Cart items must carry `deliveryFeeEnabled` (fixed in CartContext so the flag now actually reaches checkout).
- **Free delivery as of today:** ALL non-ticket products have `deliveryFeeEnabled=false` (set via Management API SQL) and `settings.free_delivery_enabled=true` (was false). So every order ships free nationwide. Marquee text already says free shipping.
- **Currency viewer:** `src/utils/currency.js` → `foreignPriceLabel(price)` renders "APPROX $x / £y" under prices (rates NGN_PER_USD=1500, NGN_PER_GBP=2000). Shown in ProductCard (both modes) + ProductDetail (desktop + mobile).
- **Ticket model:** `category === "tickets"` needs eventDateTime + venue. Codes `NWT-XXXXXXXX` minted at finalize. Pass pages `/ticket/:code`. Door Check-In `/admin/check-in`.
- **Storefront visibility rule (per Newman):** `isLiveProduct` hides ONLY hidden (`isPublic === false`). Sold-out (exact-zero stock) stays visible with SOLD OUT badge. Null stock visible.
- **Key files:** `src/api/supabaseFunctions.js`, `src/App.jsx`, `src/pages/Checkout.jsx`, `src/pages/Cart.jsx`, `src/pages/Shop.jsx`, `src/pages/ProductDetail.jsx`, `src/components/products/ProductCard.jsx`, `src/context/CartContext.jsx`, `src/utils/shippingRates.js`, `src/utils/currency.js`, `supabase/functions/_shared/email.ts` (admin sale alert now includes preferred delivery line), `supabase/functions/initialize-payment/index.ts` (reads `PAYSTACK_SECRET_KEY` env), `supabase/functions/paystack-webhook/index.ts` (HMAC-SHA512 verify), `scripts/verify-dist.mjs`.

## What was built (this session, per Newman voice notes)

1. **Free delivery on every product (done for Newman):** set `deliveryFeeEnabled=false` on all 16 non-ticket products via Management API SQL. Fixed CartContext so the flag is copied into cart items (bug: flag never reached checkout before). Checkout effect already zeroes shipping when `!cartNeedsShipping`. Messaging updated: Shop banner now "FREE DELIVERY NATIONWIDE ON EVERY ORDER · CALCULATED AT CHECKOUT"; Cart shipping row says "FREE DELIVERY" / "FREE DELIVERY NATIONWIDE ON EVERY ITEM IN YOUR BAG"; ProductDetail badge shows "FREE DELIVERY NATIONWIDE" per product; Checkout summary shows FREE DELIVERY via new `allItemsFreeDelivery` check. Set `free_delivery_enabled=true` in settings.
2. **Optional preferred delivery date/time picker:** new "Preferred Delivery Date" box in Checkout (physical carts only): date input (min = today) + time-of-day select (morning/afternoon/evening), both optional, stored as `customer.deliveryDate` / `customer.deliveryTimeWindow`. Admin Orders dispatch sheet shows "Preferred: Sat, 26 Sep · MORNING" when set. Owner sale-alert email (`_shared/email.ts` adminHtml) includes a preferred-delivery line.
3. **Currency viewer:** `src/utils/currency.js` + `foreignPriceLabel`; shows "APPROX $x / £y" in smaller text under prices on ProductCard (model + sight modes) and ProductDetail (desktop + mobile). Rates are constants (1500 / 2000) - update when they drift. Tests added in `edge-cases.test.js`.

## Decisions made

- Free delivery implemented via the existing per-product `deliveryFeeEnabled` switch (matches Newman: "I'll just enable free delivery on each product"), NOT zone disabling (explicitly deferred by Newman: "I don't need that one now").
- Zone disable button (bulk-disable delivery fees per zone) is NOT built - Newman said not needed today, all zones enabled.
- Currency viewer shows both USD and GBP ("if it's in dollars or if it's in pounds"), rates hardcoded in one util with no new deps.

## Problems solved

- `deliveryFeeEnabled` never reached checkout: `addToCart` didn't copy the flag into cart items, so `cartNeedsShipping` always saw undefined !== false = true. Fixed in CartContext.
- Supabase MCP points at the wrong project (Atomic Xp tables). Store DB writes go through the Management API SQL endpoint with SUPABASE_ACCESS_TOKEN.

## Current state

- All gates green: lint zero warnings, 72 vitest tests pass, 19 edge tests pass, build OK, verify-dist OK, `npx impeccable detect --json` = [].
- Launching today ~6 PM. No code push done (not requested). Vercel deploy needed for the new frontend changes to go live.
- Waiting on Newman's confirmation that these features match; zone-disable remains a future build.

## Next session starts with

1. Run `/remember restore`.
2. Confirm launch happened; if Newman wants the zone-disable button later, build it in Settings.jsx (bulk disable delivery fee per zone, carts still see zones but no fee).
3. Deploy: Vercel redeploy for frontend; edge function `_shared/email.ts` change requires redeploying edge functions that use it (paystack-verify / paystack-webhook).

## Open questions

- Should the currency viewer show a live/updated rate? Rates are static constants right now.
- Whether Newman wants free delivery to eventually be per-zone controllable (the "disable zone" idea he deferred).