/**
 * Category-scoped facet configuration for `/products` (A4 phase 1).
 * Maps Magento category ids/names to the attribute facets shown in the filter sidebar.
 * Backend must expose matching aggregations for full usefulness.
 */

export interface CategoryFacetConfig {
  /** Magento attribute codes to surface when this category is active. */
  facets: string[];
  /** Optional extra facets when backend adds category-specific attrs. */
  extendedFacets?: string[];
}

/** Default facets for unscoped or unknown categories. */
export const DEFAULT_PRODUCT_FACETS = [
  "manufacturer",
  "brand",
  "country_of_manufacture",
] as const;

/**
 * Category-specific facet sets keyed by normalized category name substring.
 * First match wins when `?category=` is active.
 */
const CATEGORY_FACET_RULES: { match: RegExp; config: CategoryFacetConfig }[] = [
  {
    match: /schwei[sß]|weld/i,
    config: {
      facets: ["manufacturer", "brand", "country_of_manufacture"],
      extendedFacets: ["welding_process", "current_type", "duty_cycle"],
    },
  },
  {
    match: /werkzeug|tool|schraub/i,
    config: {
      facets: ["manufacturer", "brand", "country_of_manufacture"],
      extendedFacets: ["voltage", "battery_platform"],
    },
  },
  {
    match: /maschine|machine|druckluft|compressed/i,
    config: {
      facets: ["manufacturer", "brand", "country_of_manufacture"],
      extendedFacets: ["power_kw", "pressure_bar"],
    },
  },
  {
    match: /arbeitsschutz|safety|schutz/i,
    config: {
      facets: ["manufacturer", "brand", "country_of_manufacture"],
      extendedFacets: ["protection_class", "norm"],
    },
  },
];

function normalizeCategoryName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Resolve facet attribute codes for the active category filter.
 * Falls back to DEFAULT_PRODUCT_FACETS when no rule matches.
 */
export function getCategoryFacetCodes(
  categoryName: string | undefined,
): string[] {
  if (!categoryName?.trim()) {
    return [...DEFAULT_PRODUCT_FACETS];
  }
  const normalized = normalizeCategoryName(categoryName);
  for (const rule of CATEGORY_FACET_RULES) {
    if (rule.match.test(normalized)) {
      return [
        ...rule.config.facets,
        ...(rule.config.extendedFacets ?? []),
      ];
    }
  }
  return [...DEFAULT_PRODUCT_FACETS];
}

/** Whether an aggregation bucket should render for the active category scope. */
export function isFacetVisibleForCategory(
  attributeCode: string,
  categoryName: string | undefined,
): boolean {
  const allowed = new Set(getCategoryFacetCodes(categoryName));
  return allowed.has(attributeCode);
}
