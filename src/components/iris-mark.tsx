import { cn } from "@/lib/utils";

export function IrisMark({ className, animate = true }: { className?: string; animate?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("h-7 w-7", animate && "iris-breath", className)}
    >
      <defs>
        <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#5BE9E9" />
          <stop offset="55%" stopColor="#6F3FF0" />
          <stop offset="100%" stopColor="#1F0F4A" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="20" rx="19" ry="11" stroke="#A883FF" strokeOpacity="0.6" />
      <circle cx="20" cy="20" r="9" fill="url(#irisGrad)" />
      <circle cx="20" cy="20" r="3.2" fill="#0A0612" />
      <circle cx="22.5" cy="17.5" r="1.2" fill="#F4F0FF" />
    </svg>
  );
}

export function IrisWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <IrisMark />
      <span className="font-display text-xl tracking-tight text-ink">
        iris<span className="text-iris-300">.</span>
      </span>
    </div>
  );
}
