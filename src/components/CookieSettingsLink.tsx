"use client";

import { useTranslations } from "next-intl";
import { useCookieConsent } from "@/components/CookieConsentProvider";

export default function CookieSettingsLink() {
  const t = useTranslations("footer");
  const { reopenBanner } = useCookieConsent();

  return (
    <button
      type="button"
      onClick={reopenBanner}
      className="text-xs text-white/70 hover:text-white transition-colors text-left"
    >
      {t("cookieSettings")}
    </button>
  );
}
