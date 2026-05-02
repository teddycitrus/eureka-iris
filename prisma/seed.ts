import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  await db.call.deleteMany();
  await db.alert.deleteMany();
  await db.contactOnSupplier.deleteMany();
  await db.newsItem.deleteMany();
  await db.contact.deleteMany();
  await db.supplier.deleteMany();

  const suppliers = await Promise.all([
    db.supplier.create({
      data: {
        name: "Hsinchu Semiconductor Foundry",
        region: "East Asia",
        country: "Taiwan",
        latitude: 24.8138,
        longitude: 120.9675,
        categories: JSON.stringify(["semiconductors", "logic-ic"]),
        tier: 1,
        riskLevel: "high",
        notes: "Tier-1 fab — single source for 5nm SoC.",
      },
    }),
    db.supplier.create({
      data: {
        name: "Rotterdam Logistics Hub",
        region: "Western Europe",
        country: "Netherlands",
        latitude: 51.9244,
        longitude: 4.4777,
        categories: JSON.stringify(["logistics", "shipping", "ports"]),
        tier: 1,
        riskLevel: "medium",
        notes: "Primary EU import gateway.",
      },
    }),
    db.supplier.create({
      data: {
        name: "Hai Phong Assembly Co.",
        region: "Southeast Asia",
        country: "Vietnam",
        latitude: 20.8449,
        longitude: 106.6881,
        categories: JSON.stringify(["assembly", "electronics"]),
        tier: 2,
        riskLevel: "medium",
      },
    }),
    db.supplier.create({
      data: {
        name: "Atacama Lithium Mining",
        region: "South America",
        country: "Chile",
        latitude: -23.8634,
        longitude: -68.1323,
        categories: JSON.stringify(["raw-materials", "lithium", "battery"]),
        tier: 2,
        riskLevel: "high",
      },
    }),
  ]);

  const contacts = await Promise.all([
    db.contact.create({
      data: {
        name: "Priya Anand",
        role: "VP Operations",
        phone: "+15555550101",
        email: "priya@example.com",
        escalation: 1,
      },
    }),
    db.contact.create({
      data: {
        name: "Marcus Chen",
        role: "Procurement Lead",
        phone: "+15555550102",
        email: "marcus@example.com",
        escalation: 2,
      },
    }),
    db.contact.create({
      data: {
        name: "Sofia Reyes",
        role: "Logistics Manager",
        phone: "+15555550103",
        email: "sofia@example.com",
        escalation: 1,
      },
    }),
  ]);

  // Map contacts to suppliers
  const links: Array<{ contactId: string; supplierId: string }> = [
    { contactId: contacts[0].id, supplierId: suppliers[0].id },
    { contactId: contacts[0].id, supplierId: suppliers[3].id },
    { contactId: contacts[1].id, supplierId: suppliers[0].id },
    { contactId: contacts[1].id, supplierId: suppliers[2].id },
    { contactId: contacts[2].id, supplierId: suppliers[1].id },
    { contactId: contacts[2].id, supplierId: suppliers[2].id },
  ];
  for (const l of links) await db.contactOnSupplier.create({ data: l });

  // A couple of seeded news items + alerts so the dashboard isn't empty
  const news1 = await db.newsItem.create({
    data: {
      title: "Typhoon Hagibis disrupts shipping lanes off Taiwan strait",
      summary:
        "Major shipping carriers reroute around Taiwan strait following Cat-4 typhoon. Hsinchu industrial park reports 36-hour production halt at multiple fabs.",
      url: "https://example.com/news/typhoon-hagibis-taiwan",
      source: "Reuters",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      region: "East Asia",
      topics: JSON.stringify(["weather", "shipping", "semiconductors"]),
      riskScore: 0.84,
    },
  });

  const news2 = await db.newsItem.create({
    data: {
      title: "Chilean miners union announces 7-day strike at Atacama operations",
      summary:
        "SQM and Albemarle facilities affected. Union demands 12% wage increase. Lithium spot prices climb 4% on the news.",
      url: "https://example.com/news/chile-lithium-strike",
      source: "Bloomberg",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 14),
      region: "South America",
      topics: JSON.stringify(["labor", "lithium", "battery"]),
      riskScore: 0.71,
    },
  });

  await db.alert.create({
    data: {
      newsId: news1.id,
      supplierId: suppliers[0].id,
      severity: "high",
      status: "pending",
      recommendation:
        "Confirm wafer-out impact for next-week orders. Consider activating secondary fab in Singapore for 7nm allocations.",
    },
  });

  await db.alert.create({
    data: {
      newsId: news2.id,
      supplierId: suppliers[3].id,
      severity: "medium",
      status: "pending",
      recommendation:
        "Validate inventory cover (current: 18 days). Freeze new battery PO commitments until strike resolves.",
    },
  });

  console.log("Seeded:", {
    suppliers: suppliers.length,
    contacts: contacts.length,
    news: 2,
    alerts: 2,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
