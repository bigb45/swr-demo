"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  COOKIE_CONSENT_VERSION,
  clearPreferredCurrencyCookie,
  parseStoredConsent,
  type StoredCookieConsent,
} from "@/lib/cookie-consent";

export type CookieConsentLevel = "needsChoice" | "essential" | "all";

type CookieConsentContextValue = {
  /** Client finished reading localStorage (avoids hydration mismatch). */
  ready: boolean;
  level: CookieConsentLevel;
  /** True when comfort / optional cookies and related features are allowed. */
  optionalAllowed: boolean;
  acceptAll: () => void;
  acceptEssentialOnly: () => void;
  /** Clears the decision so the banner returns (e.g. footer “Cookie settings”). */
  reopenBanner: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(
  null
);

function persist(level: StoredCookieConsent["level"]) {
  const payload: StoredCookieConsent = {
    v: COOKIE_CONSENT_VERSION,
    level,
    t: Date.now(),
  };
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
}

function levelFromStorage(): CookieConsentLevel {
  const parsed = parseStoredConsent(
    localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
  );
  if (!parsed) return "needsChoice";
  return parsed.level === "all" ? "all" : "essential";
}

export function CookieConsentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [level, setLevel] = useState<CookieConsentLevel>("needsChoice");

  useEffect(() => {
    queueMicrotask(() => {
      setLevel(levelFromStorage());
      setReady(true);
    });
  }, []);

  const acceptAll = useCallback(() => {
    persist("all");
    setLevel("all");
  }, []);

  const acceptEssentialOnly = useCallback(() => {
    persist("essential");
    clearPreferredCurrencyCookie();
    setLevel("essential");
  }, []);

  const reopenBanner = useCallback(() => {
    localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
    clearPreferredCurrencyCookie();
    setLevel("needsChoice");
  }, []);

  const value = useMemo(
    (): CookieConsentContextValue => ({
      ready,
      level,
      optionalAllowed: level === "all",
      acceptAll,
      acceptEssentialOnly,
      reopenBanner,
    }),
    [ready, level, acceptAll, acceptEssentialOnly, reopenBanner]
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return ctx;
}
