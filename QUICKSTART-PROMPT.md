# New Agent Quickstart Prompt

Copy everything below this line and paste as your first message when onboarding an agent on this repo.

---

You are continuing development on the **SWR Handelsgesellschaft mbH** Next.js 16 storefront — B2B industrial components (Schweißtechnik, Werkzeuge, Reparatur) backed by **Magento 2.4.8-p4 REST**.

## Read first (in order)

1. [`AGENTS.md`](./AGENTS.md) — environments, i18n rules, cart SSR pattern, design tokens, architecture sketch.
2. [`STATUS.md`](./STATUS.md) — **what is actually shipped** (pages, checkout, PDFs, service cases, catalog).
3. [`BACKLOG.md`](./BACKLOG.md) — **what to build next** (Phase 2 queue; FRD reconciliation tables).

Optional FRD traceability: [`FEATURES.md`](./FEATURES.md).

## Do not redo (already landed)

- **Magento totals in cart**, **real `tier_prices` on PDP**, **signed-in 3-step checkout** (`/checkout/*`), **customer auth** (httpOnly cookie), **orders + react-pdf documents**, **quotations UI scaffold** (empty until ERP wires `src/lib/quotations.ts`), **catalog document hub**, **service case flows** (demo persistence unless ERP/RMA connected), **CSV cart import** (`CsvImportButton`), **stock badges** on PDP + product cards, **reorder** from order detail.

## Terminology trap

Magento **`tier_prices`** = **quantity-break / bulk** pricing (implemented). Stakeholder “tiered = net price per customer + hide until login” is **not** the same thing — needs Magento catalog permissions / shared catalogs + storefront guards.

## Critical rules

1. **i18n:** every user-visible string in `de.json`, `en.json`, `fr.json`.
2. **Links:** `Link` from `@/i18n/navigation`, never `next/link`.
3. **Prices:** `useCurrency()` / `ProductPrice` — never hardcode symbols.
4. **Cart page:** keep `dynamic(..., { ssr: false })` for `CartContent` — guest cart is client-only by design.
5. **`ssr: false` imports** only inside `"use client"` files.

## Running locally

```bash
npm install
npm run dev
```

Requires Magento at `MAGENTO_URL`. See `AGENTS.md` for `.env.local`.
