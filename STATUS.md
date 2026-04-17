# SWR Frontend — Project Status

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

## Recent Progress

Latest implemented work:

- Checkout flow: dedicated, signed-in-only 3-step `/checkout/{address,shipping,review}` page. Step 1 lists saved customer addresses or accepts a new one (optionally saved to the address book) via a server action; Step 2 fetches real Magento shipping methods through `/api/checkout/shipping-methods` and persists the choice via `/api/checkout/shipping-information`; Step 3 shows Magento-computed totals, captures an optional PO number, and runs `placeOrderAction` (server action) which assigns the cart to the customer and calls `PUT /V1/carts/:id/order` before redirecting to `/orders/:id`. Cart page CTA is now "Proceed to checkout" and the old in-cart place-order UI / fake VAT have been removed; `swr_cart_id` is mirrored to a non-httpOnly cookie so server components can read it.
- Customer address book: new `/account/addresses` section (list / add / edit / delete) backed by `/api/account/addresses` (list + create via `PUT /V1/customers/me`, per-id update via `PUT /V1/customers/me`, delete via admin-token `DELETE /V1/addresses/:id` after ownership check). Shared `AddressForm` client component drives both new and edit pages. Account dashboard now links to "Addresses".
- ERP order workflows: per-document SWR-branded PDFs for invoices (`/api/orders/[id]/invoices/:id/pdf`), shipments / delivery notes (`/api/orders/[id]/shipments/:id/pdf`), and credit memos (`/api/orders/[id]/creditmemos/:id/pdf`) — cookie-gated, ownership-verified against the parent order's `customer_email`, rendered via `@react-pdf/renderer` on the Node runtime with shared styles in `src/components/orders/pdfStyles.ts` and a shared `PdfAddress` block
- ERP status overrides: `resolveOrderStatus` in `src/lib/orderStatus.ts` now reads `extension_attributes.erp_status_code` / `erp_status_label` before falling back to the Magento status mapping; the order list, detail page, and confirmation PDF all route through the same resolver, and translations for the initial ERP code set (`delivery_note_printed`, `partially_invoiced`, `awaiting_supplier`, `ready_for_pickup`, `partially_shipped`, `backorder`) ship in DE/EN/FR
- Quotations scaffold: `/account/quotations` list + detail pages with translations, a pluggable `src/lib/quotations.ts` that returns empty results today, and a new "Quotations" tile on the account dashboard — ready to plug in the ERP-backed Magento endpoint without further UI work
- Documents section: each invoice, shipment, and credit memo row now has a "Download PDF" link alongside the existing order confirmation button
- Cart / checkout: purchase-order reference field on the cart summary — value is forwarded to Magento as `paymentMethod.po_number` on order placement and is already surfaced on the order detail page
- Product listing: inline add-to-cart button on each product card (home, products, category pages), with idle / loading / success / error states that mirror the PDP add-to-cart; `e.preventDefault()` keeps card navigation intact when clicking the rest of the card
- Magento API resilience: admin token is now self-healing — on a `401 Unauthorized` the cached token is invalidated and the request is transparently retried with a fresh one, so token rotation or admin re-login no longer requires a Next.js restart
- Customer authentication: login, logout, protected account routes, self-registration page/API
- Orders: Magento-backed order history and order detail pages, billing + shipping + payment blocks on detail, Documents section listing Magento invoices/shipments/credit memos, on-demand Next.js-generated order confirmation PDF, localized ERP-friendly status mapping shared by list + detail
- Cart: Magento totals + order placement, responsive qty stepper UX, undo remove, safer inline error handling
- Cart media: cart item images now survive refresh / reload by enriching cart API items with product image URLs
- PDP pricing: real Magento tier pricing, bulk pricing table, and live quantity-based price preview with struck-through base price
- Localization: all newly added auth, orders, cart, pricing, ERP-status, PDF, and quotations copy localized for `de`, `en`, `fr`
- Legal/info pages: `/terms`, `/privacy`, `/compliance`, `/iso`, `/sds` now exist

---

## Pages

### Fully wired to Magento / implemented

| Page                                    | Notes                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| **Home** `/`                            | Hero, live category grid, featured products, bento section                             |
| **Product listing** `/products`         | Paginated, search-aware (`q`), live from Magento, inline add-to-cart per card          |
| **Category listing** `/categories/[id]` | Filtered by category, paginated, inline add-to-cart per card                           |
| **Product detail** `/products/[sku]`    | Gallery, specs, real tier pricing, live bulk-price preview, add-to-cart                |
| **Cart** `/cart`                        | Guest cart, Magento totals, qty update, undo remove, "Proceed to checkout" CTA, cart image recovery  |
| **Checkout** `/checkout/{address,shipping,review}` | Signed-in-only 3-step flow with stepper, real Magento shipping methods, PO number, server-action order placement → `/orders/:id` |
| **Login** `/account/login`              | Customer login via Magento customer token endpoint                                      |
| **Register** `/account/register`        | Customer self-registration; success state assumes Magento-side approval flow            |
| **Account** `/account`                  | Protected account landing page with orders / quotations / addresses / logout                              |
| **Addresses** `/account/addresses` (+ `new`, `:id/edit`) | Customer address book backed by `/V1/customers/me`; create / edit / delete with default-billing/shipping flags |
| **Orders** `/orders`                    | Protected order history list with localized status labels                              |
| **Order detail** `/orders/[id]`         | Items, totals, billing + shipping addresses, payment method, Magento-backed Documents section with per-document PDF downloads (invoice / delivery note / credit memo), downloadable order confirmation PDF, ERP-aware status label |
| **Quotations** `/account/quotations` + `/account/quotations/[id]` | List + detail pages scaffolded, empty-state today; backed by pluggable `src/lib/quotations.ts` ready to wire to ERP endpoint |
| **Legal/info pages**                    | `/terms`, `/privacy`, `/compliance`, `/iso`, `/sds` translated and routed              |

