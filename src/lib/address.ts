/**
 * Address parsing helpers shared by:
 * - /api/account/addresses[/[id]] route handlers (validate inbound JSON)
 * - the /account/addresses form server action
 * - /checkout/address (when the user fills the inline "new address" form)
 *
 * The frontend always submits a flat shape (`AddressInput`); these helpers
 * turn that into the shape Magento expects on either the customer record
 * (`MagentoCustomerAddress`) or on a cart (`MagentoCheckoutAddress`).
 */

import type {
  MagentoCheckoutAddress,
  MagentoCustomerAddress,
} from "@/types/magento";

export interface AddressInput {
  firstname: string;
  lastname: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  postcode: string;
  countryId: string;
  region?: string;
  telephone: string;
  defaultBilling?: boolean;
  defaultShipping?: boolean;
}

export class AddressValidationError extends Error {}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asBool(v: unknown): boolean {
  return v === true || v === "true" || v === "on" || v === 1 || v === "1";
}

export function parseAddressInput(raw: unknown): AddressInput {
  if (!raw || typeof raw !== "object") {
    throw new AddressValidationError("Invalid address payload");
  }
  const r = raw as Record<string, unknown>;

  const out: AddressInput = {
    firstname: asString(r.firstname),
    lastname: asString(r.lastname),
    company: asString(r.company) || undefined,
    street1: asString(r.street1),
    street2: asString(r.street2) || undefined,
    city: asString(r.city),
    postcode: asString(r.postcode),
    countryId: asString(r.countryId).toUpperCase(),
    region: asString(r.region) || undefined,
    telephone: asString(r.telephone),
    defaultBilling: asBool(r.defaultBilling),
    defaultShipping: asBool(r.defaultShipping),
  };

  const required: Array<[string, string]> = [
    ["firstname", out.firstname],
    ["lastname", out.lastname],
    ["street1", out.street1],
    ["city", out.city],
    ["postcode", out.postcode],
    ["countryId", out.countryId],
    ["telephone", out.telephone],
  ];
  const missing = required.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    throw new AddressValidationError(
      `Missing required field(s): ${missing.join(", ")}`,
    );
  }
  if (out.countryId.length !== 2) {
    throw new AddressValidationError("countryId must be a 2-letter ISO code");
  }
  return out;
}

export function toMagentoCustomerAddress(
  input: AddressInput,
  id?: number,
): MagentoCustomerAddress {
  return {
    ...(id ? { id } : {}),
    firstname: input.firstname,
    lastname: input.lastname,
    company: input.company,
    street: input.street2 ? [input.street1, input.street2] : [input.street1],
    city: input.city,
    postcode: input.postcode,
    country_id: input.countryId,
    region: input.region ? { region: input.region } : undefined,
    telephone: input.telephone,
    default_billing: input.defaultBilling || undefined,
    default_shipping: input.defaultShipping || undefined,
  };
}

export function customerAddressToCheckoutAddress(
  address: MagentoCustomerAddress,
  email?: string,
): MagentoCheckoutAddress {
  return {
    firstname: address.firstname,
    lastname: address.lastname,
    company: address.company,
    street: address.street,
    city: address.city,
    postcode: address.postcode,
    country_id: address.country_id,
    region: address.region?.region,
    region_code: address.region?.region_code,
    region_id: address.region?.region_id ?? address.region_id,
    telephone: address.telephone,
    email,
    customer_address_id: address.id,
    save_in_address_book: 0,
  };
}

export function inputToCheckoutAddress(
  input: AddressInput,
  email?: string,
): MagentoCheckoutAddress {
  return {
    firstname: input.firstname,
    lastname: input.lastname,
    company: input.company,
    street: input.street2 ? [input.street1, input.street2] : [input.street1],
    city: input.city,
    postcode: input.postcode,
    country_id: input.countryId,
    region: input.region,
    telephone: input.telephone,
    email,
    save_in_address_book: 0,
  };
}

export function customerAddressToInput(
  address: MagentoCustomerAddress,
): AddressInput {
  return {
    firstname: address.firstname,
    lastname: address.lastname,
    company: address.company,
    street1: address.street[0] ?? "",
    street2: address.street[1] || undefined,
    city: address.city,
    postcode: address.postcode,
    countryId: address.country_id,
    region: address.region?.region,
    telephone: address.telephone,
    defaultBilling: !!address.default_billing,
    defaultShipping: !!address.default_shipping,
  };
}
