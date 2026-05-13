import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import LocaleSwitcher from "./LocaleSwitcher";
import CurrencySwitcher from "./CurrencySwitcher";
import SearchBar from "./ui/SearchBar";
import CartBadge from "./CartBadge";
import MobileNav from "./MobileNav";
import LogoutButton from "./LogoutButton";
import CopilotHeaderTrigger from "@/components/copilot/CopilotHeaderTrigger";

interface HeaderProps {
  locale: string;
}

export default async function Header({ locale }: HeaderProps) {
  const t = await getTranslations({ locale, namespace: "nav" });
  const tAuth = await getTranslations({ locale, namespace: "auth" });

  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("swr_customer_token")?.value;

  const primaryLinks = [
    { href: "/products", label: t("shop") },
    { href: "/catalog", label: t("catalog") },
    { href: "/services", label: t("services") },
    { href: "/industries", label: t("industries") },
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
        <div className="swr-page-shell h-[33px] hidden sm:flex items-center justify-end gap-6 text-xs">
          <a
            href="tel:+49762116037"
            className="hidden lg:inline text-white/80 hover:text-white transition-colors"
          >
            +49 7621 160 370
          </a>
          {isAuthenticated ? (
            <>
              <Link
                href="/orders"
                className="text-white/80 hover:text-white transition-colors"
              >
                {t("orderHistory")}
              </Link>
              <Link
                href="/account"
                className="text-white/80 hover:text-white transition-colors"
              >
                {t("account")}
              </Link>
              <LogoutButton
                label={tAuth("logout")}
                className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
              />
            </>
          ) : (
            <>
              <Link
                href="/account/login"
                className="text-white/80 hover:text-white transition-colors"
              >
                {tAuth("login")}
              </Link>
              <Link
                href="/account/register"
                className="text-white/80 hover:text-white transition-colors"
              >
                {tAuth("register")}
              </Link>
            </>
          )}
          <CurrencySwitcher />
          <LocaleSwitcher />
        </div>
      </div>

      {/* Tier 2 — Main bar (+ full-width search row on small screens, Amazon-style) */}
      <div className="bg-white">
        <div className="swr-page-shell">
          <div className="h-16 flex items-center gap-3 sm:gap-6">
            {/* Hamburger — mobile only, rendered client-side */}
            <MobileNav
              links={mobileLinks}
              cartLabel={t("cart")}
              bookConsultationLabel={t("bookConsultation")}
              logoutLabel={isAuthenticated ? tAuth("logout") : undefined}
            />

            {/* Logo */}
            <Link href="/" className="shrink-0" aria-label={t("home")}>
              <Image
                src="/logo.svg"
                alt="SWR Lörrach"
                width={140}
                height={80}
                priority
                className="h-10 sm:h-12 w-auto"
              />
            </Link>

            {/* Search — inline from md up; below md it lives in the next row at full width */}
            <div className="hidden md:flex flex-1 max-w-[452px] mx-auto min-w-0">
              <SearchBar />
            </div>

            {/* Right — Book consultation + Cart, shown on md+ */}
            <div className="hidden md:flex items-center gap-3 ml-auto shrink-0">
              <CopilotHeaderTrigger className="bg-surface-container-low" />
              <Link
                href="/contact"
                className="hidden lg:inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold transition-colors"
                style={{ backgroundColor: "#006e21", borderRadius: "var(--radius-btn)" }}
              >
                {t("bookConsultation")}
              </Link>

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
            </div>

            <div className="md:hidden flex items-center gap-0.5 ml-auto shrink-0">
              <CopilotHeaderTrigger className="shrink-0 bg-surface-container-low/80" />
              {/* Cart icon — mobile only */}
              <Link
                href="/cart"
                className="relative p-2 shrink-0"
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

          {/* Mobile / narrow: full-width search under the icon row */}
          <div className="md:hidden border-t border-outline-variant/20 pb-3 pt-2.5 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Tier 3 — Primary navigation (desktop/tablet) */}
      <nav
        className="hidden md:block border-t border-outline-variant/20 bg-white"
        aria-label={t("primaryNavLabel")}
      >
        <div className="swr-page-shell flex items-center gap-6 h-11">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold uppercase tracking-[0.04em] text-on-surface hover:text-primary transition-colors whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
