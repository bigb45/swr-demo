/**
 * Client-side GDPR-style cookie / storage consent.
 * Stored in localStorage; httpOnly cookies cannot be read from JS (auth, checkout).
 */

export const COOKIE_CONSENT_STORAGE_KEY = "swr_cookie_consent_v1";
export const COOKIE_CONSENT_VERSION = 1;

export type StoredCookieConsent = {
  v: typeof COOKIE_CONSENT_VERSION;
  /** User chose only technically necessary storage where applicable. */
  level: "essential" | "all";
  t: number;
};

const PREFERRED_CURRENCY = "preferred_currency";

export function parseStoredConsent(raw: string | null): StoredCookieConsent | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<StoredCookieConsent>;
    if (
      data.v !== COOKIE_CONSENT_VERSION ||
      (data.level !== "essential" && data.level !== "all") ||
      typeof data.t !== "number"
    ) {
      return null;
    }
    return data as StoredCookieConsent;
  } catch {
    return null;
  }
}

export function clearPreferredCurrencyCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${PREFERRED_CURRENCY}=; path=/; max-age=0; SameSite=Lax`;
}
