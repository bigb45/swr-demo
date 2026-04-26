"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import type {
  CatalogCategory,
  CatalogFacets,
  DocumentType,
  FacetCount,
} from "@/lib/catalog";

type FilterKey = "category" | "type" | "brand" | "language";

interface ActiveFiltersState {
  q?: string;
  types?: DocumentType[];
  categories?: CatalogCategory[];
  brands?: string[];
  languages?: string[];
}

interface FilterSidebarProps {
  facets: CatalogFacets;
  active: ActiveFiltersState;
  labels: {
    title: string;
    subtitle: string;
    sectionCategory: string;
    sectionType: string;
    sectionBrand: string;
    sectionLanguage: string;
    clearAll: string;
    manufacturerSearch: string;
    typeLabels: Record<string, string>;
    categoryLabels: Record<string, string>;
    languageLabels: Record<string, string>;
  };
}

interface Selection {
  categories: string[];
  types: string[];
  brands: string[];
  languages: string[];
}

const FILTER_TO_SEL_KEY: Record<FilterKey, keyof Selection> = {
  category: "categories",
  type: "types",
  brand: "brands",
  language: "languages",
};

function selectionFromActive(active: ActiveFiltersState): Selection {
  return {
    categories: active.categories ?? [],
    types: active.types ?? [],
    brands: active.brands ?? [],
    languages: active.languages ?? [],
  };
}

function buildHref(q: string | undefined, sel: Selection): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sel.categories.length > 0) params.set("category", sel.categories.join(","));
  if (sel.types.length > 0) params.set("type", sel.types.join(","));
  if (sel.brands.length > 0) params.set("brand", sel.brands.join(","));
  if (sel.languages.length > 0) params.set("language", sel.languages.join(","));
  const qs = params.toString();
  return `/catalog${qs ? `?${qs}` : ""}`;
}

function toggleValue(list: string[], value: string): string[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  return [...list, value];
}

