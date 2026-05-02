import { cn } from "@/lib/utils";

const styles: Record<string, { bar: string; text: string }> = {
  low: { bar: "bg-risk-low", text: "text-risk-low" },
  medium: { bar: "bg-risk-medium", text: "text-risk-medium" },
  high: { bar: "bg-risk-high", text: "text-risk-high" },
  critical: { bar: "bg-risk-critical", text: "text-risk-critical" },
};

export function RiskBadge({
  severity,
  className,
}: {
  severity: string;
  className?: string;
}) {
  const s = severity.toLowerCase();
  const tone = styles[s] ?? styles.low;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-chart",
        tone.text,
        className,
      )}
    >
      <span className={cn("h-2.5 w-0.5", tone.bar)} aria-hidden />
      {severity}
    </span>
  );
}
