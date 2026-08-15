import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  fetchGuestCartLineItems,
  fetchGuestCartTotals,
  readCheckoutState,
} from "@/lib/checkout";
import {
  applyErpPricingToCartDisplay,
  resolveEnventaCustomerId,
} from "@/lib/erp";
import ReviewStep from "./ReviewStep";

interface ReviewPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });

  const state = await readCheckoutState();
  if (!state) {
    redirect(`/${locale}/checkout/address`);
  }

  const [totals, cartLines] = await Promise.all([
    fetchGuestCartTotals(state.cartId),
    fetchGuestCartLineItems(state.cartId),
  ]);
  if (!totals) {
    redirect(`/${locale}/checkout/shipping`);
  }

  // Magento quote prices are often 0 for ERP SKUs — overlay Teia net for display.
  const enventaId = await resolveEnventaCustomerId();
  const magentoItems = totals.items ?? [];
  const itemsForErp = magentoItems.map((it, i) => ({
    sku: cartLines?.[i]?.sku ?? "",
    qty: it.qty,
    price: it.price ?? 0,
  }));

  const priced = await applyErpPricingToCartDisplay(
    itemsForErp,
    totals,
    enventaId,
  );

  const displayTotals = {
    ...priced.totals,
    items: (priced.totals.items ?? magentoItems).map((it, i) => ({
      ...magentoItems[i],
      ...it,
      name: magentoItems[i]?.name ?? it.name,
      qty: magentoItems[i]?.qty ?? it.qty,
    })),
  };

  // Magento returns the chosen carrier+method indirectly: the `shipping`
  // total segment carries the human-readable title. Falling back to the raw
  // amount label avoids a hard error if the segment is missing.
  const shippingSegment = displayTotals.total_segments?.find(
    (s) => s.code === "shipping",
  );
  const shippingTitle = shippingSegment?.title ?? null;

  // If shipping wasn't set yet (segment value is zero AND there's no title),
  // bounce back to step 2 so the user picks one.
  if (
    !shippingTitle &&
    (displayTotals.shipping_amount ?? 0) === 0 &&
    !shippingSegment
  ) {
    redirect(`/${locale}/checkout/shipping`);
  }

  return (
    <>
      <p className="text-sm text-on-surface mb-6 max-w-2xl leading-relaxed">
        {t("reviewLead")}
      </p>
      <ReviewStep
        locale={locale}
        address={state.address}
        totals={displayTotals}
        shippingTitle={shippingTitle}
        paymentMethods={state.paymentMethods ?? []}
      />
    </>
  );
}
