# QA Agent Playbook

Self-contained guide for multi-agent site audits. **Start every fresh Cursor chat here** — no prior conversation context required.

---

## Start here (fresh session)

1. Read this file, [`scripts/qa-route-manifest.json`](scripts/qa-route-manifest.json), and [`STATUS.md`](STATUS.md).
2. Ensure Magento is running at `MAGENTO_URL` and the frontend at `http://localhost:3000` (`npm run dev`).
3. Run automated smoke **before** deep manual QA:

```bash
QA_BASE_URL=http://localhost:3000 npm run qa:smoke
```

4. Read results in [`scripts/qa-output/qa-matrix.md`](scripts/qa-output/qa-matrix.md) and `qa-matrix.json`. Any document HTTP failure, console error, or failed same-origin API in smoke is a **blocker** until investigated.
5. Pick a role below: **partition** (`A`–`D` from manifest) or **specialist** (functional, a11y, security, …).
6. Write findings to `scripts/qa-output/findings-{partition-or-role}-{YYYY-MM-DD}.md`.

**Kickoff prompt for a new chat:**

```
Follow @QA.md. Read scripts/qa-route-manifest.json and STATUS.md.
Run qa:smoke if not already done. You are partition {A|B|C|D} OR specialist {name}.
Report findings using the template in QA.md.
```

---

## Environment checklist

| Item | Notes |
|------|--------|
| `MAGENTO_URL` | Default `http://localhost:8000` — must match running Magento |
| `MAGENTO_MEDIA_BASE_URL` / `NEXT_PUBLIC_MAGENTO_MEDIA_BASE_URL` | Must match exactly or images hydrate incorrectly |
| Admin API creds | `MAGENTO_ADMIN_USER` / `MAGENTO_ADMIN_PASSWORD` in `.env.local` (never commit) |
| Test customer | Signed-in B2B account with orders/addresses (credentials in env, not repo) |
| Cookie consent | Test three states: **none** (first visit), **essential only**, **accept all** (copilot + currency) |
| `NEXT_PUBLIC_FLEET_DEMO=1` | Enables demo fleet machines — note in findings if fleet tests depend on this |

**Locales:** `de` (default), `en`, `fr` — prefix paths as `/{locale}/…`.

**Viewports:** 375×812 (mobile), 768×1024 (tablet), 1280×800 (desktop), 1920×1080 (wide).

**Personas:**

- **Guest** — no `swr_customer_token`; catalog prices hidden in UI; add-to-cart gated
- **Signed-in customer** — prices, cart sync, checkout, orders, account areas

---

## Route inventory (do not duplicate)

Authoritative route list: [`scripts/qa-route-manifest.json`](scripts/qa-route-manifest.json)

- `staticRoutes` + `staticRoutes_queryVariants` — hit every path × every locale
- `dynamicRoutes` — discover IDs from listing pages (SKU, category, catalog doc, order, etc.)
- `agentPartitions` — parallel work split:
  - **A** `A_marketing_legal` — home, about, contact, industries, legal
  - **B** `B_shop_catalog_checkout` — products, catalog, cart, checkout, categories
  - **C** `C_services_industries` — services pillars
  - **D** `D_account_orders` — auth, account, orders, fleet, service cases
- `highRiskRoutes` — manual deep-dive even when smoke passes
- `uiEvalChecks` — apply on every page visit

When new routes ship, extend the manifest — do not maintain a second route list in this file.

---

## High-risk areas (prioritized manual pass)

Exercise these even if automated smoke is green:

| Area | Routes / components | Why |
|------|---------------------|-----|
| Guest pricing UX | `/products`, `/categories/[id]`, PDP | Page banner + compact card vs full message on PDP |
| Product facets | `/products?q=…`, facet query params | URL state, aggregations fallback, active-filter chips, ICU `{count}` |
| Header / copilot | All pages with chrome | Consent-gated copilot placeholder vs button; no hydration mismatch with contact/cart links |
| Cart | `/cart` | Client-only cart (`localStorage`), Magento totals, qty/undo, CSV import |
| Checkout | `/checkout/*` | Signed-in only; address picker, shipping methods, PO number, place order |
| Hydration | Home, products, PDP, cart | `CartBadge`, `GuestPricingBanner`, image media base URL |
| Catalog viewer | `/catalog`, `/catalog/[id]` | PDF iframe, YouTube/file video, external PDF fallback |
| Service cases | `/account/service/*` | Pick flow, form validation; in-memory persistence when demo |
| Quotations | `/account/quotations` | Empty state vs live `swr-quotations` module |
| i18n | All locales | `FORMATTING_ERROR` in console; hardcoded strings |
| Security | `/api/orders/*`, `/api/account/*` | IDOR on PDFs and profile routes |