interface AccordionSectionProps {
  heading: string;
  activeCount: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({
  heading,
  activeCount,
  isOpen,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <section className="border-b border-outline-variant/40">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-on-surface">
          {heading}
          {activeCount > 0 ? (
            <span
              className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-primary text-on-primary tabular-nums align-middle"
              style={{ borderRadius: "3px" }}
            >
              {activeCount}
            </span>
          ) : null}
        </span>
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={`w-3 h-3 text-on-surface-variant transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path
            d="M2 4l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>
      </button>
      {isOpen ? <div className="pb-4">{children}</div> : null}
    </section>
  );
}

interface CheckboxListProps {
  items: FacetCount[];
  activeValues: string[];
  onToggle: (value: string) => void;
  resolveLabel: (value: string) => string;
}

function CheckboxList({
  items,
  activeValues,
  onToggle,
  resolveLabel,
}: CheckboxListProps) {
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((f) => {
        const checked = activeValues.includes(f.value);
        return (
          <li key={f.value}>
            <label
              className={`flex items-center gap-2 py-1.5 px-2 cursor-pointer transition-colors ${
                checked
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface hover:bg-surface-container-low"
              }`}
              style={{ borderRadius: "3px" }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(f.value)}
                className="w-3.5 h-3.5 shrink-0 accent-primary"
              />
              <span
                className={`flex-1 truncate text-sm ${
                  checked ? "font-bold" : ""
                }`}
              >
                {resolveLabel(f.value)}
              </span>
              <span className="text-[11px] text-on-surface-variant tabular-nums">
                {f.count}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export default function FilterSidebar({
  facets,
  active,
  labels,
}: FilterSidebarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [openSection, setOpenSection] = useState<FilterKey | null>("category");
  const [brandSearch, setBrandSearch] = useState("");

  // Optimistic local selection — initialized from props and synced when the URL
  // (and therefore props) changes. The ref mirrors the state so rapid clicks
  // always compute the next selection from the latest value (React may batch
  // re-renders, so the `selection` closure can lag behind a previous click).
  const [selection, setSelection] = useState<Selection>(() =>
    selectionFromActive(active)
  );
  const selectionRef = useRef<Selection>(selection);

  useEffect(() => {
    const fromProps = selectionFromActive(active);
    selectionRef.current = fromProps;
    setSelection(fromProps);
  }, [active]);

  const activeCounts = useMemo(
    () => ({
      category: selection.categories.length,
      type: selection.types.length,
      brand: selection.brands.length,
      language: selection.languages.length,
    }),
    [selection]
  );

  const hasActive =
    activeCounts.category +
      activeCounts.type +
      activeCounts.brand +
      activeCounts.language >
      0 || !!active.q;

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return facets.brands;
    return facets.brands.filter((b) => b.value.toLowerCase().includes(q));
  }, [facets.brands, brandSearch]);

  const handleToggle = (key: FilterKey, value: string) => {
    const selKey = FILTER_TO_SEL_KEY[key];
    const current = selectionRef.current;
    const next: Selection = {
      ...current,
      [selKey]: toggleValue(current[selKey], value),
    };
    selectionRef.current = next;
    setSelection(next);
    startTransition(() => {
      router.push(buildHref(active.q, next));
    });
  };

  const handleClear = () => {
    const next: Selection = {
      categories: [],
      types: [],
      brands: [],
      languages: [],
    };
    selectionRef.current = next;
    setSelection(next);
    startTransition(() => {
      router.push(buildHref(active.q, next));
    });
  };

  const toggleOpen = (key: FilterKey) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  return (
    <aside
      className={`flex flex-col self-start ${
        isPending ? "opacity-90" : ""
      }`}
    >
      <div className="flex items-start justify-between pb-3 border-b border-outline-variant/60">
        <div className="flex flex-col">
          <span className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">
            {labels.title}
          </span>
          <span className="text-[11px] uppercase tracking-[0.08em] text-on-surface-variant">
            {labels.subtitle}
          </span>
        </div>
        {hasActive ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-bold uppercase tracking-[0.08em] text-secondary hover:underline"
          >
            {labels.clearAll}
          </button>
        ) : null}
      </div>

      <AccordionSection
        heading={labels.sectionCategory}
        activeCount={activeCounts.category}
        isOpen={openSection === "category"}
        onToggle={() => toggleOpen("category")}
      >
        <CheckboxList
          items={facets.categories}
          activeValues={selection.categories}
          onToggle={(v) => handleToggle("category", v)}
          resolveLabel={(v) => labels.categoryLabels[v] ?? v}
        />
      </AccordionSection>

      <AccordionSection
        heading={labels.sectionBrand}
        activeCount={activeCounts.brand}
        isOpen={openSection === "brand"}
        onToggle={() => toggleOpen("brand")}
      >
        <div className="mb-2 px-2">
          <input
            type="search"
            value={brandSearch}
            onChange={(e) => setBrandSearch(e.target.value)}
            placeholder={labels.manufacturerSearch}
            className="w-full text-sm px-2 py-1.5 bg-surface-container-lowest border border-outline-variant/60 focus:border-primary focus:outline-none"
            style={{ borderRadius: "3px" }}
          />
        </div>
        <CheckboxList
          items={filteredBrands}
          activeValues={selection.brands}
          onToggle={(v) => handleToggle("brand", v)}
          resolveLabel={(v) => v}
        />
      </AccordionSection>

      <AccordionSection
        heading={labels.sectionType}
        activeCount={activeCounts.type}
        isOpen={openSection === "type"}
        onToggle={() => toggleOpen("type")}
      >
        <CheckboxList
          items={facets.types}
          activeValues={selection.types}
          onToggle={(v) => handleToggle("type", v)}
          resolveLabel={(v) => labels.typeLabels[v] ?? v}
        />
      </AccordionSection>

      <AccordionSection
        heading={labels.sectionLanguage}
        activeCount={activeCounts.language}
        isOpen={openSection === "language"}
        onToggle={() => toggleOpen("language")}
      >
        <CheckboxList
          items={facets.languages}
          activeValues={selection.languages}
          onToggle={(v) => handleToggle("language", v)}
          resolveLabel={(v) => labels.languageLabels[v] ?? v.toUpperCase()}
        />
      </AccordionSection>
    </aside>
  );
}
