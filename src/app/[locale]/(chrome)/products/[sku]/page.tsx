import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getProductBySku } from "@/lib/magento";
import {
  fetchErpDataForSkus,
  resolveEnventaCustomerId,
} from "@/lib/erp";
import { mergeErpStock } from "@/lib/erp-shared";
import { getConfigurableData } from "@/lib/configurable";
import {
  getCustomAttribute,
  getPimFeatures,
  getProductGalleryUrls,
} from "@/lib/magento-shared";
import { sanitizeProductHtml } from "@/lib/sanitize-html";
import { getStockStatus, type StockLevel } from "@/lib/stock";
import ProductGallery from "@/components/ui/ProductGallery";
import ProductInformation from "@/components/product/ProductInformation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import CopilotPageContextSetter from "@/components/copilot/CopilotPageContextSetter";
import ConfigurableProductView from "@/components/product/ConfigurableProductView";
import SimpleProductPurchase from "@/components/product/SimpleProductPurchase";

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
          "",
        ) ?? `${product.name} · SKU: ${product.sku}`,
    };
  } catch {
    const t = await getTranslations({ locale, namespace: "products" });
    return { title: t("metaNotFoundTitle") };
  }
}

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

  const parentGalleryUrls = getProductGalleryUrls(product);

  if (product.type_id === "configurable") {
    const configurable = await getConfigurableData(product);
    if (configurable) {
      return (
        <div className="swr-page-shell flex min-h-full flex-col pt-6 sm:pt-8 pb-16">
          <CopilotPageContextSetter
            sku={product.sku}
            productName={product.name}
            categoryName={
              getCustomAttribute(product, "category_name") ?? undefined
            }
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
            <ConfigurableProductView
              parent={product}
              configurable={configurable}
              parentGalleryUrls={parentGalleryUrls}
            />
          </div>
        </div>
      );
    }
  }

  const enventaId = isAuthenticated
    ? await resolveEnventaCustomerId()
    : null;
  const erpMap = enventaId
    ? await fetchErpDataForSkus([product.sku], enventaId)
    : new Map();
  const erp = erpMap.get(product.sku) ?? null;
  const stock = mergeErpStock(getStockStatus(product), erp);
  const stockLabel = getStockLabel(stock.level, (key) => t(key));

  const galleryImages = parentGalleryUrls.map((src) => ({
    src,
    alt: product.name,
  }));

  const shortDescription = getCustomAttribute(product, "short_description");
  const descriptionRaw = getCustomAttribute(product, "description");
  const description = descriptionRaw
    ? sanitizeProductHtml(descriptionRaw)
    : null;
  const shortDescriptionClean = shortDescription
    ? sanitizeProductHtml(shortDescription)
    : null;

  const pimFeatures = getPimFeatures(product);

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
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
            <div className="w-full lg:w-[376px] lg:shrink-0">
              <ProductGallery
                images={galleryImages}
                productName={product.name}
                stockLevel={stock.level === "unknown" ? undefined : stock.level}
                stockLabel={stockLabel}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-8">
              <div>
                <h1 className="text-2xl font-black text-primary uppercase tracking-[-0.02em] leading-tight">
                  {product.name}
                </h1>
                <p className="text-xs text-on-surface-variant mt-2 font-mono">
                  {t("skuLabel")}: {product.sku}
                </p>
                {shortDescriptionClean ? (
                  <div
                    className="mt-3 text-sm text-on-surface-variant leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: shortDescriptionClean }}
                  />
                ) : null}
              </div>

              <SimpleProductPurchase
                product={product}
                initialErp={erp}
                stockLabel={stockLabel}
              />

              <ProductInformation features={pimFeatures} />

              {description ? (
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-4">
                    {t("description")}
                  </h2>
                  <div
                    className="text-sm text-on-surface-variant leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </div>
              ) : null}
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
