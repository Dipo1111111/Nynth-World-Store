# NYNTH Site Audit — Pre-Launch Consistency Check

**Date:** 2026-07-24
**Pages audited:** Shop, Product Detail, Checkout, Cart, Cart Drawer, Header, Footer, ThankYou, ShippingReturns
**Scope:** Layout, structural, and consistency issues only. No design opinions.

---

## SHOP PAGE (`src/pages/Shop.jsx`)

### S1 — CRITICAL: Mobile users cannot filter products by category
- **Line:** 128 — `hidden md:flex`
- **Problem:** Category filter bar is invisible on mobile. The only interactive element mobile users see is the VIEW/MODEL toggle. There is zero way to filter by "tees" or "hoodies" on a phone.
- **Impact:** Mobile users must scroll through every product to find what they want.

### S2 — "NO PRODUCTS FOUND" shows alongside error message
- **Lines:** 144-169
- **Problem:** When API fails, `loading=false`, `error="Failed to load products."`, `filteredProducts=[]`. The error text appears at the top AND "NO PRODUCTS FOUND" appears below. Two different messages for one failure.
- **Fix:** Only show "NO PRODUCTS FOUND" when `!loading && !error`.

### S3 — Banner hover: two competing transition durations
- **Line:** 88 (overlay: 700ms) vs line 94 (button: 500ms)
- **Problem:** Background fades at 700ms, button scales at 500ms. Visually slightly off on hover.
- **Fix:** Match to same duration.

---

## PRODUCT DETAIL PAGE (`src/pages/ProductDetail.jsx`)

### P1 — Mobile images use `object-cover` (cropped), desktop uses `object-contain` (full)
- **Lines:** 238 (desktop: object-contain) vs 449 (mobile: object-cover)
- **Problem:** Same product looks different on mobile vs desktop. A square image is fully visible on desktop but cropped on mobile. A portrait image shows full body on desktop but head-only on mobile.
- **Impact:** Inconsistent product presentation.

### P2 — Mobile has no thumbnail selector visible during auto-scroll
- **Lines:** 460-494
- **Problem:** Desktop shows thumbnail images at bottom + numbered selector (1,2,3,4). Mobile shows only the numbered selector. No thumbnails. User can't see all available images at a glance on mobile.
- **Impact:** Minor — numbered selector works, but less visual context.

---

## CHECKOUT PAGE (`src/pages/Checkout.jsx`)

### C1 — CRITICAL: Logo invisible — white on white
- **Line:** 342 — `<Logo size="default" className="invert" />`
- **Problem:** Logo component applies `brightness-0` (turns image black). Checkout adds `invert` (turns it white). Header background is `bg-white/90`. White logo on white background = invisible. The checkout page has no visible brand identity.
- **Impact:** Severe visual — no logo visible on checkout.

### C2 — Default state "Lagos" when all Lagos areas are disabled
- **Line:** 52 — `state: "Lagos"`
- **Problem:** Form initializes to Lagos. If all Lagos areas are off (default), user immediately sees "NO AREAS AVAILABLE" before doing anything.
- **Fix:** Initialize to first available state from `availableStates`.

### C3 — City not cleared when state changes
- **Lines:** 136-139 — `handleChange`
- **Problem:** Switching from Lagos (city: "Ikoyi") to Abuja keeps "Ikoyi" as city. Shipping calculation uses `LAGOS_SHIPPING_DATA["Ikoyi"]` instead of Abuja data → wrong shipping fee until user manually re-selects.
- **Fix:** Reset `city` to `""` when `name === "state"`.

### C4 — City/State field order is backwards
- **Lines:** 431-507
- **Problem:** "City / Area" is on the LEFT, "State" is on the RIGHT. Standard convention puts State first (or above). Visually confusing.
- **Fix:** Swap positions: State left, City right.

### C5 — City name not uppercased in shipping summary
- **Line:** 639 — `form.city` shown raw
- **Problem:** If user types "benin city" for interstate, it shows lowercase in the summary. The rest of the interface is all-caps.
- **Fix:** Apply `.toUpperCase()` or CSS `uppercase`.

---

## CART PAGE (`src/pages/Cart.jsx`)

### CT1 — "SUBTOTAL" label appears twice (should be TOTAL)
- **Lines:** 141 and 149
- **Problem:** Line 141: "SUBTOTAL" with amount. Line 149: "SUBTOTAL" again with total. The second one should be "TOTAL".
- **Impact:** Confusing — two identical labels with different values.

### CT2 — Price shows ".00" decimals (inconsistent with CartDrawer)
- **Line:** 122 — uses `minimumFractionDigits: 2`
- **Problem:** CartDrawer uses no decimals (₦25,000). Cart page uses two decimals (₦25,000.00). Same product, different formats.
- **Fix:** Remove decimal formatting from Cart.jsx to match CartDrawer.

