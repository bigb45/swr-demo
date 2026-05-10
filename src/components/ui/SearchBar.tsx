"use client";

import { ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  useState,
  useEffect,
  useRef,
  useId,
  useCallback,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import type { MagentoProduct } from "@/types/magento";
import { useCart } from "@/components/CartProvider";
import SearchSuggestionRow from "./SearchSuggestionRow";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LEN = 2;
const DEFAULT_LIMIT = 8;
const MAX_CLIENT_IMAGE_BYTES = 4 * 1024 * 1024;

const CLIENT_ACCEPT_IMAGES =
  "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif";

interface SearchBarProps {
  compact?: boolean;
}

export default function SearchBar({ compact = false }: SearchBarProps) {
  const tNav = useTranslations("nav");
  const tSearch = useTranslations("search");
  const router = useRouter();
  const { cartId } = useCart();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MagentoProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [focusedInside, setFocusedInside] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [visualLoading, setVisualLoading] = useState(false);
  const [fromVisualSearch, setFromVisualSearch] = useState(false);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [assistantVisualNote, setAssistantVisualNote] = useState<string | null>(
    null,
  );

  const trimmed = query.trim();
  const showSuggestionsPanel =
    focusedInside &&
    (trimmed.length >= MIN_QUERY_LEN || visualLoading || fromVisualSearch);

  const resetListState = useCallback(() => {
    setItems([]);
    setFetchError(null);
    setActiveIndex(-1);
  }, []);

  useEffect(() => {
    if (trimmed.length >= MIN_QUERY_LEN) {
      setFromVisualSearch(false);
      setAssistantVisualNote(null);
      setVisualError(null);
    }
  }, [trimmed]);

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LEN) {
      if (!fromVisualSearch) {
        resetListState();
        setLoading(false);
      }
      return;
    }

    resetListState();
    setLoading(true);
    const ac = new AbortController();
    const timer = window.setTimeout(async () => {
      setFetchError(null);
      try {
        const res = await fetch(
          `/api/search/products?q=${encodeURIComponent(trimmed)}&limit=${DEFAULT_LIMIT}`,
          { signal: ac.signal },
        );
        const data = (await res.json()) as {
          items?: MagentoProduct[];
          error?: string;
        };
        if (!res.ok) {
          setItems([]);
          setFetchError(data.error ?? tSearch("error"));
        } else {
          setItems(data.items ?? []);
          setFetchError(data.error ?? null);
        }
        setActiveIndex(-1);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setItems([]);
        setFetchError(tSearch("error"));
        setActiveIndex(-1);
      } finally {
        if (!ac.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [trimmed, resetListState, tSearch]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const el = document.getElementById(`${baseId}-opt-${activeIndex}`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, baseId]);

  const runVisualSearch = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setVisualError(tSearch("visualUnsupportedType"));
        return;
      }
      if (file.size > MAX_CLIENT_IMAGE_BYTES) {
        setVisualError(tSearch("visualFileTooLarge"));
        return;
      }

      setFocusedInside(true);
      setVisualLoading(true);
      setFromVisualSearch(true);
      setVisualError(null);
      setAssistantVisualNote(null);
      setFetchError(null);
      setQuery("");
      resetListState();

      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve(typeof reader.result === "string" ? reader.result : "");
          reader.onerror = () => reject(new Error("read failed"));
          reader.readAsDataURL(file);
        });

        const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/i);
        if (!m) {
          setVisualError(tSearch("visualUnsupportedType"));
          return;
        }

        const mime = m[1].trim().toLowerCase();
        const b64 = m[2].replace(/\s/g, "");

        const res = await fetch("/api/search/visual", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: crypto.randomUUID(),
            image_base64: b64,
            image_mime_type: mime,
            ...(cartId ? { cart_id: cartId } : {}),
          }),
        });

        const data = (await res.json()) as {
          items?: MagentoProduct[];
          assistant_note?: string | null;
          error?: string;
        };

        if (!res.ok) {
          setVisualError(data.error ?? tSearch("visualError"));
          setItems([]);
          return;
        }

        if (data.error) {
          setVisualError(data.error);
          setItems([]);
          setAssistantVisualNote(null);
          return;
        }

        setItems(data.items ?? []);
        setAssistantVisualNote(
          typeof data.assistant_note === "string" && data.assistant_note.trim()
            ? data.assistant_note.trim()
            : null,
        );
        setActiveIndex(-1);
      } catch {
        setVisualError(tSearch("visualError"));
        setItems([]);
      } finally {
        setVisualLoading(false);
      }
    },
    [cartId, resetListState, tSearch],
  );

  function handleVisualFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void runVisualSearch(file);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (activeIndex >= 0 && items[activeIndex]) {
      router.push(`/products/${encodeURIComponent(items[activeIndex].sku)}`);
      setFocusedInside(false);
      setActiveIndex(-1);
      return;
    }
    if (trimmed) {
      router.push(`/products?q=${encodeURIComponent(trimmed)}`);
      setFocusedInside(false);
    }
  }

  function handleContainerBlur(e: React.FocusEvent<HTMLDivElement>) {
    const next = e.relatedTarget as Node | null;
    if (next && containerRef.current?.contains(next)) return;
    setFocusedInside(false);
    setActiveIndex(-1);
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setFocusedInside(false);
      setActiveIndex(-1);
      e.currentTarget.blur();
      return;
    }

    const listNavActive =
      showSuggestionsPanel &&
      !loading &&
      !visualLoading &&
      !fetchError &&
      !visualError &&
      items.length > 0;

    if (!listNavActive) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < 0 ? 0 : Math.min(items.length - 1, i + 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(-1, i - 1));
    }
  }

  const expanded = showSuggestionsPanel;
  const panelError = fromVisualSearch ? visualError : fetchError;
  const panelBusy = loading || visualLoading;
  const listboxActive =
    !panelBusy &&
    !panelError &&
    items.length > 0 &&
    (trimmed.length >= MIN_QUERY_LEN || fromVisualSearch);

  return (
    <div
      ref={containerRef}
      className="relative z-60 w-full"
      onBlur={handleContainerBlur}
      onFocus={() => setFocusedInside(true)}
    >
      <form
        onSubmit={handleSearch}
        className="flex items-stretch w-full"
        role="search"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={CLIENT_ACCEPT_IMAGES}
          capture="environment"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={handleVisualFileChange}
        />
        <div
          className="flex flex-1 min-w-0 items-stretch bg-surface-container-highest border-b-2 border-b-outline-variant transition-colors focus-within:border-b-primary"
          style={{
            borderRadius: "var(--radius-input) var(--radius-input) 0 0",
          }}
        >
          <div className="flex items-center shrink-0 gap-0 pl-2 pr-1">
            <span
              className="flex h-full items-center justify-center text-on-surface-variant pointer-events-none w-8 shrink-0"
              aria-hidden
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            {/* <button
              type="button"
              disabled={visualLoading}
              onClick={() => fileInputRef.current?.click()}
              className={`flex shrink-0 items-center justify-center rounded-[var(--radius-btn)] text-primary hover:bg-surface-container-low hover:text-primary-container disabled:opacity-50 disabled:pointer-events-none ${compact ? "p-1.5" : "p-2"}`}
              aria-label={tSearch("visualSearchAria")}
              title={tSearch("visualSearchAria")}
            >
              <ImagePlus
                size={compact ? 17 : 19}
                strokeWidth={1.75}
                aria-hidden
              />
            </button> */}
          </div>
          <input
            type="search"
            role="combobox"
            aria-expanded={expanded}
            aria-controls={listboxActive ? listboxId : undefined}
            aria-autocomplete="list"
            aria-busy={panelBusy}
            aria-activedescendant={
              listboxActive && activeIndex >= 0
                ? `${baseId}-opt-${activeIndex}`
                : undefined
            }
            aria-label={tNav("searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={tNav("searchPlaceholder")}
            className={`min-w-0 flex-1 bg-transparent border-0 outline-none focus:outline-none focus:ring-0 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant ${compact ? "py-1.5" : "py-2"}`}
          />
        </div>

        <button
          type="submit"
          aria-label={tNav("search")}
          className={`bg-secondary text-white text-sm font-bold tracking-wide hover:brightness-110 transition-all shrink-0 inline-flex items-center justify-center ${compact ? "px-3 py-1.5 min-w-10" : "px-3 sm:px-5 py-2 min-w-10 sm:min-w-[92px]"}`}
          style={{ borderRadius: "0 var(--radius-btn) var(--radius-btn) 0" }}
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
            className="sm:hidden"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className="hidden sm:inline">{tNav("search")}</span>
        </button>
      </form>

      {showSuggestionsPanel ? (
        <div
          className="absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-card bg-surface-container-lowest border border-outline-variant/25 max-h-[min(70vh,28rem)] flex flex-col"
          style={{ boxShadow: "0 10px 30px rgba(26,28,28,0.06)" }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {assistantVisualNote && fromVisualSearch && !panelError ? (
            <div className="max-h-28 overflow-y-auto px-3 py-2 text-xs text-on-surface-variant border-b border-outline-variant/20 bg-surface-container-low">
              {assistantVisualNote}
            </div>
          ) : null}

          {panelBusy ? (
            <p
              className="p-4 text-sm text-on-surface-variant"
              aria-live="polite"
            >
              {visualLoading ? tSearch("visualSearching") : tSearch("loading")}
            </p>
          ) : panelError ? (
            <p className="p-4 text-sm text-red-700" role="alert">
              {panelError}
            </p>
          ) : items.length === 0 ? (
            <p className="p-4 text-sm text-on-surface-variant">
              {fromVisualSearch ? tSearch("visualEmpty") : tSearch("empty")}
            </p>
          ) : (
            <ul
              id={listboxId}
              role="listbox"
              aria-label={tSearch("suggestionsLabel")}
              className="overflow-y-auto flex-1 min-h-0 py-1"
            >
              {items.map((product, index) => (
                <SearchSuggestionRow
                  key={product.sku}
                  product={product}
                  optionId={`${baseId}-opt-${index}`}
                  highlighted={index === activeIndex}
                />
              ))}
            </ul>
          )}

          {trimmed.length >= MIN_QUERY_LEN && !fromVisualSearch ? (
            <div className="border-t border-surface-container-highest px-3 py-2 bg-surface-container-low">
              <Link
                href={`/products?q=${encodeURIComponent(trimmed)}`}
                className="text-xs font-bold uppercase tracking-wide text-primary hover:underline"
                onClick={() => setFocusedInside(false)}
              >
                {tSearch("viewAll")}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
