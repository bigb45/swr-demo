import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { AccountDashboardCard } from "@/components/account/AccountDashboardCard";
import { getAccountDashboardStats } from "@/lib/account-dashboard";
import LogoutButton from "./LogoutButton";

interface AccountPageProps {
  params: Promise<{ locale: string }>;
}

const iconClass = "text-primary";

function OrderIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden
    >
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function QuotationIcon() {
  return (
    <svg
      width="20"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function AddressIcon() {
  return (
    <svg
      width="20"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="25"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function FleetIcon() {
  return (
    <svg
      width="23"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden
    >
      <path d="M3 9h18l-2 11H5L3 9z" />
      <path d="M8 9V5a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function ServiceIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const t = await getTranslations({ locale, namespace: "account" });
  const stats = await getAccountDashboardStats(token);

  const ordersMeta =
    stats.activeOrders > 0 ? t("badgeOrders", { count: stats.activeOrders }) : null;
  const quotationsMeta =
    stats.pendingQuotations > 0
      ? t("badgeQuotations", { count: stats.pendingQuotations })
      : null;
  const fleetMeta =
    stats.fleetAlerts > 0 ? t("badgeFleetAlerts", { count: stats.fleetAlerts }) : null;

  return (
    <div className="swr-page-shell py-10">
      <div className="mx-auto w-full max-w-[1280px]">
        <header className="mb-8 flex flex-col gap-1">
          <h1 className="text-3xl font-black leading-tight tracking-tight text-primary">
            {t("heading")}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-on-surface-variant">
            {t("intro")}
          </p>
        </header>

        <section className="mb-6" aria-labelledby="account-primary-heading">
          <h2
            id="account-primary-heading"
            className="mb-3 text-sm font-semibold text-on-surface"
          >
            {t("sectionPrimary")}
          </h2>
          <nav
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            aria-label={t("navPrimaryAria")}
          >
            <AccountDashboardCard
              href="/orders"
              title={t("orderHistory")}
              tagline={t("orderHistoryTagline")}
              icon={<OrderIcon />}
              meta={ordersMeta}
              metaTone="primary"
            />
            <AccountDashboardCard
              href="/account/addresses"
              title={t("addresses")}
              tagline={t("addressesTagline")}
              icon={<AddressIcon />}
            />
            <AccountDashboardCard
              href="/account/profile"
              title={t("profile")}
              tagline={t("profileTagline")}
              icon={<ProfileIcon />}
            />
          </nav>
        </section>

        <section className="mb-8" aria-labelledby="account-more-heading">
          <h2
            id="account-more-heading"
            className="mb-3 text-sm font-semibold text-on-surface"
          >
            {t("sectionMore")}
          </h2>
          <nav
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            aria-label={t("navMoreAria")}
          >
            <AccountDashboardCard
              href="/account/quotations"
              title={t("quotations")}
              tagline={t("quotationsTagline")}
              icon={<QuotationIcon />}
              meta={quotationsMeta}
              metaTone="primary"
            />
            <AccountDashboardCard
              href="/account/fleet"
              title={t("fleet")}
              tagline={t("fleetTagline")}
              icon={<FleetIcon />}
              meta={fleetMeta}
              metaTone="danger"
            />
            <AccountDashboardCard
              href="/account/service"
              title={t("service")}
              tagline={t("serviceTagline")}
              icon={<ServiceIcon />}
            />
          </nav>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/25 pt-6">
          <Link
            href="/catalog"
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t("technicalData")}
          </Link>
          <LogoutButton variant="inline" label={t("logout")} />
        </footer>
      </div>
    </div>
  );
}
