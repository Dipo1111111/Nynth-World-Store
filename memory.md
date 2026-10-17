# Memory - Nynth World Store (handoff: build the rest of the platform brief)

Last updated: 2026-10-17 17:15 (Africa/Lagos)

## Read this first: handoff instructions

Owner's full platform brief (13 pages, roles, ticketing, permissions, revenue separation):
`/Users/igbojuwooladipupo/Downloads/NYNTH WORLD PLATFORM .pdf`

You are picking this up because the previous session shipped the copy and revenue asks and stopped short of the permissions build. Your job is to finish the brief.

1. Read the PDF end to end and write your own requirement list. Do not trust the summary below as complete. The previous agent may have missed things, and the brief is the authority.
2. Confirm the Supabase MCP is live before you start: enabled in `~/.config/opencode/opencode.json` and `~/.config/opencode/opencode.jsonc`, `project_ref=cybcooychgicsnjeummo` (project `nynth-world`, eu-west-1), `read_only=false`. Run `opencode mcp list`. If it says "needs authentication", run `opencode mcp auth supabase` and finish the browser login. It previously pointed at the wrong project (`llwlgzujsyxlseiqiwsp`, Atomic Xp); that is fixed, but verify the ref before you run any SQL.
3. Inspect the live schema before writing migrations. `supabase/schema.sql` is a snapshot, and the external developer (pobbagency@gmail.com) has created tables by hand, so the file and the database can disagree.
4. Build what is missing, frontend plus database, with the rules enforced in Postgres (RLS, security definer functions), not only in React.
5. Run the full gate before pushing: `npm run lint`, `npm test`, `npm run test:edge`, `npm run build`, `node scripts/verify-dist.mjs`.
6. Commit and push to `main` when green. Dipo has authorised the push for this batch. Vercel auto-deploys; verify the live bundle after the deploy.
7. Update this memory.md when you are done.

Hard rules (do not break):

- No em dashes anywhere, in copy, code, or commits.
- No `style={{}}` in new code except dnd-kit in Products.jsx.
- No new npm dependencies without asking.
- The shop is LIVE. Migrations only. No `drop table`, no bulk rewrite of existing orders. Additive schema changes and RLS policies.
- Do not modify anything under `Documents/dipo-bench/`. That tree is a read-only benchmark fixture.
- Never put secrets in this file.

## What has already shipped (do not redo)

Pushed to `main`, latest `e0693aa` / `5389706`. Live and verified in the served bundles.

- The "7 DAYS RETURN POLICY" badge is gone from both product page layouts.
- The SHIPPING & RETURNS panel is editable: per product (`product.productNote`, `product.productNoteTitle`) then store default (`settings.product_note_text`, `product_note_title`) then `DEFAULT_PRODUCT_NOTE`. `settings.product_note_enabled === false` hides it. Logic in `src/utils/productCopy.js`, rendered at `ProductDetail.jsx:212`, `ProductDetail.jsx:483`, `ProductDetail.jsx:719`.
- Admin surfaces: Settings > Product page (`Settings.jsx:535`), Products > Edit (`Products.jsx:663`).
- `/shipping` return policy comes from `settings.returns_page_policy`; empty string hides the block (`ShippingReturns.jsx:10`).
- Revenue privacy: `settings.revenue_display = { hide_by_default, override }`. Dashboard Net sales masks to `****.***`, eye reveals, manual figure shows a red dot. `src/components/admin/RevenueValue.jsx`, `AdminDashboard.jsx:295`, controls at `Settings.jsx:611`.
- Tests: 123 vitest, 19 deno edge, build and verify-dist green.

## What is still missing (previous audit, verify it yourself)

1. Roles and permissions. `users.role` only allows `admin|customer` (`supabase/schema.sql:21`). No Vice Admin, Ticket Admin, Ticket Staff. No per-user permission toggles. `ProtectedRoute` only checks `requireAdmin` (`src/components/ProtectedRoute.jsx:5`), and there is no enforcement below the UI.
2. Per-event scoping. Events and ticket orders have no organizer id, so a Ticket Admin cannot be confined to one event.
3. Staff management UI. No Add User by email, no role assignment, no way to appoint a director for an external ticket section.
4. Atomic ticket verification. `markTicketUsed` (`src/api/supabaseFunctions.js:86`) reads, checks, then writes from the client. Two staff at once can both pass. Replace with one `security definer` Postgres function that checks and marks in a single statement, and call it from `CheckIn.jsx`.
5. Ticket state separation. Payment is only `pending|paid|failed` (`supabase/schema.sql:76`). No refunded, no ticket status (valid, cancelled, revoked), no separate entry status. The `used` flag lives inside the `orders.tickets` jsonb.
6. Landing split: Store box and Ticket box, each image uploadable from admin. Not built; `/` still redirects to `/shop`.
7. Organizer revenue separation, NYNTH commission, fees, refunds owed. Everything lands in one orders ledger.

