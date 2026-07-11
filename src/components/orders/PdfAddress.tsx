import { Text, View } from "@react-pdf/renderer";
import type { MagentoOrderAddress } from "@/types/magento";
import { pdfStyles as styles } from "@/components/orders/pdfStyles";
import { formatCountryId } from "@/lib/order-labels";

interface PdfAddressProps {
  heading: string;
  address?: MagentoOrderAddress;
  fallback?: string;
  /** BCP 47 locale for country name display. */
  locale?: string;
}

/**
 * Shared address block used by all four PDFs. Renders a titled card; when
 * `address` is undefined and a `fallback` is provided (e.g. "Same as billing
 * address"), the fallback text is shown instead of the address lines.
 */
export default function PdfAddress({
  heading,
  address,
  fallback,
  locale = "de",
}: PdfAddressProps) {
  const name = address
    ? [address.firstname, address.lastname].filter(Boolean).join(" ")
    : "";
  const cityLine = address
    ? [address.postcode, address.city].filter(Boolean).join(" ")
    : "";
  const countryLabel = address?.country_id
    ? formatCountryId(locale, address.country_id)
    : "";

  return (
    <View style={styles.addressBlock}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {!address && fallback ? (
        <Text style={styles.addressText}>{fallback}</Text>
      ) : address ? (
        <View>
          {address.company ? (
            <Text style={styles.addressBold}>{address.company}</Text>
          ) : null}
          {name ? (
            <Text
              style={address.company ? styles.addressText : styles.addressBold}
            >
              {name}
            </Text>
          ) : null}
          {address.street?.map((l, i) => (
            <Text key={i} style={styles.addressText}>
              {l}
            </Text>
          ))}
          {cityLine ? (
            <Text style={styles.addressText}>{cityLine}</Text>
          ) : null}
          {countryLabel ? (
            <Text style={styles.addressText}>{countryLabel}</Text>
          ) : null}
          {address.telephone ? (
            <Text style={styles.addressText}>{address.telephone}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
