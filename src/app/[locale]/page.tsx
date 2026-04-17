import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getProducts, getTopLevelCategories, getProductImageUrl } from "@/lib/magento";
import SideNav from "@/components/ui/SideNav";
import CategoryGrid from "@/components/ui/CategoryGrid";
import type { CategoryItem } from "@/components/ui/CategoryGrid";
import SpecTable from "@/components/ui/SpecTable";
import BentoSection from "@/components/ui/BentoSection";
import Button from "@/components/ui/Button";
import ProductPrice from "@/components/ProductPrice";

export const revalidate = 60;

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

/* Category icons — inline SVG for zero-dependency */
const ICON_FASTENERS = (
  <svg width="28" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M8 6l4-4 4 4M8 18l4 4 4-4" />
  </svg>
);
const ICON_RAW = (
  <svg width="27" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="18" rx="1" />
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="7" y1="16" x2="13" y2="16" />
  </svg>
);
const ICON_HAND = (
  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const ICON_POWER = (
  <svg width="27" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const ICON_SAFETY = (
  <svg width="24" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const ICON_ABRASIVES = (
  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
  </svg>
);
const ICON_PIPES = (
  <svg width="33" height="33" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h6v18H3zM15 3h6v18h-6zM9 8h6M9 16h6" />
  </svg>
);
const ICON_MACHINING = (
  <svg width="27" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const ICON_ELECTRICAL = (
  <svg width="24" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const ICON_STORAGE = (
  <svg width="29" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);
const ICON_PLUMBING = (
  <svg width="24" height="29" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z" />
    <path d="M12 14v8M8 22h8" />
  </svg>
);
const ICON_HVAC = (
  <svg width="15" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>
);

const FALLBACK_ICONS = [
  ICON_FASTENERS, ICON_RAW, ICON_HAND, ICON_POWER, ICON_SAFETY, ICON_ABRASIVES,
  ICON_PIPES, ICON_MACHINING, ICON_ELECTRICAL, ICON_STORAGE, ICON_PLUMBING, ICON_HVAC,
];

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const tHero = await getTranslations({ locale, namespace: "hero" });
  const tErr = await getTranslations({ locale, namespace: "errors" });
  const tProducts = await getTranslations({ locale, namespace: "products" });
  const tSidebar = await getTranslations({ locale, namespace: "sidebar" });

  const [productList, categories] = await Promise.allSettled([
    getProducts(5),
    getTopLevelCategories(),
  ]);

  const products =
    productList.status === "fulfilled" ? productList.value.items : [];
  const cats = categories.status === "fulfilled" ? categories.value : [];

  /* Build category items for the grid (up to 12 for 2 rows of 6) */
  const categoryItems: CategoryItem[] = cats.slice(0, 12).map((cat, idx) => ({
    id: cat.id,
    name: cat.name,
    href: `/categories/${cat.id}`,
    icon: FALLBACK_ICONS[idx % FALLBACK_ICONS.length],
  }));

  /* Build spec table rows from real products */
  const specRows = products.map((p) => {
    const imageUrl = getProductImageUrl(p);
    return {
      partNumber: (
        <Link
          href={`/products/${encodeURIComponent(p.sku)}`}
          className="text-primary font-medium hover:underline text-xs"
        >
          {p.sku}
        </Link>
      ),
      description: (
        <span className="text-sm text-on-surface">{p.name}</span>
      ),
      material: (
        <span className="text-sm text-on-surface-variant">—</span>
      ),
      stock: (
        <span
          className={`text-xs font-semibold ${
            p.status === 1
              ? "text-secondary"
              : "text-warning"
          }`}
        >
          {p.status === 1 ? tProducts("inStock") : tProducts("unavailable")}
        </span>
      ),
      price: (
        <ProductPrice
          eurPrice={p.price}
          exclVatLabel=""
          priceOnRequestLabel={tProducts("priceOnRequest")}
          className="text-sm font-semibold text-on-surface"
        />
      ),
    };
  });

  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <SideNav locale={locale} categories={cats} width="narrow" />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-16 flex flex-col gap-8 sm:gap-10">

          {/* Hero */}
          <section
            className="relative overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #003a63 0%, #005288 100%)",
              borderRadius: "var(--radius-card)",
              minHeight: "367px",
            }}
          >
            {/* Valve product image — decorative overlay, right half */}
            <div className="absolute bottom-0 left-1/2 right-0 top-0 mix-blend-overlay opacity-30 pointer-events-none select-none">
              {/* desaturate the image so it reads as a tonal texture */}
              <div aria-hidden="true" className="absolute inset-0 bg-white mix-blend-saturation" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt=""
                src="/hero-valve.png"
                className="absolute w-full object-cover object-center"
                style={{ top: "-20%", height: "141%" }}
              />
            </div>

            <div className="relative z-10 px-6 py-8 sm:px-12 sm:py-12 max-w-[672px]">
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-[-0.02em] mb-4 sm:mb-6 uppercase">
                {tHero("title")}
              </h1>
              <p className="text-sm sm:text-base text-white/80 mb-6 sm:mb-8 leading-relaxed">
                {tHero("subtitle")}
              </p>
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-secondary text-white font-bold text-base hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] transition-all"
                  style={{ borderRadius: "var(--radius-btn)" }}
                >
                  {tHero("browseProducts")}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-transparent text-white font-bold text-base border border-white/40 hover:bg-white/10 transition-all"
                  style={{ borderRadius: "var(--radius-btn)" }}
                >
                  {tHero("requestQuote")}
                </Link>
              </div>
            </div>
          </section>

          {/* Category Grid */}
          {categoryItems.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-on-surface tracking-[-0.02em] uppercase">
                  {t("topCategories")}
                </h2>
                <Link
                  href="/products"
                  className="text-sm font-semibold text-secondary hover:underline"
                >
                  {t("viewAllCategories", { count: cats.length })}
                </Link>
              </div>
              <CategoryGrid
                categories={categoryItems.slice(0, 6)}
                columns={6}
              />
              {categoryItems.length > 6 && (
                <div className="mt-0.5">
                  <CategoryGrid
                    categories={categoryItems.slice(6, 12)}
                    columns={6}
                  />
                </div>
              )}
            </section>
          )}

          {/* New Arrivals Spec Table */}
          <section>
            {productList.status === "rejected" ? (
              <div
                className="p-6 text-center bg-surface-container-lowest"
                style={{ borderRadius: "var(--radius-card)" }}
              >
                <p className="text-sm text-error">
                  {tErr("productsUnavailable", { url: "localhost:8000" })}
                </p>
              </div>
            ) : (
              <SpecTable
                header={
                  <>
                    <span className="text-xs font-bold uppercase tracking-[0.05em]">
                      {t("newArrivals")}
                    </span>
                    <span className="text-xs text-white/60">{t("updatedRecently")}</span>
                  </>
                }
                columns={[
                  { key: "partNumber", label: t("colPartNumber"), className: "w-[110px]" },
                  { key: "description", label: t("colDescription") },
                  { key: "material", label: t("colMaterial"), className: "w-[180px]" },
                  { key: "stock", label: t("colStock"), className: "w-[140px]" },
                  { key: "price", label: t("colPrice"), className: "w-[110px] text-right" },
                ]}
                rows={specRows}
              />
            )}
          </section>

          {/* Bento Section */}
          <section>
            <BentoSection
              primary={
                <div className="flex flex-col gap-4">
                  <h3 className="text-2xl font-black text-primary uppercase tracking-[-0.02em]">
                    {t("customMillingTitle")}
                  </h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed max-w-xl">
                    {t("customMillingDesc")}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <Button variant="primary" size="sm">
                      {t("uploadCadFile")}
                    </Button>
                    <Button variant="ghost" size="sm">
                      {t("viewCapabilities")}
                    </Button>
                  </div>
                </div>
              }
              secondary={
                <div className="flex flex-col gap-4">
                  <svg width="33" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  <h4 className="text-lg font-bold text-primary uppercase tracking-[-0.01em]">
                    {t("complianceCenterTitle")}
                  </h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed flex-1">
                    {t("complianceCenterDesc")}
                  </p>
                  <Link
                    href="/compliance"
                    className="text-xs font-bold text-primary uppercase tracking-[0.05em] hover:underline mt-auto"
                  >
                    {t("accessDocuments")} →
                  </Link>
                </div>
              }
            />
          </section>

        </div>
      </div>
    </div>
  );
}
