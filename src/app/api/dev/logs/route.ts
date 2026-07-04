import { subscribeToServerLogs } from "@/lib/devLogBridge";

// Never cache/statically optimize an SSE stream.
export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  let unsubscribe: () => void = () => {};
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (message: string) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(message)}\n\n`),
        );
      };

      send("[dev-log-bridge] connected");
      unsubscribe = subscribeToServerLogs(send);
      // Keep the connection alive through idle proxies.
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 25000);
    },
    cancel() {
      unsubscribe();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
