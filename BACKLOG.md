# SWR Frontend Backlog — April 2026

_Last updated: 26 Apr 2026 — account service/repair pick flow, 13-machine fleet demo + SpecTable, RepairIntakePanel._

Derived from the shopCloud360 / Intershop Features Requirements Document (FRD).
Cross-referenced against the current Next.js 16 frontend state documented in `STATUS.md` and verified against the codebase.

**Status legend:** ✅ Done · 🔄 Partial · ⛔ Blocked on backend · ❌ Not started
**Priority legend:** 🔴 High (FRD green) · 🟡 Medium (FRD yellow) · ⚪ Low (FRD grey)

---

## Phase 1 deliverables (April 2026)

This file is the single trusted backlog. `FEATURES.md` is the doc-derived requirement list (read-only). `STATUS.md` is the implementation log (what has shipped). This file reconciles the two and names the next moves.

### Stale-doc cleanup list

`AGENTS.md` still contains several claims that contradict the current state. Agents should treat those sections as outdated until someone rewrites them:

- **`## Project Structure`** (the tree) — shows only the pre-rewrite layout. Does not mention `(auth)` / `(chrome)` route groups, `account/*`, `checkout/*`, `catalog/*`, `services/*`, `industries/*`, `orders/*`, `legal/*`, marketing components, fleet, CMS, catalog repository, or the SEO files. Needs a full rewrite off the real tree.
- **`## Key Magento REST API Endpoints`** — the two "NOT YET WIRED" annotations are both wrong:
  - `POST /rest/V1/guest-carts/:id/order` → order placement is live via the signed-in `/checkout/review` flow (`PUT /V1/carts/:id/order`).
  - `POST /rest/V1/integration/customer/token` → customer login is live.
  Should also add the endpoints that are actually used now (customer orders, invoices/shipments/credit memos, `/V1/customers/me`, `directory/countries`, `estimate-shipping-methods`, `shipping-information`, CMS `cmsPage`/`cmsBlock`).
- **`## Pages — Current Status`** — all three sub-tables are stale:
  - _Fully working_ is missing checkout, login, register, account hub, addresses, orders list & detail, quotations, catalog, services, industries, legal, marketing hubs, and fleet.
  - _Stubbed / incomplete_ still lists Cart totals (now live), PDP tier pricing (now live), Checkout (now live), Authentication (now live).
  - _Missing entirely (links exist, 404)_ lists `/orders`, `/account`, `/terms`, `/privacy`, `/compliance`, `/iso`, `/sds` — they all exist (and `/iso` deliberately 301-redirects to `/certificates`).
- **`## Remaining Work — Priority Order`** — all five items (cart totals, PDP tier pricing, checkout, auth, legal pages) are shipped. Replace with the "Phase 2 — Next execution queue" below.
- **`## Common Pitfalls` — admin-token bullet** — claims the Next.js process must restart when the Magento token expires. `magentoGet`/`magentoPost` are now self-healing on `401` (see `src/lib/magento.ts`), so this is no longer a pitfall.
- **`## Cart Architecture`** — still accurate (cart page still uses `ssr: false`; CartProvider still boots from `localStorage`). Leave as-is.

---

## Phase 2 — Next execution queue

Ranked for pick-up order. Each group is ordered high → low value.

### Frontend-ready now (no backend blocker)

