/**
 * GET /api/copilot/chat/sessions/[sessionId]
 *
 * Proxies to Teia `GET /api/v1/chat/sessions/{session_id}` to fetch UI-ready
 * conversation history for transcript restore after a page reload. Passes the
 * upstream status through (200 history / 400 invalid / 404 expired-or-missing)
 * so the client can branch on it.
 */

import { NextRequest } from "next/server";
import { teiaAiBaseUrl } from "@/lib/teia-chat-proxy";

type Ctx = { params: Promise<{ sessionId: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { sessionId } = await ctx.params;
  const id = typeof sessionId === "string" ? sessionId.trim() : "";
  if (!id) {
    return Response.json({ error: "session id is required" }, { status: 400 });
  }

  const base = teiaAiBaseUrl();
  const res = await fetch(
    `${base}/api/v1/chat/sessions/${encodeURIComponent(id)}`,
    { method: "GET", cache: "no-store" },
  );

  const text = await res.text().catch(() => "");
  try {
    return Response.json(text ? JSON.parse(text) : {}, {
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
