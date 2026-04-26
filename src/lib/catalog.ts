// Catalog document repository.
//
// The catalog (brand brochures, price lists, manuals, datasheets, certificates,
// SDS, etc.) is the flagship browsing surface on swr-loerrach.de. The
// production data source is undecided — likely a custom Magento DocumentEntity
// module or an EDE / nextPIM document feed — so we hide the source behind this
// repository interface. Today the only implementation reads a JSON manifest
// committed to the repo so the demo has real, browsable content.
//
// To swap implementations later, write a new `CatalogRepository` and export it
// from this module instead of `jsonRepository`.

import rawData from "@/data/catalog.json";

export type DocumentType =
  | "catalog"
  | "price-list"
  | "datasheet"
  | "manual"
  | "certificate"
  | "sds"
  | "instructions"
  | "technical-info"
  | "performance"
  | "presentation"
  | "video"
  | "misc";

export const DOCUMENT_TYPES: DocumentType[] = [
  "catalog",
  "price-list",
  "datasheet",
  "manual",
  "certificate",
  "sds",
  "instructions",
  "technical-info",
  "performance",
  "presentation",
  "video",
  "misc",
];

export type CatalogCategory =
  | "welding"
  | "tools"
  | "power-tools"
  | "machines"
  | "facility-equipment"
  | "workshop-supplies"
  | "occupational-safety"
  | "compressed-air";

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  "welding",
  "tools",
  "power-tools",
  "machines",
  "facility-equipment",
  "workshop-supplies",
  "occupational-safety",
  "compressed-air",
];

export type VideoProvider = "youtube" | "file";

export interface CatalogDocument {
  id: string;
  title: string;
  brand: string;
  type: DocumentType;
  categories: CatalogCategory[];
  language: string;
  pdfUrl: string;
  thumbnailUrl?: string;
  pageCount?: number;
  fileSize?: number;
  publishedAt?: string;
  description?: string;
  // Video-specific fields. Only populated when `type === "video"`. `pdfUrl`
  // still serves as the canonical "open this asset" URL (used by the metadata
  // fallback + Open-in-new-tab action), while `videoUrl` is the playable
  // source for the embedded player.
  videoUrl?: string;
  videoProvider?: VideoProvider;
  posterUrl?: string;
  duration?: string;
}

export interface CatalogFilters {
  q?: string;
  brands?: string[];
  types?: DocumentType[];
  categories?: CatalogCategory[];
  languages?: string[];
  limit?: number;
  offset?: number;
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface CatalogFacets {
  brands: FacetCount[];
  types: FacetCount[];
  categories: FacetCount[];
  languages: FacetCount[];
}

export interface CatalogListResult {
  items: CatalogDocument[];
  totalCount: number;
  facets: CatalogFacets;
}

export interface CatalogRepository {
  listDocuments(filters?: CatalogFilters): Promise<CatalogListResult>;
  getDocument(id: string): Promise<CatalogDocument | null>;
  listAllDocumentIds(): Promise<string[]>;
}

const DATA: CatalogDocument[] = rawData as CatalogDocument[];

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function matchesFilters(doc: CatalogDocument, f: CatalogFilters): boolean {
  if (f.brands && f.brands.length > 0) {
    const docBrand = normalize(doc.brand);
    const brands = f.brands.map(normalize);
    if (!brands.includes(docBrand)) return false;
  }
  if (f.types && f.types.length > 0) {
    if (!f.types.includes(doc.type)) return false;
  }
  if (f.categories && f.categories.length > 0) {
    if (!f.categories.some((c) => doc.categories.includes(c))) return false;
  }
  if (f.languages && f.languages.length > 0) {
    const docLang = normalize(doc.language);
    const langs = f.languages.map(normalize);
    if (!langs.includes(docLang)) return false;
  }
  if (f.q) {
    const q = normalize(f.q);
    const haystack = [
      doc.title,
      doc.brand,
      doc.description ?? "",
      doc.categories.join(" "),
      doc.type,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

// Multi-select facet counts: for each dimension we compute the facet against
// docs that pass all *other* filters but ignore that dimension's own filter.
// Without this, picking "Bosch" would hide every other brand from the list, so
// the user could never add a second brand.
function buildFacets(
  data: CatalogDocument[],
  filters: CatalogFilters
): CatalogFacets {
  const matching = (overrides: Partial<CatalogFilters>) =>
    data.filter((d) => matchesFilters(d, { ...filters, ...overrides }));

  const brandDocs = matching({ brands: [] });
  const typeDocs = matching({ types: [] });
  const categoryDocs = matching({ categories: [] });
  const languageDocs = matching({ languages: [] });

  const brand = new Map<string, number>();
  for (const d of brandDocs) {
    brand.set(d.brand, (brand.get(d.brand) ?? 0) + 1);
  }
  const type = new Map<string, number>();
  for (const d of typeDocs) {
    type.set(d.type, (type.get(d.type) ?? 0) + 1);
  }
  const category = new Map<string, number>();
  for (const d of categoryDocs) {
    for (const c of d.categories) {
      category.set(c, (category.get(c) ?? 0) + 1);
    }
  }
  const language = new Map<string, number>();
  for (const d of languageDocs) {
    language.set(d.language, (language.get(d.language) ?? 0) + 1);
  }

  const toFacet = (m: Map<string, number>): FacetCount[] =>
    Array.from(m.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  return {
    brands: toFacet(brand),
    types: toFacet(type),
    categories: toFacet(category),
    languages: toFacet(language),
  };
}

export const jsonRepository: CatalogRepository = {
  async listDocuments(filters: CatalogFilters = {}): Promise<CatalogListResult> {
    const matched = DATA.filter((d) => matchesFilters(d, filters));
    const facets = buildFacets(DATA, filters);
    const totalCount = matched.length;
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? matched.length;
    const items = matched.slice(offset, offset + limit);
    return { items, totalCount, facets };
  },

  async getDocument(id: string): Promise<CatalogDocument | null> {
    return DATA.find((d) => d.id === id) ?? null;
  },

  async listAllDocumentIds(): Promise<string[]> {
    return DATA.map((d) => d.id);
  },
};

export const catalogRepository: CatalogRepository = jsonRepository;

// Convenience wrappers — call these from server components.
export async function listDocuments(
  filters?: CatalogFilters
): Promise<CatalogListResult> {
  return catalogRepository.listDocuments(filters);
}

export async function getDocument(
  id: string
): Promise<CatalogDocument | null> {
  return catalogRepository.getDocument(id);
}

export async function listAllDocumentIds(): Promise<string[]> {
  return catalogRepository.listAllDocumentIds();
}