1. **🔴 PDP stock availability badge** — render `extension_attributes.stock_item.qty` as in-stock / low-stock / out-of-stock on the PDP and on `ProductCard` (listing, search, category).
2. **🔴 Search results stock badge** — same data, same component, wired into `ProductCard` once the PDP badge lands.
3. **🟡 Checkout — ISO country + region picker in `AddressForm`** — swap today's free-text country/region inputs for an ISO country dropdown backed by Magento `directory/countries` and a region `<select>` driven by the chosen country. Replace both in `AddressForm` (new / edit address book + checkout address step).
4. **🟡 Checkout — payment method selection** — `setShippingInformation` already returns `payment_methods`. Expose them as a radio group in `/checkout/review` and pass the chosen method (instead of hard-coded `checkmo`) into `placeCustomerOrder`.
5. **🟡 Account — edit profile** — simple form on `/account` that `PUT`s `/V1/customers/me` for name / email / phone.
6. **🟡 Password reset flow** — two pages (`/account/forgot-password`, `/account/reset-password`) wired to Magento's `PUT /V1/customers/password` reset + email token.
7. **🟡 Order reorder action** — "Reorder" button on order detail that iterates the order's items and calls `POST /api/cart/items`.
8. **🟡 Faceted search on products listing** — Magento search responses already include `aggregations`; reuse the `FilterSidebar` pattern from `/catalog` on `/products`.
9. **🟡 Cart — CSV import** — file input → client-side CSV parse → bulk `POST /api/cart/items` with per-row error feedback.

### Blocked on backend (Magento / ERP / PIM work required first)

Listed with the exact backend contract each item needs.

10. **🔴 Accept quotation → cart** — needs the ERP quotation accept endpoint. `/account/quotations` scaffold and `src/lib/quotations.ts` are ready; wire `listCustomerQuotations` + an `acceptQuotation` call.
11. **🔴 Registration approval dashboard / sub-users / roles** — needs Magento B2B company module (or custom extension) to model company → admin → sub-user and permissions. No frontend work possible until the data model exists.
12. **🔴 Multidimensional variant display on PDP** — needs configurable products in Magento (`configurable_options`). Frontend then renders variant selectors that update SKU/price/stock.
13. **🟡 Partial delivery indicator / replacement-product notice** — need custom product attributes from the ERP/PIM (e.g. `partial_delivery_allowed`, `replacement_sku`). Frontend renders badge/banner when present.
14. **🟡 Customer-specific assortments** — needs Magento customer-group / shared-catalog config. Frontend just sends the customer token.
15. **🟡 Customer product lists & order templates** — wishlist or custom endpoint (`POST /V1/wishlists` or equivalent).
16. **🟡 Returns / RMA** — **in-repo:** return/repair/inspection case UI + hub + pick + demo `submitServiceCase`. **Still need:** Magento RMA / custom endpoint, photo upload, production status list.
17. **🟡 Swiss VAT / multi-store** — needs a CH store view (and optional CH legal entity) in Magento. Frontend already takes tax amounts from Magento totals, so switching store view is the actual lever.
18. **🟡 Newsletter sign-up widget** — needs chosen ESP / Magento newsletter endpoint.
19. **🟡 Offers / promotions on products** — needs a Magento `promotion` / `offer` product attribute so the `/offers` page can surface a real product rail instead of CMS copy only.

### Later / optional (FRD grey or ⚪ low)

- Two-factor authentication UI (needs Magento 2FA module).
- Cost-centre assignment per line item, budget management, approval workflows (needs Magento B2B Requisition / custom workflow engine).
- Minimum order value enforcement (frontend button gate is trivial once backend rule exists).
- OCI / SAP Ariba / Coupa punchout, IDS-Connect / PinnCalc deep links.
- Scandit barcode scanning (needs license + backend barcode catalogue).
- AI copilot, image recognition, cross-sell, spare-parts finder (needs AI backend + purchase-history index).
- Error-tolerant / fuzzy search, synonym database, SPARQUE search (backend search infra).
- Search query / cart-abandonment / product-view analytics instrumentation.
- Maintenance mode banner (env flag + middleware gate).
- Multi-tenant (DE / CH) legal-entity switcher.
- Live job postings board on `/careers` (today a static CMS page).

---

## 1. User Registration & Authentication

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Customer login (username + password) | ✅ | 🔴 | Live at `/account/login`; token cookie is httpOnly. |
| Customer logout | ✅ | 🔴 | `LogoutButton` + `/api/auth/logout` clears the cookie. |
| Session-aware header / nav (show name, account link) | ✅ | 🔴 | `Header.tsx` and `MobileNav.tsx` read the customer session server-side. |
| Protected routes (`/account`, `/orders`, `/checkout`) | ✅ | 🔴 | Server-side cookie gate on all protected routes. |
| New user registration form | ✅ | 🔴 | `/account/register` + `/api/auth/register` → `POST /V1/customers`. |
| "Pending approval" state shown to new registrants | ✅ | 🔴 | Success state informs the user that SWR will approve the account. |
| Password reset flow (request + confirm) | ❌ | 🟡 | `PUT /V1/customers/password` + reset-token pages still to build. Frontend-ready now. |
| Two-factor authentication UI | ❌ | ⚪ | Requires Magento 2FA module. |

