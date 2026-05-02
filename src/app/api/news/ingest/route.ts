import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchSupplyChainNews } from "@/lib/news";
import { assessRisk } from "@/lib/risk";
import { severityFromScore } from "@/lib/utils";
import { bus } from "@/lib/events";
import { dispatchCallsForAlert } from "@/lib/dispatch";

export const dynamic = "force-dynamic";

/**
 * POST /api/news/ingest
 * Pulls supply-chain headlines, scores each against active suppliers,
 * persists news + alerts.
 *
 * Body: { query?: string, autoCall?: boolean }
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    query?: string;
    autoCall?: boolean;
  };
  const query =
    body.query ??
    "supply chain OR shipping OR tariff OR strike OR semiconductor OR port disruption";

  const suppliers = await db.supplier.findMany();
  const supplierCtx = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    region: s.region,
    country: s.country,
    categories: s.categories,
  }));

  const articles = await fetchSupplyChainNews(query);
  const created: { newsId: string; alertCount: number }[] = [];

  for (const a of articles) {
    const existing = await db.newsItem.findUnique({ where: { url: a.url } });
    if (existing) continue;

    const assessment = await assessRisk(
      { title: a.title, summary: a.summary, source: a.source },
      supplierCtx,
    );

    const news = await db.newsItem.create({
      data: {
        title: a.title,
        summary: a.summary,
        url: a.url,
        source: a.source,
        publishedAt: a.publishedAt,
        region: assessment.region,
        topics: JSON.stringify(assessment.topics),
        riskScore: assessment.riskScore,
      },
    });

    let alertCount = 0;
    const alertIds: string[] = [];
    if (assessment.riskScore >= 0.4 && assessment.affectedSupplierIds.length > 0) {
      const severity = severityFromScore(assessment.riskScore);
      for (const sid of assessment.affectedSupplierIds) {
        const createdAlert = await db.alert.create({
          data: {
            newsId: news.id,
            supplierId: sid,
            severity,
            recommendation: assessment.recommendation,
            status: "pending",
          },
        });
        bus.emit({
          type: "alert.created",
          alertId: createdAlert.id,
          supplierId: sid,
          severity,
        });
        alertIds.push(createdAlert.id);
        alertCount++;
      }
    }

    // Auto-dispatch outbound voice briefings for every new alert in parallel.
    // Errors per alert/contact are absorbed inside dispatchCallsForAlert.
    if (alertIds.length > 0) {
      await Promise.allSettled(alertIds.map((id) => dispatchCallsForAlert(id)));
    }

    created.push({ newsId: news.id, alertCount });
  }

  return NextResponse.json({ ingested: created.length, items: created });
}
