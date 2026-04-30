import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listCustomerMachines, warrantyStatus } from "@/lib/fleet";
import FleetMachineCard from "@/components/fleet/FleetMachineCard";

interface FleetPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: FleetPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "fleet" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function FleetPage({ params }: FleetPageProps) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) redirect(`/${locale}/account/login`);

  const t = await getTranslations({ locale, namespace: "fleet" });
  const machines = await listCustomerMachines();

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/account"
          className="text-xs font-bold uppercase tracking-[0.12em] text-secondary hover:underline"
        >
          ← {t("backToAccount")}
        </Link>
        <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-[-0.02em] uppercase">
          {t("heading")}
        </h1>
        <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">
          {t("subheading")}
        </p>
      </div>

      {/* Counters — warranty split (active / expiring ≤90d / expired) + activity */}
      {machines.length > 0 ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-outline-variant/40 overflow-hidden"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          {[
            { value: machines.length, label: t("counters.machines") },
            {
              value: machines.filter((m) => warrantyStatus(m) === "active").length,
              label: t("counters.warrantyActive"),
            },
            {
              value: machines.filter((m) => warrantyStatus(m) === "expiring")
                .length,
              label: t("counters.warrantyExpiring"),
            },
            {
              value: machines.filter((m) => warrantyStatus(m) === "expired")
                .length,
              label: t("counters.warrantyExpired"),
            },
            {
              value: machines.reduce((acc, m) => acc + m.maintenance.length, 0),
              label: t("counters.serviceEvents"),
            },
            {
              value: new Set(machines.map((m) => m.brand)).size,
              label: t("counters.brands"),
            },
          ].map((c, i) => (
            <div key={i} className="bg-surface-container-lowest p-5 flex flex-col gap-1">
              <span className="text-2xl font-black text-primary tracking-[-0.02em]">
                {c.value}
              </span>
              <span className="text-xs text-on-surface-variant uppercase tracking-[0.08em]">
                {c.label}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {machines.length === 0 ? (
        <div
          className="p-8 sm:p-10 bg-surface-container-low flex flex-col items-start gap-4 max-w-3xl"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black text-primary uppercase tracking-[-0.01em]">
              {t("empty.heading")}
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-xl">
              {t("empty.body")}
            </p>
          </div>
          <ul className="flex flex-col gap-1 text-sm text-on-surface-variant">
            {(["import", "register", "track"] as const).map((k) => (
              <li key={k} className="flex items-start gap-2">
                <span aria-hidden="true" className="text-secondary font-black">
                  →
                </span>
                <span>{t(`empty.bullets.${k}`)}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="text-xs font-bold uppercase tracking-[0.12em] bg-primary text-white px-4 py-3 hover:bg-primary-container transition-colors"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              {t("empty.ctaContact")}
            </Link>
            <Link
              href="/orders"
              className="text-xs font-bold uppercase tracking-[0.12em] text-primary px-4 py-3 hover:bg-surface-container-lowest transition-colors"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              {t("empty.ctaOrders")}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map((m) => (
            <FleetMachineCard
              key={m.id}
              machine={m}
              locale={locale}
              labels={{
                serial: t("card.serial"),
                purchased: t("card.purchased"),
                warrantyUntil: t("card.warrantyUntil"),
                statusActive: t("card.statusActive"),
                statusExpiring: t("card.statusExpiring"),
                statusExpired: t("card.statusExpired"),
                viewDetails: t("card.viewDetails"),
                lastService: t("card.lastService"),
                noService: t("card.noService"),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
