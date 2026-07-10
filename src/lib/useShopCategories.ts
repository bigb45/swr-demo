"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import type { ShopCategoryNavItem } from "@/lib/shop-categories";

/**
 * Module-level cache keyed by locale so the mega menu / mobile nav fetch the
 * top-level categories at most once per locale for the whole SPA session.
 */
const cache = new Map<string, Promise<ShopCategoryNavItem[]>>();

function loadTopLevelCategories(
  locale: string,
): Promise<ShopCategoryNavItem[]> {
  const cached = cache.get(locale);
  if (cached) return cached;

  const request = fetch(
    `/api/categories/top-level?locale=${encodeURIComponent(locale)}`,
  )
    .then((res) => (res.ok ? res.json() : []))
    .then((data) =>
      Array.isArray(data) ? (data as ShopCategoryNavItem[]) : [],
    )
    .catch(() => {
      // Drop the failed promise so a later open can retry.
      cache.delete(locale);
      return [] as ShopCategoryNavItem[];
    });

  cache.set(locale, request);
  return request;
}

/**
 * Lazily loads the shop mega-menu categories. Nothing is fetched until
 * `enabled` flips to `true` (e.g. the first time the menu is opened).
 */
export function useShopCategories(enabled: boolean): {
  categories: ShopCategoryNavItem[];
  loading: boolean;
} {
  const locale = useLocale();
  const [categories, setCategories] = useState<ShopCategoryNavItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);
    loadTopLevelCategories(locale).then((items) => {
      if (!active) return;
      setCategories(items);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [enabled, locale]);

  return { categories, loading };
}
