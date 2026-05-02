import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const supplierInput = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  country: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  categories: z.array(z.string()).default([]),
  tier: z.number().int().min(1).max(5).default(1),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).default("low"),
  notes: z.string().optional(),
});

export async function GET() {
  const suppliers = await db.supplier.findMany({
    include: { contacts: { include: { contact: true } }, alerts: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const parsed = supplierInput.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { categories, ...rest } = parsed.data;
  const created = await db.supplier.create({
    data: { ...rest, categories: JSON.stringify(categories) },
  });
  return NextResponse.json(created, { status: 201 });
}
