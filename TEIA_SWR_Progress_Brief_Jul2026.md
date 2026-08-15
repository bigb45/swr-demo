# TEIA / SWR Shop

## Progress Brief

|                      |                                                     |
| -------------------- | --------------------------------------------------- |
| **Date**             | 20 July 2026                                        |
| **Period**           | May to July 2026 (delta since the June brief)       |
| **Fronts**           | Frontend · Magento / nextPIM · AI                   |
| **Status labels**    | Done · In progress · Blocked · Next · Open          |

---

## Where things stand

Since June we spent most of the effort deepening commerce and Copilot behavior rather than adding new marketing pages. The biggest frontend items are Magento customizable options running end to end (PDP, cart, orders), more Copilot work (options-aware add-to-cart, streaming and mobile fixes, chat history), B2B registration, guest pricing behavior, and a visual-search response fix. We also fixed a Copilot order-history bug for signed-in shoppers who still carry a guest cart id; that change is in the storefront proxy now and is waiting on the normal merge and deploy path.

On Magento and nextPIM, we met with SWR and went through the nextPIM options. The follow-up is Thursday 23 July 2026 at 11:00 CEST, where we want to settle how we fetch and display product variants and try to get OXOMI credentials. We also got a Magento customer id for testing. Customer-specific net pricing and procurement punchout are still waiting on ERP and Magento configuration that sits outside the frontend.

On AI, search relevance and bare product-name handling ("Flex") were fixed on the service side, order-history identity was corrected both in the backend and in our proxy, the vision-refusal guard is still open in PR #66, and visual similarity search is built but dormant until GCP permissions allow key creation. Some security cleanup landed too (rotated an exposed admin key, revoked a leaked GitHub token, fixed a broken production deploy).

---

## At a glance

| Workstream                           | State                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| Frontend storefront (Next.js 16)     | Substantial shop / commerce / Copilot depth since June; polish ongoing         |
| Magento · nextPIM · partners         | PIM options under discussion; variants / OXOMI follow-up on 23 July            |
| AI Copilot, search, vision           | Core paths in use; several reliability fixes applied; some items open/blocked  |
| Guest catalog price UI gate          | Done on storefront surfaces (not ERP-grade payload confidentiality)            |
| Customer-aware (net / group) pricing | Still gated on Magento / ERP access and configuration                          |
| Quotations (ERP-backed)              | UI wired; empty until Magento `swr-quotations` is live                         |
| Visual similarity search             | Built and deployed; dormant pending GCP service-account / org-policy unblock   |
| Vision-refusal guard (AI)            | Open; PR #66 not merged                                                        |
| Procurement / eProcurement punchout  | Not started on the storefront side                                             |
| SPARQUE search                       | Not integrated in this frontend (Magento REST search remains baseline)         |

---

## 1. Frontend

The storefront is a Next.js 16 App Router app that talks to Magento over REST. The tables below focus on what changed or was confirmed since June; earlier May to June items are treated as already reported unless their status moved.

### Done (since June, or confirmed landed)

| Feature                                            | Status                       | Notes                                                                                                                                                            |
| -------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Magento customizable options (PDP to cart to orders) | Done                       | Text and select options on the PDP, carried through the cart, readable labels on order detail. Was in progress in June.                                          |
| Copilot options-aware commerce                     | Done                         | Chat and picker surface `needs_options` and add configured lines without an extra agent round-trip for simple optioned add-to-cart.                              |
| Copilot UX depth                                   | Done                         | Floating panel with live status, suggested prompts, follow-up chips, chat history restore, mobile sheet, Safari keyboard handling, homepage entry points.        |
| B2B registration and account polish                | Done                         | Multi-step registration with company field, account and transactional UX tightening, password reset flows in tree.                                              |
| Guest catalog price UI gate                        | Done                         | Catalog surfaces hide EUR until sign-in (`CustomerSessionProvider` and shared price components). This is a UI gate, not Magento payload confidentiality.         |
| Guest cart pricing UX and cart toasts              | Done                         | Clearer guest cart pricing behavior and cart action feedback.                                                                                                    |
| Commerce consistency (cart / orders)               | Done                         | Hardening across cart and order surfaces, including clearer custom-option display.                                                                               |
| Design / storefront polish (July)                  | Done                         | Product-card gallery counter, lazy-loaded shop categories in nav, visual cleanup, remaining i18n leak fixes.                                                     |
| Visual search response fix                         | Done                         | Storefront fix so the visual search endpoint response body is handled correctly.                                                                                 |
| Copilot order-history auth (proxy)                 | Done (pending merge/deploy)  | `teia-chat-proxy.ts` now attaches `customer_id` from `/customers/me` whenever `swr_customer_token` is set, even if a guest `cart_id` is present, for text and image payloads. Teia gets both ids: `cart_id` for cart tools, `customer_id` for order/account tools. Currently an uncommitted working-tree fix. |
| Shop hub, mega-menu, watchlist (earlier wave)      | Done                         | Covered in June; still the baseline shop entry model (`/shop`, mega-menu, Merkliste).                                                                            |

