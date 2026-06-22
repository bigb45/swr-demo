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
import {
  consumeSseBody,
  deriveCopilotStatus,
  extractCompletionText,
  extractStructuredProductReply,
} from "@/lib/copilot-stream";
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
import type {
  CopilotImageAttachment,
  CopilotMessage,
  CopilotPageContext,
  CopilotStatus,
} from "./types";

const SESSION_KEY = "swr_copilot_session_id";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Sliding idle window before a fresh conversation is started. */
const SESSION_IDLE_TTL_MS = 15 * 60 * 1000;
/** Absolute lifetime cap regardless of activity. */
const SESSION_MAX_TTL_MS = 4 * 60 * 60 * 1000;

interface CopilotContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  close: () => void;
  messages: CopilotMessage[];
  draft: string;
  setDraft: (v: string) => void;
  pending: boolean;
  status: CopilotStatus;
  submitError: string | null;
  imageAttachment: CopilotImageAttachment | null;
  attachImage: (file: File) => Promise<void>;
  removeImageAttachment: () => void;
  clearSubmitError: () => void;
  sendDraft: () => Promise<void>;
  submitSuggestion: (text: string) => Promise<void>;
  pageContext: CopilotPageContext | null;
  setPageContext: (ctx: CopilotPageContext | null) => void;
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

interface StoredSession {
  id: string;
  createdAt: number;
  lastActivityAt: number;
}

function readStoredSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as StoredSession).id === "string" &&
      typeof (parsed as StoredSession).createdAt === "number" &&
      typeof (parsed as StoredSession).lastActivityAt === "number"
    ) {
      return parsed as StoredSession;
    }
  } catch {
    /** sessionStorage unavailable or legacy plain-string value */
  }
  return null;
}

function writeStoredSession(session: StoredSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /** sessionStorage unavailable */
  }
}

function isSessionExpired(session: StoredSession, now: number): boolean {
  return (
    now - session.lastActivityAt > SESSION_IDLE_TTL_MS ||
    now - session.createdAt > SESSION_MAX_TTL_MS
  );
}

function mintSession(now: number): StoredSession {
  const session = { id: crypto.randomUUID(), createdAt: now, lastActivityAt: now };
  writeStoredSession(session);
  return session;
}

/**
 * Ensure a valid (non-expired) session exists without extending its idle
 * clock — used on mount so a hard refresh after the idle window still rolls a
 * fresh conversation.
 */
function ensureSessionId(): string {
  const now = Date.now();
  const existing = readStoredSession();
  if (existing && !isSessionExpired(existing, now)) return existing.id;
  return mintSession(now).id;
}

/**
 * Return the active session id for an outbound message, minting a fresh one if
 * expired and refreshing `lastActivityAt` to slide the idle window forward.
 */
function getActiveSessionId(): string {
  const now = Date.now();
  const existing = readStoredSession();
  if (existing && !isSessionExpired(existing, now)) {
    writeStoredSession({ ...existing, lastActivityAt: now });
    return existing.id;
  }
  return mintSession(now).id;
}

function useSessionIdReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      ensureSessionId();
      setReady(true);
    });
  }, []);

  return ready;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

const FALLBACK_SEARCH_LIMIT = 4;

/**
 * D7 fallback: when the assistant reply carries no product SKUs, search the
 * Magento catalog for the user's text so relevant product cards still appear.
 */
