// Industry hub configuration. Each slug maps to:
//  - cmsIdentifier: Magento CMS page identifier for rich content
//  - categoryNames: German category names (primary key for lookup, since the
//    Magento catalog is authored in German). First match from the category
//    tree wins.
//  - categoryId: optional fallback numeric ID if the tree lookup fails.
export const INDUSTRY_SLUGS = [
  "welding",
  "tools",
  "power-tools",
  "machines",
  "facility-equipment",
  "workshop-supplies",
  "occupational-safety",
] as const;

export type IndustrySlug = (typeof INDUSTRY_SLUGS)[number];

export interface IndustryConfig {
  slug: IndustrySlug;
  cmsIdentifier: string;
  categoryNames: string[];
}

export const INDUSTRY_CONFIG: Record<IndustrySlug, IndustryConfig> = {
  welding: {
    slug: "welding",
    cmsIdentifier: "industry-welding",
    categoryNames: ["Schweißtechnik", "Schweisstechnik", "Welding"],
  },
  tools: {
    slug: "tools",
    cmsIdentifier: "industry-tools",
    categoryNames: ["Werkzeuge", "Handwerkzeuge", "Tools", "Hand tools"],
  },
  "power-tools": {
    slug: "power-tools",
    cmsIdentifier: "industry-power-tools",
    categoryNames: ["Elektrowerkzeuge", "Power tools"],
  },
  machines: {
    slug: "machines",
    cmsIdentifier: "industry-machines",
    categoryNames: ["Maschinen", "Machines"],
  },
  "facility-equipment": {
    slug: "facility-equipment",
    cmsIdentifier: "industry-facility-equipment",
    categoryNames: ["Betriebseinrichtungen", "Facility equipment"],
  },
  "workshop-supplies": {
    slug: "workshop-supplies",
    cmsIdentifier: "industry-workshop-supplies",
    categoryNames: ["Werkstattbedarf", "Workshop supplies"],
  },
  "occupational-safety": {
    slug: "occupational-safety",
    cmsIdentifier: "industry-occupational-safety",
    categoryNames: ["Arbeitsschutz", "Occupational safety"],
  },
};

export function isIndustrySlug(value: string): value is IndustrySlug {
  return (INDUSTRY_SLUGS as readonly string[]).includes(value);
}
