import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "@/components/LocaleSwitcher";

interface AuthLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Slim shell for login / register / password flows: logo, locale switcher
 * and a minimal legal footer. No full header, footer or Copilot dock.
 */
export default async function AuthLayout({
  children,
  params,
}: AuthLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "footer" });

  return (
    <div className="flex min-h-full w-full flex-1 flex-col">
      <header className="bg-surface-container-lowest">
        <div className="swr-page-shell flex h-16 items-center justify-between">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/logo.svg"
              alt="SWR Handelsgesellschaft mbH"
              width={120}
              height={36}
              priority
              className="h-9 w-auto"
            />
          </Link>
          <LocaleSwitcher tone="light" />
        </div>
      </header>

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>

      <footer className="mt-auto bg-surface-container-low">
        <div className="swr-page-shell flex flex-col items-start justify-between gap-2 py-5 sm:flex-row sm:items-center">
          <p className="text-[11px] text-on-surface-variant">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <nav className="flex items-center gap-4">
            <Link
              href="/legal/imprint"
              className="text-[11px] text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {t("imprint")}
            </Link>
            <Link
              href="/legal/privacy"
              className="text-[11px] text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {t("privacyPolicy")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
