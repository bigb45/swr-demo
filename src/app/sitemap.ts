import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { INDUSTRY_SLUGS } from "@/lib/industries";
import { listAllDocumentIds } from "@/lib/catalog";
import { getProductsPaginated, getCategoryTree } from "@/lib/magento";
import type { MagentoCategory } from "@/types/magento";

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
  "/products",
  "/catalog",
  "/offers",
  "/industries",
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
  "/legal/compliance",
  "/legal/sds",
];

function flattenCategories(
  root: MagentoCategory,
  out: MagentoCategory[] = []
): MagentoCategory[] {
  if (root.id !== 1 && root.id !== 2) out.push(root);
  if (Array.isArray(root.children_data)) {
    for (const child of root.children_data) flattenCategories(child, out);
  }
  return out;
}

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) =>
    entry(p, p === "" ? "daily" : "weekly", p === "" ? 1 : 0.7)
  );

  for (const slug of INDUSTRY_SLUGS) {
    entries.push(entry(`/industries/${slug}`, "weekly", 0.7));
  }

  try {
    const docIds = await listAllDocumentIds();
    for (const id of docIds) {
      entries.push(entry(`/catalog/${id}`, "monthly", 0.5));
    }
  } catch {
    // Catalog repository unavailable: skip document entries.
  }

  try {
    const tree = await getCategoryTree();
    const categories = flattenCategories(tree);
    for (const cat of categories) {
      entries.push(entry(`/categories/${cat.id}`, "weekly", 0.5));
    }
  } catch {
    // Magento offline: skip category entries rather than failing the sitemap.
  }

  // Pull a capped list of products. Full product catalogs can be large; we
  // fetch a single page to keep the sitemap cheap to generate. Increase the
  // size if SEO needs the full catalog surfaced.
  try {
    const list = await getProductsPaginated(1, 500);
    for (const product of list.items) {
      entries.push(
        entry(
          `/products/${encodeURIComponent(product.sku)}`,
          "weekly",
          0.6
        )
      );
    }
  } catch {
    // Magento offline: skip product entries.
  }

  return entries;
}
