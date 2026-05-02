/**
 * CLI helper: pull news + score against suppliers, no server required.
 *   tsx scripts/ingest.ts "supply chain OR shipping OR tariff"
 */
import { db } from "../src/lib/db";
import { fetchSupplyChainNews } from "../src/lib/news";
import { assessRisk } from "../src/lib/risk";
import { severityFromScore } from "../src/lib/utils";

async function main() {
  const query =
    process.argv.slice(2).join(" ") ||
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
  let ingested = 0;
  let alerts = 0;

  for (const a of articles) {
    if (await db.newsItem.findUnique({ where: { url: a.url } })) continue;
    const r = await assessRisk(
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
        region: r.region,
        topics: JSON.stringify(r.topics),
        riskScore: r.riskScore,
      },
    });
    ingested++;
    if (r.riskScore >= 0.4) {
      for (const sid of r.affectedSupplierIds) {
        await db.alert.create({
          data: {
            newsId: news.id,
            supplierId: sid,
            severity: severityFromScore(r.riskScore),
            recommendation: r.recommendation,
          },
        });
        alerts++;
      }
    }
  }

  console.log(`ingested=${ingested} alerts=${alerts}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
