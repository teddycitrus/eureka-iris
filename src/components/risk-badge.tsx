import { cn } from "@/lib/utils";

const variants: Record<string, { bg: string; fg: string; border: string }> = {
  low: {
    bg:     "var(--ok-bg)",
    fg:     "var(--ok)",
    border: "oklch(0.85 0.08 155)",
  },
  medium: {
    bg:     "var(--warn-bg)",
    fg:     "oklch(0.45 0.14 65)",
    border: "var(--warn-border)",
  },
  high: {
    bg:     "var(--critical-bg)",
    fg:     "var(--critical)",
    border: "var(--critical-border)",
  },
  critical: {
    bg:     "var(--critical-bg)",
    fg:     "var(--critical)",
    border: "var(--critical-border)",
  },
  info: {
    bg:     "var(--surface-2)",
    fg:     "var(--ink-3)",
    border: "var(--border)",
  },
};

export function RiskBadge({
  severity,
  className,
}: {
  severity: string;
  className?: string;
}) {
  const s = severity.toLowerCase();
  const v = variants[s] ?? variants.info;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[5px] font-mono text-[10.5px] font-medium uppercase tracking-[0.02em] whitespace-nowrap",
        className,
      )}
      style={{
        background: v.bg,
        color: v.fg,
        border: `1px solid ${v.border}`,
        borderRadius: 4,
        padding: "1px 6px",
        lineHeight: 1.4,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: v.fg,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {severity}
    </span>
  );
}
