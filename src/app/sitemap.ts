import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { listAllDocumentIds } from "@/lib/catalog";
import {
  listActiveCategoryIdsForSitemap,
  listProductSkusForSitemap,
} from "@/lib/magento";

/** Soft cap so a hanging Magento call cannot stall `next build` past Next's budget. */
const MAGENTO_SITEMAP_TIMEOUT_MS = 20_000;

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://www.swr-loerrach.de"
  );
}

// Static routes that every locale exposes. Kept in one place so the sitemap
// stays in sync with the site shell.
const STATIC_PATHS: string[] = [
  "",
  "/shop",
  "/products",
  "/catalog",
  "/offers",
  "/services",
  "/services/consulting",
  "/services/repair",
  "/services/delivery",
  "/services/customs",
  "/about",
  "/contact",
  "/partners",
  "/careers",
  "/certificates",
  "/legal/imprint",
  "/legal/terms",
  "/legal/privacy",
  "/legal/cookies",
  "/legal/compliance",
  "/legal/sds",
];

function buildAlternates(path: string): Record<string, string> {
  const base = getBaseUrl();
  const alternates: Record<string, string> = {};
  for (const locale of routing.locales) {
    alternates[locale] = `${base}/${locale}${path}`;
  }
  return alternates;
}

function entry(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly",
  priority = 0.6
): MetadataRoute.Sitemap[number] {
  const base = getBaseUrl();
  return {
    url: `${base}/${routing.defaultLocale}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
    alternates: { languages: buildAlternates(path) },
  };
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`sitemap Magento call timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) =>
    entry(p, p === "" ? "daily" : "weekly", p === "" ? 1 : 0.7)
  );

  try {
    const docIds = await listAllDocumentIds();
    for (const id of docIds) {
      entries.push(entry(`/catalog/${id}`, "monthly", 0.5));
    }
  } catch {
    // Catalog repository unavailable: skip document entries.
  }

  // Use /categories/list (fast) — never getCategoryTree() / GET /categories,
  // which takes minutes on this catalog and trips the 60s build timeout.
  try {
    const categoryIds = await withTimeout(
      listActiveCategoryIdsForSitemap(),
      MAGENTO_SITEMAP_TIMEOUT_MS,
    );
    for (const id of categoryIds) {
      entries.push(entry(`/categories/${id}`, "weekly", 0.5));
    }
  } catch {
    // Magento offline / slow: skip category entries rather than failing the build.
  }

  // Cap + SKU-only fields keep generation cheap for SEO without full payloads.
  try {
    const skus = await withTimeout(
      listProductSkusForSitemap(500),
      MAGENTO_SITEMAP_TIMEOUT_MS,
    );
    for (const sku of skus) {
      entries.push(
        entry(`/products/${encodeURIComponent(sku)}`, "weekly", 0.6),
      );
    }
  } catch {
    // Magento offline / slow: skip product entries.
  }

  return entries;
}