---

## 2. Account & User Management

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Account overview page (`/account`) | ✅ | — | Dashboard with tiles for orders, quotations, addresses, fleet, logout. |
| Edit profile (name, email, phone) | ❌ | 🟡 | `PUT /V1/customers/me`. Frontend-ready now. |
| Address book (list, add, edit, delete) | ✅ | — | `/account/addresses` + `AddressForm`. Country / region pickers still TODO (see checkout queue). |
| Sub-user management (create sub-users under same customer number) | ⛔ | ⚪ | Requires Magento B2B company module. |
| Role / permission display for sub-users | ⛔ | ⚪ | Depends on backend role model. |
| Configurable email-notification preferences | ❌ | ⚪ | Settings toggle → customer custom attributes. |
| My Fleet (`/account/fleet`) | ✅ | — | Pluggable `FleetRepository`. `NEXT_PUBLIC_FLEET_DEMO=1` enables a **13-machine** demo seed with `specs[]`, warranty counters, and maintenance log; production stays empty until real data lands. |

---

## 3. Orders & Order History

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Order history list (`/orders`) | ✅ | — | Protected list with localized status labels. |
| Order detail view | ✅ | — | Items + totals + billing + shipping + payment. |
| Order status display (processing, shipped, etc.) | ✅ | — | Mapped through `resolveOrderStatus` in `src/lib/orderStatus.ts`. |
| Per-order customer reference field | ✅ | — | PO number captured on cart + `/checkout/review`, forwarded as `paymentMethod.po_number`. |
| Reorder (add previous order items to cart) | ❌ | 🟡 | Frontend-ready now — iterate order items → `POST /api/cart/items`. |
| Downloadable order documents (invoice / shipment / credit memo PDFs) | ✅ | — | Streamed via `/api/orders/[id]/{invoices,shipments,creditmemos}/:docId/pdf`; ownership-gated. |
| Downloadable order confirmation PDF | ✅ | — | `/api/orders/[id]/confirmation` (react-pdf). |
| ERP-specific order status labels | ✅ | — | `resolveOrderStatus` reads `extension_attributes.erp_status_code` / `erp_status_label`. DE/EN/FR strings seeded. |
| Quotation list / detail (`/account/quotations`) | 🔄 | 🟡 | Scaffold + `src/lib/quotations.ts` returns empty today; wire when ERP endpoint lands. |
| Accept quotation → cart | ⛔ | 🟡 | Blocked — needs ERP accept endpoint. |

---

## 4. Product Catalog & Detail

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Product listing page (paginated) | ✅ | — | Live from Magento REST API. |
| Product detail page (PDP) | ✅ | — | Gallery, specs, price, add-to-cart, live quantity-based price preview. |
| Category listing | ✅ | — | Filtered by category, paginated. |
| Tiered / bulk pricing table on PDP | ✅ | — | Maps real `product.tier_prices`; hidden when empty. |
| Stock availability indicator | ❌ | 🔴 | Frontend-ready now — render `extension_attributes.stock_item.qty` as badge on PDP + `ProductCard`. |
| Multidimensional variant display (size, colour, etc.) | ⛔ | 🔴 | Needs configurable products in Magento. |
| Partial delivery capability indicator | ⛔ | 🟡 | Needs custom product attribute from ERP. |
| Replacement / successor product notice | ⛔ | 🟡 | Needs a `replacement_sku` custom attribute. |
| Customer-specific assortments | ⛔ | 🟡 | Needs backend filtering by customer group / shared catalogs. |
| Customer product lists (saved lists / favourites) | ⛔ | 🟡 | Needs wishlist or custom endpoint; frontend shows a "Save to list" button and `/account/lists`. |
| Order templates (saved carts) | ⛔ | 🟡 | Needs custom Magento endpoint or wishlist variant. |
| CSV import into cart | ❌ | ⚪ | Frontend-ready now — file upload + client-side CSV parse → bulk `POST /api/cart/items`. |
| Barcode scanning (Scandit) | ❌ | ⚪ | Needs SDK license + backend barcode catalogue. |
| AI Copilot / chat-based product consultation | ⛔ | ⚪ | Needs AI backend. |
| Image-based product recognition | ⛔ | ⚪ | Needs AI backend. |
| AI cross-selling recommendations | ⛔ | ⚪ | Needs ERP purchase-history index. |
| AI spare parts identification | ⛔ | ⚪ | Needs AI + machine/serial-number data. |

