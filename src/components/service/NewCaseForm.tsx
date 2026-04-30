"use client";

import { useActionState, useState, type ReactNode } from "react";
import { submitServiceCase } from "@/app/[locale]/(chrome)/account/service/new/actions";
import type { ServiceCaseKind, ServiceCaseReason } from "@/lib/service";

export interface OrderLineChoice {
  sku: string;
  name: string;
  maxQty: number;
}

export interface NewCaseContext {
  orderId?: string;
  orderIncrementId?: string;
  orderItems?: OrderLineChoice[];
  machineId?: string;
  machineLabel?: string;
  serial?: string;
}

interface NewCaseFormProps {
  kind: ServiceCaseKind;
  locale: string;
  reasons: ServiceCaseReason[];
  context: NewCaseContext;
  /** Read-only block when machine is pre-selected (e.g. warranty, serial) — from server. */
  assetSummarySlot?: ReactNode;
  pickerSlot?: ReactNode;
  showManualMachineFields?: boolean;
  labels: {
    fieldsHeading: string;
    description: string;
    descriptionHint: string;
    reason: string;
    reasonChoose: string;
    reasonLabels: Record<ServiceCaseReason, string>;
    itemsHeading: string;
    itemsHint: string;
    itemQty: string;
    contactHeading: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    attachmentsHeading: string;
    attachmentsHint: string;
    attachmentsAdd: string;
    attachmentsSelectedOne: string;
    attachmentsSelectedMany: string;
    attachmentsNote: string;
    manualHeading: string;
    manualToggle: string;
    manualHint: string;
    manualBrand: string;
    manualModel: string;
    manualSerial: string;
    submit: string;
    submitting: string;
    errorMissing: string;
    errorNoItems?: string;
    formIntro?: string;
  };
}

function itemKey(sku: string, i: number) {
  return `${sku}-${i}`;
}

