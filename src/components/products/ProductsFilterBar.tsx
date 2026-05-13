"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { MagentoCategory } from "@/types/magento";

interface ProductsFilterBarProps {
  categories: MagentoCategory[];
  active: {
    category?: string;
    priceMin?: string;
    priceMax?: string;
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

/**
 * URL-state filter sidebar for `/products`. Talks to Magento via plain
 * `searchCriteria` — no GraphQL, no facet counts (that's a separate API
 * spike). Category is the highest-value filter; price range is secondary.
 */
export default function ProductsFilterBar({
  categories,
  active,
}: ProductsFilterBarProps) {
  const t = useTranslations("products.filter");
  const locale = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function pushWith(params: URLSearchParams) {
    // Always drop `page` on any filter change so the user lands on page 1 of
    // the new result set.
    params.delete("page");
    startTransition(() => {
      router.push(`/${locale}/products?${params.toString()}`);
    });
  }

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(search?.toString() ?? "");
    if (value && value.length > 0) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    pushWith(params);
  }

  function applyPrice(min: string, max: string) {
    const params = new URLSearchParams(search?.toString() ?? "");
    if (min.trim()) params.set("priceMin", min.trim());
    else params.delete("priceMin");
    if (max.trim()) params.set("priceMax", max.trim());
    else params.delete("priceMax");
    pushWith(params);
  }

  function clearAll() {
    const params = new URLSearchParams();
    // Keep the search query so clearing filters doesn't also wipe the
    // user's keyword search — that's a separate affordance.
    const q = search?.get("q");
    if (q) params.set("q", q);
    pushWith(params);
  }

  const hasActive =
    !!active.category || !!active.priceMin || !!active.priceMax;

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
    </aside>
  );
}
