import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { bus } from "@/lib/events";

export const dynamic = "force-dynamic";

const shipmentInput = z.object({
  ref: z.string().min(1),
  mode: z.enum(["ocean", "air", "rail", "truck"]).default("ocean"),
  originLabel: z.string().min(1),
  originLat: z.number(),
  originLng: z.number(),
  destLabel: z.string().min(1),
  destLat: z.number(),
  destLng: z.number(),
  waypoints: z.array(z.tuple([z.number(), z.number()])).default([]),
  valueUSD: z.number().optional(),
  etaAt: z.string().datetime().optional(),
  supplierId: z.string().optional(),
  alertId: z.string().optional(),
});

export async function GET() {
  const shipments = await db.shipment.findMany({
    orderBy: { updatedAt: "desc" },
    include: { supplier: true, alert: true },
  });
  return NextResponse.json(shipments);
}

export async function POST(req: NextRequest) {
  const parsed = shipmentInput.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { waypoints, etaAt, ...rest } = parsed.data;
  const created = await db.shipment.create({
    data: {
      ...rest,
      waypoints: JSON.stringify(waypoints),
      etaAt: etaAt ? new Date(etaAt) : undefined,
    },
  });
  bus.emit({ type: "shipment.created", shipmentId: created.id });
  return NextResponse.json(created, { status: 201 });
}
