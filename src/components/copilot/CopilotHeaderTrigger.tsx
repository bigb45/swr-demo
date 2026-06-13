"use client";

import { useCookieConsent } from "@/components/CookieConsentProvider";
import { BotMessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useHydrated } from "@/hooks/useHydrated";
import { useCopilot } from "./CopilotProvider";

interface CopilotHeaderTriggerProps {
  className?: string;
}

function CopilotHeaderPlaceholder({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex h-9 shrink-0 items-center sm:min-w-[5.5rem] ${className}`}
      style={{ minWidth: "2.25rem" }}
      aria-hidden
    />
  );
}

export default function CopilotHeaderTrigger({
  className = "",
}: CopilotHeaderTriggerProps) {
  const t = useTranslations("copilot");
  const { open, toggle } = useCopilot();
  const { ready, level } = useCookieConsent();
  const hydrated = useHydrated();

  // Render a stable placeholder during SSR and the first client render so the
  // markup matches even when this trigger hydrates late (inside <Suspense>)
  // after CookieConsentProvider has already flipped `ready` to true.
  if (!hydrated || !ready) {
    return <CopilotHeaderPlaceholder className={className} />;
  }

  if (level === "needsChoice") return null;

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
