export interface PartnerBrand {
  name: string;
  slug: string;
  productHref: `/products?manufacturer=${string}`;
  catalogHref: `/catalog?brand=${string}`;
  logoSrc?: string;
}

function productHref(name: string): PartnerBrand["productHref"] {
  return `/products?manufacturer=${encodeURIComponent(name)}` as const;
}

function catalogHref(slug: string): PartnerBrand["catalogHref"] {
  return `/catalog?brand=${encodeURIComponent(slug)}` as const;
}

export const PARTNER_BRANDS: PartnerBrand[] = [
  "Bosch",
  "Metabo",
  "Fronius",
  "Würth",
  "Makita",
  "Hilti",
  "Fein",
  "3M",
  "Uvex",
  "Wiha",
].map((name) => {
  const slug = name.toLowerCase().replace(/ü/g, "ue").replace(/[^a-z0-9]+/g, "-");
  return {
    name,
    slug,
    productHref: productHref(name),
    catalogHref: catalogHref(slug),
  };
});
