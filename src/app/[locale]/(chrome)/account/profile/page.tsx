import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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
      <h1 className="text-2xl font-black text-primary mb-8">
        {t("profileHeading")}
      </h1>

      <div
        className="bg-surface-container-lowest p-6 sm:p-8 rounded-card"
        style={{ boxShadow: "var(--shadow-ambient)" }}
      >
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
