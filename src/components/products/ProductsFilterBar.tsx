"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { MagentoAggregation, MagentoCategory } from "@/types/magento";
import { PRODUCT_LIST_RESERVED_PARAMS } from "@/lib/magento-shared";
import { isFacetVisibleForCategory } from "@/lib/category-filters";

interface ProductsFilterBarProps {
  categories: MagentoCategory[];
  aggregations: MagentoAggregation[];
  activeCategoryName?: string;
  active: {
    category?: string;
    priceMin?: string;
    priceMax?: string;
    facets: Record<string, string[]>;
  };
}

interface PriceFilterFieldsProps {
  initialMin: string;
  initialMax: string;
  minPlaceholder: string;
  maxPlaceholder: string;
  applyLabel: string;
  onApply: (min: string, max: string) => void;
}

function toggleValue(list: string[], value: string): string[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  return [...list, value];
}

const USER_FACING_FACETS = new Set([
  "manufacturer",
  "brand",
  "country_of_manufacture",
  "welding_process",
  "current_type",
  "duty_cycle",
  "voltage",
  "battery_platform",
  "power_kw",
  "pressure_bar",
  "protection_class",
  "norm",
]);

const FACET_LABEL_KEYS: Record<string, string> = {
  manufacturer: "facets.manufacturer",
  brand: "facets.brand",
  country_of_manufacture: "facets.countryOfManufacture",
  welding_process: "facets.weldingProcess",
  current_type: "facets.currentType",
  duty_cycle: "facets.dutyCycle",
  voltage: "facets.voltage",
  battery_platform: "facets.batteryPlatform",
  power_kw: "facets.powerKw",
  pressure_bar: "facets.pressureBar",
  protection_class: "facets.protectionClass",
  norm: "facets.norm",
};

function PriceFilterFields({
  initialMin,
  initialMax,
  minPlaceholder,
  maxPlaceholder,
  applyLabel,
  onApply,
}: PriceFilterFieldsProps) {
  const [priceMin, setPriceMin] = useState(initialMin);
  const [priceMax, setPriceMax] = useState(initialMax);

  function applyPrice() {
    onApply(priceMin, priceMax);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          placeholder={minPlaceholder}
          className="w-full text-sm px-2 py-1.5 bg-surface-container-lowest border border-outline-variant/60 focus:border-primary focus:outline-none"
          style={{ borderRadius: "3px" }}
        />
        <span className="text-on-surface-variant">-</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          placeholder={maxPlaceholder}
          className="w-full text-sm px-2 py-1.5 bg-surface-container-lowest border border-outline-variant/60 focus:border-primary focus:outline-none"
          style={{ borderRadius: "3px" }}
        />
      </div>
      <button
        type="button"
        onClick={applyPrice}
        className="w-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest bg-secondary text-on-secondary hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] transition-all rounded-(--radius-btn)"
      >
        {applyLabel}
      </button>
    </>
  );
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

function facetSelectionFromActive(
  active: ProductsFilterBarProps["active"],
): Record<string, string[]> {
  return { ...active.facets };
}

function facetSelectionKey(selection: Record<string, string[]>): string {
  return Object.entries(selection)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, values]) => `${code}:${[...values].sort().join(",")}`)
    .join("|");
}

/**
 * URL-state filter sidebar for `/products`. Category + price are first-class;
 * Magento search aggregations render as accordion attribute facets below.
 */
