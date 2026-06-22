# Design System Document: Industrial Precision & Density

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Machined Part"**

This design system rejects the "airy" and "whimsical" trends of modern SaaS in favor of a high-utility, industrial aesthetic. It is inspired by the uncompromising efficiency of a precision engineering workshop. Every pixel must serve a functional purpose; every component must feel as if it were milled from a solid block of data.

To move beyond a generic "B2B template," we utilize **Industrial Functionalism**. We break the monotony of the grid through intentional density—prioritizing information over white space—and using tonal shifts to define hierarchy. The system is designed for the professional who values speed, technical accuracy, and the "no-nonsense" reliability of a well-organized catalog.

---

## 2. Colors: Tonal Architecture
The palette is rooted in a deep, authoritative Blue (`primary`) and a functional Forest Green (`secondary`). 

### The "No-Line" Rule
To maintain a high-end feel, **do not use 1px solid borders for sectioning.** Structural boundaries must be defined solely through background color shifts. For example:
- A data table (`surface-container-lowest`) should sit directly on a page body (`surface`) without a border.
- Sidebars use `surface-container-high` to create a natural, "milled" inset.

### Surface Hierarchy & Nesting
Treat the interface as a series of physical layers. Use the following hierarchy to create depth without relying on shadows:
- **Level 0 (Base):** `surface` (#f9f9f9) — The primary canvas.
- **Level 1 (Sub-section):** `surface-container-low` (#f3f3f3) — Minor grouping.
- **Level 2 (Active Areas):** `surface-container` (#eeeeee) — Standard data blocks.
- **Level 3 (High Prominence):** `surface-container-highest` (#e2e2e2) — Headers or navigation rails.

### Signature Textures
For high-impact CTAs, avoid flat color. Apply a subtle linear gradient from `primary` (#001e40) to `primary_container` (#003366) at a 135° angle. This mimics the "sheen" of treated steel and provides a professional polish that feels bespoke.

---

## 3. Typography: The Engineering Font
We utilize **Inter** across all touchpoints. It is chosen for its high X-height and legibility in dense technical environments.

*   **Display/Headline:** Use `headline-sm` (1.5rem) or `title-lg` (1.375rem) for most headers. We avoid overly large display fonts to preserve vertical density.
*   **Body & Data:** The workhorse of the system is `body-md` (0.875rem). It provides a balance between readability and the high-density "McMaster-Carr" catalog feel.
*   **Labels:** Use `label-sm` (0.6875rem) in All-Caps with +2% letter-spacing for technical specifications or table headers. This conveys an "Industrial Blueprint" authority.

---

## 4. Elevation & Depth: Tonal Layering
In this system, "Elevation" does not mean "Shadows."

*   **The Layering Principle:** Depth is achieved by stacking. Place a `surface-container-lowest` card on a `surface-container-low` background to create a crisp, "paper-on-metal" lift.
*   **Ambient Shadows:** Use shadows only for temporary overlays (modals/popovers). Shadows must be extremely subtle: `box-shadow: 0 4px 20px rgba(0, 30, 64, 0.06);`. The shadow color is a tinted version of our `primary` blue, never pure black.
*   **The Ghost Border Fallback:** If a technical constraint requires a border, use `outline_variant` at 20% opacity. 100% opaque borders are strictly forbidden as they clutter the high-density layout.
*   **Glassmorphism:** For persistent toolbars or "Quick-Action" menus, use `surface` with 80% opacity and a `backdrop-filter: blur(12px)`. This allows the complex technical data to flow underneath, maintaining a sense of spatial awareness.

---

## 5. Components: Precision Primitives

### Buttons & Inputs
- **Primary Button:** `primary` background with `on_primary` text. Corner radius: `sm` (2px).
- **Secondary/Tertiary:** No background; use `primary` text. Interaction is signaled via a `surface-container` background fill on hover.
- **Inputs:** `none` (0px) radius for structural integration or `sm` (2px) for standalone fields. Use `outline_variant` at 50% for the resting state.

### High-Density Cards & Lists
- **The "No-Divider" Rule:** Forbid the use of horizontal divider lines in lists. Use `0.5rem` of vertical white space or a subtle `surface` toggle (zebra-striping) using `surface-container-low`.
- **Corner Radius:** Structural elements (Grids) are `0px`. Technical Cards are `md` (6px).

### Data Tables (The Core Component)
- **Header:** `surface-container-highest` with `label-md` bold text.
- **Rows:** Alternating `surface` and `surface-container-lowest`.
- **Active State:** A `primary` 2px vertical stroke on the left edge of the row, rather than a full background change.

---

## 6. Do's and Don'ts

### Do
- **Do** prioritize information density. If a user can see 20 parts on a screen instead of 10, the design is succeeding.
- **Do** use `primary` blue for authority and `secondary` green for "Safe/In-Stock/Confirmed" technical statuses.
- **Do** use strict `0px` corners for any element that touches the edge of the screen or another container.

### Don't
- **Don't** use "Airy" padding. If the padding is larger than `1.5rem`, it is likely too much for this industrial context.
- **Don't** use rounded "Pill" buttons. These feel too consumer-facing and soft for a tool supplier. Stick to `2-4px`.
- **Don't** use generic grey shadows. If an element needs to float, its shadow must be tinted with the brand's `primary` blue.