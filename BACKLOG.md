# SWR Frontend Backlog — April 2026

Derived from the shopCloud360 / Intershop Features Requirements Document (FRD).
Cross-referenced against the current Next.js 16 frontend state documented in `AGENTS.md`.

**Status legend:** ✅ Done · 🔄 Partial · ❌ Not started  
**Priority legend:** 🔴 High (FRD green) · 🟡 Medium (FRD yellow) · ⚪ Low (FRD grey)

---

## 1. User Registration & Authentication

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Customer login (username + password) | ❌ | 🔴 | Wire `POST /rest/V1/integration/customer/token`; store token in httpOnly cookie via Route Handler. Page stub exists at `/account/login`. |
| Customer logout | ❌ | 🔴 | Clear httpOnly cookie via `POST /api/auth/logout` Route Handler (file already scaffolded). |
| Session-aware header / nav (show name, account link) | ❌ | 🔴 | Read cookie server-side in `Header.tsx`; show "My Account" vs "Login" conditionally. |
| Protected routes (`/account`, `/orders`) | ❌ | 🔴 | Middleware redirect to `/login` when no valid customer token cookie. |
| New user registration form | ❌ | 🔴 | `POST /rest/V1/customers` — Magento creates customer in pending state; admin must approve. |
| "Pending approval" state shown to new registrants | ❌ | 🔴 | Show informational page after registration submission. |
| Password reset flow (request + confirm) | ❌ | 🟡 | `PUT /rest/V1/customers/password` + reset token email flow via Magento. |
| Two-factor authentication UI | ❌ | ⚪ | Requires Magento 2FA module; frontend shows TOTP/code entry step after login. |

---

## 2. Account & User Management

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Account overview page (`/account`) | ✅ | — | Live `/account` dashboard linking to orders, quotations, addresses, logout. |
| Edit profile (name, email, phone) | ❌ | 🟡 | `PUT /rest/V1/customers/me`. |
| Address book (list, add, edit, delete) | ✅ | — | `/account/addresses` with `AddressForm` (new + edit) and delete button. List/POST via `PUT /V1/customers/me`; delete via admin-token `DELETE /V1/addresses/:id`. Region selector + ISO country picker still TODO (today the country/region is a free-text 2-letter / text input). |
| Sub-user management (create sub-users under same customer number) | ❌ | ⚪ | Requires Magento B2B Company module or custom extension; frontend shows a user list + invite form. |
| Role / permission display for sub-users | ❌ | ⚪ | Depends on backend role model; frontend renders role badge and edit controls. |
| Configurable email notification preferences | ❌ | ⚪ | Settings toggle saved to customer custom attributes. |

---

## 3. Orders & Order History

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Order history list (`/orders`) | ❌ | 🔴 | Page stub exists; call `GET /rest/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=customer_id&...` with customer token. |
| Order detail view | ❌ | 🔴 | `GET /rest/V1/orders/:orderId` — line items, totals, status. |
| Order status display (processing, shipped, etc.) | ❌ | 🔴 | Map Magento order statuses to translated labels. |
| Per-order customer reference field | ❌ | 🔴 | Add a "Your reference / PO number" text input to checkout; pass as `extension_attributes.po_number` or order comment. |
| Reorder (add previous order items to cart) | ❌ | 🟡 | Iterate order items and call `POST /api/cart/items` for each. |
| Downloadable order documents (invoice / shipment / credit memo PDFs) | ✅ | — | SWR-branded react-pdf documents streamed from `/api/orders/[id]/{invoices,shipments,creditmemos}/:docId/pdf`; ownership-gated like the confirmation PDF. Components share `src/components/orders/pdfStyles.ts` and `PdfAddress.tsx`. |
| ERP-specific order status labels | ✅ | — | `resolveOrderStatus` reads `extension_attributes.erp_status_code` / `erp_status_label` and falls back to Magento state mapping; used by order list, detail, and confirmation PDF. Add new ERP codes to `orders.erpStatus.*` in the three message files. |
| Quotation list / detail (`/account/quotations`) | 🔄 | 🟡 | Pages + `src/lib/quotations.ts` scaffold ship today with empty state; wire `listCustomerQuotations` / `getQuotationForCustomer` when the ERP-backed Magento endpoint lands. |
| Accept quotation → cart | ❌ | 🟡 | Convert a quotation's lines into cart items on a user action; depends on backend accept endpoint. |

