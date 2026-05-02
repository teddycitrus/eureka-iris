"use client";

import { MapPin } from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";
import { shortRelTime } from "@/lib/utils";
import type { GlobeIncident } from "./types";

export function DisruptionRail({
  incidents,
  selectedId,
  onSelect,
}: {
  incidents: GlobeIncident[];
  selectedId: string | null;
  onSelect: (id: string, lat: number | null, lng: number | null) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-baseline justify-between border-b border-line/80 px-5 py-3">
        <div className="font-display text-base italic text-ink-warm">
          {incidents.length === 0 ? "all quiet" : "live disruptions"}
        </div>
        <span className="font-mono text-[16px] font-medium tabular-nums text-amber">
          {String(incidents.length).padStart(2, "0")}
        </span>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {incidents.length === 0 && (
          <div className="rounded-lg border border-line/70 bg-bg-card/50 p-4">
            <span className="label">status</span>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              No live signals exceeding the watch threshold. The map is steady.
            </p>
          </div>
        )}
        {incidents.map((i, idx) => (
          <button
            key={i.id}
            onClick={() => onSelect(i.id, i.lat, i.lng)}
            className={`group block w-full rounded-lg border bg-bg-card/50 p-3 text-left transition hover:bg-bg-card ${
              selectedId === i.id
                ? "border-amber/70 bg-bg-card"
                : "border-line/70 hover:border-amber/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <RiskBadge severity={i.severity} />
              <span className="font-mono text-[10px] uppercase tracking-chart text-ink-dim">
                {String(idx + 1).padStart(2, "0")} · {shortRelTime(i.createdAt)}
              </span>
            </div>
            <h3 className="mt-2.5 line-clamp-2 font-display text-[15px] leading-snug text-ink group-hover:text-amber">
              {i.headline}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
              {i.recommendation}
            </p>
            {i.lat != null && i.lng != null && (
              <div className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-chart text-ink-dim group-hover:text-amber/80">
                <MapPin className="h-2.5 w-2.5" />
                {i.lat.toFixed(2)}° {i.lat >= 0 ? "n" : "s"} ·{" "}
                {Math.abs(i.lng).toFixed(2)}° {i.lng >= 0 ? "e" : "w"}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
