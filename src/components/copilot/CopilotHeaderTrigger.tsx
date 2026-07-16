"use client";

import { useCookieConsent } from "@/components/CookieConsentProvider";
import { BotMessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useHydrated } from "@/hooks/useHydrated";
import { useCopilot } from "./CopilotProvider";

interface CopilotHeaderTriggerProps {
  className?: string;
}

/** Invisible size reserve — no background (gray slab was mistaken for a broken button). */
function CopilotHeaderPlaceholder() {
  return (
    <span
      className="inline-flex h-8 w-8 shrink-0 items-center sm:min-w-20"
      aria-hidden
    />
  );
}

export default function CopilotHeaderTrigger({
  className = "",
}: CopilotHeaderTriggerProps) {
  const t = useTranslations("copilot");
  const { isExpanded, toggle } = useCopilot();
  const { ready, level } = useCookieConsent();
  const hydrated = useHydrated();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // `useHydrated` can stay false when this client island streams in late inside
  // `<Suspense>` (Header). `mounted` guarantees a post-mount re-render on mobile.
  const clientActive = hydrated || mounted;

  if (!clientActive || !ready) {
    return <CopilotHeaderPlaceholder />;
  }

  if (level === "needsChoice") return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] px-2.5 py-1.5 text-sm font-semibold text-primary transition-colors md:gap-2 md:px-3 md:py-1.5 ${
        isExpanded ? "bg-surface-container-highest" : "bg-surface-container-low"
      } ${className}`}
      aria-expanded={isExpanded}
      aria-controls="swr-copilot-panel-root"
      aria-label={isExpanded ? t("minimizeAria") : t("openHeaderAria")}
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
