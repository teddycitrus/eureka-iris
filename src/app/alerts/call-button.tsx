"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <button
      onClick={dial}
      disabled={state === "calling"}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition",
        state === "idle" && "bg-iris-500 text-white hover:bg-iris-400 shadow-glow",
        state === "calling" && "bg-iris-700/40 text-iris-100",
        state === "ok" && "bg-risk-low/20 text-risk-low ring-1 ring-risk-low/40",
        state === "err" && "bg-risk-critical/20 text-risk-critical ring-1 ring-risk-critical/40",
      )}
      title={error ?? `Brief ${contactName} via voice`}
    >
      {state === "calling" && <Loader2 className="h-4 w-4 animate-spin" />}
      {state === "ok" && <Check className="h-4 w-4" />}
      {state === "err" && <X className="h-4 w-4" />}
      {state === "idle" && <Phone className="h-4 w-4" />}
      {state === "calling"
        ? "dialing…"
        : state === "ok"
          ? "call placed"
          : state === "err"
            ? error ?? "call failed"
            : `Brief ${contactName.split(" ")[0]}`}
    </button>
  );
}
