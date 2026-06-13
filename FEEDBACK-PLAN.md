# Stakeholder Feedback — Implementation Plan

_Source: `Feedback Demo Shop_v1.docx` (26 May 2026). Reference site: [swr-loerrach.de](https://www.swr-loerrach.de/)._

This document maps **every** stakeholder point to a concrete frontend action. Items marked **⛔ Backend** need Magento/ERP work before the storefront can finish.

**Status legend:** ❌ Not started · 🔄 Partial today · ✅ Done · ⛔ Blocked on backend · ⏸️ Deferred (awaiting more feedback)

---

## Summary

| Phase | Focus | Items |
|-------|--------|-------|
| **A** | Shop structure & navigation | 11 |
| **B** | Homepage layout & partners | 2 |
| **C** | Content & language | 3 |
| **D** | Copilot / AI experience | 12 |
| **E** | Account & registration | 3 |
| **Positive** | No action — preserve | 4 |
| **Deferred** | After login works end-to-end | 1 |

---

## Positive feedback — preserve, do not regress

These are **not** change requests. Use as acceptance guardrails during refactors.

| # | Feedback | Guardrail |
|---|----------|-----------|
| P1 | Quick loading; fast locale switching | Keep Turbopack dev + avoid blocking client bundles on nav; do not add heavy hover menus without lazy-loading category data |
| P2 | Compact, non-overwhelming layout | Maintain information density per `DESIGN.md`; avoid retail-style hero bloat |
| P3 | Decent mobile experience | Test mega-menu + partner carousel + Copilot on `sm`/`md` breakpoints |
| P4 | Clickable product images in listing | Keep `ProductCard` image wrapped in `Link` to PDP |

---

## Phase A — Shop structure & navigation

### A1 · Shop hover shows product categories (mega-menu) — ✅ Done

**Problem:** Hovering “Shop” should reveal categories like the current shop (icons + list: Schweißtechnik, Werkzeuge, Maschinen, …).

**Current state:** `Header.tsx` primary nav is flat links; `/products` has no hover menu.

**Plan:**
1. Create `ShopMegaMenu.tsx` (client component): hover + keyboard focus, `aria-expanded`, mobile fallback (tap to expand inside `MobileNav`).
2. Server-fetch `getTopLevelCategories()` in `Header.tsx` (or a thin server wrapper) and pass category id, name, optional icon slug to the menu.
3. Each row links to `/categories/{id}` (preferred) or `/products?category={id}`.
4. Add “Alle anzeigen” row linking to `/shop` (new hub — see A3).
5. Add translation keys under `nav.shopMenu.*` in `de.json`, `en.json`, `fr.json`.
6. Map category icons: static SVG map in `src/lib/shop-categories.ts` keyed by Magento category id or normalized name (match swr-loerrach.de icon set).

**Files:** `src/components/Header.tsx`, `src/components/ShopMegaMenu.tsx` (new), `src/components/MobileNav.tsx`, `src/lib/shop-categories.ts` (new), `src/messages/{de,en,fr}.json`

**Acceptance:** Desktop hover on “Shop” shows category list with icons; keyboard navigable; mobile users reach same categories without hover-only trap.

---

### A2 · Clicking “Shop” must not dump 80k+ products — ✅ Done

**Problem:** `/products` with no filter shows “Alle Produkte” — unusable at catalog scale.

**Current state:** `products/page.tsx` defaults to unfiltered `getFilteredProductResults`.

**Plan:**
1. Add route `/shop` (or redirect `/products` root → `/shop`) as the **category hub** (tiled overview — see A3).
2. Change header “Shop” link: top-level click → `/shop`; hover mega-menu → specific categories.
3. Keep `/products` for filtered/search results only; optionally require `?category=`, `?q=`, or facet params — show empty state + link to `/shop` when none present.
4. Update breadcrumbs and internal links (`IntentTile`, CTAs) from `/products` → `/shop` where appropriate.

**Files:** `src/app/[locale]/(chrome)/shop/page.tsx` (new), `src/app/[locale]/(chrome)/products/page.tsx`, `src/components/Header.tsx`, `src/i18n/navigation` consumers, `src/messages/{de,en,fr}.json`

**Acceptance:** Clicking “Shop” never lands on an unbounded full catalog; users always enter via category tiles or a chosen category.

---

### A3 · Tiled category overview (one filtering layer) — ✅ Done

**Problem:** Need a tiled overview like “SWR Sortiment 2026” — first navigation layer before product grid.

**Current state:** `/categories/[id]` shows subcategory chips + grid; no dedicated top-level tile page. Industries grid on homepage is a separate concept.

**Plan:**
1. Build `ShopCategoryHub` page at `/shop`: grid of large tiles (8 main categories) + optional left sidebar list (mirror reference site).
2. Reuse `getTopLevelCategories()`; tile links → `/categories/{id}` or category-scoped `/products?category={id}`.
3. Style per `DESIGN.md`: tonal surfaces, 5px card radius, category icon + label bar (reference: swr-loerrach Sortiment tiles).
4. Sidebar on hub: same category list for text-first navigation.

**Files:** `src/app/[locale]/(chrome)/shop/page.tsx`, `src/components/shop/ShopCategoryGrid.tsx` (new), `src/components/shop/ShopCategorySidebar.tsx` (new), `src/lib/shop-categories.ts`, `src/messages/{de,en,fr}.json` → `shop.*`

**Acceptance:** `/shop` visually matches stakeholder reference; each tile opens the correct category scope.

---

### A4 · More filters + category-specific filter sets — ⛔ Backend-defined

**Problem:** Need richer filters; welding machines need different facets than sprays.

**Current state:** `ProductsFilterBar.tsx` exposes category select, price min/max, and `USER_FACING_FACETS` (manufacturer, brand, country_of_manufacture). Same facets for all categories.

**Plan:**
1. Magento/PIM must define filterable attributes per category and expose them as category-scoped aggregations. Filters are applied **inside** a chosen category, not as a global pre-shop layer.
2. Frontend renders the backend-provided facets for the active category and keeps selections URL-synced.
3. Reuse accordion pattern from `/catalog` filter sidebar once the facet metadata is available.

**Files:** `src/components/products/ProductsFilterBar.tsx`, `src/lib/category-filters.ts` (new), `src/lib/magento.ts`, `BACKLOG.md` (backend contract)

**Dependencies:** ⛔ Magento product attributes + searchable/filterable flags for category-specific facets.

**Acceptance:** At least 2 category families show meaningfully different filter sets; filters sync to URL and work with pagination.

---

### A5 · Remove / integrate “Industries” nav item — ✅ Done

**Problem:** “Industries” menu point should be eliminated once shop navigation covers entry paths.

**Current state:** `Header.tsx` links `/industries`; homepage section 6 renders industries grid; `/industries/[slug]` pages exist.

**Plan:**
1. Remove `industries` from `primaryLinks` in `Header.tsx` and `MobileNav.tsx`.
2. Remove or shrink homepage industries grid (`page.tsx` section 6) — industry use-case copy can move to `/services` or category landing copy.
3. Keep `/industries/*` routes alive with **301 redirects** to relevant `/categories/{id}` or `/shop` tiles (SEO preservation) — add redirects in `next.config.ts` or route-level redirects.
4. Migrate any unique welding override content from `industries/welding/page.tsx` into Schweißtechnik category landing if needed.

**Files:** `src/components/Header.tsx`, `src/components/MobileNav.tsx`, `src/app/[locale]/(chrome)/page.tsx`, `next.config.ts`, `src/app/[locale]/(chrome)/industries/**`

**Acceptance:** No “Industries” in primary nav; old URLs redirect; no dead homepage section.

---

### A6 · Add to cart from product overview (without leaving page) — ✅ Done

**Problem:** Users must open PDP to add quantity to cart.

**Current state:** Add-to-cart (qty controls) is now reserved for **signed-in customers** with a sellable, in-stock price. **Guests / price-on-request** items get an **"Add to watchlist"** action instead — consistent across `ProductCard`, `ProductSearchResultRow`, and the PDP `AddToCartCluster` (mirrors the original swr-loerrach.de "Merkliste" behaviour). Watchlist is a guest-friendly localStorage store (`WatchlistProvider`) with a header indicator + `/watchlist` page.

**Plan:**
1. **Guest cart:** Allow `addItem` for guests (cart already uses guest Magento quote in `CartProvider`) — relax `canAdd` guard; keep price hidden per B2B policy.
2. Add inline **qty stepper** on `ProductCard` and `ProductSearchResultRow` (default 1, min 1, max stock if known).
3. Show compact “Added” feedback without navigation (existing loading/success states).
4. Ensure `FeaturedProductsRail` on homepage inherits same behavior.
5. Out-of-stock: disabled control + `StockBadge` tooltip.

**Files:** `src/components/ProductCard.tsx`, `src/components/ProductSearchResultRow.tsx`, `src/components/CartProvider.tsx`, `src/messages/{de,en,fr}.json` → `products.quickAdd.*`

**Acceptance:** Authenticated and guest users can set qty and add from grid/search rows; no full page navigation required.

---

### A7 · PDP left sidebar purpose unclear — ✅ Done

**Problem:** Stakeholders don’t understand the left “Katalog / Technische Spezifikationen” area on PDP.

**Current state:** PDP left sidebar removed. Category context stays in breadcrumbs, shop hub, and header mega-menu.

**Plan:**
1. **Remove from PDP** — stakeholders didn’t ask for it there; category context belongs in breadcrumbs + mega-menu.
2. If category navigation is still wanted on shop routes, use `SideNav` on `/shop`, `/categories/[id]`, and filtered `/products` — not on PDP.
3. Relabel if retained elsewhere: rename namespace keys e.g. `sidebar.shopCategories` / “Sortiment” to avoid confusion with `/catalog` document hub.
4. Pass `activeCategoryId` from product’s primary category when shown on listing pages.

**Files:** `src/app/[locale]/(chrome)/products/[sku]/page.tsx`, `src/components/ui/SideNav.tsx`, `src/messages/{de,en,fr}.json` → `sidebar.*`

**Acceptance:** PDP has no unexplained left rail; shop browsing pages have clear category navigation if sidebar is kept.

---

### A8 · Move “Recently in the Shop” higher on homepage — ✅ Done

**Problem:** Section is too far down; requires scrolling.

**Current state:** `page.tsx` order: Hero → RealityStrip → Intent tiles → CatalogPreviewRail → Services → Industries → **FeaturedProductsRail** → People → WorkshopBlock.

**Plan:**
1. Move `FeaturedProductsRail` to **position 3 or 4** — directly after Hero or RealityStrip (stakeholder preference: “moved up”, not necessarily #1).
2. Recommended order: Hero → FeaturedProductsRail → RealityStrip → Shop/partner strip → Services → People → WorkshopBlock.
3. Keep section heading `home.featured.heading` (“Recently in the shop”).

**Files:** `src/app/[locale]/(chrome)/page.tsx`

**Acceptance:** Featured products visible on typical laptop viewport without scrolling past multiple sections.

---

### A9 · Replace homepage catalog overview with partner banner — 🔄 Partial today

**Problem:** Replace `CatalogPreviewRail` with main-partners banner like “Unsere Partner” on current shop.

**Current state:** Homepage uses `PartnerLogoCarousel` instead of `CatalogPreviewRail`. Partner logos still fall back to initials until real assets are available.

**Plan:**
1. Create `PartnerLogoCarousel.tsx` for homepage: horizontal logo strip + prev/next controls (reference: swr-loerrach “Unsere Partner”).
2. Replace `CatalogPreviewRail` on homepage with this component.
3. Source partner list from shared config `src/lib/partners.ts` (name, logo URL, link target). Start with curated list from `/partners/page.tsx` `PARTNER_BRANDS`; extend with logo assets.
4. **⛔ Backend (optional):** Magento CMS block or brand attribute for logo URLs — until then, host logos in `public/partners/` or media CDN.
5. Keep document catalog accessible via nav “Katalog” → `/catalog` (not removed from site, only from homepage hero area).

**Files:** `src/app/[locale]/(chrome)/page.tsx`, `src/components/marketing/PartnerLogoCarousel.tsx` (new), `src/lib/partners.ts` (new), `src/app/[locale]/(chrome)/partners/page.tsx`, `src/messages/{de,en,fr}.json` → `home.partners.*`

**Acceptance:** Homepage shows partner carousel in place of catalog cards; catalog hub still reachable from nav.

---

### A10 · Partner logo clicks → supplier catalog & products — ⏸️ Deferred

**Problem:** Clicking a partner logo should open that supplier’s catalog and products.

**Current state:** Partner carousel is intentionally non-clickable for now. Later, each partner should link to that supplier's catalog when a matching catalog exists.

**Plan:**
1. Keep homepage partner logos as static brand tiles until catalog data is approved.
2. Later: add per-partner catalog target only when `/catalog?brand={slug}` is non-empty.
3. Partner carousel and `/partners` page share the same config.

**Files:** `src/lib/partners.ts`, `src/lib/magento.ts`, `src/components/marketing/PartnerLogoCarousel.tsx`, `src/app/[locale]/(chrome)/catalog/page.tsx`

**Dependencies:** ⛔ Brand/manufacturer attribute values in Magento for filter to return results.

**Acceptance:** For now, partner logos do not navigate. Later, each clickable partner must navigate to a non-empty supplier catalog.

---

### A11 · (Implicit from screenshots) Listing UX gaps

**Problem:** Screenshots show placeholder “meow” text, missing product images, English category names in German UI — undermines demo credibility.

**Plan:**
1. **Demo data cleanup:** Replace test copy in Magento or filter display attributes (`brand`, short description) — **⛔ Backend / catalog** for real data; frontend fallback: hide empty/`meow` attributes in `ProductCard`.
2. **Image fallback:** Implement `BACKLOG.md` item — placeholder when `media_gallery_entries` empty (`ProductCard`, `ProductGrid`).
3. **Category labels:** Ensure category names come from Magento store-view labels for active locale (verify `getTopLevelCategories` passes store scope).

**Files:** `src/components/ProductCard.tsx`, `src/lib/magento.ts`, `src/lib/product-display.ts` (extend if exists)

**Acceptance:** No visible “meow” or bare placeholder rows in stakeholder demo paths.

---

## Phase B — Homepage (cross-ref A8, A9, A10)

Covered in **A8**, **A9**, **A10**. Additional homepage note:

- **Intent tiles (4 tiles on homepage)** overlap with Copilot feedback (Phase D). After Copilot promotion work, **remove or demote** homepage `IntentTile` grid — content migrates to Copilot suggested questions.

**Files:** `src/app/[locale]/(chrome)/page.tsx`, `src/components/marketing/IntentTile.tsx`

---

## Phase C — Content & language

### C1 · German copy quality — German is source of truth — ⛔ Stakeholder copy

**Problem:** Most texts too low-level; German especially weak; DE should drive EN/FR translations.

**Plan:**
1. Stakeholders provide approved German source copy. Do not invent the German copy in implementation.
2. After DE sign-off, translate to `en.json` and `fr.json` — not the reverse.
3. Fix hardcoded German strings if discovered; all new implementation strings still go through i18n.

**Files:** `src/messages/de.json` (primary), `src/messages/en.json`, `src/messages/fr.json`, any components with hardcoded locale strings

**Dependencies:** Stakeholder copy approval (non-dev).

**Acceptance:** Native-speaker DE review passed; EN/FR derived from approved DE keys.

---

### C2 · Replace false / incorrect information

**Problem:** Substantial factual errors in marketing copy.

**Plan:**
1. Audit each CMS page (`getCmsPage`) and static namespaces against swr-loerrach.de facts: address, phone, hours, service scope, category names, brand claims.
2. Replace incorrect stats in `RealityStrip` (e.g. partner count, SKU counts) with verified numbers or remove until verified.
3. Remove fabricated service claims (e.g. customs pillar copy exists in messages but wasn’t rendered — ensure only accurate services are shown).
4. CMS pages: update in Magento admin **⛔ Backend** or override with corrected copy in message files until CMS updated.

**Files:** `src/messages/{de,en,fr}.json`, `src/lib/cms.ts`, Magento CMS (backend), `src/app/[locale]/(chrome)/page.tsx`

**Acceptance:** Stakeholder sign-off that no known false claims remain on homepage, about, services, contact.

---

### C3 · i18n process rule (ongoing)

**Plan:** All new strings from Phases A–E go to `de.json` first, then EN/FR. No English placeholders in DE default locale.

---

## Phase D — Copilot / AI experience

### D1 · Replace 4 homepage tiles with one large Copilot area

**Problem:** Move away from 4 intent tiles → one large interactive Copilot surface.

**Plan:**
1. Remove `IntentTile` grid from homepage (or reduce to single Copilot entry — see D2).
2. Add homepage **`CopilotHero`** section: full-width panel with greeting, large input, suggested-question chips (content from current 4 intents: part lookup, repair, Swiss delivery, catalog).
3. Reuse `CopilotProvider` / stream API; opening panel optional — inline chat on homepage for signed-in and guest (subject to cookie fix D5).

**Files:** `src/app/[locale]/(chrome)/page.tsx`, `src/components/copilot/CopilotHero.tsx` (new), `src/components/marketing/IntentTile.tsx` (deprecate), `src/messages/{de,en,fr}.json` → `copilot.home.*`

**Acceptance:** Homepage leads with Copilot, not 4 static tiles; same intents reachable as suggested questions.

---

### D2 · Promote Copilot — not tucked in menu

**Problem:** Copilot should be a promoted feature when it routes users correctly.

**Plan:**
1. Keep header trigger but increase visual weight (size, primary-adjacent placement).
2. Homepage hero Copilot (D1) is primary entry.
3. Optional: floating dock default **open** on first visit (localStorage `copilot-intro-seen`) — tune to avoid annoyance.
4. Remove duplicate “Book consultation” visual competition (D4).

**Files:** `src/components/copilot/CopilotHeaderTrigger.tsx`, `src/components/copilot/CopilotDock.tsx`, `src/components/Header.tsx`, `src/components/copilot/CopilotHero.tsx`

**Acceptance:** Copilot discoverable without opening hamburger or hunting utility icons.

---

### D3 · Convert tile content → recommended questions (clickable chips)

**Problem:** Current 4 tiles should become suggested prompts; keep clickable chatbot options.

**Current state:** `CopilotPanel.tsx` has 3 collapsible suggestions (`suggestion1–3`).

**Plan:**
1. Expand to 4+ chips mapping from old intent tiles + PDP-context suggestions (see screenshot: “Verwandte Artikel”, “Vertragspricing”, “Verbrauchsmaterial für diesen Schweißer”).
2. Context-aware chips: on PDP pass product category/SKU into `CopilotPanel` for dynamic suggestions (`copilot.suggestions.weldingConsumables`, etc.).
3. Chip click → prefills input and sends (existing pattern).

**Files:** `src/components/copilot/CopilotPanel.tsx`, `src/components/copilot/CopilotProvider.tsx`, `src/messages/{de,en,fr}.json` → `copilot.suggestion*`

**Acceptance:** ≥4 global suggestions on homepage; contextual suggestions on PDP; all clickable.

---

### D4 · Demote “Book a consultation”; move Contact to header — ✅ Done

**Problem:** Consultation CTA too prominent; contact belongs in header; don’t push phone over AI.

**Current state:** Green “Book consultation” button in Tier 2 header; Contact only in Tier 3 nav.

**Plan:**
1. Remove or downgrade consultation button to text link in utility bar (or remove entirely from header).
2. Ensure **Contact** stays in primary nav (already present) — optionally move phone number adjacent to Contact in Tier 3 on desktop.
3. Keep `/contact` and workshop CTAs in page body/footer — not competing with Copilot in header.
4. Update `nav` copy if “Beratung vereinbaren” appears elsewhere.

**Files:** `src/components/Header.tsx`, `src/components/MobileNav.tsx`, `src/messages/{de,en,fr}.json`

**Acceptance:** Header visual hierarchy: Search > Copilot > Cart > Account; no large green consultation button.

---

### D5 · Copilot blocked until all cookies accepted — fix consent gating — ✅ Done

**Problem:** Copilot hidden unless `optionalAllowed` (all cookies). Edge: declined cookies → no Copilot; revisit → no banner, still no Copilot.

**Current state:** Copilot renders after any cookie choice (`level !== "needsChoice"`), including essential-only. Cookie copy classifies Copilot as a shop function.

**Plan:**
1. **Reclassify Copilot as essential** for shop function (stakeholder expectation) OR show Copilot with degraded mode under essential-only consent (no analytics cookies).
2. Change gate: render Copilot when `ready && level !== 'needsChoice'` (consent given) regardless of optional/analytics tier — document in cookie policy copy.
3. **Fix banner regression:** If `needsChoice` but banner not shown, audit `CookieConsentProvider` mount + `CookieConsentBanner` z-index + localStorage parse failures on Edge. Ensure `reopenBanner` from footer always works.
4. Update `legal/cookies` page to state Copilot requirement clearly.

**Files:** `src/components/copilot/CopilotDock.tsx`, `src/components/copilot/CopilotHeaderTrigger.tsx`, `src/components/CookieConsentProvider.tsx`, `src/components/CookieConsentBanner.tsx`, `src/lib/cookie-consent.ts`, `src/messages/{de,en,fr}.json` → `cookies.*`

**Acceptance:** Copilot visible after essential-only consent; banner always appears on first visit; Edge retest passes.

---

### D6 · Site requests access to apps/data on device

**Problem:** Browser permission prompt: “Access other apps and services on this device.”

**Plan:**
1. Audit all client APIs: `navigator.serial`, `navigator.usb`, `navigator.bluetooth`, `getDisplayMedia`, protocol handlers, PWA install prompts.
2. Likely sources: Copilot stream, third-party script, or Vercel preview feature — search codebase and `layout.tsx` scripts.
3. Remove unnecessary permission calls; if from upstream Copilot SDK, configure off or lazy-init only on explicit user action.
4. Document finding in PR; retest in Edge + Chrome clean profile.

**Files:** `src/app/[locale]/layout.tsx`, `src/components/copilot/*`, `next.config.ts`, browser DevTools protocol audit

**Acceptance:** No permission prompt on first load of `/de/products` in Edge.

---

### D7 · Product recommendation in chatbot doesn’t work — 🔄 Frontend fallback shipped

**Problem:** Queries like “Geschirrtücher”, “kitchen mops”, “makita” return “Keine passenden Produkte gefunden” while products are visible on page.

**Current state:** Copilot still uses `/api/copilot/chat/stream` (LLM) with widgets parsed from the reply. **New:** when the assistant reply carries **no** product SKUs, `CopilotProvider` now falls back to `GET /api/search/products?q={userText}` and injects the top matches as `CopilotProductWidget` cards (with a localized `fallbackProductsIntro` heading). Applies to both the streaming and REST reply paths; only fires when the LLM returned zero SKUs and there is a real text query (image-only prompts skip it). Reuses the existing guest price-hiding pipeline.

**Plan / remaining:**
1. ✅ **Search fallback wired:** no-SKU reply → catalog search → product cards (`CopilotProvider.fetchFallbackSkus`).
2. Improve search API: normalize DE/EN terms, search `name`, `sku`, `custom_attributes`, category names (`src/app/api/search/products/route.ts`).
3. Pass **page context** (current category, visible SKUs) to copilot API for grounded answers on listing pages.
4. Upstream: tune system prompt to use search tool — **⛔ Backend** if Teia/proxy must expose product search tool.
5. End-to-end demo blocked until the Magento admin-token lockout is cleared (search API currently 503).

**Files:** `src/components/copilot/CopilotProvider.tsx` (fallback), `src/app/api/search/products/route.ts`, `src/components/copilot/CopilotPanel.tsx`, `src/components/copilot/CopilotProductWidget.tsx`, `src/messages/{de,en,fr}.json` → `copilot.fallbackProductsIntro`

**Acceptance:** Stakeholder demo queries return relevant product cards matching visible catalog items (verifiable once Magento auth is restored).

---

### D8 · No image/file upload in chatbot — ✅ Done

**Problem:** Users cannot upload images or files to Copilot (e.g. spare-part photo).

**Plan:**
1. Add circular `+` image button in `CopilotPanel` composer.
2. Limit chooser to `image/*`, one image per message, max 4 MB.
3. Show image preview and remove action before send.
4. Forward `image_base64` / `image_mime_type` with the chat request using the existing Teia image-capable proxy.

**Files:** `src/components/copilot/CopilotPanel.tsx`, `src/app/api/copilot/attachments/route.ts` (new), `src/messages/{de,en,fr}.json`

**Dependencies:** ⛔ Upstream AI vision or service-case attachment endpoint.

**Acceptance:** UI accepts one image, previews/removes it, and sends it to Copilot with the chat message.

---

## Phase E — Login & user account

### E1 · More prominent “My account” icon in header

**Problem:** Account should match current shop — user icon + label, visible when logged in.

**Current state:** Login/register are small text links in Tier 1 utility bar (`hidden sm:flex`); easy to miss on mobile.

**Plan:**
1. Add **account icon button** in Tier 2 next to cart: person icon → `/account/login` (guest) or `/account` (authenticated).
2. When authenticated, show first name or “Mein Konto” under icon (match reference screenshot pattern).
3. Mirror in `MobileNav` header row — not buried in drawer only.
4. Keep utility-bar links as secondary or remove duplicate.

**Files:** `src/components/Header.tsx`, `src/components/MobileNav.tsx`, `src/components/AccountHeaderButton.tsx` (new), `src/messages/{de,en,fr}.json` → `nav.myAccount`

**Acceptance:** Account entry visible at same tier as cart on desktop and mobile.

---

### E2 · Registration — add “Company” field — ✅ Done

**Problem:** B2B registration requires company name.

**Current state:** `register/page.tsx` includes required Company. `POST /api/auth/register` submits it as a Magento customer custom attribute (`company` by default, override with `MAGENTO_CUSTOMER_COMPANY_ATTRIBUTE`).

**Plan:**
1. Add required `company` field to registration form UI.
2. Extend `POST /api/auth/register/route.ts` to map company to customer custom attribute.
3. Validation: min length, trim, error messages in `auth.company*` keys.
4. Show company on admin approval queue if applicable.

**Files:** `src/app/[locale]/(auth)/account/register/page.tsx`, `src/app/api/auth/register/route.ts`, `src/messages/{de,en,fr}.json` → `auth.company*`

**Dependencies:** Magento must provide the matching customer custom attribute.

**Acceptance:** Cannot submit registration without company; value persisted in Magento customer record.

---

### E3 · More feedback after login/account works

**Status:** ⏸️ **Deferred** — stakeholders will provide additional account-area feedback once login, account dashboard, and order history are validated in their environment.

**Plan:**
1. Complete E1 + E2 + verify auth on staging (`swr-demo` or production).
2. Schedule follow-up review on: `/account`, `/orders`, `/account/addresses`, quotations, fleet, service cases.
3. Capture round-2 feedback in `FEEDBACK-PLAN-R2.md` when received.

---

## Implementation order (recommended sprints)

### Sprint 1 — Navigation & shop entry (high visibility)
A1, A2, A3, A5, A8, A9, D4

### Sprint 2 — Listing & cart UX
A4 (phase 1 facets), A6, A7, A11, A10 (with available brand data)

### Sprint 3 — Copilot fixes (stakeholder pain)
D5, D6, D7, D3, D1, D2

### Sprint 4 — Account & trust
E1, E2, C1 (DE copy pass), C2

### Sprint 5 — Copilot advanced
D8, A4 (category-specific facets with backend attrs)

---

## Backend / Magento tickets (collect before Sprint 2–5)

| Ticket | Unblocks |
|--------|----------|
| Brand/manufacturer attribute populated for partners | A10 |
| Category-specific searchable attributes (welding, sprays, …) | A4 |
| Customer `company` custom attribute or B2B company API | E2 |
| Partner logo assets in media or CMS | A9 |
| Catalog data cleanup (remove test “meow”, add images) | A11 |
| Copilot upstream search/vision tools | D7, D8 |

---

## Testing checklist (from this feedback)

- [x] Shop hover mega-menu — desktop + keyboard + mobile
- [x] `/shop` tile hub — all 8 categories link correctly
- [x] `/products` without params redirects or shows hub CTA
- [x] Add to cart + qty from product grid (signed-in); guests get **watchlist** instead of cart (grid, search, PDP)
- [x] Watchlist: heart toggle persists (localStorage), header count badge, `/watchlist` page add/remove/clear
- [x] Homepage: partners carousel visible without scroll; catalog rail removed
- [x] Copilot visible with essential-only cookies (Edge)
- [~] No device permission prompt on load — `src/` audit clean (QA.md D6); live Edge retest still open
- [x] Copilot search: “makita”, German terms return products — `/api/search/products` verified locally (Jun 2026)
- [x] Registration includes company
- [x] Account icon visible Tier 2 desktop + mobile (E1)
- [ ] DE copy review completed; EN/FR synced — see `CONTENT-AUDIT.md` (stakeholder gate)
- [x] Industries nav removed; old URLs redirect

---

## Document maintenance

- Update this file as items ship; mirror status in `STATUS.md` and priority in `BACKLOG.md`.
- Round-2 account feedback → `FEEDBACK-PLAN-R2.md`.

_Last generated: 13 Jun 2026 (Sprint 2–4: A11 hygiene, A9 logos, Copilot hero, E1 account, A4 facet scaffold, CONTENT-AUDIT)_
