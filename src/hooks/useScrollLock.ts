"use client";

import { useEffect } from "react";

/**
 * Locks document scroll without body position:fixed (avoids iOS Safari toolbar
 * reflow). Pair with a full-screen overlay + scrim touchmove guard.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    const { body } = document;
    const html = document.documentElement;

    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevHtmlOverflow = html.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehavior;

    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      html.style.overflow = prevHtmlOverflow;
      html.style.overscrollBehavior = prevHtmlOverscroll;
    };
  }, [active]);
}
