# SWR Frontend — Project Status

_Last updated: May 2026 (9 May) — copilot surface documented; `/bulk-order` redirects to cart; quotations REST + PDF proxy wired to `swr-quotations` contract; checkout/account backlog reconciled with code (payment picker, ISO address pickers, profile, password reset already shipped)._

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

- **Documentation alignment** — `BACKLOG.md`, `FEATURES.md`, `AGENTS.md`, and `STATUS.md` reconciled with codebase facts: Magento **`tier_prices`** = qty-break bulk table (✅); stakeholder **B2B net price / hide-until-login** = **catalog UI hides prices for guests** (✅); **true** payload hiding for anonymous API consumers still needs Magento catalog permissions / shared catalogs; **SPARQUE** not in repo (search/filter via Magento REST); stock badges ✅ on PDP + `ProductCard`; cart **CSV import** ✅; **reorder** ✅; **service-case attachments** — optional `POST /rest/V1/swr-service-case/attachments` forward when implemented (see `src/lib/service-attachment-upload.ts`); otherwise filenames/metadata only; **`/bulk-order`** → locale **`/cart`** redirect page.
- **Guest catalog prices** — `CustomerSessionProvider` (server reads `swr_customer_token`) feeds `useCustomerSession()`; [`ProductPrice`](src/components/ProductPrice.tsx), [`ProductCard`](src/components/ProductCard.tsx), [`AddToCartCluster`](src/components/ui/AddToCartCluster.tsx), [`SearchSuggestionRow`](src/components/ui/SearchSuggestionRow.tsx), [`CopilotProductWidget`](src/components/copilot/CopilotProductWidget.tsx), and PDP bulk table (server-gated) hide numeric catalog prices until sign-in. Cart/checkout line prices unchanged for guests. Admin-token Magento product payloads still include `price` in network responses until Magento constrains them.

