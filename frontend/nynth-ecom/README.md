# NYNTH World Store

Minimal-luxury streetwear storefront. Sharp, black/white, typography-led — the public storefront and the admin panel share one codebase.

> **Docs:** [`CODEBASE.md`](./CODEBASE.md) maps the whole repo (routes → pages, API layer, edge functions, configs). `CLAUDE.md` holds project-level agent context.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v4 + react-router-dom v7 |
| Backend | Supabase (Postgres + Row Level Security + Deno Edge Functions) |
| Payments | Paystack (frontend popup + server-side webhook/verify) |
| Email | Resend (transactional + admin sale alerts) |
| Images | Cloudinary |
| Hosting | Vercel (`vercel.json` SPA rewrite) |
| Analytics | GA4 (`react-ga4`) + Edge Function `get-ga4-analytics` | 

The backend is fully on Supabase. No Firebase code remains — `src/api/firebaseFunctions.js` is a one-line alias that re-exports `supabaseFunctions.js` (kept so existing import paths stay valid).

## Scripts

```bash
npm run dev        # Vite dev server
npm run build      # Production build
npm run preview    # Preview the production build
npm run lint       # ESLint (must pass with 0 warnings - gated in CI)
npm test           # Vitest unit tests (frontend)
npm run test:edge  # Deno tests for the Edge Functions
npm run test:all   # Frontend + Edge Function tests
```

CI (`.github/workflows/test.yml`) runs lint → unit tests → build on every push and PR. `.github/workflows/codeql.yml` runs CodeQL SAST.

## Project layout

```
src/
  api/            supabase.js (client), supabaseFunctions.js (data layer), firebaseFunctions.js (alias), cloudinary.js
  components/     storefront + admin components, cart drawer, newsletter popup
  pages/          storefront pages (Shop, ProductDetail, Checkout, ThankYou, ...)
  pages/admin/    admin panel (Orders, Products, Settings, DiscountCodes, Subscribers, Lookbooks, AbandonedCheckouts, AdminDashboard)
  context/        AuthContext (Supabase Auth), CartContext
  utils/          shippingRates, monitoring (Sentry stubbed + GA4), ...
  data/           locationData, etc.
supabase/
  schema.sql      full Postgres schema (tables, RLS, triggers) - apply once in the SQL editor
  functions/      Deno Edge Functions (paystack-webhook, paystack-verify, initialize-payment, send-bulk-email, get-ga4-analytics)
```

### Routes

- Storefront: `/shop`, `/product/:id`, `/lookbook`, `/cart`, `/checkout`, `/thank-you`, `/login`, `/signup`, `/forgot-password`, `/account`
- Info: `/shipping`, `/returns`, `/contact`, `/our-story`, `/sustainability`, `/privacy-policy`, `/terms-of-service`, `/403`, `/500`
- Admin (role-protected): `/admin` dashboard, `/admin/orders`, `/admin/products`, `/admin/settings`, `/admin/discount-codes`, `/admin/subscribers`, `/admin/lookbooks`, `/admin/abandoned-checkouts`
- `/` and `/home` redirect to `/shop`. When the site is globally locked (a `settings.lock_epoch` toggle in admin), all storefront routes show `LockPage` except `/waitlist-confirmation`; admins bypass the lock via their role + matching epoch.

## Environment variables

Copy the annotations in `.env.supabase.example` to `.env.local`. Frontend (Vite `VITE_`-prefixed, build-time):

- `VITE_SUPABASE_URL` — `https://<project-ref>.supabase.co`
- `VITE_SUPABASE_ANON_KEY` — anon publishable key
- `VITE_PAYSTACK_PUBLIC_KEY` — `pk_live_...` (use `pk_test_...` for test mode)
- `VITE_SITE_NAME`, `VITE_SUPPORT_EMAIL`, `VITE_ADMIN_EMAILS` (admin role whitelist), `VITE_GA_MEASUREMENT_ID` (optional)

Server-side (Edge Function secrets / Supabase dashboard):

- `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`

Google OAuth only if login-with-Google is kept: `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` on Supabase + Google Cloud Console.

Up-to-date: see `SUPABASE_SETUP.md`. Brand/product/design context: `PRODUCT.md`, `DESIGN.md`. Session state: root `../../memory.md`.

## Testing

- `src/api/supabaseFunctions.test.js` — Vitest unit tests for the data layer (17 tests).
- `supabase/functions/*/index_test.ts` — Deno tests for the Edge Functions (8 tests).