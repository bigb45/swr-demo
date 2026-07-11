import { getCountries } from "@/lib/directory";
import { LOCALE_STORE_CODES } from "@/lib/magento-shared";
import RegisterForm from "./RegisterForm";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;
  const countries = await getCountries(LOCALE_STORE_CODES[locale]);

  return (
    <RegisterForm
      countries={countries.map((c) => ({ code: c.code, name: c.name }))}
    />
  );
}
