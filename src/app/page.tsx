import { db } from "@/lib/db";
import { Topbar } from "@/components/topbar";
import { StatCard } from "@/components/stat-card";
import { RiskBadge } from "@/components/risk-badge";
import { IrisMark } from "@/components/iris-mark";
import { TestFireButton } from "@/components/test-fire-button";
import { parseList, shortRelTime } from "@/lib/utils";
import { Building2, Siren, PhoneCall, Radio, ArrowUpRight, Globe2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Pulse() {
  const [supplierCount, contactCount, alertsPending, callsToday, recentAlerts, recentCalls] =
    await Promise.all([
      db.supplier.count(),
      db.contact.count(),
      db.alert.count({ where: { status: { in: ["pending", "calling"] } } }),
      db.call.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      db.alert.findMany({
        where: { status: { in: ["pending", "calling", "escalated"] } },
        include: { news: true, supplier: true },
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
        take: 6,
      }),
      db.call.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { contact: true, alert: { include: { supplier: true } } },
      }),
    ]);

  return (
    <div className="flex flex-col">
      <Topbar
        title="Pulse"
        subtitle="Live view of supply-chain signals, exposures, and active voice operations."
      />

      <div className="space-y-8 p-8">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="suppliers monitored" value={supplierCount} icon={Building2} accent="iris" />
          <StatCard
            label="open alerts"
            value={alertsPending}
            hint="awaiting decision"
            icon={Siren}
            accent="rose"
          />
          <StatCard
            label="calls last 24h"
            value={callsToday}
            hint="voice-agent dispatches"
            icon={PhoneCall}
            accent="cyan"
          />
          <StatCard label="contacts on call-tree" value={contactCount} icon={Radio} accent="amber" />
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Hero panel: live agent state */}
          <div className="glass relative overflow-hidden rounded-3xl p-6 xl:col-span-2">
            <div className="absolute inset-0 bg-iris-glow opacity-60" aria-hidden />
            <div className="relative flex items-start gap-4">
              <div className="rounded-2xl border border-iris-500/30 bg-bg-card/70 p-3">
                <IrisMark className="h-9 w-9" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-[0.22em] text-iris-200">
                  iris voice agent · armed
                </p>
                <h2 className="mt-1 font-display text-2xl text-ink">
                  When a high-severity signal lands, I dial the right human.
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
                  Iris scores every news item against your supplier graph. Anything ≥ <span className="text-iris-200">high</span>{" "}
                  triggers an outbound voice briefing — captured, transcribed, and routed back into the alert as a decision.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href="/alerts"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-iris-500 px-3.5 py-2 text-sm font-medium text-white shadow-glow hover:bg-iris-400"
                  >
                    Review alert queue
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <form action="/api/news/ingest" method="post">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-bg-raised/60 px-3.5 py-2 text-sm text-ink-muted hover:border-iris-500/40 hover:text-ink"
                    >
                      Pull latest signals
                    </button>
                  </form>
                  <TestFireButton redirect />
                </div>
              </div>
            </div>
          </div>

          {/* Recent calls stream */}
          <div className="glass rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg text-ink">Voice ops · stream</h3>
              <Link href="/calls" className="text-xs text-iris-300 hover:text-iris-200">
                full log →
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {recentCalls.length === 0 && (
                <li className="text-sm text-ink-muted">No calls yet. Trigger one from the alerts page.</li>
              )}
              {recentCalls.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border border-line/60 bg-bg-card/40 p-3"
                >
                  <span
                    className={`mt-1 h-2 w-2 rounded-full ${
                      c.status === "completed"
                        ? "bg-risk-low"
                        : c.status === "failed"
                          ? "bg-risk-critical"
                          : "bg-accent-cyan animate-pulse-soft"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-ink">
                      {c.contact.name} · <span className="text-ink-muted">{c.alert.supplier.name}</span>
                    </div>
                    <div className="text-xs text-ink-dim">
                      {c.status}
                      {c.outcome ? ` · ${c.outcome}` : ""} · {shortRelTime(c.createdAt)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg text-ink">Open alerts</h3>
              <p className="text-xs text-ink-muted">Highest severity first.</p>
            </div>
            <Link href="/alerts" className="text-sm text-iris-300 hover:text-iris-200">
              all alerts →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentAlerts.length === 0 && (
              <div className="glass rounded-2xl p-6 text-sm text-ink-muted">
                No active alerts. The world is quiet — for now.
              </div>
            )}
            {recentAlerts.map((a) => (
              <Link
                key={a.id}
                href={`/alerts#${a.id}`}
                className="glass group rounded-2xl p-5 transition hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <RiskBadge severity={a.severity} />
                  <span className="text-[11px] text-ink-dim">{shortRelTime(a.createdAt)}</span>
                </div>
                <h4 className="mt-3 line-clamp-2 font-display text-base text-ink group-hover:text-iris-100">
                  {a.news.title}
                </h4>
                <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{a.recommendation}</p>
                <div className="mt-4 flex items-center gap-3 text-xs text-ink-dim">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {a.supplier.name}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Globe2 className="h-3 w-3" />
                    {a.supplier.region}
                  </span>
                  <span className="ml-auto text-iris-300">{a.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {parseList<string>(a.news.topics)
                    .slice(0, 3)
                    .map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-line bg-bg-raised/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-muted"
                      >
                        {t}
                      </span>
                    ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
