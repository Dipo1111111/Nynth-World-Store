# Memory

Last updated: 2026-07-20

## What was built (previous session)
- **LockPage.jsx** — Added duration-based countdown timer. When `lock_timer_enabled` is on, a large MM:SS countdown appears and the password field + "The wait is over" message are hidden until the timer hits zero.
- **Admin Settings (Settings.jsx)** — Added "Enable Countdown Timer" toggle and "Countdown Duration (minutes)" number input.
- **SettingsContext.jsx** — Added defaults for `lock_timer_enabled` and `lock_timer_duration_minutes`.

## What was done this session

### 1. Countdown Timer — Default OFF
- Changed `lock_timer_enabled` default from `true` to `false` in:
  - `SettingsContext.jsx` (line 25)
  - `Settings.jsx` (line 24)
  - `Settings.jsx` loadSettings fallback (line 99)
- The toggle in admin settings still works — admin can turn it on/off.

### 2. University of Abuja Delivery (₦1,500)
- Added `ABUJA_SHIPPING_DATA` export to `locationData.js` with "University of Abuja" at ₦1,500
- Updated `Checkout.jsx`:
  - Imported `ABUJA_SHIPPING_DATA`
  - Added Abuja city dropdown (like Lagos) when state is "Abuja"
  - Added Abuja shipping fee calculation
  - Added Abuja speed display in order summary

### 3. Admin Force-Lock (lock_epoch)
- **Problem**: Users who unlocked with password bypassed the lock forever, even when admin re-enabled it.
- **Solution**: Added `lock_epoch` counter to settings.
  - `SettingsContext.jsx`: Added `lock_epoch: 0` default
  - `Settings.jsx`: Added `lock_epoch: 0` to initial state; `handleSubmit` increments epoch when lock is enabled
  - `App.jsx`: Checks `storedEpoch === lockEpoch` — if mismatch, forces lock page even if previously unlocked
  - `LockPage.jsx`: Stores `nynth_lock_epoch` in localStorage on successful unlock

## Key files
- `src/pages/LockPage.jsx` — Lock page with password, countdown, waitlist
- `src/pages/admin/Settings.jsx` — Admin settings panel
- `src/context/SettingsContext.jsx` — Settings state management
- `src/App.jsx` — Lock page routing logic
- `src/data/locationData.js` — Delivery location data
- `src/pages/Checkout.jsx` — Checkout with delivery calculation

## Current state
- All settings are frontend-only defaults. Real values come from Firestore via `fetchSettings()`.
- `lock_page_enabled` is currently ON in Firestore (site appears "down" to users).
- Admin needs to toggle lock OFF in admin settings to restore site access.
- With the new lock_epoch feature, toggling lock ON will force-lock everyone (including previous password-unlockers).

## Firestore fields (settings/site_config)
- `lock_page_enabled` (boolean) — controls site-wide lock
- `lock_epoch` (number) — incremented on each lock enable to invalidate previous unlocks
- `lock_timer_enabled` (boolean) — shows/hides countdown timer on lock page
- `lock_timer_duration_minutes` (number) — countdown duration in minutes
- `lock_password` (string) — password to unlock the site
- `launch_date` (string) — launch date for countdown
- Various lock page display settings (titles, waitlist text)

---

# Session 2 — Lock Page Simplification & Bug Fixes

Last updated: 2026-07-13

## What was built

### 1. Lock Page Simplified (LockPage.jsx)
- Removed ALL countdown timers (MM:SS duration timer AND days/hours/mins/secs launch date countdown)
- Removed the "The wait is over" message
- Removed the `CountdownBox` component, all countdown state, and both countdown useEffects
- Removed the `onUnlock` prop — LockPage no longer calls parent unlock
- Page now shows ONLY: Logo → Titles → Waitlist (email + "ADD TO LIST") → OR divider → Password field ("ENTER USING PASSWORD" + "ENTER NYNTH") → Footer
- Password handler uses `window.location.reload()` after setting localStorage instead of calling `onUnlock()`

