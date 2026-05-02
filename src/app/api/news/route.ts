import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await db.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
    take: 100,
    include: { alerts: { include: { supplier: true } } },
  });
  return NextResponse.json(items);
}
