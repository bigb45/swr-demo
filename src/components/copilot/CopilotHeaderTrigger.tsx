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
      className="inline-flex h-9 w-9 shrink-0 items-center sm:min-w-22"
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
      className={`inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-primary/15 px-3 py-2.5 text-sm font-bold text-primary transition-colors md:px-4 md:py-2.5 ${
        isExpanded ? "bg-surface-container-low" : "bg-surface-container-lowest"
      } ${className}`}
      style={{
        boxShadow: isExpanded ? undefined : ("var(--shadow-ambient)" as const),
      }}
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
