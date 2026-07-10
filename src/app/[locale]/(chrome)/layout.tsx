import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CopilotDock from "@/components/copilot/CopilotDock";

interface ChromeLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Main storefront shell: header, footer and the Copilot dock. Auth pages
 * live in the sibling `(auth)` group with a slimmed-down shell.
 */
export default async function ChromeLayout({
  children,
  params,
}: ChromeLayoutProps) {
  const { locale } = await params;

  return (
    <>
      <div
        id="swr-app-shell"
        className="flex min-h-full w-full flex-1 flex-col"
      >
        <Suspense
          fallback={
            <div
              className="sticky top-0 z-50 min-h-[4rem] sm:min-h-[calc(33px+4rem)] md:min-h-[calc(33px+4rem+2.75rem)] bg-white"
              style={{
                boxShadow: "0 10px 30px rgba(26,28,28,0.06)",
              }}
              aria-hidden
            />
          }
        >
          <Header locale={locale} />
        </Suspense>
        <div className="flex min-h-0 flex-1 w-full overflow-hidden">
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <Footer locale={locale} />
      </div>
      <CopilotDock />
    </>
  );
}