---

## 4. Product Catalog & Detail

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Product listing page (paginated) | ✅ | — | Live from Magento REST API. |
| Product detail page (PDP) | ✅ | — | Gallery, specs, price, add-to-cart all working. |
| Category listing | ✅ | — | Filtered by category, paginated. |
| Tiered / bulk pricing table on PDP | 🔄 | 🔴 | UI table exists but shows hardcoded demo rows. Map `product.tier_prices` from Magento API; hide section when array is empty. |
| Multidimensional variant display (size, colour, etc.) | ❌ | 🔴 | Magento configurable products return `configurable_options`; frontend needs a variant selector that updates price/SKU/stock. |
| Stock availability indicator | ❌ | 🔴 | `product.extension_attributes.stock_item.qty` is available in the API response; render in-stock / low-stock / out-of-stock badge. |
| Partial delivery capability indicator | ❌ | 🟡 | Custom product attribute from ERP; render as badge/note on PDP when attribute is set. |
| Replacement / successor product notice | ❌ | 🟡 | Requires a custom Magento attribute (e.g. `replacement_sku`); frontend renders a banner linking to the replacement PDP. |
| Customer-specific assortments (hide products not in assortment) | ❌ | 🟡 | Requires backend filtering by customer group; frontend passes customer token so Magento returns only permitted products. |
| Customer product lists (saved lists / favourites) | ❌ | 🟡 | `POST /rest/V1/wishlists` or custom endpoint; frontend shows a "Save to list" button and a `/account/lists` page. |
| Order templates (saved carts) | ❌ | 🟡 | Custom Magento endpoint or wishlist variant; frontend shows a "Save as template" button and a template list page. |
| CSV import into cart | ❌ | ⚪ | File upload UI → parse CSV client-side → iterate rows calling `POST /api/cart/items`. |
| Barcode scanning (Scandit) | ❌ | ⚪ | Integrate Scandit Web SDK; on scan result, look up SKU and add to cart or navigate to PDP. |
| AI Copilot / chat-based product consultation | ❌ | ⚪ | Floating chat widget; requires AI backend (e.g. OpenAI + product index); out of scope until AI backend is ready. |
| Image-based product recognition | ❌ | ⚪ | Upload image → AI identifies product → shows matching PDP. Requires AI backend. |
| AI cross-selling recommendations | ❌ | ⚪ | Render a "Customers also bought" rail on PDP/cart; data sourced from ERP purchase history via custom Magento endpoint. |
| AI spare parts identification | ❌ | ⚪ | Dedicated spare-parts finder UI; requires AI + machine/serial-number data. |

---

## 5. Search

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Basic keyword search | ✅ | — | `SearchBar` pushes `?q=` to `/products`; wired to `searchProducts()` in `magento.ts`. |
| Price display in search results | ✅ | — | `ProductCard` shows price. |
| Add-to-cart from search results | ✅ | — | `ProductCard` has add-to-cart button. |
| Stock availability in search results | ❌ | 🔴 | Same as PDP stock badge — read `stock_item` from search result and render badge on `ProductCard`. |
| Error-tolerant / fuzzy search | ❌ | 🟡 | Magento's native search has limited fuzzy support; full solution requires SPARQUE or Elasticsearch tuning on the backend. Frontend just passes the query string. |
| Synonym / replacement product logic in search | ❌ | 🟡 | Backend concern (search engine config); frontend may show a "Did you mean…" suggestion if the API returns one. |
| Advanced filters (faceted search) | ❌ | 🟡 | Magento returns `aggregations` in search response; frontend needs a filter sidebar that builds `searchCriteria` filter groups. |

