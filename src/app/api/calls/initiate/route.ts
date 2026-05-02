import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { placeAlertCall } from "@/lib/vapi";

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
      supplier: {
        include: {
          contacts: {
            include: { contact: true },
            orderBy: { contact: { escalation: "asc" } },
          },
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
