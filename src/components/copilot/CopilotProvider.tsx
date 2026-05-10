"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { useCart } from "@/components/CartProvider";
import { consumeSseBody, extractCompletionText } from "@/lib/copilot-stream";
import { parseCopilotAssistantMessage } from "@/lib/copilot-parse";
import {
  fetchCartSkuQtyMap,
  parseAddToCartIntents,
  patchGuestCartShortfall,
} from "@/lib/copilot-cart-intent";
import {
  applyTeiaCartAction,
  extractTeiaCartOpFromSseObject,
} from "@/lib/copilot-teia-cart-action";
import type { CopilotMessage } from "./types";

const SESSION_KEY = "swr_copilot_session_id";

interface CopilotContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  close: () => void;
  messages: CopilotMessage[];
  draft: string;
  setDraft: (v: string) => void;
  pending: boolean;
  submitError: string | null;
  clearSubmitError: () => void;
  sendDraft: () => Promise<void>;
  submitSuggestion: (text: string) => Promise<void>;
}

const CopilotContext = createContext<CopilotContextValue | null>(null);

function newMsg(
  partial: Omit<CopilotMessage, "createdAt"> &
    Partial<Pick<CopilotMessage, "createdAt">>,
): CopilotMessage {
  return {
    ...partial,
    createdAt:
      typeof partial.createdAt === "number" ? partial.createdAt : Date.now(),
  };
}

function useSessionIdReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        let id = sessionStorage.getItem(SESSION_KEY);
        if (!id) {
          id = crypto.randomUUID();
          sessionStorage.setItem(SESSION_KEY, id);
        }
      } catch {
        /** sessionStorage unavailable */
      }
      setReady(true);
    });
  }, []);

  return ready;
}

function readSessionId(): string {
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? "";
  } catch {
    return "";
  }
}

