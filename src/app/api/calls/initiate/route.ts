import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { placeAlertCall } from "@/lib/vapi";
import { bus } from "@/lib/events";

export const dynamic = "force-dynamic";

const input = z.object({
  alertId: z.string(),
  contactId: z.string().optional(),
});

/**
 * POST /api/calls/initiate
 * Kick off an outbound voice agent call for the given alert.
 * If no contactId is provided, picks the lowest-escalation contact
 * mapped to the alert's supplier.
 */
export async function POST(req: NextRequest) {
  const parsed = input.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { alertId, contactId } = parsed.data;

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
  if (!alert) return NextResponse.json({ error: "alert not found" }, { status: 404 });

  const candidate = contactId
    ? alert.supplier.contacts.find((c) => c.contactId === contactId)?.contact
    : alert.supplier.contacts.find((c) => c.contact.receiveCalls)?.contact;

  if (!candidate) {
    return NextResponse.json(
      { error: "no callable contact mapped to supplier" },
      { status: 400 },
    );
  }

  // Pull every shipment that's either directly linked to this alert OR
  // belongs to the same supplier — gives the agent something concrete to reroute.
  const linkedShipments = [
    ...alert.shipments,
    ...alert.supplier.shipments.filter(
      (s) => !alert.shipments.some((x) => x.id === s.id),
    ),
  ];

  try {
    const vapi = await placeAlertCall({
      toPhone: candidate.phone,
      briefing: {
        alertId: alert.id,
        contactName: candidate.name,
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
        contactId: candidate.id,
        vapiCallId: vapi.id,
        status: vapi.status ?? "initiated",
      },
    });
    await db.alert.update({
      where: { id: alert.id },
      data: { status: "calling" },
    });
    bus.emit({ type: "call.started", callId: call.id, alertId: alert.id });
    bus.emit({
      type: "alert.updated",
      alertId: alert.id,
      status: "calling",
    });

    return NextResponse.json({ call, vapi });
  } catch (err) {
    const message = err instanceof Error ? err.message : "call failed";
    await db.call.create({
      data: {
        alertId: alert.id,
        contactId: candidate.id,
        status: "failed",
        transcript: `error: ${message}`,
      },
    });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
