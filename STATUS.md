# TEIA Frontend — Project Status

_Last updated: April 2026_

---

## Infrastructure

| Item                                                        | Status     |
| ----------------------------------------------------------- | ---------- |
| Magento 2.4.8 local + Hetzner dev server (`46.224.237.247`) | ✅ Running |
| Next.js 16 custom frontend (`custom-frontend/`)             | ✅ Running |
| i18n — de / en / fr                                         | ✅ Done    |
| Currency switching                                          | ✅ Done    |
| Tailwind + design system tokens (DESIGN.md)                 | ✅ Done    |
| Mobile-responsive layout                                    | ✅ Done    |
| GitHub Actions CI/CD → Hetzner (auto-deploy + rollback)     | ✅ Done    |

---

## Pages

### Fully wired to Magento

| Page                                    | Notes                                                      |
| --------------------------------------- | ---------------------------------------------------------- |
| **Home** `/`                            | Hero, live category grid, featured products, bento section |
| **Product listing** `/products`         | Paginated, live from Magento                               |
| **Category listing** `/categories/[id]` | Filtered by category, paginated                            |
| **Product detail** `/products/[sku]`    | Gallery, specs, price, add-to-cart                         |
| **Cart** `/cart`                        | Line items, qty update, remove — Magento guest cart API    |

### Stubbed / incomplete

| Page                                 | What's missing                                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Cart** `/cart`                     | Totals use client-side math (hardcoded 19% VAT) instead of Magento's `/totals` response; shipping options are UI-only; checkout CTA does nothing |
| **Product detail** `/products/[sku]` | Bulk pricing tiers are static demo rows, not real Magento tier prices; cert badges are static copy                                               |
| **Search** `/products?q=…`           | `SearchBar` passes `q` in the URL but the products page ignores it — returns all products regardless                                             |

### Missing (links exist, no route)

| Route                                           | Needed for                         |
| ----------------------------------------------- | ---------------------------------- |
| `/orders`                                       | Order history (requires auth)      |
| `/account`                                      | Account management (requires auth) |
| `/terms` `/privacy` `/compliance` `/iso` `/sds` | Legal / info pages                 |

---

## Cart System

| Feature                                        | Status      |
| ---------------------------------------------- | ----------- |
| Guest cart created on first add                | ✅ Done     |
| `cartId` persisted in `localStorage`           | ✅ Done     |
| Cart reloads from Magento on page refresh      | ✅ Done     |
| Add to cart (loading / success / error states) | ✅ Done     |
| Qty update → Magento                           | ✅ Done     |
| Remove item → Magento                          | ✅ Done     |
| Cart badge (live item count)                   | ✅ Done     |
| Totals from Magento (tax, discounts, shipping) | ❌ Not done |
| Shipping method selection → Magento            | ❌ Not done |
| Checkout / place order                         | ❌ Not done |

---

## Immediate Next Steps

Priority order for the frontend:

### 1. Wire search _(easy — ~30 min)_

The `q` param is already passed to `/products` by `SearchBar`. The products page just needs to call `searchProducts(q)` when `q` is present in `searchParams` instead of `getProductsPaginated()`.

### 2. Use Magento totals in cart _(medium — ~1 hr)_

`GET /api/cart` already fetches the Magento `/totals` endpoint. The cart page just needs to read from that response instead of doing its own subtotal/VAT math. This gives correct tax, discounts, and any Magento price rules for free.

### 3. Real tier/bulk pricing on PDP _(medium — ~1 hr)_

Magento stores tier prices in `tier_prices` on the product object. Replace the static demo rows in `BulkPricingTable` with real data from `product.tier_prices`.

### 4. Checkout flow _(large — ~1 day)_

The "Place Authorization Order" button needs a destination. Options:

- **Simple:** redirect to the Magento native checkout (`/checkout`)
- **Integrated:** collect a billing/shipping address in the frontend and call `POST /rest/V1/guest-carts/:id/order`

### 5. Authentication _(large — ~2 days)_

Currently everything is guest. Adding login/register unlocks:

- Persistent carts tied to a customer account
- Order history (`/orders`)
- Account management (`/account`)
- Saved addresses at checkout

Magento endpoints: `POST /rest/V1/integration/customer/token` (login), `POST /rest/V1/customers` (register).

### 6. Legal / info pages _(small — ~2 hrs)_

Static content pages for `/terms`, `/privacy`, `/compliance`, `/iso`, `/sds`. These are linked from the footer today and 404.
