"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCookieConsent } from "@/components/CookieConsentProvider";

export default function CookieConsentBanner() {
  const t = useTranslations("cookieConsent");
  const { ready, level, acceptAll, acceptEssentialOnly } = useCookieConsent();

  if (!ready || level !== "needsChoice") return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[50] px-4 pb-4 pt-3 sm:px-6 sm:pb-6"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-desc"
    >
      <div
        className="mx-auto max-w-4xl bg-surface-container-lowest px-4 py-4 sm:px-6 sm:py-5"
        style={{
          borderRadius: "var(--radius-card)",
          boxShadow: "0 10px 30px rgba(26,28,28,0.06)",
        }}
      >
        <h2
          id="cookie-consent-title"
          className="text-sm font-black uppercase tracking-[0.06em] text-primary"
        >
          {t("title")}
        </h2>
        <p
          id="cookie-consent-desc"
          className="mt-2 text-xs text-on-surface-variant leading-relaxed sm:text-sm"
        >
          {t("description")}{" "}
          <Link
            href="/legal/cookies"
            className="font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          >
            {t("cookiesPageLink")}
          </Link>
          {" · "}
          <Link
            href="/legal/privacy"
            className="font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          >
            {t("privacyLink")}
          </Link>
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={acceptEssentialOnly}
            className="order-2 min-h-11 px-4 text-center text-xs font-bold uppercase tracking-wide text-primary bg-surface-container-highest sm:order-1"
            style={{ borderRadius: "var(--radius-interactive)" }}
          >
            {t("essentialOnly")}
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="order-1 min-h-11 px-4 text-center text-xs font-bold uppercase tracking-wide text-on-primary sm:order-2"
            style={{
              borderRadius: "var(--radius-interactive)",
              backgroundColor: "#006e21",
            }}
          >
            {t("acceptAll")}
          </button>
        </div>
      </div>
    </div>
  );
}