export function CopilotProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("copilot");
  const {
    getOrCreateCartId,
    refreshTotals,
    addBySku,
    updateQty,
    removeItem,
  } = useCart();
  const sessionBootstrap = useSessionIdReady();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const streamingAssistantIdRef = useRef<string | null>(null);
  const submitBusyRef = useRef(false);

  const patchStreamingAssistant = useCallback((append: string) => {
    const id = streamingAssistantIdRef.current;
    if (!id || !append) return;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, content: m.content + append } : m,
      ),
    );
  }, []);

  const finalizeStreamingAssistant = useCallback(() => {
    const id = streamingAssistantIdRef.current;
    streamingAssistantIdRef.current = null;
    if (!id) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, streaming: false } : m)),
    );
  }, []);

  const discardStreamingAssistant = useCallback(() => {
    const id = streamingAssistantIdRef.current;
    streamingAssistantIdRef.current = null;
    if (!id) return;
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const enrichAssistantMessage = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId || m.role !== "assistant") return m;
        const { displayText, skus } = parseCopilotAssistantMessage(m.content);
        const text = displayText.trim() || m.content;
        return {
          ...m,
          streaming: false,
          content: text,
          widgetSkus: skus.length > 0 ? skus : undefined,
        };
      }),
    );
  }, []);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  const clearSubmitError = useCallback(() => setSubmitError(null), []);

  const tryRestCompletion = useCallback(
    async (body: Record<string, unknown>): Promise<string> => {
      const fallback = await fetch("/api/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const text = await fallback.text();
      if (!fallback.ok) {
        throw new Error(text.slice(0, 400) || t("errorGeneric"));
      }
      try {
        return extractCompletionText(JSON.parse(text));
      } catch {
        return text;
      }
    },
    [t],
  );

  const submitWithTrimmedMessage = useCallback(
    async (trimmed: string) => {
      if (!trimmed) return;
      if (submitBusyRef.current) return;
      submitBusyRef.current = true;

      try {
        setSubmitError(null);

        if (!sessionBootstrap) {
          setSubmitError(t("sessionInitializing"));
          return;
        }

        const session_id = readSessionId();
        if (!session_id) {
          setSubmitError(t("sessionInitializing"));
          return;
        }

        let guestCartId: string;
        try {
          guestCartId = await getOrCreateCartId();
        } catch {
          setSubmitError(t("errorGeneric"));
          return;
        }

        const intents = parseAddToCartIntents(trimmed);
        const beforeSkuQtyMap =
          intents.length > 0
            ? await fetchCartSkuQtyMap(guestCartId)
            : new Map<string, number>();

        streamingAssistantIdRef.current = null;

        const userMsg = newMsg({
          id: crypto.randomUUID(),
          role: "user",
          content: trimmed,
        });

        const assistantId = crypto.randomUUID();
        const assistantSkeleton = newMsg({
          id: assistantId,
          role: "assistant",
          content: "",
          streaming: true,
        });
        streamingAssistantIdRef.current = assistantId;

        setMessages((prev) => [...prev, userMsg, assistantSkeleton]);
        setPending(true);

        const body: Record<string, unknown> = {
          session_id,
          message: trimmed,
          cart_id: guestCartId,
        };

        const finalizeCartAfterAgentReply = async () => {
          await refreshTotals();
          if (intents.length > 0) {
            await new Promise((r) => setTimeout(r, 450));
            try {
              await patchGuestCartShortfall(
                intents,
                beforeSkuQtyMap,
                guestCartId,
                addBySku,
              );
            } catch (e) {
              const detail = e instanceof Error ? e.message : t("errorGeneric");
              setSubmitError(t("cartReconcileFailed", { detail }));
            }
            await refreshTotals();
          }
        };

        const fallbackOrThrow = async (reason?: Error): Promise<void> => {
          discardStreamingAssistant();
          try {
            const reply = await tryRestCompletion(body);
            if (!reply.trim()) throw new Error(t("emptyReply"));
            const parsed = parseCopilotAssistantMessage(reply.trim());
            setMessages((prev) => [
              ...prev,
              newMsg({
                id: crypto.randomUUID(),
                role: "assistant",
                content: parsed.displayText.trim() || reply.trim(),
                widgetSkus: parsed.skus.length > 0 ? parsed.skus : undefined,
              }),
            ]);
            await finalizeCartAfterAgentReply();
          } catch (e2) {
            const msg =
              reason?.message ??
              (e2 instanceof Error ? e2.message : t("errorGeneric"));
            setSubmitError(msg);
          }
        };

        try {
          const streamRes = await fetch("/api/copilot/chat/stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            cache: "no-store",
          });

          if (!streamRes.ok) {
            const errText = await streamRes.text().catch(() => "");
            await fallbackOrThrow(
              new Error(errText.slice(0, 400) || t("errorGeneric")),
            );
            return;
          }

          const ctype = streamRes.headers.get("content-type") ?? "";
          let streamSucceeded = false;
          let teiaCartOp: ReturnType<
            typeof extractTeiaCartOpFromSseObject
          > = null;

          if (ctype.includes("text/event-stream")) {
            let gotChunk = false;
            await consumeSseBody(
              streamRes,
              (chunk) => {
                if (chunk) gotChunk = true;
                patchStreamingAssistant(chunk);
              },
              (obj) => {
                if (obj.done === true) {
                  const extracted = extractTeiaCartOpFromSseObject(obj);
                  if (extracted) teiaCartOp = extracted;
                }
              },
            );
            streamSucceeded = gotChunk;
          } else {
            const raw = await streamRes.text().catch(() => "");
            let appended = "";
            try {
              appended = extractCompletionText(JSON.parse(raw));
            } catch {
              appended = raw;
            }
            if (appended.trim()) {
              patchStreamingAssistant(appended);
              streamSucceeded = true;
            }
          }

          if (streamSucceeded) {
            if (teiaCartOp) {
              try {
                await applyTeiaCartAction(teiaCartOp, {
                  cartId: guestCartId,
                  addBySku,
                  updateQty,
                  removeItem,
                });
              } catch (e) {
                const detail =
                  e instanceof Error ? e.message : t("errorGeneric");
                setSubmitError(t("cartReconcileFailed", { detail }));
              }
            }
            queueMicrotask(() => enrichAssistantMessage(assistantId));
            await finalizeCartAfterAgentReply();
            return;
          }

          discardStreamingAssistant();
          await fallbackOrThrow(new Error(t("emptyReply")));
        } catch (e) {
          /** Network / parse failures */
          await fallbackOrThrow(e instanceof Error ? e : undefined);
        }
      } finally {
        submitBusyRef.current = false;
        setPending(false);
        finalizeStreamingAssistant();
      }
    },
    [
      addBySku,
      removeItem,
      discardStreamingAssistant,
      enrichAssistantMessage,
      finalizeStreamingAssistant,
      getOrCreateCartId,
      patchStreamingAssistant,
      refreshTotals,
      sessionBootstrap,
      t,
      tryRestCompletion,
      updateQty,
    ],
  );

  const sendDraft = useCallback(async () => {
    const msg = draft.trim();
    if (!msg || pending) return;
    setDraft("");
    await submitWithTrimmedMessage(msg);
  }, [draft, pending, submitWithTrimmedMessage]);

  const submitSuggestion = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;
      await submitWithTrimmedMessage(trimmed);
    },
    [pending, submitWithTrimmedMessage],
  );

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (!open) return;
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  const value = useMemo(
    () => ({
      open,
      setOpen,
      toggle,
      close,
      messages,
      draft,
      setDraft,
      pending,
      submitError,
      clearSubmitError,
      sendDraft,
      submitSuggestion,
    }),
    [
      open,
      toggle,
      close,
      messages,
      draft,
      pending,
      submitError,
      clearSubmitError,
      sendDraft,
      submitSuggestion,
    ],
  );

  return (
    <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>
  );
}

export function useCopilot(): CopilotContextValue {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilot must be used within CopilotProvider");
  return ctx;
}
