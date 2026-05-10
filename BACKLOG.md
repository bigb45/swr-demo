# SWR Frontend Backlog — May 2026

_Last updated: 9 May 2026 — reconciled with `STATUS.md`, copilot + quotations + service upload contracts._

Derived from the shopCloud360 / Intershop Features Requirements Document (FRD).
Cross-referenced against the current Next.js 16 frontend state documented in `STATUS.md` and verified against the codebase.

**Status legend:** ✅ Done · 🔄 Partial · ⛔ Blocked on backend · ❌ Not started · ⏸️ Out of scope / deferred (near term)
**Priority legend:** 🔴 High (FRD green) · 🟡 Medium (FRD yellow) · ⚪ Low (FRD grey)

---

## Phase 1 deliverables

This file is the single trusted backlog. `FEATURES.md` is the doc-derived requirement checklist. `STATUS.md` is the implementation log (what has shipped). This file reconciles the two and names the next moves.

### Terminology (avoid confusion in stakeholder decks)

| Phrase | Meaning in *this* codebase today |
|--------|-----------------------------------|
| **Magento `tier_prices`** | Quantity-break / **bulk** pricing on the PDP (`tier_prices` from REST). ✅ Implemented. |
| **“Tiered / customer-specific B2B pricing”** (hide prices until login; net price per customer) | **Storefront:** catalog surfaces hide numeric prices for guests (`CustomerSessionProvider` + gated components). **Magento:** customer-group / shared-catalog net pricing and **REST payload hiding for anonymous API consumers** are still open — many product reads use the **admin token**, so responses can still include `price` even when the UI does not show it. |
| **Intelligent / SPARQUE search** | Third-party / backend search stack. ⛔ Not in repo — listing/search uses **Magento REST** filters + text match (`getFilteredProducts`, etc.). |
| **Partial delivery capability** | Usually “allow partial shipment / backorder line behaviour” surfaced per SKU or order line — needs agreed **product/order attributes** from ERP before the storefront can badge it. |

### Doc hygiene

`AGENTS.md` was refreshed May 2026 (documentation map, route overview, API sketch, pitfalls). Remaining work lives in **`BACKLOG.md` Phase 2** — do not revive the collapsed historical list inside `AGENTS.md`.

---

## Phase 2 — Next execution queue

Ranked for pick-up order. Each group is ordered high › low value.

### Frontend-ready now (no backend blocker)

1. ~~**🟡 Sidebar `/bulk-order` link**~~ — **`/bulk-order`** now **redirects** to **`/cart`** (locale-prefixed). CSV import remains on `CartContent` (`CsvImportButton`).
2. ~~**🟡 Checkout — ISO country + region picker**~~ — **Shipped:** `CountryRegionFields` + Magento directory on **checkout address** and **address book**.
3. ~~**🟡 Checkout — payment method selection**~~ — **Shipped:** radio group on **`/checkout/review`**; `placeOrderAction` passes the selected Magento method code.
4. **🟡 Account — profile phone** — `/account/profile` updates name / email / password via `PUT /api/account/profile`. Optional **phone** field uses customer **`custom_attributes`** (`contact_phone` by default; override with `MAGENTO_CUSTOMER_PHONE_ATTRIBUTE`) — create the attribute in Magento if missing.
5. ~~**🟡 Password reset flow**~~ — **Shipped:** `/account/forgot-password`, `/account/reset-password`, `/api/auth/password/*`.
6. **🟡 Faceted search on products listing** — **partial today:** URL filters for category + price band (`ProductsFilterBar`). Next step: Magento **`aggregations`** or richer attributes — reuse the `/catalog` accordion sidebar pattern where applicable.
7. **🟡 PDP / listing automatic imagery** — placeholder fallback when `media_gallery_entries` empty; optional manufacturer logo injection when Magento exposes logo URLs (pure frontend + asset pipeline).
8. ~~**🟡 Guest price suppression UI**~~ — **Shipped:** `CustomerSessionProvider` + `useCustomerSession()`; `ProductPrice`, `ProductCard`, `AddToCartCluster`, `SearchSuggestionRow`, `CopilotProductWidget`, and PDP bulk pricing (server-gated) hide catalog EUR amounts until sign-in. **Cart/checkout** line prices for guests unchanged. **Follow-up:** Magento catalog permissions / shared catalogs so anonymous REST consumers do not receive list prices.

**Already landed (was overstated as TODO):** PDP + `ProductCard` **stock badges** (`StockBadge` + `getStockStatus`); **cart CSV import** (`src/components/cart/CsvImportButton.tsx`); **order reorder** (`ReorderButton` on order detail).

