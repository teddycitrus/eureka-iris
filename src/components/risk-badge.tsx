import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  low: "bg-risk-low/15 text-risk-low ring-risk-low/30",
  medium: "bg-risk-medium/15 text-risk-medium ring-risk-medium/30",
  high: "bg-risk-high/15 text-risk-high ring-risk-high/30",
  critical: "bg-risk-critical/20 text-risk-critical ring-risk-critical/40",
};

export function RiskBadge({
  severity,
  className,
}: {
  severity: string;
  className?: string;
}) {
  const s = severity.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider ring-1",
        styles[s] ?? styles.low,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", `bg-current`)} />
      {severity}
    </span>
  );
}