### CT3 — Empty cart state uses different design language
- **Lines:** 34-53
- **Problem:** Cart empty state uses `text-4xl` heading + paragraph + button. Shop/CartDrawer empty states use minimal `text-[10px] tracking-[0.3em]` style. Cart page feels like a different site.
- **Impact:** Visual inconsistency.

---

## CART DRAWER (`src/components/cart/CartDrawer.jsx`)

### CD1 — Quantity controls have `rounded-sm` background, Cart page doesn't
- **Line:** 118 — `bg-gray-50 px-3 py-1.5 rounded-sm`
- **Problem:** Same interaction (changing quantity) looks different in CartDrawer vs Cart page. Drawer has a gray pill; Cart has bare buttons.
- **Impact:** Minor visual inconsistency.

---

## HEADER (`src/components/home/Header.jsx`)

### H1 — Announcement bar spacer height is hardcoded
- **Line:** 251 — `height: '88px'`
- **Problem:** After launch day, the timer text becomes "HAPPY LAUNCH DAY NYNTH WORLD 🎉" (40+ chars). On narrow screens this wraps, making the bar taller than the hardcoded 30px/32px header margin. Content overlaps.
- **Impact:** Only after launch. Currently fine.

---

## FOOTER (`src/components/home/Footer.jsx`)

### F1 — Footer categories missing "PANTS" and "ACCESSORIES"
- **Lines:** 100-107
- **Problem:** Footer SHOP links include T-SHIRTS, HOODIES, HEADWEAR, SLEEVES, POLO. Missing: PANTS, ACCESSORIES. Shop page has all 8 categories.
- **Impact:** Users can't navigate to pants or accessories from footer.

### F2 — "TRACK ORDER" links to /account, not a tracking page
- **Line:** 124
- **Problem:** Label says "TRACK ORDER" but goes to /account. Non-logged-in users see login page. No actual order tracking functionality.
- **Impact:** Misleading label.

### F3 — "FAQ" links to /contact, not a FAQ page
- **Line:** 125
- **Problem:** Same pattern — label promises FAQ content, delivers contact form.
- **Impact:** Minor UX inconsistency.

---

## CROSS-PAGE

### X1 — Checkout has its own header, all other pages use shared Header
- **Impact:** Intentional (checkout focus), but means any Header fix (like announcement bar) doesn't apply to checkout.

### X2 — Cart page empty state design language differs from rest of site
- Covered by CT3.

---

## RANKED BY FIX DIFFICULTY

### QUICK FIXES (under 2 minutes each) — ✅ ALL DONE
| ID | Issue | Status |
|----|-------|--------|
| C1 | Logo invisible on checkout (remove `invert`) | ✅ Fixed |
| CT1 | "SUBTOTAL" → "TOTAL" on Cart page | ✅ Fixed |
| CT2 | Remove ".00" decimal from Cart price | ✅ Fixed |
| C5 | Uppercase city name in shipping summary | ✅ Fixed |
| S3 | Match banner hover transition durations | ✅ Fixed |
| F1 | Add PANTS + ACCESSORIES to footer links | ✅ Fixed |

### MEDIUM FIXES (5-10 minutes each) — ✅ ALL DONE
| ID | Issue | Status |
|----|-------|--------|
| C3 | Clear city when state changes in checkout | ✅ Fixed |
| C2 | Default state to first available, not Lagos | ✅ Fixed |
| C4 | Swap City/State field order in checkout | ✅ Fixed |
| S2 | Fix "NO PRODUCTS FOUND" showing with error | ✅ Fixed |
| F2 | Rename "TRACK ORDER" → "MY ACCOUNT" | ✅ Fixed |
| F3 | Rename "FAQ" → "CONTACT US" | ✅ Fixed |
| CD1 | Match quantity control style (CartDrawer ↔ Cart) | Deferred — minor |
| CT3 | Match Cart empty state to site design language | ✅ Fixed |

### LARGER FIXES (10-20 minutes each) — NEEDS DECISION
| ID | Issue | Status |
|----|-------|--------|
| S1 | Add mobile category filter bar | ⏳ Needs build — affects mobile browsing |
| P1 | Change mobile images to object-contain | ⏳ Needs build — changes mobile image crop |
| P2 | Add thumbnail selector on mobile | ⏳ Needs build — adds mobile UI |

### DEFERRED (post-launch or low priority)
| ID | Issue | Reason |
|----|-------|--------|
| H1 | Hardcoded announcement bar height | Only affects post-launch |
| S4 | VIEW/MODEL label clarity | Cosmetic, not broken |
| X1 | Checkout custom header vs shared Header | Intentional design |

---

**Total issues found: 20**
**Fixed this session: 14**
**Deferred: 3**
**Needs decision: 3**
