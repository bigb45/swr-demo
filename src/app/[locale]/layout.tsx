import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { CartProvider } from "@/components/CartProvider";
import { getCurrencyRates, DEFAULT_CURRENCY_BY_LOCALE } from "@/lib/currency";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { getSiteBaseUrl, localeAlternates } from "@/lib/seo";

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
  const base = getSiteBaseUrl();
  const { alternates } = localeAlternates(locale, "/");
  return {
    metadataBase: new URL(base),
    title: {
      default: t("metaTitle"),
      template: t("metaTitleTemplate"),
    },
    description: t("metaDescription"),
    alternates,
    openGraph: {
      type: "website",
      locale,
      siteName: "SWR Lörrach",
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: `${base}/${locale}`,
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
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
              <Footer locale={locale} />
            </CartProvider>
          </CurrencyProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
