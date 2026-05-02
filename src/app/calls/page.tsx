import { db } from "@/lib/db";
import { StatCard } from "@/components/stat-card";
import { shortRelTime } from "@/lib/utils";
import { Phone, Building2, UserCircle2, Clock, FileText, CheckCircle, XCircle, Headphones } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  const [calls, callsToday, resolved, avgDuration] = await Promise.all([
    db.call.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        contact: true,
        alert: { include: { supplier: true, news: true } },
      },
    }),
    db.call.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    db.call.count({
      where: { status: "completed", createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    db.call.aggregate({
      where: { status: "completed", durationSec: { not: null } },
      _avg: { durationSec: true },
    }),
  ]);

  const active = calls.filter((c) => c.status === "in-progress" || c.status === "ringing").length;
  const avgSec = avgDuration._avg.durationSec;
  const avgFmt = avgSec
    ? `${Math.floor(avgSec / 60)}:${String(Math.round(avgSec % 60)).padStart(2, "0")}`
    : "—";

  const outcomeColors: Record<string, string> = {
    completed: "var(--ok)",
    failed: "var(--critical)",
    "in-progress": "var(--iris)",
    ringing: "var(--warn)",
    cancelled: "var(--ink-4)",
  };

  return (
    <div className="flex flex-col">
      {/* ── KPI strip ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 p-6 pb-0 lg:grid-cols-4">
        <StatCard
          label="Calls last 24h"
          value={callsToday}
          delta={callsToday > 0 ? "+today" : undefined}
          deltaDir="up"
        />
        <StatCard
          label="Active now"
          value={active}
          accent={
            active > 0 ? (
              <span
                className="inline-flex items-center gap-1 font-mono text-[10.5px] rounded px-1.5 py-0.5"
                style={{
                  background: "var(--iris-bg)",
                  color: "var(--iris)",
                  border: "1px solid var(--iris-border)",
                }}
              >
                <span className="h-[5px] w-[5px] rounded-full pulse-ring" style={{ background: "var(--iris)" }} />
                live
              </span>
            ) : undefined
          }
        />
        <StatCard label="Avg duration" value={avgFmt} hint="completed calls" />
        <StatCard
          label="Resolved"
          value={resolved}
          delta={callsToday > 0 ? `${Math.round((resolved / callsToday) * 100)}% of today` : undefined}
          deltaDir="up"
        />
      </div>

      {/* ── Activity log ────────────────────────────────────────── */}
      <div className="p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
            Activity log
          </h2>
          <p className="text-[11.5px] mt-0.5" style={{ color: "var(--ink-3)" }}>
            Outbound briefings placed by Iris · most recent first
          </p>
        </div>

        {calls.length === 0 ? (
          <div
            className="rounded-lg px-6 py-12 text-center text-sm"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--ink-3)",
            }}
          >
            <Phone className="h-6 w-6 mx-auto mb-2 opacity-30" />
            No voice operations yet. Iris will log every dispatch here.
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
                gridTemplateColumns: "80px 100px 1fr 1fr 120px 80px",
                borderBottom: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: "var(--ink-4)",
                gap: "12px",
              }}
            >
              <span>Time</span>
              <span>Status</span>
              <span>Contact</span>
              <span>Supplier</span>
              <span>Duration</span>
              <span className="text-right">Outcome</span>
            </div>

            {calls.map((c, i) => {
              const statusColor = outcomeColors[c.status] ?? "var(--ink-4)";
              const StatusIcon =
                c.status === "completed"
                  ? CheckCircle
                  : c.status === "failed"
                    ? XCircle
                    : Phone;
              return (
                <details
                  key={c.id}
                  className="group"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                >
                  <summary
                    className="row-hover grid items-center px-4 py-3 cursor-pointer list-none"
                    style={{
                      gridTemplateColumns: "80px 100px 1fr 1fr 120px 80px",
                      gap: "12px",
                      background: "var(--surface)",
                    }}
                  >
                    {/* Time */}
                    <span className="font-mono text-[11px]" style={{ color: "var(--ink-4)" }}>
                      {shortRelTime(c.createdAt)}
                    </span>

                    {/* Status */}
                    <span
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium"
                      style={{ color: statusColor }}
                    >
                      <StatusIcon className="h-3 w-3 shrink-0" />
                      {c.status}
                    </span>

                    {/* Contact */}
                    <div
                      className="flex items-center gap-1.5 min-w-0 text-[12.5px]"
                      style={{ color: "var(--ink)" }}
                    >
                      <UserCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--iris)" }} />
                      <span className="font-medium truncate">{c.contact.name}</span>
                      <span className="truncate" style={{ color: "var(--ink-3)" }}>
                        · {c.contact.role}
                      </span>
                    </div>

                    {/* Supplier */}
                    <div
                      className="flex items-center gap-1 min-w-0 text-[12px]"
                      style={{ color: "var(--ink-3)" }}
                    >
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{c.alert.supplier.name}</span>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1 text-[11.5px]" style={{ color: "var(--ink-3)" }}>
                      {typeof c.durationSec === "number" ? (
                        <>
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="font-mono">{c.durationSec}s</span>
                        </>
                      ) : (
                        <span style={{ color: "var(--ink-4)" }}>—</span>
                      )}
                    </div>

                    {/* Outcome */}
                    <div className="text-right">
                      {c.outcome ? (
                        <span
                          className="font-mono text-[10.5px] uppercase tracking-wider rounded px-1.5 py-0.5"
                          style={{
                            background: "var(--iris-bg)",
                            color: "var(--iris)",
                            border: "1px solid var(--iris-border)",
                          }}
                        >
                          {c.outcome}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px]" style={{ color: "var(--ink-4)" }}>
                          —
                        </span>
                      )}
                    </div>
                  </summary>

                  {/* Expanded transcript */}
                  <div
                    className="grid grid-cols-1 gap-3 px-4 pb-4 pt-2 lg:grid-cols-2"
                    style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
                  >
                    <div
                      className="rounded-md p-3"
                      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                    >
                      <div
                        className="font-mono text-[10px] uppercase tracking-wider mb-1.5"
                        style={{ color: "var(--ink-4)" }}
                      >
                        briefing
                      </div>
                      <p className="text-[13px] font-medium mb-1" style={{ color: "var(--ink)" }}>
                        {c.alert.news.title}
                      </p>
                      <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink-3)" }}>
                        {c.alert.recommendation}
                      </p>
                    </div>
                    <div
                      className="rounded-md p-3"
                      style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                    >
                      <div
                        className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider mb-1.5"
                        style={{ color: "var(--ink-4)" }}
                      >
                        <FileText className="h-3 w-3" /> transcript
                      </div>
                      <pre className="max-h-48 overflow-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
                        style={{ color: "var(--ink-3)" }}>
                        {c.transcript ?? "— no transcript yet —"}
                      </pre>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
