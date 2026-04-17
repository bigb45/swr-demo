import type { MagentoOrderAddress } from "@/types/magento";

interface AddressBlockProps {
  title: string;
  address: MagentoOrderAddress | undefined | null;
  /** Optional fallback node (e.g. "Same as billing" message). */
  fallback?: React.ReactNode;
}

export default function AddressBlock({
  title,
  address,
  fallback,
}: AddressBlockProps) {
  const hasAddress =
    !!address &&
    (address.firstname ||
      address.lastname ||
      address.company ||
      (address.street && address.street.length > 0) ||
      address.city);

  return (
    <div className="bg-surface-container-lowest rounded-card p-5 shadow-ambient">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-3">
        {title}
      </h2>

      {hasAddress ? (
        <div className="text-sm text-on-surface leading-relaxed">
          {address!.company ? (
            <div className="font-bold">{address!.company}</div>
          ) : null}
          {(address!.firstname || address!.lastname) && (
            <div className={address!.company ? "" : "font-bold"}>
              {[address!.firstname, address!.lastname]
                .filter(Boolean)
                .join(" ")}
            </div>
          )}
          {address!.street?.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          {(address!.postcode || address!.city) && (
            <div>
              {[address!.postcode, address!.city].filter(Boolean).join(" ")}
            </div>
          )}
          {address!.region ? <div>{address!.region}</div> : null}
          {address!.country_id ? <div>{address!.country_id}</div> : null}
          {address!.telephone ? (
            <div className="text-on-surface-variant mt-2 text-xs">
              {address!.telephone}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-sm text-on-surface-variant">{fallback ?? "—"}</div>
      )}
    </div>
  );
}
