# Product

## Register

product

## Users

B2B procurement and trade professionals who buy industrial supplies for a living: workshop and facility managers, welders and machine operators, purchasing/eProcurement staff, and key-account buyers ordering against a company account. They arrive knowing roughly what they need (often a SKU, a manufacturer, or a precise spec) and want to find it, confirm price/availability, and reorder with minimum friction — frequently from a shop floor or a busy desk, under time pressure. They value speed, technical accuracy, and reliability over discovery or browsing. Many operate on customer-specific pricing, order references, and approval chains rather than impulse purchases.

## Product Purpose

The customer-facing storefront for **SWR Handelsgesellschaft mbH**, a Next.js 16 App Router app over a Magento 2.4.8 backend (REST only). It replaces a legacy WordPress marketing site and a separate shop with one application: catalog/search, PDP with quantity-tier pricing, cart, signed-in checkout, order history with ERP-aware status and PDFs, account/address management, document catalog, and B2B service/repair/fleet flows. Success = a professional can locate the right part, see correct B2B pricing and stock, and place or reorder against their account fast and correctly, across de/en/fr and EUR/CHF.

## Brand Personality

The "Industrial Architect": precise, authoritative, reliable, no-nonsense. Voice is direct and technical — say the spec, show the number, skip the adjectives. Three words: **engineered, dense, trustworthy**. The interface should feel like precision-milled hardware: information-dense, ruthlessly efficient, impeccably organized. Emotional goal is confidence and competence, never delight-for-its-own-sake.

## Anti-references

- **Consumer retail stores** (Amazon/Shopify-style): oversized hero imagery, marketing fluff, discovery-driven merchandising. This is a working tool, not a shopping mall.
- **Generic SaaS dashboards**: gradient hero-metric blocks, endless identical icon+heading+text card grids, decorative gradients.
- **The legacy WordPress/old shop** it replaces: dated, cluttered, visually noisy.
- **Playful / rounded / consumer-app aesthetics**: soft, friendly, toy-like styling that undercuts technical authority.

**Positive reference:** McMaster-Carr — functional, straightforward, to the point. High-density spec tables, fast text-led navigation, get-the-user-to-the-part-now. SWR matches that efficiency but elevates the visual layer with the deep-blue/green palette and tonal layering defined in `DESIGN.md`.

## Design Principles

1. **Density over whitespace.** This is an industrial catalog, not a retail store. Showing 20 products or a full spec sheet without scrolling is a success, not a flaw. Add padding to separate, never lines or "air for air's sake."
2. **Text and data lead; decoration follows.** Prioritize text-based navigation and real product data (SKU, specs, tiers, stock). Icons support, never replace, labels. No effect ships unless it improves comprehension or speed.
3. **Get the professional to the part.** Optimize for the user who already knows what they want: search, SKU, reorder, CSV import, order reference — fast paths beat browsing journeys.
4. **Tonal layering, not borders.** Define structure through `surface` background shifts and the ambient shadow, per `DESIGN.md`. No 1px sectioning borders, no generic grey shadows.
5. **B2B truth before polish.** Correct customer-specific pricing, stock, totals, order references, and ERP status matter more than visual flourish. When data is uncertain, show the honest state, not a pretty placeholder.

## Accessibility & Inclusion

No formal WCAG conformance target is committed. Aim for reasonable, practical accessibility: legible high-density text with adequate contrast (the `DESIGN.md` palette is built for this), full keyboard operability of catalog/cart/checkout flows, visible focus states, and honest reduced-motion behavior. Three-locale support (de/en/fr) is a hard requirement; never hardcode user-visible strings.
