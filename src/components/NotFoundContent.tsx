import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";

interface NotFoundContentProps {
  locale: Locale;
}

export default async function NotFoundContent({ locale }: NotFoundContentProps) {
  const t = await getTranslations({ locale, namespace: "notFound" });

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <p className="text-6xl font-bold text-on-surface-variant/30 mb-4">404</p>
      <h1 className="text-2xl font-bold text-primary mb-2">{t("title")}</h1>
      <p className="text-on-surface-variant mb-8 max-w-sm">{t("subtitle")}</p>
      <div className="flex gap-3">
        <a
          href={`/${locale}`}
          className="px-5 py-2.5 bg-secondary hover:brightness-110 text-on-secondary font-medium transition-colors text-sm"
          style={{ borderRadius: "var(--radius-btn)" }}
        >
          {t("goHome")}
        </a>
        <a
          href={`/${locale}/shop`}
          className="px-5 py-2.5 bg-surface-container-lowest hover:bg-surface-container-low text-primary font-medium transition-colors text-sm"
          style={{ borderRadius: "var(--radius-btn)" }}
        >
          {t("browseProducts")}
        </a>
      </div>
    </div>
  );
}

export function detectLocaleFromPath(pathname: string): Locale {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return routing.defaultLocale;
}
