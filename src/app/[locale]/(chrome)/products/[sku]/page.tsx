import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import {
  getProductBySku,
} from "@/lib/magento";
import {
  getCustomAttribute,
  getProductGalleryUrls,
} from "@/lib/magento-shared";
import { getStockStatus, type StockLevel } from "@/lib/stock";
import ProductPrice from "@/components/ProductPrice";
import ProductGallery from "@/components/ui/ProductGallery";
import SpecTable from "@/components/ui/SpecTable";
import BulkPricingTable from "@/components/ui/BulkPricingTable";
import AddToCartCluster from "@/components/ui/AddToCartCluster";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import StockBadge from "@/components/ui/StockBadge";
import CopilotPageContextSetter from "@/components/copilot/CopilotPageContextSetter";

interface ProductDetailPageProps {
  params: Promise<{ locale: string; sku: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { locale, sku } = await params;
  try {
    const product = await getProductBySku(decodeURIComponent(sku));
    return {
      title: product.name,
      description:
        getCustomAttribute(product, "short_description")?.replace(
          /<[^>]+>/g,
          ""
        ) ?? `${product.name} · SKU: ${product.sku}`,
    };
  } catch {
    const t = await getTranslations({ locale, namespace: "products" });
    return { title: t("metaNotFoundTitle") };
  }
}

const SPEC_ATTRIBUTE_CODES = [
  "motor_type",
  "max_torque",
  "no_load_speed",
  "chuck_capacity",
  "ip_rating",
  "clutch_settings",
] as const;

type SpecAttributeCode = (typeof SPEC_ATTRIBUTE_CODES)[number];

const PRODUCT_TYPE_IDS = [
  "simple",
  "configurable",
  "bundle",
  "grouped",
  "virtual",
  "downloadable",
] as const;

type ProductTypeId = (typeof PRODUCT_TYPE_IDS)[number];

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { locale, sku } = await params;

  const t = await getTranslations({ locale, namespace: "products" });
  const tBc = await getTranslations({ locale, namespace: "breadcrumb" });

  let product;
  try {
    product = await getProductBySku(decodeURIComponent(sku));
  } catch {
    notFound();
  }

  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get("swr_customer_token")?.value;

  const galleryImages = getProductGalleryUrls(product).map((src) => ({
    src,
    alt: product.name,
  }));

  const shortDescription = getCustomAttribute(product, "short_description");
  const description = getCustomAttribute(product, "description");

  const stock = getStockStatus(product);
  const stockLabel = getStockLabel(stock.level, (key) => t(key));

  /* Build spec table rows from product attributes */
  const specRows: { attribute: React.ReactNode; value: React.ReactNode }[] = [];

  if (product.weight) {
    specRows.push({
      attribute: <span className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">{t("weight")}</span>,
      value: <span className="text-sm text-on-surface">{product.weight} kg</span>,
    });
  }

  if (product.type_id) {
    const typeId = product.type_id as ProductTypeId;
    const typeLabel = (PRODUCT_TYPE_IDS as readonly string[]).includes(product.type_id)
      ? t(`types.${typeId}`)
      : product.type_id.replace(/_/g, " ");
    specRows.push({
      attribute: <span className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">{t("productType")}</span>,
      value: <span className="text-sm text-on-surface capitalize">{typeLabel}</span>,
    });
  }

  /* Add any custom attributes as spec rows */
  for (const code of SPEC_ATTRIBUTE_CODES) {
    const val = getCustomAttribute(product, code);
    if (val) {
      specRows.push({
        attribute: (
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-on-surface-variant">
            {t(`specs.${code as SpecAttributeCode}`)}
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
    <div className="swr-page-shell flex min-h-full flex-col pt-6 sm:pt-8 pb-16">
      <CopilotPageContextSetter
        sku={product.sku}
        productName={product.name}
        categoryName={getCustomAttribute(product, "category_name") ?? undefined}
      />
      <Breadcrumbs
        className="mb-6 sm:mb-8"
        ariaLabel={tBc("ariaLabel")}
        items={[
          { label: tBc("home"), href: "/" },
          { label: tBc("products"), href: "/products" },
          { label: product.name },
        ]}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-8 sm:gap-10">
        <div className="flex min-w-0 flex-1 flex-col gap-8 sm:gap-10">
          {/* Product area */}
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
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
                    </div>
                  )}
                </div>

                {/* Add to cart */}
                <AddToCartCluster product={product} />

                {/* Bulk pricing — only when signed in and Magento has tier prices */}
                {bulkRows.length > 0 && isAuthenticated && (
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
            </div>
          </div>
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
