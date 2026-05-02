"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function CallButton({
  alertId,
  contactName,
}: {
  alertId: string;
  contactName: string;
}) {
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
        "inline-flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-chart transition-colors",
        state === "idle" &&
          "border border-amber/60 bg-amber/15 text-amber hover:bg-amber/25 hover:border-amber",
        state === "calling" && "border border-amber/30 bg-amber/10 text-amber",
        state === "ok" && "border border-risk-low/50 bg-risk-low/15 text-risk-low",
        state === "err" && "border border-risk-critical/50 bg-risk-critical/15 text-risk-critical",
      )}
      title={error ?? `Brief ${contactName} via voice`}
    >
      {state === "calling" && <Loader2 className="h-3 w-3 animate-spin" />}
      {state === "ok" && <Check className="h-3 w-3" />}
      {state === "err" && <X className="h-3 w-3" />}
      {state === "idle" && <Phone className="h-3 w-3" />}
      {state === "calling"
        ? "dialing"
        : state === "ok"
          ? "placed"
          : state === "err"
            ? error ?? "failed"
            : `brief ${contactName.split(" ")[0].toLowerCase()}`}
    </button>
  );
}
