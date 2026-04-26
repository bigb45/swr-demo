export interface MagentoMediaEntry {
  media_type: string;
  label: string | null;
  position: number;
  disabled: boolean;
  types: string[];
  file: string;
}

export interface MagentoCustomAttribute {
  attribute_code: string;
  value: string | string[];
}

export interface MagentoTierPrice {
  customer_group_id: number;
  qty: number;
  value: number;
  extension_attributes?: {
    percentage_value?: number;
    website_id?: number;
  };
}

/**
 * Core Magento stock item (pre-MSI). Returned on product list/detail payloads
 * under `extension_attributes.stock_item`. `qty` is the physical stock level
 * on the default source; `is_in_stock` is the admin-controlled availability
 * flag; `manage_stock` controls whether qty is tracked at all. When
 * `manage_stock` is false we treat the product as always available.
 */
export interface MagentoStockItem {
  item_id?: number;
  product_id?: number;
  stock_id?: number;
  qty?: number;
  is_in_stock?: boolean;
  manage_stock?: boolean;
  min_qty?: number;
  use_config_manage_stock?: boolean;
  backorders?: number;
  min_sale_qty?: number;
  max_sale_qty?: number;
}

/**
 * Magento product extension attributes surface inventory alongside any other
 * server-side extensions. We only type the fields the frontend reads.
 * `website_ids` is commonly present and kept here to avoid breaking callers.
 * `stock_item` is the pre-MSI shape; if MSI is enabled, Magento also returns
 * a numeric `salable_quantity` (typed as unknown for forward compatibility).
 */
export interface MagentoProductExtensionAttributes {
  website_ids?: number[];
  stock_item?: MagentoStockItem;
  salable_quantity?: unknown;
}

export interface MagentoProduct {
  id: number;
  sku: string;
  name: string;
  price: number;
  status: number;
  visibility: number;
  type_id: string;
  weight?: number;
  tier_prices?: MagentoTierPrice[];
  media_gallery_entries?: MagentoMediaEntry[];
  custom_attributes?: MagentoCustomAttribute[];
  extension_attributes?: MagentoProductExtensionAttributes;
}

export interface MagentoProductList {
  items: MagentoProduct[];
  search_criteria: {
    filter_groups: unknown[];
    page_size: number;
    current_page: number;
  };
  total_count: number;
}

export interface MagentoCategory {
  id: number;
  parent_id: number;
  name: string;
  is_active: boolean;
  position: number;
  level: number;
  children_data: MagentoCategory[];
  children?: string;
}

export interface MagentoCategoryTree extends MagentoCategory {
  children_data: MagentoCategory[];
}

export interface MagentoCartTotals {
  subtotal: number;
  subtotal_with_discount: number;
  tax_amount: number;
  grand_total: number;
  discount_amount: number;
  shipping_amount: number;
}

/* ------------------------------ Orders ------------------------------ */

export interface MagentoOrderAddress {
  entity_id?: number;
  address_type?: "billing" | "shipping";
  firstname?: string;
  lastname?: string;
  company?: string;
  street?: string[];
  city?: string;
  postcode?: string;
  region?: string;
  region_code?: string;
  country_id?: string;
  telephone?: string;
  email?: string;
}

export interface MagentoOrderItem {
  item_id: number;
  name: string;
  sku: string;
  qty_ordered: number;
  price: number;
  row_total: number;
  /** Magento product type: "simple", "configurable", "bundle", etc. */
  product_type?: string;
  /** Set on children of configurable / bundle parents; skipped when reordering. */
  parent_item_id?: number;
}

export interface MagentoOrderPayment {
  method?: string;
  additional_information?: string[];
  po_number?: string;
}

export interface MagentoShippingAssignment {
  shipping?: {
    address?: MagentoOrderAddress;
    method?: string;
  };
}

/**
 * ERP integration hook — Magento exposes these as extension attributes on
 * orders. The backend populates one or both: `erp_status_code` is a stable
 * identifier that maps to translations under `orders.erpStatus.<code>`;
 * `erp_status_label` is a raw, already-translated string from the ERP that
 * takes precedence over code-based translation when only it is supplied.
 */
export interface MagentoErpStatusAttributes {
  erp_status_code?: string;
  erp_status_label?: string;
}

export type MagentoOrderSummaryExtensionAttributes = MagentoErpStatusAttributes;

export interface MagentoOrderDetailExtensionAttributes
  extends MagentoErpStatusAttributes {
  shipping_assignments?: MagentoShippingAssignment[];
}

export interface MagentoOrderSummary {
  entity_id: number;
  increment_id: string;
  created_at: string;
  status: string;
  state?: string;
  grand_total: number;
  order_currency_code: string;
  extension_attributes?: MagentoOrderSummaryExtensionAttributes;
}

/**
 * Magento order comment / status change. The order detail endpoint returns a
 * mixed audit trail of internal notes and customer-facing messages — only
 * entries with `is_visible_on_front === 1` and a non-empty `comment` should
 * be rendered to the customer.
 */
export interface MagentoOrderStatusHistory {
  entity_id?: number;
  parent_id?: number;
  comment?: string | null;
  created_at?: string;
  is_customer_notified?: 0 | 1 | null;
  is_visible_on_front?: 0 | 1;
  status?: string;
}

