import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import Header from "@/components/Header";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { CartProvider } from "@/components/CartProvider";
import { getCurrencyRates, DEFAULT_CURRENCY_BY_LOCALE } from "@/lib/currency";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });
  return {
    title: {
      default: t("metaTitle"),
      template: t("metaTitleTemplate"),
    },
    description: t("metaDescription"),
    icons: {
      icon: "/favicon.png",
      shortcut: "/favicon.png",
      apple: "/favicon.png",
    },
  };
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const [messages, rates] = await Promise.all([
    getMessages(),
    getCurrencyRates(),
  ]);

  const t = await getTranslations({ locale, namespace: "footer" });

  const defaultCurrency = DEFAULT_CURRENCY_BY_LOCALE[locale] ?? "EUR";

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-surface">
        <NextIntlClientProvider messages={messages}>
          <CurrencyProvider rates={rates} defaultCurrency={defaultCurrency}>
            <CartProvider>
            <Header locale={locale} />
            <main className="flex-1">{children}</main>
            <footer className="bg-primary text-white mt-auto">
              <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  {/* Left: copyright + legal links */}
                  <div className="flex flex-col gap-4">
                    <p className="text-xs text-white/70">
                      {t("copyright", { year: new Date().getFullYear() })}
                    </p>
                    <div className="flex flex-wrap gap-6">
                      <Link
                        href="/terms"
                        className="text-xs text-white/60 hover:text-white transition-colors"
                      >
                        {t("termsOfSale")}
                      </Link>
                      <Link
                        href="/privacy"
                        className="text-xs text-white/60 hover:text-white transition-colors"
                      >
                        {t("privacyPolicy")}
                      </Link>
                      <Link
                        href="/compliance"
                        className="text-xs text-white/60 hover:text-white transition-colors"
                      >
                        {t("compliance")}
                      </Link>
                      <Link
                        href="/iso"
                        className="text-xs text-white/60 hover:text-white transition-colors"
                      >
                        {t("isoCertification")}
                      </Link>
                      <Link
                        href="/sds"
                        className="text-xs text-white/60 hover:text-white transition-colors"
                      >
                        {t("sdsSheets")}
                      </Link>
                    </div>
                  </div>

                  {/* Right: company name + tagline */}
                  <div className="flex flex-col items-start md:items-end gap-1">
                    <span className="text-sm font-bold tracking-wider uppercase text-white">
                      SWR Handelsgesellschaft mbH
                    </span>
                    <span className="text-xs text-white/60">
                      Qualität verbindet.
                    </span>
                  </div>
                </div>
              </div>
            </footer>
            </CartProvider>
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
