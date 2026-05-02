import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const contactInput = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  phone: z.string().regex(/^\+\d{6,15}$/, "phone must be E.164"),
  email: z.string().email().optional(),
  receiveCalls: z.boolean().default(true),
  escalation: z.number().int().min(1).max(5).default(1),
  supplierIds: z.array(z.string()).default([]),
});

export async function GET() {
  const contacts = await db.contact.findMany({
    include: { suppliers: { include: { supplier: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const parsed = contactInput.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { supplierIds, ...rest } = parsed.data;
  const created = await db.contact.create({
    data: {
      ...rest,
      suppliers: { create: supplierIds.map((sid) => ({ supplierId: sid })) },
    },
  });
  return NextResponse.json(created, { status: 201 });
}
