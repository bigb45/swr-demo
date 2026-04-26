/**
 * Magento directory (countries + regions) helpers. Powers the country /
 * region pickers in the address book and checkout flows.
 *
 * Magento exposes `GET /V1/directory/countries` with one entry per country
 * containing the ISO 2-letter code, localized name, and — for countries that
 * track states/provinces — an `available_regions` array.
 */

import { magentoGet } from "@/lib/magento";

export interface MagentoDirectoryRegion {
  id: string;
  code?: string;
  name: string;
}

export interface MagentoDirectoryCountry {
  id: string;
  two_letter_abbreviation?: string;
  three_letter_abbreviation?: string;
  full_name_english?: string;
  full_name_locale?: string;
  available_regions?: MagentoDirectoryRegion[];
}

export interface Country {
  /** ISO 3166-1 alpha-2 code, always upper-case. */
  code: string;
  /** Best human-readable name for the active locale, falling back to English. */
  name: string;
  regions: MagentoDirectoryRegion[];
}

/**
 * Fetch the full country list from Magento. Cached heavily (24h revalidate)
 * because the directory changes on the order of years, not requests.
 *
 * @param storeCode Optional Magento store code (e.g. `de`, `en`, `fr`) so
 *   `full_name_locale` comes back in the right language.
 */
export async function getCountries(storeCode?: string): Promise<Country[]> {
  try {
    const raw = await magentoGet<MagentoDirectoryCountry[]>(
      "/directory/countries",
      60 * 60 * 24,
      storeCode,
    );
    return raw
      .map<Country>((c) => ({
        code: (c.two_letter_abbreviation ?? c.id ?? "").toUpperCase(),
        name: c.full_name_locale || c.full_name_english || c.id,
        regions: Array.isArray(c.available_regions) ? c.available_regions : [],
      }))
      .filter((c) => c.code.length === 2)
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