See [`STATUS.md`](STATUS.md) *Partial / still evolving* for known gaps — do not file as bugs what is documented as backlog.

---

## Finding template

Every finding must use this structure:

```markdown
### QA-{area}-{nnn}: Short title

- **Severity:** blocker | major | minor | nit
- **Area:** functional | a11y | security | responsive | visual | i18n | perf | seo | hydration
- **Route:** e.g. `/de/products?q=drill`
- **Persona:** guest (consent: none|essential|all) | signed-in
- **Viewport:** 375 | 768 | 1280 | 1920

**Steps to reproduce**
1. …

**Expected:** …

**Actual:** …

**Evidence:** screenshot path, console error, network request/response

**Suggested fix:** file/component if known
```

End each agent run with a summary table: counts by severity and area, plus **top 5 blockers**.

---

## Master orchestrator prompt

Copy into a coordinator agent or use to brief parallel subagents:

```markdown
You are the QA orchestrator for the SWR Handelsgesellschaft Next.js storefront (Magento 2.4.8 REST backend).

Read QA.md, scripts/qa-route-manifest.json, and STATUS.md in the repo root.
Run QA_BASE_URL=http://localhost:3000 npm run qa:smoke unless qa-matrix.md is from today.

Assign work by agentPartitions A–D OR by specialist role (see QA.md).
Locales: de, en, fr. Viewports: 375, 768, 1280, 1920.
Personas: guest (test cookie consent none / essential / accept-all) and signed-in B2B customer.

For each route: exercise real interactions (click, filter, submit, paginate). Check browser console for errors and failed network calls. Apply uiEvalChecks from the manifest.

Use the finding template in QA.md. Write to scripts/qa-output/findings-{id}-{date}.md.
Deliver: summary table (severity × area) and top 5 blockers.

Do not mark pass without evidence. Do not file known backlog items from STATUS.md as bugs without noting "documented gap".
```

---

## Specialist prompts

Each block is self-contained. Paste one per agent in a fresh chat with `@QA.md`.

### 1. Functional / robustness

```markdown
Role: Functional QA — partition {A|B|C|D} from scripts/qa-route-manifest.json.

Read QA.md and STATUS.md. Run all routes in your partition × de/en/fr.

Test E2E where applicable:
- Shop: listing › category › PDP › add to cart › cart (qty, undo, remove) › checkout (signed-in) › order › PDFs
- Catalog: multi-select facets, search, PDF + video viewers
- Account: login/register, profile, addresses CRUD, orders, quotations, fleet, service pick › form › submit
- Marketing/legal: CTAs, contact, legacy redirects (/bulk-order › cart)

Edge cases: empty search, empty filters, invalid SKU (404), Magento unreachable (error UI), hard refresh mid-cart, back button, double submit.

Report using QA.md finding template → scripts/qa-output/findings-functional-{partition}-{date}.md
```

### 2. Accessibility (WCAG 2.2 AA target)

```markdown
Role: Accessibility QA for SWR storefront. Read QA.md + DESIGN.md color tokens.

Keyboard-only: header, mobile nav, search autocomplete, facet sidebars (/products, /catalog), cart stepper, all forms, cookie banner, copilot panel.

Check: focus order/visibility, heading hierarchy, form labels/errors, button vs link semantics, aria-expanded on accordions, icon-only buttons (cart, copilot, gallery), iframe/video titles, color contrast (#003a63, #006e21 on surfaces).

Sample routes from each agentPartition; all three locales on key flows.

Report → scripts/qa-output/findings-a11y-{date}.md
```

### 3. Security

```markdown
Role: Security QA (frontend + Route Handlers). Read QA.md and src/app/api/**.

Verify: Magento admin token never in client bundle; customer token httpOnly only; no secrets in localStorage.
Test IDOR: order/quotation/invoice PDF proxies with another user's IDs (expect 401/403/404).
Review XSS surfaces: CMS HTML (sanitize-html), product descriptions (dangerouslySetInnerHTML).
Cookie consent: copilot/currency blocked until accept-all.
Open redirects on login/locale switch.

Safe tests only — document risks with reproduction steps, no destructive actions.

Report → scripts/qa-output/findings-security-{date}.md
```

### 4. Responsive layout

```markdown
Role: Responsive layout QA. Read QA.md + DESIGN.md.

At 375, 768, 1280, 1920px test: header tiers, mobile search row, product grid columns, guest pricing banner + card footers, catalog facet mobile accordion, checkout stepper, order detail tables, copilot dock/panel.

Flag horizontal overflow, clipped text, overlapping sticky elements, touch targets <44px on primary actions.

Cover highRiskRoutes from qa-route-manifest.json.

Report → scripts/qa-output/findings-responsive-{date}.md
```