---

## 5. Search

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Basic keyword search | ✅ | — | `SearchBar` pushes `?q=` to `/products`. |
| Price display in search results | ✅ | — | `ProductCard`. |
| Add-to-cart from search results | ✅ | — | Inline button on every card. |
| Stock availability in search results | ❌ | 🔴 | Same data as PDP badge; frontend-ready now. |
| Advanced filters (faceted search) on products | ❌ | 🟡 | Frontend-ready now — Magento returns `aggregations`; reuse the `/catalog` accordion sidebar pattern on `/products`. |
| Error-tolerant / fuzzy search | ⛔ | 🟡 | Needs backend search engine tuning (Elasticsearch / SPARQUE). |
| Synonym / replacement product logic in search | ⛔ | 🟡 | Backend search config. |

---

## 6. Cart & Checkout

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Cart page (line items, qty update, remove, undo) | ✅ | — | `CartContent.tsx`. |
| Cart totals from Magento (subtotal, tax, grand total) | ✅ | — | `CartProvider` exposes `totals`; cart sidebar reads Magento numbers directly. |
| Inline add-to-cart on product cards | ✅ | — | Home, listing, category, search. |
| Cart item images persist across refresh | ✅ | — | Cart API enriches items with product image URLs. |
| Place order (checkout) | ✅ | — | Signed-in 3-step flow `/checkout/{address,shipping,review}` → `PUT /V1/carts/:id/order`. |
| Billing / shipping address collection | ✅ | — | Step 1 lists saved addresses + inline new-address form. |
| Order confirmation page | ✅ | — | `/orders/:id` is reused as post-checkout landing page + confirmation PDF. |
| Customer order reference / PO number field | ✅ | — | Optional PO input on `/checkout/review`. |
| Shipping method selection | ✅ | — | Real Magento methods via `estimate-shipping-methods` + `shipping-information`. |
| Multi-payment selection at checkout | ❌ | 🟡 | Hard-coded to `checkmo` today. Frontend-ready now — `setShippingInformation` already returns `payment_methods`. |
| Address validation / region picker on checkout | ❌ | 🟡 | Country + region are free-text today. Frontend-ready now — ISO country dropdown + Magento `directory/regions`. |
| Cost-centre assignment per line item | ⛔ | ⚪ | Needs Magento B2B / custom extension. |
| Budget management / spend limits | ⛔ | ⚪ | Needs backend budget module. |
| Order approval workflow (supervisor review) | ⛔ | ⚪ | Needs Magento B2B Requisition Lists or custom workflow. |
| Minimum order value enforcement | ❌ | ⚪ | Read `totals.grand_total`, disable CTA below threshold. Needs threshold definition (config or custom attr). |

---

