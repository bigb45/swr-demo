"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCopilot } from "./CopilotProvider";
import CopilotProductWidget from "./CopilotProductWidget";

function getFocusable(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const nodes = root.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  return Array.from(nodes).filter(
    (el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"),
  );
}

function useCopilotFocusTrap(
  active: boolean,
  rootRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!active) return;
    const el = rootRef.current;
    if (!el) return;

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const list = getFocusable(el);
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }

    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [active, rootRef]);
}

export default function CopilotPanel() {
  const t = useTranslations("copilot");
  const locale = useLocale();
  const {
    close,
    messages,
    draft,
    setDraft,
    pending,
    submitError,
    clearSubmitError,
    sendDraft,
    submitSuggestion,
  } = useCopilot();

  const rootRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  /** Panel only mounts while the dock is open — keep focus contained in the sheet. */
  useCopilotFocusTrap(true, rootRef);

  useLayoutEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  const liveText = useMemo(() => {
    const rev = [...messages].reverse().find((m) => m.role === "assistant");
    return rev?.streaming ? "" : (rev?.content ?? "");
  }, [messages]);

  const suggestions = [
    { id: "s1" as const, label: t("suggestion1") },
    { id: "s2" as const, label: t("suggestion2") },
    { id: "s3" as const, label: t("suggestion3") },
  ] as const;

  function formatTime(ms: number) {
    try {
      return new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(ms);
    } catch {
      return "";
    }
  }

  async function onComposerKeyDown(e: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    await sendDraft();
  }

  return (
    <aside
      id="swr-copilot-panel-root"
      ref={rootRef}
      className="flex h-full min-h-0 w-full min-w-0 flex-col bg-surface"
      aria-label={t("panelAria")}
    >
      <div
        className="flex shrink-0 flex-col text-on-primary"
        style={{ backgroundColor: "#003a63" }}
      >
        <div className="flex items-center gap-3 px-3 py-2.5">
          <button
            type="button"
            onClick={close}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-btn)] hover:bg-white/10"
            aria-label={t("closeAria")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-bold tracking-wide leading-tight">
            {t("title")}
          </p>
        </div>
      </div>

      <div aria-live="polite" aria-atomic className="sr-only">
        {liveText}
      </div>

      <div className="swr-hide-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <p className="text-center text-sm text-on-surface-variant">
            {t("emptyState")}
          </p>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div
                className="max-w-[92%] rounded-[var(--radius-card)] px-3 py-2 text-sm text-on-primary"
                style={{ backgroundColor: "#005288" }}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-btn)] text-on-primary"
                  style={{ backgroundColor: "#003a63" }}
                  aria-hidden
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <rect x="4" y="7" width="16" height="11" rx="2" />
                    <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
                    <circle cx="9" cy="13" r="1" fill="currentColor" />
                    <circle cx="15" cy="13" r="1" fill="currentColor" />
                  </svg>
                </span>
                <span>
                  {t("assistantLabel")} • {formatTime(m.createdAt)}
                </span>
              </div>
              <div
                className="rounded-[var(--radius-card)] border border-outline-variant/40 bg-surface-container-lowest p-3 text-sm text-on-surface shadow-[var(--shadow-ambient)]"
                style={{ borderRadius: "var(--radius-card)" }}
              >
                <p className="whitespace-pre-wrap break-words text-on-surface-variant">
                  {m.content || (m.streaming ? t("assistantTyping") : "")}
                </p>
                {!m.streaming && m.widgetSkus && m.widgetSkus.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {m.widgetSkus.map((widgetSku) => (
                      <CopilotProductWidget
                        key={`${m.id}:${widgetSku}`}
                        sku={widgetSku}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ),
        )}
      </div>

      <div className="shrink-0 border-t border-outline-variant/30 bg-surface-container-low px-3 py-2">
        <button
          type="button"
          aria-expanded={suggestionsOpen}
          aria-controls="swr-copilot-suggestion-chips"
          onClick={() => setSuggestionsOpen((o) => !o)}
          className="flex w-full min-h-11 items-center justify-between gap-2 rounded-[var(--radius-btn)] px-1 py-1 text-left text-on-surface-variant hover:bg-surface-container-highest/60"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            {t("suggestionsToggle")}
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-primary transition-transform ${suggestionsOpen ? "rotate-180" : ""}`}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        <div
          id="swr-copilot-suggestion-chips"
          hidden={!suggestionsOpen}
          className="flex flex-wrap gap-2 pt-2"
        >
          {suggestions.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              disabled={pending}
              onClick={() => {
                clearSubmitError();
                void submitSuggestion(label);
              }}
              className="rounded-full border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-fixed/40 disabled:opacity-50"
              style={{ borderRadius: "var(--radius-card)" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-outline-variant/30 bg-surface-container-low p-3">
        {submitError && (
          <div
            className="rounded-[var(--radius-btn)] bg-error/10 px-2 py-1.5 text-xs text-error"
            role="alert"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0 flex-1 break-words">{submitError}</span>
              <button
                type="button"
                className="shrink-0 underline"
                onClick={clearSubmitError}
              >
                {t("dismissError")}
              </button>
            </div>
          </div>
        )}
        <div
          className="flex min-h-[2.75rem] items-center gap-2 rounded-[var(--radius-card)] bg-surface-container-lowest p-2 shadow-[var(--shadow-ambient)]"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onComposerKeyDown}
            disabled={pending}
            placeholder={t("composerPlaceholder")}
            className="max-h-[8rem] min-h-[2.5rem] flex-1 resize-y bg-transparent py-2 text-sm leading-snug text-on-surface outline-none placeholder:text-on-surface-variant/70"
          />
          <button
            type="button"
            disabled={pending || !draft.trim()}
            onClick={() => {
              clearSubmitError();
              void sendDraft();
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-btn)] text-on-primary disabled:opacity-40"
            style={{ backgroundColor: "#003a63" }}
            aria-label={t("sendAria")}
          >
            {pending ? (
              <svg
                className="animate-spin"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