export interface MagentoOrderDetail extends MagentoOrderSummary {
  subtotal: number;
  tax_amount: number;
  shipping_amount?: number;
  discount_amount?: number;
  customer_email: string;
  customer_firstname?: string;
  customer_lastname?: string;
  items: MagentoOrderItem[];
  billing_address?: MagentoOrderAddress;
  payment?: MagentoOrderPayment;
  status_histories?: MagentoOrderStatusHistory[];
  extension_attributes?: MagentoOrderDetailExtensionAttributes;
}

export interface MagentoOrderSearchResult {
  items: MagentoOrderSummary[];
  total_count: number;
}

/* ------------------------------ Documents ------------------------------ */

/**
 * Line item shape shared by invoices, shipments, and credit memos. Magento
 * returns a superset of these fields; we only type what the frontend reads.
 * Shipment items use `qty` (quantity shipped); invoice/creditmemo items use
 * `qty` as well (qty invoiced / refunded).
 */
export interface MagentoDocumentItem {
  entity_id?: number;
  name?: string;
  sku: string;
  qty: number;
  price?: number;
  row_total?: number;
}

export interface MagentoInvoice {
  entity_id: number;
  increment_id: string;
  order_id: number;
  created_at: string;
  grand_total: number;
  subtotal?: number;
  tax_amount?: number;
  shipping_amount?: number;
  discount_amount?: number;
  order_currency_code?: string;
  state?: number;
  items?: MagentoDocumentItem[];
  billing_address?: MagentoOrderAddress;
  extension_attributes?: {
    shipping_assignments?: MagentoShippingAssignment[];
  };
}

export interface MagentoInvoiceSearchResult {
  items: MagentoInvoice[];
  total_count: number;
}

export interface MagentoShipmentTrack {
  entity_id?: number;
  track_number: string;
  title?: string;
  carrier_code?: string;
}

export interface MagentoShipment {
  entity_id: number;
  increment_id: string;
  order_id: number;
  created_at: string;
  tracks?: MagentoShipmentTrack[];
  items?: MagentoDocumentItem[];
  billing_address?: MagentoOrderAddress;
  extension_attributes?: {
    shipping_assignments?: MagentoShippingAssignment[];
  };
}

export interface MagentoShipmentSearchResult {
  items: MagentoShipment[];
  total_count: number;
}

export interface MagentoCreditmemo {
  entity_id: number;
  increment_id: string;
  order_id: number;
  created_at: string;
  grand_total: number;
  subtotal?: number;
  tax_amount?: number;
  shipping_amount?: number;
  adjustment?: number;
  adjustment_positive?: number;
  adjustment_negative?: number;
  order_currency_code?: string;
  items?: MagentoDocumentItem[];
  billing_address?: MagentoOrderAddress;
  extension_attributes?: {
    shipping_assignments?: MagentoShippingAssignment[];
  };
}

export interface MagentoCreditmemoSearchResult {
  items: MagentoCreditmemo[];
  total_count: number;
}

/* ------------------------------ Customer ------------------------------ */

export interface MagentoCustomerAddressRegion {
  region?: string;
  region_code?: string;
  region_id?: number;
}

export interface MagentoCustomerAddress {
  id?: number;
  customer_id?: number;
  firstname: string;
  lastname: string;
  company?: string;
  street: string[];
  city: string;
  postcode: string;
  country_id: string;
  region?: MagentoCustomerAddressRegion;
  region_id?: number;
  telephone: string;
  default_billing?: boolean;
  default_shipping?: boolean;
}

export interface MagentoCustomerMe {
  id: number;
  email: string;
  firstname?: string;
  lastname?: string;
  store_id?: number;
  website_id?: number;
  group_id?: number;
  addresses?: MagentoCustomerAddress[];
}

/* ------------------------------ Checkout ------------------------------ */

/**
 * Address payload accepted by Magento's `/shipping-information`,
 * `/billing-address`, and `/estimate-shipping-methods` endpoints. Mirrors
 * `MagentoCustomerAddress` but flattens the region into the shape Magento
 * wants on the cart side and includes the customer email used for the order.
 */
export interface MagentoCheckoutAddress {
  firstname: string;
  lastname: string;
  company?: string;
  street: string[];
  city: string;
  postcode: string;
  country_id: string;
  region?: string;
  region_code?: string;
  region_id?: number;
  telephone: string;
  email?: string;
  customer_address_id?: number;
  save_in_address_book?: 0 | 1;
}

export interface MagentoShippingMethod {
  carrier_code: string;
  method_code: string;
  carrier_title?: string;
  method_title?: string;
  amount: number;
  base_amount?: number;
  available: boolean;
  error_message?: string;
  price_excl_tax?: number;
  price_incl_tax?: number;
}

export interface MagentoPaymentMethod {
  code: string;
  title?: string;
}

export interface MagentoShippingInformationResult {
  payment_methods: MagentoPaymentMethod[];
  totals: MagentoCartTotals & {
    base_grand_total?: number;
    items?: Array<{
      item_id: number;
      qty: number;
      price?: number;
      row_total?: number;
      name?: string;
    }>;
  };
}
