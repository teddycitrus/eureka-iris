import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CheckCircle,
  Globe2,
  Phone,
  Siren,
  XCircle,
} from "lucide-react";

import { PulseNetworkMap } from "@/components/pulse-network-map";
import { RiskBadge } from "@/components/risk-badge";
import { StatCard } from "@/components/stat-card";
import { TestFireButton } from "@/components/test-fire-button";
import { db } from "@/lib/db";
import { buildNetworkMapModel } from "@/lib/network-map";
import { shortRelTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PulsePageProps = {
  searchParams?: {
    tab?: string;
  };
};

export default async function Pulse({ searchParams }: PulsePageProps) {
  const [
    suppliers,
    contactCount,
    alertsPending,
    callsToday,
    recentAlerts,
    recentCalls,
  ] = await Promise.all([
    db.supplier.findMany({
      include: {
        alerts: {
          where: { status: { not: "dismissed" } },
          include: { news: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.contact.count(),
    db.alert.count({ where: { status: { in: ["pending", "calling"] } } }),
    db.call.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    db.alert.findMany({
      where: { status: { in: ["pending", "calling", "escalated"] } },
      include: { news: true, supplier: true },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    db.call.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { contact: true, alert: { include: { supplier: true, news: true } } },
    }),
  ]);

  const model = buildNetworkMapModel(suppliers);
  const supplierCount = suppliers.length;
  const activeTab = searchParams?.tab === "network-map" ? "network-map" : "overview";

  return (
    <div className="p-6 flex flex-col gap-5">
      <PulseHero alertsPending={alertsPending} callsToday={callsToday} />

      {activeTab === "network-map" ? (
        <PulseNetworkMap model={model} />
      ) : (
        <PulseOverview
          alertsPending={alertsPending}
          callsToday={callsToday}
          contactCount={contactCount}
          recentAlerts={recentAlerts}
          recentCalls={recentCalls}
          supplierCount={supplierCount}
        />
      )}
    </div>
  );
}

function PulseHero({
  alertsPending,
  callsToday,
}: {
  alertsPending: number;
  callsToday: number;
}) {
  return (
    <div
      className="rounded-xl p-7 grid gap-7"
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, oklch(0.98 0.01 210) 100%)",
        border: "1px solid var(--border)",
        gridTemplateColumns: "100px 1fr auto",
        alignItems: "center",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full relative"
        style={{
          width: 100,
          height: 100,
          background: "radial-gradient(circle at 35% 35%, oklch(0.85 0.06 210), oklch(0.45 0.08 210))",
          boxShadow: "0 8px 24px oklch(0.55 0.08 210 / 0.18)",
        }}
      >
        <div className="flex items-center gap-[3px]" style={{ height: 36 }}>
          {[0.4, 0.8, 0.5, 1, 0.7, 0.9, 0.4].map((h, i) => (
            <div
              key={i}
              className="animate-wave rounded-sm"
              style={{
                width: 3,
                height: `${h * 100}%`,
                background: "#fff",
                borderRadius: 2,
                animationDelay: `${i * 0.08}s`,
                transformOrigin: "center",
              }}
            />
          ))}
        </div>
        <div
          className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{
            background: "#fff",
            color: "var(--iris)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full pulse-ring" style={{ background: "var(--iris)" }} />
          LIVE
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.02em] rounded px-1.5 py-0.5"
            style={{
              background: "var(--iris-bg)",
              color: "var(--iris)",
              border: "1px solid var(--iris-border)",
            }}
          >
            <span className="h-[5px] w-[5px] rounded-full" style={{ background: "var(--iris)" }} />
            Iris voice agent
          </span>
          <span className="font-mono text-[11px]" style={{ color: "var(--ink-4)" }}>
            uptime 99.97%
          </span>
        </div>
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight mb-2" style={{ color: "var(--ink)" }}>
          When a high-severity signal lands, I dial the right human.
        </h1>
        <p className="text-[13.5px] leading-relaxed max-w-2xl" style={{ color: "var(--ink-2)" }}>
          Iris scores every news item against your supplier graph. Anything ≥{" "}
          <span style={{ color: "var(--iris)" }}>high</span> triggers an outbound voice briefing —
          captured, transcribed, and routed back as a decision. Right now she's tracking{" "}
          {alertsPending} open alert{alertsPending !== 1 ? "s" : ""}.
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <Link
            href="/alerts"
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: "var(--ink)" }}
          >
            <Siren className="h-3.5 w-3.5" />
            Review alert queue
          </Link>
          <form action="/api/news/ingest" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors hover:bg-[color:var(--surface-2)]"
              style={{
                border: "1px solid var(--border-strong)",
                background: "var(--surface)",
                color: "var(--ink-2)",
              }}
            >
              Pull latest signals
            </button>
          </form>
          <Link
            href="/?tab=network-map"
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-colors"
            style={{
              border: "1px solid var(--border-strong)",
              background: "linear-gradient(180deg, rgba(17,24,39,0.94) 0%, rgba(11,15,22,1) 100%)",
              color: "#fff",
            }}
          >
            <Globe2 className="h-3.5 w-3.5" />
            Open network map
          </Link>
          <TestFireButton variant="ghost" />
        </div>
      </div>

      <div className="flex flex-col gap-3 pl-6 shrink-0" style={{ borderLeft: "1px solid var(--border)", minWidth: 160 }}>
        <MetaStat label="Avg call resolution" value={callsToday > 0 ? "3:42" : "—"} sub="voice ops" />
        <MetaStat label="Calls last 24h" value={String(callsToday)} sub="voice-agent dispatches" />
        <MetaStat label="Open alerts" value={String(alertsPending)} sub="awaiting decision" />
      </div>
    </div>
  );
}

function PulseOverview({
  alertsPending,
  callsToday,
  contactCount,
  recentAlerts,
  recentCalls,
  supplierCount,
}: {
  alertsPending: number;
  callsToday: number;
  contactCount: number;
  recentAlerts: Array<{
    id: string;
    severity: string;
    status: string;
    createdAt: Date;
    news: { title: string };
    supplier: { name: string; region: string };
  }>;
  recentCalls: Array<{
    id: string;
    status: string;
    durationSec: number | null;
    createdAt: Date;
    contact: { name: string };
    alert: { supplier: { name: string }; news: { title: string } };
  }>;
  supplierCount: number;
}) {
  const severityOrder = ["critical", "high", "medium", "low"];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Suppliers monitored"
          value={supplierCount}
          delta={supplierCount > 0 ? `${supplierCount} active` : undefined}
          deltaDir="up"
        />
        <StatCard
          label="Open alerts"
          value={alertsPending}
          accent={
            alertsPending > 0 ? (
              <RiskBadge severity="critical" />
            ) : (
              <span
                className="font-mono text-[10.5px] rounded px-1.5 py-0.5"
                style={{
                  background: "var(--ok-bg)",
                  color: "var(--ok)",
                  border: "1px solid oklch(0.85 0.08 155)",
                }}
              >
                all clear
              </span>
            )
          }
        />
        <StatCard
          label="Calls last 24h"
          value={callsToday}
          hint="voice-agent dispatches"
          deltaDir={callsToday > 0 ? "up" : undefined}
        />
        <StatCard
          label="Contacts on call-tree"
          value={contactCount}
          delta={contactCount > 0 ? "reachable" : undefined}
          deltaDir="up"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5 min-w-0">
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-4)" }}>
                  LIVE
                </span>
                <h3 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                  Open alerts
                </h3>
                <span className="font-mono text-[11px]" style={{ color: "var(--ink-4)" }}>
                  {recentAlerts.length} showing
                </span>
              </div>
              <Link
                href="/alerts"
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors"
                style={{
                  border: "1px solid var(--border-strong)",
                  background: "var(--surface)",
                  color: "var(--ink-2)",
                }}
              >
                Open queue
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            {recentAlerts.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--ink-3)", background: "var(--surface)" }}>
                No active alerts — the world is quiet for now.
              </div>
            ) : (
              <div style={{ background: "var(--surface)" }}>
                {recentAlerts
                  .slice()
                  .sort((a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity))
                  .map((alert, index) => (
                    <Link
                      key={alert.id}
                      href={`/alerts#${alert.id}`}
                      className="row-hover flex items-center gap-4 px-4 py-3.5 transition-colors"
                      style={{ borderTop: index === 0 ? "none" : "1px solid var(--border)" }}
                    >
                      <div className="flex flex-col gap-1 w-[110px] shrink-0">
                        <RiskBadge severity={alert.severity} />
                        <span className="font-mono text-[10.5px]" style={{ color: "var(--ink-4)" }}>
                          {shortRelTime(alert.createdAt)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-medium mb-0.5 truncate" style={{ color: "var(--ink)" }}>
                          {alert.news.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--ink-3)" }}>
                          <Building2 className="h-3 w-3" />
                          {alert.supplier.name}
                          <span style={{ color: "var(--ink-4)" }}>·</span>
                          <Globe2 className="h-3 w-3" />
                          {alert.supplier.region}
                        </div>
                      </div>
                      <div
                        className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium"
                        style={{
                          color:
                            alert.status === "calling"
                              ? "var(--iris)"
                              : alert.status === "pending"
                                ? "var(--critical)"
                                : "var(--ink-3)",
                        }}
                      >
                        {alert.status === "calling" && (
                          <span className="h-1.5 w-1.5 rounded-full pulse-ring" style={{ background: "var(--iris)" }} />
                        )}
                        {alert.status === "pending" && (
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--critical)" }} />
                        )}
                        {alert.status === "calling" ? "Iris on call" : alert.status}
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--ink-4)" }} />
                    </Link>
                  ))}
              </div>
            )}
          </div>

          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", background: "var(--surface)" }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-4)" }}>
                  NETWORK
                </span>
                <h3 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                  Supplier health
                </h3>
                <span className="font-mono text-[11px]" style={{ color: "var(--ink-4)" }}>
                  {supplierCount} monitored
                </span>
              </div>
              <Link href="/?tab=network-map" className="text-[12px] font-medium" style={{ color: "var(--iris)" }}>
                Launch globe →
              </Link>
            </div>
            {supplierCount === 0 ? (
              <div className="px-4 py-6 text-sm" style={{ color: "var(--ink-3)" }}>
                No suppliers yet.{" "}
                <Link href="/suppliers" style={{ color: "var(--iris)" }}>
                  Add one →
                </Link>
              </div>
            ) : (
              <div className="px-4 py-4 text-[12.5px]" style={{ color: "var(--ink-2)" }}>
                <p>
                  {supplierCount} supplier{supplierCount !== 1 ? "s" : ""} monitored across your
                  supply graph. The new globe view renders live supplier nodes, shipping lanes, and red
                  alert glows for open high-severity incidents.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link
                    href="/?tab=network-map"
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white"
                    style={{
                      background: "linear-gradient(180deg, rgba(17,24,39,0.94) 0%, rgba(11,15,22,1) 100%)",
                    }}
                  >
                    <Globe2 className="h-3.5 w-3.5" />
                    Open network map
                  </Link>
                  <Link
                    href="/suppliers"
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      border: "1px solid var(--border-strong)",
                      background: "var(--surface)",
                      color: "var(--ink-2)",
                    }}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    View supplier directory
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--ink-4)" }}>
                    LIVE
                  </span>
                  <h3 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                    Voice ops log
                  </h3>
                </div>
                <Link href="/calls" className="text-[12px] font-medium" style={{ color: "var(--iris)" }}>
                  full log →
                </Link>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 rounded-full pulse-ring" style={{ background: "var(--iris)", opacity: 0.4 }} />
                  <span className="relative h-1.5 w-1.5 rounded-full" style={{ background: "var(--iris)" }} />
                </span>
                <span className="text-[11.5px]" style={{ color: "var(--ink-3)" }}>
                  {callsToday} calls today
                </span>
              </div>
            </div>

            <div style={{ background: "var(--surface)", maxHeight: 400, overflowY: "auto" }}>
              {recentCalls.length === 0 ? (
                <div className="px-4 py-6 text-sm" style={{ color: "var(--ink-3)" }}>
                  No calls yet. Trigger one from the alerts page.
                </div>
              ) : (
                recentCalls.map((call, index) => {
                  const outcomeColor =
                    call.status === "completed"
                      ? "var(--ok)"
                      : call.status === "failed"
                        ? "var(--critical)"
                        : "var(--iris)";
                  const OutcomeIcon =
                    call.status === "completed"
                      ? CheckCircle
                      : call.status === "failed"
                        ? XCircle
                        : Phone;

                  return (
                    <div
                      key={call.id}
                      className="row-hover px-4 py-3 flex flex-col gap-1"
                      style={{ borderTop: index === 0 ? "none" : "1px solid var(--border)" }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px]" style={{ color: "var(--ink-4)" }}>
                          {shortRelTime(call.createdAt)}
                        </span>
                        {typeof call.durationSec === "number" && (
                          <>
                            <span style={{ color: "var(--ink-4)" }}>·</span>
                            <span className="font-mono text-[11px]" style={{ color: "var(--ink-3)" }}>
                              {call.durationSec}s
                            </span>
                          </>
                        )}
                        <span className="ml-auto inline-flex items-center gap-1 text-[10.5px] font-medium" style={{ color: outcomeColor }}>
                          <OutcomeIcon className="h-3 w-3" />
                          {call.status}
                        </span>
                      </div>
                      <div className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                        {call.alert.news.title.slice(0, 60)}
                        {call.alert.news.title.length > 60 ? "…" : ""}
                      </div>
                      <div className="text-[11.5px]" style={{ color: "var(--ink-3)" }}>
                        {call.contact.name}
                        <span style={{ color: "var(--ink-4)" }}> · {call.alert.supplier.name}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MetaStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-[11px] mb-0.5" style={{ color: "var(--ink-3)" }}>
        {label}
      </div>
      <div className="font-mono text-[17px] font-semibold leading-none tracking-tight" style={{ color: "var(--ink)" }}>
        {value}
      </div>
      <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--ink-4)" }}>
        {sub}
      </div>
    </div>
  );
}