### 2. Header Announcement Bar Hidden When Timer Off (Header.jsx)
- Wrapped the black announcement bar (`NEXT DROP IN: ...`) in `{settings?.lock_timer_enabled !== false && (...)}`
- Made the navbar top margin conditional — no offset when bar is hidden
- When timer is off, navbar sits at `top: 0` directly

### 3. Bug Fix: shouldShowLock Condition (App.jsx line 179)
- **Bug**: Changed `{!isSiteUnlocked && shouldShowLock ? (` to `{shouldShowLock ? (`
- **Why**: `shouldShowLock` already checks `!isUnlockValid` (which covers "never unlocked" AND "epoch mismatch"). The extra `!isSiteUnlocked` wrapper blocked the lock page when `isSiteUnlocked` was true (user had previously unlocked), even when the epoch had been incremented by admin. Users who unlocked before would never see the lock page again.
- **Root cause**: `isUnlockValid = isSiteUnlocked && storedEpoch === lockEpoch`. When admin incremented epoch, `isUnlockValid` became false, so `shouldShowLock` became true. But `!isSiteUnlocked` was false (they had unlocked before), so the overall condition was false.

### 4. "Loading Dashboard" Text Fixed (App.jsx)
- Changed `AdminLoader` text from "Loading Dashboard..." to "Loading..." since it's used for the initial settings load on every page, not just the admin dashboard.

### 5. Timer Default OFF (SettingsContext.jsx, Settings.jsx)
- `lock_timer_enabled` default changed from `true` to `false` in all three places:
  - `SettingsContext.jsx` initial state
  - `Settings.jsx` initial state
  - `Settings.jsx` loadSettings fallback (was `data.lock_timer_enabled !== undefined ? data.lock_timer_enabled : true`, now `false`)

## Files modified this session
- `src/pages/LockPage.jsx` — Major rewrite (removed countdowns, simplified to waitlist + password)
- `src/components/home/Header.jsx` — Conditional announcement bar and navbar offset
- `src/App.jsx` — Fixed shouldShowLock condition, removed onUnlock prop, changed loader text
- `src/context/SettingsContext.jsx` — lock_timer_enabled default false, lock_epoch added
- `src/pages/admin/Settings.jsx` — lock_epoch handling, timer default false
- `src/data/locationData.js` — ABUJA_SHIPPING_DATA added
- `src/pages/Checkout.jsx` — Abuja dropdown and shipping calculation

## Current state
- Lock page shows: logo, titles, waitlist, OR, password field, footer — no countdowns anywhere
- When countdown timer is OFF (default): no announcement bar, no navbar offset
- When countdown timer is ON: announcement bar shows, navbar pushed down
- Admin can force-lock everyone via lock_epoch (incremented each time lock is enabled)
- Abuja delivery: University of Abuja at ₦1,500 with dropdown
- Site lock is currently ON in Firestore — admin needs to toggle OFF to restore access

## Next session starts with
- The user requested a comprehensive multi-layer UI/UX/security audit of the entire app (was interrupted, deferred to next session)
- Skills to use: ui-ux-pro-max, impeccable, security-review
- Audit should cover: UI flaws, UX flaws, retention flaws, security gaps, misplaced features, disconnected pages, fonts, what makes it look like a side project vs company
- Score the current state out of 1000 and show projected score after fixes

## Open questions
- Git commit was never made — classifier was down. Need to commit all changes: `git add -A && git commit -m "Lock page simplification, Abuja delivery, force-lock, header timer toggle"`
- Full UI/UX/security audit deferred to next session

---

# Session 3 — Lock Page UI/UX Polish & Timer Toggle Fix

Last updated: 2026-07-13

## What was built

### 1. Timer Toggle Actually Works Now (LockPage.jsx)
- **Problem**: We had stripped ALL countdown logic from LockPage in session 2. Turning the timer ON in admin settings did nothing on the lock page — only affected the header announcement bar.
- **User clarification**: They want the launch countdown (days/hours/mins/secs) to be toggleable — sometimes ON, sometimes OFF. The MM:SS "ACCESS OPENS IN" duration timer is NOT wanted.
- **Fix**: Re-added the launch date countdown to LockPage.jsx, conditional on `settings?.lock_timer_enabled`:
  - Timer ON: shows days/hours/mins/secs countdown above the waitlist section
  - Timer OFF (default): no countdown, just waitlist + password
