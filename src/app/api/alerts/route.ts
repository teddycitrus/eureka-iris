import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const alerts = await db.alert.findMany({
    where: status ? { status } : undefined,
    include: {
      news: true,
      supplier: { include: { contacts: { include: { contact: true } } } },
      calls: { include: { contact: true } },
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    take: 200,
  });
  return NextResponse.json(alerts);
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as {
    id: string;
    status?: string;
    decision?: string;
    decisionMaker?: string;
  };
  if (!body.id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const updated = await db.alert.update({
    where: { id: body.id },
    data: {
      status: body.status,
      decision: body.decision,
      decisionMaker: body.decisionMaker,
    },
  });
  return NextResponse.json(updated);
}
