import { EventEmitter } from "events";

/**
 * Dev-only bridge that streams server-side log lines (e.g. Magento REST
 * calls from `magento.ts`) to any connected browser tab via SSE, so they
 * show up in the browser console instead of only the terminal / Vercel
 * Runtime Logs. Server console.log output never reaches the browser on its
 * own — this is what makes that possible, and it's a no-op in production.
 */
const emitter = new EventEmitter();
emitter.setMaxListeners(50);

export function broadcastServerLog(message: string) {
  if (process.env.NODE_ENV === "production") return;
  emitter.emit("log", message);
}

export function subscribeToServerLogs(
  listener: (message: string) => void,
): () => void {
  emitter.on("log", listener);
  return () => emitter.off("log", listener);
}
