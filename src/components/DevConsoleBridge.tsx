"use client";

import { useEffect } from "react";

/**
 * Dev-only: mirrors server-side log lines (e.g. Magento REST calls from
 * `magento.ts`) into the browser console via SSE. Server console.log output
 * only reaches the terminal / Vercel Runtime Logs otherwise — this bridges
 * that gap for local debugging. Mounted only when NODE_ENV === "development"
 * (see layout.tsx) and the server endpoint 404s in production regardless.
 */
export default function DevConsoleBridge() {
  useEffect(() => {
    const source = new EventSource("/api/dev/logs");

    source.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(
          "%c[server]%c %s",
          "color:#006e21;font-weight:bold",
          "color:inherit",
          message,
        );
      } catch {
        console.log("[server]", event.data);
      }
    };

    return () => source.close();
  }, []);

  return null;
}
