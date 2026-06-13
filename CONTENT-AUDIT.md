# Content & Factual Audit (C1 / C2)

_Stakeholder feedback Phase C — generated 13 Jun 2026. German is source of truth; EN/FR derive from approved DE keys._

## Status

| Area | Status | Notes |
|------|--------|-------|
| Contact phone/email | Verified | `+49 7621 160 370`, `info@swr-loerrach.de` in `contact` namespace matches header `tel:` link |
| Opening hours | Needs sign-off | `Mo-Fr 07:30-17:00` in messages — confirm against current SWR operations |
| RealityStrip stats | Needs sign-off | `1987`, `12.000+` SKUs, `48 Std.` repair, `60+` brands — stakeholder must confirm or adjust |
| Homepage hero/services | Needs DE copy pass | Marketing tone is implementation draft; replace with approved German source (C1) |
| CMS pages (`getCmsPage`) | Backend-led | Factual updates in Magento admin when CMS diverges from swr-loerrach.de |
| Copilot / shop strings | i18n complete | New keys under `copilot.home.*`, `nav.myAccount`, `shop.*` added DE → EN/FR |

## Verified against codebase (no stakeholder block)

- Header phone matches `contact.phone` (`+49 7621 160 370`).
- No fabricated customs pillar rendered on homepage (customs hub is separate `/services/customs`).
- Partner carousel uses curated `PARTNER_BRANDS` list aligned with `/partners`.
- Industries nav removed; legacy URLs 301 to `/shop`.

## Open — requires stakeholder / Magento

1. **C1 German copy quality** — Replace marketing namespaces (`home.*`, `services.*`, `about.*`) with approved DE prose; then sync EN/FR.
2. **C2 factual claims** — Audit each `RealityStrip` number and service bullet against swr-loerrach.de and internal ERP facts.
3. **Catalog demo data** — Frontend now hides junk attributes (`meow`, test placeholders) via `src/lib/product-display.ts`; Magento should still clean source data (A11 backend).
4. **Category labels per locale** — `getTopLevelCategories(storeCode)` now passes locale store view; verify DE/EN/FR category names on staging Magento.

## Recommended next review session

- Stakeholder provides approved `de.json` deltas for `home`, `services`, `about`, `contact`.
- Sign-off checklist in `FEEDBACK-PLAN.md` § Testing — mark C1/C2 when complete.
