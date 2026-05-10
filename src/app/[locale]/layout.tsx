import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { CartProvider } from "@/components/CartProvider";
import { DEFAULT_CURRENCY_BY_LOCALE } from "@/lib/currency";
import { getCurrencyRates } from "@/lib/currency-rates";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { getSiteBaseUrl, localeAlternates } from "@/lib/seo";
import { CustomerSessionProvider } from "@/components/CustomerSessionProvider";
import { CopilotProvider } from "@/components/copilot/CopilotProvider";
import CopilotDock from "@/components/copilot/CopilotDock";

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

  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("swr_customer_token")?.value;

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-surface">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CustomerSessionProvider isAuthenticated={isAuthenticated}>
            <CurrencyProvider rates={rates} defaultCurrency={defaultCurrency}>
              <CartProvider>
                <CopilotProvider>
                  <Suspense
                  fallback={
                    <div
                      className="sticky top-0 z-50 min-h-[4rem] sm:min-h-[calc(33px+4rem)] md:min-h-[calc(33px+4rem+2.75rem)] bg-white"
                      style={{
                        boxShadow: "0 10px 30px rgba(26,28,28,0.06)",
                      }}
                      aria-hidden
                    />
                  }
                >
                  <Header locale={locale} />
                </Suspense>
                <div className="flex min-h-0 flex-1 w-full overflow-hidden">
                  <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
                    {children}
                  </main>
                  <CopilotDock />
                </div>
                <Footer locale={locale} />
                </CopilotProvider>
              </CartProvider>
            </CurrencyProvider>
          </CustomerSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
