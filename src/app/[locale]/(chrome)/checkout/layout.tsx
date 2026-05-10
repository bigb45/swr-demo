import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { fetchGuestCart, getAdminToken } from "@/lib/checkout";
import CheckoutStepper from "./CheckoutStepper";

interface CheckoutLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function CheckoutLayout({
  children,
  params,
}: CheckoutLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "checkout" });

  const cookieStore = await cookies();
  // Auth itself is enforced by src/proxy.ts for the /checkout segment, but we
  // duplicate the check here so the per-page server components can rely on a
  // resolvable token. Same for the cart-id cookie which the client mirrors
  // from localStorage in CartProvider.
  const customerToken = cookieStore.get("swr_customer_token")?.value;
  const cartId = cookieStore.get("swr_cart_id")?.value;

  if (!customerToken) {
    redirect(`/${locale}/account/login?from=/${locale}/checkout/address`);
  }
  if (!cartId) {
    redirect(`/${locale}/cart`);
  }

  // Verify the cart still exists in Magento and has at least one line item.
  // If it has been converted into an order on a previous attempt the masked
  // id no longer resolves, in which case we send the user back to /cart so
  // the client can mint a fresh one.
  let adminToken: string;
  try {
    adminToken = await getAdminToken();
  } catch {
    redirect(`/${locale}/cart`);
  }
  const cart = await fetchGuestCart(cartId, adminToken);
  if (!cart || (cart.items_count ?? 0) === 0) {
    redirect(`/${locale}/cart`);
  }

  return (
    <div className="swr-page-shell py-10">
      <div className="mx-auto w-full max-w-[1100px]">
      <h1 className="text-3xl font-black text-primary mb-2">{t("heading")}</h1>
      <p className="text-sm text-on-surface-variant mb-8">{t("subheading")}</p>

      <CheckoutStepper />

      {children}

      <div className="mt-10">
        <Link
          href="/cart"
          className="text-xs font-semibold text-on-surface-variant hover:text-on-surface"
        >
          &larr; {t("backToCart")}
        </Link>
      </div>
      </div>
    </div>
  );
}
