# Memory - Nynth World Store (platform brief is built; next session is polish and hardening)

Last updated: 2026-10-17 17:50 (Africa/Lagos)

## Recurring context

- Founder and owner: Newman (09137207918). Owner alerts: newmanyange14@gmail.com, nynthworld@gmail.com, primebusiness54@gmail.com. Newman sends fragmented WhatsApp and voicemail requirements; interpret them into concrete edits. Dipo (the user) approves before ambiguous batches go out.
- Newman's design line: "Easy, clean, minimal, but exceptional."
- Stack: React 18 + Vite + Tailwind v4 + react-router-dom v7, frontend in `frontend/nynth-ecom`, backend fully Supabase (`cybcooychgicsnjeummo`), Paystack, Resend, Cloudinary, Vercel.
- `src/api/firebaseFunctions.js` is a one-line alias over `supabaseFunctions.js`. Imports still say firebaseFunctions; that is intentional, do not rename.
- Live site: `https://www.nynthworld.com`. Verify a deploy by fetching the served entry bundle and grepping for a string unique to the change. Generic strings give false positives. Deploy takes 1 to 3 minutes.
- Supabase MCP works, but `execute_sql` runs as a superuser and therefore **bypasses RLS**. To test a policy, wrap the query: `begin; select set_config('request.jwt.claims','{"sub":"<uuid>","email":"...","role":"authenticated"}',true); set local role authenticated; select ...; rollback;` The `sub` must be a real uuid, `auth.uid()` casts to uuid, a Firebase-style id throws 22P02.
- Management API fallback if the MCP fails: `POST https://api.supabase.com/v1/projects/cybcooychgicsnjeummo/database/query` with the token in `frontend/nynth-ecom/.secrets/supabase.env`. Never commit or echo that token.
- Supabase had a ~20 minute 502 outage on 2026-10-17 evening affecting both the MCP and the management API. Retry, do not panic-migrate.
- Stale tabs: after a push, old tabs keep old JS. Hard refresh before believing a bug report.
- Orders model: `orders.customer` jsonb stores the whole checkout form. `is_test` comes from the Paystack domain and test traffic is excluded from metrics. Live paid revenue is currently ₦1,060 across 16 paid orders (35 store orders, 6 ticket orders out of 41).
- Lock and drop model: `settings.data` holds `lock_page_enabled`, `lock_epoch`, `lock_password`, `launch_date`. `collections` (written by the external dev, currently empty) with `status='live'` marks the active drop. `lock_epoch` force-relock must stay intact.
- Discount codes: `discount_codes`, guest check via `public.validate_discount(p_code)`. `MEMBER` expired 2026-10-04.
- Founders in `users` are `nynthworld@gmail.com` and `primebusiness54@gmail.com`, both with duplicate rows (Firebase uid and Supabase uuid formats, one of each). Do not dedupe without asking.
- Key files: `src/utils/permissions.js`, `src/context/AuthContext.jsx`, `src/components/ProtectedRoute.jsx`, `src/api/supabaseFunctions.js`, `src/pages/admin/StaffAccess.jsx`, `src/pages/admin/TicketPlatform.jsx`, `src/pages/admin/CheckIn.jsx`, `src/pages/admin/Events.jsx`, `src/pages/admin/Settings.jsx`, `src/pages/Landing.jsx`, `supabase/migrations/`, `supabase/functions/_shared/eventTickets.ts`.

## Hard rules (do not break)

- No em dashes anywhere, in copy, code, or commits.
- No `style={{}}` in new code except dnd-kit in Products.jsx.
- No new npm dependencies without asking.
- The shop is LIVE. Migrations only. No `drop table`, no bulk rewrite of existing orders. Additive schema changes and RLS policies.
- Do not modify anything under `Documents/dipo-bench/`. That tree is a read-only benchmark fixture.
- Never put secrets in this file.

## What shipped this session (commits 345beca, a3dff90, 7edc426, pushed and verified live)

