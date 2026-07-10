import { revalidateTag, unstable_cache } from "next/cache";
import { PRODUCT_LIST_RESERVED_PARAMS } from "@/lib/magento-shared";
import { broadcastServerLog } from "@/lib/devLogBridge";
import type {
  MagentoAggregation,
  MagentoCategory,
  MagentoCategoryTree,
  MagentoProduct,
  MagentoProductList,
  MagentoProductListWithAggregations,
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
    const detail = await res.text().catch(() => "");
    const hint =
      res.status === 401
        ? " Check MAGENTO_ADMIN_USER / MAGENTO_ADMIN_PASSWORD for this host (they must match a valid Magento admin user on that instance). If the storefront uses Apache from the project root, MAGENTO_URL may need a /pub suffix."
        : "";
    throw new Error(
      `Failed to get Magento admin token: ${res.status}${hint}${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
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

const VERBOSE =
  process.env.NODE_ENV !== "production" &&
  process.env.MAGENTO_LOG_VERBOSE !== "0";

async function logMagentoCall(opts: {
  method: string;
  url: string;
  reqHeaders: Record<string, string>;
  reqBody?: unknown;
  res: Response;
  ms: number;
}) {
  const { method, url, reqHeaders, reqBody, res, ms } = opts;
  const summary = `[magento] ${method} ${url} -> ${res.status} (${ms}ms)`;
  console.log(summary);
  broadcastServerLog(summary);
  if (!VERBOSE) return;

  const safeReqHeaders = { ...reqHeaders, Authorization: "Bearer <redacted>" };

  let resBody: string;
  try {
    resBody = await res.clone().text();
  } catch {
    resBody = "<unreadable>";
  }
  const truncated =
    resBody.length > 4000
      ? `${resBody.slice(0, 4000)}\n…(truncated ${resBody.length - 4000} chars)`
      : resBody;

  console.dir(
    {
      request: { method, url, headers: safeReqHeaders, body: reqBody },
      response: {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: truncated,
      },
      ms,
    },
    { depth: null, colors: true },
  );
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
  const buildPrefix = (code?: string) => (code ? `/rest/${code}/V1` : `/rest/V1`);

  const doFetch = async (token: string, code?: string) => {
    const url = `${BASE}${buildPrefix(code)}${path}`;
    const reqHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const start = Date.now();
    const res = await fetch(url, {
      headers: reqHeaders,
      ...nextOptions,
    });
    await logMagentoCall({
      method: "GET",
      url,
      reqHeaders,
      res,
      ms: Date.now() - start,
    });
    return res;
  };

  let token = await getAdminToken();
  let res = await doFetch(token, storeCode);

  // If Magento rejected the cached token (e.g. admin re-login, token revoked,
  // or server-side TTL shorter than our cache), refresh once and retry.
  if (res.status === 401) {
    invalidateAdminToken();
    token = await getAdminToken(true);
    res = await doFetch(token, storeCode);
  }

  // A store-scoped request 400s when that store view code isn't configured on
  // the target Magento instance (e.g. a dev/staging box that only has the
  // `default` store view, not the de/en/fr views this storefront expects).
  // Fall back to the default scope so the catalog still renders; when the
  // proper store views are added on the backend, the scoped path resolves
  // normally and this fallback never triggers.
  if (res.status === 400 && storeCode) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[magento] store view "${storeCode}" not available, falling back to default scope for ${path}`,
      );
    }
    res = await doFetch(token, undefined);
  }

  if (!res.ok) {
    throw new Error(
      `Magento REST error: ${res.status} ${res.statusText} (${path})`
    );
  }

  return res.json() as Promise<T>;
}

