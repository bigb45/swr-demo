"use client";

import { useCallback, useState, type KeyboardEvent } from "react";
import { BotMessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCookieConsent } from "@/components/CookieConsentProvider";
import { useHydrated } from "@/hooks/useHydrated";
import { useCopilot } from "./CopilotProvider";

const CHIP_KEYS = ["chip1", "chip2", "chip3", "chip4"] as const;

export default function CopilotHero() {
  const t = useTranslations("copilot");
  const { ready, level } = useCookieConsent();
  const hydrated = useHydrated();
  const { setOpen, setDraft, submitSuggestion } = useCopilot();
  const [localDraft, setLocalDraft] = useState("");

  const showCopilot = hydrated && ready && level !== "needsChoice";

  const chips = CHIP_KEYS.map((key) => ({
    key,
    label: t(`home.${key}`),
    prompt: t(`home.${key}Prompt`),
  }));

  const openWithMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setOpen(true);
      await submitSuggestion(trimmed);
    },
    [setOpen, submitSuggestion],
  );

  async function onSubmit() {
    const trimmed = localDraft.trim();
    if (!trimmed) {
      setOpen(true);
      return;
    }
    setLocalDraft("");
    await openWithMessage(trimmed);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void onSubmit();
    }
  }

  if (!showCopilot) return null;

  return (
    <section className="py-14 sm:py-20 bg-surface-container-low">
      <div className="swr-page-shell">
        <div
          className="flex flex-col gap-6 p-6 sm:p-10 bg-primary text-on-primary shadow-(--shadow-ambient)"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <div className="flex flex-col gap-2 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-fixed">
              {t("home.eyebrow")}
            </p>
            <div className="flex items-center gap-3">
              <BotMessageSquare
                size={32}
                strokeWidth={1.5}
                className="shrink-0 text-primary-fixed"
                aria-hidden
              />
              <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-[-0.02em] leading-tight">
                {t("home.heading")}
              </h2>
            </div>
            <p className="text-sm sm:text-base text-primary-fixed/90 leading-relaxed">
              {t("home.subtitle")}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="sr-only" htmlFor="copilot-hero-input">
              {t("home.inputLabel")}
            </label>
            <textarea
              id="copilot-hero-input"
              value={localDraft}
              onChange={(e) => setLocalDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setDraft(localDraft)}
              placeholder={t("home.placeholder")}
              rows={2}
              className="w-full resize-none bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant px-4 py-3 text-sm sm:text-base outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              style={{ borderRadius: "var(--radius-btn)" }}
            />
            <button
              type="button"
              onClick={() => void onSubmit()}
              className="self-start px-6 py-3 text-sm font-bold uppercase tracking-widest bg-secondary text-on-secondary hover:brightness-110 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              {t("home.submit")}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary-fixed/80">
              {t("home.chipsHeading")}
            </p>
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => void openWithMessage(chip.prompt)}
                  className="px-3 py-2 text-xs sm:text-sm font-semibold bg-primary-container text-on-primary hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary text-left"
                  style={{ borderRadius: "var(--radius-btn)" }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
