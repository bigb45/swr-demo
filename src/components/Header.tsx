import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import LocaleSwitcher from "./LocaleSwitcher";
import CurrencySwitcher from "./CurrencySwitcher";
import SearchBar from "./ui/SearchBar";
import CartBadge from "./CartBadge";
import WatchlistBadge from "./WatchlistBadge";
import MobileNav from "./MobileNav";
import LogoutButton from "./LogoutButton";
import CopilotHeaderTrigger from "@/components/copilot/CopilotHeaderTrigger";
import ShopMegaMenu from "@/components/ShopMegaMenu";
import AccountHeaderButton from "@/components/AccountHeaderButton";

interface HeaderProps {
  locale: string;
}

export default async function Header({ locale }: HeaderProps) {
  const t = await getTranslations({ locale, namespace: "nav" });
  const tAuth = await getTranslations({ locale, namespace: "auth" });

  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("swr_customer_token")?.value;

  const primaryLinks = [
    { href: "/shop", label: t("shop") },
    { href: "/catalog", label: t("catalog") },
    { href: "/services", label: t("services") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ];

  const mobileLinks = [
    ...primaryLinks,
    ...(isAuthenticated
      ? [
          { href: "/orders", label: t("orderHistory") },
          { href: "/account", label: t("account") },
        ]
      : [
          { href: "/account/login", label: tAuth("login") },
          { href: "/account/register", label: tAuth("register") },
        ]),
  ];

  return (
    <header className="sticky top-0 z-50" style={{ boxShadow: "0 10px 30px rgba(26,28,28,0.06)" }}>
      {/* Tier 1 — Utility bar (hidden on mobile to save space) */}
      <div style={{ backgroundColor: "#003a63", color: "#ffffff" }}>
        <div className="swr-page-shell hidden h-7 items-center justify-end gap-5 text-xs sm:flex">
          <a
            href="tel:+497621160370"
            className="hidden text-white/80 transition-colors hover:text-white lg:inline"
          >
            +49 7621 160 370
          </a>
          {isAuthenticated ? (
            <>
              <Link
                href="/orders"
                className="text-white/80 transition-colors hover:text-white"
              >
                {t("orderHistory")}
              </Link>
              <Link
                href="/account"
                className="text-white/80 transition-colors hover:text-white"
              >
                {t("account")}
              </Link>
              <LogoutButton
                label={tAuth("logout")}
                className="text-white/80 transition-colors hover:text-white disabled:opacity-50"
              />
            </>
          ) : (
            <>
              <Link
                href="/account/login"
                className="text-white/80 transition-colors hover:text-white"
              >
                {tAuth("login")}
              </Link>
              <Link
                href="/account/register"
                className="text-white/80 transition-colors hover:text-white"
              >
                {tAuth("register")}
              </Link>
            </>
          )}
          <CurrencySwitcher />
          <LocaleSwitcher />
        </div>
      </div>

      {/* Tier 2 — Main bar (+ full-width search row on small screens) */}
      <div className="bg-surface-container-lowest">
        <div className="swr-page-shell">
          <div className="flex h-12 items-center gap-3 sm:gap-5">
            <MobileNav
              links={mobileLinks}
              cartLabel={t("cart")}
              watchlistLabel={t("watchlist")}
              shopAllLabel={t("shopMenu.all")}
              logoutLabel={isAuthenticated ? tAuth("logout") : undefined}
            />

            <Link href="/" className="shrink-0" aria-label={t("home")}>
              <Image
                src="/logo.svg"
                alt="SWR Lörrach"
                width={140}
                height={80}
                priority
                className="h-8 w-auto sm:h-9"
              />
            </Link>

            <div className="mx-auto hidden min-w-0 max-w-[452px] flex-1 md:flex">
              <SearchBar compact />
            </div>

            <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
              <CopilotHeaderTrigger className="bg-surface-container-low" />

              <AccountHeaderButton isAuthenticated={isAuthenticated} />

              <Link
                href="/watchlist"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-[3px] transition-colors hover:bg-surface-container-low"
                aria-label={t("watchlist")}
                title={t("watchlist")}
                style={{ color: "#003a63" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <WatchlistBadge />
              </Link>

              <Link
                href="/cart"
                className="relative flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: "#003a63", borderRadius: "3px" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {t("cart")}
                <CartBadge />
              </Link>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-0.5 md:hidden">
              <CopilotHeaderTrigger className="shrink-0 bg-surface-container-low/80" />
              <AccountHeaderButton
                isAuthenticated={isAuthenticated}
                className="shrink-0 px-1"
              />
              <Link
                href="/watchlist"
                className="relative shrink-0 p-1.5"
                aria-label={t("watchlist")}
                style={{ color: "#003a63" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <WatchlistBadge />
              </Link>
              <Link
                href="/cart"
                className="relative shrink-0 p-1.5"
                aria-label={t("cart")}
                style={{ color: "#003a63" }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <CartBadge />
              </Link>
            </div>
          </div>

          {/* Mobile / narrow: full-width search under the icon row */}
          <div className="-mx-4 bg-surface-container-low px-4 py-2 sm:-mx-6 sm:px-6 md:hidden lg:-mx-8 lg:px-8">
            <SearchBar compact />
          </div>
        </div>
      </div>

      {/* Tier 3 — Primary navigation (desktop/tablet); tonal strip, no 1px rule */}
      <nav
        className="hidden bg-surface-container-low md:block"
        aria-label={t("primaryNavLabel")}
      >
        <div className="swr-page-shell flex h-9 items-center gap-5">
          {primaryLinks.map((link) => (
            link.href === "/shop" ? (
              <ShopMegaMenu
                key={link.href}
                href="/shop"
                label={link.label}
                allLabel={t("shopMenu.all")}
                heading={t("shopMenu.heading")}
              />
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap text-sm font-semibold uppercase tracking-[0.04em] text-on-surface transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            )
          ))}
        </div>
      </nav>
    </header>
  );
}
