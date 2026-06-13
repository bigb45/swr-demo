"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface AccountHeaderButtonProps {
  isAuthenticated: boolean;
  displayName?: string | null;
  className?: string;
}

export default function AccountHeaderButton({
  isAuthenticated,
  displayName,
  className = "",
}: AccountHeaderButtonProps) {
  const t = useTranslations("nav");
  const href = isAuthenticated ? "/account" : "/account/login";
  const label = isAuthenticated
    ? displayName?.trim() || t("myAccount")
    : t("myAccount");

  return (
    <Link
      href={href}
      className={`inline-flex flex-col items-center justify-center gap-0.5 min-w-[2.75rem] px-2 py-1.5 rounded-[3px] transition-colors hover:bg-surface-container-low ${className}`}
      aria-label={label}
      title={label}
      style={{ color: "#003a63" }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <span className="hidden lg:block text-[10px] font-semibold uppercase tracking-wide max-w-[5rem] truncate">
        {label}
      </span>
    </Link>
  );
}
