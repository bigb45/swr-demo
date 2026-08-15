import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";
import { CurrencyProvider } from "@/components/CurrencyProvider";
import { CartProvider } from "@/components/CartProvider";
import { WatchlistProvider } from "@/components/WatchlistProvider";
import { DEFAULT_CURRENCY_BY_LOCALE } from "@/lib/currency";
import { getCurrencyRates } from "@/lib/currency-rates";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { getSiteBaseUrl, localeAlternates } from "@/lib/seo";
import { CustomerSessionProvider } from "@/components/CustomerSessionProvider";
import { ErpPricingProvider } from "@/components/ErpPricingProvider";
import { CopilotProvider } from "@/components/copilot/CopilotProvider";
import { CookieConsentProvider } from "@/components/CookieConsentProvider";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import Toaster from "@/components/ui/Toaster";
import DevConsoleBridge from "@/components/DevConsoleBridge";

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
      siteName: t("siteName"),
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

/** Keyboard overlays content; layout viewport stays stable on iOS Safari. */
export const viewport: Viewport = {
  interactiveWidget: "overlays-content",
};

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
            <ErpPricingProvider isAuthenticated={isAuthenticated}>
            <CookieConsentProvider>
              <CurrencyProvider rates={rates} defaultCurrency={defaultCurrency}>
                <CartProvider>
                  <WatchlistProvider>
                  <CopilotProvider>
                    {children}
                    <Toaster />
                    <CookieConsentBanner />
                    {process.env.NODE_ENV === "development" && (
                      <DevConsoleBridge />
                    )}
                  </CopilotProvider>
                  </WatchlistProvider>
                </CartProvider>
              </CurrencyProvider>
            </CookieConsentProvider>
            </ErpPricingProvider>
          </CustomerSessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
