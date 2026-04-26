import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import LogoutButton from "./LogoutButton";

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const t = await getTranslations({ locale, namespace: "account" });

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-8 py-10">
      <h1 className="text-3xl font-black text-primary mb-2">{t("heading")}</h1>
      <p className="text-sm text-on-surface-variant mb-10">{t("welcome")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/orders"
          className="flex items-center gap-4 p-6 bg-surface-container-lowest rounded-card hover:shadow-ambient transition-shadow"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" />
          </svg>
          <span className="text-sm font-bold text-primary">{t("orderHistory")}</span>
        </Link>

        <Link
          href="/account/quotations"
          className="flex items-center gap-4 p-6 bg-surface-container-lowest rounded-card hover:shadow-ambient transition-shadow"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <span className="text-sm font-bold text-primary">{t("quotations")}</span>
        </Link>

        <Link
          href="/account/addresses"
          className="flex items-center gap-4 p-6 bg-surface-container-lowest rounded-card hover:shadow-ambient transition-shadow"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className="text-sm font-bold text-primary">{t("addresses")}</span>
        </Link>

        <Link
          href="/account/profile"
          className="flex items-center gap-4 p-6 bg-surface-container-lowest rounded-card hover:shadow-ambient transition-shadow"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
          <span className="text-sm font-bold text-primary">{t("profile")}</span>
        </Link>

        <Link
          href="/account/fleet"
          className="flex items-center gap-4 p-6 bg-surface-container-lowest rounded-card hover:shadow-ambient transition-shadow"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
            <path d="M3 9h18l-2 11H5L3 9z" />
            <path d="M8 9V5a4 4 0 0 1 8 0v4" />
          </svg>
          <span className="text-sm font-bold text-primary">{t("fleet")}</span>
        </Link>

        <Link
          href="/account/service"
          className="flex items-center gap-4 p-6 bg-surface-container-lowest rounded-card hover:shadow-ambient transition-shadow"
          style={{ boxShadow: "var(--shadow-ambient)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary shrink-0">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <span className="text-sm font-bold text-primary">{t("service")}</span>
        </Link>

        <LogoutButton label={t("logout")} />
      </div>
    </div>
  );
}
