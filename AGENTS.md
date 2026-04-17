# AGENTS.md — SWR Next.js Frontend

## What This Project Is

This is the **SWR Handelsgesellschaft mbH** custom storefront — a **Next.js 16 App Router** application that serves as the customer-facing frontend for a **Magento 2.4.8-p4** backend. It was previously located inside the Magento monorepo at `custom-frontend/` and has been extracted into its own standalone repository.

The frontend talks to Magento **exclusively via the Magento REST API** over HTTP. There are no filesystem dependencies on the Magento codebase.

---

## Tech Stack

- **Framework:** Next.js 16.2.2 (App Router, Turbopack in dev)
- **React:** 19.2.4
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS v4
- **i18n:** next-intl v4.9+ (three locales: de, en, fr)
- **Backend:** Magento 2.4.8-p4 REST API at `MAGENTO_URL`

---

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## Environments

| Environment | URL | Notes |
|---|---|---|
| Local frontend | `http://localhost:3000` | `npm run dev` |
| Local Magento | `http://localhost:8000` | PHP built-in server (`php -S localhost:8000 -t pub/`) |
| Dev server | `http://46.224.237.247/` | Hetzner, auto-deploys from `develop` branch of the Magento repo |
| Magento admin | `http://46.224.237.247/admin` | Same server |

---

## Environment Variables (`.env.local` — never commit)

```env
MAGENTO_URL=http://localhost:8000
MAGENTO_MEDIA_BASE_URL=http://localhost:8000
NEXT_PUBLIC_MAGENTO_MEDIA_BASE_URL=http://localhost:8000
MAGENTO_ADMIN_USER=nextjs_api
MAGENTO_ADMIN_PASSWORD=<password>
```

**Critical:** `MAGENTO_MEDIA_BASE_URL` differs per environment:
- **Local dev** (PHP built-in server with `-t pub/`): `http://localhost:8000` — images at `/media/...`
- **Production** (Apache from project root): `http://46.224.237.247/pub` — images at `/pub/media/...`

`NEXT_PUBLIC_MAGENTO_MEDIA_BASE_URL` must always mirror `MAGENTO_MEDIA_BASE_URL` exactly. If they differ, React will throw hydration errors on every image.

---

## Running Locally

```bash
npm install
npm run dev        # starts on localhost:3000
```

Requires a running Magento instance at `MAGENTO_URL` (default `http://localhost:8000`). Copy `.env.local` from the previous environment or create it fresh — see the Environment Variables section above.

---

## Project Structure

```
src/
  app/
    [locale]/
      page.tsx                    # Home page
      products/
        page.tsx                  # Product listing + search results
        [sku]/page.tsx            # Product detail page (PDP)
      categories/[id]/page.tsx    # Category listing
      cart/
        page.tsx                  # Cart page shell (ssr:false wrapper)
        CartContent.tsx           # Full cart UI (client-only, no SSR)
      layout.tsx                  # Root locale layout — providers, header, footer
    api/
      cart/route.ts               # POST create cart, GET fetch items+totals
      cart/items/route.ts         # POST add item
      cart/items/[itemId]/route.ts # PUT update qty, DELETE remove item
    layout.tsx                    # Root layout (returns children only)
  components/
    CartProvider.tsx              # Client cart state, localStorage, Magento sync
    CartBadge.tsx                 # Item count badge in header
    CurrencyProvider.tsx          # EUR/CHF switcher, cookie-persisted
    Header.tsx                    # Sticky header (server component)
    MobileNav.tsx                 # Mobile hamburger nav (client)
    LocaleSwitcher.tsx            # Locale toggle
    CurrencySwitcher.tsx          # Currency toggle
    ProductGrid.tsx               # Product card grid
    Pagination.tsx                # Page nav (client, uses next-intl Link)
    ui/
      SideNav.tsx                 # Sticky sidebar with category nav + bottom actions
      SearchBar.tsx               # Search input (client, pushes ?q= to URL)
      Button.tsx
      CategoryGrid.tsx
      BentoSection.tsx
      SpecTable.tsx
  lib/
    magento.ts                    # All Magento REST API calls + admin token cache
    currency.ts                   # Currency conversion + Intl formatting
  types/
    magento.ts                    # TypeScript types for all Magento API responses
  i18n/
    routing.ts                    # next-intl routing config (locales, defaultLocale)
    navigation.ts                 # createNavigation — exports Link, useRouter, etc.
    request.ts                    # getRequestConfig for next-intl
  messages/
    de.json                       # German strings (default locale)
    en.json                       # English strings
    fr.json                       # French strings
```