### 5. Visual / design-system consistency

```markdown
Role: Visual consistency QA. Read DESIGN.md.

Check: primary #003a63, secondary #006e21, surface hierarchy, no 1px section borders (tonal shifts only), radius 0/3/5px, shadow 0 10px 30px rgba(26,28,28,0.06), information density.

Compare ProductCard, ProductSearchResultRow, catalog chips, active filter strips, stock badges, NoImagePlaceholder.

Sample pages from each partition; note drift from design tokens.

Report → scripts/qa-output/findings-visual-{date}.md
```

### 6. i18n / locale

```markdown
Role: i18n QA. Read QA.md + AGENTS.md i18n rules.

For de, en, fr: no hardcoded user strings; internal links use locale prefix; prices via formatPrice/ProductPrice; ICU variables always provided (watch console for FORMATTING_ERROR).

Test locale switcher preserves path + query on /products with active facets.
Long DE/FR strings: overflow on buttons/labels.

Report → scripts/qa-output/findings-i18n-{date}.md
```

### 7. Performance / CLS

```markdown
Role: Performance QA (lightweight). Read QA.md + AGENTS.md hydration section.

Pages: home, /products, PDP, /cart. Note LCP/CLS/INP if using Lighthouse (dev mode skews results).
Watch layout shift from: cookie banner, copilot placeholder, cart badge, guest pricing banner.
Image env mismatch (MEDIA_BASE vs NEXT_PUBLIC_*).
Duplicate Magento calls on products (list + aggregations).

Report user-perceivable issues → scripts/qa-output/findings-perf-{date}.md
```

### 8. Hydration / SSR parity

```markdown
Role: Hydration QA. Read AGENTS.md "Hydration — Known Patterns".

Hard refresh with console open on: home, /products, PDP, /cart, any page with Header.

Verify no "Hydration failed" or text mismatch. Known components: CopilotHeaderTrigger placeholder, CartBadge mounted guard, cart page ssr:false, GuestPricingBanner, CustomerSessionProvider, product images.

Report → scripts/qa-output/findings-hydration-{date}.md
```

### 9. SEO / redirects

```markdown
Role: SEO QA.

Check: /sitemap.xml, /robots.txt, meta title/description on key routes, canonical + hreflang on home/product/legal, legacy German 301s (see STATUS/proxy), pagination on /products, filter URL crawlability, internal links from footer/nav, ProductsActiveFilters chips as crawlable Links.

Report → scripts/qa-output/findings-seo-{date}.md
```

### 10. B2B business rules

```markdown
Role: B2B business-logic QA. Read STATUS.md cart/account sections.

Verify: guests no catalog prices in UI; signed-in sees prices + listing add-to-cart; tier/bulk table on PDP when authenticated; PO number cart › checkout › order; ERP status on orders; reorder; CSV import; quotation accept-to-cart when backend live.

Note if guest network responses still include price JSON (document as data exposure risk separate from UI).

Report → scripts/qa-output/findings-b2b-{date}.md
```

---

## Parallel execution patterns

**4 agents by partition** — fastest route coverage:

| Agent | Partition | Manifest id |
|-------|-----------|-------------|
| 1 | Marketing + legal | `A_marketing_legal` |
| 2 | Shop + catalog + checkout | `B_shop_catalog_checkout` |
| 3 | Services | `C_services_industries` |
| 4 | Account + orders | `D_account_orders` |

**10 agents by specialist** — deeper quality pass on overlapping routes.

Merge all `scripts/qa-output/findings-*.md` into a single stakeholder summary; dedupe by route + symptom.

---

## Automated smoke reference

```bash
# Default localhost:3000
npm run qa:smoke

# Staging
QA_BASE_URL=https://your-preview.vercel.app npm run qa:smoke

# Skip dynamic route discovery (faster, less coverage)
QA_SKIP_DYNAMIC=1 npm run qa:smoke
```

Outputs:

- `scripts/qa-output/qa-matrix.json` — machine-readable
- `scripts/qa-output/qa-matrix.md` — human table (Doc / Strict / Locale / Path / HTTP / Console / Net)

Requires Playwright Chromium: `npx playwright install chromium`

---

## Related docs

| File | Purpose |
|------|---------|
| [`STATUS.md`](STATUS.md) | Shipped vs partial features |
| [`DESIGN.md`](DESIGN.md) | Visual spec |
| [`AGENTS.md`](AGENTS.md) | Stack, i18n, cart, hydration pitfalls |
| [`FEATURES.md`](FEATURES.md) | Stakeholder FRD checklist |
| [`BACKLOG.md`](BACKLOG.md) | Prioritized queue |
