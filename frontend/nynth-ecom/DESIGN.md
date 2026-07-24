# Design System — NYNTH

## Color Palette

### Primary
- **Ink (Black)**: `#000000` — Primary text, primary buttons, borders
- **Paper (White)**: `#FFFFFF` — Body background, card backgrounds

### Neutrals
- **Gray 50**: `#F9F9F9` — Subtle backgrounds, order summary panels
- **Gray 100**: `#F3F4F6` — Border color, divider lines, hover states
- **Gray 200**: `#E5E7EB` — Input borders
- **Gray 300**: `#D1D5DB` — Placeholder text
- **Gray 400**: `#9CA3AF` — Muted text, labels, inactive states
- **Gray 500**: `#6B7280` — Secondary body text
- **Gray 600**: `#4B5563` — Body text on tinted backgrounds

### Accent
- **Green 500**: `#22C55E` — Success states, stock indicators (used sparingly)
- **Red 500**: `#EF4444` — Error states, destructive actions (used sparingly)

### Strategy
Restrained — tinted neutrals + one accent (green) ≤10%. The palette is black/white dominant with gray ramps for hierarchy. Color is reserved for functional signals only.

## Typography

### Font Family
- **Primary**: Inter (weights: 300-800) — applied globally via `font-family: 'Inter'`

### Type Scale (Shop page as source of truth)
- **Hero display**: `text-[40px] md:text-[56px] lg:text-[72px]` with `tracking-tight` — via `.hero-title` class
- **Section eyebrow**: `text-[8px-10px] tracking-[0.2em-0.4em] uppercase font-bold` — gray-400
- **Product title**: `text-[11px-13px] tracking-[0.12em-0.15em] uppercase font-bold`
- **Price**: `text-[10px-12px] tracking-widest font-bold`
- **Body**: `text-[10px-14px] tracking-wide leading-relaxed`
- **Labels**: `text-[9px-10px] tracking-[0.2em-0.3em] uppercase font-bold` — gray-400
- **Button text**: `text-[9px-11px] tracking-[0.2em-0.3em] uppercase font-bold`

### Key Patterns
- ALL CAPS for labels, buttons, navigation, and product names
- Wide letter-spacing (0.2em+) for labels and small text
- Tight letter-spacing for headings (tracking-tight or tracking-[0.12em])
- No italics. Bold or regular only.

## Spacing Scale
- `section-pad`: `px-6 md:px-10 lg:px-20 py-12` — Page-level horizontal padding
- Component padding: 4-8 (16-32px)
- Element spacing: gap-2 to gap-8 (8-32px)
- Section vertical spacing: py-12 to py-32

## Borders & Radii
- **Default**: No border-radius on buttons, inputs, or cards (sharp edges)
- **Cards**: `rounded-xl` on admin panel cards only (not public-facing)
- **Buttons (public)**: Square/flat — no border-radius
- **Buttons (admin)**: `rounded-lg`
- **Inputs**: Square/flat on public pages, `rounded-lg` on admin
- **Borders**: `border-black/5` or `border-gray-100` — hairline, subtle

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