Suggested order: 4 and 5 first (small, security critical), then 1 to 3 as one connected build, then 6 and 7.

Recommended shape for 1: a `staff_roles` table (user id, role, scoped event ids, created_at) rather than widening `users.role`. It is the only shape that supports per-event scoping. Pair it with helper functions used by RLS policies, and keep `is_admin()` for the founder.

## Recurring context

- Founder and owner: Newman (09137207918). Owner alerts: newmanyange14@gmail.com, nynthworld@gmail.com, primebusiness54@gmail.com. Newman sends fragmented WhatsApp and voicemail requirements; interpret them into concrete edits. Dipo (the user) approves before ambiguous batches go out.
- Newman's design line: "Easy, clean, minimal, but exceptional."
- Stack: React 18 + Vite + Tailwind v4 + react-router-dom v7, frontend in `frontend/nynth-ecom`, backend fully Supabase (`cybcooychgicsnjeummo`), Paystack, Resend, Cloudinary, Vercel.
- `src/api/firebaseFunctions.js` is a one-line alias over `supabaseFunctions.js`.
- Live site: `https://www.nynthworld.com`. Verify a deploy by fetching the served entry bundle and grepping for a string unique to the change. Generic strings give false positives. Deploy takes 1 to 3 minutes.
- Supabase MCP used to point at the wrong project. Use the connection only after checking the project ref in the URL.
- Management API fallback if the MCP fails: `POST https://api.supabase.com/v1/projects/cybcooychgicsnjeummo/database/query` with the token in `frontend/nynth-ecom/.secrets/supabase.env`. Never commit or echo that token.
- Stale tabs: after a push, old tabs keep old JS. Hard refresh before believing a bug report.
- Orders model: `orders.customer` jsonb stores the whole checkout form. `is_test` comes from the Paystack domain and test traffic is excluded from metrics.
- Lock and drop model: `settings.data` holds `lock_page_enabled`, `lock_epoch`, `lock_password`, `launch_date`. `collections` (written by the external dev) with `status='live'` marks the active drop. `lock_epoch` force-relock must stay intact.
- Discount codes: `discount_codes`, guest check via `public.validate_discount(p_code)`. `MEMBER` expired 2026-10-04.
- Key files: `src/pages/admin/Settings.jsx`, `src/pages/admin/Products.jsx`, `src/pages/admin/AdminDashboard.jsx`, `src/pages/ProductDetail.jsx`, `src/pages/CheckIn.jsx`, `src/pages/admin/Events.jsx`, `src/api/supabaseFunctions.js`, `src/context/AuthContext.jsx`, `src/components/ProtectedRoute.jsx`, `supabase/schema.sql`, `supabase/functions/`.

## Decisions made

- Policy copy is data, not code: defaults in utils, edits in `settings.data`, so Newman changes wording without a deploy.
- Product note: per product beats store default beats built-in. Whitespace-only counts as unset. Empty `/shipping` policy hides the block (different intent from the product panel, intentional).
- A manual revenue figure is a display setting only. The ledger stays truthful for orders, reports, and emails. The red dot is the tell.
- Reveal state is not persisted, so every load starts masked.
- Tests: no jsdom in the repo, so new tests are pure-function tests plus static source-wiring guards.

## Problems solved

- ProductDetail had the shipping and returns copy duplicated for desktop and mobile; both now share one resolver.
- `react-hooks/set-state-in-effect` rejected an effect that synced reveal state. Fixed by deriving `revealChoice ?? !hideByDefault`.
- Standing rules caught em dashes in admin copy and a `style={{}}` in RevenueValue before commit.
- `npx impeccable detect --json` returns `[]`, but the CLI is not a project dependency and downloads on demand.

## Current state

- Working tree has `memory.md` modified (this handoff) and nothing else. All code is committed and pushed.
- Live: no 7-day badge, editable panel, masked revenue with manual figure option.
- Not live: everything in the missing list above.

## Open questions

- Whether to widen `users.role` or add `staff_roles`. Recommendation is `staff_roles`.
- Whether Newman wants a per-product panel title or only the body text. Both are wired now; drop the title field from the product form if it is noise.
- Whether the external dev's tool reads `collections` with the anon key (sees passwords) or direct SQL.
