"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Siren,
  PhoneCall,
  Users,
  Loader2,
  ExternalLink,
  Building2,
  PhoneOutgoing,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ActivityRail } from "./activity-rail";
import type { ActivityEntry } from "./lanes-view";
import { CallButton } from "@/app/alerts/call-button";
import { ContactForm } from "@/app/contacts/contact-form";
import { DeleteContactButton } from "@/app/contacts/delete-button";
import { RiskBadge } from "@/components/risk-badge";
import { cn, parseList, shortRelTime } from "@/lib/utils";

type Tab = "live" | "alerts" | "calls" | "contacts";

const TABS: Array<{
  id: Tab;
  label: string;
  icon: LucideIcon;
  serif: string;
}> = [
  { id: "live", label: "the log", icon: Activity, serif: "the log" },
  { id: "alerts", label: "risks", icon: Siren, serif: "risks at hand" },
  { id: "calls", label: "voice ops", icon: PhoneCall, serif: "voice ops" },
  { id: "contacts", label: "call tree", icon: Users, serif: "the call tree" },
];

export function RightPanel({
  activity,
  onRefreshNeeded,
}: {
  activity: ActivityEntry[];
  onRefreshNeeded: () => void;
}) {
  const [tab, setTab] = useState<Tab>("live");
  const tick = activity.length;
  const current = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="flex h-full flex-col">
      {/* ── editorial header (per-tab serif) ──────────────────── */}
      <div className="border-b border-line/80 px-5 py-3">
        <div className="font-display text-base italic text-ink-warm">
          {current.serif}
        </div>
      </div>

      {/* ── underline tab strip ───────────────────────────────── */}
      <div className="flex items-center gap-5 border-b border-line/80 px-5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "group relative flex items-center gap-1.5 py-2.5 font-mono text-[10px] uppercase tracking-chart transition",
                active ? "text-amber" : "text-ink-dim hover:text-ink",
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
              <span
                className={cn(
                  "absolute inset-x-0 -bottom-px h-px transition",
                  active ? "bg-amber" : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1">
        {tab === "live" && <ActivityRail embedded entries={activity} />}
        {tab === "alerts" && <AlertsTab tick={tick} onChanged={onRefreshNeeded} />}
        {tab === "calls" && <CallsTab tick={tick} />}
        {tab === "contacts" && <ContactsTab tick={tick} />}
      </div>
    </div>
  );
}

// ── Alerts ──────────────────────────────────────────────────────
type AlertRow = {
  id: string;
  severity: string;
  status: string;
  recommendation: string;
  createdAt: string;
  news: { title: string; topics: string; url: string };
  supplier: {
    name: string;
    region: string;
    contacts: Array<{ contact: { name: string; receiveCalls: boolean; escalation: number } }>;
  };
};

function AlertsTab({ tick, onChanged }: { tick: number; onChanged: () => void }) {
  const [rows, setRows] = useState<AlertRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/alerts", { cache: "no-store" })
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, [tick]);

  async function patch(id: string, status: string) {
    setBusy(id);
    await fetch("/api/alerts", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusy(null);
    onChanged();
    setRows(null);
  }

  if (rows === null) return <PanelEmpty icon={Loader2} label="loading risks" spin />;
  if (rows.length === 0)
    return <PanelEmpty icon={Siren} label="no live risks." />;

  return (
    <div className="h-full space-y-2 overflow-y-auto p-3">
      {rows.map((a, idx) => {
        const oncall = a.supplier.contacts
          .filter((c) => c.contact.receiveCalls)
          .sort((x, y) => x.contact.escalation - y.contact.escalation)[0]?.contact;
        return (
          <article
            key={a.id}
            className="rounded-lg border border-line/70 bg-bg-card/50 p-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <RiskBadge severity={a.severity} />
              <span className="font-mono text-[10px] uppercase tracking-chart text-ink-dim">
                {String(idx + 1).padStart(2, "0")} · {a.status} · {shortRelTime(a.createdAt)}
              </span>
              <a
                href={a.news.url}
                target="_blank"
                rel="noreferrer"
                className="text-ink-dim hover:text-amber"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <h3 className="mt-2.5 line-clamp-2 font-display text-[15px] leading-snug text-ink">
              {a.news.title}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
              {a.recommendation}
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-chart text-ink-dim">
              <Building2 className="h-3 w-3" />
              <span className="truncate text-ink-warm normal-case tracking-normal">
                {a.supplier.name}
              </span>
            </div>
            {parseList<string>(a.news.topics).length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {parseList<string>(a.news.topics)
                  .slice(0, 4)
                  .map((t) => (
                    <span
                      key={t}
                      className="border-l border-amber/50 bg-bg-raised/50 px-1.5 py-0 font-mono text-[9px] uppercase tracking-chart text-ink-muted"
                    >
                      {t}
                    </span>
                  ))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/60 pt-2.5">
              <div className="flex gap-1.5">
                <ActionButton
                  onClick={() => patch(a.id, "dismissed")}
                  disabled={busy === a.id}
                >
                  dismiss
                </ActionButton>
                <ActionButton
                  onClick={() => patch(a.id, "resolved")}
                  disabled={busy === a.id}
                >
                  resolve
                </ActionButton>
              </div>
              {oncall && <CallButton alertId={a.id} contactName={oncall.name} />}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="border border-line bg-bg-raised/40 px-2 py-1 font-mono text-[10px] uppercase tracking-chart text-ink-muted transition hover:border-amber/40 hover:text-ink disabled:opacity-50"
    >
      {children}
    </button>
  );
}

// ── Calls ───────────────────────────────────────────────────────
type CallRow = {
  id: string;
  status: string;
  outcome: string | null;
  transcript: string | null;
  durationSec: number | null;
  createdAt: string;
  contact: { name: string; role: string };
  alert: { supplier: { name: string }; news: { title: string } };
};

function CallsTab({ tick }: { tick: number }) {
  const [rows, setRows] = useState<CallRow[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/calls", { cache: "no-store" })
      .then((r) => r.json())
      .then(setRows)
      .catch(() => setRows([]));
  }, [tick]);

  if (rows === null) return <PanelEmpty icon={Loader2} label="loading voice ops" spin />;
  if (rows.length === 0) return <PanelEmpty icon={PhoneCall} label="no voice ops yet." />;

  return (
    <div className="h-full space-y-1.5 overflow-y-auto p-3">
      {rows.map((c) => {
        const open = openId === c.id;
        const tone =
          c.status === "completed"
            ? "text-risk-low"
            : c.status === "failed"
              ? "text-risk-critical"
              : "text-accent-cyan";
        return (
          <div
            key={c.id}
            className="overflow-hidden rounded-lg border border-line/70 bg-bg-card/50"
          >
            <button
              onClick={() => setOpenId(open ? null : c.id)}
              className="flex w-full items-start gap-2 p-3 text-left"
            >
              <PhoneOutgoing className={`mt-0.5 h-3.5 w-3.5 ${tone}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-ink">
                  <span className="truncate">{c.contact.name}</span>
                  <span className="text-ink-dim">·</span>
                  <span className="truncate text-ink-muted">{c.alert.supplier.name}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-chart text-ink-dim">
                  <span className={tone}>{c.status}</span>
                  {c.outcome && (
                    <span className="border-l border-amber/40 bg-bg-raised/50 px-1.5 text-amber">
                      → {c.outcome}
                    </span>
                  )}
                  {typeof c.durationSec === "number" && <span>{c.durationSec}s</span>}
                  <span className="ml-auto">{shortRelTime(c.createdAt)}</span>
                </div>
              </div>
            </button>
            {open && (
              <div className="border-t border-line/60 p-3">
                <span className="label">briefing</span>
                <p className="mt-1.5 font-display text-[13px] leading-snug text-ink">
                  {c.alert.news.title}
                </p>
                <span className="label mt-3 block">transcript</span>
                <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-ink-muted">
                  {c.transcript ?? "— no transcript —"}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Contacts ────────────────────────────────────────────────────
type ContactRow = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string | null;
  receiveCalls: boolean;
  escalation: number;
  suppliers: Array<{ supplier: { id: string; name: string } }>;
};
type SupplierLite = { id: string; name: string; country: string };

function ContactsTab({ tick }: { tick: number }) {
  const [contacts, setContacts] = useState<ContactRow[] | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierLite[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/contacts", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/suppliers", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([cs, ss]: [ContactRow[], SupplierLite[]]) => {
        setContacts(cs);
        setSuppliers(
          ss.map((s) => ({ id: s.id, name: s.name, country: s.country })),
        );
      })
      .catch(() => setContacts([]));
  }, [tick]);

  const sorted = useMemo(
    () => (contacts ? [...contacts].sort((a, b) => a.escalation - b.escalation) : null),
    [contacts],
  );

  if (sorted === null) return <PanelEmpty icon={Loader2} label="loading contacts" spin />;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line/70 px-3 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-chart text-ink-muted">
          {String(sorted.length).padStart(2, "0")} on the tree
        </span>
        <ContactForm suppliers={suppliers} />
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
        {sorted.length === 0 && (
          <div className="rounded-lg border border-line/70 bg-bg-card/50 p-4">
            <span className="label">tree empty</span>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              No contacts yet. Add one to put a human on the receiving end.
            </p>
          </div>
        )}
        {sorted.map((c, idx) => (
          <div
            key={c.id}
            className="flex items-start gap-3 rounded-lg border border-line/70 bg-bg-card/50 p-3"
          >
            <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-full border border-line bg-bg-raised text-ink-warm">
              <span className="font-display text-[11px] leading-none">
                {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate font-display text-[14px] text-ink">{c.name}</span>
                <span className="font-mono text-[9px] uppercase tracking-chart text-amber">
                  L{c.escalation}
                </span>
                <span className="ml-auto font-mono text-[9px] uppercase tracking-chart text-ink-dim">
                  #{String(idx + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="text-[10px] text-ink-muted">{c.role}</div>
              <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-ink-muted">
                <span>{c.phone}</span>
                {c.email && (
                  <>
                    <span className="text-ink-dim">·</span>
                    <Mail className="h-2.5 w-2.5" />
                    <span className="truncate">{c.email}</span>
                  </>
                )}
              </div>
              {c.suppliers.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {c.suppliers.map((cs) => (
                    <span
                      key={cs.supplier.id}
                      className="border-l border-amber/40 bg-bg-raised/50 px-1.5 py-0 font-mono text-[9px] uppercase tracking-chart text-ink-muted"
                    >
                      {cs.supplier.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <DeleteContactButton id={c.id} name={c.name} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Empty state helper ──────────────────────────────────────────
function PanelEmpty({
  icon: Icon,
  label,
  spin,
}: {
  icon: LucideIcon;
  label: string;
  spin?: boolean;
}) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-2.5 text-ink-dim">
        <Icon className={cn("h-4 w-4", spin && "animate-spin")} />
        <span className="font-mono text-[10px] uppercase tracking-chart">{label}</span>
      </div>
    </div>
  );
}
