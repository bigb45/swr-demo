"use client";

import { useCookieConsent } from "@/components/CookieConsentProvider";
import { BotMessageSquare } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import CopilotPanel from "./CopilotPanel";
import { useCopilot } from "./CopilotProvider";

export default function CopilotDock() {
  const { open, setOpen } = useCopilot();
  const t = useTranslations("copilot");
  const { ready, optionalAllowed } = useCookieConsent();

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

  if (!ready || !optionalAllowed) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          className="fixed bottom-6 right-6 z-[46] inline-flex h-14 w-14 items-center justify-center text-on-primary shadow-[var(--shadow-ambient)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{
            backgroundColor: "#003a63",
            borderRadius: "var(--radius-card)",
          }}
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
           * Flex lane on lg+: reserves horizontal space while the real drawer is viewport-fixed.
           */}
          <div
            aria-hidden
            className="pointer-events-none hidden shrink-0 self-stretch lg:block lg:w-[380px]"
          />

          <button
            type="button"
            className="fixed inset-0 z-[47] bg-black/30 lg:hidden"
            aria-label={t("closeAria")}
            onClick={() => setOpen(false)}
          />

          <div
            role="presentation"
            className="fixed top-[var(--swr-header-offset)] right-0 bottom-0 z-[48] flex min-h-0 w-[min(100vw,400px)] max-w-full flex-col overflow-hidden border-outline-variant/30 shadow-[var(--shadow-ambient)] lg:w-[380px] lg:border-l lg:border-outline-variant/30 lg:shadow-[var(--shadow-ambient)]"
          >
            <CopilotPanel />
          </div>
        </>
      )}
    </>
  );
}