- **Account service & repair (selection-first intake)** — `/account/service/pick?kind=repair|inspection` is the dedicated “choose equipment” step: grid of fleet machines (warranty badges), “from a past order” → `/orders`, or “not listed” → case form with `manual=1`. Bare `/account/service/new?kind=repair|inspection` redirects to pick unless `machineId`, `orderId`, or `manual=1` is present. `NewCaseForm` supports order-line quantities for repair/inspection (mirrors returns), reorders sections (order lines first for repair/inspection), and server validation when an order has lines. Order detail has CTA “Request repair (order lines)”. Marketing `/services/repair` uses `RepairIntakePanel` (signed-in: fleet + pick + service hub; guest: mailto form). **My Fleet** demo seed expanded to **13 machines** (welders, grinders, drills, bench drill, compressor, pneumatic, caliper) with `specs[]` on `Machine` and a technical **SpecTable** on `/account/fleet/[id]`; `NEXT_PUBLIC_FLEET_DEMO=1` enables the seed. **intl:** attachment “many files” label uses a `COUNT` token (not `{count}`) to avoid `FORMATTING_ERROR` with `next-intl`.
- **Catalog filter redesign** — multi-select facets are now actually usable. `CatalogFilters` moved from scalar fields (`brand`, `type`, `category`, `language`) to arrays (`brands`, `types`, `categories`, `languages`) and the URL uses comma-separated values (`/catalog?brand=Bosch,Makita&type=datasheet,manual`). `FilterSidebar` is now a client accordion (one section open at a time, with a per-section active count badge, and a search-within-filter input on the Manufacturer section), toggles push through a `useTransition`-wrapped `router.push`, and optimistic local selection + a ref protect against rapid-click races. `buildFacets` computes each dimension against a set that ignores that dimension's own filter, so picking "Bosch" no longer erases every other brand from the list. A new `ActiveFilters` strip above the results grid shows one `<Link>`-based chip per applied value (crawlable + removable) plus the total result count. New i18n keys under `catalog.filters`: `title`, `subtitle`, `activeFilters`, `manufacturerSearch`, `resultsShowing` (ICU plural) in DE/EN/FR.
- **Catalog video player** (`/catalog/[id]` for `type: "video"`): `CatalogDocument` gained optional `videoUrl`, `videoProvider` (`"youtube" | "file"`), `posterUrl`, and `duration` without disturbing existing PDF entries. New `src/components/catalog/VideoViewer.tsx` shares the PDF toolbar shell and branches three ways: (1) YouTube URLs (`youtu.be`, `/watch`, `/embed`, `/shorts`, `/live`) are parsed to an 11-char id and embedded through `youtube-nocookie.com` in a 16:9 frame with strict `referrerPolicy` and a minimal `allow` list; (2) same-origin file videos (`mp4` / `webm` / `ogg` / `mov` / `m4v`) render with native `<video controls>` + optional poster; (3) anything else falls back to an external "Open video" card. The catalog detail page branches on `doc.type === "video"` before mounting `PdfViewer`. New `catalog.viewer` keys in DE/EN/FR: `watchOnYoutube`, `videoNotice`, `unsupportedVideo`, `unsupportedVideoCta`. Seed data: `fronius-arc-tig-vid` and a new `swr-workshop-tour` entry both point at a real YouTube URL for manual testing.
- **Local demo PDFs** for the viewer: committed four tiny same-origin sample PDFs under `public/catalog-pdfs/` (`swr-iso9001.pdf`, `swr-aeo.pdf`, `swr-din3834.pdf`, `swr-eur1.pdf`) matching the SWR-branded certificate entries in `src/data/catalog.json`, so the iframe PDF viewer has real content to render out of the box (cross-origin vendor PDFs still fall through to the "open on manufacturer's site" card, by design).
- **Document Catalog** (`/catalog`, `/catalog/[id]`): brand catalogs, price lists, datasheets, manuals, certificates, SDS and technical info live in a dedicated browsing surface with multi-select sidebar facets (category / type / brand / language), free-text search, an `<iframe>`-based PDF viewer for documents, and an embedded YouTube / HTML5 video player for video entries. Backed by `src/lib/catalog.ts` — a `CatalogRepository` interface with a `jsonRepository` implementation reading `src/data/catalog.json` (~60 real public-URL brand catalogs across Aircraft, Bosch, Fronius, EWM, Lorch and more). Repository is intentionally swappable for a future custom Magento DocumentEntity module or an EDE / nextPIM document feed.
- **Homepage redesign** — original SWR-specific direction, not a copy of swr-loerrach.de. Question-led hero, four operational reality numbers, four intent tiles ("buy supplies", "fix a machine", "get advice", "find a document"), a real-PDF catalog preview rail, reframed services + industries copy, named-person block ("real people answer the phone in Lörrach"), and a workshop contact block. Five new marketing primitives (`IntentTile`, `RealityStrip`, `PersonCard`, `CatalogPreviewRail`, `WorkshopBlock`) added to `src/components/marketing/`.
- **Industrial Service & Repair Portal** (`/services/repair`): six service categories grid, four-step `RepairTimeline`, and `RepairIntakePanel` (signed-in CTAs to fleet + equipment pick + service hub; guests get `RepairRequestForm` mailto). Backend case transport still in-process / demo (`submitServiceCase`).
- **Swiss Delivery Center** (`/services/customs`): dedicated cross-border hub with AEO/transit/currency/team facts strip, five-zone shipping `SpecTable`, five-row duty/VAT `SpecTable`, six-item "what we file for you" checklist, four compliance-document tiles linking into `/catalog?type={certificate,datasheet,sds,performance}`, and a cross-link block to `/services/delivery`.
- **Welding Technology Hub** (`/industries/welding`): static override of the dynamic industry route. Six-process sub-category tiles (MIG, TIG, MMA, plasma, spot, consumables), live `FeaturedProductsRail` from the Magento welding category, six-row gas selection `SpecTable` with safety callout, four technical-guide tiles linking into `/catalog?category=welding&type=…`, a `CatalogPreviewRail` of real welding PDFs, and a service & installation block.
- **My Fleet** (`/account/fleet`, `/account/fleet/[id]`): protected machine-fleet workspace. `src/lib/fleet.ts` — `FleetRepository` with `demoRepository` (**13** demo machines when `NEXT_PUBLIC_FLEET_DEMO=1`), optional `specs[]` on each machine, empty repository otherwise. Fleet list shows warranty split counters (active / expiring ≤90 d / expired). Detail page: key facts grid, **technical specifications** table, maintenance log, quick actions to repair/inspection (with `machineId` → skips pick). Account dashboard + footer link to fleet.
- Full-site rebuild replacing the legacy WordPress marketing site (`swr-loerrach.de`) and the previous shop (`shop.swr-loerrach.de`) with a single Next.js app. Marketing surface: `/about`, `/contact`, `/services` (hub + `consulting`, `repair`, `delivery`, `customs`), `/industries` (hub + `welding`, `tools`, `power-tools`, `machines`, `facility-equipment`, `workshop-supplies`, `occupational-safety`), `/partners`, `/careers`, `/certificates`, `/offers`, `/legal/{imprint,terms,privacy,compliance,sds}`, and `/catalog`. Restructured Header with Shop / Catalog / Services / Industries / About / Contact primary nav + "Book a consultation" CTA, `Footer` component with sitemap / legal / contact / fleet, and refreshed `MobileNav`.
- CMS plumbing: `magentoGet` now accepts an optional `storeCode`, `src/lib/cms.ts` fetches `cmsPage` / `cmsBlock` by identifier per locale, `CmsContent` sanitizes HTML via `sanitize-html` (Node-safe; avoids jsdom on Vercel), and pages fall back gracefully to i18n copy when CMS content is missing. New marketing primitives in `src/components/marketing/` (`Hero`, `IndustryHero`, `Cta`, `FeatureGrid`, `ServiceCard`, `TrustStrip`, `BrandLogoStrip`, `ContactCard`, `FeaturedProductsRail`, `ServicePillarPage`, `CertificateCard`) power every new page.
- SEO migration: `src/proxy.ts` issues 301 redirects for all legacy WordPress URLs (`/ueber-uns`, `/kontakt`, `/impressum`, `/datenschutzerklaerung`, `/agb`, `/beratung`, `/service`, `/lieferungen`, `/zollabwicklung`, German industry slugs, `/partner`, `/stellenangebote`, `/ausbildung`, `/zertifikate`, `/angebote`, `/katalog`) and for the old in-app legal paths (`/terms`, `/privacy`, `/compliance`, `/sds`, `/iso`). New root `sitemap.ts` / `robots.ts` surface every locale of the static tree, every industry page, all Magento categories, and a capped product list with hreflang alternates. Root layout metadata now sets `metadataBase`, canonical URL, per-locale language alternates (`x-default` + three locales), and Open Graph / Twitter defaults.
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
| **Quotations** `/account/quotations` + `/account/quotations/[id]` | List + detail call Magento **`GET /rest/V1/swr-quotations/mine`** (+ per-id detail); **download PDF** → `/api/account/quotations/[id]/pdf` → **`GET .../mine/:id/pdf`**; **accept** → `POST .../accept`. Empty state when module not deployed |
| **Bulk order** `/bulk-order` | Redirects to **`/cart`** (CSV import on cart) |
| **Legal/info pages**                    | `/legal/{imprint,terms,privacy,compliance,sds}` — Magento CMS-backed with i18n fallback, legacy paths 301-redirected |
| **Marketing hubs**                      | `/about`, `/contact`, `/services`, `/industries`, `/partners`, `/careers`, `/certificates`, `/offers` — Magento CMS-backed with i18n fallback |
| **Catalog** `/catalog` + `/catalog/[id]` | Document catalog with multi-select category / type / brand / language facets (accordion sidebar + active-filters chips + manufacturer search), free-text search, `<iframe>` PDF viewer for documents and a YouTube / HTML5 `VideoViewer` for video entries; backed by swappable `CatalogRepository` (JSON impl with ~60 real PDFs + demo video entries today) |
| **Service pillars** `/services/{consulting,repair,delivery,customs}` | CMS-backed rich content + CTAs + consultation link. `/services/repair` — categories, timeline, `RepairIntakePanel` (account paths to pick + fleet + mailto guest). `/services/customs` — Swiss Delivery Center (zones, duty, checklist, catalog deep links) |
| **Industry hubs** `/industries/[slug]`  | 7 slugs, CMS-backed, dynamically linked to Magento categories via `findCategoryByName`, `FeaturedProductsRail` from live catalog. `/industries/welding` is a static override with sub-category tiles, gas-safety SpecTable, technical-guide deep links, welding-catalog rail, and a service & installation block |
| **My Fleet** `/account/fleet` + `/account/fleet/[id]` | Machine fleet with warranty counters, 13-machine demo when `NEXT_PUBLIC_FLEET_DEMO=1`, detail page specs table + maintenance log + repair/inspection CTAs |
| **Service cases** `/account/service` + `/account/service/new` + `/account/service/pick` + `/account/service/[id]` | Unified returns / repair / inspection: pick page, `NewCaseForm` + `submitServiceCase` (in-memory demo cases when demo flag on), order-linked and fleet-linked context; optional **`POST /api/account/service/attachments`** → Magento **`swr-service-case`** upload contract when configured |

