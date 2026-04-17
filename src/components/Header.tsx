import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import LocaleSwitcher from "./LocaleSwitcher";
import CurrencySwitcher from "./CurrencySwitcher";
import SearchBar from "./ui/SearchBar";
import CartBadge from "./CartBadge";
import MobileNav from "./MobileNav";

interface HeaderProps {
  locale: string;
}

export default async function Header({ locale }: HeaderProps) {
  const t = await getTranslations({ locale, namespace: "nav" });
  const tAuth = await getTranslations({ locale, namespace: "auth" });

  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("swr_customer_token")?.value;

  const mobileLinks = isAuthenticated
    ? [
        { href: "/products", label: t("products") },
        { href: "/orders", label: t("orderHistory") },
        { href: "/account", label: t("account") },
      ]
    : [
        { href: "/products", label: t("products") },
        { href: "/account/login", label: tAuth("login") },
      ];

  return (
    <header className="sticky top-0 z-50" style={{ boxShadow: "0 10px 30px rgba(26,28,28,0.06)" }}>
      {/* Tier 1 — Utility bar (hidden on mobile to save space) */}
      <div style={{ backgroundColor: "#003a63", color: "#ffffff" }}>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-[33px] hidden sm:flex items-center justify-end gap-6">
          <CurrencySwitcher />
          <LocaleSwitcher />
        </div>
      </div>

      {/* Tier 2 — Main bar */}
      <div className="bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-6">
          {/* Hamburger — mobile only, rendered client-side */}
          <MobileNav
            links={mobileLinks}
            cartLabel={t("cart")}
            settingsLabel={t("settings")}
            helpLabel={t("help")}
          />

          {/* Logo */}
          <Link href="/" className="shrink-0" aria-label="SWR Lörrach — Home">
            <Image
              src="/logo.svg"
              alt="SWR Lörrach"
              width={140}
              height={80}
              priority
              className="h-8 sm:h-10 w-auto"
            />
          </Link>

          {/* Search bar — grows to fill space */}
          <div className="flex-1 max-w-[452px] mx-auto">
            <SearchBar locale={locale} />
          </div>

          {/* Right nav — hidden on mobile, shown on md+ */}
          <nav className="hidden md:flex items-center gap-6 ml-auto shrink-0">
            <Link
              href="/products"
              className="text-sm font-medium transition-colors whitespace-nowrap"
              style={{ color: "#3d4448" }}
            >
              {t("products")}
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/orders"
                  className="text-sm font-medium transition-colors whitespace-nowrap"
                  style={{ color: "#3d4448" }}
                >
                  {t("orderHistory")}
                </Link>
                <Link
                  href="/account"
                  className="text-sm font-medium transition-colors whitespace-nowrap"
                  style={{ color: "#3d4448" }}
                >
                  {t("account")}
                </Link>
              </>
            ) : (
              <Link
                href="/account/login"
                className="text-sm font-medium transition-colors whitespace-nowrap"
                style={{ color: "#3d4448" }}
              >
                {tAuth("login")}
              </Link>
            )}

            {/* Icon buttons */}
            <button
              aria-label={t("settings")}
              className="p-2 transition-colors"
              style={{ color: "#3d4448" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button
              aria-label={t("help")}
              className="p-2 transition-colors"
              style={{ color: "#3d4448" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold transition-colors"
              style={{ backgroundColor: "#003a63", borderRadius: "3px" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {t("cart")}
              <CartBadge />
            </Link>
          </nav>

          {/* Cart icon — mobile only (always visible) */}
          <Link
            href="/cart"
            className="md:hidden relative p-2 shrink-0"
            aria-label={t("cart")}
            style={{ color: "#003a63" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <CartBadge />
          </Link>
        </div>
      </div>
    </header>
  );
}
