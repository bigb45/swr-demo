/**
 * GET /api/orders/[id]/invoices/[invoiceId]/pdf?locale=de
 *
 * Streams a Next.js-generated PDF invoice for the currently signed-in
 * customer. Ownership is verified by matching the parent order's
 * customer_email against /customers/me for the supplied customer token,
 * and the invoice's `order_id` against that order.
 */

import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { renderToStream, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { Readable } from "node:stream";
import { getInvoiceForCustomer } from "@/lib/orders";
import InvoicePdf from "@/components/orders/InvoicePdf";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; invoiceId: string }> },
) {
  const { id, invoiceId } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("swr_customer_token")?.value;
  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const result = await getInvoiceForCustomer(id, invoiceId, token);
  if (!result) {
    return new Response("Not found", { status: 404 });
  }

  const localeParam = req.nextUrl.searchParams.get("locale");
  const locale =
    localeParam && routing.locales.includes(localeParam as never)
      ? localeParam
      : routing.defaultLocale;

  const t = await getTranslations({ locale, namespace: "orders" });

  const labels = {
    title: t("invoicePdfTitle"),
    invoiceNumber: t("invoiceNumber"),
    orderNumber: t("colOrder"),
    date: t("colDate"),
    billingAddress: t("billingAddress"),
    shippingAddress: t("shippingAddress"),
    sameAsBilling: t("sameAsBilling"),
    product: t("colProduct"),
    sku: t("colSku"),
    qty: t("colQty"),
    unitPrice: t("colUnitPrice"),
    rowTotal: t("colRowTotal"),
    subtotal: t("subtotal"),
    tax: t("tax"),
    shipping: t("shipping"),
    grandTotal: t("grandTotal"),
    paymentMethod: t("paymentMethod"),
    companyName: "SWR Handelsgesellschaft mbH",
    companyTagline: "Lörrach — Qualität verbindet",
    footer: "SWR Handelsgesellschaft mbH · info@swr-loerrach.de",
  };

  const element = createElement(InvoicePdf, {
    invoice: result.document,
    order: result.order,
    labels,
    locale,
  }) as unknown as ReactElement<DocumentProps>;

  const pdfStream = (await renderToStream(element)) as Readable;

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
      "Content-Disposition": `attachment; filename="SWR-invoice-${result.document.increment_id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