### Partial / still evolving

| Area / Page                            | What's still missing                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Registration / auth**                | Admin-side approval dashboard, sub-users, roles/permissions, 2FA, customer import/delete workflows (self-serve **forgot** + **reset password** + **profile / in-account password change** are live).   |
| **Quotations**                         | `listCustomerQuotations` / `getQuotationForCustomer` call **`GET /rest/V1/swr-quotations/mine`** when deployed; **PDF** via **`GET .../mine/:id/pdf`** proxied at `/api/account/quotations/[id]/pdf`. Empty state persists until Magento exposes the module. **Accept → cart** wired to **`POST .../accept`** (needs backend). |
| **Cart / checkout**                    | **Payment method** radio group on review + `placeOrderAction` pass-through; **checkout address** uses `CountryRegionFields` + Magento directory. Still open: cost-center assignment, approval workflow (PO reference ✅; multi-step checkout ✅). |
| **Product discovery**                  | Search/filter uses **Magento REST** (not SPARQUE). URL filters on `/products` for category + price band — richer facets/`aggregations` still optional work |
| **Product detail** `/products/[sku]`  | Cert badges / trust copy are still static marketing copy; **configurable / McMaster-style variant matrix** not built; **guest catalog price UI** = hidden until login (`CustomerSessionProvider` + `ProductPrice` / `AddToCartCluster`); **Magento REST still returns prices** to the app for guests until catalog permissions / shared catalogs gate payloads. |
| **Nav / demo hygiene**                 | **`/bulk-order`** redirects to **`/cart`** (CSV import on cart). Sidebar may still label “bulk order” — link target is valid. |

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
| Multi-payment selection at checkout                         | ✅ Done (Magento methods from shipping-information) |
| Address validation / region picker                          | ✅ Done (directory-backed country + region on checkout + address book) |
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
| Quotations list + detail (`GET /rest/V1/swr-quotations/mine`) | 🔄 Wired — empty until Magento module |
| Accept quotation → cart (`POST .../accept`) | 🔄 Wired — needs live backend |
| Sub-users / role model / approval workflows          | ❌ Not done |

