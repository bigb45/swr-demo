import type { MagentoCustomerMe } from "@/types/magento";

/** Customer EAV attribute for account phone (create in Magento if missing). */
export const CUSTOMER_PHONE_ATTRIBUTE_CODE =
  process.env.MAGENTO_CUSTOMER_PHONE_ATTRIBUTE ?? "contact_phone";

export function readCustomerPhone(me: MagentoCustomerMe): string {
  const attrs = me.custom_attributes;
  if (!Array.isArray(attrs)) return "";
  const row = attrs.find(
    (a) => a.attribute_code === CUSTOMER_PHONE_ATTRIBUTE_CODE,
  );
  if (!row) return "";
  const v = row.value;
  return Array.isArray(v) ? String(v[0] ?? "") : String(v ?? "");
}

export function mergeCustomerPhone(
  me: MagentoCustomerMe,
  phone: string,
): MagentoCustomerMe {
  const trimmed = phone.trim();
  const rest = (me.custom_attributes ?? []).filter(
    (a) => a.attribute_code !== CUSTOMER_PHONE_ATTRIBUTE_CODE,
  );
  if (trimmed.length > 0) {
    return {
      ...me,
      custom_attributes: [
        ...rest,
        { attribute_code: CUSTOMER_PHONE_ATTRIBUTE_CODE, value: trimmed },
      ],
    };
  }
  if (rest.length > 0) {
    return { ...me, custom_attributes: rest };
  }
  return { ...me, custom_attributes: undefined };
}
