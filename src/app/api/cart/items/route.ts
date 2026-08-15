/**
 * POST /api/cart/items  › add item to guest cart
 * Body: { cartId, sku, qty, customOptions?, configurableOptions? }
 */

import { NextRequest } from "next/server";
import { extractMagentoMessage } from "@/lib/checkout";
import type {
  MagentoConfigurableItemOption,
  MagentoCustomOptionSelection,
} from "@/types/magento";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const { cartId, sku, qty, customOptions, configurableOptions } =
    (await req.json()) as {
      cartId?: string;
      sku?: string;
      qty?: number;
      customOptions?: MagentoCustomOptionSelection[];
      configurableOptions?: MagentoConfigurableItemOption[];
    };

  if (!cartId || !sku || !qty) {
    return Response.json(
      { error: "cartId, sku and qty required" },
      { status: 400 },
    );
  }

  const cartItem: Record<string, unknown> = { sku, qty, quote_id: cartId };
  const extensionAttributes: Record<string, unknown> = {};

  if (customOptions && customOptions.length > 0) {
    extensionAttributes.custom_options = customOptions;
  }
  if (configurableOptions && configurableOptions.length > 0) {
    extensionAttributes.configurable_item_options = configurableOptions;
  }
  if (Object.keys(extensionAttributes).length > 0) {
    cartItem.product_option = { extension_attributes: extensionAttributes };
  }

  const res = await fetch(`${MAGENTO}/rest/V1/guest-carts/${cartId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartItem }),
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    return Response.json(
      { error: extractMagentoMessage(data, "Failed to add item") },
      { status: res.status },
    );
  }

  return Response.json(data);
}
