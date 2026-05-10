/**
 * POST /api/copilot/chat
 *
 * Non-streaming proxy to Teia `POST /api/v1/chat/` — same body rules as
 * `/api/copilot/chat/stream`.
 */

import { NextRequest } from "next/server";
import { buildTeiaChatPayload, teiaAiBaseUrl } from "@/lib/teia-chat-proxy";

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => null);
  const built = await buildTeiaChatPayload(raw);
  if (!built.ok) {
    return Response.json({ error: built.error }, { status: built.status });
  }

  const base = teiaAiBaseUrl();
  const res = await fetch(`${base}/api/v1/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(built.payload),
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    return Response.json(
      { error: text || "upstream error" },
      { status: 502 },
    );
  }

  try {
    return Response.json(JSON.parse(text), {
      status: res.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return new Response(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "text/plain",
        "Cache-Control": "no-store",
      },
    });
  }
}
