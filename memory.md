# Memory - Nynth World Store (admin consistency pass: one glass material)

Last updated: 2026-10-20 09:40 (Africa/Lagos)

## Recurring context

- Founder and owner: Newman (09137207918). Owner alerts: newmanyange14@gmail.com, nynthworld@gmail.com, primebusiness54@gmail.com. Newman sends fragmented WhatsApp and voicemail requirements; interpret them into concrete edits. Dipo (the user) approves before ambiguous batches go out.
- Newman reads in light mode and finds the dark admin hard to read. Admin defaults to light, remembered per browser in `nynth_admin_theme`.
- Newman's design line: "Easy, clean, minimal, but exceptional."
- **Consistency is now a standing rule.** Every admin tab is one product: one surface material, one radius language, one type ramp, one spacing rhythm, one behaviour per control, in both themes. Hierarchy comes from size, depth and spacing, never from a new material. Every design decision goes through the impeccable skill: `impeccable context --target <file>` before editing, the command reference next, `npx impeccable detect` as the mechanical check. Stated by Dipo on 20 Oct 2026 and written into `AGENTS.md` invariant 12, `CLAUDE.md`, `DESIGN.md` and this file.
- Stack: React 18 + Vite + Tailwind v4 + react-router-dom v7, frontend in `frontend/nynth-ecom`, backend fully Supabase (`cybcooychgicsnjeummo`), Paystack, Resend, Cloudinary, Vercel.
- `src/api/firebaseFunctions.js` is a one-line alias over `supabaseFunctions.js`. Imports still say firebaseFunctions; that is intentional, do not rename.
- Live site: `https://www.nynthworld.com`. Verify a deploy by fetching the served entry bundle and grepping for a string unique to the change. Generic strings give false positives. Deploy takes 1 to 3 minutes.
- Supabase MCP works, but `execute_sql` runs as a superuser and bypasses RLS. To test a policy: `begin; select set_config('request.jwt.claims','{"sub":"<uuid>","email":"...","role":"authenticated"}',true); set local role authenticated; select ...; rollback;` The `sub` must be a real uuid; a Firebase-style id throws 22P02. Run each permission probe as its own statement, never a batched loop.
- Management API fallback if the MCP fails: `POST https://api.supabase.com/v1/projects/cybcooychgicsnjeummo/database/query` with the token in `frontend/nynth-ecom/.secrets/supabase.env`. Never commit or echo that token.
- Stale tabs: after a push, old tabs keep old JS. Hard refresh before believing a bug report.
- Orders model: `orders.customer` jsonb stores the whole checkout form. `is_test` comes from the Paystack domain; test traffic is excluded from metrics. Live paid revenue was around ₦1,060 across 16 paid orders as of 17 Oct.
- Lock and drop model: `settings.data` holds `lock_page_enabled`, `lock_epoch`, `lock_password`, `launch_date`. `collections` (external dev, currently empty) with `status='live'` marks the active drop. `lock_epoch` force-relock must stay intact.
- Discount codes: `discount_codes`, guest check via `public.validate_discount(p_code)`. `MEMBER` expired 2026-10-04.
- Founders in `users` are `nynthworld@gmail.com` and `primebusiness54@gmail.com`, both with duplicate rows (Firebase uid and Supabase uuid formats). Do not dedupe without asking.
- Access model: `staff_roles` (user_id, email, full_name, department, role, permissions jsonb, event_ids text[], status). Roles `vice_admin`, `ticket_organizer`, `ticket_admin`, `ticket_staff`. `users.role` stays founder-or-customer. Enforced by `can_access_event()` and `order_touches_my_events()` in RLS. Staff UI at `/admin/staff`, founder only.
- Ticketing: `event_tickets` is the normalized ledger the door reads (payment_status, ticket_status, entry_status on separate axes). Verification goes through `public.verify_ticket_entry(code)` only; the table has no insert/update/delete policy. `syncEventTickets()` runs from webhook and verify. `event_finance` view separates organizer money, fees, commission, refunds. `assign_event_organizer()` is founder-only.
- Key files: `src/pages/admin/Settings.jsx`, `AdminDashboard.jsx`, `Events.jsx`, `CheckIn.jsx`, `StaffAccess.jsx`, `TicketPlatform.jsx`, `src/components/admin/*`, `src/utils/adminSystem.test.js`, `src/utils/permissions.js`, `src/hooks/useAdminTheme.js`, `src/index.css`, `supabase/migrations/`.

