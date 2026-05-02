import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { bus } from "@/lib/events";

export const dynamic = "force-dynamic";

const patchInput = z.object({
  status: z
    .enum(["on-track", "rerouted", "delayed", "held", "arrived"])
    .optional(),
  waypoints: z.array(z.tuple([z.number(), z.number()])).optional(),
  destLabel: z.string().optional(),
  destLat: z.number().optional(),
  destLng: z.number().optional(),
  etaAt: z.string().datetime().nullable().optional(),
  reason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const parsed = patchInput.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { waypoints, etaAt, reason: _reason, ...rest } = parsed.data;
  const updated = await db.shipment.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(waypoints && { waypoints: JSON.stringify(waypoints) }),
      ...(etaAt !== undefined && { etaAt: etaAt ? new Date(etaAt) : null }),
    },
  });
  bus.emit({
    type: "shipment.updated",
    shipmentId: updated.id,
    status: updated.status,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await db.shipment.delete({ where: { id: params.id } });
  bus.emit({ type: "shipment.updated", shipmentId: params.id, status: "deleted" });
  return NextResponse.json({ ok: true });
}
