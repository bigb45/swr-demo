# AGENTS.md — SWR Next.js Frontend

## What This Project Is

This is the **SWR Handelsgesellschaft mbH** custom storefront — a **Next.js 16 App Router** application that serves as the customer-facing frontend for a **Magento 2.4.8-p4** backend. It was previously located inside the Magento monorepo at `custom-frontend/` and has been extracted into its own standalone repository.

The frontend talks to Magento **exclusively via the Magento REST API** over HTTP. There are no filesystem dependencies on the Magento codebase.

---

## Documentation map

Shipped vs backlog truth lives outside this file — read these before guessing scope:

| File | Role |
|------|------|
| [`STATUS.md`](./STATUS.md) | What has landed (pages, flows, recent milestones) |
| [`BACKLOG.md`](./BACKLOG.md) | Prioritized queue + FRD reconciliation |
| [`FEATURES.md`](./FEATURES.md) | Stakeholder FRD checklist |

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

Routes live under `src/app/[locale]/` using **`(chrome)`** (main shell: header, footer, SideNav) and **`(auth)`** where needed. Marketing, shop, account, checkout, catalog, legal, and API routes are all under this tree — the listing below is indicative, not exhaustive:

```
src/app/[locale]/(chrome)/
  page.tsx                 # Home
  products/                # Listing + search + PDP
  categories/[id]/
  cart/
  checkout/{address,shipping,review}/
  catalog/                 # Document hub (+ [id] viewer)
  services/, industries/, about, contact, …
  account/{login,register,addresses,orders → redirects?, quotations, fleet, service, …}
src/app/api/               # cart, auth, checkout, orders PDFs, account, …
src/components/            # CartProvider, marketing/, orders/, catalog/, ui/, …
src/lib/                   # magento.ts, cms.ts, catalog.ts, quotations.ts, service.ts, fleet.ts, …
src/messages/{de,en,fr}.json
```

See [`STATUS.md`](./STATUS.md) for the authoritative page-by-page wiring table.

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

Guest cart (browse → cart before login):

```
POST   /rest/V1/integration/admin/token           # Admin token (server-only cache; self-healing on 401)
POST   /rest/V1/guest-carts                         # Create guest cart
GET    /rest/V1/guest-carts/:id/items             # Line items
POST   /rest/V1/guest-carts/:id/items             # Add line
PUT    /rest/V1/guest-carts/:id/items/:itemId     # Qty
DELETE /rest/V1/guest-carts/:id/items/:itemId     # Remove line
GET    /rest/V1/guest-carts/:id/totals            # Totals
GET    /rest/V1/products?searchCriteria[...]       # List / filter (also search via storefront helpers)
GET    /rest/V1/products/:sku                     # PDP
GET    /rest/V1/categories                        # Category tree
POST   /rest/V1/integration/customer/token         # Customer login — wired via Route Handlers + httpOnly cookie
GET    /rest/V1/customers/me                      # Profile / address book mutations (customer token)
PUT    /rest/V1/carts/mine/*                      # Checkout assignment, shipping, payment — see checkout actions
PUT    /rest/V1/carts/:quoteId/order             # Place order (signed-in checkout — wired)
GET    /rest/V1/orders                            # Order history (customer token + storefront proxies)
GET    /rest/V1/cmsPage | cmsBlock                # CMS-backed marketing/legal
```

Custom / future: **`src/lib/quotations.ts`** documents proposed `swr-quotations/*` endpoints — not live in Magento until ERP wires them.

**Terminology:** Magento **`tier_prices`** in this project are **quantity-break / bulk** tiers on the PDP. Stakeholder “tiered = net price per customer group” requires catalog visibility + customer-group pricing on the Magento side; the storefront **hides catalog list prices in the UI for guests** (`CustomerSessionProvider`), while **cart/checkout line prices** and **admin-token product payloads** can still expose amounts until Magento constrains them.

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

**Authoritative table:** [`STATUS.md`](./STATUS.md) → *Pages* and *Partial / still evolving*.

Summary:

- **Shop core:** home, Magento listing/search (`/products` + URL filters), category routes, PDP with **`tier_prices`** bulk table + live qty preview, cart with **Magento totals**, signed-in **3-step checkout**, orders history/detail with **PDFs** (confirmation + invoice/shipment/credit memo).
- **Account:** login/register, address book, quotations UI (**empty until ERP endpoint**), fleet, unified **service cases** (return/repair/inspection — demo/in-process persistence).
- **Marketing:** CMS-backed hubs, document **`/catalog`**, industries (welding override), services pillars, legal routes under `/legal/*` with legacy 301s.

Gaps worth remembering: **McMaster-style configurable variant matrix**, **B2B contract / customer-group net pricing** (Magento catalog permissions + scoped REST; storefront catalog UI already hides EUR for guests), **SPARQUE** (not integrated — search/filter is Magento REST), **automatic image fallbacks / manufacturer logos**. **AI Copilot** — dock + API routes land in repo; upstream env still required. **Registration / sub-user governance** and **Magento `swr-quotations`** remain backend-led.

---

## Remaining Work — Priority Order

Use **`BACKLOG.md`** (*Phase 2 — Next execution queue*) instead of this section — the numbered list below is **retired** (historical). Highlights: checkout hardening (payment + address pickers), quotations wiring when Magento exposes endpoints, richer faceted listing (`aggregations`), customer governance (B2B company / approvals), eProcurement metadata, durable service-case uploads + Magento RMA.

<details>
<summary>Historical backlog (superseded May 2026 — do not execute from here)</summary>

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

</details>

---

## Common Pitfalls

- **`ssr: false` in a Server Component** — will throw a build error. The `dynamic()` call with `ssr: false` must be inside a `"use client"` file.
- **Image 404 on local dev** — PHP built-in server uses `pub/` as root, so images are at `/media/...` not `/pub/media/...`. Set `MAGENTO_MEDIA_BASE_URL=http://localhost:8000` (no `/pub` suffix).
- **`next.config.ts` must have `images: { dangerouslyAllowLocalIP: true }`** — required for the image optimizer to fetch from localhost.
- **Pagination with search** — `Pagination` builds URLs as `${baseUrl}?page=${n}`. When searching, pass `baseUrl="/products?q=foo"` so pagination produces `/products?q=foo&page=2`.
- **Never hardcode prices** — always use `formatAmount()` from `useCurrency()`.
- **Never use `next/link` directly** — always import `Link` from `@/i18n/navigation`.
- **Admin token** — `magentoGet` / related helpers **invalidate and retry on `401`**, so a revoked Magento token no longer requires restarting Next.js in normal cases.
- **Guest catalog prices (UI vs data)** — the storefront hides catalog EUR amounts for anonymous users via `CustomerSessionProvider` / `useCustomerSession()` and shared components (`ProductPrice`, `ProductCard`, etc.). Product data is still often fetched with the **admin token**, so **network responses can still include `price`** until Magento applies catalog permissions / shared catalogs (or the app moves to customer-token-scoped product reads). Do not treat the UI gate as ERP-grade confidentiality.
