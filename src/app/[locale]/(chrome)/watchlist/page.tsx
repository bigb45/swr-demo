import { getTranslations } from "next-intl/server";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import WatchlistPageClient from "./WatchlistPageClient";

interface WatchlistPageProps {
  params: Promise<{ locale: string }>;
}

export default async function WatchlistPage({ params }: WatchlistPageProps) {
  const { locale } = await params;
  const tBc = await getTranslations({ locale, namespace: "breadcrumb" });

  return (
    <div className="swr-page-shell py-6 sm:py-8 flex flex-col gap-4 sm:gap-6">
      <Breadcrumbs
        ariaLabel={tBc("ariaLabel")}
        items={[{ label: tBc("home"), href: "/" }, { label: tBc("watchlist") }]}
      />
      <WatchlistPageClient />
    </div>
  );
}
