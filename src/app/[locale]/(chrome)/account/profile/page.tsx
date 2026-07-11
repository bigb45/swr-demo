import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { fetchCustomerMe } from "@/lib/checkout";
import { readCustomerPhone } from "@/lib/customer-phone";
import ProfileForm from "./ProfileForm";

interface ProfilePageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { locale } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    redirect(`/${locale}/account/login?from=/${locale}/account/profile`);
  }

  const me = await fetchCustomerMe(token);
  if (!me) {
    redirect(`/${locale}/account/login?from=/${locale}/account/profile`);
  }

  const t = await getTranslations({ locale, namespace: "account" });

  return (
    <div className="swr-page-shell py-10">
      <div className="mx-auto w-full max-w-[700px]">
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface"
        >
          <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
          {t("backToAccount")}
        </Link>

        <h1 className="mb-6 text-2xl font-black text-primary">
          {t("profileHeading")}
        </h1>

        <div className="bg-surface-container-lowest p-6 sm:p-8">
          <ProfileForm
            initial={{
              firstname: me.firstname ?? "",
              lastname: me.lastname ?? "",
              email: me.email,
              phone: readCustomerPhone(me),
            }}
            redirectTo="/account"
          />
        </div>
      </div>
    </div>
  );
}
