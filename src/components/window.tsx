"use client";

import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { Minus, Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CHROME_HEIGHT = 32;
const ANIM_MS = 380;
const EASE = "cubic-bezier(.16,1,.3,1)";

type Pos = { x: number; y: number };
type Size = { width: number; height: number };

export type WindowProps = {
  title: string;
  defaultPos: Pos;
  defaultSize: Size;
  minSize?: Size;
  zIndex?: number;
  onFocus?: () => void;
  bounds?: string;
  /** Pixel inset from edges when maximizing (e.g. {top: 60} keeps a header visible). */
  maxInsets?: { top?: number; right?: number; bottom?: number; left?: number };
  className?: string;
  /** Extra controls injected into the title-bar (e.g. tab pills). */
  titleAccessory?: React.ReactNode;
  /** If provided, adds a close (X) button to the titlebar. */
  onClose?: () => void;
  children: React.ReactNode;
};

/**
 * A draggable / resizable / minimizable / maximizable panel.
 * Drag-to-move uses CSS transform (instant). Min/max actions briefly enable
 * a transition on width/height/transform so the resize/move is smooth, then
 * disable it again so the next drag is responsive.
 */
export function Window({
  title,
  defaultPos,
  defaultSize,
  minSize,
  zIndex = 10,
  onFocus,
  bounds = "parent",
  maxInsets,
  className,
  titleAccessory,
  onClose,
  children,
}: WindowProps) {
  const [pos, setPos] = useState<Pos>(defaultPos);
  const [size, setSize] = useState<Size>(defaultSize);
  const [isMin, setIsMin] = useState(false);
  const [isMax, setIsMax] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Saves so we can restore from min/max
  const restoreFromMin = useRef<Size | null>(null);
  const restoreFromMax = useRef<{ pos: Pos; size: Size } | null>(null);

  // Track viewport so maximize fills available space
  const [vp, setVp] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const u = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    u();
    window.addEventListener("resize", u);
    return () => window.removeEventListener("resize", u);
  }, []);

  const animate = (mut: () => void) => {
    setAnimating(true);
    mut();
    window.setTimeout(() => setAnimating(false), ANIM_MS + 40);
  };

  const toggleMin = () => {
    onFocus?.();
    animate(() => {
      if (isMin) {
        setIsMin(false);
        if (restoreFromMin.current) setSize(restoreFromMin.current);
      } else {
        if (isMax) return; // max takes precedence
        restoreFromMin.current = size;
        setIsMin(true);
        setSize({ width: size.width, height: CHROME_HEIGHT });
      }
    });
  };

  const toggleMax = () => {
    onFocus?.();
    animate(() => {
      if (isMax) {
        setIsMax(false);
        if (restoreFromMax.current) {
          setPos(restoreFromMax.current.pos);
          setSize(restoreFromMax.current.size);
        }
      } else {
        if (isMin) {
          setIsMin(false);
          restoreFromMin.current = null;
        }
        restoreFromMax.current = { pos, size };
        setIsMax(true);
        const t = maxInsets?.top ?? 12;
        const r = maxInsets?.right ?? 12;
        const b = maxInsets?.bottom ?? 12;
        const l = maxInsets?.left ?? 12;
        setPos({ x: l, y: t });
        setSize({ width: vp.w - l - r, height: vp.h - t - b });
      }
    });
  };

  return (
    <Rnd
      position={pos}
      size={size}
      onDragStart={() => onFocus?.()}
      onDragStop={(_e, d) => setPos({ x: d.x, y: d.y })}
      onResizeStart={() => onFocus?.()}
      onResizeStop={(_e, _dir, ref, _delta, position) => {
        setSize({
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
        });
        setPos({ x: position.x, y: position.y });
      }}
      minWidth={minSize?.width ?? 240}
      minHeight={minSize?.height ?? CHROME_HEIGHT}
      bounds={bounds}
      enableResizing={!isMin && !isMax}
      disableDragging={isMax}
      dragHandleClassName="window-titlebar"
      style={{
        zIndex,
        transition: animating
          ? `width ${ANIM_MS}ms ${EASE}, height ${ANIM_MS}ms ${EASE}, transform ${ANIM_MS}ms ${EASE}`
          : undefined,
      }}
    >
      <div
        onMouseDownCapture={onFocus}
        className={cn(
          "glass flex h-full w-full flex-col overflow-hidden rounded-lg",
          className,
        )}
      >
        {/* ── Titlebar ─────────────────────────────────────────── */}
        <div
          className={cn(
            "window-titlebar flex h-8 shrink-0 cursor-grab select-none items-center justify-between gap-2 border-b border-line/80 bg-bg-raised/60 px-3 active:cursor-grabbing",
            isMax && "cursor-default active:cursor-default",
          )}
          onDoubleClick={toggleMax}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid grid-cols-2 gap-[3px]" aria-hidden>
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className="h-1 w-1 bg-ink-dim/70" />
              ))}
            </span>
            <span className="truncate font-mono text-[10px] uppercase tracking-chart text-ink-warm">
              {title}
            </span>
            {titleAccessory && (
              <span className="ml-2 truncate text-ink-dim">{titleAccessory}</span>
            )}
          </div>
          <div className="flex items-center gap-0.5 text-ink-dim">
            <Ctl onClick={toggleMin} title={isMin ? "restore" : "minimize"}>
              <Minus className="h-3 w-3" />
            </Ctl>
            <Ctl onClick={toggleMax} title={isMax ? "restore" : "maximize"}>
              {isMax ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Ctl>
            {onClose && (
              <Ctl onClick={onClose} title="close" tone="risk">
                <X className="h-3 w-3" />
              </Ctl>
            )}
          </div>
        </div>

        {/* ── Body (collapses on minimize) ─────────────────────── */}
        <div
          className="min-h-0 flex-1 overflow-hidden"
          style={{
            transition: animating ? `opacity ${ANIM_MS}ms ${EASE}` : undefined,
            opacity: isMin ? 0 : 1,
            pointerEvents: isMin ? "none" : "auto",
          }}
        >
          {children}
        </div>
      </div>
    </Rnd>
  );
}

function Ctl({
  onClick,
  title,
  tone = "amber",
  children,
}: {
  onClick: () => void;
  title: string;
  tone?: "amber" | "risk";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={cn(
        "grid h-5 w-5 place-items-center transition-colors hover:bg-bg-hover",
        tone === "amber" ? "hover:text-amber" : "hover:text-risk-critical",
      )}
    >
      {children}
    </button>
  );
}
