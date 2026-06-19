import { getLocale } from "next-intl/server";
import NotFoundContent from "@/components/NotFoundContent";
import { routing, type Locale } from "@/i18n/routing";

export default async function LocaleNotFound() {
  const rawLocale = await getLocale();
  const locale = routing.locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : routing.defaultLocale;

  return <NotFoundContent locale={locale} />;
}