### In progress

| Feature                             | Status      | Notes                                                                                                                                        |
| ----------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout / account governance depth | In progress | Payment method selection and directory-backed address fields are in place; cost center, approvals, and B2B sub-user governance are Magento-led. |
| Richer faceted product listing      | In progress | URL filters and a category-scoped facet scaffold exist; still need Magento `aggregations` / per-category attribute sets for fuller facets.    |
| Copilot coverage evolution          | In progress | Dock and `/api/copilot/*` routes are in the repo; behavior tracks upstream Teia capabilities and env configuration.                          |

### Blocked / backend-defined (frontend ready or partial)

| Feature                          | Status         | Notes                                                                                                                                    |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Quotations list / accept / PDF   | Blocked        | Storefront calls Magento `swr-quotations`; UI shows empty until the module is deployed.                                                  |
| True guest price confidentiality | Blocked        | UI hides catalog prices; admin-token product reads can still include `price` until Magento catalog permissions / shared catalogs kick in. |
| Configurable variant matrix      | Blocked / Next | Needs Magento configurable products before a McMaster-style PDP matrix is useful. On the agenda for the 23 July variants discussion.     |
| Service cases and fleet          | Partial        | Repair / inspection / return UI and demo fleet seed exist; durable Magento RMA / attachments and real persistence are still open.        |
| Category-specific filter sets    | Blocked        | Needs Magento-defined filterable attributes per category.                                                                                |
| Partner logo deep-links          | Blocked        | Needs populated brand / manufacturer catalog data.                                                                                       |

### Next (frontend-facing)

| Feature                                        | Status | Notes                                                                       |
| ---------------------------------------------- | ------ | --------------------------------------------------------------------------- |
| Registration approval and sub-user governance  | Next   | Depends on the Magento B2B company / roles model.                           |
| Merge and ship the Copilot proxy customer_id fix | Next | Land the working-tree proxy change through the normal review and deploy path. |
| Image fallbacks / manufacturer logos           | Next   | Straightforward once Magento or PIM exposes reliable media and logo URLs.   |

---

## 2. Magento / nextPIM / partners

Commerce is Magento 2.4.8-p4, with product data expected to keep flowing from (or through) nextPIM. This section only covers verified partner and program activity for this window.

### Done / confirmed

| Item                                      | Status | Notes                                                                                                     |
| ----------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| SWR discussion on nextPIM options         | Done   | Met with SWR and worked through nextPIM options; no single final architecture locked yet.                 |
| Customer id for testing                   | Done   | Got a Magento customer id for testing. The id itself is not included here.                                |
| Initial nextPIM to Magento sync (earlier) | Done   | Reported in June; still the baseline for catalog ingestion, with enrichment ongoing.                      |

### Next / Open

| Item                                    | Status         | Notes                                                                                                                    |
| --------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Follow-up: product variants and OXOMI   | Next           | **Thursday 23 July 2026, 11:00 CEST.** Goals: settle the approach for product variants and try to get OXOMI credentials. |
| Customer-aware (net / group) pricing    | Open / Blocked | Depends on Magento customer-group / shared-catalog setup and ERP pricing context.                                        |
| User management / registration approval | Open           | Magento-side approval and company / sub-user modeling still needed for full B2B governance.                              |
| Punchout / eProcurement                 | Open           | Not started on the storefront; gated on ERP access and connector scope.                                                  |
| Quotations Magento module               | Open           | Storefront stays empty until `swr-quotations` (list, detail, PDF, accept) is available.                                  |

---

## 3. AI

Copilot, hybrid search, vision, and multilingual handling are the conversational layer of the shop. Status below reflects the latest developer notes plus our proxy verification. "Fixed" means the defect path was addressed in code or ops; production rollout should still be confirmed per environment.

### Shipped / fixed (recent)

