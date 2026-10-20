# Design System - NYNTH

## Color Palette

### Primary
- **Ink (Black)**: `#000000` - Primary text, primary buttons, borders
- **Paper (White)**: `#FFFFFF` - Body background, card backgrounds

### Neutrals
- **Gray 50**: `#F9F9F9` - Subtle backgrounds, order summary panels
- **Gray 100**: `#F3F4F6` - Border color, divider lines, hover states
- **Gray 200**: `#E5E7EB` - Input borders
- **Gray 300**: `#D1D5DB` - Placeholder text
- **Gray 400**: `#9CA3AF` - Muted text, labels, inactive states
- **Gray 500**: `#6B7280` - Secondary body text
- **Gray 600**: `#4B5563` - Body text on tinted backgrounds

### Accent
- **Green 500**: `#22C55E` - Success states, stock indicators (used sparingly)
- **Red 500**: `#EF4444` - Error states, destructive actions (used sparingly)

### Strategy
Restrained - tinted neutrals + one accent (green) ≤10%. The palette is black/white dominant with gray ramps for hierarchy. Color is reserved for functional signals only.

## Typography

### Font Family
- **Primary**: Inter (weights: 300-800) - applied globally via `font-family: 'Inter'`

### Type Scale (Shop page as source of truth)
- **Hero display**: `text-[40px] md:text-[56px] lg:text-[72px]` with `tracking-tight` - via `.hero-title` class
- **Section eyebrow**: `text-[8px-10px] tracking-[0.2em-0.4em] uppercase font-bold` - gray-400
- **Product title**: `text-[11px-13px] tracking-[0.12em-0.15em] uppercase font-bold`
- **Price**: `text-[10px-12px] tracking-widest font-bold`
- **Body**: `text-[10px-14px] tracking-wide leading-relaxed`
- **Labels**: `text-[9px-10px] tracking-[0.2em-0.3em] uppercase font-bold` - gray-400
- **Button text**: `text-[9px-11px] tracking-[0.2em-0.3em] uppercase font-bold`

### Key Patterns
- ALL CAPS for labels, buttons, navigation, and product names
- Wide letter-spacing (0.2em+) for labels and small text
- Tight letter-spacing for headings (tracking-tight or tracking-[0.12em])
- No italics. Bold or regular only.

## Spacing Scale
- `section-pad`: `px-6 md:px-10 lg:px-20 py-12` - Page-level horizontal padding
- Component padding: 4-8 (16-32px)
- Element spacing: gap-2 to gap-8 (8-32px)
- Section vertical spacing: py-12 to py-32

## Borders & Radii
- **Default**: No border-radius on buttons, inputs, or cards (sharp edges)
- **Cards**: `rounded-xl` on admin panel cards only (not public-facing)
- **Buttons (public)**: Square/flat - no border-radius
- **Buttons (admin)**: `rounded-lg`
- **Inputs**: Square/flat on public pages, `rounded-lg` on admin
- **Borders**: `border-black/5` or `border-gray-100` - hairline, subtle

## Components

### Buttons
- **Primary (public)**: Black bg, white text, square corners, `py-4 text-[10px-11px] tracking-[0.2em-0.3em] uppercase font-bold`
- **Secondary (public)**: White bg, black border, black text, same typography
- **Primary (admin)**: Black bg, white text, `rounded-lg`, slightly larger text
- **Ghost (admin)**: Transparent bg, border, `rounded-lg`

### Inputs
- **Public**: `border-b border-gray-100` bottom-border only, transparent bg, `text-[13px] tracking-wider uppercase`
- **Admin**: `border border-gray-200 rounded-lg px-4 py-2`

### Navigation
- **Public header**: Fixed, white bg with backdrop blur, logo centered, nav links left, icons right
- **Announcement bar**: Fixed top, black bg, white text, `text-[8px-9px] tracking-[0.4em] uppercase`
- **Admin sidebar**: Fixed left, white bg, icon + label nav items

## Layout
- **Max width**: `max-w-7xl` for content areas
- **Full-width sections**: Edge-to-edge hero images, category bars
- **Grid**: 2-col mobile, 4-col desktop for product grids
- **Sticky elements**: Category bar, header, admin sidebar

