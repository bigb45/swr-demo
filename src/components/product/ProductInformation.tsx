"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PimFeature } from "@/lib/magento-shared";

interface ProductInformationProps {
  features: PimFeature[];
}

/** Rows worth offering a one-click copy — identifiers people paste elsewhere. */
const COPYABLE_CODES = new Set([
  "ean",
  "eclass",
  "gtin",
  "herstellerartikelnummer",
  "internationalPid",
  "supplierPid",
  "wgnr",
]);

const COLLAPSED_ROW_COUNT = 6;

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mt-0.5 shrink-0 text-secondary"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="11" height="11" rx="1" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

function ChevronIcon({ up }: { up: boolean }) {
  return (
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
      className={up ? "rotate-180" : undefined}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CopyButton({ value }: { value: string }) {
  const t = useTranslations("products");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / denied permission) — stay silent.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? t("copied") : t("copyValue")}
      aria-label={copied ? t("copied") : t("copyValue")}
      className="shrink-0 p-1 text-on-surface-variant transition-colors duration-200 hover:text-primary cursor-pointer"
      style={{ borderRadius: "var(--radius-btn)" }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

/**
 * PDP "Product information" block — the curated Teia PIM feature list.
 * Labels arrive pre-localized from the PIM, so only the chrome is translated.
 */
export default function ProductInformation({
  features,
}: ProductInformationProps) {
  const t = useTranslations("products");
  const [expanded, setExpanded] = useState(false);

  if (features.length === 0) return null;

  const collapsible = features.length > COLLAPSED_ROW_COUNT;
  const visible =
    collapsible && !expanded ? features.slice(0, COLLAPSED_ROW_COUNT) : features;

  return (
    <div>
      <h2 className="text-sm font-black uppercase tracking-[0.05em] text-primary mb-4">
        {t("productInformation")}
      </h2>

      <dl className="m-0">
        {visible.map((feature, index) => {
          const value = feature.values.join(", ");
          return (
            <div
              key={`${feature.code}-${index}`}
              className={`flex items-start gap-3 py-3 ${
                index > 0
                  ? "border-t border-t-[rgba(193,199,209,0.3)]"
                  : ""
              }`}
            >
              <CheckIcon />
              <dt className="w-[180px] shrink-0 text-sm font-bold text-on-surface">
                {feature.label}:
              </dt>
              <dd className="m-0 min-w-0 flex-1 text-sm text-on-surface break-words">
                {value}
              </dd>
              {COPYABLE_CODES.has(feature.code) ? (
                <CopyButton value={value} />
              ) : null}
            </div>
          );
        })}
      </dl>

      {collapsible ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="mt-2 flex w-full items-center justify-center gap-2 bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface transition-colors duration-200 hover:bg-surface-container-highest cursor-pointer"
        >
          <ChevronIcon up={expanded} />
          {expanded ? t("showFewerFeatures") : t("showMoreFeatures")}
        </button>
      ) : null}
    </div>
  );
}