## 7. Returns & Claims

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Return / service case (unified) | 🔄 | 🟡 | **UI:** `/account/service/new?kind=return` (and hub), `NewCaseForm`, in-memory or demo `submitServiceCase`, `/account/service/[id]`. **Not production:** no Magento RMA, labels, or credit flow. |
| Photo upload for returns | ⛔ | 🟡 | Needs upload endpoint. |
| Return status (RMA list) | ⛔ | 🟡 | Case detail exists for in-process cases; end-to-end RMA list still needs backend. |
| Repair request (selection-first) | 🔄 | ⚪ | **`/account/service/pick?kind=repair|inspection`** (fleet grid, past orders, not-listed → `manual=1`); bare `.../new?kind=repair` redirects to pick. `NewCaseForm` with order lines + `machineId` / `orderId`. Marketing: `RepairIntakePanel` on `/services/repair`. Server `submitServiceCase` is demo. ERP/RMA when backend exists. |
| Selection-first repair (FRD / plan AC) | 🔄 | — | Core UX shipped; see [Phase 6 plan](.cursor/plans/phase_6_plan_returns,_repair,_and_machine_workflows_2a9c3629.plan.md). Remainder: RMA, durable uploads, ERP. |

---

## 8. Internationalisation & Currency

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Three locales (de, en, fr) | ✅ | — | next-intl, all three message files present. |
| Locale switcher in header | ✅ | — | `LocaleSwitcher`. |
| EUR / CHF currency switcher | ✅ | — | `CurrencyProvider` + `CurrencySwitcher`, cookie-persisted. |
| Currency conversion (EUR → CHF) | ✅ | — | `src/lib/currency.ts`. |
| Locale-aware links (no hardcoded `next/link`) | ✅ | — | All links use `@/i18n/navigation`. |
| Swiss VAT logic (different from DE/EU) | ⛔ | 🔴 | Frontend already takes Magento tax numbers; lever is a CH store view in Magento. |
| Multiple legal entities (DE / CH) per customer | ⛔ | ⚪ | Needs Magento multi-store / B2B company setup. |

---

## 9. Legal & Informational Pages

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Imprint (`/legal/imprint`) | ✅ | — | CMS-backed with i18n fallback; `/impressum` 301-redirects. |
| Terms & Conditions (`/legal/terms`) | ✅ | — | CMS-backed; `/terms`, `/agb` 301-redirect. |
| Privacy Policy (`/legal/privacy`) | ✅ | — | CMS-backed; `/privacy`, `/datenschutzerklaerung` 301-redirect. |
| Compliance page (`/legal/compliance`) | ✅ | — | CMS-backed; `/compliance` 301-redirects. |
| Safety Data Sheets (`/legal/sds`) | ✅ | — | CMS-backed; product-linked SDS lookup still TODO. `/sds` 301-redirects. |
| Certificates (`/certificates`) | ✅ | — | CMS-backed with ISO 9001 / 14001 / AEO / DIN 3834 cards. Real certificate PDFs pending. `/iso`, `/zertifikate` 301-redirect. |
| Maintenance mode banner / page | ❌ | ⚪ | Env flag + middleware gate. |

---

