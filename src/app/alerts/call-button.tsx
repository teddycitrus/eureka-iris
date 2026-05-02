"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Loader2, Check, X } from "lucide-react";

export function CallButton({ alertId, contactName }: { alertId: string; contactName: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "calling" | "ok" | "err">("idle");
  const [error, setError] = useState<string | null>(null);

  async function dial() {
    setState("calling");
    setError(null);
    try {
      const r = await fetch("/api/calls/initiate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `${r.status}`);
      }
      setState("ok");
      router.refresh();
      setTimeout(() => setState("idle"), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
      setState("err");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  const bg =
    state === "ok"
      ? "var(--ok-bg)"
      : state === "err"
        ? "var(--critical-bg)"
        : "var(--ink)";
  const fg =
    state === "ok"
      ? "var(--ok)"
      : state === "err"
        ? "var(--critical)"
        : "#fff";
  const border =
    state === "ok"
      ? "var(--ok-bg)"
      : state === "err"
        ? "var(--critical-border)"
        : "transparent";

  return (
    <button
      onClick={dial}
      disabled={state === "calling"}
      className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: bg, color: fg, border: `1px solid ${border}` }}
      title={error ?? `Brief ${contactName} via voice`}
    >
      {state === "calling" && <Loader2 className="h-4 w-4 animate-spin" />}
      {state === "ok" && <Check className="h-4 w-4" />}
      {state === "err" && <X className="h-4 w-4" />}
      {state === "idle" && <Phone className="h-4 w-4" />}
      {state === "calling"
        ? "Dialing…"
        : state === "ok"
          ? "Call placed"
          : state === "err"
            ? (error ?? "Call failed")
            : `Brief ${contactName.split(" ")[0]}`}
    </button>
  );
}
