"use client";

import { useEffect, useState, type CSSProperties } from "react";

export type VisualViewportFrame = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function readFullWindowFrame(): VisualViewportFrame {
  if (typeof window === "undefined") {
    return { top: 0, left: 0, width: 0, height: 0 };
  }
  return {
    top: 0,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function readVisualViewportFrame(): VisualViewportFrame {
  if (typeof window === "undefined") {
    return { top: 0, left: 0, width: 0, height: 0 };
  }
  const vv = window.visualViewport;
  if (!vv) return readFullWindowFrame();
  return {
    top: Math.round(vv.offsetTop),
    left: Math.round(vv.offsetLeft),
    width: Math.round(vv.width),
    height: Math.round(vv.height),
  };
}

/**
 * Tracks the visible viewport frame — essential on iOS Safari when the virtual
 * keyboard pans the layout viewport. Pin fixed overlays to this rect, not only
 * a bottom inset.
 */
export function useVisualViewportFrame(active: boolean): VisualViewportFrame {
  const [frame, setFrame] = useState<VisualViewportFrame>(readFullWindowFrame);

  useEffect(() => {
    if (!active || typeof window === "undefined") {
      setFrame(readFullWindowFrame());
      return;
    }

    const vv = window.visualViewport;
    let settleRaf = 0;

    const sync = () => {
      setFrame(readVisualViewportFrame());
      cancelAnimationFrame(settleRaf);
      settleRaf = requestAnimationFrame(() => {
        setFrame(readVisualViewportFrame());
      });
    };

    sync();
    vv?.addEventListener("resize", sync);
    vv?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);

    return () => {
      cancelAnimationFrame(settleRaf);
      vv?.removeEventListener("resize", sync);
      vv?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [active]);

  return frame;
}

/**
 * Bottom inset (px) where the visual viewport ends above the layout viewport.
 * Prefer {@link useVisualViewportFrame} for full-screen mobile overlays.
 */
export function useVisualViewportInset(active: boolean): number {
  const frame = useVisualViewportFrame(active);
  if (!active || typeof window === "undefined") return 0;
  return Math.max(
    0,
    Math.round(window.innerHeight - frame.height - frame.top),
  );
}

export function visualViewportFrameToStyle(
  frame: VisualViewportFrame,
): CSSProperties {
  return {
    top: frame.top,
    left: frame.left,
    width: frame.width,
    height: frame.height,
    bottom: "auto",
    right: "auto",
  };
}
