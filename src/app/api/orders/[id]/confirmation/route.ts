/**
 * GET /api/orders/[id]/confirmation?locale=de
 *
 * Streams a Next.js-generated PDF order confirmation for the currently
 * signed-in customer. Ownership is verified by matching the order's
 * customer_email against /customers/me for the supplied customer token.
 */

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { renderToStream, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { Readable } from "node:stream";
import { getOrderForCustomer } from "@/lib/orders";
import { resolveOrderStatus } from "@/lib/orderStatus";
import OrderConfirmationPdf from "@/components/orders/OrderConfirmationPdf";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const order = await getOrderForCustomer(id, token);
  if (!order) {
    return new Response("Not found", { status: 404 });
  }

  const localeParam = req.nextUrl.searchParams.get("locale");
  const locale =
    localeParam && routing.locales.includes(localeParam as never)
      ? localeParam
      : routing.defaultLocale;

  const t = await getTranslations({ locale, namespace: "orders" });
  const resolved = resolveOrderStatus(order, t);

  const labels = {
    title: t("orderConfirmationPdfTitle"),
    orderNumber: t("colOrder"),
    date: t("colDate"),
    status: t("colStatus"),
    billingAddress: t("billingAddress"),
    shippingAddress: t("shippingAddress"),
    sameAsBilling: t("sameAsBilling"),
    paymentMethod: t("paymentMethod"),
    product: t("colProduct"),
    sku: t("colSku"),
    qty: t("colQty"),
    unitPrice: t("colUnitPrice"),
    rowTotal: t("colRowTotal"),
    subtotal: t("subtotal"),
    tax: t("tax"),
    grandTotal: t("grandTotal"),
    companyName: "SWR Handelsgesellschaft mbH",
    companyTagline: "Lörrach — Qualität verbindet",
    footer: "SWR Handelsgesellschaft mbH · info@swr-loerrach.de",
    statusLabel: resolved.label,
  };

  // OrderConfirmationPdf's JSX root is a <Document>; cast so @react-pdf's
  // `renderToStream` accepts the element (it expects ReactElement<DocumentProps>).
  const element = createElement(OrderConfirmationPdf, {
    order,
    labels,
    locale,
    friendlyStatus: resolved.friendly,
  }) as unknown as ReactElement<DocumentProps>;

  const pdfStream = (await renderToStream(element)) as Readable;

  // @react-pdf's renderToStream returns a Node.js Readable. Pipe to a Web
  // ReadableStream so Next.js can return it in the Response body.
  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      pdfStream.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      pdfStream.on("end", () => controller.close());
      pdfStream.on("error", (err: Error) => controller.error(err));
    },
    cancel() {
      pdfStream.destroy();
    },
  });

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="SWR-order-${order.increment_id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
