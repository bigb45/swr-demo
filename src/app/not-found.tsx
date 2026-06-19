import { headers } from "next/headers";
import NotFoundContent, {
  detectLocaleFromPath,
} from "@/components/NotFoundContent";

export default async function NotFound() {
  const headersList = await headers();
  const pathname =
    headersList.get("x-pathname") ??
    headersList.get("x-invoke-path") ??
    headersList.get("next-url") ??
    headersList.get("x-url") ??
    "";
  const locale = detectLocaleFromPath(pathname);

  return <NotFoundContent locale={locale} />;
}