## Animation
- **Transitions**: `transition-all duration-300` or `duration-500`
- **Hover**: `hover:opacity-50` for icons, `hover:bg-black hover:text-white` for buttons
- **Press**: `active:scale-[0.98]` (where implemented)
- **Loading**: `Loader2 animate-spin` from lucide-react
- **Page transitions**: None (SPA, no route transitions)

## Elevation
- **Flat default**: No shadows on public-facing elements
- **Admin cards**: `shadow-sm`
- **Modals**: `shadow-xl` on white bg with black/50 backdrop
- **Toast notifications**: Fixed top-center via react-hot-toast

---

# Admin Back Office - "The Black Atelier"

The admin panel is a **separate world** from the storefront: a matte-ink editorial back office.
Scope is the `.admin-app` class on `AdminLayout`'s root - it flips shadcn semantic variables
(`--background`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--border`,
`--input`, `--ring`, …) so every `ui/` primitive renders dark inside admin while the storefront
stays light. Tokens live in `src/index.css`.

## Color
- **Shell**: `--background` indal `oklch(0.155 0.002 85)` (#161619-ish); sidebar `#0b0b0c`.
- **Bone type**: `#EDEAE2` (type ramp: `text-[#EDEAE2]`, muted `text-[#EDEAE2]/42`).
- **Panels**: `bg-[#0a0a0a]` (true ink - was `#131316`, read navy next to the warm shell), hairlines `border-white/10`-`border-white/14` + `border-white/[0.07]` rail.
- **All admin surfaces are true black** - no light-gray layers: `--card`/`--popover` `oklch(0.12 0 0)`, `--secondary`/`--muted`/`--accent` `oklch(0.14 0 0)` (hover step), toolbars/segmented controls/table headers/tooltips/select dropdowns all black (was `oklch(0.17-0.255 0.002 85)` which read as navy/white on the black panels).
- **Tint chips** are variable-driven (`--tint-{emerald,amber,sky,rose,violet,slate}-{bg,fg,line}`)
  so `ui/badge.jsx` + `StatusDropdown` work on both light (storefront) and dark (admin):
  `bg-emerald-500/[0.14] text-emerald-300` style under `.admin-app`.
- **Chart tokens**: `--admin-chart-*` read from the `.admin-app` element by `src/lib/charts.js`
  (fallback `:root`) - dark gridlines/text, emerald + bone series, bone legend/tooltip (tooltip
  `bg` `oklch(0.17 0.002 85)` on hairline `oklch(1 0 0 / 0.14)`).

## Typography (display scale)
- Metric/display numerals: `text-[28px] leading-none font-extrabold tracking-[-0.02em] tabular-nums`
  bone; `₦` at `text-xl`. Page titles `text-3xl md:text-4xl font-extrabold tracking-[-0.02em]`.
- Layout title: `text-[30px] leading-[1.05] md:text-[40px] font-extrabold tracking-[-0.02em]`.
- Micro-codes/IDs: `font-mono` bone/42. Growth badges `text-xs font-extrabold tracking-tight tabular-nums`.

## Surfaces & chrome
- Root: `min-h-screen admin-app admin-paper flex`; fixed sidebar `bg-[#0b0b0c]` + hairline right
  rail; active nav pill = bone; inactive = bone/42 with mono sub-labels.
- Browser chrome (scrollbars, caret, selection, number spinners) themed dark by `.admin-app`.
- Radix `Select` portals to `<body>` and escapes the scope - `ui/select.jsx` is dark-styled
  explicitly. No other Radix portal components exist.
- Elevation is light-touch: subtle inset white top-light + soft drop on cards; **no** colored
  shadows, no `grayscale` filters on avatars.

---

# Admin Design System - one language for the back office

The admin was a mess because two mistakes were made at once. The utility classes in
`index.css` were written with hardcoded ink values, so they only ever looked right on the
dark theme. And most pages ignored those utilities and hand rolled their own class strings,
with 4 to 27 different button shapes per page. The visible result was a page that looked
like it came from four different products.

**The admin is light-mode first.** Newman asked for it (17 Oct 2026): "I'm more of a light mode
person, I usually have struggles with reading this dark mode." So the light theme is the
default and the ink theme is the alternate, and both are the same system with the tokens
moved. A black toolbar on a paper page is not a hybrid, it is a leftover.

## The rules

1. **No hardcoded colour in the admin.** Every surface is a token. A hardcoded white is white
   on white on the paper theme, and the panel silently does not exist. Use
   `bg-[var(--admin-ink)]/[0.0X]` for a tint of the ink, never `bg-white/[0.05]`.
2. **The tint family is the only status palette.** `--tint-{emerald,amber,sky,rose,violet,slate}-{bg,fg,line}`
   flip with the theme. A raw Tailwind value such as `text-slate-300` is a dark theme value
   and is unreadable on paper.
3. **One radius scale.** 12px (`rounded-xl`) for a card, a modal, a panel. 8px (`rounded-lg`)
   for a button, an input, an icon button. 4px (`rounded`) for a small text chip or a badge.
   Full (`rounded-full`) for a switch, a dot, an avatar. Nothing sharp, nothing at 2, 6, 16
   or 24px.
4. **One type ramp.** 40px page title, 18px section title, 14px group heading, 13px field
   label, 12px description, 11px hint, 10px micro label. The caps are the brand voice and
   they stay on labels, buttons, tabs and chips. They are never on a sentence. A description
   is prose, so it is 12px regular sentence case.
5. **One spacing rhythm.** 32px card to card, 20px group to group inside a card, 12px group
   heading to its controls, 8px label to its control, 4px control to the hint under it. One
   value doing every job is what makes a page read as a flat list of equal weight boxes.

## The material

The back office is one glass plane sitting on a washed page. Every panel is the same
translucent material: a tint of the ink over the page, a hairline, a soft blur, and a top
highlight. Nothing gets its own surface. A panel is never a solid fill and never a different
material, because that is how thirteen tabs start to read as two different products.

Depth is the only thing that changes, and it comes from three levels:

| Level | Use it for | Material |
|---|---|---|
| `admin-panel-raised` | the one lead block on a page, the finance hero, a modal-sized panel | stronger tint, soft drop shadow, the top highlight |
| `admin-panel` | every ordinary card, table shell, form group | 3.5% ink tint, hairline, blur, top highlight |
| `admin-panel-inset` | a group inside a card, a stat tile, a row of small facts | 2% tint, no blur, no shadow |

Dashed (`admin-panel-dashed`) is the empty state. `admin-panel-hover` adds the one lift.

The page behind the glass carries a very low contrast wash, two ink-tinted radial gradients at
5% and 3.5%, so the blur has something to sit on instead of a flat fill. That wash is the
reason the material reads as glass rather than as a grey box.

Solid surfaces are reserved for things you read through, not at: inputs, table header chrome,
dropdowns, modals and product thumbnails. A solid panel in a content position is drift.

## The primitives

`src/components/admin/` holds the shared pieces. A page should not be able to invent a
button.

| Component | What it is |
|---|---|
| `AdminButton` | primary, secondary, ghost, danger. The hover, active, focus, disabled and loading states are decided once. |
| `AdminCard` | default, inset, dashed, plain. A card is 12px and a hairline. |
| `AdminBadge` | a status chip, from the tint family plus the ink variant. |
| `AdminInput` | text, search, textarea, select. The placeholder follows the theme. |
| `AdminModal` | the scrim, the panel, the title block and the close button. Escape closes it. |
| `PageHeader` | eyebrow, title, description and the actions slot. |
| `StatCard` | a label, a number and a tinted icon chip. |
| `Toggle` | the one switch, a 44 by 24 pill. |

`src/components/ui/` is the storefront's system. It renders correctly inside the admin
because it reads the semantic tokens, but the admin's own primitives are what the admin
pages use.

## The utilities

`index.css` still carries the admin wide classes, and they are token driven now:
`.admin-toolbar`, `.admin-control`, `.admin-table`, `.segmented-control`, `.admin-paper`,
`.skeleton`, `.focus-ring`. A class that is hardcoded to ink does not belong in there.

## The guard

`src/utils/adminSystem.test.js` is a ratchet. The pages that have been through the system
are held to the rules above. The ones that have not are on a list in the test, and that list
is only allowed to get shorter. A new hardcoded value cannot be introduced anywhere, and a
page cannot quietly leave the list.

