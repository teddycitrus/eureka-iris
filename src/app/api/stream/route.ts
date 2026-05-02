import { bus } from "@/lib/events";

export const dynamic = "force-dynamic";

/**
 * GET /api/stream
 * Server-Sent Events stream of Iris-internal events. The /lanes globe view
 * subscribes here and re-fetches /api/globe on relevant signals.
 */
export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          // controller already closed — drop the event
        }
      };

      send("hello", { ok: true, ts: Date.now() });

      const unsubscribe = bus.subscribe((evt) => send(evt.type, evt));

      // Comment-only keepalive every 25s to defeat proxies
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          /* noop */
        }
      }, 25_000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* noop */
        }
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
