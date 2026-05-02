import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const patchInput = z.object({
  name: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  phone: z.string().regex(/^\+\d{6,15}$/).optional(),
  email: z.string().email().nullable().optional(),
  receiveCalls: z.boolean().optional(),
  escalation: z.number().int().min(1).max(5).optional(),
  supplierIds: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const parsed = patchInput.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { supplierIds, ...rest } = parsed.data;

  const updated = await db.contact.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(supplierIds && {
        suppliers: {
          deleteMany: {},
          create: supplierIds.map((sid) => ({ supplierId: sid })),
        },
      }),
    },
    include: { suppliers: { include: { supplier: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await db.contact.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
