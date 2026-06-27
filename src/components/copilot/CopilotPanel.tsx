"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCopilot } from "./CopilotProvider";
import CopilotProductWidget from "./CopilotProductWidget";
import type { CopilotStatus } from "./types";

const STATUS_LABEL_KEY: Record<Exclude<CopilotStatus, "idle">, string> = {
  thinking: "statusThinking",
  searching: "statusSearching",
  findingProducts: "statusFindingProducts",
  updatingCart: "statusUpdatingCart",
  analyzingImage: "statusAnalyzingImage",
  working: "statusWorking",
};

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

function CopilotStatusRow({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-on-surface-variant">
      <span
        className="h-2 w-2 shrink-0 rounded-full bg-secondary animate-pulse motion-reduce:animate-none"
        aria-hidden
      />
      <span className="text-sm font-medium">{label}</span>
    </span>
  );
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
    status,
    restoring,
    sessionNotice,
    dismissSessionNotice,
    submitError,
    imageAttachment,
    attachImage,
    removeImageAttachment,
    clearSubmitError,
    sendDraft,
    submitSuggestion,
    pageContext,
  } = useCopilot();

  const rootRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const pinnedRef = useRef(true);
  const lastScrollTopRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const narrowViewportRef = useRef(false);
  const followRafRef = useRef<number | null>(null);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [showJump, setShowJump] = useState(false);

  /** Panel only mounts while the dock is open — keep focus contained in the sheet. */
  useCopilotFocusTrap(true, rootRef);

  useLayoutEffect(() => {
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  /**
   * ChatGPT-style: once a reply finishes (composer re-enables), put the cursor
   * back in the input so the user can immediately keep typing.
   */
  const prevPendingRef = useRef(pending);
  useEffect(() => {
    if (prevPendingRef.current && !pending) {
      textareaRef.current?.focus({ preventScroll: true });
    }
    prevPendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Below `lg` (1024px) the dock is a full-screen sheet sized with dynamic
    // viewport height; smooth scrolling there fights the mobile URL-bar resize
    // and oscillates, so the auto-follow snaps instantly on narrow viewports.
    const narrow = window.matchMedia("(max-width: 1023px)");
    const sync = () => {
      reducedMotionRef.current = motion.matches;
      narrowViewportRef.current = narrow.matches;
    };
    sync();
    motion.addEventListener("change", sync);
    narrow.addEventListener("change", sync);
    return () => {
      motion.removeEventListener("change", sync);
      narrow.removeEventListener("change", sync);
    };
  }, []);

  const PIN_THRESHOLD = 64;
  /** Treat as "already at the bottom" within this slack to avoid redundant scrolls. */
  const AT_BOTTOM_EPSILON = 4;

  const followBehavior = useCallback((): ScrollBehavior => {
    return reducedMotionRef.current || narrowViewportRef.current
      ? "auto"
      : "smooth";
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  /**
   * Re-pin only when the view actually reaches the bottom. Unpinning is driven
   * solely by the user scrolling UP — detected as a decrease in scrollTop, which
   * our own auto-scroll (always downward) can never produce. This keeps the
   * smart-pin working even while content height grows during streaming.
   */
  const onThreadScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const top = el.scrollTop;
    const scrolledUp = top < lastScrollTopRef.current - 1;
    lastScrollTopRef.current = top;

    if (scrolledUp) {
      pinnedRef.current = false;
      setShowJump(true);
      return;
    }
    const distance = el.scrollHeight - top - el.clientHeight;
    if (distance < PIN_THRESHOLD) {
      pinnedRef.current = true;
      setShowJump(false);
    }
  }, []);

  const jumpToLatest = useCallback(() => {
    pinnedRef.current = true;
    setShowJump(false);
    scrollToBottom(followBehavior());
  }, [scrollToBottom, followBehavior]);

  /** Open an existing thread already scrolled to the newest message. */
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
      lastScrollTopRef.current = el.scrollTop;
    }
  }, []);

  /**
   * Follow the bottom whenever the thread's content height changes — covers
   * streamed tokens, newly added bubbles, and async-loaded product widgets
   * (whose cards grow from a loading placeholder after the text has settled).
   */
  useEffect(() => {
    const content = contentRef.current;
    if (!content || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (!pinnedRef.current) return;
      // Coalesce bursts of resize callbacks (e.g. several widgets loading) into
      // one scroll per frame, and skip when already at the bottom so a settling
      // layout can't trigger an endless scroll loop.
      if (followRafRef.current !== null) return;
      followRafRef.current = requestAnimationFrame(() => {
        followRafRef.current = null;
        const el = scrollRef.current;
        if (!el || !pinnedRef.current) return;
        const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distance <= AT_BOTTOM_EPSILON) return;
        scrollToBottom(followBehavior());
      });
    });
    ro.observe(content);
    return () => {
      ro.disconnect();
      if (followRafRef.current !== null) {
        cancelAnimationFrame(followRafRef.current);
        followRafRef.current = null;
      }
    };
  }, [scrollToBottom, followBehavior]);

  const statusLabel = status === "idle" ? "" : t(STATUS_LABEL_KEY[status]);

  const liveText = useMemo(() => {
    const rev = [...messages].reverse().find((m) => m.role === "assistant");
    // While the assistant is still working, announce the current phase; once the
    // reply is finalized, announce its text.
    return rev?.streaming ? statusLabel : (rev?.content ?? "");
  }, [messages, statusLabel]);

  const suggestions = useMemo(() => {
    const global = [
      { id: "g1" as const, label: t("suggestion1"), text: t("suggestion1Prompt") },
      { id: "g2" as const, label: t("suggestion2"), text: t("suggestion2Prompt") },
      { id: "g3" as const, label: t("suggestion3"), text: t("suggestion3Prompt") },
      { id: "g4" as const, label: t("suggestion4"), text: t("suggestion4Prompt") },
    ];

    if (pageContext?.sku || pageContext?.productName) {
      const name = pageContext.productName ?? pageContext.sku ?? "";
      return [
        {
          id: "p1" as const,
          label: t("suggestionsPdpRelated"),
          text: t("suggestionsPdpRelatedPrompt", { name }),
        },
        {
          id: "p2" as const,
          label: t("suggestionsPdpContract"),
          text: t("suggestionsPdpContractPrompt", { name }),
        },
        {
          id: "p3" as const,
          label: t("suggestionsPdpConsumables"),
          text: t("suggestionsPdpConsumablesPrompt", {
            name,
            category: pageContext.categoryName ?? "",
          }),
        },
        ...global.slice(0, 2),
      ];
    }

    return global;
  }, [pageContext, t]);

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

  async function onImageSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await attachImage(file);
  }

  return (
    <aside
      id="swr-copilot-panel-root"
      ref={rootRef}
      className="flex h-full min-h-0 w-full min-w-0 flex-col bg-surface"
      aria-label={t("panelAria")}
    >
      <div className="flex shrink-0 flex-col bg-primary text-on-primary">
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

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          onScroll={onThreadScroll}
          className="swr-hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
        <div ref={contentRef} className="space-y-3 px-3 py-4">
          {sessionNotice && (
            <div
              className="flex items-start justify-between gap-2 rounded-[var(--radius-card)] bg-secondary-container/60 px-3 py-2 text-xs text-on-surface"
              role="status"
            >
              <span className="min-w-0 flex-1 break-words">{sessionNotice}</span>
              <button
                type="button"
                onClick={dismissSessionNotice}
                className="shrink-0 font-semibold text-primary underline"
              >
                {t("dismissNotice")}
              </button>
            </div>
          )}

          {restoring && messages.length === 0 && (
            <CopilotStatusRow label={t("restoringConversation")} />
          )}

          {!restoring && messages.length === 0 && (
            <p className="text-center text-sm text-on-surface-variant">
              {t("emptyState")}
            </p>
          )}

          {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[92%] rounded-[var(--radius-card)] bg-primary-container px-3 py-2 text-sm text-on-primary">
                {m.imagePreviewUrl ? (
                  <div className="mb-2 overflow-hidden rounded-[var(--radius-btn)] bg-white/10">
                    <Image
                      src={m.imagePreviewUrl}
                      alt={m.imageName ?? ""}
                      width={220}
                      height={160}
                      unoptimized
                      className="max-h-40 w-full object-cover"
                    />
                  </div>
                ) : null}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          ) : (
            <div key={m.id} className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-btn)] bg-primary text-on-primary"
                  aria-hidden
                >
                  <svg
                    width="15"
                    height="15"
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
              <div className="rounded-[var(--radius-card)] bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface">
                {m.content ? (
                  <p className="whitespace-pre-wrap break-words text-on-surface">
                    {m.content}
                  </p>
                ) : m.streaming ? (
                  <CopilotStatusRow label={statusLabel || t("statusThinking")} />
                ) : null}
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
        </div>

        {showJump && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
            <button
              type="button"
              onClick={jumpToLatest}
              className="pointer-events-auto inline-flex min-h-11 items-center gap-1.5 rounded-[var(--radius-btn)] bg-secondary px-3 py-2 text-xs font-semibold text-on-secondary shadow-[var(--shadow-ambient)] transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              aria-label={t("jumpToLatestAria")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
              <span>{t("jumpToLatest")}</span>
            </button>
          </div>
        )}
      </div>

      <div className="shrink-0 bg-surface-container-low px-3 py-2">
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
          {suggestions.map(({ id, label, text }) => (
            <button
              key={id}
              type="button"
              disabled={pending}
              onClick={() => {
                clearSubmitError();
                void submitSuggestion(text);
              }}
              className="rounded-full border border-outline-variant/50 bg-surface-container-lowest px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-fixed/40 disabled:opacity-50"
              style={{ borderRadius: "var(--radius-card)" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="shrink-0 space-y-2 bg-surface-container-low p-3">
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
        {imageAttachment ? (
          <div className="flex items-center gap-2 rounded-[var(--radius-card)] bg-surface-container-lowest p-2 shadow-[var(--shadow-ambient)]">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-btn)] bg-surface-container-low">
              <Image
                src={imageAttachment.dataUrl}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-on-surface">
                {imageAttachment.name}
              </p>
              <p className="text-[10px] text-on-surface-variant">
                {t("uploadOneImage")}
              </p>
            </div>
            <button
              type="button"
              onClick={removeImageAttachment}
              disabled={pending}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-highest disabled:opacity-40"
              aria-label={t("uploadRemove")}
            >
              <svg
                width="16"
                height="16"
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
          </div>
        ) : null}
        <div
          className="flex min-h-[2.75rem] items-center gap-2 rounded-[var(--radius-card)] bg-surface-container-lowest p-2 shadow-[var(--shadow-ambient)]"
          style={{ borderRadius: "var(--radius-card)" }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={onImageSelected}
            disabled={pending}
          />
          <button
            type="button"
            disabled={pending || imageAttachment != null}
            onClick={() => {
              clearSubmitError();
              fileInputRef.current?.click();
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-primary transition-colors hover:bg-primary-fixed/50 disabled:opacity-40"
            aria-label={t("uploadAddImage")}
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
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
            disabled={pending || (!draft.trim() && !imageAttachment)}
            onClick={() => {
              clearSubmitError();
              void sendDraft();
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-btn)] bg-primary text-on-primary disabled:opacity-40"
            aria-label={t("sendAria")}
          >
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
          </button>
        </div>
      </div>
    </aside>
  );
}