The whole platform brief is now built. Do not redo any of it.

1. Roles and permissions. `public.staff_roles` (id, user_id, email, full_name, department, role, permissions jsonb, event_ids text[], status, notes, invited_by, last_seen_at). Roles: `vice_admin`, `ticket_organizer`, `ticket_admin`, `ticket_staff`. `users.role` is untouched and is still founder-or-customer.
2. Per-event scoping. `event_ids` on the staff row, enforced by `can_access_event()` and `order_touches_my_events()` inside RLS. Swapping an event id in a URL gets nothing.
3. Staff management UI. `/admin/staff`, founder only. Add by email, department, role, per-permission toggles, event assignment, revoke and delete. Also appoints the director of each ticket section.
4. Atomic ticket verification. `public.verify_ticket_entry(code)` does the check and the mark in one statement. Proved it: two calls on one code give `verified` then `already_used` with the original timestamp and staff email. Replaced both client-side race holes, in `CheckIn.jsx` and in the public `TicketPass.jsx`.
5. Ticket state separation. `public.event_tickets` with `payment_status` (pending/paid/failed/refunded), `ticket_status` (valid/cancelled/revoked), `entry_status` (unused/used) on separate axes. Backfilled from `orders.tickets` jsonb; the one already-used legacy ticket kept its history.
6. Landing split. `/` is now `Landing.jsx`, two boxes, store and ticket, each image uploadable from Settings > Landing. `/tickets` lists events.
7. Revenue separation. `orders.sales_channel` plus organizer, commission, fee, refund, and net columns. `event_finance` view (security_invoker) aggregates per event. `/admin/ticket-platform` shows collected, fees, refunds, NYNTH commission, and owed to organizer, with clothing revenue alongside for contrast.

Also: admin nav, routes, and the dashboard finance block all key off permissions now. `paystack-webhook` and `paystack-verify` both call `syncEventTickets()` so new sales appear at the door without a backfill.

Gate at 7edc426: lint clean, 173 vitest, 27 deno edge, build green, verify-dist green.

Two defects were found by a deliberate cross-check after the first "done" report and fixed:
the dropped test-ticket gate (a3dff90) and the ungated CRUD buttons (7edc426). The first
"it is done" claim was not accurate on either count.

## Decisions made

- `staff_roles` keyed by email rather than a widened `users.role`. Only that shape supports per-event scoping and email-first invitations.
- Permissions are role defaults plus a per-person override map, `defaults || overrides`, both in `staff_role_defaults()` and in `effectivePermissions()`. A later change to a role's defaults is not frozen by an old override. `permissions.test.js` parses the migration file and fails if the JS and SQL disagree.
- `staff.manage` and `store.finance.view` are in no role's defaults. Only the founder ever holds them, because the brief says nobody should exceed the Main Admin and the Vice Admin is explicitly shut out of finances.
- The founder is never a `staff_roles` row. `is_admin()` short circuits every check, and `can()` returns true for everything.
- `event_tickets` is a new normalized table, not a reshape of the jsonb. The jsonb stays the source of truth for the buyer's email; the table is the ledger the door reads.
- Verification goes through a Postgres function only. `event_tickets` has a select policy and deliberately no insert/update/delete policy, so a staff member cannot flip a payment status from the browser console.
- Money columns on `orders` are column-level revoked from anon and authenticated. `assign_event_organizer()` is founder-only, matching "only the admin can add people to the ticket section".
- The landing page ships enabled. Set `settings.data.landing.enabled = false` to send `/` straight to the shop as before.

## Problems solved

