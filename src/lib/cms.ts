import { LOCALE_STORE_CODES, magentoGet } from "./magento";

export interface MagentoCmsPage {
  id: number;
  identifier: string;
  title: string;
  page_layout?: string;
  meta_title?: string;
  meta_keywords?: string;
  meta_description?: string;
  content_heading?: string;
  content: string;
  sort_order?: string;
  layout_update_xml?: string;
  custom_theme?: string;
  active?: boolean;
}

export interface MagentoCmsBlock {
  id: number;
  identifier: string;
  title: string;
  content: string;
  active?: boolean;
}

interface MagentoSearchResult<T> {
  items: T[];
  total_count: number;
}

function buildIdentifierSearchParams(identifier: string) {
  return new URLSearchParams({
    "searchCriteria[filter_groups][0][filters][0][field]": "identifier",
    "searchCriteria[filter_groups][0][filters][0][value]": identifier,
    "searchCriteria[filter_groups][0][filters][0][condition_type]": "eq",
    "searchCriteria[filter_groups][1][filters][0][field]": "is_active",
    "searchCriteria[filter_groups][1][filters][0][value]": "1",
    "searchCriteria[filter_groups][1][filters][0][condition_type]": "eq",
    "searchCriteria[pageSize]": "1",
  });
}

export async function getCmsPage(
  identifier: string,
  locale: string,
  revalidate: number | false = 300
): Promise<MagentoCmsPage | null> {
  const storeCode = LOCALE_STORE_CODES[locale];
  const params = buildIdentifierSearchParams(identifier);
  try {
    const result = await magentoGet<MagentoSearchResult<MagentoCmsPage>>(
      `/cmsPage/search?${params.toString()}`,
      revalidate,
      storeCode
    );
    return result.items[0] ?? null;
  } catch {
    // CMS page missing, Magento CMS module disabled, or store view not set up
    // yet. Callers render fallback copy in this case.
    return null;
  }
}

export async function getCmsBlock(
  identifier: string,
  locale: string,
  revalidate: number | false = 300
): Promise<MagentoCmsBlock | null> {
  const storeCode = LOCALE_STORE_CODES[locale];
  const params = buildIdentifierSearchParams(identifier);
  try {
    const result = await magentoGet<MagentoSearchResult<MagentoCmsBlock>>(
      `/cmsBlock/search?${params.toString()}`,
      revalidate,
      storeCode
    );
    return result.items[0] ?? null;
  } catch {
    return null;
  }
}