---

## 6. Cart & Checkout

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Cart page (line items, qty update, remove) | ✅ | — | Fully working. |
| Cart totals from Magento (subtotal, tax, grand total) | ✅ | — | `CartProvider` exposes `totals` straight from Magento `/totals`; cart sidebar shows the live `subtotal_with_discount` / `tax_amount` / `grand_total`. |
| Place order (checkout) | ✅ | — | Signed-in 3-step flow at `/checkout/{address,shipping,review}`; `placeOrderAction` in `checkout/review/actions.ts` resolves numeric cart, runs `PUT /V1/carts/:id` (assign customer) + `PUT /V1/carts/:id/order`, redirects to `/orders/:id`. |
| Billing address collection at checkout | ✅ | — | Step 1 (`/checkout/address`) lists saved customer addresses + inline new-address form. Single chosen address is used as both billing and shipping for now. |
| Order confirmation page | ✅ | — | Existing `/orders/:id` is reused as the post-checkout landing page; downloadable confirmation PDF wired via `/api/orders/[id]/confirmation`. |
| Customer order reference / PO number field | ✅ | — | Optional PO input on `/checkout/review`; forwarded to Magento as `paymentMethod.po_number`. |
| Shipping method selection | ✅ | — | Step 2 (`/checkout/shipping`) calls `POST /api/checkout/shipping-methods` (proxy to `estimate-shipping-methods`), persists choice via `POST /api/checkout/shipping-information`. |
| Multi-payment selection at checkout | ❌ | 🟡 | Currently hard-coded to `checkmo` in `placeCustomerOrder`; expose Magento payment methods returned from `setShippingInformation` and let the customer choose. |
| Address validation / region picker on checkout | ❌ | 🟡 | Country and region today are free-text in `AddressForm`; should become an ISO country dropdown with Magento `directory/regions` driving region selection. |
| Cost centre assignment per line item | ❌ | ⚪ | Requires Magento B2B or custom extension; frontend adds a cost-centre input per cart row. |
| Budget management / spend limits | ❌ | ⚪ | Requires backend budget module; frontend shows remaining budget and blocks order if exceeded. |
| Order approval workflow (supervisor review) | ❌ | ⚪ | Requires Magento B2B Requisition Lists or custom workflow; frontend shows "Submit for approval" instead of "Place order" for restricted users. |
| Payment method selection | ❌ | ⚪ | Magento returns available payment methods; frontend renders a selector. Currently B2B "invoice" only is assumed. |
| Minimum order value enforcement | ❌ | ⚪ | Backend-enforced; frontend reads `totals.grand_total` and disables checkout button with a message if below threshold. |

---

## 7. Returns & Claims

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Return registration form (`/account/returns/new`) | ❌ | 🟡 | Select order/line items, reason, optional repair request; submit to Magento RMA or custom endpoint. |
| Photo upload for returns | ❌ | 🟡 | File input → upload to Magento media API or S3; attach URL to return request. |
| Return status display (`/account/returns`) | ❌ | 🟡 | List of returns with status badges (received, under review, approved, credit note sent). |
| Repair request option | ❌ | ⚪ | Checkbox/radio on return form; passed as return attribute. |

---

## 8. Internationalisation & Currency

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Three locales (de, en, fr) | ✅ | — | next-intl configured; all three message files present. |
| Locale switcher in header | ✅ | — | `LocaleSwitcher` component. |
| EUR / CHF currency switcher | ✅ | — | `CurrencyProvider` + `CurrencySwitcher`; cookie-persisted. |
| Currency conversion (EUR → CHF) | ✅ | — | `currency.ts` handles conversion + Intl formatting. |
| Locale-aware links (no hardcoded `next/link`) | ✅ | — | All links use `@/i18n/navigation`. |
| Swiss VAT logic (different from DE/EU) | ❌ | 🔴 | Cart totals must use Magento-returned tax amounts (not hardcoded 19%); Magento handles VAT logic per store view. Blocked by "Cart totals from Magento" item above. |
| Multiple legal entities (DE / CH) per customer | ❌ | ⚪ | Requires Magento multi-store or B2B company setup; frontend switches store view based on customer entity. |