---

## Immediate Next Steps

Priority order for the next frontend work:

### 1. Registration approval workflow / customer governance

Current registration UI exists, but the business workflow from the requirements doc is still incomplete. Next work should define how SWR staff approve new accounts, and whether Magento alone is enough or an admin-facing dashboard is needed.

### 2. ERP-specific order workflows

Per-document PDFs and ERP status overrides are live. **Quotations:** `src/lib/quotations.ts` implements **list**, **detail**, **accept**, and **PDF proxy** (`/api/account/quotations/[id]/pdf`) against `swr-quotations` — data remains empty until Magento ships the module.

### 3. Customer-specific account model

Sub-users, company-level admins, permissions, approval chains, and customer-number grouping are still untouched.

### 4. Checkout / procurement metadata

Checkout uses **Magento payment-method radios** on review and **directory-backed** country/region on the address step. Still open: **cost-center** assignment and **approval** workflows before order placement.

### 5. Customer-specific B2B features

Product lists, order templates, customer assortments remain gaps. **CSV import into cart is shipped** (`CsvImportButton` on `/cart`).

### 6. Returns / repair workflows

**Done on the frontend (demo / in-process):** unified **Service** hub, **pick** page, **NewCaseForm**, optional **Magento multipart upload** (`SWR_SERVICE_ATTACHMENT_REST_PATH`) via `uploadServiceCaseAttachments`, in-memory store when demo flag on, **My Fleet**, marketing **RepairIntakePanel**. **Still open:** Magento RMA / ERP return IDs and statuses, production fleet feed (replace `demoRepository`).
