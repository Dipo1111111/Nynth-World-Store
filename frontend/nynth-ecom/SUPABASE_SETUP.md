# Supabase cutover — what the admin needs to give you (plain English)

No code changes needed from you. Just collect these 5 things from the site owner:

## 1. Supabase project (owner creates it under THEIR account)
- Owner goes to supabase.com > New project > name `nynth-world`, region `EU West (Ireland)`.
- Then Settings > API: copy `Project URL` (= VITE_SUPABASE_URL) and `anon public key` (= VITE_SUPABASE_ANON_KEY) and `service_role secret` (= SUPABASE_SERVICE_ROLE_KEY, click Reveal).
- Why theirs not yours: billing + ownership stays with the business. Professional.

## 2. Firebase service-account JSON (to copy old products/orders over)
- Firebase Console > Project settings (gear) > Service accounts > Generate new private key. Sends a `.json` file.
- Paste its contents into env var FIREBASE_SERVICE_ACCOUNT_JSON when running the migration script. One-time use.

## 3. Paystack keys
- dashboard.paystack.com > Settings > API Keys: `sk_...` (secret, server) + `pk_...` (public, frontend).
- Webhook URL to set LATER (after deploy): `https://YOUR_PROJECT_REF.supabase.co/functions/v1/paystack-webhook`.

## 4. Resend — domains explained simply
- You already have an API key (`re_...`). That is enough for TESTING.
- "Domains" only matters for the FROM address: until the owner verifies `nynthworld.com` in Resend > Domains (add 3 DNS records at their domain registrar), emails can ONLY be sent from `onboarding@resend.dev` to the Resend account owner's inbox.
- So: keep `EMAIL_FROM=NYNTH WORLD <onboarding@resend.dev>` for now. After the owner verifies the domain, switch to `sales@nynthworld.com`.
- `ADMIN_NOTIFY_EMAIL` = owner's inbox that gets "New sale" alerts.

## 5. Google login (optional)
- Only if keeping "Login with Google": Google Cloud Console > APIs & Services > Credentials > OAuth client: copy Client ID + Secret. Add redirect `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` in both Google + Supabase Auth > Providers > Google.

## Files already written (local only, placeholders — nothing applied remotely)
- `supabase/schema.sql` — run in Supabase SQL editor at cutover
- `supabase/functions/*` — 5 Edge Functions (deploy with `supabase functions deploy`)
- `src/api/supabase.js` + `src/api/supabaseFunctions.js` — same function names as Firebase version
- `src/context/AuthContext.supabase.jsx` — rename to AuthContext.jsx at cutover
- `scripts/migrate-firestore-to-supabase.mjs` — one-time data copy
- `.env.supabase.example` — fill at cutover

## Re-auth note
Yes — when the owner creates their own Supabase account, run `/supabase` again + `opencode mcp auth supabase` and restart. That swaps the MCP login to their project.
