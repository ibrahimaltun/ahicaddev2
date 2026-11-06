# Ahicadde — Fix Report

**Date:** 2026-11-03
**Scope:** Full-repo defect scan and fix across the FastAPI backend, Next.js frontend, Alembic migrations, Docker/Compose/Jenkins infrastructure.

---

## 1. Executive Summary

The repository was reviewed end-to-end (backend API/models/schemas/migrations, frontend pages/feature modules/API clients, infra configs). **21 defects** were found and fixed, including two blockers that made the project unbuildable/unrunnable in its committed state:

| # | Severity | Area | Problem |
|---|----------|------|---------|
| 1 | 🔴 Critical | Backend | Cart API router completely empty (no endpoints) |
| 2 | 🔴 Critical | Database | No Alembic migration created `carts` / `cart_items` tables |
| 3 | 🔴 Critical | Database | `seller_applications.user_id` never actually migrated (empty migration → schema drift caught by `alembic check`) |
| 4 | 🔴 Critical | Frontend | `SubmitEvent` is not a React export → TypeScript build failed |
| 5 | 🔴 Critical | Frontend | No `/api/*` rewrite → all client-side API calls 404 in dev |
| 6 | 🟠 High | Backend | JWTs had no `exp` claim — tokens never expired |
| 7 | 🟠 High | Backend | Anyone (anonymous) could create products/categories |
| 8 | 🟠 High | Backend | `Settings` crashed on boot when `.env` contained compose-only variables |
| 9 | 🟠 High | Frontend | Dead links `/urunler`, `/kategoriler` (404) in header, home page, sitemap |
| 10 | 🟠 High | Frontend | `bg-neutral-750` — a color that does not exist in Tailwind → invisible buttons |
| 11 | 🟠 High | Frontend | Admin panel was a stub while seller-approval backend APIs sat unused |
| 12 | 🟡 Medium | Backend | Duplicate `get_db` definitions in 4 API files |
| 13 | 🟡 Medium | Backend | Duplicate slug / bad category/brand FK caused raw 500s instead of 4xx |
| 14 | 🟡 Medium | Backend | Cart quantity schemas allowed `quantity < 1` |
| 15 | 🟡 Medium | Backend | No test suite although `pytest` was in requirements |
| 16 | 🟡 Medium | Frontend | Invisible links (`class="hidden"` on login/home links in account + admin pages) |
| 17 | 🟡 Medium | Frontend | `robots.txt` disallowed fictional routes; sitemap referenced dead routes |
| 18 | 🟡 Medium | Repo | `cookies.txt` with a live JWT session committed to git |
| 19 | 🟡 Medium | Repo | Duplicate stale API client `frontend/lib/api.ts` |
| 20 | 🟢 Low | Repo | `Makefile` referenced non-existent `.env.local` and non-existent compose services |
| 21 | 🟢 Low | Repo | `.env` `DATABASE_URL` pointed at docker hostname `postgres`, breaking host-run dev backends |

---

## 2. Backend Fixes (`backend/`)

### 2.1 Cart API implemented (`app/api/v1/cart.py`) — was empty
The models (`Cart`, `CartItem`) and schemas existed, but the router had **zero endpoints** and wasn't even registered in `main.py`. Implemented, following the existing code style:

- `GET /api/v1/cart` — returns (or lazily creates) the user's cart with items + product info.
- `POST /api/v1/cart/items` — validates the product exists and is active, **merges duplicate lines**, and enforces **stock limits (409)**.
- `PATCH /api/v1/cart/items/{item_id}` — updates quantity with stock validation; items of other users return **404**.
- `DELETE /api/v1/cart/items/{item_id}` — removes a line (204).

Registered in `app/main.py` (it had never been included).

### 2.2 Alembic migrations — schema drift fixed
- **New migration `b7c8d9e0f1a2`** creates `carts` (with unique `user_id` FK → `users`, ON DELETE CASCADE) and `cart_items` (FKs to `carts`/`products`, ON DELETE CASCADE, indexed) — matching the SQLAlchemy models exactly.
- **New migration `c0e1f2a3b4d5`** adds the missing `seller_applications.user_id` column + FK + index. The old `a1b2c3d4e5f6` revision ("add user_id…") never actually added it; `alembic check` exposed the drift. Since the FK requires the `users` table (created on the *other* branch of the migration fork), the fix is chained after the merge revision `1677736a612d`.
- **Verified:** fresh `alembic upgrade head` on real PostgreSQL 17, downgrade → re-upgrade round-trip, and `alembic check` → *"No new upgrade operations detected."*

### 2.3 JWT expiry (`app/core/security.py`, `app/api/v1/auth.py`)
- Tokens now embed `iat` and `exp` using `settings.access_token_expire_minutes`; PyJWT rejects expired tokens (401).
- Login cookie `max_age` now derives from the same setting (was a hardcoded `60*30`).
- Verified over HTTP: `exp - iat == 1800` for 30-minute setting; expired tokens are rejected by tests.

### 2.4 Authorization hardened
- `POST /api/v1/products` and `POST /api/v1/categories` now require `Depends(require_admin)`. Anonymous → 401, non-admin → 403 (was: anyone could create catalog content).

### 2.5 Settings boot crash fixed (`app/core/config.py`)
`Settings` used pydantic-settings defaults (extra = forbid) and crashed with `ValidationError` because the repo-root `.env` contains compose-only keys (`POSTGRES_PASSWORD`, …). Added `extra="ignore"`.

### 2.6 Integrity handling & cleanup
- Duplicate category/product slugs → **409** with a Turkish message (was raw 500 via `IntegrityError`).
- Unknown `category_id` / `brand_id` on product creation → **400** (was raw FK 500).
- Duplicated `get_db` definitions removed from `auth.py`, `cart.py`, `categories.py`, `products.py` — all import the single one from `app/db/session.py`.
- `GET /api/v1/products` gained an optional `?category=<slug>` filter (used by the new categories page).
- `/health/db` now returns **503 JSON** instead of an unhandled 500 when the database is unreachable.
- `ProductResponse` schema: misplaced field declarations (`brand_id`, `images` after `model_config`) reordered.
- Cart schemas: `quantity` constrained with `Field(ge=1)` for both create and update.

