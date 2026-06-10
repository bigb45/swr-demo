import { Link } from "@/i18n/navigation";
import type { MagentoAggregation } from "@/types/magento";

interface ProductsActiveFiltersProps {
  active: {
    q?: string;
    category?: string;
    priceMin?: string;
    priceMax?: string;
    facets: Record<string, string[]>;
  };
  categories: Array<{ id: number; name: string }>;
  aggregations: MagentoAggregation[];
  labels: {
    activeFilters: string;
    resultsShowing: string;
    clearAll: string;
    removeFilter: string;
    allCategories: string;
    price: string;
  };
}

interface Chip {
  key: string;
  label: string;
  href: string;
}

function resolveFacetLabel(
  code: string,
  value: string,
  aggregations: MagentoAggregation[],
): string {
  const bucket = aggregations.find((a) => a.attribute_code === code);
  const option = bucket?.options.find((o) => o.value === value);
  return option?.label ?? value;
}

function buildHrefWithoutFacetValue(
  active: ProductsActiveFiltersProps["active"],
  attributeCode: string,
  value: string,
): string {
  const params = new URLSearchParams();
  if (active.q) params.set("q", active.q);
  if (active.category) params.set("category", active.category);
  if (active.priceMin) params.set("priceMin", active.priceMin);
  if (active.priceMax) params.set("priceMax", active.priceMax);

  for (const [code, values] of Object.entries(active.facets)) {
    const next =
      code === attributeCode ? values.filter((v) => v !== value) : values;
    if (next.length > 0) params.set(code, next.join(","));
  }

  const qs = params.toString();
  return `/products${qs ? `?${qs}` : ""}`;
}

function buildHrefWithoutReserved(
  active: ProductsActiveFiltersProps["active"],
  kind: "category" | "price",
): string {
  const params = new URLSearchParams();
  if (active.q) params.set("q", active.q);
  if (kind !== "category" && active.category) {
    params.set("category", active.category);
  }
  if (kind !== "price") {
    if (active.priceMin) params.set("priceMin", active.priceMin);
    if (active.priceMax) params.set("priceMax", active.priceMax);
  }
  for (const [code, values] of Object.entries(active.facets)) {
    if (values.length > 0) params.set(code, values.join(","));
  }
  const qs = params.toString();
  return `/products${qs ? `?${qs}` : ""}`;
}

export default function ProductsActiveFilters({
  active,
  categories,
  aggregations,
  labels,
}: ProductsActiveFiltersProps) {
  const chips: Chip[] = [];

  if (active.category) {
    const categoryName =
      categories.find((c) => String(c.id) === active.category)?.name ??
      active.category;
    chips.push({
      key: `category:${active.category}`,
      label: categoryName,
      href: buildHrefWithoutReserved(active, "category"),
    });
  }

  if (active.priceMin || active.priceMax) {
    const min = active.priceMin ?? "…";
    const max = active.priceMax ?? "…";
    chips.push({
      key: "price",
      label: `${labels.price}: ${min} – ${max}`,
      href: buildHrefWithoutReserved(active, "price"),
    });
  }

  for (const [code, values] of Object.entries(active.facets)) {
    for (const value of values) {
      chips.push({
        key: `${code}:${value}`,
        label: resolveFacetLabel(code, value, aggregations),
        href: buildHrefWithoutFacetValue(active, code, value),
      });
    }
  }

  if (chips.length === 0) {
    return (
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-4">
        {labels.resultsShowing}
      </p>
    );
  }

  const clearHref = (() => {
    const params = new URLSearchParams();
    if (active.q) params.set("q", active.q);
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  })();

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-outline-variant/40">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-on-surface-variant">
        {labels.activeFilters}
      </span>
      <div className="flex flex-wrap gap-1.5 flex-1">
        {chips.map((chip) => (
          <Link
            key={chip.key}
            href={chip.href}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            style={{ borderRadius: "3px" }}
          >
            <span>{chip.label}</span>
            <svg
              viewBox="0 0 10 10"
              aria-hidden="true"
              className="w-2.5 h-2.5"
            >
              <path
                d="M1 1l8 8M9 1l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="square"
              />
            </svg>
            <span className="sr-only">{labels.removeFilter}</span>
          </Link>
        ))}
        <Link
          href={clearHref}
          className="inline-flex items-center px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-secondary hover:underline"
        >
          {labels.clearAll}
        </Link>
      </div>
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant ml-auto">
        {labels.resultsShowing}
      </span>
    </div>
  );
}
