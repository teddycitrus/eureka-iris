"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TestFireButton({
  variant = "primary",
  redirect,
}: {
  variant?: "primary" | "ghost";
  redirect?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  async function fire() {
    setState("idle");
    setMsg(null);
    const res = await fetch("/api/test/fire-incident", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const data = (await res.json().catch(() => ({}))) as {
      alertId?: string;
      supplier?: string;
      severity?: string;
      headline?: string;
      error?: string;
    };
    if (!res.ok) {
      setState("err");
      setMsg(data.error ?? `${res.status}`);
      setTimeout(() => setState("idle"), 4500);
      return;
    }
    setState("ok");
    setMsg(`${data.severity} · ${data.supplier}`);
    startTransition(() => router.refresh());
    if (redirect && data.alertId) {
      setTimeout(() => router.push(`/alerts#${data.alertId}`), 600);
    }
    setTimeout(() => setState("idle"), 3000);
  }

  const base =
    "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition";
  const styles = {
    primary:
      "bg-accent-rose/90 text-white shadow-[0_0_0_1px_rgba(255,108,168,0.4),0_8px_30px_-8px_rgba(255,108,168,0.6)] hover:bg-accent-rose",
    ghost:
      "border border-line bg-bg-raised/60 text-ink-muted hover:border-accent-rose/40 hover:text-ink",
  } as const;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={fire}
        disabled={pending || state !== "idle"}
        className={cn(
          base,
          state === "ok" && "bg-risk-low/20 text-risk-low ring-1 ring-risk-low/40",
          state === "err" && "bg-risk-critical/20 text-risk-critical ring-1 ring-risk-critical/40",
          state === "idle" && styles[variant],
        )}
        title="Mint a synthetic high-severity alert against a callable supplier"
      >
        {state === "ok" ? (
          <Check className="h-4 w-4" />
        ) : state === "err" ? (
          <X className="h-4 w-4" />
        ) : pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {state === "ok"
          ? "alert fired"
          : state === "err"
            ? "fire failed"
            : pending
              ? "firing…"
              : "Simulate incident"}
      </button>
      {msg && state !== "idle" && (
        <span
          className={cn(
            "max-w-xs truncate text-xs",
            state === "ok" ? "text-ink-muted" : "text-risk-critical",
          )}
        >
          {msg}
        </span>
      )}
    </div>
  );
}
