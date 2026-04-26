import { Link } from "@/i18n/navigation";
import type { CatalogCategory, DocumentType } from "@/lib/catalog";

type FilterKind = "category" | "type" | "brand" | "language";

interface ActiveFiltersProps {
  active: {
    q?: string;
    types?: DocumentType[];
    categories?: CatalogCategory[];
    brands?: string[];
    languages?: string[];
  };
  totalCount: number;
  labels: {
    activeFilters: string;
    resultsShowing: string;
    clearAll: string;
    typeLabels: Record<string, string>;
    categoryLabels: Record<string, string>;
    languageLabels: Record<string, string>;
  };
}

interface Chip {
  kind: FilterKind;
  value: string;
  label: string;
}

function buildHrefWithout(
  active: ActiveFiltersProps["active"],
  kind: FilterKind,
  value: string
): string {
  const params = new URLSearchParams();
  if (active.q) params.set("q", active.q);

  const categories =
    kind === "category"
      ? (active.categories ?? []).filter((v) => v !== value)
      : active.categories ?? [];
  const types =
    kind === "type"
      ? (active.types ?? []).filter((v) => v !== value)
      : active.types ?? [];
  const brands =
    kind === "brand"
      ? (active.brands ?? []).filter((v) => v !== value)
      : active.brands ?? [];
  const languages =
    kind === "language"
      ? (active.languages ?? []).filter((v) => v !== value)
      : active.languages ?? [];

  if (categories.length > 0) params.set("category", categories.join(","));
  if (types.length > 0) params.set("type", types.join(","));
  if (brands.length > 0) params.set("brand", brands.join(","));
  if (languages.length > 0) params.set("language", languages.join(","));

  const qs = params.toString();
  return `/catalog${qs ? `?${qs}` : ""}`;
}

export default function ActiveFilters({
  active,
  totalCount,
  labels,
}: ActiveFiltersProps) {
  const chips: Chip[] = [];
  for (const v of active.categories ?? []) {
    chips.push({
      kind: "category",
      value: v,
      label: labels.categoryLabels[v] ?? v,
    });
  }
  for (const v of active.types ?? []) {
    chips.push({
      kind: "type",
      value: v,
      label: labels.typeLabels[v] ?? v,
    });
  }
  for (const v of active.brands ?? []) {
    chips.push({ kind: "brand", value: v, label: v });
  }
  for (const v of active.languages ?? []) {
    chips.push({
      kind: "language",
      value: v,
      label: labels.languageLabels[v] ?? v.toUpperCase(),
    });
  }

  const hasChips = chips.length > 0;

  if (!hasChips) {
    return (
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-on-surface-variant mb-4">
        {labels.resultsShowing}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-outline-variant/40">
      <span className="text-[11px] font-black uppercase tracking-[0.12em] text-on-surface-variant">
        {labels.activeFilters}
      </span>
      <div className="flex flex-wrap gap-1.5 flex-1">
        {chips.map((c) => (
          <Link
            key={`${c.kind}:${c.value}`}
            href={buildHrefWithout(active, c.kind, c.value)}
            className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            style={{ borderRadius: "3px" }}
          >
            <span>{c.label}</span>
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
            <span className="sr-only">Remove filter</span>
          </Link>
        ))}
        <Link
          href="/catalog"
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
