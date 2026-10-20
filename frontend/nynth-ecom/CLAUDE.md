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
- **Consume the existing primitives** rather than re-inventing. The storefront uses
  `src/components/ui/` (button/card/badge/select/table). The admin uses
  `src/components/admin/` (`AdminButton`, `AdminCard`, `AdminBadge`, `AdminInput`,
  `AdminModal`, `PageHeader`, `StatCard`, `Toggle`). Keep the tweaks additive.

## UI hard rules (do not break)

- **Never write a new button, card, badge, input, modal, switch, chip or status colour.**
  The admin has one of each, in `src/components/admin/`. Reach for those before anything
  else. A new one is only written when the founder asks for it by name, and it goes in that
  same folder with the same props API so the next page can use it too. This is the rule that
  stops the admin drifting back into nine pages that each invent their own button.
- **Never hardcode a style into a component.** No raw colour, no raw radius, no raw pixel
  value in a `className`. Every value comes from a token (`--admin-*`, `--tint-*`) or from a
  utility class that already exists. If a page needs a value that does not exist yet, add it
  to `src/index.css` as a reusable token or class first, then use it. The storefront follows
  the same rule with its own tokens.
- **A value that appears twice is a token.** A value that appears once may stay inline only
  when it is content and not a style, a name, a price, a date.
- **The theme owns the colour.** A hardcoded white is white on white on the paper admin and
  the panel silently disappears. A raw Tailwind palette value such as `text-slate-300` is a
  dark theme value and is unreadable on paper. `src/utils/adminSystem.test.js` fails the
  build on both, and on a radius outside the scale. That test is the enforcement, not a
  suggestion.
- **One radius language.** 12px (`rounded-xl`) for a card, a modal, a panel. 8px
  (`rounded-lg`) for a button, an input, an icon button. 4px (`rounded`) for a small text
  chip or a badge. Full (`rounded-full`) for a switch, a dot, an avatar. Nothing sharp and
  nothing at 2, 6, 16 or 24px.
- **One type ramp.** 40px page title, 18px section title, 14px group heading, 13px field
  label, 12px description, 11px hint, 10px micro label. The caps are the brand voice and
  they stay on labels, buttons, tabs and chips. They are never on a sentence.
- **One spacing rhythm.** 32px card to card, 20px group to group, 12px group heading to its
  controls, 8px label to its control, 4px control to the hint under it.
- **Consistency is mandatory.** Every admin tab is one product. One surface material, one
  radius language, one type ramp, one spacing rhythm, one behaviour per control, in both
  themes. Hierarchy comes from size, depth and spacing, never from a new material or a
  second component style, so consistency does not mean flattening everything to one size.
- **Every design decision goes through impeccable.** When a task touches styling, load the
  `impeccable` skill and run `impeccable context --target <file>` before editing, then the
  reference for the command you are running (polish, layout, typeset, audit, critique).
  Use `npx impeccable detect` as the mechanical check. A clean scan proves nothing broke,
  not that the design is good.
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
- Resend domain verification is in progress; `EMAIL_FROM` in `_shared/email.ts` must be a verified
  address (current value is malformed — `NYNTHWORLD<onboarding@resend.dev>` needs a space).