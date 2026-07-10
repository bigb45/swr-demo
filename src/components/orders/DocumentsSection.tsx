"use client";

import { useState } from "react";
import type {
  MagentoCreditmemo,
  MagentoInvoice,
  MagentoShipment,
} from "@/types/magento";

interface DocumentsSectionProps {
  locale: string;
  orderId: number | string;
  invoices: MagentoInvoice[];
  shipments: MagentoShipment[];
  creditmemos: MagentoCreditmemo[];
  currency: string;
  labels: {
    heading: string;
    invoices: string;
    shipments: string;
    creditmemos: string;
    downloadConfirmation: string;
    download: string;
    downloadInvoice: string;
    downloadShipment: string;
    downloadCreditmemo: string;
    trackingNumber: string;
    noDocuments: string;
    downloadError: string;
  };
}

function DownloadIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function extractFilename(disposition: string | null): string | null {
  if (!disposition) return null;
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match?.[1] ?? null;
}

export default function DocumentsSection({
  locale,
  orderId,
  invoices,
  shipments,
  creditmemos,
  currency,
  labels,
}: DocumentsSectionProps) {
  // Track per-URL fetch state so each document link shows its own progress
  // and its own inline error, instead of a blocking alert().
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  const fmtMoney = new Intl.NumberFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { style: "currency", currency },
  );
  const fmtDate = new Intl.DateTimeFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { year: "numeric", month: "short", day: "numeric" },
  );

  async function handleDownload(url: string, fallbackName: string) {
    if (pendingUrl) return;
    setPendingUrl(url);
    setFailedUrls((prev) => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`PDF request failed (${res.status})`);
      const blob = await res.blob();
      const name =
        extractFilename(res.headers.get("content-disposition")) ??
        fallbackName;
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Revoking immediately can cancel the download in some browsers —
      // give the browser time to hand the blob off first.
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    } catch {
      setFailedUrls((prev) => new Set(prev).add(url));
    } finally {
      setPendingUrl(null);
    }
  }

  function DownloadErrorNote({ url }: { url: string }) {
    if (!failedUrls.has(url)) return null;
    return (
      <p
        role="alert"
        className="mt-1 inline-block bg-error/10 px-2 py-1 text-xs font-medium text-error rounded-(--radius-input)"
      >
        {labels.downloadError}
      </p>
    );
  }

  const hasAny =
    invoices.length > 0 || shipments.length > 0 || creditmemos.length > 0;

  const downloadLinkClasses =
    "inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline disabled:opacity-50 disabled:cursor-wait";

  const confirmationUrl = `/api/orders/${orderId}/confirmation?locale=${locale}`;

  return (
    <section className="mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-primary">{labels.heading}</h2>
        <div className="flex flex-col items-start sm:items-end">
          <button
            type="button"
            onClick={() =>
              handleDownload(confirmationUrl, `order-${orderId}-confirmation.pdf`)
            }
            disabled={pendingUrl !== null}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-[3px] bg-primary text-white hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-wait"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {labels.downloadConfirmation}
          </button>
          <DownloadErrorNote url={confirmationUrl} />
        </div>
      </div>

      {!hasAny ? (
        <p className="text-sm text-on-surface-variant">{labels.noDocuments}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {invoices.length > 0 && (
            <div className="bg-surface-container-lowest rounded-card p-4 shadow-ambient">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">
                {labels.invoices}
              </h3>
              <ul className="space-y-3">
                {invoices.map((inv) => {
                  const url = `/api/orders/${orderId}/invoices/${inv.entity_id}/pdf?locale=${locale}`;
                  return (
                    <li
                      key={inv.entity_id}
                      className="flex items-start justify-between text-sm gap-3"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-on-surface">
                          #{inv.increment_id}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {fmtDate.format(new Date(inv.created_at))}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownload(url, `invoice-${inv.increment_id}.pdf`)
                          }
                          disabled={pendingUrl !== null}
                          className={`${downloadLinkClasses} mt-1`}
                          aria-label={labels.downloadInvoice}
                        >
                          <DownloadIcon />
                          {labels.download}
                        </button>
                        <DownloadErrorNote url={url} />
                      </div>
                      <span className="font-medium text-on-surface whitespace-nowrap">
                        {fmtMoney.format(inv.grand_total)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {shipments.length > 0 && (
            <div className="bg-surface-container-lowest rounded-card p-4 shadow-ambient">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">
                {labels.shipments}
              </h3>
              <ul className="space-y-3">
                {shipments.map((sh) => {
                  const url = `/api/orders/${orderId}/shipments/${sh.entity_id}/pdf?locale=${locale}`;
                  return (
                    <li key={sh.entity_id} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-on-surface">
                          #{sh.increment_id}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {fmtDate.format(new Date(sh.created_at))}
                        </span>
                      </div>
                      {sh.tracks && sh.tracks.length > 0 && (
                        <ul className="mt-1 space-y-0.5">
                          {sh.tracks.map((t, i) => (
                            <li
                              key={t.entity_id ?? i}
                              className="text-xs text-on-surface-variant"
                            >
                              <span className="uppercase tracking-wide">
                                {labels.trackingNumber}:
                              </span>{" "}
                              <span className="font-mono text-on-surface">
                                {t.track_number}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleDownload(url, `shipment-${sh.increment_id}.pdf`)
                        }
                        disabled={pendingUrl !== null}
                        className={`${downloadLinkClasses} mt-1`}
                        aria-label={labels.downloadShipment}
                      >
                        <DownloadIcon />
                        {labels.download}
                      </button>
                      <DownloadErrorNote url={url} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {creditmemos.length > 0 && (
            <div className="bg-surface-container-lowest rounded-card p-4 shadow-ambient">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">
                {labels.creditmemos}
              </h3>
              <ul className="space-y-3">
                {creditmemos.map((cm) => {
                  const url = `/api/orders/${orderId}/creditmemos/${cm.entity_id}/pdf?locale=${locale}`;
                  return (
                    <li
                      key={cm.entity_id}
                      className="flex items-start justify-between text-sm gap-3"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-on-surface">
                          #{cm.increment_id}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {fmtDate.format(new Date(cm.created_at))}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownload(
                              url,
                              `creditmemo-${cm.increment_id}.pdf`,
                            )
                          }
                          disabled={pendingUrl !== null}
                          className={`${downloadLinkClasses} mt-1`}
                          aria-label={labels.downloadCreditmemo}
                        >
                          <DownloadIcon />
                          {labels.download}
                        </button>
                        <DownloadErrorNote url={url} />
                      </div>
                      <span className="font-medium text-on-surface whitespace-nowrap">
                        {fmtMoney.format(cm.grand_total)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