async function magentoPost<T>(
  path: string,
  body: unknown,
  revalidate: number | false = false,
  storeCode?: string,
): Promise<T> {
  const nextOptions =
    revalidate === false
      ? { cache: "no-store" as const }
      : { next: { revalidate } };

  const prefix = storeCode ? `/rest/${storeCode}/V1` : `/rest/V1`;

  const doFetch = async (token: string) => {
    const url = `${BASE}${prefix}${path}`;
    const reqHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const start = Date.now();
    const res = await fetch(url, {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify(body),
      ...nextOptions,
    });
    await logMagentoCall({
      method: "POST",
      url,
      reqHeaders,
      reqBody: body,
      res,
      ms: Date.now() - start,
    });
    return res;
  };

  let token = await getAdminToken();
  let res = await doFetch(token);

  if (res.status === 401) {
    invalidateAdminToken();
    token = await getAdminToken(true);
    res = await doFetch(token);
  }

  if (!res.ok) {
    throw new Error(
      `Magento REST error: ${res.status} ${res.statusText} (${path})`,
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

/**
 * Resolve a product by exact SKU via searchCriteria (`eq`). Use when path-based
 * `GET /products/{sku}` unexpectedly 404s (encoding, MSI, or storefront scope).
 */
export async function getProductBySkuSearch(
  sku: string,
): Promise<MagentoProduct | null> {
  const trimmed = sku.trim();
  if (!trimmed) return null;
  const params = new URLSearchParams();
  params.set(
    `searchCriteria[filter_groups][0][filters][0][field]`,
    "sku",
  );
  params.set(
    `searchCriteria[filter_groups][0][filters][0][value]`,
    trimmed,
  );
  params.set(
    `searchCriteria[filter_groups][0][filters][0][condition_type]`,
    "eq",
  );
  params.set("searchCriteria[currentPage]", "1");
  params.set("searchCriteria[pageSize]", "1");
  const list = await magentoGet<MagentoProductList>(
    `/products?${params.toString()}`,
    false,
  );
  return list.items[0] ?? null;
}

/**
 * Path-based SKU GET first (fast), then SKU search fallback.
 */
export async function resolveMagentoProductBySkuFlexible(
  sku: string,
): Promise<MagentoProduct | null> {
  const trimmed = sku.trim().replace(/^[\uFEFF\s]+|[\s\uFEFF]+$/g, "");
  if (!trimmed) return null;
  try {
    return await getProductBySku(trimmed);
  } catch {
    try {
      return await getProductBySkuSearch(trimmed);
    } catch {
      return null;
    }
  }
}

export async function getCategoryTree(
  storeCode?: string,
): Promise<MagentoCategoryTree> {
  return magentoGet<MagentoCategoryTree>("/categories", 300, storeCode);
}

/** Magento "Default Category" — immediate children are the shop top-level set. */
const ROOT_CATEGORY_ID = 2;

/**
 * Active categories directly under the store root (shop mega menu, filters).
 *
 * Avoids `GET /categories` (full tree) and even `?depth=1` — both take minutes
 * on this catalog. Instead: read the root's `children` id list, then hydrate
 * those rows via `/categories/list` (~sub-second).
 */
export async function getTopLevelCategories(
  storeCode?: string,
): Promise<MagentoCategory[]> {
  const root = await magentoGet<{ id: number; children?: string }>(
    `/categories/${ROOT_CATEGORY_ID}?fields=id,children`,
    300,
    storeCode,
  );

  const ids = (root.children ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (ids.length === 0) return [];

  const params = new URLSearchParams({
    "searchCriteria[filter_groups][0][filters][0][field]": "entity_id",
    "searchCriteria[filter_groups][0][filters][0][value]": ids.join(","),
    "searchCriteria[filter_groups][0][filters][0][condition_type]": "in",
    "searchCriteria[pageSize]": String(ids.length),
    fields: "items[id,parent_id,name,is_active,position,level],total_count",
  });

  const list = await magentoGet<{
    items?: Array<Omit<MagentoCategory, "children_data"> & {
      children_data?: MagentoCategory[];
    }>;
  }>(`/categories/list?${params.toString()}`, 300, storeCode);

  return (list.items ?? [])
    .filter((category) => category.is_active)
    .map((category) => ({
      ...category,
      children_data: category.children_data ?? [],
    }));
}

async function fetchCategoriesByEntityIds(
  ids: string[],
  storeCode?: string,
): Promise<MagentoCategory[]> {
  if (ids.length === 0) return [];

  const params = new URLSearchParams({
    "searchCriteria[filter_groups][0][filters][0][field]": "entity_id",
    "searchCriteria[filter_groups][0][filters][0][value]": ids.join(","),
    "searchCriteria[filter_groups][0][filters][0][condition_type]": "in",
    "searchCriteria[sortOrders][0][field]": "position",
    "searchCriteria[sortOrders][0][direction]": "ASC",
    "searchCriteria[pageSize]": String(ids.length),
    fields: "items[id,parent_id,name,is_active,position,level],total_count",
  });

  const list = await magentoGet<{
    items?: Array<Omit<MagentoCategory, "children_data"> & {
      children_data?: MagentoCategory[];
    }>;
  }>(`/categories/list?${params.toString()}`, 300, storeCode);

  return (list.items ?? [])
    .filter((category) => category.is_active)
    .map((category) => ({
      ...category,
      children_data: category.children_data ?? [],
    }));
}

/** Single category row — used for metadata and existence checks. */
export async function getCategoryById(
  id: string | number,
  storeCode?: string,
): Promise<MagentoCategory | null> {
  try {
    const category = await magentoGet<
      Omit<MagentoCategory, "children_data"> & { children_data?: MagentoCategory[] }
    >(
      `/categories/${id}?fields=id,parent_id,name,is_active,position,level`,
      300,
      storeCode,
    );
    return { ...category, children_data: category.children_data ?? [] };
  } catch {
    return null;
  }
}

/**
 * Category plus its immediate active children — avoids the full category tree.
 * Uses `GET /categories/{id}` + `/categories/list` (~sub-second on this catalog).
 */
export async function getCategoryWithSubcategories(
  id: string | number,
  storeCode?: string,
): Promise<{ category: MagentoCategory; subcategories: MagentoCategory[] } | null> {
  try {
    const row = await magentoGet<{
      id: number;
      parent_id?: number;
      name: string;
      is_active: boolean;
      position?: number;
      level?: number;
      children?: string;
    }>(
      `/categories/${id}?fields=id,parent_id,name,is_active,level,children`,
      300,
      storeCode,
    );

    const childIds = (row.children ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const subcategories = await fetchCategoriesByEntityIds(childIds, storeCode);

    const category: MagentoCategory = {
      id: row.id,
      parent_id: row.parent_id ?? 0,
      name: row.name,
      is_active: row.is_active,
      position: row.position ?? 0,
      level: row.level ?? 0,
      children_data: subcategories,
    };

    return { category, subcategories };
  } catch {
    return null;
  }
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
  pageSize = 20,
): Promise<MagentoProductList> {
  return getFilteredProducts(page, pageSize, { q: query });
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
  /** Attribute code → selected option values (OR within one attribute). */
  facets?: Record<string, string[]>;
}

/** Aggregation buckets rendered elsewhere in the filter sidebar. */
const SKIP_AGGREGATION_CODES = new Set([
  "category_id",
  "category_ids",
  "category",
  "price",
]);

const NON_FACET_ATTRIBUTE_CODES = new Set([
  "category_ids",
  "description",
  "short_description",
  "meta_description",
  "meta_keyword",
  "meta_title",
  "url_key",
  "image",
  "small_image",
  "thumbnail",
  "swatch_image",
  "media_gallery",
  "options_container",
  "msrp_display_actual_price_type",
  "tax_class_id",
  "visibility",
  "status",
  "name",
  "sku",
  "price",
  "special_price",
  "cost",
  "weight",
]);

export function parseProductFacetParams(
  params: Record<string, string | undefined>,
): Record<string, string[]> {
  const facets: Record<string, string[]> = {};
  for (const [key, raw] of Object.entries(params)) {
    if (PRODUCT_LIST_RESERVED_PARAMS.has(key) || !raw) continue;
    const values = raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    if (values.length > 0) facets[key] = values;
  }
  return facets;
}

interface MagentoSearchResponse {
  items?: Array<{ id: number }>;
  total_count?: number;
  aggregations?: MagentoAggregation[];
}

function buildMagentoSearchCriteriaBody(
  filters: ProductSearchFilters,
  page: number,
  pageSize: number,
) {
  const filterGroups: Array<{
    filters: Array<{
      field: string;
      value: string;
      conditionType: string;
    }>;
  }> = [];

  if (filters.q && filters.q.trim().length > 0) {
    filterGroups.push({
      filters: [
        {
          field: "search_term",
          value: filters.q.trim(),
          conditionType: "eq",
        },
      ],
    });
  }

  if (filters.categoryId !== undefined && filters.categoryId !== "") {
    filterGroups.push({
      filters: [
        {
          field: "category_ids",
          value: String(filters.categoryId),
          conditionType: "eq",
        },
      ],
    });
  }

  if (typeof filters.priceMin === "number" && Number.isFinite(filters.priceMin)) {
    filterGroups.push({
      filters: [
        {
          field: "price",
          value: String(filters.priceMin),
          conditionType: "gteq",
        },
      ],
    });
  }

  if (typeof filters.priceMax === "number" && Number.isFinite(filters.priceMax)) {
    filterGroups.push({
      filters: [
        {
          field: "price",
          value: String(filters.priceMax),
          conditionType: "lteq",
        },
      ],
    });
  }

  if (filters.facets) {
    for (const [field, values] of Object.entries(filters.facets)) {
      if (values.length === 0) continue;
      filterGroups.push({
        filters: values.map((value) => ({
          field,
          value,
          conditionType: "eq",
        })),
      });
    }
  }

  return {
    requestName: filters.q?.trim()
      ? "quick_search_container"
      : "catalog_view_container",
    filterGroups,
    currentPage: page,
    pageSize,
  };
}

function normalizeAggregations(
  aggregations: MagentoAggregation[] | undefined,
): MagentoAggregation[] {
  if (!aggregations?.length) return [];
  return aggregations
    .filter(
      (bucket) =>
        bucket.options?.length > 0 &&
        !SKIP_AGGREGATION_CODES.has(bucket.attribute_code),
    )
    .map((bucket) => ({
      ...bucket,
      options: bucket.options.filter((opt) => opt.count > 0),
    }))
    .filter((bucket) => bucket.options.length > 0);
}

function buildBrowseFacetsFromProducts(
  items: MagentoProduct[],
): MagentoAggregation[] {
  const counts = new Map<string, Map<string, { label: string; count: number }>>();

  for (const product of items) {
    for (const attr of product.custom_attributes ?? []) {
      const code = attr.attribute_code;
      if (
        NON_FACET_ATTRIBUTE_CODES.has(code) ||
        SKIP_AGGREGATION_CODES.has(code)
      ) {
        continue;
      }
      const raw = Array.isArray(attr.value) ? attr.value.join(", ") : attr.value;
      if (!raw || raw.length > 80 || raw.includes("<")) continue;

      const values = raw.split(",").map((v) => v.trim()).filter(Boolean);
      for (const value of values) {
        if (!counts.has(code)) counts.set(code, new Map());
        const bucket = counts.get(code)!;
        const existing = bucket.get(value);
        if (existing) {
          existing.count += 1;
        } else {
          bucket.set(value, { label: value, count: 1 });
        }
      }
    }
  }

  return [...counts.entries()]
    .map(([attribute_code, optionMap]) => ({
      attribute_code,
      label: attribute_code.replace(/_/g, " "),
      options: [...optionMap.entries()]
        .map(([value, meta]) => ({
          value,
          label: meta.label,
          count: meta.count,
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    }))
    .filter((bucket) => bucket.options.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));
}

async function fetchMagentoSearchAggregations(
  filters: ProductSearchFilters,
  page: number,
  pageSize: number,
): Promise<MagentoAggregation[]> {
  try {
    const result = await magentoPost<MagentoSearchResponse>(
      "/search",
      {
        searchCriteria: buildMagentoSearchCriteriaBody(filters, page, pageSize),
      },
      filters.q ? false : 60,
    );
    return normalizeAggregations(result.aggregations);
  } catch {
    return [];
  }
}

/**
 * Product listing with Magento search aggregations when available. Falls back
 * to lightweight attribute counts from the current result page in browse mode.
 */
export async function getFilteredProductResults(
  page = 1,
  pageSize = 20,
  filters: ProductSearchFilters = {},
): Promise<MagentoProductListWithAggregations> {
  const [productList, searchAggregations] = await Promise.all([
    getFilteredProducts(page, pageSize, filters),
    fetchMagentoSearchAggregations(filters, page, pageSize),
  ]);

  const aggregations =
    searchAggregations.length > 0
      ? searchAggregations
      : buildBrowseFacetsFromProducts(productList.items);

  return { ...productList, aggregations };
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

  /** Name OR SKU (Magento OR-combines filters within one filter_group). */
  const addKeywordOrSkuFilters = (q: string) => {
    const like = `%${q}%`;
    const g = group;
    params.set(
      `searchCriteria[filter_groups][${g}][filters][0][field]`,
      "name",
    );
    params.set(
      `searchCriteria[filter_groups][${g}][filters][0][value]`,
      like,
    );
    params.set(
      `searchCriteria[filter_groups][${g}][filters][0][condition_type]`,
      "like",
    );
    params.set(
      `searchCriteria[filter_groups][${g}][filters][1][field]`,
      "sku",
    );
    params.set(
      `searchCriteria[filter_groups][${g}][filters][1][value]`,
      like,
    );
    params.set(
      `searchCriteria[filter_groups][${g}][filters][1][condition_type]`,
      "like",
    );
    group += 1;
  };

  if (filters.q && filters.q.trim().length > 0) {
    addKeywordOrSkuFilters(filters.q.trim());
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

  if (filters.facets) {
    for (const [field, values] of Object.entries(filters.facets)) {
      if (values.length === 0) continue;
      const g = group;
      values.forEach((value, idx) => {
        params.set(
          `searchCriteria[filter_groups][${g}][filters][${idx}][field]`,
          field,
        );
        params.set(
          `searchCriteria[filter_groups][${g}][filters][${idx}][value]`,
          value,
        );
        params.set(
          `searchCriteria[filter_groups][${g}][filters][${idx}][condition_type]`,
          "eq",
        );
      });
      group += 1;
    }
  }

  params.set("searchCriteria[currentPage]", String(page));
  params.set("searchCriteria[pageSize]", String(pageSize));

  const cacheSeconds = filters.q ? false : 60;
  return magentoGet<MagentoProductList>(
    `/products?${params.toString()}`,
    cacheSeconds,
  );
}