### Partial / still evolving

| Area / Page                            | What's still missing                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Registration / auth**                | Admin-side approval dashboard, sub-users, roles/permissions, 2FA, customer import/delete workflows   |
| **Quotations**                         | Backend ERP endpoint not yet wired (returns empty today); accept-to-cart conversion flow still open |
| **Cart / checkout**                    | Payment method is hard-coded to `checkmo`, no Magento payment selection UI, country/region in `AddressForm` is free-text (needs ISO country dropdown + Magento `directory/regions`), no cost-center assignment, no approval workflow (PO reference, real Magento shipping selection, multi-step checkout, address book are done)  |
| **Product detail** `/products/[sku]`  | Cert badges / trust copy are still static marketing copy                                               |

---

## Cart System

| Feature                                                     | Status      |
| ----------------------------------------------------------- | ----------- |
| Guest cart created on first add                             | ✅ Done     |
| `cartId` persisted in `localStorage`                        | ✅ Done     |
| Cart reloads from Magento on page refresh                   | ✅ Done     |
| Cart line item images survive refresh / existing carts      | ✅ Done     |
| Add to cart (loading / success / error states)              | ✅ Done     |
| Qty update → Magento                                        | ✅ Done     |
| Qty field local edit/commit UX (select on focus, revert invalid) | ✅ Done |
| Remove item → Magento                                       | ✅ Done     |
| Undo removal UX                                             | ✅ Done     |
| Cart badge (live item count)                                | ✅ Done     |
| Totals from Magento (tax, discounts, shipping)              | ✅ Done     |
| Purchase-order reference on order (`paymentMethod.po_number`) | ✅ Done   |
| Inline add-to-cart on product cards (listing / category / home) | ✅ Done |
| Checkout / place order (`/checkout/*`)                      | ✅ Done     |
| Customer address book (`/account/addresses`)                | ✅ Done     |
| Shipping method selection → Magento                         | ✅ Done     |
| Multi-payment selection at checkout                         | ❌ Not done |
| Address validation / region picker                          | ❌ Not done |
| Cost-center assignment per item                             | ❌ Not done |
| Approval workflow before order placement                    | ❌ Not done |

---

## Auth & Orders

| Feature                                              | Status  |
| ---------------------------------------------------- | ------- |
| Customer login/logout                                | ✅ Done |
| Protected account routes                             | ✅ Done |
| Customer self-registration page/API                  | ✅ Done |
| Registration approval inside Magento admin           | ⚠️ Depends on Magento configuration/process |
| Order history list                                   | ✅ Done |
| Order detail (items + totals)                        | ✅ Done |
| Order detail addresses (billing + shipping + payment) | ✅ Done |
| Documents section (invoices / shipments / credit memos) | ✅ Done |
| Downloadable order confirmation PDF                  | ✅ Done |
| Downloadable invoice PDF                             | ✅ Done |
| Downloadable delivery note / shipment PDF            | ✅ Done |
| Downloadable credit memo PDF                         | ✅ Done |
| Localized ERP-style order status labels              | ✅ Done |
| ERP status override hook (`extension_attributes.erp_status_*`) | ✅ Done |
| Quotations list + detail (ERP endpoint not yet wired)| 🔄 Scaffolded |
| Accept quotation → cart                              | ❌ Not done |
| Sub-users / role model / approval workflows          | ❌ Not done |

---

## Immediate Next Steps

Priority order for the next frontend work:

### 1. Registration approval workflow / customer governance

Current registration UI exists, but the business workflow from the requirements doc is still incomplete. Next work should define how SWR staff approve new accounts, and whether Magento alone is enough or an admin-facing dashboard is needed.

### 2. ERP-specific order workflows

Frontend scaffolding is now complete: per-document SWR-branded PDFs (invoice / shipment / credit memo) stream from `/api/orders/[id]/{invoices,shipments,creditmemos}/:docId/pdf`, the status badge goes through `resolveOrderStatus` which reads `extension_attributes.erp_status_code` / `erp_status_label` and falls back to Magento, and `/account/quotations` ships as a pluggable scaffold. Remaining work is backend-driven: the Magento/ERP team needs to populate those extension attributes on orders and expose a quotations endpoint so `src/lib/quotations.ts` can be wired. Next frontend increment is accept-quotation-to-cart once the accept endpoint exists.

### 3. Customer-specific account model

Sub-users, company-level admins, permissions, approval chains, and customer-number grouping are still untouched.

### 4. Checkout / procurement metadata

The signed-in 3-step checkout (`/checkout/{address,shipping,review}`) is live with a full customer address book, real Magento shipping methods, and PO references. Still open: payment-method selection (Magento returns the available methods from `setShippingInformation` but the UI is hard-coded to `checkmo`), an ISO country / region picker on the address form, cost-center assignment, and approval workflows.

### 5. Customer-specific B2B features

Product lists, order templates, customer assortments, and CSV import into cart remain key B2B gaps.

### 6. Returns / repair workflows

Returns, repair requests, serial-number history, and machine/service workflows are still fully open.
