# Memory — Lock Page Timer & Password

Last updated: 2026-07-13

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
