import { db } from "@/lib/db";
import { parseList, severityFromScore, shortRelTime } from "@/lib/utils";
import { RiskBadge } from "@/components/risk-badge";
import { StatCard } from "@/components/stat-card";
import { ExternalLink, Globe2, Radio } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SignalsPage() {
  const [items, totalSources, activeAlerts] = await Promise.all([
    db.newsItem.findMany({
      orderBy: { publishedAt: "desc" },
      take: 100,
      include: { alerts: { include: { supplier: true } } },
    }),
    db.newsItem.findMany({ select: { source: true }, distinct: ["source"] }).then((r) => r.length),
    db.alert.count({ where: { status: { not: "dismissed" } } }),
    Promise.resolve(null),
  ]);

  const highRisk = items.filter((i) => i.riskScore >= 0.65).length;

  return (
    <div className="flex flex-col">
      {/* ── KPI strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 p-6 pb-0 lg:grid-cols-4">
        <StatCard label="Signals indexed" value={items.length} hint="last 100" />
        <StatCard
          label="Active sources"
          value={totalSources}
          accent={
            <span
              className="font-mono text-[10.5px] rounded px-1.5 py-0.5"
              style={{
                background: "var(--ok-bg)",
                color: "var(--ok)",
                border: "1px solid oklch(0.85 0.08 155)",
              }}
            >
              online
            </span>
          }
        />
        <StatCard label="High-risk signals" value={highRisk} hint="score ≥ 0.65" />
        <StatCard label="Generated alerts" value={activeAlerts} hint="active" />
      </div>

      {/* ── Signal feed ────────────────────────────────────────── */}
      <div className="p-6 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
              Live signal feed
            </h2>
            <p className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-3)" }}>
              {items.length} items · scored for supply-chain relevance
            </p>
          </div>
          <form action="/api/news/ingest" method="post">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
              style={{
                border: "1px solid var(--border-strong)",
                background: "var(--surface)",
                color: "var(--ink-2)",
              }}
            >
              Ingest now
            </button>
          </form>
        </div>

        {/* Table */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}
        >
          {/* Column headers */}
          <div
            className="grid px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.04em]"
            style={{
              gridTemplateColumns: "80px 100px 120px 1fr 100px 80px",
              borderBottom: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--ink-4)",
            }}
          >
            <span>Time</span>
            <span>Severity</span>
            <span>Source</span>
            <span>Signal</span>
            <span>Region</span>
            <span className="text-right">Linked</span>
          </div>

          {items.length === 0 ? (
            <div
              className="px-6 py-12 text-center text-sm"
              style={{ background: "var(--surface)", color: "var(--ink-3)" }}
            >
              <Radio className="h-6 w-6 mx-auto mb-2 opacity-30" />
              No signals yet. Click &ldquo;Ingest now&rdquo; to fetch the latest feed.
            </div>
          ) : (
            items.map((n, i) => {
              const sev = severityFromScore(n.riskScore);
              return (
                <div
                  key={n.id}
                  className="row-hover grid items-start px-4 py-3"
                  style={{
                    gridTemplateColumns: "80px 100px 120px 1fr 100px 80px",
                    borderTop: i === 0 ? "none" : "1px solid var(--border)",
                    background: "var(--surface)",
                    gap: "12px",
                  }}
                >
                  <span className="font-mono text-[11px] pt-0.5" style={{ color: "var(--ink-3)" }}>
                    {shortRelTime(n.publishedAt)}
                  </span>
                  <div className="pt-0.5">
                    <RiskBadge severity={sev} />
                  </div>
                  <span className="text-[12.5px] pt-0.5" style={{ color: "var(--ink-2)" }}>
                    {n.source}
                  </span>
                  <div className="min-w-0">
                    <div
                      className="text-[13px] font-medium mb-0.5"
                      style={{ color: "var(--ink)" }}
                    >
                      {n.title}
                    </div>
                    <div
                      className="text-[12px] line-clamp-1"
                      style={{ color: "var(--ink-3)" }}
                    >
                      {n.summary}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {parseList<string>(n.topics)
                        .slice(0, 4)
                        .map((t) => (
                          <span
                            key={t}
                            className="font-mono text-[9.5px] uppercase tracking-wider rounded px-1 py-px"
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
                  </div>
                  <div className="flex items-center gap-1 pt-0.5 text-[11.5px]" style={{ color: "var(--ink-3)" }}>
                    {n.region && (
                      <>
                        <Globe2 className="h-3 w-3 shrink-0" />
                        <span>{n.region}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-0.5">
                    {n.alerts.length > 0 && (
                      <span
                        className="font-mono text-[11px] font-medium"
                        style={{ color: "var(--iris)" }}
                      >
                        {n.alerts.length} alert{n.alerts.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center transition-opacity hover:opacity-70"
                      style={{ color: "var(--ink-4)" }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
