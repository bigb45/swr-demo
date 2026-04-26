import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlProxy = createIntlMiddleware(routing);

const PROTECTED_SEGMENTS = ["/account", "/orders", "/checkout"];
const PUBLIC_PATHS = ["/account/login", "/account/register"];
const COOKIE_NAME = "swr_customer_token";

// 301 redirects from legacy WordPress URLs (and intermediate migrations) to
// the new Next.js routes. Keys are the trailing path (no locale prefix) or
// the full new-app path that moved. Values are the canonical new path,
// locale-prefixed.
//
// Matching is case-insensitive and ignores trailing slashes. Incoming paths
// may or may not carry a locale prefix — if none is present we assume the
// default locale (`de`), which matches the old swr-loerrach.de behavior.
const LEGACY_REDIRECTS: Record<string, string> = {
  // About + Contact + Imprint (WordPress → new)
  "/ueber-uns": "/about",
  "/kontakt": "/contact",
  "/impressum": "/legal/imprint",
  "/datenschutzerklaerung": "/legal/privacy",
  "/agb": "/legal/terms",

  // Legal pages moved under /legal/*
  "/terms": "/legal/terms",
  "/privacy": "/legal/privacy",
  "/compliance": "/legal/compliance",
  "/sds": "/legal/sds",

  // 360° Service pillars (WordPress → new)
  "/beratung": "/services/consulting",
  "/service": "/services/repair",
  "/lieferungen": "/services/delivery",
  "/zollabwicklung": "/services/customs",

  // Industry hubs (WordPress German slugs → new English slugs)
  "/schweisstechnik": "/industries/welding",
  "/werkzeuge": "/industries/tools",
  "/elektrowerkzeuge": "/industries/power-tools",
  "/maschinen": "/industries/machines",
  "/betriebseinrichtungen": "/industries/facility-equipment",
  "/werkstattbedarf": "/industries/workshop-supplies",
  "/arbeitsschutz": "/industries/occupational-safety",
  "/katalog": "/catalog",

  // Supporting pages (WordPress → new)
  "/partner": "/partners",
  "/stellenangebote": "/careers",
  "/ausbildung": "/careers",
  "/zertifikate": "/certificates",
  "/angebote": "/offers",

  // Old in-app path that was merged into /certificates
  "/iso": "/certificates",
};

function stripTrailingSlash(p: string): string {
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

function splitLocale(pathname: string): {
  locale: string;
  rest: string;
} {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) {
      return { locale, rest: "" };
    }
    if (pathname.startsWith(`/${locale}/`)) {
      return { locale, rest: pathname.slice(locale.length + 1) };
    }
  }
  return { locale: routing.defaultLocale, rest: pathname };
}

function resolveLegacyRedirect(pathname: string): string | null {
  const clean = stripTrailingSlash(pathname).toLowerCase();
  const { locale, rest } = splitLocale(clean);
  const restClean = rest === "" ? "/" : rest;
  const target = LEGACY_REDIRECTS[restClean];
  if (!target) return null;
  return `/${locale}${target}`;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy URL redirects take precedence over everything else so the
  // Next.js app never 404s on SEO-valuable inbound links.
  const legacyTarget = resolveLegacyRedirect(pathname);
  if (legacyTarget && legacyTarget !== pathname) {
    const url = new URL(legacyTarget, request.url);
    return NextResponse.redirect(url, 301);
  }

  const isPublic = routing.locales.some((locale) =>
    PUBLIC_PATHS.some(
      (p) => pathname === `/${locale}${p}` || pathname.startsWith(`/${locale}${p}/`)
    )
  );

  const isProtected =
    !isPublic &&
    routing.locales.some((locale) =>
      PROTECTED_SEGMENTS.some(
        (seg) =>
          pathname === `/${locale}${seg}` ||
          pathname.startsWith(`/${locale}${seg}/`)
      )
    );

  if (isProtected) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      const locale =
        routing.locales.find(
          (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
        ) ?? routing.defaultLocale;
      const loginUrl = new URL(`/${locale}/account/login`, request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlProxy(request);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