---

## 9. Legal & Informational Pages

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Terms & Conditions (`/terms`) | ❌ | 🔴 | Page stub exists (404). Static translated content in all three locales. |
| Privacy Policy (`/privacy`) | ❌ | 🔴 | Page stub exists (404). Static translated content. |
| Compliance page (`/compliance`) | ❌ | 🟡 | Page stub exists (404). Static content. |
| ISO certifications page (`/iso`) | ❌ | 🟡 | Page stub exists (404). Static content + downloadable PDF links. |
| Safety Data Sheets (`/sds`) | ❌ | 🟡 | Page stub exists (404). Product-linked SDS PDFs; may need a search/filter UI. |
| Maintenance mode banner / page | ❌ | ⚪ | Check a feature flag (env var or Magento config); render a full-screen maintenance page and block all other routes via middleware. |

---

## 10. Analytics & Reporting (Frontend Instrumentation)

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Search query tracking | ❌ | 🟡 | Fire analytics event on every `?q=` search; can use a lightweight analytics library or a custom Route Handler. |
| Cart abandonment tracking | ❌ | 🟡 | Track when a cart is created but no order is placed within a session. |
| Page view / product view events | ❌ | ⚪ | Standard analytics instrumentation on PDP and listing pages. |
| Newsletter sign-up widget | ❌ | ⚪ | Email input → `POST` to Magento newsletter subscription endpoint or third-party ESP. |

---

## 11. eProcurement Interfaces (Frontend Touch Points)

| Feature | Status | Priority | Notes |
|---|---|---|---|
| OCI punchout (basket transfer to customer ERP) | ❌ | ⚪ | Requires a dedicated OCI session start URL and a "Transfer basket" button that POSTs cart data in OCI format. |
| SAP Ariba / Coupa punchout | ❌ | ⚪ | Similar to OCI; different XML/cXML payload format. |
| IDS-Connect / PinnCalc deep links | ❌ | ⚪ | Inbound links that pre-populate search or cart; parse URL parameters on landing. |

---

## Out of Scope for Frontend

These items from the FRD require ERP, PIM, hosting, or backend infrastructure work and have no direct frontend implementation:

- **Integration Hub / middleware** — ERP ↔ Magento synchronisation of stock, prices, orders, documents
- **PIM integration** (nextPIM, EDE product ranges) — data ingestion pipeline, not a UI concern
- **Automated order transfer to ERP** — backend/middleware process
- **Real-time external warehouse stock** (elc logistics) — Magento extension or middleware; frontend just reads the stock value Magento exposes
- **Customer-specific pricing from ERP** — Magento customer group / tier price configuration; frontend reads whatever Magento returns
- **ISO 27001 hosting & GDPR-compliant infrastructure** — hosting/ops concern
- **Multi-tenancy architecture** — Magento multi-store setup; frontend adapts via store view switching
- **Data enrichment / PIM quality tools** — automated category assignment, product text generation, attribute mapping — all backend/PIM
- **Serial number management & machine history** — ERP/backend data model; frontend may eventually render a machine history page if an API is provided
- **Scandit SDK licensing and backend barcode catalogue** — SDK integration is frontend work (listed above), but the product catalogue and scan infrastructure are backend
- **AI model training / ERP purchase history index** — backend AI pipeline; frontend consumes the resulting recommendation API
- **SPARQUE search engine** — backend search infrastructure; frontend just sends the query string
- **Budget management backend logic** — approval workflow engine, spend tracking — backend/ERP
- **Configurable return policies per customer** — Magento RMA configuration, not frontend
- **Newsletter platform / ESP** — third-party service; frontend only adds a sign-up widget
- **Power BI API access** — direct data warehouse / BI tooling, no frontend component
- **Exportable analytics reports** — backend reporting engine; frontend may add a download button if an endpoint is provided