- Supabase 502 outage mid-session. Fell back to the management API, then resumed when it recovered.
- **The Check-In rewrite silently dropped the test-ticket gate.** Replacing the client-side `isTest` check with `verify_ticket_entry()` did not carry the rule into the function, so a Paystack test ticket became admissible. Every ticket in the DB is test traffic, so this was wide open. Fixed in the function (migration `20261017190000_verify_ticket_blocks_test.sql`, is_test checked before the paid check) and the test panel was restored in CheckIn.jsx. `permissions.wiring.test.js` guards it. Lesson: when a rewrite moves a rule from the client into a function, enumerate the rules the client used to enforce and move each one.
- Broadening admin routes from founder-only to permission-based exposed Add/Edit/Delete/status/send-email buttons to Vice Admins. Postgres always blocked them, but the brief's "monitor, not edit" means the buttons should be hidden. Gated on `can()` in Products, Orders, DiscountCodes, Subscribers, Lookbooks, plus a `canManageProduct` helper in AuthContext.
- The SQL backfill failed first time round: `jsonb_array_elements` yields `jsonb`, so `t.code` does not exist. Needs `t ->> 'code'`.
- `auth.uid()` casts to uuid, so simulating a session with a Firebase-format id throws 22P02 inside `is_admin()`. Use a real uuid in the test claims.
- **Batched `execute_sql` calls are unreliable for RLS testing.** A loop of queries inside one `begin ... set local role authenticated ...` returned mutually impossible results in a single batch (an organizer appearing to see 174 subscribers AND 0 tickets). Re-running each as its own independent statement gave a consistent, correct matrix. Always run each permission probe as its own query and await it; do not trust a batched loop for RLS results.
- To check whether a change is live, grep the served bundle for a **string literal** (`store.orders.manage`), not a local variable name (`canManageOrders`), because production builds mangle the latter.
- `roleDefaults()` originally returned an array-shaped object and the tests wanted keys. Split into `roleDefaults()` (map) and `rolePermissionKeys()` (list).
- `permissions.wiring.test.js`'s own first draft listed TicketPlatform as in-page gated; its own test caught that TicketPlatform is read-only and route-gated, which is the correct shape. Let the tests correct the plan.

## Verification matrix (confirmed live, each probe an independent statement)

- Ticket organizer scoped to one event: sees that event's 4 tickets, 0 subscribers, 0 staff rows, only their own purchases as a buyer, cannot manage clothing, cannot see finance.
- Vice Admin: sees 0 tickets (no event scope), 0 ticket orders (only their own), cannot manage orders, cannot manage staff, cannot write settings.
- Two doors, one code: first call `verified`, second `already_used` carrying the original timestamp and staff email.
- Test ticket: `verify_ticket_entry` returns reason `test`, before the paid check.
- Founder (`is_admin`): unchanged, holds everything.

## Current state

- Working tree clean, everything committed and pushed to `main` at 345beca. Live bundle verified to contain the new code and both new lazy chunks serve.
- `staff_roles` is intentionally empty. No staff have been added yet; the founder does that from `/admin/staff`.
- All 4 existing event tickets are Paystack test traffic (`is_test = true`), so `event_finance` legitimately shows zero rows and Ticket Platform renders its empty state.
- `settings.data.landing` is `{enabled: true}` with no images yet, so the landing page currently shows two clean blocks with no artwork.
- `presence_read_any` was left in place even though it is loose, because the external dev's tool may read that table.

## Next session starts with

- Nothing is blocked. The brief is done. Ask Dipo what to pick up next, or start on:
  - The external dev's `collections` / drop tool, which has never been reconciled with these permissions and may still write as an admin.
  - Adding real staff accounts so the role system can be exercised with more than one person.
  - Uploading the two landing images from Settings so the split page is not artless.
  - Paystack is still in TEST mode and the production webhook is not wired in the Paystack dashboard. That is the single biggest gap between this build and real money.

## Open questions

- Whether the external dev's tool reads `collections` with the anon key (sees passwords) or direct SQL.
- Whether Newman wants per-product panel titles or only the body text. Both are wired; drop the title field from the product form if it is noise.
- Whether commission should be a flat percent or a per-event flat fee. Percent is what is built.
- Whether an organizer should ever see the clothing store. The brief says no, and that is what is enforced.
