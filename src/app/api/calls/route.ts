import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const calls = await db.call.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      contact: true,
      alert: { include: { news: true, supplier: true } },
    },
  });
  return NextResponse.json(calls);
}
