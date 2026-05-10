import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/** Customs pillar hidden: keep URL for old links, send users to delivery. */
export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/services/delivery`);
}
