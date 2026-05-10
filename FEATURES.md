# SWR Frontend — Feature Requirements

_Last reviewed: 7 May 2026 — reconciled with FRD workshop notes + codebase (`STATUS.md` / `BACKLOG.md`)._

Source: `Features_SWR_shopCloud360_intershop_english.docx`

Priority legend: **HIGH** = especially important, **MEDIUM** = nice to have, **LOW** = not required

---

## 1. User Registration & Management

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 1.1 | New user registrations must be manually approved by SWR | HIGH | Partial (frontend registration done; approval process/admin tooling still open) |
| 1.2 | Dashboard showing all pending registrations with bulk approval | HIGH | Not started |
| 1.3 | Company-level top user per customer number | HIGH | Not started |
| 1.4 | Sub-users with admin rights or configurable permissions | HIGH | Not started |
| 1.5 | Assign new users as sub-users of existing user (same customer number) | HIGH | Not started |
| 1.6 | Configurable email notifications (new registrations, password resets) | MEDIUM | Not started |
| 1.7 | Mass customer deletion or import via CSV | MEDIUM | Not started |

---

## 2. Authentication & Security

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 2.1 | Customer login with email/password | HIGH | Done |
| 2.2 | Logout | HIGH | Done |
| 2.3 | Two-factor authentication (optionally enforceable) | HIGH | Not started |
| 2.4 | GDPR-compliant data storage (EU servers) | HIGH | N/A (hosting) |
| 2.5 | ISO 27001 hosting | HIGH | N/A (hosting) |
| 2.6 | Maintenance mode — shop can be disabled during changes | MEDIUM | Not started |

---

## 3. Customer-Specific Features

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 3.1 | Customer-specific assortments (from PIM, per user/group) | HIGH | Not started |
| 3.2 | Customers can create their own product lists | HIGH | Not started |
| 3.3 | Order templates (configurable by customer) | HIGH | Not started |
| 3.4 | CSV import into shopping cart | MEDIUM | Done (`CsvImportButton` on `/cart`, `sku,qty` rows → `/api/cart/items`) |
| 3.5 | Individual order reference per order | HIGH | Done (captured on cart, sent to Magento as `paymentMethod.po_number`, shown on order detail) |
| 3.6 | View order/repair status in account | HIGH | Partial (orders: list/detail with ERP-aware labels; service cases: hub + `submitServiceCase` + case detail in demo; full repair/RMA status from ERP not wired) |
| 3.7 | ERP status mapping (e.g. "delivery note printed") | MEDIUM | Done (`resolveOrderStatus` in `src/lib/orderStatus.ts` reads `extension_attributes.erp_status_code`/`erp_status_label`; `orders.erpStatus.*` translations seeded for DE/EN/FR with common codes incl. `delivery_note_printed`, `partially_invoiced`, `awaiting_supplier`, `ready_for_pickup`, `partially_shipped`, `backorder`) |

---

## 4. eProcurement

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 4.1 | C-parts management and key account supply | HIGH | Not started |
| 4.2 | Booking order items to cost centers | HIGH | Not started |
| 4.3 | Individual item → different cost center assignment | HIGH | Not started |
| 4.4 | Budget management at user or cost center level | HIGH | Not started |
| 4.5 | Approval workflow — orders require supervisor review | HIGH | Not started |
| 4.6 | User management — admin, viewer, approver roles | HIGH | Not started |
| 4.7 | Reports and analytics — exportable spend control reports | MEDIUM | Not started |

---

## 5. Product & Catalog

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 5.1 | Product listing with search, pagination | HIGH | Done |
| 5.2 | Category navigation and filtering | HIGH | Done |
| 5.3 | Product detail page (gallery, specs, price) | HIGH | Done |
| 5.4 | Quantity-tier / bulk pricing (`tier_prices` from Magento) | HIGH | Done (PDP table + qty-driven preview) |
| 5.4b | Customer-specific net pricing; hide prices until authenticated | HIGH | Not started (Magento catalog permissions / shared catalogs + storefront price gates) |
| 5.5 | Content hub (brand content, landing pages, document catalog) | MEDIUM | Partial (CMS hubs + `/catalog` JSON repository; deep ERP/PIM wiring varies) |
| 5.6 | Seamless supplier content integration | MEDIUM | Partial (document catalog + Magento PDP coexist; full supplier automation is backend) |
| 5.7 | Static content linked with dynamic product data | MEDIUM | Partial (industry hubs hook Magento categories; rich CMS↔SKU deep links still expandable) |
| 5.8 | Multidimensional variant display with filter options | HIGH | Not started (needs configurable/matrix PDP UX + ERP-normalised facets) |
| 5.9 | Partial delivery capability display | MEDIUM | Not started (needs agreed SKU/order attributes from ERP) |
| 5.10 | Replacement product logic for discontinued items | MEDIUM | Not started |

