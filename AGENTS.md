# AGENTS.md - how agents work in this repo

NYNTH World Store. A React storefront and admin panel in one SPA, with a fully
Supabase backend (Postgres, RLS, Deno Edge Functions).

Read before you touch anything:

- `frontend/nynth-ecom/CLAUDE.md` - project conventions, business rules, the verification commands.
- `frontend/nynth-ecom/DESIGN.md` - the design system, including the admin one.
- `frontend/nynth-ecom/PRODUCT.md` - who the product is for and what it is.
- `memory.md` (repo root) - the state of the work and the standing rules.
- `frontend/nynth-ecom/CODEBASE.md` - the map: routes, pages, API layer, edge functions.

## Invariants

1. **The shop is live.** Migrations only. No `drop table`, no bulk rewrite of existing
   orders. Additive schema changes and RLS policies. The admin is the only way to change
   data, and it goes through the permission layer in `src/utils/permissions.js`.
2. **The landing page is mostly white and is never dark.** This is the founder's standing
   instruction. `src/pages/Landing.test.js` fails the build if a dark surface, a photo
   scrim or a theme switch comes back.
3. **Never write a new button, card, badge, input, modal, switch, chip or status colour.**
   The admin has one of each, in `src/components/admin/`: `AdminButton`, `AdminCard`,
   `AdminBadge`, `AdminInput`, `AdminModal`, `PageHeader`, `StatCard`, `Toggle`. Reach for
   those before anything else. A new one is only written when the founder asks for it by
   name, and it goes in that same folder with the same props API so the next page can use
   it too. This is the rule that keeps the admin from drifting back into thirteen pages
   that each invent their own button.
4. **Never hardcode a style into a component.** No raw colour, no raw radius, no raw pixel
   value in a `className`. Every value comes from a token (`--admin-*`, `--tint-*`) or from
   a utility class that already exists. If a page needs a value that does not exist yet, add
   it to `src/index.css` as a reusable token or class first, then use it. The storefront
   follows the same rule with its own tokens.
5. **A value that appears twice is a token.** A value that appears once may stay inline only
   when it is content and not a style, a name, a price, a date.
6. **The theme owns the colour.** A hardcoded white is white on white on the paper admin and
   the panel silently disappears. A raw Tailwind palette value such as `text-slate-300` is a
   dark theme value and is unreadable on paper. Both fail
   `src/utils/adminSystem.test.js`, which also fails on a radius outside the scale. That
   test is the enforcement, not a suggestion.
7. **No em dashes** anywhere, in copy, in code or in commits.
8. **No `style={{...}}` for design.** The only exception is the dnd-kit drag objects in
   `src/pages/admin/Products.jsx`.
9. **No new npm dependencies** without the user saying so.
10. **Never put a secret in a committed file.** The Supabase management token lives in
    `frontend/nynth-ecom/.secrets/supabase.env`, which is gitignored. Never echo it.
11. **Do not modify anything under `Documents/dipo-bench/`.** It is a read-only benchmark
    fixture.
12. **Consistency is mandatory, and every design decision goes through impeccable.** The
    admin is one product, not thirteen pages that happen to share a database. The same
    surface material, radius language, type ramp, spacing rhythm and control behaviour on
    every tab, in both themes. Hierarchy comes from size, depth and spacing, never from a
    new material or a second component style, so keeping a page consistent does not mean
    making everything the same size. When a task touches styling, load the `impeccable`
    skill first, run `impeccable context --target <file>`, then load the reference for the
    command you are actually running (polish, layout, typeset, audit, critique). Use
    `impeccable audit` or `npx impeccable detect` as the mechanical check, and treat a
    clean scan as evidence that nothing broke, not as proof the result is good.

## The admin design system

One radius language: 12px for a card, a modal, a panel. 8px for a button, an input, an
icon button. 4px for a small text chip. Full for a switch, a dot, an avatar. Nothing sharp
and nothing at 2, 6, 16 or 24px.

One type ramp: 40px page title, 18px section title, 14px group heading, 13px field label,
12px description, 11px hint, 10px micro label. The caps are the brand voice and they stay
on labels, buttons, tabs and chips. They are never on a sentence.

One spacing rhythm: 32px card to card, 20px group to group, 12px group heading to its
controls, 8px label to its control, 4px control to the hint under it.

## Verify before you finish

```bash
cd frontend/nynth-ecom
npm run lint       # ESLint, zero-warning policy, gated in CI
npm test           # Vitest
npm run test:edge  # Deno, the edge functions
npm run build      # Vite production build
```

A screenshot is not a substitute for the test run, and neither is the other way round.
This repo has reported "done" when it was not, twice, and both times a test caught what
the eye did not. Look at the rendered page in both admin themes, then run the commands.

## Deploying

Push to `main` deploys through Vercel. The deploy takes 1 to 3 minutes. Verify it by
fetching the served entry bundle and grepping for a string unique to the change, because a
generic string gives a false positive:

```bash
curl -s https://www.nynthworld.com/ | grep -oE '/assets/index-[A-Za-z0-9_-]+\.css'
curl -s "https://www.nynthworld.com/assets/index-<hash>.css" | grep "<your string>"
```

A stale browser tab keeps the old JavaScript. Hard refresh before believing a bug report.
