"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "de", label: "DE" },
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
];

interface LocaleSwitcherProps {
  /**
   * "dark" (default) — white text for use on the navy utility bar.
   * "light" — on-surface text for use on white backgrounds like the mobile drawer.
   */
  tone?: "dark" | "light";
  className?: string;
}

export default function LocaleSwitcher({
  tone = "dark",
  className = "",
}: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");

  function handleChange(nextLocale: Locale) {
    router.replace(pathname, { locale: nextLocale });
  }

  const activeClass = tone === "light" ? "text-on-surface" : "text-white";
  const inactiveClass =
    tone === "light"
      ? "text-on-surface-variant hover:text-on-surface"
      : "text-white/50 hover:text-white/80";
  const separatorClass =
    tone === "light" ? "text-outline-variant" : "text-white/30";
  const buttonSizeClass =
    tone === "light" ? "min-h-9 px-2.5 rounded-(--radius-btn)" : "";

  return (
    <div
      className={`flex items-center gap-1 text-xs ${className}`}
      role="group"
      aria-label={t("selectLanguage")}
    >
      {LOCALES.map(({ code, label }, idx) => (
        <span key={code} className="flex items-center gap-1">
          {idx > 0 && tone !== "light" && <span className={separatorClass}>|</span>}
          <button
            onClick={() => handleChange(code)}
            className={`font-medium transition-colors ${
              locale === code ? activeClass : inactiveClass
            } ${buttonSizeClass}`}
            aria-current={locale === code ? "true" : undefined}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  );
}