---

## Architecture: How Data Flows

```
Browser
  │
  ├─ Server Components (pages, layout, Header, SideNav)
  │    └─ call magento.ts functions directly (admin token, server-side only)
  │
  └─ Client Components (CartProvider, AddToCart, CurrencySwitcher, SearchBar)
       └─ call /api/cart/* Route Handlers (proxy to Magento — credentials never reach browser)
```

Admin token is obtained once via `POST /rest/V1/integration/admin/token` and cached in the Node.js process memory. It is never sent to the browser.

---

## Key Magento REST API Endpoints

```
POST   /rest/V1/integration/admin/token          # Get admin token
GET    /rest/V1/products?searchCriteria[...]      # List/search products
GET    /rest/V1/products/:sku                     # Single product
GET    /rest/V1/categories                        # Category tree
POST   /rest/V1/guest-carts                       # Create guest cart → returns cartId string
GET    /rest/V1/guest-carts/:id/items             # Cart line items
POST   /rest/V1/guest-carts/:id/items             # Add item { cartItem: { sku, qty, quote_id } }
PUT    /rest/V1/guest-carts/:id/items/:itemId     # Update qty
DELETE /rest/V1/guest-carts/:id/items/:itemId     # Remove item
GET    /rest/V1/guest-carts/:id/totals            # Totals: subtotal, tax, shipping, grand_total
POST   /rest/V1/guest-carts/:id/order             # Place order → returns order ID (NOT YET WIRED)
POST   /rest/V1/integration/customer/token        # Customer login (NOT YET WIRED)
```

---

<!-- BEGIN:i18n-rules -->
## i18n Rules — Mandatory

Three locales: **de** (default), **en**, **fr**.

1. **Never hardcode user-visible strings.** Every string must be a translation key.
2. Add every new key to **all three** message files: `src/messages/de.json`, `src/messages/en.json`, `src/messages/fr.json`.
3. **Server components:** `getTranslations({ locale, namespace: "..." })` from `next-intl/server`.
4. **Client components:** `useTranslations("...")` from `next-intl`.
5. Group keys by namespace (e.g. `"nav"`, `"products"`, `"cart"`). No root-level keys.
6. **Prices:** never format with hardcoded currency. Use `formatAmount(eurPrice)` from `useCurrency()` in client components, or pass the price to a `ProductPrice` client component from server.
7. **Links:** always use `Link` from `@/i18n/navigation`, never `next/link`. This preserves locale prefixes automatically.
<!-- END:i18n-rules -->

---

## Design System — Key Rules

Full spec is in `DESIGN.md` (keep this file in the repo root). Summary for agents:

- **Primary:** `#003a63` (deep blue) — headers, nav, brand moments
- **Secondary:** `#006e21` (green) — CTAs, success states, "GO" actions
- **Surface hierarchy:** `surface` #f9f9f9 → `surface-container-low` #f3f3f3 → `surface-container-highest` #e2e2e2 → `surface-container-lowest` #ffffff (cards)
- **No 1px solid borders for sectioning** — use tonal background shifts instead
- **Border radius:** 0px structural/tables, 3px interactive elements, 5px cards
- **Shadows:** only `box-shadow: 0 10px 30px rgba(26,28,28,0.06)` — no generic grey shadows
- **Information density over whitespace** — this is a B2B industrial catalog, not a retail store

---

## Cart Architecture (Important)

The cart is **100% client-side** — it lives in `localStorage` and syncs with Magento on mount. The server has no cart state.

Because of this, the cart page (`src/app/[locale]/cart/page.tsx`) is a thin server component that loads `CartContent.tsx` with `ssr: false` via `next/dynamic`. This is intentional and correct — it prevents React hydration mismatches that would otherwise occur because the server always sees an empty cart.

```tsx
// page.tsx
"use client";
import dynamic from "next/dynamic";
const CartContent = dynamic(() => import("./CartContent"), { ssr: false });
export default function CartPage() { return <CartContent />; }
```

`CartProvider` starts with `loading: true` so `CartBadge` renders nothing until the cart is resolved client-side.

---

## Hydration — Known Patterns

- `<html>` in `layout.tsx` has `suppressHydrationWarning` — required for next-intl + browser extensions
- Cart page uses `ssr: false` — do not remove this
- `CartBadge` guards on `!mounted` before rendering — do not remove this
- `NEXT_PUBLIC_MAGENTO_MEDIA_BASE_URL` must match `MAGENTO_MEDIA_BASE_URL` — if they differ, every product image causes a hydration error

