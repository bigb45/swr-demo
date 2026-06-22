"use client";

import { useCookieConsent } from "@/components/CookieConsentProvider";
import { BotMessageSquare } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useHydrated } from "@/hooks/useHydrated";
import CopilotPanel from "./CopilotPanel";
import { useCopilot } from "./CopilotProvider";

export default function CopilotDock() {
  const { open, setOpen } = useCopilot();
  const t = useTranslations("copilot");
  const { ready, level } = useCookieConsent();
  const hydrated = useHydrated();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!open) return;
    if (window.matchMedia("(min-width: 1024px)").matches) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!hydrated || !ready || level === "needsChoice") return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          className="fixed bottom-6 right-6 z-[46] inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-card)] bg-primary text-on-primary shadow-[var(--shadow-ambient)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          aria-label={t("openFabAria")}
          onClick={() => setOpen(true)}
        >
          <BotMessageSquare
            size={24}
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      )}

      {open && (
        <>
          {/**
           * Scrim only below lg: under 1024px the panel is a modal sheet that
           * covers the page. On lg+ the panel floats and never blocks the page.
           */}
          <button
            type="button"
            className="fixed inset-0 z-[47] bg-black/30 lg:hidden"
            aria-label={t("closeAria")}
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("panelAria")}
            className="fixed z-[48] flex min-h-0 flex-col overflow-hidden bg-surface shadow-[var(--shadow-ambient)] inset-x-0 bottom-0 top-[var(--swr-header-offset)] [padding-bottom:env(safe-area-inset-bottom)] lg:inset-auto lg:right-6 lg:bottom-6 lg:top-auto lg:h-[min(680px,calc(100dvh-var(--swr-header-offset)-3rem))] lg:w-[400px] lg:rounded-[var(--radius-card)] lg:[padding-bottom:0]"
          >
            <CopilotPanel />
          </div>
        </>
      )}
    </>
  );
}