## The admin design system (state after 20 Oct 2026)

- **One material: glass.** `src/index.css` defines `.admin-panel` (3.5% ink tint, hairline, 14px blur, top highlight), `.admin-panel-raised` (stronger tint plus soft shadow, the one lead block on a page), `.admin-panel-inset` (2% tint, no blur, a group inside a card) and `.admin-panel-dashed` (empty state). The page behind them carries a low contrast ink wash (two radial gradients at 5% and 3.5%) so the blur has something to sit on.
- Solid fills are reserved for controls, table chrome, dropdowns, modals and thumbnails. A solid panel in a content position is drift.
- `AdminCard` is a thin wrapper over the material: levels `default`, `raised`, `inset`, `dashed`, `plain`, plus `hover` which adds `.admin-panel-hover`.
- One radius language: 12px card, 8px control and container inside a card, 4px chip, full for switch or dot. `.admin-panel` deliberately does not set a radius; the caller's `rounded-xl` or `rounded-lg` decides, so the radius scale still means depth.
- One type ramp: 40px page title, 18px section title, 14px group heading, 13px field label, 12px description, 11px hint, 10px micro label. The floor is 10px; 8px and 9px are banned and tested.
- One title owner: `AdminLayout` renders the 40px page title from its `title` prop. `PageHeader` only renders the optional eyebrow, the 12px description and the actions. It no longer accepts a title.
- One spacing rhythm: 32px card to card, 20px group to group, 12px group heading to controls, 8px label to control, 4px control to hint.
- `adminButtonClass({ variant, size })` is exported from `AdminButton.jsx` so a routed link can look like a button without inventing a second shape.
- `src/utils/adminSystem.test.js` is the ratchet. It now also enforces: the material is defined once, `AdminCard` uses it, no page paints a solid 12px panel, the type floor is 10px, and only the layout owns the page title.

## What shipped this session (uncommitted, pending Dipo's push)

- `src/index.css`: glass tokens for both themes, `.admin-panel*` utilities, the ambient page wash, reduced-motion guard, no-backdrop-filter fallback.
- `AdminCard.jsx`: levels now map to the material; `raised` added; hover moved to `.admin-panel-hover`.
- `PageHeader.jsx`: title removed, description at 12px. Lookbooks' duplicate `title="Gallery"` removed.
- `AdminButton.jsx`: `adminButtonClass` export; the component uses it.
- Panel sweep across all 13 admin pages and the shared components: 62 panel usages now on the material. Settings sections, Dashboard panels, StaffAccess form and rows, TicketPlatform table and tiles, Events cards and tiles, CheckIn tiles, DiscountCodes cards and table, Products list and drag cards, and the Orders, Abandoned Checkouts and Subscribers table shells.
- Headers unified through `PageHeader` with the layout title: Dashboard (now `title="Overview"`), Events, TicketPlatform, Settings.
- Type ramp sweep: 23 uses of 8px and 62 of 9px moved to 10px.
- Primitive sweep: Events actions on `AdminButton` and `adminButtonClass`, DiscountCodes save on `AdminButton` and its switch on `Toggle`, Settings save and discard and cleanup on `AdminButton`.
- Dashboard chart colours moved from hex to `chartPalette()` tokens, with rose and slate tokens, and recomputed when the admin theme flips.
- Ratchet additions (66 tests in that file): material defined once, card uses material, no solid panels, type floor, one title.
- `adminRoutes.test.jsx`: cold import timeout raised to 20s. The dashboard import pulls chart.js and was timing out at 5s under a full parallel run.

