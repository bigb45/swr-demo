# New Agent Quickstart Prompt

Copy everything below this line and paste it as your first message in the new project.

---

You are continuing development on the **TEIA** Next.js 16 frontend — a B2B industrial components storefront that talks to a Magento 2.4.8-p4 backend via REST API.

Read `AGENTS.md` in the project root before doing anything else. It contains the full architecture, data flow, i18n rules, design system rules, and a complete list of what is done and what still needs to be built.

## What was just completed (do not redo)

- **Search is now wired.** `src/app/[locale]/products/page.tsx` reads `?q=` from `searchParams` and calls `searchProducts(q, page, PAGE_SIZE)` from `src/lib/magento.ts` when a query is present. Pagination preserves the `q` param. Three new i18n keys were added to all three message files: `products.searchTitle`, `products.searchTotal`, `products.searchEmpty`.

- **Cart hydration is fixed.** The cart page (`src/app/[locale]/cart/page.tsx`) is a `"use client"` wrapper that loads `CartContent.tsx` with `next/dynamic` and `ssr: false`. This is intentional — the cart is 100% client-side (localStorage) and the server has no cart state, so skipping SSR is the correct pattern. Do not change this.

- **Sidebar is sticky.** `src/components/ui/SideNav.tsx` uses `sticky top-[97px] h-[calc(100vh-97px)]` so the bottom actions (Bulk Order CSV, Contact, Locations) are always visible. The category list scrolls independently.

## What to work on next (in priority order)

### 1. Use Magento totals in cart (highest priority)

The cart currently calculates totals client-side with hardcoded 19% VAT. This is wrong.

**What already exists:**
- `GET /api/cart?cartId=xxx` (in `src/app/api/cart/route.ts`) already fetches both `/items` AND `/totals` from Magento and returns `{ items, totals }`
- `CartProvider.tsx` already calls this endpoint on mount and stores the response

**What needs to change:**
- `CartProvider.tsx` currently only reads `data.items` from the response and discards `data.totals`
- Add `totals` to the `CartContextValue` interface and store it in state
- `CartContent.tsx` currently computes `subtotal`, `vat`, `total` manually — replace with `totals.subtotal_with_discount`, `totals.tax_amount`, `totals.grand_total` from the Magento response
- The Magento `/totals` response shape is already typed in `src/types/magento.ts` (look for `MagentoCartTotals` or similar — if it doesn't exist, add it)

### 2. Real tier pricing on PDP

`src/app/[locale]/products/[sku]/page.tsx` renders 3 hardcoded demo rows for bulk pricing. `product.tier_prices` is available in the API response. Map it to the table; hide the section entirely if the array is empty or undefined.

### 3. Checkout flow

The "Place Authorization Order" button in `CartContent.tsx` is disabled when the cart is empty but does nothing when clicked. Wire it to:
```
POST /rest/V1/guest-carts/:cartId/order
Body: { paymentMethod: { method: "free" }, billingAddress: { ... } }
```
This is a B2B authorization flow — a minimal billing address is acceptable. The endpoint returns an order ID on success. Show a success state or redirect to a confirmation page.

### 4. Authentication

No login/register exists yet. Endpoint: `POST /rest/V1/integration/customer/token` with `{ username, password }`. Store the token server-side in an httpOnly cookie via a Route Handler. Unlocks `/orders` and `/account`.

### 5. Legal/info pages

Static content pages needed: `/terms`, `/privacy`, `/compliance`, `/iso`, `/sds`. Links to these exist in the footer. No Magento data needed — just translated copy in all three locales.

## Critical rules — read before writing any code

1. **i18n is mandatory.** Every user-visible string must be a translation key in `src/messages/de.json`, `src/messages/en.json`, AND `src/messages/fr.json`. Never hardcode text. German (`de`) is the default locale.

2. **Links must use `@/i18n/navigation`.** Import `Link` from `@/i18n/navigation`, never from `next/link`. Same for `useRouter`.

3. **Prices must use `useCurrency()`.** Call `formatAmount(eurPrice)` from the `useCurrency()` hook. Never use `Intl.NumberFormat` directly or hardcode a currency symbol.

4. **No 1px solid borders for layout sectioning.** Use tonal background color shifts instead (see `DESIGN.md`).

5. **`ssr: false` only works in `"use client"` files.** If you need to dynamically import something with `ssr: false`, the file doing the importing must have `"use client"` at the top.

6. **Cart page is intentionally SSR-disabled.** Do not add `"use client"` removal or try to server-render `CartContent.tsx`.

## Running locally

```bash
npm install
npm run dev        # starts on localhost:3000
```

Requires a running Magento instance at `MAGENTO_URL` (default `http://localhost:8000`). Copy `.env.local` from the previous environment or create it fresh — see `AGENTS.md` for the required variables.
