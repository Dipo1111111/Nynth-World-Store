# CODEBASE.md — NYNTH World Admin + Storefront Map

Single React SPA (Vite, Tailwind v4, react-router v7) hosting the public storefront and
the admin panel, backed entirely by Supabase + Deno Edge Functions.

## Route Map (`src/App.jsx`)

| Route | Page | Notes |
|---|---|---|
| `/shop` | `src/pages/Shop.jsx` | `/` and `/home` redirect here |
| `/lookbook` | `src/pages/Lookbook.jsx` | |
| `/product/:id` | `src/pages/ProductDetail.jsx` | |
| `/cart`, `/checkout`, `/thank-you` | `Cart.jsx`, `Checkout.jsx`, `ThankYou.jsx` | payment via `initializePayment` → Paystack popup → `verifyOrderPayment` |
| `/login`, `/signup`, `/forgot-password`, `/account` | auth pages | `/account` wrapped in `ProtectedRoute` |
| `/privacy-policy`, `/terms-of-service`, `/shipping`, `/returns`, `/contact`, `/our-story`, `/sustainability` | static/legal pages | `/shipping` and `/returns` share `ShippingReturns.jsx` |
| `/403`, `/500` | `ErrorPage.jsx` | |
| `/admin…` | `src/pages/admin/*` | lazy-loaded, `ProtectedRoute requireAdmin` |
| `*` | `LockPage.jsx` / `NotFound.jsx` | locked when `lock_page_enabled`; `WaitlistConfirmation` reachable while locked |

### Admin routes
- `/admin` — `AdminDashboard.jsx`
- `/admin/orders` — `Orders.jsx`
- `/admin/abandoned-checkouts` — `AbandonedCheckouts.jsx`
- `/admin/products` — `Products.jsx`
- `/admin/lookbooks` — `Lookbooks.jsx`
- `/admin/subscribers` — `Subscribers.jsx`
- `/admin/settings` — `Settings.jsx`
- `/admin/discount-codes` — `DiscountCodes.jsx`

### App-level wiring (`App.jsx`)
- `SettingsProvider` → `AuthProvider` → `CartProvider`; `HelmetProvider`, global `Toaster` (black, uppercase, letter-spaced).
- `PageTracker`: writes/updates/deletes a `presence` row per browser session, `logPageView()` (GA4), increments `visits` counter, scrolls to top.
- Lock logic: if `settings.lock_page_enabled` and user is not admin and `lock_epoch` stored mismatch → only `/waitlist-confirmation` is reachable, everything else renders `LockPage`.
- `ErrorBoundary` wraps the routed tree.

## API layer (`src/api/`)
- `supabase.js` — Supabase client + Cloudinary config.
- `supabaseFunctions.js` — **the real implementation** (Firestore-shaped API surface over Postgres). ~55 exports:
  - Products/lookbooks: `fetchProducts`, `fetchSingleProduct`, `addProduct`, `updateProduct`, `deleteProduct`, `updateProductOrderBatch`, `deleteMultipleProducts`, `fetchProductsByCategory/Tag`, `searchProducts`, `fetchFeaturedProducts`, `fetchNewArrivals`, `fetchRelatedProducts`, `fetchRecommendedProducts`, `getProductStats`, plus lookbook twins.
  - Orders: `addOrder`, `fetchOrders`, `fetchOrder`, `getAllOrders`, `subscribeOrders`, `updateOrderStatus`, `updateOrderPaymentStatus`, `seedOrders`, `initializePayment`, `verifyOrderPayment`.
  - Subscribers: `addSubscriber`, `fetchSubscribers`, `subscribePresence`, `mergeSubscriberDuplicates`.
  - Marketing: `addDiscountCode`, `updateDiscountCode`, `fetchDiscountCodes`, `deleteDiscountCode`, `validateDiscountCode`, `fetchAnalyticsCounters`, `getAdminAnalytics`, `fetchGA4Analytics`.
  - Settings/contact: `fetchSettings`, `updateSettings`, `saveContactMessage`.
  - Email: `sendOrderConfirmation`, `sendBulkEmail`, `sendTriggerEmail`.
  - Images: `uploadImage` (Cloudinary), `uploadImageToCloudinary`, `uploadMultipleImages`, `uploadMultipleImagesToCloudinary`.