async function fetchFallbackSkus(query: string): Promise<string[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  try {
    const res = await fetch(
      `/api/search/products?q=${encodeURIComponent(q)}&limit=${FALLBACK_SEARCH_LIMIT}`,
      { cache: "no-store" },
    );
    if (!res.ok) return [];
    const data: unknown = await res.json();
    const items =
      data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
        ? ((data as { items: unknown[] }).items)
        : [];
    const skus: string[] = [];
    const seen = new Set<string>();
    for (const item of items) {
      const sku =
        item && typeof item === "object"
          ? (item as { sku?: unknown }).sku
          : undefined;
      if (typeof sku === "string" && sku.trim() && !seen.has(sku.trim())) {
        seen.add(sku.trim());
        skus.push(sku.trim());
      }
    }
    return skus.slice(0, FALLBACK_SEARCH_LIMIT);
  } catch {
    return [];
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
  const [status, setStatus] = useState<CopilotStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [imageAttachment, setImageAttachment] =
    useState<CopilotImageAttachment | null>(null);
  const [pageContext, setPageContext] = useState<CopilotPageContext | null>(
    null,
  );

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

  const enrichAssistantMessage = useCallback(
    async (
      messageId: string,
      finalText: string,
      userQuery: string,
      structured?: { message: string; skus: string[] } | null,
    ) => {
      const { displayText, skus } = parseCopilotAssistantMessage(finalText);
      const structuredSkus = structured?.skus ?? [];
      const text =
        structured?.message?.trim() || displayText.trim() || finalText.trim();

      let widgetSkus = structuredSkus.length > 0 ? structuredSkus : skus;
      let usedFallback = false;
      if (widgetSkus.length === 0 && userQuery.trim().length >= 2) {
        const fallback = await fetchFallbackSkus(userQuery);
        if (fallback.length > 0) {
          widgetSkus = fallback;
          usedFallback = true;
        }
      }

      const content =
        usedFallback && text
          ? `${text}\n\n${t("fallbackProductsIntro")}`
          : usedFallback
            ? t("fallbackProductsIntro")
            : text;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId || m.role !== "assistant") return m;
          return {
            ...m,
            streaming: false,
            content: content || m.content,
            widgetSkus: widgetSkus.length > 0 ? widgetSkus : undefined,
          };
        }),
      );
    },
    [t],
  );

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  const clearSubmitError = useCallback(() => setSubmitError(null), []);

  const attachImage = useCallback(
    async (file: File) => {
      setSubmitError(null);
      if (!file.type.startsWith("image/")) {
        setSubmitError(t("uploadImageOnly"));
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setSubmitError(t("uploadTooLarge"));
        return;
      }
      const dataUrl = await fileToDataUrl(file);
      const base64 = dataUrl.split(",", 2)[1] ?? "";
      if (!base64) {
        setSubmitError(t("uploadReadFailed"));
        return;
      }
      setImageAttachment({
        name: file.name,
        mimeType: file.type || "image/jpeg",
        dataUrl,
        base64,
      });
    },
    [t],
  );

  const removeImageAttachment = useCallback(() => {
    setImageAttachment(null);
  }, []);

  const tryRestCompletion = useCallback(
    async (
      body: Record<string, unknown>,
    ): Promise<{
      text: string;
      structured: { message: string; skus: string[] } | null;
    }> => {
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
        const parsedJson = JSON.parse(text);
        return {
          text: extractCompletionText(parsedJson),
          structured: extractStructuredProductReply(parsedJson),
        };
      } catch {
        return { text, structured: null };
      }
    },
    [t],
  );

  const submitWithTrimmedMessage = useCallback(
    async (trimmed: string, attachment?: CopilotImageAttachment | null) => {
      const messageText = trimmed || (attachment ? t("imageDefaultPrompt") : "");
      if (!messageText) return;
      if (submitBusyRef.current) return;
      submitBusyRef.current = true;

      try {
        setSubmitError(null);

        if (!sessionBootstrap) {
          setSubmitError(t("sessionInitializing"));
          return;
        }

        const session_id = getActiveSessionId();
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

        const intents = parseAddToCartIntents(messageText);
        const beforeSkuQtyMap =
          intents.length > 0
            ? await fetchCartSkuQtyMap(guestCartId)
            : new Map<string, number>();

        streamingAssistantIdRef.current = null;

        const userMsg = newMsg({
          id: crypto.randomUUID(),
          role: "user",
          content: messageText,
          imagePreviewUrl: attachment?.dataUrl,
          imageName: attachment?.name,
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
        setStatus(attachment ? "analyzingImage" : "thinking");

        const body: Record<string, unknown> = {
          session_id,
          message: messageText,
          cart_id: guestCartId,
        };
        if (attachment) {
          body.image_base64 = attachment.base64;
          body.image_mime_type = attachment.mimeType;
        }

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
            const { text: reply, structured } = await tryRestCompletion(body);
            const structuredSkus = structured?.skus ?? [];
            if (!reply.trim() && structuredSkus.length === 0) {
              throw new Error(t("emptyReply"));
            }
            const parsed = parseCopilotAssistantMessage(reply.trim());
            let widgetSkus =
              structuredSkus.length > 0 ? structuredSkus : parsed.skus;
            let usedFallback = false;
            if (widgetSkus.length === 0 && trimmed.trim().length >= 2) {
              const fb = await fetchFallbackSkus(trimmed);
              if (fb.length > 0) {
                widgetSkus = fb;
                usedFallback = true;
              }
            }
            const baseText =
              structured?.message?.trim() ||
              parsed.displayText.trim() ||
              reply.trim();
            setMessages((prev) => [
              ...prev,
              newMsg({
                id: crypto.randomUUID(),
                role: "assistant",
                content: usedFallback
                  ? `${baseText}\n\n${t("fallbackProductsIntro")}`
                  : baseText,
                widgetSkus: widgetSkus.length > 0 ? widgetSkus : undefined,
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
          let assistantText = "";
          let teiaCartOp: ReturnType<
            typeof extractTeiaCartOpFromSseObject
          > = null;
          let structuredReply: ReturnType<
            typeof extractStructuredProductReply
          > = null;

          if (ctype.includes("text/event-stream")) {
            let gotChunk = false;
            await consumeSseBody(
              streamRes,
              (chunk) => {
                if (chunk) {
                  gotChunk = true;
                  assistantText += chunk;
                }
                patchStreamingAssistant(chunk);
              },
              (obj, eventName) => {
                const nextStatus = deriveCopilotStatus(eventName, obj);
                if (nextStatus) setStatus(nextStatus);
                if (obj.done === true) {
                  const extracted = extractTeiaCartOpFromSseObject(obj);
                  if (extracted) teiaCartOp = extracted;
                }
                const structured = extractStructuredProductReply(obj);
                if (structured) structuredReply = structured;
              },
            );
            streamSucceeded = gotChunk || structuredReply !== null;
          } else {
            const raw = await streamRes.text().catch(() => "");
            let appended = "";
            try {
              const parsedJson = JSON.parse(raw);
              appended = extractCompletionText(parsedJson);
              structuredReply = extractStructuredProductReply(parsedJson);
            } catch {
              appended = raw;
            }
            if (appended.trim()) {
              assistantText += appended;
              patchStreamingAssistant(appended);
              streamSucceeded = true;
            }
            if (structuredReply !== null) streamSucceeded = true;
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
            await enrichAssistantMessage(
              assistantId,
              assistantText,
              trimmed,
              structuredReply,
            );
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
        setStatus("idle");
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
    const attachment = imageAttachment;
    if ((!msg && !attachment) || pending) return;
    setDraft("");
    setImageAttachment(null);
    await submitWithTrimmedMessage(msg, attachment);
  }, [draft, imageAttachment, pending, submitWithTrimmedMessage]);

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
      status,
      submitError,
      imageAttachment,
      attachImage,
      removeImageAttachment,
      clearSubmitError,
      sendDraft,
      submitSuggestion,
      pageContext,
      setPageContext,
    }),
    [
      open,
      toggle,
      close,
      messages,
      draft,
      pending,
      status,
      submitError,
      imageAttachment,
      attachImage,
      removeImageAttachment,
      clearSubmitError,
      sendDraft,
      submitSuggestion,
      pageContext,
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
