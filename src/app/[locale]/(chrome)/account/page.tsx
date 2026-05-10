import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

function TechnicalDataIcon() {
  return (
    <svg
      width="25"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="14" rx="1.5" />
      <path d="M6 17h12" />
      <path d="M6 11l2 2 1.5-1.5" />
      <line x1="11" y1="14" x2="16" y2="14" />
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

  const ordersBadge =
    stats.activeOrders > 0 ? t("badgeOrders", { count: stats.activeOrders }) : null;
  const quotationsBadge =
    stats.pendingQuotations > 0
      ? t("badgeQuotations", { count: stats.pendingQuotations })
      : null;
  const fleetBadge =
    stats.fleetAlerts > 0 ? t("badgeFleetAlerts", { count: stats.fleetAlerts }) : null;

  return (
    <div className="swr-page-shell py-10">
      <div className="mx-auto w-full max-w-[1280px]">
        <header className="mb-10 flex flex-col gap-1.5">
          <div
            className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase leading-4 tracking-[0.06em]"
            aria-label={t("breadcrumbAria")}
          >
            <span className="text-on-surface-variant">{t("breadcrumbAccount")}</span>
            <span className="text-on-surface-variant/60" aria-hidden>
              /
            </span>
            <span className="text-primary">{t("breadcrumbDashboard")}</span>
          </div>
          <h1 className="text-4xl font-black uppercase leading-10 tracking-[-0.045em] text-primary">
            {t("heading")}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-on-surface-variant">
            {t("intro")}
          </p>
        </header>

        <nav
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label={t("navAria")}
        >
          <AccountDashboardCard
            href="/orders"
            title={t("orderHistory")}
            tagline={t("orderHistoryTagline")}
            icon={<OrderIcon />}
            badge={ordersBadge}
            badgeTone="primary"
          />
          <AccountDashboardCard
            href="/account/quotations"
            title={t("quotations")}
            tagline={t("quotationsTagline")}
            icon={<QuotationIcon />}
            badge={quotationsBadge}
            badgeTone="primary"
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
          <AccountDashboardCard
            href="/account/fleet"
            title={t("fleet")}
            tagline={t("fleetTagline")}
            icon={<FleetIcon />}
            badge={fleetBadge}
            badgeTone="danger"
          />
          <AccountDashboardCard
            href="/account/service"
            title={t("service")}
            tagline={t("serviceTagline")}
            icon={<ServiceIcon />}
          />
          <AccountDashboardCard
            href="/catalog"
            title={t("technicalData")}
            tagline={t("technicalDataTagline")}
            icon={<TechnicalDataIcon />}
          />
          <LogoutButton
            variant="dashboardTile"
            label={t("logout")}
            tagline={t("logoutTagline")}
          />
        </nav>
      </div>
    </div>
  );
}