---

## 6. Search

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 6.1 | Basic search (name/SKU) | HIGH | Done |
| 6.2 | Price, stock, and add-to-cart within search results | HIGH | Done (inline add-to-cart button on every product card, with loading / success / error feedback) |
| 6.3 | Synonym database (e.g. "Flex" = angle grinder) | MEDIUM | Out of scope near term (would need dedicated synonym infra) |
| 6.4 | Error tolerance / fuzzy search | MEDIUM | Not started (Magento baseline; ES/third-party TBD) |
| 6.5 | Intelligent on-site search (SPARQUE) | MEDIUM | Not integrated — storefront uses Magento REST search/filter only today |
| 6.6 | Faceted filters beyond text (category, price band on `/products`) | MEDIUM | Partial (`ProductsFilterBar` URL filters; full `aggregations` UX optional) |

---

## 7. Shopping Cart & Checkout

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 7.1 | Guest cart (add, update qty, remove) | HIGH | Done |
| 7.2 | Cart totals from Magento (tax, discounts) | HIGH | Done |
| 7.3 | Place order (authorization) | HIGH | Done (signed-in 3-step `/checkout` flow: address → shipping → review; uses real Magento `estimate-shipping-methods` + `shipping-information` + `PUT /V1/carts/:id/order`; cart auto-assigned to customer; payment hard-coded to `checkmo` for now) |
| 7.4 | CSV import into cart | MEDIUM | Done |
| 7.5 | Individual order reference field | HIGH | Done (PO number input on cart summary, forwarded to Magento on order placement) |
| 7.6 | Cost center assignment per item | HIGH | Not started |
| 7.7 | Approval workflow before order placement | HIGH | Not started |
| 7.8 | Flexible payment methods (Stripe, PayPal) | MEDIUM | Not started |
| 7.9 | Individually selectable payment terms | MEDIUM | Not started |
| 7.10 | Shipping cost rules per customer | MEDIUM | Not started |
| 7.11 | Minimum order value per customer | MEDIUM | Not started |

---

## 8. Orders & Account

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 8.1 | Order history list | HIGH | Done |
| 8.2 | Order detail page (items, totals, address) | HIGH | Done (items, totals, billing + shipping address blocks, payment method) |
| 8.3 | Quotation lookup from ERP → accept in shop | MEDIUM | Partial (`/account/quotations` list + detail pages scaffolded with pluggable `src/lib/quotations.ts`; renders empty state today, wires to ERP endpoint later; accept-to-cart still to come) |
| 8.4 | Documents as downloadable PDFs | MEDIUM | Partial — **Done** for Magento-backed **order** docs (confirmation + invoice/shipment/credit memo react-pdf streams). **Open:** quotation-specific ERP PDFs once quotations API exists |

---

## 9. Returns & Claims

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 9.1 | Return registration via self-service in account | HIGH | Partial (`/account/service` unified cases incl. `kind=return`; dedicated marketing slug `/account/returns` optional) |
| 9.2 | Continuous return number from ERP | HIGH | Not started |
| 9.3 | Photo upload with return request | MEDIUM | Partial (file input + metadata on case; bytes not stored until upload endpoint) |
| 9.4 | Return status display (received, under review, approved, credit note) | HIGH | Not started |
| 9.5 | Repair request selectable | MEDIUM | Partial (pick equipment → `/account/service/pick`, fleet + order lines + `manual=1`, marketing `RepairIntakePanel`; backend case/RMA open) |
| 9.6 | Configurable return policies per customer | MEDIUM | Not started |

---