- `firebaseFunctions.js` — **one-line alias** re-exporting `supabaseFunctions.js` (compat only; no Firebase code remains).
- `cloudinary.js` — Cloudinary upload/optimization helpers.
- `supabaseFunctions.test.js` — the Vitest suite.

## Key flows
- **Payments**: `Checkout.jsx` calls `initializePayment` (Edge Function) to open a Paystack popup with the `orderId` baked into the callback URL; on success the client calls `verifyOrderPayment(ref)`; Paystack also calls `paystack-webhook` server-side for full autos. Orders start `payment_status: "pending"`.
- **E-tickets**: items with `category === "tickets"` carry `eventDateTime`/`venue`; `utils/tickets.js` (de)serializes ticket payloads and `formatEventDate` renders them; ticket codes are attached to the order and sent by email.
- **Shipping**: `utils/shippingRates.js` + `data/locationData.js` hold Lagos/Abuja/interstate tables; `ShippingRatesEditor` + Settings `Shipping Locations` toggles drive them; interstate = ₦1,500/kg above 3kg.
- **Admin metrics**: only LIVE orders (never `isTest`) count toward dashboard/Orders numbers. GA4 Data API pulled through `get-ga4-analytics`.
- **Lock page**: password `WINNERSONLY` default; enabling the lock bumps `lock_epoch` to force-relock everyone.

## Edge Functions (`supabase/functions/`)
| Function | Purpose |
|---|---|
| `initialize-payment` | Starts a Paystack charge; kobo amounts; embeds `orderId` in callback URL |
| `paystack-verify` | Finalizes a pending order after a successful charge; idempotent (`alreadyPaid`) |
| `paystack-webhook` | Server-side charge.confirmation handler |
| `send-bulk-email` | Resend-driven bulk mailer |
| `get-ga4-analytics` | GA4 Data API metrics for the dashboard |

`_shared/email.ts` — shared Resend/sender helpers used by functions. Writes require the server-side secret (`SUPABASE_ACCESS_TOKEN` in `.secrets/supabase.env`; never committed).

## Reusable components (`src/components/`)
- `ui/` — design-system primitives built on Radix/CVA: `button`, `card`, `badge`, `select`, `table`.
- `admin/` — `AdminLayout` (sidebar shell), `StatusDropdown`, `ShippingRatesEditor`, `AdminPWAPrompt`.
- `common/` — `ErrorBoundary`, `WhatsAppButton`, etc.
- `protected/…`, `cart/`, `products/`, `shop/`, `home/`, `newsletter/`, `tickets/` — storefront blocks.

## Context & hooks
- `src/context/` — `AuthContext` (incl. `isAdmin`), `CartContext`, `SettingsContext` (site settings live here).
- `src/hooks/useOffline.js` — online/offline detection driving the offline banner.

## Lib & utils
- `src/lib/charts.js` — Chart.js chart factory reading `--chart-*` CSS tokens (single source of chart colors).
- `src/lib/motion.js` — `useCountUp`, `useStaggerReveal` (GSAP) helpers used across admin pages.
- `src/lib/utils.js` — `cn()` (clsx + tailwind-merge).
- `src/utils/` — `imageUtils` (browser compress → upload), `shippingRates`, `tickets`, `monitoring` (Sentry + GA4), `errorHandlers`.

## Design language
See `src/index.css` token layer + `src/styles/globals.css`. Minimal-luxury: ink `#0c0c0c`, hairline `border-black/[0.06]`, `bg-black/[0.02]` fills, `shadow-card`/`shadow-card-hover`/`shadow-raised`, tinted chips, uppercase `tracking-widest` micro-labels, `.admin-table` / `.admin-toolbar` / `.admin-control` / `.segmented-control` / `.focus-ring` utilities. **Rule: no inline `style={{…}}` for design** (only dnd-kit drag `style` objects in `Products.jsx`); put shared classes in the token layer instead.

## Verification
```bash
npm run lint       # ESLint — must pass with 0 warnings (gated in CI)
npm test           # Vitest (20 tests)
npm run test:edge  # Deno tests for edge functions (8 tests)
npm run build      # Vite production build
```
Run all four before pushing; CI gates on lint + tests.

## Configs
- `package.json` — scripts above; Tailwind v4 via `@tailwindcss/vite`.
- `vercel.json` — SPA rewrite to `/index.html`.
- `eslint.config.js` — flat config; zero-warning policy.
- `index.html` — entry; `src/main.jsx` mounts `App`.
- `supabase/schema.sql` — source of truth for the Postgres schema.