### Blocked on backend (Magento / ERP / PIM work required first)

Listed with the exact backend contract each item needs.

10. **🔴 Accept quotation › cart** — storefront **`acceptQuotation`** + list/detail **`GET /rest/V1/swr-quotations/mine`** are wired; **PDF** › **`GET .../mine/:id/pdf`** (proxied **`/api/account/quotations/[id]/pdf`**). Still blocked until Magento implements **`swr-quotations`** (empty list / 404 today).
11. **🔴 Registration approval dashboard / sub-users / roles** — needs Magento B2B company module (or custom extension) to model company › admin › sub-user and permissions. Front office staff dashboard may also live in Magento admin unless we build a thin Next.js ops UI.
12. **🔴 Customer-specific net pricing + hide prices for guests** — **Partial:** storefront hides catalog UI prices when `swr_customer_token` is absent. **Still blocked** on Magento: customer-specific net pricing, catalog permissions / shared catalogs, and **customer-scoped or guest-safe product REST** so payloads are not leaked via admin-token fetches or browser tools.
13. **🔴 Multidimensional variant display on PDP** — needs configurable products in Magento (`configurable_options`). Frontend renders variant selectors / matrix (McMaster-style) that update child SKU/price/stock.
14. **🟡 Partial delivery indicator / replacement-product notice** — need custom product attributes from the ERP/PIM (e.g. `partial_delivery_allowed`, `replacement_sku`). Frontend renders badge/banner when present.
15. **🟡 Customer-specific assortments** — needs Magento customer-group / shared-catalog config. Frontend sends the customer token.
16. **🟡 Customer product lists & order templates** — wishlist or custom endpoint (`POST /V1/wishlists` or equivalent).
17. **🟡 Returns / RMA** — **in-repo:** return/repair/inspection case UI + hub + pick + `submitServiceCase`. **Upload:** when Magento exposes **`POST /rest/V1/swr-service-case/attachments`** (configurable path), the server action forwards files via `uploadServiceCaseAttachments` and stores returned ids on attachment metadata; otherwise filenames only. **Still need:** Magento RMA / ERP return number, credit workflow, optional **`/account/returns`** alias.
18. **🟡 Swiss VAT / multi-store** — needs a CH store view (and optional CH legal entity) in Magento. Frontend consumes Magento totals as-is.
19. **🟡 Newsletter sign-up widget** — needs chosen ESP (e.g. Resend) + consent storage / Magento newsletter endpoint.
20. **🟡 Offers / promotions on products** — needs a Magento `promotion` / `offer` product attribute so the `/offers` page can surface a real product rail instead of CMS copy only.

### Later / optional (FRD grey or ⚪ low)

- Two-factor authentication UI (needs Magento 2FA module).
- Cost-centre assignment per line item, budget management, approval workflows (needs Magento B2B Requisition / custom workflow engine).
- Minimum order value enforcement (frontend button gate is trivial once backend rule exists).
- OCI / SAP Ariba / Coupa punchout, **OSD**, IDS-Connect / PinnCalc deep links — adapter layer owned by ERP/eProcurement; storefront landing hooks only.
- Scandit barcode scanning — likely deferred (cost); alternatives TBD.
- **AI copilot** + **chat add-to-cart** — **UI + `/api/copilot/*` routes in repo**; requires upstream assistant / proxy env configuration. Product widget + cart intents are wired; coverage still evolving.
- Image recognition / spare-parts finder / AI enrichment — needs AI + asset pipelines.
- Error-tolerant / fuzzy search, **synonym database**, **SPARQUE** — ⏸️ **Out of scope near term** (Magento REST search remains baseline unless backend project spins up).
- Heavy analytics / BI / cart-abandonment / Power BI — ⏸️ **Out of scope near term** unless product rescopes.
- Maintenance mode banner (env flag + middleware gate).
- Multi-tenant (DE / CH) legal-entity switcher beyond today’s currency+i18n presentation.
- Live job postings board on `/careers` (today a static CMS page).

---