### 2.7 Test suite added (`backend/tests/`, `backend/pytest.ini`)
51 integration tests (FastAPI `TestClient` + isolated in-memory SQLite, FK pragmas enabled) covering:

- health endpoints, registration/login/logout/duplicate email/short password/expired tokens,
- admin-protected category & product CRUD, slug conflicts, category filtering, inactive-product hiding,
- the full cart flow (auth, create-on-first-use, merge, stock 409, ownership 404, non-positive quantity 422),
- the full seller-application flow (auth, honeypot → `id=0`, pending-duplicate 409, KVKK consent, admin list/filter, approve/reject, non-pending 409).

**Result: 51 passed.**

---

## 3. Frontend Fixes (`frontend/`)

### 3.1 Build blocker: `SubmitEvent` (`login/page.tsx`, `register/page.tsx`)
`import type { SubmitEvent } from "react"` — this type does not exist in React (it's a DOM interface). Replaced with `FormEvent<HTMLFormElement>`. This alone made `tsc`/`next build` fail; build now passes.

### 3.2 Dev-mode API proxy (`next.config.ts`)
Client-side calls go to `/api/v1/*` (same origin), but Next.js had no rewrite, so every browser API call 404'd in dev. Added `rewrites()` mirroring the production Caddy/nginx contract exactly: `/api/:path*` → `<backend origin>/api/:path*` (path unchanged; default origin `http://localhost:8000`, override with `API_PROXY_ORIGIN`). Verified live: `/api/v1/products` through the Next server returns backend JSON.

### 3.3 Dead links & missing pages
- `/urunler` → `/products` (header nav, home page, sitemap). Old route correctly 404s now.
- Created **`/kategoriler`** page (the header already linked to it): server component listing categories from `GET /api/v1/categories`, linking to filtered products.
- New `src/features/categories/` module (types + server-side API client) following the existing `products` feature pattern.
- `GET /api/v1/products?category=<slug>` support in `features/products/api.ts` + `searchParams` handling (Next 16 async `searchParams`) in the products page, with a filter-reset link.

### 3.4 Invalid Tailwind color `neutral-750` (3 files)
Tailwind's neutral palette has no `750`, so those buttons rendered **without any background** (white text on white page). Replaced with `bg-neutral-950` (+ correct hover states) in:
- `components/layout/header.tsx` (cart button),
- `app/cart/page.tsx` ("Alışverişe Devam Et"),
- `app/satici-ol/page.tsx` (also removed a conflicting `text-white text-neutral-700` pair).

Also fixed the home page's "Ürünleri Keşfet" button, which was `text-white` on a white background (invisible) and used `<a>` instead of `next/link`.

### 3.5 Admin panel: seller application review (uses previously-dead backend APIs)
`app/admin/page.tsx` was a stub ("Hoş geldiniz" + nothing) and had an invisible return link. It now:
- lists seller applications via `GET /api/v1/seller-applications/admin` with **pending/approved/rejected filter tabs**,
- shows full application details (business/individual type, tax category, product description, counts, contact),
- provides **Onayla / Reddet** actions wired to the approve/reject PATCH endpoints, with per-row busy state and error banners,
- keeps the existing `useAuth` admin gate (renders an "unauthorized" card with a visible home link otherwise).

New `src/features/seller-applications/` module (types + client API matching `SellerApplicationAdminOut`).

### 3.6 Invisible links fixed
`account/page.tsx` and `admin/page.tsx` used `className="hidden …"` on their login/home links — permanently invisible. Replaced with visible, styled links.

### 3.7 SEO route fixes
- `sitemap.ts`: `/urunler` → `/products`.
- `robots.ts`: disallowed fictional routes (`/hesabim/`, `/sepet/`, `/giris/`, `/kayit/`) replaced with the real ones (`/admin/`, `/account/`, `/cart/`, `/login`, `/register`, `/checkout/`).

### 3.8 Stale duplicate API client removed
`frontend/lib/api.ts` duplicated `src/lib/api/client.ts` (with a diverging error message) and was imported by nothing. Deleted (feature modules all use `@/lib/api/client`).

### 3.9 Lint quality
`eslint src` now reports **0 errors** (was 8): fixed the `react-hooks/set-state-in-effect` violations in the new admin effect and pre-existing `AuthProvider` (async-boundary pattern with cancellation), and escaped raw apostrophes (`&apos;`) in 5 pages (`ahilik`, `hizmet-ucretleri`, `home`, `register`, `saticilar`). Remaining: 3 pre-existing `<img>` **warnings** (non-failing; intentional for arbitrary remote product image URLs).

---

## 4. Repository / Infra Fixes

- **`cookies.txt` deleted** — it contained a live JWT session (credential leak in git). Added to `.gitignore` along with `.pytest_cache/`.
- **`Makefile`** — pointed at non-existent `.env.local`; commands also referenced `backend`/`frontend` services that don't exist in the dev `compose.yaml` (which is postgres+redis only). Now uses `.env` and valid commands. (`docker compose config` passes.)
- **`.env`** — `DATABASE_URL` changed from `@postgres:5432` (docker-internal hostname, breaks host-run backend) to `@localhost:5432`.
- **`compose.prod.yaml`** — validated with `docker compose config` (temporary throwaway `.env.prod`; not committed).
- **Jenkinsfile** — reviewed; pipeline stages (checkout → validate env → validate compose → build → `alembic upgrade head` → deploy → health check) are coherent with the fixed backend (backend image ships alembic, `app.main:app` boot verified).

---

## 5. Validation Performed

| Check | Result |
|---|---|
| `pytest` (backend, 51 tests) | ✅ 51 passed |
| `alembic upgrade head` (fresh PostgreSQL 17) | ✅ all revisions apply |
| `alembic downgrade -1` → `upgrade head` | ✅ round-trip OK |
| `alembic check` (model ↔ DB drift) | ✅ "No new upgrade operations detected" |
| `uvicorn app.main:app` boot against real PostgreSQL | ✅ healthy, `/health/db` connected |
| Live HTTP smoke test (register → promote → login → category → product → cart add/update/delete → seller application approve/reject, status codes incl. 401/403/409/204) | ✅ all correct |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npm run build` (Next.js 16.3.5) | ✅ all 17 routes compile |
| `npx eslint src` | ✅ 0 errors (3 pre-existing img warnings) |
| `next start` + `curl /api/v1/*` proxy & SSR pages (`/`, `/kategoriler`, `/products`) | ✅ 200s, real backend data rendered |
| `docker compose -f compose.yaml config` / `compose.prod.yaml config` | ✅ valid |

---

## 6. Remaining Recommendations (not changed, by design)

1. ~~**Frontend cart is still localStorage-based**~~ **✅ Done (addendum §7):** cart is now server-backed via `CartProvider`; guest-cart merge on login remains a possible UX refinement.
2. `.env` with dev-only secrets is still tracked in git. For production, rotate `JWT_SECRET`/`POSTGRES_PASSWORD` and untrack the file (`git rm --cached .env`).
3. Product images use plain `<img>` (3 lint warnings). Switching to `next/image` requires a configured remote loader for seller-supplied URLs.
4. ~~**The frontend `AddToCartButton` is not yet used inside `products/[slug]`**~~ **✅ Done (addendum §7):** wired into `products/[slug]` against the server cart.

---

## 7. Addendum — Checkout / Orders / Payment (2026-11-03)

The purchase funnel (previously: cart UI only, no checkout, no `Order` model, no payment) was completed end-to-end.

### 7.1 Backend — Orders

- **New models** `app/models/order.py` + `order_item.py`: `orders` (user FK CASCADE, `status`, `payment_method`, `total_price Numeric(12,2)`, shipping snapshot columns, timestamps) and `order_items` (order FK CASCADE, product FK **SET NULL** + `product_name`/`unit_price` **price snapshot**, quantity). Registered in `app/models/__init__.py`.
- **New migration `d4e5f6a7b8c9`** creates both tables (chained on `b7c8d9e0f1a2`); `alembic check` passes with zero drift.
- **New API `app/api/v1/orders.py`** (registered in `main.py`):
  - `POST /api/v1/orders` — checkout: validates the cart is non-empty, **row-locks products (`with_for_update`)**, validates stock (409 with remaining-stock message), creates the order in `pending_payment` with **atomic stock decrement + price snapshots + cart emptied** in a single transaction.
  - `GET /api/v1/orders` — current user's history (newest first, ownership-scoped).
  - `GET /api/v1/orders/{id}` — detail; other users' orders return **404** (admin may view any).
  - `POST /api/v1/orders/{id}/cancel` — owner cancels while `pending_payment`/`processing`; **restocks** all items; 409 otherwise.
  - `PATCH /api/v1/orders/{id}/status` (**admin only**) — `processing → shipped → delivered` flow; cancelling from a non-final state restocks; final states (`delivered`/`cancelled`) are immutable (409).
  - `GET /api/v1/orders/payment-info` — public IBAN-transfer instructions from `Settings` (new `payment_iban` / `payment_receiver` keys with dev defaults).
- `DELETE /api/v1/cart` — clears the whole cart (204) for the "Sepeti Temizle" action.
- `CartProductResponse` now includes `stock` and `image_url` (new `Product.primary_image_url` property) so the cart UI can render images and clamp quantity selectors.
- **`tests/test_orders.py`** — 14 new tests: auth (401), empty cart (400), multi-item totals, insufficient stock (409 with cart/stock preserved), price snapshot, history order + cross-user isolation (404), cancel restock, double-cancel (409), admin transitions, admin cancel restock, non-admin status update (403), public payment-info, cart clear.

### 7.2 Frontend — Server cart, checkout, order history

- **`features/cart/`**: localStorage Zustand store **removed**; new `CartProvider` (server-backed, user-scoped derived state — no sync setState in effects) + `api.ts` (`getCart`/`addCartItem`/`updateCartItem`/`removeCartItem`/`clearCart`) and a new `apiFetchEmpty` helper for 204 endpoints. `layout.tsx` nests `CartProvider` inside `AuthProvider`.
- **`components/product/AddToCartButton.tsx`** — now posts to the server cart, handles unauthenticated users (redirect to `/login`), busy/success/error states; wired into `products/[slug]` (was unused).
- **`app/cart/page.tsx`** — rewritten on the server cart: auth gate, stock-clamped quantity selector, error banner, `Sepeti Temizle`, and **"Ödeme Adımına Geç" → `/checkout`** (the button previously did nothing).
- **`app/checkout/page.tsx` (new)** — auth + empty-cart gates, Teslimat Bilgileri form (prefilled full name from the account), IBAN-transfer payment section, order-summary sidebar; on success refreshes the cart and redirects to `/orders/{id}?success=1`.
- **`app/orders/page.tsx` (new)** — "Siparişlerim" history: newest-first list with Turkish status badges and totals; auth gate.
- **`app/orders/[id]/page.tsx` (new)** — order detail: status badge, items with price snapshots, shipping info, **payment block (receiver + IBAN + "Sipariş #N" reference) when `pending_payment`**, cancel button for cancellable states, success banner after checkout (`useSearchParams` wrapped in `Suspense`).
- **`app/account/page.tsx`** — Siparişlerim / Sepetim shortcut cards. **`robots.ts`** — `/orders/` added to disallow (checkout was already listed).

### 7.3 Validation (this round)

| Check | Result |
|---|---|
| `pytest` (backend, 65 tests) | ✅ 65 passed (51 prior + 14 order-flow) |
| `alembic upgrade head` → `check` → `downgrade -1` → `upgrade` (PostgreSQL 16) | ✅ clean round-trip, zero model↔DB drift |
| Live API funnel (register → admin product → cart → checkout → stock 10→8 → cart emptied → history → admin `processing` → cancel → stock restored → payment-info → 401/404/400 guards) | ✅ all correct |
| `npx tsc --noEmit` | ✅ 0 errors |
| `npx next build` | ✅ 21 routes incl. `/checkout`, `/orders`, `/orders/[id]` |
| `npx eslint src` | ✅ 0 errors (4 `<img>` warnings, consistent with existing pages) |
| `next start` :3100 + proxied funnel (login → cart → checkout → stock → history through `/api/*`) + `/checkout`, `/orders` pages | ✅ all correct |

## 8. Addendum — Design System, Dark Mode, TR/EN, Seller Apps, Admin Panel, Online Catalog (2026-11-03)

### 8.1 Design system + dark/night theme
- **`globals.css`** — full token system (`:root` + `.dark`): `background/surface/surface-2/surface-3`, `foreground`+`muted`+`subtle`, `border(-strong)`, **terracotta brand `primary`/`primary-hover`/`primary-soft`**, `success|danger|warning|info` fg/bg/border triplets, `header-bg`, `footer-*`. Exposed to Tailwind v4 via `@theme inline` (`bg-surface`, `text-foreground-muted`, …) plus `@custom-variant dark`. Every color pair is chosen to pass AA contrast (e.g. primary `#9a3412`+white in light, `#c2410c`+white in dark — no more white-on-light-gray disabled buttons).
- **`components/ui/`** — reusable primitives: `button.tsx` (`Button` + `buttonClasses()`; variants primary/secondary/soft/ghost/danger/danger-outline/success × sizes sm/md/lg, guaranteed AA text pairs), `form.tsx` (`Label/Input/Select/Textarea/Field`), `badge.tsx` (`Badge` 6 tones), `notice.tsx` (`Notice` success/error/info/warning). All pages now consume these instead of ad-hoc neutral-* classes.
- **`features/theme/ThemeProvider.tsx` (new)** + inline `<head>` script in `layout.tsx` — cookie `ahicadde-theme` + localStorage + `prefers-color-scheme`, applied **before hydration** (no FOUC); sun/moon toggle in the header. `useI18n`-style `useTheme()` hook.
- **Header** redesigned: brand mark, tokenized nav with active state, TR/EN toggle, theme toggle, primary cart button with readable badge, mobile menu; **Footer** tokenized.

### 8.2 TR/EN translation (all pages)
- **`lib/i18n/dictionary.ts`** — single source: `tr` (source of truth, `as const`) + `en` typed as `Dictionary` (a widened structural type), so a missing/extra key in either language fails `tsc` (key-parity guarantee). `TranslationKey` is the flattened key union; `t("key", {vars})` supports `{var}` interpolation.
- **`features/i18n/LocaleProvider.tsx`** (client) + **`lib/i18n/server.ts`** (`getServerLocale()`/`getServerI18n()` reading cookie `ahicadde-locale`). Cookie is 1 year; toggling sets `document.lang`, swaps the dictionary client-side and `router.refresh()`es server pages.
- Translated: home, products, product detail, categories, cart, checkout, orders list/detail, login, register, account, seller pages (`/satici-ol`, `/satici-ol/basvuru`, `/saticilar`), static pages (Ahilik, Dayanışmacı Pazar Yeri, Hizmet Ücretleri), header, footer, admin panel. Date formatting uses the active locale.

### 8.3 Seller applications — full detail
- **Backend:** `SellerApplication` gains `admin_note` (text) + `decided_at` (timestamptz) — migration `e6f7a8b9c0d1`; approve/reject accept an optional `{"admin_note": "..."}` body, stamp `decided_at`, and the note is visible to the applicant via `GET /seller-applications/mine`. `email` in `SellerApplicationCreate` is now optional (server always binds the application to the account email). Rejected applications can re-apply (only one *pending* per user).
- **Frontend:** `/satici-ol/basvuru` rewritten as a detailed 3-section form (contact / business / products) with type-conditional business-name requirement, tax-number hints, product-count ranges, KVKK checkbox, honeypot, account-email display; **status view** (pending/approved) + rejection notice with admin note + re-apply; `/account` shows the applicant's status card with note.

### 8.4 Ultra-detailed admin panel (`/admin`)
- **New backend `app/api/v1/admin.py`** (all admin-guarded): `GET /admin/stats` (users/products/active/categories/orders/orders-by-status/revenue-excluding-cancellations/applications-by-status), `GET|PATCH /admin/users` (search, role change, activate/deactivate; **self-demotion/deactivation → 409**), `GET /admin/products` (inactive included, search, category filter), `PATCH|DELETE /admin/products/{id}` (edit name/price/stock/active/category; delete removes cart items first), `GET /admin/orders` (all users, status filter, items, `user_email`), **`POST /admin/catalog/import`**.
- **Frontend `/admin`** — 5 tabs: **Overview** (stat cards + status distributions), **Seller Applications** (filters, full detail, optional admin note, approve/reject), **Products** (search, inline stock/price editing, activate/deactivate, delete, catalog import), **Orders** (status filters, status transition select+update), **Users** (search, make/remove admin, activate/deactivate). Order `user` relationship added to the `Order` model for `user_email`.

### 8.5 Main page with products from an online API
- **`app/services/external_catalog.py`** — fetches **DummyJSON** (`dummyjson.com/products`, stdlib-free httpx, 15s timeout, `ExternalCatalogError`), slugifies, converts USD→TRY at a fixed documented rate (×47), guarantees stock ≥ 5, normalizes thumbnails.
- **`POST /api/v1/admin/catalog/import`** — admin-only, idempotent (skips existing slugs), creates categories + products + primary product images; returns created/skipped counts. Failures → 502. One click in the admin Products tab fills the storefront while there are no real sellers yet.
- **Home page** rewritten: hero + **"Öne Çıkan Ürünler" grid rendered server-side from the DB catalog** (imported from the online API), category strip, value sections; fetches with `revalidate: 0` so newly imported products appear immediately.

### 8.6 Validation (this round)

| Check | Result |
|---|---|
| `pytest` (backend) | ✅ 79 passed (65 prior + 14 new admin/catalog/seller-note tests) |
| `alembic upgrade head` incl. new `e6f7a8b9c0d1` (Postgres 17) | ✅ clean |
| Live funnel: register/login → DB-promoted admin → **DummyJSON import (12 real products, 3 categories, images)** → home renders product grid → cart → checkout → admin `processing` → customer cancel → stock restored → seller application → admin approve **with note** → `mine` shows note | ✅ all correct |
| TR/EN: cookie `ahicadde-locale=en` → server pages render English ("Featured Products"); toggle in header | ✅ |
| Dark theme: inline pre-hydration script + cookie + toggle | ✅ |
| Guards: admin 401/403 on all `/admin/*`, self-demote 409, import 502 on upstream failure | ✅ (unit) |
| `npx tsc --noEmit` | ✅ 0 errors (dictionary TR/EN parity enforced) |
| `npx eslint src` | ✅ 0 problems (errors **and** warnings) |
| `npx next build` | ✅ 21 routes |
| Env note | host Postgres still owns :5432 and rejects `.env` creds → smoke ran on throwaway container at :5433, removed afterwards |


## 9. Addendum — Auth Hardening: E-posta Doğrulama, Şifre Sıfırlama, Rate-Limit (2026-11-03)

Backlog'daki "kimlik doğrulama eksikleri" maddesi tamamlandı. Backend'e e-posta
doğrulama akışı, şifre sıfırlama akışı ve bellek-içi rate-limit altyapısı eklendi;
frontend'e üç yeni sayfa + hesabım doğrulama kartı geldi.

### Backend
- `app/core/rate_limit.py` (yeni): kayan-pencere (sliding window) bellek-içi limiter.
  `rate_limit(scope=..., limit=..., window_seconds=...)` dependency factory; 429 yanıtı
  `Retry-After` header'ı ile döner. Çoklu-proses/Redis gerektiğinde tek değişim noktası `limiter` nesnesi.
  - Login: IP başına 10/dk **+** e-posta başına 5/dk (başarılı+başarısız hepsi sayılır)
  - Register: IP 5/dk · Forgot-password: IP 5/dk + e-posta 3/dk · Reset: IP 5/dk
  - Verify-email: IP 10/dk · Send-verification: IP 5/dk
- `app/services/email.py` (yeni): e-posta servisi. `email_backend=console` (varsayılan)
  link'i stdout'a yazarak dev/smoke ortamlarında token'ı görünür kılar; `smtp` modunda
  SMTP ile gönderir (`smtp_host/port/user/password/email_from` ayarları eklendi).
  `frontend_url` ayarı e-postadaki linkleri kurar (varsayılan `http://localhost:3100`).
- `app/models/user.py` + migration `f7a8b9c0d1e2`: `users` tablosuna
  `verification_token`, `verification_token_expires`, `reset_token`, `reset_token_expires`
  (token'lar DB'de **sha256 özeti** olarak saklanır; ham token yalnızca e-postada dolaşır).
- `POST /auth/forgot-password`: kullanıcı varlığı **belirtilmez** (enumeration önlemi);
  her durumda aynı genel yanıt. Aktif kullanıcıya 60 dk geçerli tek kullanımlık link gönderilir.
- `POST /auth/reset-password`: token özeti + süre kontrolü → şifre güncellenir, token temizlenir.
- `POST /auth/verify-email` + `POST /auth/send-verification`: kayıtta otomatik doğrulama
  e-postası; e-posta gönderim hatası kaydı bozmaz (kullanıcı hesabım sayfasından yeniden isteyebilir).
- **Tasarım kararı:** doğrulanmamış e-posta girişi engellemez (SMTP kurulana kadar demo akışı
  kırılmaz); `is_verified` durumu `UserResponse` üzerinden görünür, sonraki adımda kapı
  `require_email_verified` dependency ile zorlanabilir.
- `tests/test_auth_security.py` (yeni, 17 test): doğrulama (geçerli/tek kullanımlık/geçersiz),
  şifre sıfırlama (link gönderimi, güncelleme, tek kullanımlık, süresi dolmuş, kısa şifre),
  rate-limit (login e-posta limiti, register IP limiti, forgot e-posta limiti, reset sonrası
  başarılı giriş). `conftest.py`'ye her testte limiteri sıfırlayan autouse fixture eklendi.

### Frontend
- Yeni sayfalar: `/sifremi-unuttum` (form), `/sifre-sifirla?token=` (yeni şifre + tekrar
  eşleşme kontrolü; token yoksa hata ekranı), `/email-dogrula?token=` (otomatik doğrulama,
  `cancelled` bayrağı ile).
- `/login`'e "Şifremi unuttum?" bağlantısı; `/account`'a doğrulama durumu kartı
  (Badge: doğrulanmış/uyarı + doğrulanmamışsa "Doğrulama e-postası gönder" butonu).
- `robots.ts`: token barındıran üç sayfa disallow listesine eklendi.
- Sözlük: `auth.*` bölümüne 28 yeni anahtar (TR/EN parity tsc ile garanti).

### Doğrulama
| Kontrol | Sonuç |
|---|---|
| `pytest tests/` | ✅ 96 passed (79 eski + 17 yeni) |
| `alembic upgrade head` (5433 Postgres) | ✅ 4 yeni kolon + 2 indeks |
| Canlı: kayıt → console e-posta → token → `/auth/verify-email` | ✅ 200, `is_verified=t`, token tek kullanımlık (2. deneme 400) |
| Canlı: forgot → reset → eski şifre 401 / yeni şifre 200 | ✅ |
| Canlı: 5 yanlış giriş → 429 + `Retry-After` | ✅ |
| `npx tsc --noEmit` / `npx eslint src` / `npx next build` | ✅ 0 hata / 0 problem / 22 route |
| Smoke sonrası | uvicorn+next durduruldu, smoke container silindi, /tmp temizlendi |

## 10. Addendum — Gerçekçi Vitrin, Örnek Ürün Uyarısı, Arama, Öneriler ve Tam SEO (2026-11-03)

### Vitrin (ana sayfa) — gerçek e-ticaret düzeni
- Header sadeleştirildi: "Ürünler / Kategoriler / Ahilik / Satıcı Ol" sayfa linkleri kaldırıldı
  (bu sayfalar footer'dan ve doğrudan URL'den erişilebilir kalmaya devam eder — SEO için 200 döner).
  Yerine profesyonel e-ticaret standardı olarak **arama kutusu** eklendi (desktop'ta ortada,
  mobil menüde üstte; `role="search"`, `/products?q=...`'e gider).
- Ana sayfa bölümleri: Ahilik hero'su (istenen metin aynen korundu: "AHİLİK ANLAYIŞINDAN İLHAM
  ALAN E-TİCARET / Emeğin değerini koruyan, dayanışmayla büyüyen pazar yeri. / Ahicadde; ahilik
  kültürünün dayanışma, paylaşma, dürüstlük ve karşılıklı güven anlayışından ilham alan yeni nesil
  bir e-ticaret pazaryeridir.") → güven şeridi (3 madde) → Kategoriler → Öne Çıkan Ürünler (8) →
  Vitrine Yeni Eklenenler (4) → Değerler → Ahilik kültürü metni.

### Geçici (internetten çekilen) ürünler ve "örnek ürün" uyarısı
- Ürünler admin `/admin/catalog/import` ile DummyJSON'dan (halka açık API) çekilmeye devam eder;
  artık `products.is_sample` kolonuyla **örnek ürün** olarak işaretlenir (migration `a9b8c7d6e5f4`,
  `server_default=false` — mevcut ürünler etkilenmez).
- Uyarı noktaları (fake ürün olduğu belirtilir, akış engellenmez):
  - Ürün kartlarında sol üstte "Örnek ürün" rozeti,
  - Ürün detay sayfasında sarı uyarı kutusu (`products.sampleWarning`),
  - Sepet sayfasında `cart.sampleWarning` uyarısı (`item.product.is_sample` ile),
  - Ödeme sayfasında `checkout.sampleWarning` uyarısı (ödeme bölümünün hemen üstünde).
- Örnek ürünler siparişe dahil edilebilir; sipariş süreci deneme amaçlı olduğu uyarı metinlerinde
  açıkça yazılır (havale/EFT adımı gerçek satıcı işlemi değildir).

### Yeni backend yetenekleri
- `GET /api/v1/products?q=<metin>` — ürün adında `ILIKE` arama (header arama kutusu için).
- `GET /api/v1/products/{slug}/related?limit=4..12` — önerilen ürünler: önce aynı kategori,
  eksik kalırsa en yeni diğer ürünlerle tamamlanır; ürünün kendisi hariç.
- `ProductResponse.is_sample` ve `CartProductResponse.is_sample` alanları eklendi (sepet/ödeme
  uyarıları bu alanla sürülür).
- `backend/scripts/create_admin.py` — ilk admin'i oluşturur / mevcut kullanıcıyı yükseltir:
  `python scripts/create_admin.py --email admin@ahicadde.com --password ... [--promote]`.

### Tam SEO optimizasyonu
- Ürün detay: `generateMetadata` (başlık, açıklama, canonical `/products/{slug}`, OG image = ürün
  görseli, Twitter card, `product:price:*`); Product JSON-LD'ye `itemCondition=NewCondition` ve
  `seller=Organization` eklendi.
- `/products`: sayfa metadata'sı + canonical (`?category=` varyantı için ayrı); `?q=` arama
  sonuçları `noindex, follow`. ItemList JSON-LD (konum + ürün URL'leri).
- Ana sayfa: `WebSite` + `Organization` JSON-LD (`@graph`, SearchAction dahil) + sayfa metadata'sı.
- Marka OG görseli: `app/opengraph-image.tsx` (next/og, 1200×630 PNG, `/opengraph-image`).
- Dinamik `sitemap.xml`: statik sayfalar + tüm ürün slug'ları + kategori URL'leri (API'den,
  `API_INTERNAL_URL`; API kapalıysa boş listeyle sessiz düşer). `revalidate=600` — içe aktarılan
  ürünler ~10 dk içinde sitemap'a yansır.
- `not-found.tsx` (404: marka uyumlu, ana sayfa/ürünler CTA'lı, noindex).
- Özel/gizli rotalar (`login`, `register`, `account`, `orders`, `orders/[id]`, `admin`, `cart`,
  `checkout`, `email-dogrula`, `sifremi-unuttum`, `sifre-sifirla`, `satici-ol/basvuru`):
  server `layout.tsx` ile `robots: noindex, nofollow` (client page'lerde metadata export edilemediği
  için layout yolu seçildi). `robots.txt` Disallow listesiyle uyumlu.

### Admin paneline erişim (özet)
- Yetki modeli: `users.role='admin'` → JWT `role` claim → `require_admin` dependency (403).
  Header'da "Yönetim" bağlantısı ve `/admin` paneli yalnızca bu rolle görünür/açılır.
- İlk admin: `backend/scripts/create_admin.py` (yeni hesap veya `--promote` ile mevcut hesap).
- Sonraki adminler: Admin Paneli → Kullanıcılar → rolü "admin" yap (idempotent, kendi rolünü
  düşürme korumaları mevcut).

### Doğrulama
| Kontrol | Sonuç |
|---|---|
| `pytest tests/` | ✅ 99 passed (96 eski + 3 yeni: q arama, related, import is_sample) |
| `alembic upgrade head` (5433 Postgres) | ✅ head `a9b8c7d6e5f4` (products.is_sample) |
| `npx tsc --noEmit` / `npx eslint src` / `npm run build` | ✅ 0 hata / 0 problem / 25 rota (+opengraph-image, not-found, 9 noindex layout) |
| Canlı: admin login → `/admin/catalog/import` (internet/DummyJSON) | ✅ 30 ürün + 4 kategori, tümü `is_sample=true` |
| Canlı: ana sayfa | ✅ 200; hero metni, güven şeridi, 8 öne çıkan + 4 yeni ürün, örnek rozetleri |
| Canlı: `/products/kiwi` | ✅ örnek ürün uyarısı + "Benzer Ürünler" + Product JSON-LD (NewCondition) |
| Canlı: `/products?q=juice` | ✅ sonuç sayfası, `noindex` |
| Canlı: sepete ekle → sipariş | ✅ `is_sample=true` sepet yanıtında; sipariş `pending_payment` |
| Canlı: `/sitemap.xml` | ✅ 30 ürün + kategori URL'leri; `/robots.txt`, `/opengraph-image`, 404 sayfası |
| Smoke sonrası | uvicorn+next durduruldu, `ahicadde-smoke-pg` silindi |

## 11. Addendum — Hepsiburada Tarzı Ana Sayfa, Müşteri Ürün Girişi + 5 dk Otomatik Onay (2026-11-06)

### Ana sayfa yeniden tasarımı (hepsiburada.com düzeni, Ahicadde renk tokenlarıyla)
- Kahraman bant sıkılaştırıldı: Ahilik mesajı (eyebrow / H1 / açıklama) **aynen
  korunarak** kompakt hero + CTA'lar + güven maddeleri; sağda vitrin ürünlerinden
  canlı görsel kolesi (yalnızca lg, aria-hidden).
- Yeni e-ticaret bolumleri: avantaj/güven şeridi, renkli kategori kartları
  (token çiftleri: primary-soft / info / success / warning), **"Günün Fırsatları"**
  yatay snap kaydırmalı ürün seridi + Fırsat rozeti, ürün bloklarının arasına
  **Ahilik kültür bandı** (kültür paragrafı aynen + `/ahilik` CTA), "Vitrine Yeni
  Eklenenler" ve "Popüler Ürünler" gridleri (mobil 2 / lg 4 kolon), satıcı +
  ürün ekleme bandı, değerler ve tam Ahilik kültür metni sonda; boş vitrin durumu.
- SEO: WebSite + Organization korunup **ItemList JSON-LD** eklendi (öne çıkan
  8 ürün: ListItem → Product + Offer/TRY); canonical/OG metadata korundu.
- Renk tutarlılığı: tüm yeni bölümler yalnızca `globals.css` tasarım
  tokenlarını kullanır (ham hex yok); açık/koyu mod aynı tokenlarla çalışır.

### Müşteri ürün girişi + onay akışı (backend)
- Migration `b1c2d3e4f5a6`: `products.status` (`pending|approved|rejected`,
  default `approved`), `products.owner_user_id` (users FK), `products.submitted_at`
  + `ix_products_status` / `ix_products_owner_user_id`.
- `POST /api/v1/products/submissions` (giriş zorunlu): başlangıç seviyesi
  kontroller — ad 3–255 (bosluk sonrası), açıklama 10–5000, fiyat 0<p≤10.000.000,
  stok 0≤s≤1.000.000, kategori zorunlu + varlık kontrolü, opsiyonel http(s)
  görsel URL → `ProductImage(is_primary=True)`. Slug sunucuda Türkçe harf
  eşlemeli `_slugify` + çakışmada `-2/-3` soneki ile üretilir. Kullanıcı başına
  en fazla 10 bekleyen ürün (spam önlemi). Admin kullanıcıya 400 (admin akışı
  `POST /products`, anında `approved`).
- `GET /api/v1/products/submissions` (girişli kullanıcı): kendi ürünleri ve
  durumları (en yeni önce).
- **5 dk otomatik onay (tembel iş):** `AUTO_APPROVE_MINUTES = 5`; `submitted_at ≤
  now−5dk` olan `pending` ürünler vitrin listesi / detay / benzer ürünler /
  ürünlerim / admin ürün listesi isteklerinde tek `UPDATE` ile `approved` olur
  (ayrı worker gerektirmez). Süre dolana kadar `pending` ürünler vitrin
  listesi/detay/arama/önerilerde filtrelenir; sitemap da bu listeyi kullanır.
- Admin hazırlığı: `AdminProductResponse` + `status`/`owner_user_id`;
  `GET /admin/products?status=pending` filtresi; panelde ürünler sekmesinde
  "Onay bekliyor"/"Reddedildi" rozetleri (onay ekranı ileride).

### Frontend
- `/urun-ekle`: giriş korumalı form (ad, açıklama, kategori, fiyat, stok, canlı
  görsel önizlemesi), alan bazlı TR/EN doğrulama mesajları + sunucu hata
  gösterimi; gönderim sonrası **"Ürününüz onaya gönderildi ✓"** ekranı (ürün
  özeti + 5 dk notu + Ürünlerim / Ana sayfa bağlantıları). `noindex` layout.
- `/urunlerim`: durum rozetli liste (Onay bekliyor — amber; Onaylandı — yeşil +
  ürün bağlantısı; Reddedildi — kırmızı), "≈5 dk içinde otomatik onaylanır"
  notu, Yenile butonu, boş durum CTA'sı. `noindex` layout.
- Hesap sayfasına "Hızlı İşlemler" (Ürün Ekle / Ürünlerim), header'a (desktop +
  mobil menü) "Ürün Ekle", mobil menüye "Ürünlerim" bağlantıları; TR/EN sözlük
  anahtarları (home / addProduct / myProducts / account / header / admin)
  parity ile eklendi.

### Doğrulama
| Kontrol | Sonuç |
|---|---|
| `pytest tests/` | ✅ 108 passed (99 eski + 9 yeni: form doğrulamaları, pending gizliliği, 5 dk otomatik onay, kullanıcı limiti, admin durum filtresi, admin ürünü anında approved) |
| `alembic upgrade head` (5433 Postgres) | ✅ head `b1c2d3e4f5a6` |
| `npx tsc --noEmit` / `npm run lint` / `npm run build` | ✅ 0 hata / 0 problem / 27 rota (+ `/urun-ekle`, `/urunlerim`, ikisi de noindex) |
| Canlı: müşteri girişi → `POST /products/submissions` | ✅ 201, `status=pending`, TR slug `el-yapimi-seramik-vazo`, görsel kaydedildi |
| Canlı: pending vitrinde gizli | ✅ liste boş, detay 404; `/products/submissions` kendi ürününü listeliyor |
| Canlı: `submitted_at` 6 dk geriye → vitrin isteği | ✅ otomatik `approved`; listede + detay 200 + Product JSON-LD |
| Canlı: ana sayfa (31 ürün) | ✅ tüm bloklar + ItemList (8 ListItem); `/urun-ekle`, `/urunlerim` noindex |
| Smoke sonrası | uvicorn+next durduruldu, `ahicadde-smoke-pg` silindi |

### Not (sonraki adım)
- Admin onay ekranı eklendiğinde veri modeli değişmeden yeterli:
  `GET /admin/products?status=pending` zaten bekleyenleri süzüyor; otomatik onay
  `AUTO_APPROVE_MINUTES` üzerinden kapatılabilecek şekilde tek sabitte duruyor.

## 12. Addendum — Genel Sistem Denetimi: 2 Kritik Güvenlik Düzeltmesi + Sağlamlaştırma (2026-11-06)

Canlı smoke ortamı (Postgres 5433 + uvicorn 8010 + next 3311) üzerinde uçtan uca
sistem testi yapıldı: kimlik doğrulama akışları (kayıt/doğrulama/şifre sıfırlama),
ürün girişi doğrulamaları, sepet/sipariş akışları, admin uçları, IDOR kontrolleri,
paralel sipariş stok yarışı, tüm frontend sayfaları. Sonuç: **113 pytest passed**
(108 + 5 yeni regresyon), tsc/ESLint/build temiz.

### Bulunan ve düzeltilen kritik hatalar

1. **KRİTİK — JSON-LD saklı XSS** (`products/[slug]`, `/products`, `/` sayfaları):
   Ürün adı/açıklaması `JSON.stringify` ile ham şekilde
   `<script type="application/ld+json">` içine yazıldığı için, ürün adına
   `</script><script>alert(1)</script>` yazılabilen bir müşteri ürünü her
   ziyaretçide script çalıştırıyordu. Canlı doğrulandı.
   **Düzeltme:** `frontend/src/lib/json-ld.ts` → `jsonLdHtml()` (`<`, `>`,
   U+2028/U+2029 kaçışı); üç sayfa da bu yardımcıya geçirildi. Canlı doğrulandı:
   ham form 0, kaçışlı form mevcut.

2. **YÜKSEK — Onay bekleyen/reddedilmiş ürün sepete eklenip satın alınabiliyordu:**
   `POST /cart/items` yalnızca `is_active` bakıyordu; pending ürün sepete 201
   ile ekleniyor ve siparişe giriyordu (onay akışını bypass).
   **Düzeltme:** `cart.py` → `_purchasable_product()` (aktif + `status=approved`);
   `orders.py` sipariş doğrulamasına da `STATUS_APPROVED` kontrolü eklendi
   (derinlemesine savunma). Regresyon testleri: pending sepete 404, pending
   sipariş 400 + stok düşmez, rejected sepete 404.

### Sağlamlaştırmalar (aynı iş paketinde)

3. **Admin ürün durum güncellemesi:** `PATCH /admin/products/{id}` gövdesine
   `status: approved|rejected|pending` eklendi — reddedilen ürün artık kalıcı
   ölü değildir, admin manuel onay verebilir (onay ekranı için API hazır).
4. **`X-Total-Count` başlığı:** `GET /products` artık toplam kayıt sayısını
   döndürüyor (istemci sayfalaması için; şema değişikliği yok).
5. **Arama LIKE joker kaçışı:** `q` içindeki `%`, `_`, `\` literal aranır
   (eskiden `q=%` tüm ürünleri döndürüyordu).

### Doğrulama
| Kontrol | Sonuç |
|---|---|
| `pytest tests/` | ✅ 113 passed (5 yeni regresyon: sepet/sipariş status guard ×3, admin status ×1, arama kaçışı + X-Total-Count ×1) |
| `npx tsc --noEmit` / `next lint` / `npm run build` | ✅ temiz |
| Canlı: XSS ürün sayfası | ✅ ham `<script>` 0, `\u003cscript` kaçışı var (detay + ana sayfa + listeleme) |
| Canlı: pending/rejected ürün sepete | ✅ 404 |
| Canlı: admin `PATCH status rejected→approved` | ✅ 200 |
| Canlı: `X-Total-Count` | ✅ 6 |
| Canlı: IDOR (başkasının siparişi / status) | ✅ 404 / 403 |
| Canlı: paralel sipariş (stok=1, 3 istemci) | ✅ 1×201, 2×409, stok 0 (oversell yok; `with_for_update` mevcut) |
| Canlı: auth akışları (kayıt→doğrulama→şifre sıfırlama→giriş) | ✅ |
| Canlı: 20 frontend sayfası + 404 + robots | ✅ hepsi beklendiği gibi |

### Açık bulgular (önceliklendirilmiş iş paketleri — kod değişikliği bekliyor)
- **P1:** Sipariş durum makinesi yok (`shipped → processing` geçişine izin var);
  durum geçiş matrisi eklenmeli. İptal/teslimde e-posta bildirimi yok.
- **P1:** Oturum: refresh token yok (30 dk'da zor çıkış) + `/auth/change-password`
  ucu yok (sadece "şifremi unuttum" var).
- **P2:** Rate limiter bellek-içi (çoklu proses/instance'ta yetersiz; Redis'e taşınmalı — kod
  tek değişim noktası olarak hazır), `get_client_ip` `X-Forwarded-For`'a körü körüne
  güveniyor (proxy arkasında değilken limiter bypass'ı mümkün).
- **P2:** Sipariş/satıcı başvurusu listelerinde sayfalama yok; admin sipariş listesi
  büyüdükçe yavaşlar. `/products` toplam sayısı `X-Total-Count` ile hazır, frontend
  sayfalama UI'ı henüz kullanmıyor.
- **P2:** Arama yalnızca ürün adında (açıklama/kategori/marka yok); Türkçe küçük/büyük
  ve `ıiİi` dönüşümleri `ilike` ile kısmi çözülüyor (Postgres'te `unaccent`/`trigram`
  indeksi gerekir).
- **P2:** Sepetteki pasif/onay-geri-çekilmiş ürün siparişte 400 döner ama sepet sayfası
  kullanıcıyı proaktif uyarmıyor (satır bazlı uyarı eklenmeli).
- **P3:** Yapılandırma: `frontend_url` geliştirme varsayılıyor; production `.env`
  denetimi + HTTPS zorunluluğu (cookie `secure=True` zaten) Caddy/Nginx tarafında.
  Sitemap ISR 600 sn gecikmeli veri gösterir (bilinen davranış).
- **P3:** Görseller harici URL (NexT Image yok); rastgele URL doğrulama sadece http(s)
  şeması — CDN/uzunluk sınırı genişletilebilir.