- Also re-added the countdown useEffect with `timerEnabled` and `settings?.launch_date` dependencies

### 2. Lock Page Full UI/UX Redesign (LockPage.jsx)
- Applied UI/UX Pro Max skill guidelines for professional polish:
  - **Layout**: Fixed container `max-w-[340px]`, consistent spacing scale (mb-10, mb-8, mb-5, my-7, mt-12)
  - **Forms**: Added `sr-only` labels for accessibility, `min-h-[44px]` touch targets, `autoComplete` attributes
  - **Inputs**: Changed from bottom-border only to full `border border-black/8` with `focus:border-black/20` — clearer interaction area
  - **Buttons**: Added `active:scale-[0.98]` press feedback, `disabled:cursor-not-allowed`, `duration-150` transitions
  - **Accessibility**: `pointer-events-none` on icons, proper heading hierarchy (h1/h2), focus states on inputs
  - **Animation**: Removed all stagger `animationDelay` — was creating visual clutter
  - **Primary vs Secondary CTA**: ENTER NYNTH is solid black (primary), ADD TO LIST is outline (secondary) — clear visual hierarchy
  - **Footer**: Simplified to just "© NYNTH WORLD" (removed "ALL RIGHTS RESERVED")
  - **Countdown**: Uses `React.Fragment` with map instead of duplicated blocks — cleaner DOM
- Colors and fonts NOT changed — same black/white palette and font classes

### 3. Git Commit Made
- Committed all session 1+2+3 changes: `git add -A && git commit`
- Was previously blocked by classifier being down

## Files modified this session
- `src/pages/LockPage.jsx` — Timer logic re-added (conditional), full UI/UX redesign
- `memory.md` — Updated with session 3 notes

## Current state
- Lock page has two modes controlled by `lock_timer_enabled`:
  - OFF (default): Logo → Titles → Waitlist → OR → Password → Footer
  - ON: Logo → Titles → Countdown → Waitlist → OR → Password → Footer
- Header announcement bar also conditional on same toggle
- All changes committed to git
- Lock page is now polished and professional — proper spacing, accessibility, touch targets, focus states

## What was deferred (NOT started)
- **Full app UI/UX/security audit** — user wants this for ALL pages (shop, checkout, cart, product detail, etc.)
  - Use shop page as the "source of truth" for styling
  - Find inconsistencies across pages
  - Global CSS to remove inline styles
  - Security review
  - Code principles audit
  - Skills: /architect, /impeccable, /ui-ux-pro-max, /security-review
  - **CRITICAL**: Launch day is tomorrow (2026-07-14) — must be careful not to break anything
  - User wants safe polishes and security tightening only

## Open questions
- Full app audit deferred to next session
- Launch day is 2026-07-14 — any changes must be non-breaking polishes only

---

# Session 4 — Discount System, Strikethrough Pricing & "You May Like"

Last updated: 2026-07-20

## What was built

### 1. Discount Codes System (Admin + Checkout)
- **firebaseFunctions.js** — Discount code CRUD + `validateDiscountCode` (existed from prior session, confirmed)
- **DiscountCodes.jsx** (new) — Full admin page at `/admin/discount-codes` with list, add/edit modal, toggle active, delete
- **AdminLayout.jsx** — Added "Discount Codes" sidebar link with Tag icon
- **App.jsx** — Lazy import + route at `/admin/discount-codes` (protected admin route)
- **Checkout.jsx** — Discount code input in order summary, apply/remove logic, discount line in totals, `discountCode` + `discountAmount` saved to order data

### 2. Strikethrough Pricing (Pricing Psychology)
- **Products.jsx** — New `compareAtPrice` field in admin product form (number input, optional)
- **ProductCard.jsx** — Strikethrough display in both "view" and "model" modes when `compareAtPrice > price`
- **ProductDetail.jsx** — Same strikethrough on desktop and mobile price displays