---

## Pages — Current Status

### Fully working

| Page | Route | Notes |
|---|---|---|
| Home | `/` | Hero, live category grid, featured products, bento section |
| Product listing | `/products` | Paginated, live from Magento |
| Search results | `/products?q=...` | Wired to `searchProducts()` in magento.ts |
| Category listing | `/categories/[id]` | Filtered by category, paginated |
| Product detail | `/products/[sku]` | Gallery, specs, price, add-to-cart |
| Cart | `/cart` | Line items, qty update, remove — Magento guest cart API |

### Stubbed / incomplete

| Page | What's missing |
|---|---|
| **Cart** `/cart` | Totals use client-side math (hardcoded 19% VAT). `GET /api/cart` already returns Magento's `/totals` response — `CartContent.tsx` just needs to read `subtotal_with_discount`, `tax_amount`, and `grand_total` from it instead of calculating manually |
| **Product detail** `/products/[sku]` | Bulk pricing tiers are static demo rows. `product.tier_prices` from the Magento API should be used instead |
| **Checkout** | "Place Authorization Order" button exists in `CartContent.tsx` but does nothing. Needs to call `POST /rest/V1/guest-carts/:id/order` with a billing address payload |
| **Authentication** | No login/register. Customer token endpoint exists. Unlocks `/orders` and `/account` |

### Missing entirely (links exist, 404)

`/orders`, `/account`, `/terms`, `/privacy`, `/compliance`, `/iso`, `/sds`

---

## Remaining Work — Priority Order

1. **Use Magento totals in cart** ← next up
   - `GET /api/cart?cartId=xxx` already returns `{ items, totals }` where `totals` is the full Magento `/totals` response
   - `CartProvider.tsx` currently only reads `data.items` and discards `data.totals`
   - Fix: add `totals` to the `CartContextValue` interface and store it in state; in `CartContent.tsx` replace the manual `items.reduce(...)` with `totals.subtotal_with_discount`, `totals.tax_amount`, `totals.grand_total`
   - The Magento `/totals` response shape is already typed in `src/types/magento.ts` (look for `MagentoCartTotals` — add it if missing)
   - Shipping options in the sidebar are still UI-only (Magento shipping estimation is a separate endpoint)

2. **Real tier pricing on PDP**
   - `product.tier_prices` is available in the Magento API response (already typed in `src/types/magento.ts`)
   - The PDP currently renders 3 hardcoded demo rows
   - Fix: map `product.tier_prices` to the table; hide the section if the array is empty

3. **Checkout flow**
   - Wire the "Place Authorization Order" button in `CartContent.tsx`
   - Endpoint: `POST /rest/V1/guest-carts/:cartId/order`
   - Payload requires a billing address — either collect it in a form or use a minimal placeholder for B2B authorization flow
   - Returns an order ID on success; show a success state or redirect to a confirmation page

4. **Authentication**
   - `POST /rest/V1/integration/customer/token` with `{ username, password }`
   - Store token in a cookie (httpOnly via a Route Handler, not localStorage)
   - Unlocks `/orders` (order history) and `/account` (profile)

5. **Legal/info pages** — static content only
   - `/terms`, `/privacy`, `/compliance`, `/iso`, `/sds`
   - No Magento data needed, just translated copy in all three locales

---

## Common Pitfalls

- **`ssr: false` in a Server Component** — will throw a build error. The `dynamic()` call with `ssr: false` must be inside a `"use client"` file.
- **Image 404 on local dev** — PHP built-in server uses `pub/` as root, so images are at `/media/...` not `/pub/media/...`. Set `MAGENTO_MEDIA_BASE_URL=http://localhost:8000` (no `/pub` suffix).
- **`next.config.ts` must have `images: { dangerouslyAllowLocalIP: true }`** — required for the image optimizer to fetch from localhost.
- **Pagination with search** — `Pagination` builds URLs as `${baseUrl}?page=${n}`. When searching, pass `baseUrl="/products?q=foo"` so pagination produces `/products?q=foo&page=2`.
- **Never hardcode prices** — always use `formatAmount()` from `useCurrency()`.
- **Never use `next/link` directly** — always import `Link` from `@/i18n/navigation`.
- **Admin token is cached server-side** — if Magento restarts and the token expires, the Next.js process needs to restart too (or the cache TTL will expire it naturally).