## 10. Serial Number & Machine History

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 10.1 | Serial number management | MEDIUM | Partial (serials on demo `FleetRepository` machines; no central ERP register) |
| 10.2 | Linking with warranty and maintenance data | MEDIUM | Partial (warranty state + maintenance log in My Fleet when demo/seeded; not ERP-sourced) |
| 10.3 | Digitized maintenance workflows | MEDIUM | Partial (maintenance table + service CTAs on fleet; no shop-floor/ERP workflow) |

---

## 11. AI & Intelligent Features

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 11.1 | AI Copilot — product consultation in chat | MEDIUM | Not started (upstream APIs may exist — Next.js UI & wiring pending) |
| 11.2 | Add to cart directly within chat | MEDIUM | Not started (depends on Copilot shell) |
| 11.3 | Image-based product recognition | MEDIUM | Not started |
| 11.4 | AI-based cross-selling from ERP purchase history | MEDIUM | Not started |
| 11.5 | AI-assisted spare parts identification | MEDIUM | Not started |
| 11.6 | AI-driven automatic product enrichment | MEDIUM | Not started |
| 11.7 | AI-based trend forecasts | LOW | Not started |

---

## 12. Data Refinement & Quality

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 12.1 | Rule-based product data transformation | MEDIUM | Not started |
| 12.2 | Automatic attribute renaming, merging, splitting | MEDIUM | Not started |
| 12.3 | Unit normalization (mm, cm, kg) | MEDIUM | Not started |
| 12.4 | Automatic category assignment | MEDIUM | Not started |
| 12.5 | Automated product text generation from templates | MEDIUM | Not started |
| 12.6 | Free attribute mapping engine | MEDIUM | Not started |
| 12.7 | Discontinued product status field | MEDIUM | Not started |
| 12.8 | Data quality checks (required attributes present?) | MEDIUM | Not started |
| 12.9 | Fallback images for missing product images | MEDIUM | Not started |
| 12.10 | Automatic manufacturer logos | LOW | Not started |

---

## 13. Integration & Interfaces

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 13.1 | ERP integration (stock, prices, orders, documents, quotations) | HIGH | Partial (Magento REST only) |
| 13.2 | Real-time external warehouse stock | MEDIUM | Not started |
| 13.3 | Automated order transfer to ERP | HIGH | Not started |
| 13.4 | OCI interface | MEDIUM | Not started |
| 13.5 | SAP Ariba Network | MEDIUM | Not started |
| 13.6 | Coupa | MEDIUM | Not started |
| 13.7 | Integrated barcode scanning (Scandit) | MEDIUM | Deferred / costly — alternatives TBD |
| 13.8 | PIM integration (nextPIM) | MEDIUM | Not started |
| 13.9 | OSD procurement interface | MEDIUM | Not started |

---

## 14. Multi-Tenancy & Internationalization

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 14.1 | i18n — de, en, fr | HIGH | Done |
| 14.2 | Currency conversion EUR/CHF | HIGH | Done |
| 14.3 | Multi-tenant (DE / CH legal entities) | HIGH | Not started |
| 14.4 | Different VAT logics (DE / EU / CH / non-EU) | HIGH | Not started |

---

## 15. Analytics & Reporting

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 15.1 | Newsletter integration | MEDIUM | Not started (ESP e.g. Resend + consent mechanics TBD) |
| 15.2 | Top revenues report | MEDIUM | Out of scope near term unless analytics initiative launches |
| 15.3 | Top products report | MEDIUM | Out of scope near term |
| 15.4 | Search statistics | MEDIUM | Out of scope near term |
| 15.5 | Cart abandonment rate | MEDIUM | Out of scope near term |
| 15.6 | Customer activity (active vs inactive) | MEDIUM | Out of scope near term |
| 15.7 | Power BI API access | LOW | Out of scope near term |
| 15.8 | ERP query logbook | LOW | Not started |

---

## 16. Design & UX

| # | Feature | Priority | Status |
|---|---------|----------|--------|
| 16.1 | Custom design (DESIGN.md system) | HIGH | Done |
| 16.2 | Mobile-optimized responsive design | HIGH | Done |
| 16.3 | Modular channels and sub-shops | MEDIUM | Not started |
