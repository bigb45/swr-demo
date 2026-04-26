import { revalidateTag, unstable_cache } from "next/cache";
import type {
  MagentoCategory,
  MagentoCategoryTree,
  MagentoProduct,
  MagentoProductList,
} from "@/types/magento";

/** Busts `unstable_cache` for the admin token after a 401 from Magento. */
const ADMIN_TOKEN_CACHE_TAG = "magento-admin-token";

const BASE = process.env.MAGENTO_URL ?? "http://localhost:8000";

// Module-level token cache (persists across requests in the same Node.js process)
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function fetchAdminTokenFromMagento(): Promise<string> {
  const user = process.env.MAGENTO_ADMIN_USER;
  const pass = process.env.MAGENTO_ADMIN_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "MAGENTO_ADMIN_USER and MAGENTO_ADMIN_PASSWORD must be set in .env.local"
    );
  }

  const res = await fetch(`${BASE}/rest/V1/integration/admin/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: user, password: pass }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get Magento admin token: ${res.status}`);
  }

  return res.json() as Promise<string>;
}

/** Cached token fetch so layouts do not use `cache: "no-store"` (breaks SSG/ISR). */
const getAdminTokenFromDataCache = unstable_cache(
  fetchAdminTokenFromMagento,
  ["magento-admin-token"],
  { revalidate: 3300, tags: [ADMIN_TOKEN_CACHE_TAG] },
);

async function getAdminToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  // Refresh 5 minutes before expiry (tokens last 1 hour by default)
  if (!forceRefresh && cachedToken && now < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  if (forceRefresh) {
    revalidateTag(ADMIN_TOKEN_CACHE_TAG, "max");
  }

  const token = await getAdminTokenFromDataCache();
  cachedToken = token;
  tokenExpiresAt = now + 60 * 60 * 1000; // 1 hour
  return token;
}

function invalidateAdminToken() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

export async function magentoGet<T>(
  path: string,
  revalidate: number | false = 60,
  storeCode?: string
): Promise<T> {
  const nextOptions =
    revalidate === false
      ? { cache: "no-store" as const }
      : { next: { revalidate } };

  // Magento REST supports per-store-view scoping via /rest/<storeCode>/V1/...
  // Calls without a storeCode target the default admin scope.
  const prefix = storeCode ? `/rest/${storeCode}/V1` : `/rest/V1`;

  const doFetch = async (token: string) =>
    fetch(`${BASE}${prefix}${path}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...nextOptions,
    });

  let token = await getAdminToken();
  let res = await doFetch(token);

  // If Magento rejected the cached token (e.g. admin re-login, token revoked,
  // or server-side TTL shorter than our cache), refresh once and retry.
  if (res.status === 401) {
    invalidateAdminToken();
    token = await getAdminToken(true);
    res = await doFetch(token);
  }

  if (!res.ok) {
    throw new Error(
      `Magento REST error: ${res.status} ${res.statusText} — ${path}`
    );
  }

  return res.json() as Promise<T>;
}

export async function getProducts(pageSize = 8): Promise<MagentoProductList> {
  return magentoGet<MagentoProductList>(
    `/products?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=1`
  );
}

export async function getProductsPaginated(
  page = 1,
  pageSize = 20
): Promise<MagentoProductList> {
  return magentoGet<MagentoProductList>(
    `/products?searchCriteria[pageSize]=${pageSize}&searchCriteria[currentPage]=${page}`
  );
}

export async function getProductBySku(sku: string): Promise<MagentoProduct> {
  return magentoGet<MagentoProduct>(
    `/products/${encodeURIComponent(sku)}`,
    false
  );
}

export async function getCategoryTree(): Promise<MagentoCategoryTree> {
  return magentoGet<MagentoCategoryTree>("/categories");
}

export async function getTopLevelCategories(): Promise<MagentoCategory[]> {
  const tree = await getCategoryTree();
  return tree.children_data.filter((c) => c.is_active);
}

export async function getProductsByCategory(
  categoryId: string | number,
  page = 1,
  pageSize = 20
): Promise<MagentoProductList> {
  const params = new URLSearchParams({
    "searchCriteria[filter_groups][0][filters][0][field]": "category_id",
    "searchCriteria[filter_groups][0][filters][0][value]": String(categoryId),
    "searchCriteria[filter_groups][0][filters][0][condition_type]": "eq",
    "searchCriteria[currentPage]": String(page),
    "searchCriteria[pageSize]": String(pageSize),
  });
  return magentoGet<MagentoProductList>(`/products?${params.toString()}`);
}

export async function searchProducts(
  query: string,
  page = 1,
  pageSize = 20
): Promise<MagentoProductList> {
  const params = new URLSearchParams({
    "searchCriteria[filter_groups][0][filters][0][field]": "name",
    "searchCriteria[filter_groups][0][filters][0][value]": `%${query}%`,
    "searchCriteria[filter_groups][0][filters][0][condition_type]": "like",
    "searchCriteria[currentPage]": String(page),
    "searchCriteria[pageSize]": String(pageSize),
  });
  return magentoGet<MagentoProductList>(`/products?${params.toString()}`, false);
}

/**
 * Criteria for the filtered `/products` listing. Every field is optional; the
 * helper composes Magento `searchCriteria` filter_groups only for what's set.
 *
 * `q`, `categoryId`, `priceMin`, `priceMax` each become a separate
 * filter_group — Magento AND-combines groups while OR-combining filters
 * inside one group, so one filter per group gives us strict AND semantics.
 */
export interface ProductSearchFilters {
  q?: string;
  categoryId?: string | number;
  priceMin?: number;
  priceMax?: number;
}

export async function getFilteredProducts(
  page = 1,
  pageSize = 20,
  filters: ProductSearchFilters = {},
): Promise<MagentoProductList> {
  const params = new URLSearchParams();
  let group = 0;

  const addFilter = (field: string, value: string, conditionType: string) => {
    const prefix = `searchCriteria[filter_groups][${group}][filters][0]`;
    params.set(`${prefix}[field]`, field);
    params.set(`${prefix}[value]`, value);
    params.set(`${prefix}[condition_type]`, conditionType);
    group += 1;
  };

  if (filters.q && filters.q.trim().length > 0) {
    addFilter("name", `%${filters.q.trim()}%`, "like");
  }
  if (filters.categoryId !== undefined && filters.categoryId !== "") {
    addFilter("category_id", String(filters.categoryId), "eq");
  }
  if (typeof filters.priceMin === "number" && Number.isFinite(filters.priceMin)) {
    addFilter("price", String(filters.priceMin), "gteq");
  }
  if (typeof filters.priceMax === "number" && Number.isFinite(filters.priceMax)) {
    addFilter("price", String(filters.priceMax), "lteq");
  }

  params.set("searchCriteria[currentPage]", String(page));
  params.set("searchCriteria[pageSize]", String(pageSize));

  const cacheSeconds = filters.q ? false : 60;
  return magentoGet<MagentoProductList>(
    `/products?${params.toString()}`,
    cacheSeconds,
  );
}
