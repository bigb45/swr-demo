/**
 * POST /api/auth/register
 * Body: {
 *   accountType, salutation, firstName, lastName, company, vatId,
 *   street, houseNumber, postcode, city, country, phone, email, password
 * }
 * Creates a Magento customer account with a default billing/shipping address.
 * When "Require Admin Approval" is enabled in Magento, the account stays
 * inactive until manually approved by SWR staff.
 */

import { NextRequest } from "next/server";
import { extractMagentoMessage } from "@/lib/checkout";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

const SALUTATION_PREFIX: Record<string, string> = {
  mr: "Herr",
  mrs: "Frau",
  company: "Firma",
  none: "",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    accountType,
    salutation,
    firstName,
    lastName,
    company,
    vatId,
    street,
    houseNumber,
    postcode,
    city,
    country,
    phone,
    email,
    password,
  } = body ?? {};

  const isBusiness = accountType !== "private";

  // Core required fields for every account.
  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !street ||
    !houseNumber ||
    !postcode ||
    !city ||
    !country ||
    !phone
  ) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }
  // Company is mandatory for business accounts.
  if (isBusiness && !company) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }

  const prefix = SALUTATION_PREFIX[salutation] ?? "";
  const countryId = String(country).toUpperCase();
  const streetLine = `${String(street).trim()} ${String(houseNumber).trim()}`.trim();
  const companyValue = isBusiness ? String(company).trim() : "";

  const customer: Record<string, unknown> = {
    firstname: firstName,
    lastname: lastName,
    email,
    website_id: 1,
    store_id: 1,
    addresses: [
      {
        firstname: firstName,
        lastname: lastName,
        ...(prefix ? { prefix } : {}),
        ...(companyValue ? { company: companyValue } : {}),
        ...(vatId ? { vat_id: String(vatId).trim() } : {}),
        street: [streetLine],
        city,
        postcode,
        country_id: countryId,
        telephone: phone,
        default_billing: true,
        default_shipping: true,
      },
    ],
  };

  if (prefix) customer.prefix = prefix;
  if (vatId) customer.taxvat = String(vatId).trim();
  if (companyValue) {
    customer.custom_attributes = [
      {
        attribute_code:
          process.env.MAGENTO_CUSTOMER_COMPANY_ATTRIBUTE ?? "company",
        value: companyValue,
      },
    ];
  }

  const res = await fetch(`${MAGENTO}/rest/V1/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ customer, password }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    return Response.json(
      {
        error: extractMagentoMessage(
          errBody,
          "Registration failed. Please try again.",
        ),
      },
      { status: res.status },
    );
  }

  return Response.json({ ok: true, pendingApproval: true }, { status: 201 });
}
