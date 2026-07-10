"use client";

import { useCookieConsent } from "@/components/CookieConsentProvider";
import { useHydrated } from "@/hooks/useHydrated";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  useVisualViewportFrame,
  visualViewportFrameToStyle,
} from "@/hooks/useVisualViewportInset";
import { BotMessageSquare } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import CopilotPanel from "./CopilotPanel";
import { useCopilot } from "./CopilotProvider";

export default function CopilotDock() {
  const { presentation, isExpanded, expand, minimize } = useCopilot();
  const t = useTranslations("copilot");
  const pathname = usePathname();
  const { ready, level } = useCookieConsent();
  const hydrated = useHydrated();
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const [mobileSheet, setMobileSheet] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const clientActive = hydrated || mounted;

  const showFab =
    presentation === "closed" || presentation === "minimized";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setMobileSheet(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const viewportActive = isExpanded && mobileSheet;
  const viewportFrame = useVisualViewportFrame(viewportActive);

  useScrollLock(isExpanded && mobileSheet);

  /**
   * iOS 26 Safari has a `position: fixed` compositing bug that reveals the page
   * content behind a full-screen overlay in the keyboard / URL-bar region — no
   * opaque background on the overlay can cover it. The only reliable fix is to
   * stop painting the underlying page entirely while the mobile sheet is open,
   * leaving just the solid body background behind the (portaled) overlay.
   */
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!viewportActive) return;
    const shell = document.getElementById("swr-app-shell");
    if (!shell) return;
    const prev = shell.style.visibility;
    shell.style.visibility = "hidden";
    return () => {
      shell.style.visibility = prev;
    };
  }, [viewportActive]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isExpanded || mobileSheet) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [isExpanded, mobileSheet]);

  // Checkout is a focused flow — keep the assistant out of it entirely.
  const onCheckout =
    pathname === "/checkout" || pathname.startsWith("/checkout/");

  if (onCheckout || !clientActive || !ready || level === "needsChoice") {
    return null;
  }

  const panelMotion = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: mobileSheet ? 24 : 12, scale: mobileSheet ? 1 : 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: mobileSheet ? 16 : 8, scale: mobileSheet ? 1 : 0.98 },
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] as const },
      };

  const overlayLayer =
    isExpanded && mounted ? (
      <AnimatePresence>
        {isExpanded && (
          <>
            <motion.button
              type="button"
              key="copilot-scrim"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={
                mobileSheet
                  ? "fixed inset-0 z-[60] bg-surface touch-none"
                  : "fixed inset-0 z-[60] bg-black/40 touch-none"
              }
              aria-label={t("minimizeAria")}
              onClick={minimize}
            />

            <motion.div
              key="copilot-panel"
              role="dialog"
              aria-modal="true"
              aria-label={t("panelAria")}
              className="fixed z-[61] flex min-h-0 flex-col overflow-hidden border border-outline-variant/30 bg-surface shadow-[var(--shadow-ambient)] inset-0 lg:inset-auto lg:right-6 lg:bottom-6 lg:top-auto lg:h-[min(680px,calc(100dvh-3rem))] lg:w-[400px] lg:rounded-[var(--radius-card)]"
              style={
                mobileSheet
                  ? visualViewportFrameToStyle(viewportFrame)
                  : undefined
              }
              {...panelMotion}
            >
              <CopilotPanel />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    ) : null;

  return (
    <>
      {showFab && (
        <button
          type="button"
          className="fixed bottom-6 right-6 z-[62] inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-card)] bg-primary text-on-primary shadow-[var(--shadow-ambient)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          aria-label={t("openFabAria")}
          onClick={expand}
        >
          <BotMessageSquare size={24} strokeWidth={1.75} aria-hidden />
        </button>
      )}

      {overlayLayer && mounted
        ? createPortal(overlayLayer, document.body)
        : null}
    </>
  );
}
