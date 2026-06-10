"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCustomerSession } from "@/components/CustomerSessionProvider";

function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0 text-primary"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

/**
 * One-time guest pricing notice for product listing pages. Cards use a compact
 * footer link instead of repeating this copy on every tile.
 */
export default function GuestPricingBanner() {
  const { isAuthenticated } = useCustomerSession();
  const t = useTranslations("products.guestPricing");

  if (isAuthenticated) return null;

  return (
    <div
      className="mb-4 flex flex-col gap-3 bg-surface-container-low px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      style={{ borderRadius: "var(--radius-card)" }}
      role="note"
    >
      <div className="flex min-w-0 items-start gap-3">
        <LockIcon />
        <div className="min-w-0 flex flex-col gap-0.5">
          <p className="text-sm font-bold text-primary leading-snug">
            {t("title")}
          </p>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {t("body")}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pl-7 sm:pl-0">
        <Link
          href="/account/login"
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-widest bg-secondary text-on-secondary hover:brightness-110 transition-all rounded-(--radius-btn)"
        >
          {t("signIn")}
        </Link>
        <Link
          href="/account/register"
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors rounded-(--radius-btn)"
        >
          {t("register")}
        </Link>
      </div>
    </div>
  );
}