### 3. "You May Like" Recommendations
- **ProductDetail.jsx** — Added recommended products section: fetches 4 products by category → tags → random fallback, shows in 2-column grid below product info, above description (both desktop and mobile)
- Uses existing `fetchRecommendedProducts` from firebaseFunctions.js and `ProductCard` component

## Key files
- `src/api/firebaseFunctions.js` — All discount CRUD + validation + recommended products
- `src/pages/admin/DiscountCodes.jsx` — Admin discount code management (NEW)
- `src/components/admin/AdminLayout.jsx` — Sidebar with discount codes link
- `src/App.jsx` — Route for discount codes page
- `src/pages/admin/Products.jsx` — compareAtPrice field in form
- `src/components/products/ProductCard.jsx` — Strikethrough price display
- `src/pages/ProductDetail.jsx` — Strikethrough + "You May Like" section
- `src/pages/Checkout.jsx` — Discount code input + application

## Decisions made
- Discount codes stored in own Firestore collection (`discount_codes`)
- Admin picks percentage or fixed amount per code
- No usage limits for now — easy to add later
- Discount applies to subtotal before shipping, single code per order
- `compareAtPrice` is nullable number field — visual only, independent of discount codes
- "You May Like" is automatic based on category/tag similarity

## Current state
- Build compiles clean
- All 4 features implemented and ready
- **NOT YET VERIFIED AT RUNTIME** — verification was interrupted

## Next session starts with
- **VERIFY all changes at runtime** — run the app, test each feature end-to-end
- Git commit: `git add -A && git commit -m "Discount system, strikethrough pricing, you may like recommendations"`
- Full app UI/UX/security audit still deferred

## Open questions
- Runtime verification pending
- Git commit not yet made
- Full app audit still deferred from session 3

---

# Session 5 — Abuja District Delivery & Same Day Delivery Text Removal

Last updated: 2026-07-20

## What was built

### 1. Removed "Same Day Delivery" Text from Checkout (Checkout.jsx)
- Removed the `{LAGOS_SHIPPING_DATA[form.city}.speed} [PRISON SPEED]` span from the shipping summary section (was showing below each Lagos area)
- Removed the `{ABUJA_SHIPPING_DATA[form.city].speed}` span from the shipping summary section (was showing below each Abuja area)
- Weight info for interstate orders (non-Lagos, non-Abuja) retained — shows kg and excess weight
- Shipping summary now only shows: area name, dash, and fee amount — no speed text underneath

### 2. Expanded Abuja District Delivery Prices (locationData.js)
- Replaced single "University of Abuja" (₦1,500) entry with 21 Abuja area entries:
  - University of Abuja / Iddo — ₦3,500
  - Gwagwalada — ₦4,000
  - Giri — ₦3,500
  - Lugbe — ₦4,500
  - Wuse / Jabi / Utako / Maitama — ₦5,000
  - Asokoro / Guzape — ₦6,000
  - Kubwa / Gwarinpa / Dawaki / Katampe — ₦5,000
  - Apo / Lokogoma / Galadimawa / Gaduwa / Garki / Durumi — ₦5,000
  - Kuje — ₦5,000

## Decisions made
- Lugbe set at ₦4,500 as default — user mentioned "4500/4000 depending on address" but didn't specify how to split. Left as single entry at 4500 pending clarification.
- The `speed` property still exists in locationData.js but is no longer displayed anywhere in the UI.

## Files modified
- `src/pages/Checkout.jsx` — Removed delivery speed text spans from shipping summary
- `src/data/locationData.js` — Expanded ABUJA_SHIPPING_DATA with full district list

## Current state
- Both files compile clean (zero diagnostics)
- Checkout shipping summary shows area + fee only (no speed text)
- Abuja dropdown in checkout now shows 21 areas instead of 1
- Speed field in locationData is orphaned (not referenced) — harmless, could be cleaned up later

## Next session starts with
- Full app UI/UX/security audit still deferred from session 3
- Git commit pending: `git add -A && git commit -m "Remove delivery speed text from checkout, expand Abuja districts"`
- Runtime verification of all accumulated changes pending

## Open questions
- Lugbe pricing: user said "4500/4000 depending on address" — may need splitting into two entries
- Git commits for session 4 and 5 still not made
- Full app audit still deferred