export default function NewCaseForm({
  kind,
  locale,
  reasons,
  context,
  assetSummarySlot,
  pickerSlot,
  showManualMachineFields = false,
  labels,
}: NewCaseFormProps) {
  const [state, formAction, pending] = useActionState(submitServiceCase, {});
  const [selectedQty, setSelectedQty] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    (context.orderItems ?? []).forEach((it, i) => {
      init[itemKey(it.sku, i)] = 0;
    });
    return init;
  });
  const [fileCount, setFileCount] = useState(0);

  const inputCls =
    "w-full px-4 py-3 text-sm bg-surface-container-lowest border border-outline-variant/40 focus:outline-none focus:border-primary";
  const inputStyle = { borderRadius: "var(--radius-btn)" } as const;

  const hasOrderLines = Boolean(
    context.orderItems && context.orderItems.length > 0,
  );
  const showOrderBlock =
    hasOrderLines &&
    (kind === "return" || kind === "repair" || kind === "inspection");

  const orderItemsFieldset = showOrderBlock ? (
    <fieldset
      className="flex flex-col gap-3 p-6 sm:p-8 bg-surface-container-low"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <legend className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
        {labels.itemsHeading}
      </legend>
      <p className="text-sm text-on-surface-variant leading-relaxed">
        {labels.itemsHint}
      </p>
      <ul className="flex flex-col gap-2">
        {context.orderItems!.map((it, i) => {
          const key = itemKey(it.sku, i);
          const qty = selectedQty[key] ?? 0;
          return (
            <li
              key={key}
              className="flex flex-wrap items-center gap-3 p-4 bg-surface-container-lowest"
              style={{ borderRadius: "var(--radius-btn)" }}
            >
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-on-surface truncate">
                  {it.name}
                </span>
                <span className="text-xs font-mono text-on-surface-variant">
                  {it.sku} · max {it.maxQty}
                </span>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {labels.itemQty}
                <input
                  type="number"
                  min={0}
                  max={it.maxQty}
                  value={qty}
                  onChange={(e) =>
                    setSelectedQty((prev) => ({
                      ...prev,
                      [key]: Math.max(
                        0,
                        Math.min(it.maxQty, Number(e.target.value) || 0),
                      ),
                    }))
                  }
                  className="w-20 px-3 py-2 text-center bg-surface-container-lowest border border-outline-variant/40 focus:outline-none focus:border-primary"
                  style={{ borderRadius: "var(--radius-btn)" }}
                />
              </label>
              {qty > 0 ? (
                <>
                  <input type="hidden" name="item_sku" value={it.sku} />
                  <input type="hidden" name="item_name" value={it.name} />
                  <input type="hidden" name="item_qty" value={qty} />
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </fieldset>
  ) : null;

  const reasonFieldset = (
    <fieldset
      className="flex flex-col gap-4 p-6 sm:p-8 bg-surface-container-low"
      style={{
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <legend className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
        {labels.fieldsHeading}
      </legend>

      <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {labels.reason}
        <select
          name="reason"
          required
          defaultValue=""
          className={inputCls}
          style={inputStyle}
        >
          <option value="" disabled>
            {labels.reasonChoose}
          </option>
          {reasons.map((r) => (
            <option key={r} value={r}>
              {labels.reasonLabels[r]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {labels.description}
        <textarea
          name="description"
          required
          rows={5}
          className={inputCls}
          style={inputStyle}
        />
        <span className="text-[11px] font-normal normal-case tracking-normal text-on-surface-variant">
          {labels.descriptionHint}
        </span>
      </label>
    </fieldset>
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-8"
      encType="multipart/form-data"
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="locale" value={locale} />
      {context.orderId ? (
        <input type="hidden" name="orderId" value={context.orderId} />
      ) : null}
      {context.machineId ? (
        <input type="hidden" name="machineId" value={context.machineId} />
      ) : null}
      {context.serial ? (
        <input type="hidden" name="serial" value={context.serial} />
      ) : null}

      {labels.formIntro ? (
        <p className="text-sm text-on-surface-variant leading-relaxed max-w-2xl">
          {labels.formIntro}
        </p>
      ) : null}

      {/* Repair / inspection: order lines first, then fleet / manual, then case details */}
      {kind === "repair" || kind === "inspection" ? orderItemsFieldset : null}

      {assetSummarySlot}

      {kind === "repair" || kind === "inspection" ? pickerSlot : null}

      {kind === "return" ? reasonFieldset : null}
      {kind === "return" ? orderItemsFieldset : null}

      {/* Manual machine fallback — only when the fleet picker is offered
          (repair / inspection without a preselected machine). */}
      {showManualMachineFields ? (
        <details
          className="group p-6 sm:p-8 bg-surface-container-low"
          style={{
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <summary className="flex items-center justify-between gap-3 cursor-pointer list-none select-none">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                {labels.manualHeading}
              </span>
              <span className="text-sm font-semibold text-on-surface">
                {labels.manualToggle}
              </span>
            </div>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary transition-transform group-open:rotate-180"
              aria-hidden
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div className="flex flex-col gap-4 mt-5">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {labels.manualHint}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {labels.manualBrand}
                <input
                  type="text"
                  name="manualBrand"
                  className={inputCls}
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                {labels.manualModel}
                <input
                  type="text"
                  name="manualModel"
                  className={inputCls}
                  style={inputStyle}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant sm:col-span-2">
                {labels.manualSerial}
                <input
                  type="text"
                  name="manualSerial"
                  className={`${inputCls} font-mono`}
                  style={inputStyle}
                />
              </label>
            </div>
          </div>
        </details>
      ) : null}

      {kind === "repair" || kind === "inspection" ? reasonFieldset : null}

      {/* Attachments */}
      <fieldset
        className="flex flex-col gap-3 p-6 sm:p-8 bg-surface-container-low"
        style={{
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-ambient)",
        }}
      >
        <legend className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          {labels.attachmentsHeading}
        </legend>
        <p className="text-sm text-on-surface-variant leading-relaxed">
          {labels.attachmentsHint}
        </p>
        <label
          className="flex items-center justify-center gap-3 p-6 bg-surface-container-lowest border border-dashed border-outline-variant/60 cursor-pointer hover:border-primary transition-colors text-sm font-bold uppercase tracking-wider text-on-surface-variant"
          style={{ borderRadius: "var(--radius-btn)" }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {fileCount === 0
            ? labels.attachmentsAdd
            : fileCount === 1
              ? labels.attachmentsSelectedOne
              : labels.attachmentsSelectedMany.replace("COUNT", String(fileCount))}
          <input
            type="file"
            name="attachments"
            multiple
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={(e) => setFileCount(e.target.files?.length ?? 0)}
          />
        </label>
        <p className="text-[11px] text-on-surface-variant">
          {labels.attachmentsNote}
        </p>
      </fieldset>

      {/* Contact */}
      <fieldset
        className="flex flex-col gap-4 p-6 sm:p-8 bg-surface-container-low"
        style={{
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-ambient)",
        }}
      >
        <legend className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
          {labels.contactHeading}
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {labels.contactName}
            <input
              type="text"
              name="contactName"
              required
              className={inputCls}
              style={inputStyle}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            {labels.contactEmail}
            <input
              type="email"
              name="contactEmail"
              className={inputCls}
              style={inputStyle}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant sm:col-span-2">
            {labels.contactPhone}
            <input
              type="tel"
              name="contactPhone"
              className={inputCls}
              style={inputStyle}
            />
          </label>
        </div>
      </fieldset>

      {state?.error ? (
        <p
          className="text-sm text-error bg-error/10 px-4 py-3"
          style={{ borderRadius: "var(--radius-btn)" }}
        >
          {state.error === "no_order_lines" && labels.errorNoItems
            ? labels.errorNoItems
            : labels.errorMissing}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start inline-flex items-center gap-2 px-6 py-3 bg-secondary text-white text-sm font-bold uppercase tracking-[0.05em] hover:brightness-110 disabled:opacity-60"
        style={{ borderRadius: "var(--radius-btn)" }}
      >
        {pending ? labels.submitting : labels.submit}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </form>
  );
}
