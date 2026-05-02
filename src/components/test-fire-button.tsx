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
      setTimeout(() => router.push(`/?alert=${data.alertId}#${data.alertId}`), 600);
    }
    setTimeout(() => setState("idle"), 3000);
  }

  const base =
    "group inline-flex items-center gap-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-chart transition-colors";
  const styles = {
    primary:
      "border border-amber/60 bg-amber/15 text-amber hover:bg-amber/25 hover:border-amber",
    ghost:
      "border border-line bg-bg-raised/50 text-ink-muted hover:border-amber/50 hover:text-amber",
  } as const;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={fire}
        disabled={pending || state !== "idle"}
        className={cn(
          base,
          state === "ok" && "border-risk-low/50 bg-risk-low/15 text-risk-low",
          state === "err" && "border-risk-critical/50 bg-risk-critical/15 text-risk-critical",
          state === "idle" && styles[variant],
        )}
        title="Fire a synthetic high-severity alert"
      >
        {state === "ok" ? (
          <Check className="h-3 w-3" />
        ) : state === "err" ? (
          <X className="h-3 w-3" />
        ) : pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Zap className="h-3 w-3" />
        )}
        {state === "ok"
          ? "alert fired"
          : state === "err"
            ? "fire failed"
            : pending
              ? "firing"
              : "simulate"}
      </button>
      {msg && state !== "idle" && (
        <span
          className={cn(
            "max-w-xs truncate font-mono text-[10px] uppercase tracking-chart",
            state === "ok" ? "text-ink-muted" : "text-risk-critical",
          )}
        >
          {msg}
        </span>
      )}
    </div>
  );
}
