import { magentoGet } from "@/lib/magento";
import type {
  MagentoCreditmemo,
  MagentoCreditmemoSearchResult,
  MagentoCustomerMe,
  MagentoInvoice,
  MagentoInvoiceSearchResult,
  MagentoOrderDetail,
  MagentoOrderSearchResult,
  MagentoOrderSummary,
  MagentoShipment,
  MagentoShipmentSearchResult,
} from "@/types/magento";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

export async function getCustomerEmail(
  customerToken: string,
): Promise<string | null> {
  const res = await fetch(`${MAGENTO}/rest/V1/customers/me`, {
    headers: { Authorization: `Bearer ${customerToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data: MagentoCustomerMe = await res.json();
  return data.email ?? null;
}

export async function listCustomerOrders(
  email: string,
): Promise<MagentoOrderSummary[]> {
  const params = new URLSearchParams({
    "searchCriteria[filter_groups][0][filters][0][field]": "customer_email",
    "searchCriteria[filter_groups][0][filters][0][value]": email,
    "searchCriteria[sortOrders][0][field]": "created_at",
    "searchCriteria[sortOrders][0][direction]": "DESC",
    "searchCriteria[pageSize]": "50",
  });
  try {
    const data = await magentoGet<MagentoOrderSearchResult>(
      `/orders?${params.toString()}`,
      false,
    );
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function getOrder(
  orderId: string | number,
): Promise<MagentoOrderDetail | null> {
  try {
    return await magentoGet<MagentoOrderDetail>(
      `/orders/${encodeURIComponent(String(orderId))}`,
      false,
    );
  } catch {
    return null;
  }
}

/**
 * Verifies ownership: fetches the order and returns it only if its
 * customer_email matches the signed-in customer's email.
 */
export async function getOrderForCustomer(
  orderId: string | number,
  customerToken: string,
): Promise<MagentoOrderDetail | null> {
  const email = await getCustomerEmail(customerToken);
  if (!email) return null;
  const order = await getOrder(orderId);
  if (!order) return null;
  if (order.customer_email !== email) return null;
  return order;
}

function orderIdFilter(orderId: string | number): string {
  const params = new URLSearchParams({
    "searchCriteria[filter_groups][0][filters][0][field]": "order_id",
    "searchCriteria[filter_groups][0][filters][0][value]": String(orderId),
    "searchCriteria[sortOrders][0][field]": "created_at",
    "searchCriteria[sortOrders][0][direction]": "DESC",
    "searchCriteria[pageSize]": "50",
  });
  return params.toString();
}

export async function listOrderInvoices(
  orderId: string | number,
): Promise<MagentoInvoice[]> {
  try {
    const data = await magentoGet<MagentoInvoiceSearchResult>(
      `/invoices?${orderIdFilter(orderId)}`,
      false,
    );
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function listOrderShipments(
  orderId: string | number,
): Promise<MagentoShipment[]> {
  try {
    const data = await magentoGet<MagentoShipmentSearchResult>(
      `/shipments?${orderIdFilter(orderId)}`,
      false,
    );
    return data.items ?? [];
  } catch {
    return [];
  }
}

export async function listOrderCreditmemos(
  orderId: string | number,
): Promise<MagentoCreditmemo[]> {
  try {
    const data = await magentoGet<MagentoCreditmemoSearchResult>(
      `/creditmemos?${orderIdFilter(orderId)}`,
      false,
    );
    return data.items ?? [];
  } catch {
    return [];
  }
}

/* ------------------------- Per-document fetchers -------------------------
 *
 * Used by the PDF route handlers. Each *ForCustomer variant fetches the
 * document by id, then verifies it belongs to an order owned by the
 * signed-in customer (ownership is anchored on the parent order's
 * customer_email, the same rule used by `getOrderForCustomer`).
 */

export async function getInvoice(
  invoiceId: string | number,
): Promise<MagentoInvoice | null> {
  try {
    return await magentoGet<MagentoInvoice>(
      `/invoices/${encodeURIComponent(String(invoiceId))}`,
      false,
    );
  } catch {
    return null;
  }
}

export async function getShipment(
  shipmentId: string | number,
): Promise<MagentoShipment | null> {
  try {
    return await magentoGet<MagentoShipment>(
      `/shipments/${encodeURIComponent(String(shipmentId))}`,
      false,
    );
  } catch {
    return null;
  }
}

export async function getCreditmemo(
  creditmemoId: string | number,
): Promise<MagentoCreditmemo | null> {
  try {
    return await magentoGet<MagentoCreditmemo>(
      `/creditmemos/${encodeURIComponent(String(creditmemoId))}`,
      false,
    );
  } catch {
    return null;
  }
}

export interface DocumentWithOrder<T> {
  document: T;
  order: MagentoOrderDetail;
}

async function getDocumentForCustomer<T extends { order_id: number }>(
  document: T | null,
  orderId: string | number,
  customerToken: string,
): Promise<DocumentWithOrder<T> | null> {
  if (!document) return null;
  const order = await getOrderForCustomer(orderId, customerToken);
  if (!order) return null;
  if (document.order_id !== order.entity_id) return null;
  return { document, order };
}

export async function getInvoiceForCustomer(
  orderId: string | number,
  invoiceId: string | number,
  customerToken: string,
): Promise<DocumentWithOrder<MagentoInvoice> | null> {
  const inv = await getInvoice(invoiceId);
  return getDocumentForCustomer(inv, orderId, customerToken);
}

export async function getShipmentForCustomer(
  orderId: string | number,
  shipmentId: string | number,
  customerToken: string,
): Promise<DocumentWithOrder<MagentoShipment> | null> {
  const sh = await getShipment(shipmentId);
  return getDocumentForCustomer(sh, orderId, customerToken);
}

export async function getCreditmemoForCustomer(
  orderId: string | number,
  creditmemoId: string | number,
  customerToken: string,
): Promise<DocumentWithOrder<MagentoCreditmemo> | null> {
  const cm = await getCreditmemo(creditmemoId);
  return getDocumentForCustomer(cm, orderId, customerToken);
}

export interface OrderDocuments {
  invoices: MagentoInvoice[];
  shipments: MagentoShipment[];
  creditmemos: MagentoCreditmemo[];
}

/**
 * Fetches invoices, shipments, and credit memos in parallel using
 * `Promise.allSettled` so a 404/500 on any one type does not break the page.
 */
export async function getOrderDocuments(
  orderId: string | number,
): Promise<OrderDocuments> {
  const [invoicesRes, shipmentsRes, creditmemosRes] = await Promise.allSettled([
    listOrderInvoices(orderId),
    listOrderShipments(orderId),
    listOrderCreditmemos(orderId),
  ]);
  return {
    invoices: invoicesRes.status === "fulfilled" ? invoicesRes.value : [],
    shipments: shipmentsRes.status === "fulfilled" ? shipmentsRes.value : [],
    creditmemos:
      creditmemosRes.status === "fulfilled" ? creditmemosRes.value : [],
  };
}
