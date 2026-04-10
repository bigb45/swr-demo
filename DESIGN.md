# Design System Document

## 1. Overview & Creative North Star

### Creative North Star: "The Industrial Architect"

This design system rejects the "fluff" of traditional retail for the precision of engineering. It is a high-density, utility-first system designed for the professional who values speed, technical accuracy, and reliability over decorative trends.

While the layout mimics the ruthless efficiency of McMaster-Carr, the visual layer is elevated through a sophisticated deep-blue and vibrant-green palette. We break the "generic e-commerce" template by utilizing **Rigid Functionalism**—a style that prioritizes content density but executes it with high-end editorial finesse. We replace traditional borders with tonal layering, creating an interface that feels like a precision-milled piece of hardware: seamless, heavy-duty, and impeccably organized.

---

## 2. Colors

Our palette is rooted in industrial reliability and high-visibility safety.

### Color Tokens (Material Design Convention)

* **Primary (`#003a63`):** The Deep Blue. Used for primary navigation, authoritative headers, and core brand moments.
* **Secondary (`#006e21`):** The Vibrant Green. Reserved for high-action items, success states, and industrial "GO" signals.
* **Surface Hierarchy:**

  * `surface`: `#f9f9f9` (Base page background)
  * `surface-container-low`: `#f3f3f3` (Large layout blocks)
  * `surface-container-highest`: `#e2e2e2` (Search bars, inactive states)
  * `surface-container-lowest`: `#ffffff` (Primary content cards and data cells)

### The "No-Line" Rule

To achieve a high-end feel, **1px solid borders are prohibited for sectioning.** Boundaries between different functional areas (e.g., the sidebar vs. the product grid) must be defined solely through background color shifts. For example, a sidebar using `surface-container-low` should sit directly against a `surface` background.

### Signature Textures

Main CTAs or hero sections should utilize a subtle linear gradient from `primary` (#003a63) to `primary_container` (#005288) at a 135-degree angle. This adds a "machined metal" depth that flat color cannot provide.

---

## 3. Typography

We use **Inter** as our typographic workhorse. It provides the technical clarity required for small-scale fractional measurements and complex product specifications.

* **Display (3.5rem - 2.25rem):** Set with tight tracking (-0.02em) to feel authoritative and "heavy." Use for main category landings.
* **Headline (2rem - 1.5rem):** The primary organizational anchor. Bold and direct.
* **Title (1.375rem - 1rem):** Used for product names within technical tables.
* **Body (1rem - 0.75rem):** Optimized for high-density spec sheets. `body-sm` is the default for technical data to ensure maximum information density without sacrificing legibility.
* **Label (0.75rem - 0.6875rem):** Used for table headers and metadata. Always uppercase with +0.05em tracking for a "blueprint" aesthetic.

---

## 4. Elevation & Depth

Depth in this system is achieved through **Tonal Layering** rather than structural lines or heavy shadows.

* **The Layering Principle:** Treat the UI as stacked sheets of material. A `surface-container-lowest` (#ffffff) card placed on a `surface-container-low` (#f3f3f3) section creates a natural "lift."
* **Glassmorphism & Depth:** Floating elements, such as "Quick View" modals or dropdown menus, must use a semi-transparent `surface` color with a 12px backdrop-blur. This ensures the high-density content behind the element remains visible but diffused, maintaining the user's spatial context.
* **Ambient Shadows:** If a floating effect is required, use the "Industrial Ambient" shadow: `box-shadow: 0 10px 30px rgba(26, 28, 28, 0.06);`. The shadow color is a tinted version of `on-surface` to mimic natural light.
* **The Ghost Border:** If a boundary is strictly required for accessibility, use a "Ghost Border": `outline-variant` (#c1c7d1) at **15% opacity**.

---

## 5. Components

### Buttons

* **Primary:** Background: `secondary` (#006e21); Text: `on_secondary` (#ffffff). Shape: **3px radius**.
* **Tertiary/Ghost:** No background. Text: `primary`. On hover, apply `surface-container-high`.
* **Interaction:** Active states should utilize a subtle inner shadow to simulate a physical "press" on a tool or switch.

### Faceted Search & Sidebar

Mimic the McMaster-Carr sidebar but remove all dividers. Use `label-sm` for category headers and `body-md` for filter links. Indentation and `surface` color shifts define the hierarchy.

### Detailed Product Tables

These are the core of the experience.

* **No Dividers:** Separate rows using alternating `surface` and `surface-container-low` backgrounds (Zebra striping).
* **Hover State:** Rows must transition to `primary_fixed` (#d0e4ff) on hover to provide an unmistakable focus for the user.
* **Shape:** **0px radius (no rounding)**

### Input Fields

* **Style:** Background: `surface-container-lowest`; Border: 0px.
* **Indicator:** Use a 2px bottom bar of `outline_variant` that transitions to `primary` on focus.
* **Density:** Padding should be compact (8px vertical) to maintain high-density layouts.
* **Shape:** **3px radius**

### Cards / Section Containers

* **Shape:** **5px radius**
* Continue to rely on tonal layering instead of borders for separation

### Industrial-Strength Navigation

The top-tier navigation uses `primary` (#003a63). Use `surface_tint` (#206298) for active tab states. This creates a "command center" feel at the top of the interface.

* **Shape:** **0px radius**

---

## 6. Do's and Don'ts

### Do

* **DO** use 0px border-radius for structural, layout, and data-heavy elements.
* **DO** use subtle radius (3px) for interactive elements to improve usability.
* **DO** use slightly larger radius (5px) for grouping elements like cards and sections to create hierarchy.
* **DO** prioritize text-based navigation. Icons should only be used as supportive elements, never as the sole communicator of a function.
* **DO** use whitespace as a functional separator. If two sections feel cluttered, increase the padding rather than adding a line.
* **DO** align all data to a strict 4px grid to maintain "engineered" alignment.

### Don't

* **DON'T** use large rounded corners (8px+). It softens the brand and clashes with the industrial nature of the products.
* **DON'T** apply rounding to dense tables, grids, or structural layouts.
* **DON'T** use generic grey shadows. Use the "Ambient Shadow" rule to keep the interface feeling premium.
* **DON'T** add "air" for the sake of it. Industrial users prefer information density over "breathable" retail layouts. If a user can see 20 products without scrolling, that is a success.
* **DON'T** use 100% opaque borders. They create visual "noise" that distracts from the technical data.
