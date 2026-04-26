import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

export function getSiteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://www.swr-loerrach.de"
  );
}

/**
 * Build canonical + hreflang alternates for a page that exists at the same
 * sub-path in every locale (e.g. "/about", "/services/consulting",
 * "/industries/welding"). Pass an empty string for the home page.
 *
 * Usage in a page's generateMetadata:
 *   return { ...localeAlternates(locale, "/about"), title, description };
 */
export function localeAlternates(
  locale: string,
  path: string
): Pick<Metadata, "alternates"> {
  const base = getSiteBaseUrl();
  const clean = path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${base}/${l}${clean === "/" ? "" : clean}`;
  }
  languages["x-default"] = `${base}/${routing.defaultLocale}${
    clean === "/" ? "" : clean
  }`;
  return {
    alternates: {
      canonical: `${base}/${locale}${clean === "/" ? "" : clean}`,
      languages,
    },
  };
}
