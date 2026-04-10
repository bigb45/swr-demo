"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "de", label: "DE" },
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
];

export default function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function handleChange(nextLocale: Locale) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      {LOCALES.map(({ code, label }, idx) => (
        <span key={code} className="flex items-center gap-1">
          {idx > 0 && <span className="text-white/30">|</span>}
          <button
            onClick={() => handleChange(code)}
            className={`font-medium transition-colors ${
              locale === code
                ? "text-white"
                : "text-white/50 hover:text-white/80"
            }`}
            aria-current={locale === code ? "true" : undefined}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  );
}
