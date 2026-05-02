"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, Check, X } from "lucide-react";

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
      alertId?: string; supplier?: string; severity?: string;
      headline?: string; error?: string;
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

  const isIdle = state === "idle";

  const styles = {
    primary: {
      background: isIdle
        ? "var(--warn-bg)"
        : state === "ok"
          ? "var(--ok-bg)"
          : "var(--critical-bg)",
      color: isIdle
        ? "oklch(0.45 0.14 65)"
        : state === "ok"
          ? "var(--ok)"
          : "var(--critical)",
      border: isIdle
        ? "var(--warn-border)"
        : state === "ok"
          ? "oklch(0.85 0.08 155)"
          : "var(--critical-border)",
    },
    ghost: {
      background: isIdle
        ? "var(--surface)"
        : state === "ok"
          ? "var(--ok-bg)"
          : "var(--critical-bg)",
      color: isIdle
        ? "var(--ink-2)"
        : state === "ok"
          ? "var(--ok)"
          : "var(--critical)",
      border: isIdle
        ? "var(--border-strong)"
        : state === "ok"
          ? "oklch(0.85 0.08 155)"
          : "var(--critical-border)",
    },
  };

  const s = styles[variant];

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={fire}
        disabled={pending || state !== "idle"}
        className="inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{
          background: s.background,
          color: s.color,
          border: `1px solid ${s.border}`,
        }}
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
          ? "Alert fired"
          : state === "err"
            ? "Fire failed"
            : pending
              ? "Firing…"
              : "Simulate incident"}
      </button>
      {msg && state !== "idle" && (
        <span
          className="max-w-xs truncate text-xs"
          style={{ color: state === "ok" ? "var(--ink-3)" : "var(--critical)" }}
        >
          {msg}
        </span>
      )}
    </div>
  );
}
