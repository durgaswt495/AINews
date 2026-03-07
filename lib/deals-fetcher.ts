import Parser from "rss-parser";

export interface DealItem {
  title: string;
  link: string;
  source: string;
  priceInr?: number;
}

interface DealSource {
  name: string;
  url: string;
}

const parser = new Parser({ timeout: 10000 });

function getDealSources(): DealSource[] {
  const raw = process.env.DEAL_FEEDS || "";
  const urls = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return urls.map((url, idx) => ({
    name: `Deal Feed ${idx + 1}`,
    url,
  }));
}

function isAmazonIndiaLink(link?: string): link is string {
  if (!link) return false;
  try {
    const url = new URL(link);
    const host = url.hostname.toLowerCase();
    return host === "amazon.in" || host === "www.amazon.in" || host.endsWith(".amazon.in");
  } catch {
    return false;
  }
}

function extractInrPrice(text: string): number | undefined {
  const match = text.match(/(?:\u20B9|Rs\.?\s?)(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)/i);
  if (!match?.[1]) return undefined;
  const normalized = match[1].replace(/,/g, "");
  const price = Number.parseFloat(normalized);
  return Number.isFinite(price) ? price : undefined;
}

function uniqueByLink(items: DealItem[]): DealItem[] {
  const byLink = new Map<string, DealItem>();
  for (const item of items) {
    if (!byLink.has(item.link)) {
      byLink.set(item.link, item);
    }
  }
  return Array.from(byLink.values());
}

export async function fetchAmazonIndiaDeals(maxItems = 8): Promise<DealItem[]> {
  const sources = getDealSources();
  if (sources.length === 0) {
    return [];
  }

  const all: DealItem[] = [];

  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const feed = await parser.parseURL(source.url);
      const deals: DealItem[] = [];

      for (const item of feed.items || []) {
        if (!isAmazonIndiaLink(item.link)) {
          continue;
        }

        const title = item.title || "Amazon India deal";
        const body = `${title} ${item.content || item.contentSnippet || item.summary || ""}`;

        deals.push({
          title,
          link: item.link,
          source: source.name,
          priceInr: extractInrPrice(body),
        });
      }

      return deals;
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      all.push(...result.value);
    }
  }

  const unique = uniqueByLink(all);

  unique.sort((a, b) => {
    if (a.priceInr && b.priceInr) return a.priceInr - b.priceInr;
    if (a.priceInr) return -1;
    if (b.priceInr) return 1;
    return a.title.localeCompare(b.title);
  });

  return unique.slice(0, maxItems);
}
