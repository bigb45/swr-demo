"use client";

import { usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const STEPS = ["address", "shipping", "review"] as const;
type Step = (typeof STEPS)[number];

function detectStep(pathname: string): Step | null {
  if (pathname.endsWith("/checkout/address")) return "address";
  if (pathname.endsWith("/checkout/shipping")) return "shipping";
  if (pathname.endsWith("/checkout/review")) return "review";
  return null;
}

export default function CheckoutStepper() {
  const pathname = usePathname();
  const t = useTranslations("checkout");
  const activeStep = detectStep(pathname);

  return (
    <nav
      aria-label={t("stepperLabel")}
      className="mb-10 -mx-4 px-4 overflow-x-auto sm:mx-0 sm:px-0 sm:overflow-visible"
    >
      <ol className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm whitespace-nowrap">
        {STEPS.map((step, idx) => {
          const isActive = step === activeStep;
          const isComplete =
            activeStep && STEPS.indexOf(step) < STEPS.indexOf(activeStep);
          return (
            <li key={step} className="flex items-center gap-2 sm:gap-4">
              <div
                className={`flex items-center gap-2 ${
                  isActive
                    ? "text-primary font-bold"
                    : isComplete
                      ? "text-secondary font-semibold"
                      : "text-on-surface-variant/60"
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    isActive
                      ? "bg-primary text-white"
                      : isComplete
                        ? "bg-secondary text-white"
                        : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="uppercase tracking-wide">
                  {t(`step.${step}`)}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <span className="text-on-surface-variant/30">&rarr;</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
