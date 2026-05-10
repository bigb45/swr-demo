import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { fetchGuestCartTotals, readCheckoutState } from "@/lib/checkout";
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

  const totals = await fetchGuestCartTotals(state.cartId);
  if (!totals) {
    redirect(`/${locale}/checkout/shipping`);
  }

  // Magento returns the chosen carrier+method indirectly: the `shipping`
  // total segment carries the human-readable title. Falling back to the raw
  // amount label avoids a hard error if the segment is missing.
  const shippingSegment = totals.total_segments?.find(
    (s) => s.code === "shipping",
  );
  const shippingTitle = shippingSegment?.title ?? null;

  // If shipping wasn't set yet (segment value is zero AND there's no title),
  // bounce back to step 2 so the user picks one.
  if (
    !shippingTitle &&
    (totals.shipping_amount ?? 0) === 0 &&
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
        totals={totals}
        shippingTitle={shippingTitle}
        paymentMethods={state.paymentMethods ?? []}
      />
    </>
  );
}
