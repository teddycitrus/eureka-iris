"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Siren,
  Newspaper,
  Building2,
  Users,
  PhoneCall,
  Search,
  Bell,
  Settings,
  RefreshCw,
} from "lucide-react";
import { IrisMark } from "./iris-mark";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/",         label: "Pulse",     icon: LayoutDashboard },
  { href: "/alerts",   label: "Alerts",    icon: Siren },
  { href: "/news",     label: "Signals",   icon: Newspaper },
  { href: "/suppliers",label: "Suppliers", icon: Building2 },
  { href: "/contacts", label: "Contacts",  icon: Users },
  { href: "/calls",    label: "Voice ops", icon: PhoneCall },
];

const SUB_NAV: Record<string, string[]> = {
  "/":          ["Overview", "Network map", "Today", "Briefing"],
  "/alerts":    ["All", "Critical", "In progress", "Acknowledged", "Snoozed"],
  "/news":      ["Live feed", "Sources", "Rules", "Archive"],
  "/suppliers": ["Directory", "Tier 1", "Tier 2", "Risk score"],
  "/contacts":  ["Call tree", "By supplier", "Coverage", "Roles"],
  "/calls":     ["Activity log", "Active calls", "Transcripts", "Settings"],
};

export function TopNav({ alertCount = 0 }: { alertCount?: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activePage = PRIMARY_NAV.find((p) =>
    p.href === "/" ? pathname === "/" : pathname.startsWith(p.href)
  );
  const subItems = activePage ? (SUB_NAV[activePage.href] ?? []) : [];
  const activeRootTab = searchParams.get("tab") === "network-map" ? "Network map" : "Overview";

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(250,250,249,0.94)",
        backdropFilter: "blur(10px)",
        borderColor: "var(--border)",
      }}
    >
      {/* ── Primary bar ─────────────────────────────────────── */}
      <div
        className="flex h-[52px] items-center gap-6 px-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ background: "linear-gradient(135deg, var(--ink) 0%, var(--ink-3) 100%)" }}
          >
            <IrisMark className="h-3.5 w-3.5" animate={false} light />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold tracking-tight" style={{ color: "var(--ink)" }}>
              Iris
            </span>
            <span
              className="font-mono text-[10px] tracking-[0.06em]"
              style={{ color: "var(--ink-4)" }}
            >
              VOICE OPS
            </span>
          </div>
        </Link>

        {/* Primary nav */}
        <nav className="flex items-center gap-0.5">
          {PRIMARY_NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            const isBadged = href === "/alerts" && alertCount > 0;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "text-[color:var(--ink)]"
                    : "text-[color:var(--ink-3)] hover:text-[color:var(--ink-2)]",
                )}
                style={{
                  background: active ? "var(--surface-3)" : "transparent",
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {isBadged && (
                  <span
                    className="font-mono text-[9.5px] font-semibold rounded px-[3px] py-px"
                    style={{ background: "var(--critical)", color: "#fff" }}
                  >
                    {alertCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-3">
          {/* Status pill */}
          <div
            className="hidden sm:flex items-center gap-2 rounded-md px-2.5 py-1 text-xs"
            style={{
              background: "var(--surface-2)",
              color: "var(--ink-3)",
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="absolute inset-0 rounded-full pulse-ring"
                style={{ background: "var(--iris)", opacity: 0.4 }}
              />
              <span
                className="relative h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--iris)" }}
              />
            </span>
            <span>Iris online</span>
          </div>

          {/* Search */}
          <div
            className="hidden md:flex items-center gap-2 rounded-md px-2.5 py-1 text-xs min-w-[200px] cursor-text"
            style={{
              border: "1px solid var(--border)",
              color: "var(--ink-4)",
            }}
          >
            <Search className="h-3 w-3" />
            <span>Search suppliers, alerts…</span>
            <span
              className="ml-auto font-mono text-[10px] rounded px-[3px] py-px"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--ink-4)",
              }}
            >
              ⌘K
            </span>
          </div>

          {/* Bell */}
          <button
            className="relative rounded-md p-1.5 transition-colors hover:bg-[color:var(--surface-3)]"
            style={{ color: "var(--ink-3)" }}
          >
            <Bell className="h-4 w-4" />
            {alertCount > 0 && (
              <span
                className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--critical)" }}
              />
            )}
          </button>

          {/* Settings */}
          <button
            className="rounded-md p-1.5 transition-colors hover:bg-[color:var(--surface-3)]"
            style={{ color: "var(--ink-3)" }}
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* Avatar */}
          <div
            className="flex items-center gap-2 pl-3"
            style={{ borderLeft: "1px solid var(--border)" }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, oklch(0.85 0.04 30), oklch(0.65 0.08 50))",
              }}
            >
              RC
            </div>
            <div className="hidden lg:block text-xs leading-tight">
              <div className="font-medium" style={{ color: "var(--ink)" }}>
                Riley Chen
              </div>
              <div className="font-mono text-[10px]" style={{ color: "var(--ink-4)" }}>
                Supply Ops
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-nav ──────────────────────────────────────────── */}
      {subItems.length > 0 && (
        <div className="flex h-10 items-center gap-0 px-6">
          {subItems.map((item, i) => (
            <Link
              key={item}
              href={item === "Network map" ? "/?tab=network-map" : activePage?.href === "/" ? "/" : activePage?.href ?? pathname}
              className={cn(
                "inline-flex items-center border-b-2 px-0 mr-6 py-0 h-full text-[13px] font-medium transition-colors",
                activePage?.href === "/"
                  ? activeRootTab === item
                    ? "border-[color:var(--ink)] text-[color:var(--ink)]"
                    : "border-transparent text-[color:var(--ink-3)] hover:text-[color:var(--ink-2)]"
                  : i === 0
                  ? "border-[color:var(--ink)] text-[color:var(--ink)]"
                  : "border-transparent text-[color:var(--ink-3)] hover:text-[color:var(--ink-2)]",
              )}
            >
              {item}
            </Link>
          ))}
          <div className="ml-auto flex items-center gap-3 text-[11px]" style={{ color: "var(--ink-4)" }}>
            <span className="font-mono hidden sm:block">Last sync {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} PT</span>
            <button
              className="inline-flex items-center gap-1 font-sans text-xs transition-colors hover:text-[color:var(--ink-2)]"
              style={{ color: "var(--ink-3)", background: "transparent", border: "none", cursor: "pointer" }}
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