**Staff panel fix (20 Oct 2026, same working tree).** Newman reported that an assigned email logs in and sees the storefront ("explore collections") instead of their duties. The database was fine: the one live staff row is active and `my_access()` returns its 12 permissions. The bugs were in the client entry points.
- `src/utils/authRedirect.js` (new) and `Login.jsx` / `Signup.jsx`: after auth, staff go to `/admin` (or the `/admin` page they were trying to open). Customers still go to `from` or `/shop`. The redirect now waits for `accessLoading`, because `isStaff` is only known after access resolves.
- `Account.jsx:74,105`: the workspace card and the staff chip were gated on `isAdmin`, so staff saw the customer empty state ("No Pieces discovered", "Explore Collection"). Now `isStaff`.
- `Header.jsx`: a Dashboard link for staff, desktop and mobile, so the storefront always has a way back.
- `StaffAccess.jsx:44,142,168`: event assignment now uses `roleMeta(role).scopedByEvent` instead of `canDirect`, which had excluded `ticket_staff`. Door staff could never be scoped, and `verify_ticket_entry` requires `can_access_event`, so they could not verify a single ticket. Also warns when a scoped person is saved with no events.
- `AdminDashboard.jsx:280`: a ticket-only account is sent to `/admin/events` instead of an empty store overview. `AdminLayout` hides the Dashboard entry that would bounce.
- `AuthContext.jsx:129`: `hasStoreWorkspace`, defined once and used by both the nav and the landing redirect.
- `Events.jsx:121`: the empty state now says who assigns events.
- Tests: `authRedirect.test.js` (7), `staffEntry.test.jsx` (8).

## Decisions made

- The material is glass, not solid. Chosen from the founder's note that he liked the Events light-mode cards with their transparent panes, then made universal so no tab looks like another site. Scope is the admin only: the storefront PRODUCT.md still lists glassmorphism as an anti-reference, and that stays true.
- Depth is the hierarchy signal, not material variety: raised for the one lead block, default for ordinary cards, inset for groups. Sizes and type still carry hierarchy, so consistency does not flatten the page.
- The page title belongs to the layout; the page intro strip carries only description and actions. That kills the two-heading screens.
- Radius lives on the caller, not on `.admin-panel`, so a 12px card and an 8px inner container can share one material.
- Chart colours must come from `--admin-chart-*`, read through `chartPalette()`, because a hex in a page cannot follow the theme.
- The ratchet's "page has a button but no AdminButton" rule now inspects the button markup, not the whole file, so a status dot or a segmented control is not a false positive.

## Problems solved

- The working tree arrived with an unfinished stricter ratchet and a half-done chart token migration (dashboard still had eight hexes, DiscountCodes still hand-rolled two buttons and a switch). Finished all of it, so the ratchet is genuinely green rather than being weakened.
- The panel sweep dropped `rounded-xl` on the converted divs, which would have left square cards. Restored the radius on all 50 classNames and updated `settingsDesign.test.js` to assert the new card string.
- Dashboard chart colours would have stayed on the old theme after a toggle. Fixed with `useAdminTheme()` as the memo dependency.
- Admin route test timed out only under a parallel full run, not alone. Raised the timeout for the cold import instead of deleting the coverage.
- The `react-hooks/exhaustive-deps` warning on the theme-dependent memo was silenced with one documented disable, not by removing the dependency.

## Current state

- Gates all green: `npm run lint` clean, 327 vitest, 27 deno edge, `npm run build`, `node scripts/verify-dist.mjs`, `npx impeccable detect --json` returns `[]`.
- Nothing is committed and nothing is pushed. The consistency pass and the staff panel fix are both in the working tree, because Dipo did not say push. Standing rule is still no commit or push without an explicit instruction.
- Known gap after the staff fix: a Ticketing Admin cannot browse a list of buyers or attendees. `/admin/orders` requires `store.orders.view`, and the Events page only shows counts. The brief promises attendee details, so a ticket attendee list is the next ticket-side build.
- Not yet looked at in a real browser. The next pass should load the admin in both themes on desktop and mobile before shipping.

## Next session starts with

1. Run `/remember restore`.
2. Open the admin in light and dark, desktop and mobile: Dashboard, Events, Orders, Products, Settings, Staff, Ticket Platform, Check-In, Subscribers, Discount codes, Lookbooks, Abandoned checkouts. Check the glass reads as glass and the page wash is not dirty.
3. Push when Dipo says so, then verify the live bundle.
4. Then pick up the open questions below.

## Open questions

- Whether Newman approves the glass material everywhere, or wants it dialled back on dense pages like Orders and Products.
- Whether the Settings tab rail should stay a solid chrome surface or become glass as well. It is currently solid with a blur, which is chrome.
- Whether to add `impeccable` as a devDependency so the detector runs offline instead of through `npx`.
- Whether the external dev's tool reads `collections` with the anon key or direct SQL.
- Whether commission should be a flat percent or a per-event flat fee. Percent is what is built.
