import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  delta,
  deltaDir,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: string;
  deltaDir?: "up" | "down" | "neutral";
  accent?: React.ReactNode;
}) {
  const deltaColor =
    deltaDir === "up"
      ? "var(--ok)"
      : deltaDir === "down"
        ? "var(--critical)"
        : "var(--ink-4)";

  return (
    <div
      className="flex flex-col gap-2 rounded-lg p-4"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        minHeight: 100,
      }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium" style={{ color: "var(--ink-3)" }}>
          {label}
        </span>
        {accent}
      </div>
      <div className="flex items-baseline gap-1">
        <span
          className="font-mono text-[28px] font-semibold leading-none tracking-tight"
          style={{ color: "var(--ink)" }}
        >
          {value}
        </span>
      </div>
      <div className="mt-auto flex items-center justify-between">
        {(hint || delta) && (
          <span
            className="font-mono text-[11px]"
            style={{ color: deltaDir ? deltaColor : "var(--ink-4)" }}
          >
            {deltaDir === "up" && "↑ "}
            {deltaDir === "down" && "↓ "}
            {delta ?? hint}
          </span>
        )}
      </div>
    </div>
  );
}
