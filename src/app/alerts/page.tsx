import { db } from "@/lib/db";
import { RiskBadge } from "@/components/risk-badge";
import { StatCard } from "@/components/stat-card";
import { TestFireButton } from "@/components/test-fire-button";
import { parseList, shortRelTime } from "@/lib/utils";
import { Building2, Globe2, PhoneOutgoing, ExternalLink, Siren } from "lucide-react";
import { CallButton } from "./call-button";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const [alerts, criticalCount, warnCount, avgAck] = await Promise.all([
    db.alert.findMany({
      include: {
        news: true,
        supplier: { include: { contacts: { include: { contact: true } } } },
        calls: { include: { contact: true }, orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ status: "asc" }, { severity: "desc" }, { createdAt: "desc" }],
      take: 200,
    }),
    db.alert.count({ where: { severity: "critical", status: { not: "dismissed" } } }),
    db.alert.count({ where: { severity: { in: ["high", "medium"] }, status: { not: "dismissed" } } }),
    Promise.resolve(null),
  ]);

  const open = alerts.filter((a) => a.status !== "dismissed");
  const autoResolved = alerts.filter((a) => a.status === "dismissed").length;

  return (
    <div className="flex flex-col">
      {/* ── KPI strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 p-6 pb-0 lg:grid-cols-4">
        <StatCard
          label="Critical open"
          value={criticalCount}
          accent={
            criticalCount > 0 ? (
              <RiskBadge severity="critical" />
            ) : undefined
          }
        />
        <StatCard
          label="Warnings"
          value={warnCount}
          accent={
            warnCount > 0 ? (
              <RiskBadge severity="high" />
            ) : undefined
          }
        />
        <StatCard
          label="Total open"
          value={open.length}
          hint={open.length === 0 ? "all clear" : "active"}
        />
        <StatCard
          label="Auto-resolved"
          value={autoResolved}
          hint="dismissed"
        />
      </div>

      {/* ── Alert queue ────────────────────────────────────────── */}
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              Alert queue
            </h2>
            <p className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-3)" }}>
              {open.length} open · sorted by severity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TestFireButton variant="ghost" />
          </div>
        </div>

        {alerts.length === 0 && (
          <div
            className="rounded-lg px-6 py-12 text-center text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--ink-3)",
            }}
          >
            <Siren className="h-6 w-6 mx-auto mb-2 opacity-30" />
            No alerts yet — pull signals from the dashboard to begin.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {alerts.map((a) => {
            const oncall = a.supplier.contacts
              .filter((c) => c.contact.receiveCalls)
              .sort((x, y) => x.contact.escalation - y.contact.escalation)[0]?.contact;

            const statusColor =
              a.status === "calling"
                ? "var(--iris)"
                : a.status === "pending"
                  ? "var(--critical)"
                  : a.status === "escalated"
                    ? "var(--warn)"
                    : "var(--ink-4)";

            return (
              <article
                id={a.id}
                key={a.id}
                className="rounded-lg overflow-hidden"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                {/* Header row */}
                <div
                  className="flex flex-wrap items-start gap-3 px-4 py-3.5"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <RiskBadge severity={a.severity} />
                  <div
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium"
                    style={{ color: statusColor }}
                  >
                    {a.status === "calling" && (
                      <span
                        className="h-1.5 w-1.5 rounded-full pulse-ring"
                        style={{ background: "var(--iris)" }}
                      />
                    )}
                    {a.status === "pending" && (
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--critical)" }} />
                    )}
                    {a.status}
                  </div>
                  <span className="font-mono text-[11px]" style={{ color: "var(--ink-4)" }}>
                    · {shortRelTime(a.createdAt)}
                  </span>
                  <a
                    href={a.news.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
                    style={{ color: "var(--ink-4)" }}
                  >
                    source <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                {/* Body */}
                <div className="px-4 py-4">
                  <h2
                    className="text-[15px] font-semibold leading-snug mb-1.5"
                    style={{ color: "var(--ink)" }}
                  >
                    {a.news.title}
                  </h2>
                  <p className="text-[13px] leading-relaxed max-w-3xl" style={{ color: "var(--ink-3)" }}>
                    {a.news.summary}
                  </p>

                  {/* Details grid */}
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div
                      className="rounded-md p-3"
                      style={{
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                      }}
                    >
                      <div
                        className="font-mono text-[10px] uppercase tracking-wider mb-1"
                        style={{ color: "var(--ink-4)" }}
                      >
                        supplier
                      </div>
                      <div
                        className="flex items-center gap-1.5 text-[13px] font-medium"
                        style={{ color: "var(--ink)" }}
                      >
                        <Building2 className="h-3.5 w-3.5" style={{ color: "var(--iris)" }} />
                        {a.supplier.name}
                      </div>
                      <div
                        className="flex items-center gap-1 mt-0.5 text-xs"
                        style={{ color: "var(--ink-3)" }}
                      >
                        <Globe2 className="h-3 w-3" />
                        {a.supplier.country} · {a.supplier.region}
                      </div>
                    </div>

                    <div
                      className="rounded-md p-3 md:col-span-2"
                      style={{
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                      }}
                    >
                      <div
                        className="font-mono text-[10px] uppercase tracking-wider mb-1"
                        style={{ color: "var(--ink-4)" }}
                      >
                        iris recommendation
                      </div>
                      <p className="text-[13px]" style={{ color: "var(--ink)" }}>
                        {a.recommendation}
                      </p>
                      {a.decision && (
                        <p className="mt-2 text-xs" style={{ color: "var(--iris)" }}>
                          decision captured:{" "}
                          <span style={{ color: "var(--ink)" }}>{a.decision}</span>
                          {a.decisionMaker && (
                            <span style={{ color: "var(--ink-4)" }}>
                              {" "}
                              · via {a.decisionMaker}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div className="text-[12px]" style={{ color: "var(--ink-3)" }}>
                      {oncall ? (
                        <>
                          on-call:{" "}
                          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{oncall.name}</span>
                          {" "}· {oncall.role} ·{" "}
                          <span className="font-mono">{oncall.phone}</span>
                        </>
                      ) : (
                        <span style={{ color: "var(--critical)" }}>
                          no contact mapped to this supplier
                        </span>
                      )}
                    </div>

                    {/* Topic tags */}
                    <div className="ml-auto flex flex-wrap gap-1.5">
                      {parseList<string>(a.news.topics).map((t) => (
                        <span
                          key={t}
                          className="font-mono text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5"
                          style={{
                            border: "1px solid var(--border)",
                            background: "var(--surface-2)",
                            color: "var(--ink-4)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {oncall && <CallButton alertId={a.id} contactName={oncall.name} />}
                  </div>
                </div>

                {/* Call history */}
                {a.calls.length > 0 && (
                  <div
                    className="px-4 py-3"
                    style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
                  >
                    <div
                      className="font-mono text-[10px] uppercase tracking-wider mb-2"
                      style={{ color: "var(--ink-4)" }}
                    >
                      call history
                    </div>
                    <ul className="flex flex-col gap-1">
                      {a.calls.map((c) => (
                        <li
                          key={c.id}
                          className="flex items-center gap-2 text-xs"
                          style={{ color: "var(--ink-3)" }}
                        >
                          <PhoneOutgoing className="h-3 w-3" style={{ color: "var(--iris)" }} />
                          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{c.contact.name}</span>
                          <span>· {c.status}</span>
                          {c.outcome && (
                            <span style={{ color: "var(--iris)" }}>→ {c.outcome}</span>
                          )}
                          <span className="ml-auto font-mono" style={{ color: "var(--ink-4)" }}>
                            {shortRelTime(c.createdAt)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
