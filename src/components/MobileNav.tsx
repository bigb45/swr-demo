"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LogoutButton from "./LogoutButton";
import LocaleSwitcher from "./LocaleSwitcher";
import CurrencySwitcher from "./CurrencySwitcher";

interface MobileNavProps {
  links: { href: string; label: string }[];
  cartLabel: string;
  bookConsultationLabel: string;
  /**
   * When set, renders a Sign Out button at the bottom of the drawer that
   * calls /api/auth/logout and refreshes the route. Pass `undefined` for
   * anonymous visitors so the button is hidden.
   */
  logoutLabel?: string;
}

export default function MobileNav({
  links,
  cartLabel,
  bookConsultationLabel,
  logoutLabel,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        className="md:hidden p-3 -ml-2 text-on-surface"
        aria-label={open ? t("closeMenu") : t("openMenu")}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {/* Backdrop — above the sticky header (z-50) so the header isn't interactive through it */}
      {open && (
        <div
          className="fixed inset-0 z-55 bg-black/40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer — sits above the backdrop so it receives pointer events */}
      <nav
        id="mobile-nav-drawer"
        className={`fixed top-0 left-0 bottom-0 z-60 w-[min(20rem,85vw)] bg-white flex flex-col shadow-2xl transition-transform duration-300 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label={t("mobileNavLabel")}
        aria-hidden={!open}
      >
        <div
          className="flex items-center justify-between px-5 h-16 border-b border-outline-variant/30"
          style={{ backgroundColor: "#003a63" }}
        >
          <span className="text-white font-bold text-base tracking-tight">SWR Lörrach</span>
          <button
            onClick={close}
            className="p-3 -mr-2 text-white/80 hover:text-white"
            aria-label={t("closeMenu")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <ul className="flex-1 overflow-y-auto py-4">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={close}
                className="flex items-center px-6 py-4 text-sm font-medium text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
              >
                {label}
              </Link>
            </li>
          ))}
          <li className="px-6 pt-4 pb-2">
            <Link
              href="/contact"
              onClick={close}
              className="flex items-center justify-center gap-2 px-4 py-3 text-white text-sm font-semibold transition-colors"
              style={{ backgroundColor: "#006e21", borderRadius: "var(--radius-btn)" }}
            >
              {bookConsultationLabel}
            </Link>
          </li>
          <li className="border-t border-outline-variant/20 mt-2 pt-2">
            <Link
              href="/cart"
              onClick={close}
              className="flex items-center gap-3 px-6 py-4 text-sm font-semibold text-primary hover:bg-surface-container-low transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {cartLabel}
            </Link>
          </li>
          {logoutLabel ? (
            <li className="border-t border-outline-variant/20 mt-2 pt-2">
              <LogoutButton
                label={logoutLabel}
                onLoggedOut={close}
                className="flex items-center gap-3 w-full px-6 py-4 text-sm font-semibold text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors disabled:opacity-50"
              />
            </li>
          ) : null}
        </ul>

        {/* Preferences footer — locale + currency, lost from mobile otherwise */}
        <div className="border-t border-outline-variant/20 px-6 py-3 bg-surface-container-lowest">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
            {t("preferences")}
          </span>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface-variant">
                {t("selectLanguage")}
              </span>
              <LocaleSwitcher tone="light" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-on-surface-variant">
                {t("selectCurrency")}
              </span>
              <CurrencySwitcher tone="light" />
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
