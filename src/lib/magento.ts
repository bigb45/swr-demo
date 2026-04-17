import type {
  MagentoCategory,
  MagentoCategoryTree,
  MagentoProduct,
  MagentoProductList,
} from "@/types/magento";

const BASE = process.env.MAGENTO_URL ?? "http://localhost:8000";

// MAGENTO_MEDIA_BASE_URL controls the base for catalog product images.
// - Local dev (PHP built-in server with `-t pub/`): set to "http://localhost:8000"
//   so images resolve to /media/catalog/product/...
// - Production (Apache serving from project root): set to "http://46.224.237.247/pub"
//   so images resolve to /pub/media/catalog/product/...
// Defaults to BASE + "/pub" to match the production Apache layout.
// NEXT_PUBLIC_ prefix makes this available in client components too,
// preventing a server/client mismatch during hydration.
export const MEDIA_BASE =
  process.env.NEXT_PUBLIC_MAGENTO_MEDIA_BASE_URL ??
  process.env.MAGENTO_MEDIA_BASE_URL ??
  BASE + "/pub";

// Module-level token cache (persists across requests in the same Node.js process)
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getAdminToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  // Refresh 5 minutes before expiry (tokens last 1 hour by default)
  if (!forceRefresh && cachedToken && now < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

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
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to get Magento admin token: ${res.status}`);
  }

  const token: string = await res.json();
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
  revalidate: number | false = 60
): Promise<T> {
  const nextOptions =
    revalidate === false
      ? { cache: "no-store" as const }
      : { next: { revalidate } };

  const doFetch = async (token: string) =>
    fetch(`${BASE}/rest/V1${path}`, {
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

export function getProductImageUrl(product: MagentoProduct): string | null {
  const entry = product.media_gallery_entries?.find((e) =>
    e.types.includes("image")
  );
  if (!entry) return null;
  return `${MEDIA_BASE}/media/catalog/product${entry.file}`;
}

export function getCustomAttribute(
  product: MagentoProduct,
  code: string
): string | null {
  const attr = product.custom_attributes?.find(
    (a) => a.attribute_code === code
  );
  if (!attr) return null;
  return Array.isArray(attr.value) ? attr.value.join(", ") : attr.value;
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