## 1. User Registration & Authentication

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Customer login (username + password) | ✅ | 🔴 | Live at `/account/login`; token cookie is httpOnly. |
| Customer logout | ✅ | 🔴 | `LogoutButton` + `/api/auth/logout` clears the cookie. |
| Session-aware header / nav (show name, account link) | ✅ | 🔴 | `Header.tsx` and `MobileNav.tsx` read the customer session server-side. |
| Protected routes (`/account`, `/orders`, `/checkout`) | ✅ | 🔴 | Server-side cookie gate on all protected routes. |
| New user registration form | ✅ | 🔴 | `/account/register` + `/api/auth/register` › `POST /V1/customers`. |
| "Pending approval" state shown to new registrants | ✅ | 🔴 | Success state informs the user that SWR will approve the account. |
| Password reset flow (request + confirm) | ✅ | 🟡 | `/account/forgot-password`, `/account/reset-password`, `/api/auth/password/*`. |
| Two-factor authentication UI | ❌ | ⚪ | Requires Magento 2FA module. |

---

## 2. Account & User Management

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Account overview page (`/account`) | ✅ | — | Dashboard with tiles for orders, quotations, addresses, fleet, logout. |
| Edit profile (name, email, password change) | ✅ | 🟡 | `/account/profile` + `PUT /api/account/profile`. Optional **phone** via `custom_attributes` when Magento attribute exists (see Phase 2 #4). |
| Address book (list, add, edit, delete) | ✅ | — | `/account/addresses` + `AddressForm`. Country / region pickers still TODO (see checkout queue). |
| Sub-user management (create sub-users under same customer number) | ⛔ | ⚪ | Requires Magento B2B company module. |
| Role / permission display for sub-users | ⛔ | ⚪ | Depends on backend role model. |
| Configurable email-notification preferences | ❌ | ⚪ | Settings toggle › customer custom attributes. |
| My Fleet (`/account/fleet`) | ✅ | — | Pluggable `FleetRepository`. `NEXT_PUBLIC_FLEET_DEMO=1` enables a **13-machine** demo seed with `specs[]`, warranty counters, and maintenance log; production stays empty until real data lands. |

---

## 3. Orders & Order History

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Order history list (`/orders`) | ✅ | — | Protected list with localized status labels. |
| Order detail view | ✅ | — | Items + totals + billing + shipping + payment. |
| Order status display (processing, shipped, etc.) | ✅ | — | Mapped through `resolveOrderStatus` in `src/lib/orderStatus.ts`. |
| Per-order customer reference field | ✅ | — | PO number captured on cart + `/checkout/review`, forwarded as `paymentMethod.po_number`. |
| Reorder (add previous order items to cart) | ✅ | — | `ReorderButton` on order detail › `POST /api/cart/items` (skips configurables/bundle children per helper). |
| Downloadable order documents (invoice / shipment / credit memo PDFs) | ✅ | — | Streamed via `/api/orders/[id]/{invoices,shipments,creditmemos}/:docId/pdf`; ownership-gated. |
| Downloadable order confirmation PDF | ✅ | — | `/api/orders/[id]/confirmation` (react-pdf). |
| ERP-specific order status labels | ✅ | — | `resolveOrderStatus` reads `extension_attributes.erp_status_code` / `erp_status_label`. DE/EN/FR strings seeded. |
| Quotation list / detail (`/account/quotations`) | 🔄 | 🟡 | Calls **`GET /rest/V1/swr-quotations/mine`** (+ detail by id). Empty until Magento module exists. **PDF:** `GET .../mine/:id/pdf` via `/api/account/quotations/[id]/pdf`. |
| Accept quotation › cart | 🔄 | 🟡 | **`POST .../mine/:id/accept`** wired in `acceptQuotation`; needs live backend. |

---

## 4. Product Catalog & Detail

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Product listing page (paginated) | ✅ | — | Live from Magento REST API. |
| Product detail page (PDP) | ✅ | — | Gallery, specs, price, add-to-cart, live quantity-based price preview. |
| Category listing | ✅ | — | Filtered by category, paginated. |
| Tiered / bulk pricing (`tier_prices`, qty breaks) | ✅ | — | PDP table + `AddToCartCluster` live preview; hidden when Magento sends no tiers. |
| Stock availability indicator | ✅ | — | PDP gallery overlay + `ProductCard` badge via `getStockStatus` / `StockBadge`. |
| **B2B customer-specific net pricing & hide prices for guests** | 🔄 | 🔴 | **Partial:** storefront gates catalog prices for guests (`CustomerSessionProvider`, `ProductPrice`, cards, search, copilot, PDP bulk block). Customer-specific net pricing + **API-level** hiding for guests still requires Magento catalog visibility / shared catalogs / scoped product reads. |
| Multidimensional variant display (size, colour, thread, etc.) | ⛔ | 🔴 | Needs configurable products + PDP matrix UX in Magento. |
| Partial delivery capability indicator | ⛔ | 🟡 | Needs agreed ERP attributes surfaced on product/order in Magento. |
| Replacement / successor product notice | ⛔ | 🟡 | Needs a `replacement_sku` custom attribute. |
| Customer-specific assortments | ⛔ | 🟡 | Needs backend filtering by customer group / shared catalogs. |
| Customer product lists (saved lists / favourites) | ⛔ | 🟡 | Needs wishlist or custom endpoint; frontend shows a "Save to list" button and `/account/lists`. |
| Order templates (saved carts) | ⛔ | 🟡 | Needs custom Magento endpoint or wishlist variant. |
| CSV import into cart | ✅ | — | `CsvImportButton` on cart (`sku,qty`); bulk `POST /api/cart/items`. |
| Barcode scanning (Scandit) | ⏸️ | ⚪ | Deferred / costly — alternatives TBD. |
| AI Copilot / chat-based product consultation + cart-from-chat | 🔄 | ⚪ | **Partial:** dock + panel + product widget + Teia proxy routes in repo; maturity / upstream contract TBD. |
| Image-based product recognition | ⛔ | ⚪ | Needs AI backend. |
| AI cross-selling recommendations | ⛔ | ⚪ | Needs ERP purchase-history index. |
| AI spare parts identification | ⛔ | ⚪ | Needs AI + machine/serial-number data. |

---

## 5. Search

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Basic keyword search | ✅ | — | `SearchBar` pushes `?q=` to `/products`. |
| Price display in search results | ✅ | — | `ProductCard` (guests see sign-in CTA until session, not EUR amounts). |
| Add-to-cart from search results | ✅ | — | Inline button on every card. |
| Stock availability in search results | ✅ | — | Same `ProductCard` / `StockBadge` path as category listing. |
| Advanced filters (faceted search) on products | 🔄 | 🟡 | **Partial:** `ProductsFilterBar` (category + price band URL params). Full attribute facets / `aggregations` parity with `/catalog` still open. |
| Error-tolerant / fuzzy search | ⛔ | 🟡 | Backend search engine tuning (Elasticsearch / third-party). |
| Synonym / replacement product logic in search | ⏸️ | 🟡 | **Near-term out of scope** — would need dedicated synonym infra + ERP discontinue relationships. |
| SPARQUE / “intelligent” site search | ⏸️ | 🟡 | **Not integrated** — no Sparque references in repo; baseline remains Magento REST search/filter. |

---

## 6. Cart & Checkout

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Cart page (line items, qty update, remove, undo) | ✅ | — | `CartContent.tsx`. |
| Cart totals from Magento (subtotal, tax, grand total) | ✅ | — | `CartProvider` exposes `totals`; cart sidebar reads Magento numbers directly. |
| Inline add-to-cart on product cards | ✅ | — | Home, listing, category, search. |
| Cart item images persist across refresh | ✅ | — | Cart API enriches items with product image URLs. |
| Place order (checkout) | ✅ | — | Signed-in 3-step flow `/checkout/{address,shipping,review}` › `PUT /V1/carts/:id/order`. |
| Billing / shipping address collection | ✅ | — | Step 1 lists saved addresses + inline new-address form. |
| Order confirmation page | ✅ | — | `/orders/:id` is reused as post-checkout landing page + confirmation PDF. |
| Customer order reference / PO number field | ✅ | — | Optional PO input on `/checkout/review`. |
| Shipping method selection | ✅ | — | Real Magento methods via `estimate-shipping-methods` + `shipping-information`. |
| Multi-payment selection at checkout | ✅ | 🟡 | Review step radio group; chosen code passed to `placeCustomerOrder`. |
| Address validation / region picker on checkout | ✅ | 🟡 | `CountryRegionFields` + directory data on step 1. |
| Cost-centre assignment per line item | ⛔ | ⚪ | Needs Magento B2B / custom extension. |
| Budget management / spend limits | ⛔ | ⚪ | Needs backend budget module. |
| Order approval workflow (supervisor review) | ⛔ | ⚪ | Needs Magento B2B Requisition Lists or custom workflow. |
| Minimum order value enforcement | ❌ | ⚪ | Read `totals.grand_total`, disable CTA below threshold. Needs threshold definition (config or custom attr). |

---

## 7. Returns & Claims

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Return / service case (unified) | 🔄 | 🟡 | **UI:** `/account/service/*`. **Persistence:** demo store / in-memory; optional **`uploadServiceCaseAttachments`** when Magento upload REST exists. Optional **`/account/returns`** alias still open. |
| Photo upload for returns | 🔄 | 🟡 | **UI accepts files**; **`POST /api/account/service/attachments`** proxies the same contract when enabled; server action also forwards multipart to Magento when the endpoint responds. |
| Return status (RMA list) | ⛔ | 🟡 | Needs Magento RMA / ERP-backed case feed (today: demo cases only). |
| Repair request (selection-first) | 🔄 | ⚪ | **`/account/service/pick?kind=repair|inspection`** (fleet grid, past orders, not-listed › `manual=1`); bare `.../new?kind=repair` redirects to pick. `NewCaseForm` with order lines + `machineId` / `orderId`. Marketing: `RepairIntakePanel` on `/services/repair`. Server `submitServiceCase` is demo. ERP/RMA when backend exists. |
| Selection-first repair (FRD / plan AC) | 🔄 | — | Core UX shipped; see [Phase 6 plan](.cursor/plans/phase_6_plan_returns,_repair,_and_machine_workflows_2a9c3629.plan.md). Remainder: RMA, durable uploads, ERP. |

---

## 8. Internationalisation & Currency

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Three locales (de, en, fr) | ✅ | — | next-intl, all three message files present. |
| Locale switcher in header | ✅ | — | `LocaleSwitcher`. |
| EUR / CHF currency switcher | ✅ | — | `CurrencyProvider` + `CurrencySwitcher`, cookie-persisted. |
| Currency conversion (EUR › CHF) | ✅ | — | `src/lib/currency.ts`. |
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

Near-term **product analytics / BI exports** are treated as **out of scope** unless rescoped — instrumentation hooks remain future work.

| Feature | Status | Priority | Notes |
|---|---|---|---|
| Search query tracking | ❌ | 🟡 | Event on `?q=` change — deferred with broader analytics initiative. |
| Cart abandonment tracking | ❌ | 🟡 | Deferred. |
| Page view / product view events | ❌ | ⚪ | Deferred. |
| Newsletter sign-up widget | ⛔ | ⚪ | Needs ESP choice / Magento newsletter endpoint. |

---

## 12. eProcurement Interfaces (Frontend Touch Points)

| Feature | Status | Priority | Notes |
|---|---|---|---|
| OCI punchout (basket transfer to customer ERP) | ⛔ | ⚪ | Needs OCI session start URL + payload format. |
| SAP Ariba / Coupa punchout | ⛔ | ⚪ | Similar to OCI; different cXML. |
| OSD interface | ⛔ | ⚪ | Procurement adapter — specify protocol with ERP team (often punchout/cXML family). |
| IDS-Connect / PinnCalc deep links | ⛔ | ⚪ | Parse URL params on landing. |

---

## Out of Scope for Frontend

These items from the FRD require ERP, PIM, hosting, or backend infrastructure work and have no direct frontend implementation:

- **Integration Hub / middleware** — ERP ↔ Magento synchronisation of stock, prices, orders, documents.
- **PIM integration** (nextPIM, EDE product ranges) — data ingestion pipeline.
- **Automated order transfer to ERP** — backend/middleware process.
- **Real-time external warehouse stock** (elc logistics) — Magento extension or middleware; frontend just reads whatever stock value Magento exposes.
- **Customer-specific net pricing & REST-level hiding for guests** — Magento shared catalogs / catalog permissions / customer groups must constrain what anonymous product APIs return. The storefront **already** hides catalog EUR in the UI for guests (`CustomerSessionProvider`, `ProductPrice`, cards, search, copilot); **true** confidentiality still needs backend-scoped reads (and avoiding admin-token leaks in browser tooling). **Distinct** from Magento **`tier_prices`** (qty-break tiers — already on PDP).
- **ISO 27001 hosting & GDPR-compliant infrastructure** — hosting/ops concern.
- **Multi-tenancy architecture** — Magento multi-store setup; frontend adapts via store-view switching.
- **Data enrichment / PIM quality tools** — automated category assignment, text generation, attribute mapping.
- **Serial number management & machine history** — ERP/backend data model (frontend surface exists via `/account/fleet`, but real data feed is backend).
- **Scandit SDK licensing and backend barcode catalogue** — SDK integration is frontend work; the catalogue is backend.
- **AI model training / ERP purchase history index** — backend AI pipeline.
- **SPARQUE search engine** — not present in storefront; Magento REST remains baseline unless backend provisions Sparque and a proxy API.
- **Budget management backend logic** — approval workflow engine, spend tracking.
- **Configurable return policies per customer** — Magento RMA configuration.
- **Newsletter platform / ESP** — third-party service; frontend only adds a sign-up widget.
- **Power BI API access** — direct data warehouse / BI tooling.
- **Exportable analytics reports** — backend reporting engine.
