"use client";

import {
  Activity,
  Siren,
  GitBranch,
  Bell,
  Gavel,
  ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { shortRelTime } from "@/lib/utils";
import type { ActivityEntry } from "./lanes-view";

// Only meaningful actions land here — outbound dial events are excluded.
const KIND_META: Record<
  string,
  { icon: LucideIcon; label: (p: Record<string, unknown>) => string; tone: string }
> = {
  "alert.created": {
    icon: Bell,
    label: (p) => `risk surfaced · ${String(p.severity ?? "")}`,
    tone: "text-amber",
  },
  "alert.updated": {
    icon: Siren,
    label: (p) => statusLabel(p),
    tone: "text-ink",
  },
  "call.outcome": {
    icon: Gavel,
    label: (p) => `decision recorded · ${String(p.outcome ?? "")}`,
    tone: "text-accent-cyan",
  },
  "shipment.created": {
    icon: GitBranch,
    label: () => "lane added",
    tone: "text-ink-muted",
  },
  "shipment.updated": {
    icon: GitBranch,
    label: (p) =>
      String(p.status) === "rerouted"
        ? "lane rerouted"
        : `lane → ${String(p.status ?? "")}`,
    tone: "text-amber",
  },
};

const HIDDEN_KINDS = new Set(["call.started"]);

function statusLabel(p: Record<string, unknown>): string {
  const status = String(p.status ?? "");
  if (status === "calling") return "voice briefing dispatched";
  if (status === "escalated") return "alert escalated";
  if (status === "resolved") return "alert resolved";
  if (status === "dismissed") return "alert dismissed";
  return `alert · ${status}`;
}

export function ActivityRail({
  entries,
  embedded = false,
}: {
  entries: ActivityEntry[];
  embedded?: boolean;
}) {
  const visible = entries.filter((e) => !HIDDEN_KINDS.has(e.kind));

  return (
    <div className="flex h-full flex-col">
      {!embedded && (
        <header className="flex items-baseline justify-between border-b border-line/80 px-5 py-4">
          <div>
            <span className="label">activity</span>
            <div className="mt-1 font-display text-base italic text-ink-warm">
              the log
            </div>
          </div>
          <span className="font-mono text-[18px] font-medium tabular-nums text-amber">
            {String(visible.length).padStart(2, "0")}
          </span>
        </header>
      )}

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {visible.length === 0 ? (
          <div className="mx-1 rounded-lg border border-line/70 bg-bg-card/50 p-4">
            <span className="label">status</span>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              The log is open. Actions taken by the system or its operators
              will appear here.
            </p>
          </div>
        ) : (
          <ol className="relative">
            {/* vertical rule running through the log */}
            <span
              aria-hidden
              className="absolute left-[18px] top-2 bottom-2 w-px bg-line/70"
            />
            {visible.map((e, idx) => {
              const meta =
                KIND_META[e.kind] ?? {
                  icon: Activity,
                  label: () => e.kind,
                  tone: "text-ink-muted",
                };
              const Icon = meta.icon;
              return (
                <li
                  key={`${e.ts}-${idx}`}
                  className="relative flex items-start gap-3 px-2 py-2 hover:bg-bg-hover/30"
                >
                  <span className="relative z-10 mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border border-line bg-bg-card">
                    <Icon className={`h-2.5 w-2.5 ${meta.tone}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[12px] leading-tight ${meta.tone}`}>
                      {meta.label(e.payload)}
                    </div>
                    {tail(e.payload) && (
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-chart text-ink-dim">
                        {tail(e.payload)}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-chart text-ink-dim">
                    {shortRelTime(new Date(e.ts))}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

function tail(p: Record<string, unknown>): string | null {
  if (typeof p.alertId === "string") return `ref ${String(p.alertId).slice(0, 6)}`;
  if (typeof p.shipmentId === "string") return `ref ${String(p.shipmentId).slice(0, 6)}`;
  if (typeof p.callId === "string") return `ref ${String(p.callId).slice(0, 6)}`;
  return null;
}

// Keep ShieldAlert import to avoid breaking cross-file refs; not used directly here.
void ShieldAlert;
