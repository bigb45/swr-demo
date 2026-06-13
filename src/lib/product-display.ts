/** Strip HTML tags for plain-text junk checks. */
function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const JUNK_TEXT = new Set(["meow", "test", "lorem", "lorem ipsum", "foo", "bar"]);

/**
 * Returns true when attribute copy should be hidden in listing/PDP UI
 * (demo junk, empty, or placeholder values from Magento test data).
 */
export function isJunkDisplayText(value: string | null | undefined): boolean {
  if (value == null) return true;
  const plain = stripHtml(value);
  if (!plain) return true;
  const lower = plain.toLowerCase();
  if (JUNK_TEXT.has(lower)) return true;
  if (/^test\b/i.test(plain) && plain.length < 32) return true;
  return false;
}

/** Short description safe for dangerouslySetInnerHTML; null when junk/empty. */
export function getDisplayShortDescription(
  html: string | null | undefined,
): string | null {
  if (isJunkDisplayText(html)) return null;
  return html ?? null;
}

/** Brand/manufacturer label safe for UI; null when junk/empty. */
export function getDisplayBrandLabel(
  value: string | null | undefined,
): string | null {
  if (isJunkDisplayText(value)) return null;
  return value?.trim() ?? null;
}
