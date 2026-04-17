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

export default function DocumentsSection({
  locale,
  orderId,
  invoices,
  shipments,
  creditmemos,
  currency,
  labels,
}: DocumentsSectionProps) {
  const fmtMoney = new Intl.NumberFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { style: "currency", currency },
  );
  const fmtDate = new Intl.DateTimeFormat(
    locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-GB",
    { year: "numeric", month: "short", day: "numeric" },
  );

  const hasAny =
    invoices.length > 0 || shipments.length > 0 || creditmemos.length > 0;

  const downloadLinkClasses =
    "inline-flex items-center gap-1 text-xs font-bold text-secondary hover:underline";

  return (
    <section className="mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-primary">{labels.heading}</h2>
        <a
          href={`/api/orders/${orderId}/confirmation?locale=${locale}`}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-[3px] bg-primary text-white hover:brightness-110 transition-all"
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
        </a>
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
                {invoices.map((inv) => (
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
                      <a
                        href={`/api/orders/${orderId}/invoices/${inv.entity_id}/pdf?locale=${locale}`}
                        className={`${downloadLinkClasses} mt-1`}
                        aria-label={labels.downloadInvoice}
                      >
                        <DownloadIcon />
                        {labels.download}
                      </a>
                    </div>
                    <span className="font-medium text-on-surface whitespace-nowrap">
                      {fmtMoney.format(inv.grand_total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {shipments.length > 0 && (
            <div className="bg-surface-container-lowest rounded-card p-4 shadow-ambient">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">
                {labels.shipments}
              </h3>
              <ul className="space-y-3">
                {shipments.map((sh) => (
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
                    <a
                      href={`/api/orders/${orderId}/shipments/${sh.entity_id}/pdf?locale=${locale}`}
                      className={`${downloadLinkClasses} mt-1`}
                      aria-label={labels.downloadShipment}
                    >
                      <DownloadIcon />
                      {labels.download}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {creditmemos.length > 0 && (
            <div className="bg-surface-container-lowest rounded-card p-4 shadow-ambient">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">
                {labels.creditmemos}
              </h3>
              <ul className="space-y-3">
                {creditmemos.map((cm) => (
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
                      <a
                        href={`/api/orders/${orderId}/creditmemos/${cm.entity_id}/pdf?locale=${locale}`}
                        className={`${downloadLinkClasses} mt-1`}
                        aria-label={labels.downloadCreditmemo}
                      >
                        <DownloadIcon />
                        {labels.download}
                      </a>
                    </div>
                    <span className="font-medium text-on-surface whitespace-nowrap">
                      {fmtMoney.format(cm.grand_total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
