const CART_TOAST_FLASH_KEY = "swr_cart_toast_flash";

/** Persist a toast message key across a client navigation (e.g. quotation accept → cart). */
export function setCartToastFlash(messageKey: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CART_TOAST_FLASH_KEY, messageKey);
  } catch {
    // sessionStorage may be unavailable in private mode
  }
}

/** Read and clear a pending cart toast message key, if any. */
export function consumeCartToastFlash(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const key = sessionStorage.getItem(CART_TOAST_FLASH_KEY);
    if (key) sessionStorage.removeItem(CART_TOAST_FLASH_KEY);
    return key;
  } catch {
    return null;
  }
}
