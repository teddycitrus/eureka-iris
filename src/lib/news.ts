import { env } from "./env";

export type RawNews = {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: Date;
};

/**
 * Pull recent supply-chain-relevant headlines.
 * Falls back to a curated stub list when NEWSAPI_KEY isn't configured so the
 * dashboard still works in dev.
 */
export async function fetchSupplyChainNews(query: string): Promise<RawNews[]> {
  const key = env.newsApiKey();
  if (!key) return stubNews(query);

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("language", "en");
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", "20");

  const res = await fetch(url, {
    headers: { "X-Api-Key": key },
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    console.warn("newsapi error", res.status, await res.text());
    return [];
  }
  const data = (await res.json()) as {
    articles: Array<{
      title: string;
      description: string | null;
      url: string;
      source: { name: string };
      publishedAt: string;
    }>;
  };
  return data.articles.map((a) => ({
    title: a.title,
    summary: a.description ?? "",
    url: a.url,
    source: a.source?.name ?? "unknown",
    publishedAt: new Date(a.publishedAt),
  }));
}

function stubNews(query: string): RawNews[] {
  const now = Date.now();
  const base: RawNews[] = [
    {
      title: "Red Sea attacks force major carriers to reroute around Cape of Good Hope",
      summary:
        "Maersk, Hapag-Lloyd and CMA CGM extend Red Sea suspensions. Asia–Europe transit times increase 10–14 days; spot rates spike on Shanghai-Rotterdam lane.",
      url: `https://example.com/news/red-sea-rerouting?q=${encodeURIComponent(query)}`,
      source: "Lloyd's List",
      publishedAt: new Date(now - 1000 * 60 * 90),
    },
    {
      title: "Mexico tightens nearshore manufacturing tax incentive eligibility",
      summary:
        "Decree narrows IMMEX qualifying activities; semiconductor and EV component makers most exposed.",
      url: `https://example.com/news/mexico-immex?q=${encodeURIComponent(query)}`,
      source: "FT",
      publishedAt: new Date(now - 1000 * 60 * 60 * 5),
    },
    {
      title: "Drought lowers Panama Canal daily transits to 24, lowest level in a decade",
      summary:
        "ACP confirms further restrictions through Q1; LNG and container scheduling impact ongoing.",
      url: `https://example.com/news/panama-drought?q=${encodeURIComponent(query)}`,
      source: "Reuters",
      publishedAt: new Date(now - 1000 * 60 * 60 * 11),
    },
    {
      title: "Tariff hike on Chinese-origin lithium-ion cells finalized",
      summary:
        "USTR raises Section 301 duty to 25% effective in 60 days. Battery pack makers reassess sourcing.",
      url: `https://example.com/news/li-ion-tariffs?q=${encodeURIComponent(query)}`,
      source: "Bloomberg",
      publishedAt: new Date(now - 1000 * 60 * 60 * 26),
    },
  ];
  return base;
}
