/**
 * POST /api/account/service/attachments
 *
 * **Auth:** `swr_customer_token` cookie
 * **Body:** `multipart/form-data` with repeated field `files` (same as
 * `uploadServiceCaseAttachments` › Magento).
 *
 * Proxies to Magento `SWR_SERVICE_ATTACHMENT_REST_PATH` for clients that
 * cannot call Magento directly. Returns JSON `{ items: UploadedAttachmentRef[] }`.
 * **502** when Magento rejects the request or returns an empty/invalid body.
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  uploadServiceCaseAttachments,
  type UploadedAttachmentRef,
} from "@/lib/service-attachment-upload";

const TOKEN_COOKIE = "swr_customer_token";

export async function POST(req: NextRequest) {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const form = await req.formData();
  const files: File[] = [];
  for (const [, value] of form.entries()) {
    if (value instanceof File && value.size > 0) files.push(value);
  }

  if (files.length === 0) {
    return NextResponse.json({ items: [] as UploadedAttachmentRef[] });
  }

  const items = await uploadServiceCaseAttachments(token, files);
  return NextResponse.json({ items });
}
