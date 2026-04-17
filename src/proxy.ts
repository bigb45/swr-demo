import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlProxy = createIntlMiddleware(routing);

const PROTECTED_SEGMENTS = ["/account", "/orders", "/checkout"];
const PUBLIC_PATHS = ["/account/login", "/account/register"];
const COOKIE_NAME = "swr_customer_token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
