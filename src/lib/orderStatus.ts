/**
 * ERP hook-point.
 *
 * This module is the single source of truth for translating a Magento
 * `state`/`status` pair into a small, friendly set of statuses that the
 * UI can render consistently. When we integrate with an external ERP
 * (e.g. to show "Awaiting delivery from supplier" or "Partially invoiced"),
 * override the mapping here — the list and detail pages, the status
 * badges, and any future confirmation/RMA flows all read from this file.
 */

export type FriendlyStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "complete"
  | "canceled"
  | "holded"
  | "closed"
  | "unknown";

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

/**
 * Maps a Magento `status`/`state` pair to a friendly status token.
 *
 * Magento `state` is the coarse lifecycle bucket (`new`, `pending_payment`,
 * `processing`, `complete`, `closed`, `canceled`, `holded`, `payment_review`).
 * `status` is a project-configurable sub-state; most Magento installs map
 * roughly 1:1 onto state. We prefer `status` when recognisable and fall back
 * to `state`.
 */
export function mapMagentoStatus(
  status: string | undefined | null,
  state: string | undefined | null,
): FriendlyStatus {
  const s = (status ?? "").toLowerCase().trim();
  const st = (state ?? "").toLowerCase().trim();

  // Shipped is not a Magento-native state; it appears only as a status label
  // in installs that customize the workflow. Detect it first.
  if (s === "shipped" || s === "complete_shipped") return "shipped";

  switch (s) {
    case "pending":
    case "pending_payment":
    case "payment_review":
    case "new":
      return "pending";
    case "processing":
    case "pending_paypal":
    case "fraud":
      return "processing";
    case "complete":
      return "complete";
    case "canceled":
      return "canceled";
    case "holded":
    case "on_hold":
      return "holded";
    case "closed":
      return "closed";
  }

  switch (st) {
    case "new":
    case "pending_payment":
    case "payment_review":
      return "pending";
    case "processing":
      return "processing";
    case "complete":
      return "complete";
    case "canceled":
      return "canceled";
    case "holded":
      return "holded";
    case "closed":
      return "closed";
  }

  return "unknown";
}

export function statusTone(s: FriendlyStatus): StatusTone {
  switch (s) {
    case "pending":
      return "neutral";
    case "processing":
      return "info";
    case "shipped":
      return "info";
    case "complete":
      return "success";
    case "closed":
      return "success";
    case "holded":
      return "warning";
    case "canceled":
      return "danger";
    default:
      return "neutral";
  }
}

/** Tailwind classes for each tone; kept here so badges stay consistent. */
export function statusBadgeClasses(tone: StatusTone): string {
  switch (tone) {
    case "info":
      return "bg-primary/10 text-primary";
    case "success":
      return "bg-secondary/10 text-secondary";
    case "warning":
      return "bg-amber-100 text-amber-800";
    case "danger":
      return "bg-red-100 text-red-700";
    case "neutral":
    default:
      return "bg-surface-container-low text-on-surface-variant";
  }
}

/* ----------------------------- ERP resolver ----------------------------- */

/**
 * Tone dictionary for ERP-specific status codes. Codes not listed here
 * default to `info`. Extend this map (and the translations) as new ERP
 * statuses surface from the integration.
 */
const ERP_CODE_TONES: Record<string, StatusTone> = {
  delivery_note_printed: "info",
  partially_invoiced: "info",
  awaiting_supplier: "warning",
  ready_for_pickup: "success",
  partially_shipped: "info",
  backorder: "warning",
};

export interface ResolvedStatus {
  /** Coarse bucket; useful when downstream code wants to branch on lifecycle. */
  friendly: FriendlyStatus;
  /** Tailwind tone to use for badge coloring. */
  tone: StatusTone;
  /** Human-readable, locale-appropriate label to render in the UI. */
  label: string;
  /** Where the label came from, for debugging / future analytics. */
  source: "erp-code" | "erp-label" | "magento";
}

export interface ResolveStatusInput {
  status?: string | null;
  state?: string | null;
  extension_attributes?: {
    erp_status_code?: string;
    erp_status_label?: string;
  } | null;
}

/**
 * Minimal translator signature — compatible with next-intl's `useTranslations`
 * and `getTranslations` return types without coupling to either.
 */
export type TranslatorFn = (key: string) => string;

/**
 * Resolves an order's effective display status.
 *
 * Priority:
 *   1. `erp_status_code` — translated via `orders.erpStatus.<code>` if available,
 *      else the raw code is used as a last-resort label.
 *   2. `erp_status_label` — used verbatim (ERP is authoritative for the label).
 *   3. Magento `status`/`state` — mapped via `mapMagentoStatus` and translated
 *      via `orders.status.<friendly>`.
 *
 * The `friendly` bucket is always computed from Magento status/state so that
 * lifecycle-driven logic (e.g. can-reorder, can-cancel) keeps working even
 * when an ERP label is present.
 */
export function resolveOrderStatus(
  order: ResolveStatusInput,
  t: TranslatorFn,
): ResolvedStatus {
  const friendly = mapMagentoStatus(order.status, order.state);
  const erpCode = order.extension_attributes?.erp_status_code?.trim();
  const erpLabel = order.extension_attributes?.erp_status_label?.trim();

  if (erpCode) {
    const key = `erpStatus.${erpCode}`;
    const translated = safeTranslate(t, key);
    return {
      friendly,
      tone: ERP_CODE_TONES[erpCode] ?? "info",
      label: translated ?? erpLabel ?? erpCode,
      source: "erp-code",
    };
  }

  if (erpLabel) {
    return {
      friendly,
      tone: "info",
      label: erpLabel,
      source: "erp-label",
    };
  }

  return {
    friendly,
    tone: statusTone(friendly),
    label: t(`status.${friendly}`),
    source: "magento",
  };
}

/**
 * next-intl's `t()` throws when a key is missing (by default). We swallow
 * that and return null so the ERP path can fall back to the raw label/code.
 */
function safeTranslate(t: TranslatorFn, key: string): string | null {
  try {
    const v = t(key);
    if (!v || v === key) return null;
    return v;
  } catch {
    return null;
  }
}
