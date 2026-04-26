"use client";

import { useMemo } from "react";
import type { Country } from "@/lib/directory";

interface CountryRegionFieldsProps {
  countries: Country[];
  countryId: string;
  region: string;
  onCountryChange: (code: string) => void;
  onRegionChange: (region: string) => void;
  labels: {
    country: string;
    region: string;
    regionOptional: string;
  };
  required?: boolean;
  idPrefix?: string;
  countryHint?: string;
}

/**
 * Paired country / region inputs backed by Magento's directory data.
 *
 * - Country is always a `<select>` (falls back to a `<datalist>`-style text
 *   input only if the server returned an empty list, e.g. Magento down).
 * - Region swaps between a `<select>` (countries with `available_regions`)
 *   and a free-text `<input>` (countries without a fixed region list).
 */
export default function CountryRegionFields({
  countries,
  countryId,
  region,
  onCountryChange,
  onRegionChange,
  labels,
  required = true,
  idPrefix = "",
  countryHint,
}: CountryRegionFieldsProps) {
  const selectedCountry = useMemo(
    () => countries.find((c) => c.code === countryId.toUpperCase()),
    [countries, countryId],
  );
  const regions = selectedCountry?.regions ?? [];
  const hasRegions = regions.length > 0;

  const inputClass =
    "w-full px-3 py-2.5 text-sm border border-outline-variant/60 rounded-(--radius-input) bg-surface focus:outline-none focus:border-primary text-on-surface";
  const labelClass =
    "text-xs font-semibold uppercase tracking-wide text-on-surface-variant";

  const countryFieldId = `${idPrefix}countryId`;
  const regionFieldId = `${idPrefix}region`;

  if (countries.length === 0) {
    return (
      <>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor={regionFieldId}>
            {labels.region} <span className="lowercase">({labels.regionOptional})</span>
          </label>
          <input
            id={regionFieldId}
            autoComplete="address-level1"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass} htmlFor={countryFieldId}>
            {labels.country}
          </label>
          <input
            id={countryFieldId}
            required={required}
            maxLength={2}
            autoComplete="country"
            value={countryId}
            onChange={(e) => onCountryChange(e.target.value.toUpperCase())}
            className={inputClass}
          />
          {countryHint && (
            <p className="text-[10px] text-on-surface-variant/60">{countryHint}</p>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor={regionFieldId}>
          {labels.region}
          {!hasRegions && (
            <span className="lowercase"> ({labels.regionOptional})</span>
          )}
        </label>
        {hasRegions ? (
          <select
            id={regionFieldId}
            autoComplete="address-level1"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            className={inputClass}
          >
            <option value="">—</option>
            {regions.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            id={regionFieldId}
            autoComplete="address-level1"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            className={inputClass}
          />
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass} htmlFor={countryFieldId}>
          {labels.country}
        </label>
        <select
          id={countryFieldId}
          required={required}
          autoComplete="country"
          value={countryId.toUpperCase()}
          onChange={(e) => {
            onCountryChange(e.target.value);
            onRegionChange("");
          }}
          className={inputClass}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
