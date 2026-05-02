import { db } from "./db";
import { placeAlertCall } from "./vapi";
import { bus } from "./events";

/**
 * Auto-dispatch outbound voice briefings to every callable contact mapped to
 * the supplier the alert points at. Used by the news-ingest and test-fire
 * routes so an event surfacing turns into a phone call without anyone
 * clicking anything in the UI.
 *
 * Returns a small summary so callers can include it in their response.
 * Errors per contact are caught individually — one failed dial does not
 * block the rest, and a "failed" Call row is still written for visibility.
 */
export async function dispatchCallsForAlert(alertId: string): Promise<{
  attempted: number;
  succeeded: number;
  failed: number;
  reason?: string;
}> {
  const alert = await db.alert.findUnique({
    where: { id: alertId },
    include: {
      news: true,
      shipments: true,
      supplier: {
        include: {
          contacts: {
            include: { contact: true },
            orderBy: { contact: { escalation: "asc" } },
          },
          shipments: { take: 5, orderBy: { updatedAt: "desc" } },
        },
      },
    },
  });

  if (!alert) return { attempted: 0, succeeded: 0, failed: 0, reason: "alert not found" };

  // Skip "low" — these are FYI items, not worth a phone call.
  if (alert.severity === "low") {
    return { attempted: 0, succeeded: 0, failed: 0, reason: "severity below threshold" };
  }

  const callable = alert.supplier.contacts
    .map((c) => c.contact)
    .filter((c) => c.receiveCalls);

  if (callable.length === 0) {
    return {
      attempted: 0,
      succeeded: 0,
      failed: 0,
      reason: "no callable contact mapped to supplier",
    };
  }

  // Linked shipments (alert-direct + supplier-recent, deduped) get passed
  // to the voice agent so the contact can ask for reroutes by reference.
  const linkedShipments = [
    ...alert.shipments,
    ...alert.supplier.shipments.filter(
      (s) => !alert.shipments.some((x) => x.id === s.id),
    ),
  ];

  const results = await Promise.allSettled(
    callable.map(async (contact) => {
      try {
        const vapi = await placeAlertCall({
          toPhone: contact.phone,
          briefing: {
            alertId: alert.id,
            contactName: contact.name,
            supplierName: alert.supplier.name,
            region: alert.supplier.region,
            severity: alert.severity,
            headline: alert.news.title,
            summary: alert.news.summary,
            recommendation: alert.recommendation,
            shipments: linkedShipments.map((s) => ({
              ref: s.ref,
              origin: s.originLabel,
              dest: s.destLabel,
              mode: s.mode,
              status: s.status,
              valueUSD: s.valueUSD,
            })),
          },
        });
        const call = await db.call.create({
          data: {
            alertId: alert.id,
            contactId: contact.id,
            vapiCallId: vapi.id,
            status: vapi.status ?? "initiated",
          },
        });
        bus.emit({ type: "call.started", callId: call.id, alertId: alert.id });
        return { ok: true as const };
      } catch (err) {
        const message = err instanceof Error ? err.message : "call failed";
        await db.call.create({
          data: {
            alertId: alert.id,
            contactId: contact.id,
            status: "failed",
            transcript: `error: ${message}`,
          },
        });
        return { ok: false as const, message };
      }
    }),
  );

  let succeeded = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.ok) succeeded++;
    else failed++;
  }

  if (succeeded > 0) {
    await db.alert.update({
      where: { id: alert.id },
      data: { status: "calling" },
    });
    bus.emit({ type: "alert.updated", alertId: alert.id, status: "calling" });
  }

  return { attempted: callable.length, succeeded, failed };
}
