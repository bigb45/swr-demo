import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getProductBySku,
  getProductImageUrl,
  getCustomAttribute,
  getTopLevelCategories,
  MEDIA_BASE,
} from "@/lib/magento";
import { getStockStatus, type StockLevel } from "@/lib/stock";
import ProductPrice from "@/components/ProductPrice";
import SideNav from "@/components/ui/SideNav";
import ProductGallery from "@/components/ui/ProductGallery";
import SpecTable from "@/components/ui/SpecTable";
import BulkPricingTable from "@/components/ui/BulkPricingTable";
import AddToCartCluster from "@/components/ui/AddToCartCluster";
import CertBadge from "@/components/ui/CertBadge";
import FeatureCard from "@/components/ui/FeatureCard";
import StockBadge from "@/components/ui/StockBadge";

interface ProductDetailPageProps {
  params: Promise<{ locale: string; sku: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { sku } = await params;
  try {
    const product = await getProductBySku(decodeURIComponent(sku));
    return {
      title: product.name,
      description:
        getCustomAttribute(product, "short_description")?.replace(
          /<[^>]+>/g,
          ""
        ) ?? `${product.name} — SKU: ${product.sku}`,
    };
  } catch {
    return { title: "Product not found" };
  }
}

/* Feature icons */
const ICON_BRUSHLESS = (
  <svg width="27" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const ICON_GEARBOX = (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const ICON_LIGHT = (
  <svg width="22" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CERT_ICON_ISO = (
  <svg width="13" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const CERT_ICON_WARRANTY = (
  <svg width="9" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
  </svg>
);
const CERT_ICON_ENERGY = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { locale, sku } = await params;

  const t = await getTranslations({ locale, namespace: "products" });
  const tBc = await getTranslations({ locale, namespace: "breadcrumb" });
  const tSidebar = await getTranslations({ locale, namespace: "sidebar" });

  let product;
  try {
    product = await getProductBySku(decodeURIComponent(sku));
  } catch {
    notFound();
  }

  const categories = await getTopLevelCategories().catch(() => []);

  const allImages = product.media_gallery_entries ?? [];
  const primaryImageUrl = getProductImageUrl(product);

  const galleryImages = allImages.length > 0
    ? allImages.map((entry) => ({
        src: `${MEDIA_BASE}/media/catalog/product${entry.file}`,
        alt: entry.label ?? product.name,
      }))
    : primaryImageUrl
    ? [{ src: primaryImageUrl, alt: product.name }]
    : [];

  const shortDescription = getCustomAttribute(product, "short_description");
  const description = getCustomAttribute(product, "description");

  const stock = getStockStatus(product);
  const stockLabel = getStockLabel(stock.level, (key) => t(key));
  const showDispatchHint = stock.level === "in" || stock.level === "low";

  /* Build spec table rows from product attributes */
  const specRows: { attribute: React.ReactNode; value: React.ReactNode }[] = [];

  if (product.weight) {
    specRows.push({
      attribute: <span className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">{t("weight")}</span>,
      value: <span className="text-sm text-on-surface">{product.weight} kg</span>,
    });
  }

  if (product.type_id) {
    specRows.push({
      attribute: <span className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">{t("productType")}</span>,
      value: <span className="text-sm text-on-surface capitalize">{product.type_id.replace(/_/g, " ")}</span>,
    });
  }

  /* Add any custom attributes as spec rows */
  const specAttributeCodes = ["motor_type", "max_torque", "no_load_speed", "chuck_capacity", "ip_rating", "clutch_settings"];
  for (const code of specAttributeCodes) {
    const val = getCustomAttribute(product, code);
    if (val) {
      specRows.push({
        attribute: (
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            {code.replace(/_/g, " ")}
          </span>
        ),
        value: <span className="text-sm text-on-surface">{val}</span>,
      });
    }
  }

  /* Bulk pricing tiers — sourced from Magento tier_prices */
  const tiers = product.tier_prices ?? [];
  // Sort ascending by qty so the table reads naturally
  const sortedTiers = [...tiers].sort((a, b) => a.qty - b.qty);
  const bulkRows = sortedTiers.map((tier, idx) => {
    const nextTier = sortedTiers[idx + 1];
    const qtyLabel = nextTier
      ? `${tier.qty} – ${nextTier.qty - 1}`
      : `${tier.qty}+`;
    const pct = tier.extension_attributes?.percentage_value;
    const savingsLabel = pct ? `${Math.round(pct)}% ${t("savings")}` : undefined;
    return {
      quantityLabel: qtyLabel,
      priceNode: (
        <div className="flex flex-col gap-0.5">
          {product.price > 0 && tier.value < product.price && (
            <ProductPrice
              eurPrice={product.price}
              exclVatLabel=""
              priceOnRequestLabel={t("priceOnRequest")}
              className="text-xs font-medium text-on-surface-variant line-through decoration-on-surface-variant/70"
            />
          )}
          <ProductPrice
            eurPrice={tier.value}
            exclVatLabel=""
            priceOnRequestLabel={t("priceOnRequest")}
            className="text-sm font-medium text-on-surface"
          />
        </div>
      ),
      savingsLabel,
    };
  });

  return (
    <div className="flex min-h-full">
      {/* Sidebar */}
      <SideNav locale={locale} categories={categories} width="wide" />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-16 flex flex-col gap-8 sm:gap-10">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary transition-colors">
              {tBc("catalog")}
            </Link>
            <span className="opacity-40">/</span>
            <Link href="/products" className="hover:text-primary transition-colors">
              {tBc("products")}
            </Link>
            <span className="opacity-40">/</span>
            <span className="text-on-surface font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </nav>

          {/* Product area */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* Gallery — full width on mobile, fixed 376px on desktop */}
            <div className="w-full lg:w-[376px] lg:shrink-0">
              <ProductGallery
                images={galleryImages}
                productName={product.name}
                stockLevel={stock.level === "unknown" ? undefined : stock.level}
                stockLabel={stockLabel}
              />
            </div>

            {/* Purchase panel — remaining width */}
            <div className="flex-1 min-w-0 flex flex-col gap-8">
              {/* Product name + model */}
              <div>
                <h1 className="text-2xl font-black text-primary uppercase tracking-[-0.02em] leading-tight">
                  {product.name}
                </h1>
                <p className="text-xs text-on-surface-variant mt-2 font-mono">
                  {t("skuLabel")}: {product.sku}
                </p>
                {shortDescription && (
                  <div
                    className="mt-3 text-sm text-on-surface-variant leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: shortDescription }}
                  />
                )}
              </div>

              {/* Pricing card */}
              <div
                className="bg-surface-container-lowest shadow-ambient p-6 flex flex-col gap-6"
                style={{ borderRadius: "var(--radius-card)" }}
              >
                {/* Price + stock row */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                      {t("standardPrice")}
                    </p>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <ProductPrice
                        eurPrice={product.price}
                        exclVatLabel={t("exclVat")}
                        priceOnRequestLabel={t("priceOnRequest")}
                        className="text-3xl sm:text-4xl font-black text-on-surface leading-none"
                      />
                    </div>
                  </div>
                  {stock.level !== "unknown" && (
                    <div className="sm:text-right max-w-full sm:max-w-[260px]">
                      <StockBadge
                        level={stock.level}
                        label={stockLabel}
                        size="md"
                      />
                      {typeof stock.qty === "number" && stock.level === "low" && (
                        <p className="text-xs text-warning mt-1 leading-relaxed text-pretty">
                          {t("lowStockRemaining", { qty: stock.qty })}
                        </p>
                      )}
                      {showDispatchHint && (
                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed text-pretty">
                          {t("sameDayDispatch")}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Add to cart */}
                <AddToCartCluster product={product} />

                {/* Bulk pricing — only rendered when Magento has tier prices configured */}
                {bulkRows.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant mb-1">
                        {t("bulkPricing")}
                      </p>
                      <p className="text-sm text-on-surface-variant">
                        {t("bulkPricingTableHint")}
                      </p>
                    </div>
                    <BulkPricingTable
                      headers={{
                        quantity: t("quantity"),
                        pricePerUnit: t("pricePerUnit"),
                        savings: t("savings"),
                      }}
                      rows={bulkRows}
                    />
                  </div>
                )}
              </div>

              {/* Technical Specifications */}
              {specRows.length > 0 && (
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-4">
                    {t("specifications")}
                  </h2>
                  <SpecTable
                    columns={[
                      { key: "attribute", label: "", className: "w-[180px]" },
                      { key: "value", label: "" },
                    ]}
                    rows={specRows}
                  />
                </div>
              )}

              {/* Description */}
              {description && (
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-4">
                    {t("description")}
                  </h2>
                  <div
                    className="text-sm text-on-surface-variant leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </div>
              )}

              {/* Certification badges */}
              <div className="flex flex-wrap gap-3">
                <CertBadge icon={CERT_ICON_ISO} label="ISO 9001:2015" />
                <CertBadge icon={CERT_ICON_WARRANTY} label={t("warrantyLabel")} />
                <CertBadge icon={CERT_ICON_ENERGY} label={t("energyEfficient")} />
              </div>
            </div>
          </div>

          {/* Features grid */}
          <section>
            <h2 className="text-xl font-black text-secondary uppercase tracking-[-0.01em] mb-8">
              {t("engineeredForJobsite")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={ICON_BRUSHLESS}
                title={t("feature1Title")}
                description={t("feature1Desc")}
              />
              <FeatureCard
                icon={ICON_GEARBOX}
                title={t("feature2Title")}
                description={t("feature2Desc")}
              />
              <FeatureCard
                icon={ICON_LIGHT}
                title={t("feature3Title")}
                description={t("feature3Desc")}
              />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function getStockLabel(
  level: StockLevel,
  t: (key: "inStock" | "lowStock" | "outOfStock") => string,
): string {
  switch (level) {
    case "in":
      return t("inStock");
    case "low":
      return t("lowStock");
    case "out":
      return t("outOfStock");
    case "unknown":
    default:
      return t("inStock");
  }
}
