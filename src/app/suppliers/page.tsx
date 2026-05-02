import { db } from "@/lib/db";
import { RiskBadge } from "@/components/risk-badge";
import { StatCard } from "@/components/stat-card";
import { parseList } from "@/lib/utils";
import { Building2, Globe2, Layers, UserCircle2, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await db.supplier.findMany({
    include: {
      contacts: { include: { contact: true } },
      alerts: { where: { status: { not: "dismissed" } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const tier1 = suppliers.filter((s) => s.tier === 1).length;
  const tier2 = suppliers.filter((s) => s.tier === 2).length;
  const withAlerts = suppliers.filter((s) => s.alerts.length > 0).length;

  const riskOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  return (
    <div className="flex flex-col">
      {/* ── KPI strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 p-6 pb-0 lg:grid-cols-4">
        <StatCard
          label="Total suppliers"
          value={suppliers.length}
          delta={suppliers.length > 0 ? "monitored" : undefined}
          deltaDir="up"
        />
        <StatCard
          label="Tier 1"
          value={tier1}
          accent={
            tier1 > 0 ? (
              <span
                className="font-mono text-[10.5px] rounded px-1.5 py-0.5"
                style={{
                  background: "var(--ok-bg)",
                  color: "var(--ok)",
                  border: "1px solid oklch(0.85 0.08 155)",
                }}
              >
                primary
              </span>
            ) : undefined
          }
        />
        <StatCard label="Tier 2" value={tier2} hint="secondary suppliers" />
        <StatCard
          label="With open alerts"
          value={withAlerts}
          accent={
            withAlerts > 0 ? <RiskBadge severity="high" /> : undefined
          }
        />
      </div>

      {/* ── Directory table ─────────────────────────────────────── */}
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              Supplier directory
            </h2>
            <p className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-3)" }}>
              {suppliers.length} monitored · Iris scores every signal against this list
            </p>
          </div>
        </div>

        {suppliers.length === 0 ? (
          <div
            className="rounded-lg px-6 py-12 text-center text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--ink-3)",
            }}
          >
            <Building2 className="h-6 w-6 mx-auto mb-2 opacity-30" />
            No suppliers yet.
          </div>
        ) : (
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
          >
            {/* Column headers */}
            <div
              className="grid px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.04em]"
              style={{
                gridTemplateColumns: "28px 1fr 90px 140px 60px 100px 80px",
                borderBottom: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--ink-4)",
                gap: "12px",
              }}
            >
              <span />
              <span>Supplier</span>
              <span>ID</span>
              <span>Region</span>
              <span>Tier</span>
              <span>Risk</span>
              <span>Alerts</span>
            </div>

            {suppliers
              .slice()
              .sort(
                (a, b) =>
                  (riskOrder[a.riskLevel] ?? 9) - (riskOrder[b.riskLevel] ?? 9),
              )
              .map((s, i) => {
                const hasAlerts = s.alerts.length > 0;
                return (
                  <div
                    key={s.id}
                    className="row-hover"
                    style={{
                      borderTop: i === 0 ? "none" : "1px solid var(--border)",
                      background: "var(--surface)",
                    }}
                  >
                    {/* Main row */}
                    <div
                      className="grid items-center px-4 py-3"
                      style={{
                        gridTemplateColumns: "28px 1fr 90px 140px 60px 100px 80px",
                        gap: "12px",
                      }}
                    >
                      {/* Status dot */}
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          background:
                            s.riskLevel === "critical" || s.riskLevel === "high"
                              ? "var(--critical)"
                              : s.riskLevel === "medium"
                                ? "var(--warn)"
                                : "var(--ok)",
                        }}
                      />
                      {/* Name */}
                      <div className="min-w-0">
                        <span
                          className="text-[13px] font-medium"
                          style={{ color: "var(--ink)" }}
                        >
                          {s.name}
                        </span>
                        {s.notes && (
                          <div
                            className="text-[11.5px] truncate mt-0.5"
                            style={{ color: "var(--ink-3)" }}
                          >
                            {s.notes}
                          </div>
                        )}
                      </div>
                      {/* ID */}
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: "var(--ink-4)" }}
                      >
                        {s.id.slice(0, 8)}
                      </span>
                      {/* Region */}
                      <div
                        className="flex items-center gap-1 text-[12.5px]"
                        style={{ color: "var(--ink-2)" }}
                      >
                        <Globe2 className="h-3 w-3 shrink-0" style={{ color: "var(--ink-4)" }} />
                        <span className="truncate">
                          {s.country} · {s.region}
                        </span>
                      </div>
                      {/* Tier */}
                      <span
                        className="font-mono text-[11px] rounded px-1.5 py-0.5 w-fit"
                        style={{
                          border: "1px solid var(--border)",
                          background: "var(--surface-2)",
                          color: "var(--ink-3)",
                        }}
                      >
                        T{s.tier}
                      </span>
                      {/* Risk */}
                      <RiskBadge severity={s.riskLevel} />
                      {/* Alerts */}
                      <span
                        className="font-mono text-[12px] font-medium"
                        style={{ color: hasAlerts ? "var(--critical)" : "var(--ink-4)" }}
                      >
                        {hasAlerts ? `${s.alerts.length} open` : "—"}
                      </span>
                    </div>

                    {/* Expanded details */}
                    <div
                      className="px-4 pb-3"
                      style={{ paddingLeft: "calc(28px + 12px + 16px)" }}
                    >
                      {/* Categories */}
                      {parseList<string>(s.categories).length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {parseList<string>(s.categories).map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center gap-0.5 font-mono text-[9.5px] uppercase tracking-wider rounded px-1.5 py-px"
                              style={{
                                border: "1px solid var(--border)",
                                background: "var(--surface-2)",
                                color: "var(--ink-4)",
                              }}
                            >
                              <Layers className="h-2.5 w-2.5" />
                              {c}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* On-call contacts */}
                      {s.contacts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          {s.contacts
                            .slice()
                            .sort((a, b) => a.contact.escalation - b.contact.escalation)
                            .slice(0, 3)
                            .map((cs) => (
                              <span
                                key={cs.contactId}
                                className="flex items-center gap-1.5 text-[11.5px]"
                                style={{ color: "var(--ink-3)" }}
                              >
                                <UserCircle2
                                  className="h-3.5 w-3.5"
                                  style={{ color: "var(--iris)" }}
                                />
                                <span style={{ color: "var(--ink)", fontWeight: 500 }}>
                                  {cs.contact.name}
                                </span>
                                <span style={{ color: "var(--ink-4)" }}>
                                  · {cs.contact.role}
                                </span>
                                <span
                                  className="font-mono text-[9.5px] rounded px-1 py-px"
                                  style={{
                                    background: "var(--surface-3)",
                                    color: "var(--ink-4)",
                                  }}
                                >
                                  L{cs.contact.escalation}
                                </span>
                                {cs.contact.receiveCalls && (
                                  <Phone className="h-3 w-3" style={{ color: "var(--ok)" }} />
                                )}
                              </span>
                            ))}
                          {s.contacts.length > 3 && (
                            <span className="text-[11px]" style={{ color: "var(--ink-4)" }}>
                              +{s.contacts.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
