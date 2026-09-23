# Supabase — setup & operations (cutover complete)

The Firebase → Supabase migration is **done**. The store runs on one Supabase project; this doc is what exists, what was deployed, and what operations remain. Local-only `.secrets/` and `.env.local` never get committed.

## The project

| | |
|---|---|
| Project name | `nynth-world` |
| Ref | `cybcooychgicsnjeummo` |
| Region | `eu-west-1` (EU West, Ireland) |
| Project URL | `https://cybcooychgicsnjeummo.supabase.co` |

## Schema

`supabase/schema.sql` holds the full schema (tables + Row Level Security + helpers). It was applied once in the Supabase SQL editor at cutover. Tables: `users`, `products`, `orders`, `discount_codes`, `subscribers`, `settings`, `lookbooks`, `contact_messages`, `analytics_counters`, `presence`.

- **RLS:** `products` are public-read; writes are admin-only. Stock decrement on a paid order happens server-side (Edge Function, `service_role` bypasses RLS) — there is no anon write anymore.
- **Settings** live in the `settings` table under row `id = 'site_config'` — the admin panel edits them through `updateSettings()`. This includes `support_email`, `support_whatsapp`, `disabled_locations`, and `custom_shipping_locations`.

## Edge Functions

Five Deno Edge Functions in `supabase/functions/`, all deployed and active on the live project:

| Function | Job |
|---|---|
| `paystack-webhook` | Verifies `x-paystack-signature` HMAC, finalizes paid orders, mints `NWT-` ticket codes, decrements stock (idempotent), sends customer + admin emails |
| `paystack-verify` | Same finalization path driven by the frontend after the Paystack popup returns |
| `initialize-payment` | Creates the Paystack transaction |
| `send-bulk-email` | Newsletter / bulk sends via Resend |
| `get-ga4-analytics` | Reads GA4 data for the admin dashboard charts |

Deploy one (or all):

```bash
supabase functions deploy paystack-webhook --project-ref cybcooychgicsnjeummo --legacy-bundle --no-verify-jwt
```

Secrets set on these functions: `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Frontend wiring

`src/api/supabase.js` builds the client from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`. `src/api/supabaseFunctions.js` is the data layer; `src/api/firebaseFunctions.js` is a zero-churn alias (`export * from "./supabaseFunctions"`). Auth runs on Supabase Auth via `src/context/AuthContext.jsx`.

Local dev: copy `.env.supabase.example` to `.env.local`, fill the `VITE_` values from the project dashboard, and use `pk_test_...` if you want Paystack test mode.

## Outstanding operations (blocked on the owner)

1. **Paystack production webhook** — set in Paystack dashboard → Settings → Webhooks: `https://cybcooychgicsnjeummo.supabase.co/functions/v1/paystack-webhook`. Until it's set, payments that succeed outside the Paystack popup won't be finalized.
2. **Resend domain** — until `nynthworld.com` is verified in Resend (3 DNS records), email can only be sent from `onboarding@resend.dev` to the account owner's inbox. After verification, set `EMAIL_FROM` to `sales@nynthworld.com`.
3. **Google login (optional)** — only if kept: add Supabase callback `https://cybcooychgicsnjeummo.supabase.co/auth/v1/callback` to Google Cloud Console, and set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` on Supabase.

Supabase MCP is connected via `https://mcp.supabase.com/mcp` for both OpenCode and Claude Code.