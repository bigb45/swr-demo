import { redirect } from "next/navigation";

interface BulkOrderPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Side nav links here for “bulk CSV order”. CSV import lives on `/cart`
 * (`CsvImportButton`); this route exists so the link never 404s.
 */
export default async function BulkOrderPage({ params }: BulkOrderPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/cart`);
}
