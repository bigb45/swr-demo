"use client";

import { useCookieConsent } from "@/components/CookieConsentProvider";
import { BotMessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCopilot } from "./CopilotProvider";

interface CopilotHeaderTriggerProps {
  className?: string;
}

export default function CopilotHeaderTrigger({
  className = "",
}: CopilotHeaderTriggerProps) {
  const t = useTranslations("copilot");
  const { open, toggle } = useCopilot();
  const { ready, optionalAllowed } = useCookieConsent();

  if (!ready || !optionalAllowed) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-2 px-2.5 py-2 text-sm font-semibold transition-colors md:px-3 ${className}`}
      style={{
        color: "#003a63",
        borderRadius: "var(--radius-btn)",
        boxShadow: open ? undefined : ("var(--shadow-ambient)" as const),
      }}
      aria-expanded={open}
      aria-controls="swr-copilot-panel-root"
      aria-label={open ? t("closeAria") : t("openHeaderAria")}
    >
      <BotMessageSquare
        className="shrink-0"
        size={20}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="hidden sm:inline">{t("shortTitle")}</span>
    </button>
  );
}
