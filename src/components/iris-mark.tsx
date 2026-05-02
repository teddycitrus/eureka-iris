import { cn } from "@/lib/utils";

export function IrisMark({
  className,
  animate = true,
  light = false,
}: {
  className?: string;
  animate?: boolean;
  light?: boolean;
}) {
  if (light) {
    // Compact mark for the topbar dark background
    return (
      <svg viewBox="0 0 16 16" fill="none" className={cn("h-4 w-4", className)}>
        <ellipse cx="8" cy="8" rx="7" ry="4.5" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
        <circle cx="8" cy="8" r="3.5" fill="white" fillOpacity="0.9" />
        <circle cx="8" cy="8" r="1.3" fill="rgba(0,0,0,0.7)" />
        <circle cx="9" cy="7" r="0.5" fill="rgba(255,255,255,0.8)" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("h-7 w-7", animate && "iris-breath", className)}
    >
      <defs>
        <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#77bdc9" />
          <stop offset="55%"  stopColor="#3a7d8e" />
          <stop offset="100%" stopColor="#1b3e48" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="20" rx="19" ry="11" stroke="#4a9eb0" strokeOpacity="0.55" />
      <circle  cx="20" cy="20" r="9"  fill="url(#irisGrad)" />
      <circle  cx="20" cy="20" r="3.2" fill="#1C1917" />
      <circle  cx="22.5" cy="17.5" r="1.2" fill="#FFFFFF" />
    </svg>
  );
}

export function IrisWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <IrisMark />
      <span className="font-sans text-xl font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
        iris<span style={{ color: "var(--iris)" }}>.</span>
      </span>
    </div>
  );
}