export default function ProductsFilterBar({
  categories,
  aggregations,
  activeCategoryName,
  active,
}: ProductsFilterBarProps) {
  const t = useTranslations("products.filter");
  const locale = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [openFacet, setOpenFacet] = useState<string | null>(
    aggregations[0]?.attribute_code ?? null,
  );
  const [manufacturerSearch, setManufacturerSearch] = useState("");
  const activeFacetSelection = facetSelectionFromActive(active);
  const activeFacetKey = facetSelectionKey(activeFacetSelection);
  const [facetSelectionState, setFacetSelectionState] = useState(() => ({
    activeKey: activeFacetKey,
    selection: activeFacetSelection,
  }));
  const facetSelection =
    facetSelectionState.activeKey === activeFacetKey
      ? facetSelectionState.selection
      : activeFacetSelection;
  const facetSelectionRef = useRef(facetSelection);

  useEffect(() => {
    facetSelectionRef.current = facetSelection;
  }, [facetSelection]);

  function pushParams(params: URLSearchParams) {
    params.delete("page");
    const query = params.toString();
    const href = query ? `/${locale}/products?${query}` : `/${locale}/products`;
    startTransition(() => {
      router.push(href);
    });
  }

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(search?.toString() ?? "");
    if (value && value.length > 0) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    pushParams(params);
  }

  function applyPrice(min: string, max: string) {
    const params = new URLSearchParams(search?.toString() ?? "");
    if (min.trim()) params.set("priceMin", min.trim());
    else params.delete("priceMin");
    if (max.trim()) params.set("priceMax", max.trim());
    else params.delete("priceMax");
    pushParams(params);
  }

  function clearAll() {
    const params = new URLSearchParams();
    const q = search?.get("q");
    if (q) params.set("q", q);
    pushParams(params);
  }

  function handleFacetToggle(attributeCode: string, value: string) {
    const current = facetSelectionRef.current;
    const currentValues = current[attributeCode] ?? [];
    const nextValues = toggleValue(currentValues, value);
    const next: Record<string, string[]> = { ...current };
    if (nextValues.length > 0) next[attributeCode] = nextValues;
    else delete next[attributeCode];
    facetSelectionRef.current = next;
    setFacetSelectionState({ activeKey: activeFacetKey, selection: next });

    const params = new URLSearchParams(search?.toString() ?? "");
    for (const key of [...params.keys()]) {
      if (!PRODUCT_LIST_RESERVED_PARAMS.has(key)) params.delete(key);
    }
    for (const [code, values] of Object.entries(next)) {
      if (values.length > 0) params.set(code, values.join(","));
    }
    pushParams(params);
  }

  const facetActiveCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const [code, values] of Object.entries(facetSelection)) {
      counts[code] = values.length;
    }
    return counts;
  }, [facetSelection]);

  const hasActive =
    !!active.category ||
    !!active.priceMin ||
    !!active.priceMax ||
    Object.values(active.facets).some((values) => values.length > 0);

  const filteredManufacturerOptions = useMemo(() => {
    const bucket = aggregations.find(
      (a) =>
        a.attribute_code === "manufacturer" ||
        a.attribute_code === "brand",
    );
    if (!bucket) return [];
    const q = manufacturerSearch.trim().toLowerCase();
    if (!q) return bucket.options;
    return bucket.options.filter((opt) =>
      opt.label.toLowerCase().includes(q),
    );
  }, [aggregations, manufacturerSearch]);

  return (
    <aside
      className={`flex flex-col gap-5 self-start ${isPending ? "opacity-80" : ""}`}
    >
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
        <span className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">
          {t("heading")}
        </span>
        {hasActive && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] font-bold uppercase tracking-[0.08em] text-secondary hover:underline"
          >
            {t("clearAll")}
          </button>
        )}
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.12em] text-on-surface">
          {t("category")}
        </h3>
        <ul className="flex flex-col gap-0.5">
          <li>
            <button
              type="button"
              onClick={() => setParam("category", undefined)}
              className={`w-full text-left text-sm px-2 py-1.5 ${
                !active.category
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-on-surface hover:bg-surface-container-low"
              }`}
              style={{ borderRadius: "3px" }}
            >
              {t("allCategories")}
            </button>
          </li>
          {categories.map((c) => {
            const checked = active.category === String(c.id);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setParam("category", String(c.id))}
                  className={`w-full text-left text-sm px-2 py-1.5 ${
                    checked
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-on-surface hover:bg-surface-container-low"
                  }`}
                  style={{ borderRadius: "3px" }}
                >
                  {c.name}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.12em] text-on-surface">
          {t("price")}
        </h3>
        <PriceFilterFields
          key={`${active.priceMin ?? ""}|${active.priceMax ?? ""}`}
          initialMin={active.priceMin ?? ""}
          initialMax={active.priceMax ?? ""}
          minPlaceholder={t("priceMin")}
          maxPlaceholder={t("priceMax")}
          applyLabel={t("apply")}
          onApply={applyPrice}
        />
      </section>

      {aggregations
        .filter(
          (bucket) =>
            USER_FACING_FACETS.has(bucket.attribute_code) &&
            isFacetVisibleForCategory(
              bucket.attribute_code,
              activeCategoryName,
            ),
        )
        .map((bucket) => {
        const isManufacturer =
          bucket.attribute_code === "manufacturer" ||
          bucket.attribute_code === "brand";
        const options = isManufacturer
          ? filteredManufacturerOptions
          : bucket.options;
        const activeValues = facetSelection[bucket.attribute_code] ?? [];

        return (
          <AccordionSection
            key={bucket.attribute_code}
            heading={
              FACET_LABEL_KEYS[bucket.attribute_code]
                ? t(FACET_LABEL_KEYS[bucket.attribute_code])
                : bucket.label || bucket.attribute_code.replace(/_/g, " ")
            }
            activeCount={facetActiveCounts[bucket.attribute_code] ?? 0}
            isOpen={openFacet === bucket.attribute_code}
            onToggle={() =>
              setOpenFacet((prev) =>
                prev === bucket.attribute_code ? null : bucket.attribute_code,
              )
            }
          >
            {isManufacturer ? (
              <div className="mb-2 px-2">
                <input
                  type="search"
                  value={manufacturerSearch}
                  onChange={(e) => setManufacturerSearch(e.target.value)}
                  placeholder={t("manufacturerSearch")}
                  className="w-full text-sm px-2 py-1.5 bg-surface-container-lowest border border-outline-variant/60 focus:border-primary focus:outline-none"
                  style={{ borderRadius: "3px" }}
                />
              </div>
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {options.map((opt) => {
                const checked = activeValues.includes(opt.value);
                return (
                  <li key={opt.value}>
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
                        onChange={() =>
                          handleFacetToggle(bucket.attribute_code, opt.value)
                        }
                        className="w-3.5 h-3.5 shrink-0 accent-primary"
                      />
                      <span
                        className={`flex-1 truncate text-sm ${
                          checked ? "font-bold" : ""
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-on-surface-variant tabular-nums">
                        {opt.count}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </AccordionSection>
        );
      })}
    </aside>
  );
}
