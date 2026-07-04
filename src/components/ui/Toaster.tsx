"use client";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";

const toastBase =
  "flex w-full min-w-[280px] max-w-[420px] items-start gap-3 rounded-[var(--radius-card)] border border-outline-variant/15 bg-surface-container-lowest px-4 py-3.5 shadow-[var(--shadow-ambient)]";

export default function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      closeButton
      visibleToasts={4}
      gap={10}
      offset="calc(var(--swr-header-offset) + 1rem)"
      icons={{
        success: (
          <CheckCircle2
            className="size-[18px] shrink-0 text-secondary"
            aria-hidden
          />
        ),
        error: (
          <AlertCircle
            className="size-[18px] shrink-0 text-error"
            aria-hidden
          />
        ),
        info: (
          <Info className="size-[18px] shrink-0 text-primary" aria-hidden />
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: toastBase,
          title: "text-sm font-semibold text-on-surface",
          description: "text-xs text-on-surface-variant",
          actionButton:
            "text-xs font-semibold text-secondary underline underline-offset-2",
          cancelButton: "text-xs font-semibold text-on-surface-variant",
          closeButton:
            "absolute right-2 top-2 flex size-6 items-center justify-center rounded-[var(--radius-btn)] text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
          success: `${toastBase} border-l-4 !border-l-secondary`,
          error: `${toastBase} border-l-4 !border-l-error`,
          info: `${toastBase} border-l-4 !border-l-primary`,
        },
      }}
      style={{ zIndex: 49 }}
    />
  );
}