| Item                                      | Status                       | Notes                                                                                                                                                          |
| ----------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search relevance restored                 | Fixed                        | Stale reindex fixed; eligibility filter was missing a visibility check (about 5.7x index bloat, roughly 10,510 to 1,842 docs). Added retry, a 30-minute reconcile sweep, and a daily prune job. |
| Flex / bare product-name search           | Fixed                        | Greeting-detection guard adjusted so bare product or brand names are not treated as small talk.                                                               |
| Order history identity (backend)          | Fixed                        | Backend corrected `cart_id` vs `customer_id` priority so account tools can resolve the signed-in customer.                                                     |
| Order history identity (storefront proxy) | Fixed (pending merge/deploy) | Proxy no longer drops `customer_id` when a guest `cart_id` is present and a customer token is set. Applies to text and image chat payloads.                     |
| Security cleanup                          | Done                         | Rotated an exposed admin API key; revoked a leaked GitHub token and replaced it with a scoped SSH deploy key; fixed a broken production deploy (expired server credential). |

### Pending / Open

| Item                              | Status            | Notes                                                                                                                                                                                                      |
| --------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vision-refusal guard              | Open              | PR **#66** is open, not merged. Guards OpenAI vision refusals so the assistant fails gracefully instead of showing refusal text as a search query.                                                          |
| Visual similarity search          | Blocked (dormant) | About 1,806 images in Firestore with Vertex AI embeddings; Firestore chosen over Vertex Vector Search on cost. Built and deployed but dormant pending GCP service-account permissions / org policy blocking key creation. |
| Broader Copilot commerce coverage | In progress       | Cart and product consultation paths work; order / account tools depend on correct id attachment (see proxy fix) and Teia tool coverage.                                                                     |

Hybrid search, synonyms, multilingual handling, and image product recognition were already reported as live in June, so this update does not re-claim them. It focuses on reliability and identity fixes, the open PR, and the blocked visual-similarity path.

---

## 4. Near-term plan

Rough priority order, subject to SWR and partner decisions:

1. Confirm and deploy the storefront Copilot proxy fix so signed-in order-history keeps working when a guest cart id is present.
2. 23 July partner follow-up: lock a product-variants approach and pursue OXOMI credentials.
3. Merge or revise AI PR #66 (vision-refusal guard).
4. Unblock visual similarity once GCP permissions allow key creation, then re-enable the dormant path with a controlled rollout.
5. Customer-aware net pricing end to end: Magento / ERP configuration first; the storefront already gates guest catalog UI prices.
6. Quotations module: populate `/account/quotations` and the accept / PDF flows once `swr-quotations` is live.
7. Configurable variant matrix on the PDP, after the Magento data and the 23 July variants decision are clear.
8. B2B registration governance: approval queue, sub-users, roles (Magento-led).
9. eProcurement / punchout: start only when ERP connector scope and credentials exist.
10. Catalog enrichment: images, brand attributes, and partner deep-link data via nextPIM / Magento.

---

## 5. Known limitations

| Topic                               | Where it actually stands                                                                                                                                                                              |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SPARQUE**                         | Not integrated in this frontend. Listing and search use Magento REST. Synonym / typo tolerance on the AI side is separate from a SPARQUE storefront integration.                                       |
| **Guest pricing**                   | Catalog UI hides prices for anonymous users, but cart / checkout line amounts can still show for guests, and admin-token Magento reads can still include `price`. The UI gate is not ERP-grade confidentiality. |
| **Magento `tier_prices`**           | Quantity-break / bulk tiers on the PDP. Not the same as customer-group net (contract) pricing.                                                                                                        |
| **Quotations**                      | Account UI and API client exist; lists stay empty until Magento exposes `swr-quotations`.                                                                                                             |
| **Service / fleet**                 | Useful demo and in-process persistence exist; not a finished Magento RMA / service-case system.                                                                                                       |
| **eProcurement**                    | Punchout / OCI / Ariba / Coupa work has not started on the storefront.                                                                                                                                |
| **Visual similarity**               | Backend embedding path exists but is dormant pending GCP permissions. Not a live shopper feature yet.                                                                                                 |
| **Vision-refusal PR #66**           | Still open; not merged.                                                                                                                                                                               |
| **Copilot order-history proxy fix** | Fixed in the working tree; confirm merge and deploy before calling it live everywhere.                                                                                                                |
| **Customer id for testing**         | Acquired; id not included here.                                                                                                                                                                       |

---

Prepared for SWR Handelsgesellschaft mbH.
