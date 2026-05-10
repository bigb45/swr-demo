import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getCustomerEmail, listCustomerOrders } from "@/lib/orders";
import {
  resolveOrderStatus,
  statusBadgeClasses,
} from "@/lib/orderStatus";

interface OrdersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    redirect(`/${locale}/account/login`);
  }

  const t = await getTranslations({ locale, namespace: "orders" });

  const email = await getCustomerEmail(token);
  const orders = email ? await listCustomerOrders(email) : [];

  const fmt = new Intl.NumberFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { style: "currency", currency: "EUR" },
  );

  const dateFmt = new Intl.DateTimeFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <div className="swr-page-shell py-10">
      <div className="mx-auto w-full max-w-[900px]">
      <h1 className="text-3xl font-black text-primary mb-8">{t("heading")}</h1>

      {orders.length > 0 ? (
        <>
          <div
            className="hidden sm:grid text-xs font-semibold uppercase tracking-wide text-on-surface-variant bg-surface-container-low px-4 py-2 mb-1 rounded-t"
            style={{ gridTemplateColumns: "1fr 160px 140px 120px 80px" }}
          >
            <span>{t("colOrder")}</span>
            <span>{t("colDate")}</span>
            <span>{t("colStatus")}</span>
            <span className="text-right">{t("colTotal")}</span>
            <span />
          </div>

          {orders.map((order) => {
            const resolved = resolveOrderStatus(order, t);
            const badgeClasses = statusBadgeClasses(resolved.tone);
            return (
              <div
                key={order.entity_id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_160px_140px_120px_80px] items-center gap-1 sm:gap-0 px-4 py-3 border-b border-outline-variant/20 text-sm"
              >
                <span className="font-bold text-on-surface">
                  #{order.increment_id}
                </span>
                <span className="text-on-surface-variant">
                  {dateFmt.format(new Date(order.created_at))}
                </span>
                <span>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded ${badgeClasses}`}
                  >
                    {resolved.label}
                  </span>
                </span>
                <span className="text-right font-medium text-on-surface">
                  {fmt.format(order.grand_total)}
                </span>
                <span className="text-right">
                  <Link
                    href={`/orders/${order.entity_id}`}
                    className="text-xs font-bold text-secondary hover:underline"
                  >
                    {t("viewOrder")}
                  </Link>
                </span>
              </div>
            );
          })}
        </>
      ) : (
        <div className="py-16 text-center text-on-surface-variant">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-4 opacity-30"
          >
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 12h6M9 16h4" />
          </svg>
          <p className="text-sm font-medium">{t("empty")}</p>
        </div>
      )}
      </div>
    </div>
  );
}
