"use client";

import { useMemo } from "react";
import type { GlobeSnapshot } from "./types";

export function LanesHud({ snapshot }: { snapshot: GlobeSnapshot | null }) {
  const stats = useMemo(() => computeStats(snapshot), [snapshot]);

  return (
    <div className="grid h-full grid-cols-4 divide-x divide-line/80">
      <Tile
        label="open risk"
        value={String(stats.openAlerts).padStart(2, "0")}
        sub={stats.criticalCount > 0 ? `${stats.criticalCount} critical` : "all watch"}
        accent={stats.openAlerts > 0 ? "amber" : "ink"}
      />
      <Tile
        label="lanes in motion"
        value={String(stats.activeShipments).padStart(2, "0")}
        sub={`${stats.reroutedCount} rerouted`}
        accent="ink"
      />
      <Tile
        label="exposure"
        value={stats.exposureLabel}
        sub="value-at-risk · in flight"
        accent="amber"
        prefix
      />
      <Tile
        label="watch list"
        value={String(stats.suppliers).padStart(2, "0")}
        sub={`${stats.regions} region${stats.regions === 1 ? "" : "s"}`}
        accent="ink"
      />
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  accent,
  prefix,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: "amber" | "ink";
  prefix?: boolean;
}) {
  const tone = accent === "amber" ? "text-amber" : "text-ink";
  return (
    <div className="relative flex flex-col gap-3 px-5 py-4">
      <span className="label">{label}</span>
      <div className="flex items-baseline gap-1">
        {prefix && (
          <span className="font-display text-[16px] italic text-ink-dim">$</span>
        )}
        <span className={`font-display text-[34px] font-medium leading-none tracking-tight ${tone}`}>
          {prefix ? value.replace(/^\$/, "") : value}
        </span>
      </div>
      {sub && (
        <span className="font-mono text-[10px] uppercase tracking-chart text-ink-muted">
          {sub}
        </span>
      )}
      {/* tick marks at top edge — instrument-panel detail */}
      <div className="pointer-events-none absolute inset-x-5 top-0 flex h-1 items-end justify-between">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className={`block w-px bg-line ${i % 4 === 0 ? "h-1" : "h-0.5"}`}
          />
        ))}
      </div>
    </div>
  );
}

function computeStats(s: GlobeSnapshot | null) {
  if (!s) {
    return {
      openAlerts: 0,
      criticalCount: 0,
      activeShipments: 0,
      reroutedCount: 0,
      exposureLabel: "0",
      suppliers: 0,
      regions: 0,
    };
  }
  const openAlerts = s.incidents.length;
  const criticalCount = s.incidents.filter((i) => i.severity === "critical").length;
  const activeShipments = s.shipments.filter((sh) => sh.status !== "arrived").length;
  const reroutedCount = s.shipments.filter((sh) => sh.status === "rerouted").length;
  const exposure = s.shipments.reduce((sum, sh) => sum + (sh.valueUSD ?? 0), 0);
  const exposureLabel =
    exposure >= 1_000_000
      ? `${(exposure / 1_000_000).toFixed(1)}M`
      : exposure >= 1_000
        ? `${(exposure / 1_000).toFixed(0)}K`
        : `${exposure.toFixed(0)}`;
  const regions = new Set(s.markers.map((m) => m.region)).size;
  return {
    openAlerts,
    criticalCount,
    activeShipments,
    reroutedCount,
    exposureLabel,
    suppliers: s.markers.length,
    regions,
  };
}
