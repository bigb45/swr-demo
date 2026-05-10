/**
 * Proxies the signed-in customer to Magento
 * `GET /rest/V1/swr-quotations/mine/:id/pdf` (see `src/lib/quotations.ts`).
 * Streams `application/pdf` or redirects when the backend returns JSON `{ url }`.
 */

import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

const MAGENTO = process.env.MAGENTO_URL ?? "http://localhost:8000";
const TOKEN_COOKIE = "swr_customer_token";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const upstream = await fetch(
    `${MAGENTO}/rest/V1/swr-quotations/mine/${encodeURIComponent(id)}/pdf`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      redirect: "manual",
    },
  );

  if (upstream.status === 302 || upstream.status === 303) {
    const loc = upstream.headers.get("Location");
    if (loc) {
      return NextResponse.redirect(loc, upstream.status);
    }
  }

  if (!upstream.ok) {
    return new NextResponse(null, {
      status: upstream.status === 404 ? 404 : 502,
    });
  }

  const contentType = upstream.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const j = (await upstream.json()) as { url?: string };
    if (j && typeof j.url === "string" && j.url.length > 0) {
      return NextResponse.redirect(j.url, 302);
    }
    return NextResponse.json({ error: "Invalid PDF response" }, { status: 502 });
  }

  const disposition =
    upstream.headers.get("content-disposition") ??
    `attachment; filename="quotation-${id}.pdf"`;

  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType || "application/pdf",
      "Content-Disposition": disposition,
    },
  });
}
