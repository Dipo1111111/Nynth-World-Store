# CLAUDE.md

Project-specific context for agent work in this repo. Read `CODEBASE.md` for the full map
(route table, API layer, edge functions, configs).

## What this is
**NYNTH World Store** — a minimal-luxury streetwear storefront + admin panel in one React SPA.
Backend is fully Supabase (Postgres + RLS + Deno Edge Functions). No Firebase code remains;
`src/api/firebaseFunctions.js` is a one-line alias over `supabaseFunctions.js`.

## Conventions
- **Design language (non-negotiable for UI work):** ink `#0c0c0c`/`#0a0a0a` on white, hairline
  `border-black/[0.06]`, `bg-black/[0.02]` fills, elevation via `shadow-card` / `shadow-card-hover` /
  `shadow-raised`, tinted status chips (emerald/amber/rose/sky/violet/slate `*-50` bg + `*-100`
  border + `*-600/700` text), `text-[10px] font-bold uppercase tracking-widest` micro-labels,
  `rounded-lg`/`rounded-xl`, `.focus-ring` on every interactive element. **No gray border/bg
  tokens (`gray-100/200/300`, `bg-gray-50`, `shadow-sm`) — they were all replaced.**
- **Never use inline `style={{…}}` for design.** The only sanctioned exceptions are the dnd-kit
  drag `style` objects in `src/pages/admin/Products.jsx` (`SortableMobileCard`/`SortableDesktopRow`).
  For shared styling, add classes to the token layer (`src/index.css` / `src/styles/globals.css`).
- **Consume the existing primitives** (`src/components/ui/` button/card/badge/select/table) rather
  than re-inventing. Keep the tweaks additive.
- **No new dependencies** unless the user explicitly approves. Current animation stack is CSS +
  GSAP (`src/lib/motion.js`), charts via Chart.js (`src/lib/charts.js` reads CSS tokens).
  If a new animation/chart is needed, extend those libs — do not pull in framer-motion etc.
- Admin pages are lazy-loaded behind `ProtectedRoute requireAdmin` in `src/App.jsx`; keep them
  route-importable as named exports.

## Business rules that must be respected
- **LIVE vs TEST orders:** Paystack test traffic is badged `TEST` and *excluded* from all admin
  metrics (dashboard, Orders, abandoned-checkouts). Never count `isTest` orders in revenue/AVG.
- **Currency:** ₦ (kobo amounts in Paystack calls — the edge functions convert).
- **E-tickets:** products with `category === "tickets"` need `eventDateTime` + `venue`; ticket
  codes are generated for paid orders and emailed. Don't break the sold-out/countdown flow.
- **Lock page:** `lock_page_enabled` + `lock_epoch` force-relock everyone who unlock; must stay
  invertible so admins can always see the site while locked.
- **Presence tracking:** `src/App.jsx` upserts/removes a `presence` row per browser session; a
  heartbeat keeps it alive. Don't break the cleanup path.
- **Payments:** `initialize-payment` → Paystack popup → `verifyOrderPayment` + `paystack-webhook`
  server-side. Orders start `pending`. Shipment/status updates go through `StatusDropdown` and
  `updateOrderStatus`.

## Verification (run these before finishing)
```bash
npm run lint       # ESLint — zero-warning policy, gated in CI
npm test           # Vitest: 20 tests
npm run test:edge  # Deno: 8 edge-function tests
npm run build      # Vite production build
```
Tests are kept green alongside the redesign; update `src/api/supabaseFunctions.test.js` when the
API layer changes, and `supabase/functions/*/index_test.ts` when an edge function changes.

## Contact / deployed services
- Pushed to a git remote from this repo; CI gates lint + tests. Live deploy: Vercel.
- Supabase project reference: `cybcooychgicsnjeummo`.
- Secrets live in `.secrets/supabase.env` (`SUPABASE_ACCESS_TOKEN`) — never commit it.
- Paystack is still in TEST mode; the production webhook is not yet wired in the Paystack dashboard.
- Resend domain verification is in progress; `EMAIL_FROM` in `_shared/email.ts` must be a verified
  address (current value is malformed — `NYNTHWORLD<onboarding@resend.dev>` needs a space).