## 10. Marketing Surface (WordPress replacement)

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Home page rebuild | ✅ | — | Question-led hero, reality numbers, intent tiles, catalog rail, services, industries, people block, workshop block. |
| Document catalog (`/catalog`, `/catalog/[id]`) | ✅ | — | Accordion sidebar facets (category / type / brand / language) + active-filter chips + free-text search + iframe PDF viewer + YouTube / HTML5 video viewer. JSON repository (~60 real PDFs); swappable for a Magento DocumentEntity module / EDE feed later. `/katalog` 301-redirects. |
| Industrial Service & Repair Portal (`/services/repair`) | 🔄 | — | Categories grid, `RepairTimeline` (Ø 48 h), `RepairIntakePanel` (signed-in: fleet + **`/account/service/pick?kind=repair`** + service hub; guest: `RepairRequestForm` mailto). |
| Swiss Delivery Center (`/services/customs`) | ✅ | — | Zones, duty/VAT tables, "what we file for you" checklist, document deep-links. |
| Welding Technology Hub (`/industries/welding`) | ✅ | — | Static override with sub-process tiles, gas `SpecTable`, guide deep-links, welding PDFs rail. |
| My Fleet (`/account/fleet`, `/account/fleet/[id]`) | ✅ | — | Warranty counters, **13-machine** demo when `NEXT_PUBLIC_FLEET_DEMO=1`, **SpecTable** for technical specs, maintenance log, repair/inspection quick actions. |
| `/about`, `/contact`, `/partners`, `/careers`, `/offers` | ✅ | — | CMS-backed with i18n fallback; legacy German paths 301-redirect. |
| `/services` hub + 4 pillars | ✅ | — | `ServicePillarPage` + `ServiceCard`. |
| `/industries` hub + 7 slug pages | ✅ | — | Dynamic slugs resolve Magento categories via `findCategoryByName`. |
| Marketing primitive library (`src/components/marketing/*`) | ✅ | — | 16 primitives covering hero, CTA, rails, cards, tables. |
| Legacy WordPress URL redirects | ✅ | — | 30+ 301-redirects in `src/proxy.ts`. |
| Sitemap + robots | ✅ | — | `src/app/sitemap.ts` + `src/app/robots.ts` with hreflang. |
| Per-page `generateMetadata` from CMS meta fields | ✅ | — | Falls back to i18n keys. |
| `hreflang` alternates + canonical + Open Graph defaults | ✅ | — | Root layout uses `src/lib/seo.ts` `localeAlternates`. |
| Magento CMS content authoring | 🔄 | 🔴 | Frontend is ready. Authors still need to create the CMS pages in Magento admin (`about`, `contact`, `imprint`, `services-*`, `industries-*`, `partners`, `careers`, `certificates`, `offers`) per locale. i18n fallback copy renders until then. |

---

## 11. Analytics & Reporting (Frontend Instrumentation)

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Search query tracking | ❌ | 🟡 | Fire analytics event on every `?q=`. |
| Cart abandonment tracking | ❌ | 🟡 | Session-scoped cart-without-order tracking. |
| Page view / product view events | ❌ | ⚪ | Standard analytics instrumentation. |
| Newsletter sign-up widget | ⛔ | ⚪ | Needs ESP choice / endpoint. |

---

## 12. eProcurement Interfaces (Frontend Touch Points)

| Feature | Status | Priority | Notes |
|---|---|---|---|
| OCI punchout (basket transfer to customer ERP) | ⛔ | ⚪ | Needs OCI session start URL + payload format. |
| SAP Ariba / Coupa punchout | ⛔ | ⚪ | Similar to OCI; different cXML. |
| IDS-Connect / PinnCalc deep links | ⛔ | ⚪ | Parse URL params on landing. |

---

## Out of Scope for Frontend

These items from the FRD require ERP, PIM, hosting, or backend infrastructure work and have no direct frontend implementation:

- **Integration Hub / middleware** — ERP ↔ Magento synchronisation of stock, prices, orders, documents.
- **PIM integration** (nextPIM, EDE product ranges) — data ingestion pipeline.
- **Automated order transfer to ERP** — backend/middleware process.
- **Real-time external warehouse stock** (elc logistics) — Magento extension or middleware; frontend just reads whatever stock value Magento exposes.
- **Customer-specific pricing from ERP** — Magento customer-group / tier-price configuration; frontend reads whatever Magento returns.
- **ISO 27001 hosting & GDPR-compliant infrastructure** — hosting/ops concern.
- **Multi-tenancy architecture** — Magento multi-store setup; frontend adapts via store-view switching.
- **Data enrichment / PIM quality tools** — automated category assignment, text generation, attribute mapping.
- **Serial number management & machine history** — ERP/backend data model (frontend surface exists via `/account/fleet`, but real data feed is backend).
- **Scandit SDK licensing and backend barcode catalogue** — SDK integration is frontend work; the catalogue is backend.
- **AI model training / ERP purchase history index** — backend AI pipeline.
- **SPARQUE search engine** — backend search infrastructure.
- **Budget management backend logic** — approval workflow engine, spend tracking.
- **Configurable return policies per customer** — Magento RMA configuration.
- **Newsletter platform / ESP** — third-party service; frontend only adds a sign-up widget.
- **Power BI API access** — direct data warehouse / BI tooling.
- **Exportable analytics reports** — backend reporting engine.
