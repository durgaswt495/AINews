import Parser from "rss-parser";
import axios from "axios";
import * as cheerio from "cheerio";

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
const defaultDealFeeds: DealSource[] = [
  {
    name: "DealDump Electronics",
    url: "https://dealdump.com/category.php?cat=electronics&format=rss",
  },
  {
    name: "DealDump Lightning Deals",
    url: "https://dealdump.com/category.php?cat=deals-collection-lightning-deals&format=rss",
  },
  {
    name: "DealDump Top 100",
    url: "https://dealdump.com/category.php?cat=deals-collection-top-100&format=rss",
  },
];

function getDealSources(): DealSource[] {
  const raw = process.env.DEAL_FEEDS || "";
  const urls = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (urls.length === 0) {
    return defaultDealFeeds;
  }

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

async function resolveAmazonIndiaLink(candidate?: string): Promise<string | undefined> {
  if (!candidate) return undefined;

  if (isAmazonIndiaLink(candidate)) {
    return candidate;
  }

  try {
    const response = await axios.get(candidate, {
      timeout: 10000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DealBot/1.0)",
      },
    });

    const finalUrl = response.request?.res?.responseUrl || candidate;
    if (isAmazonIndiaLink(finalUrl)) {
      return finalUrl;
    }

    const html = typeof response.data === "string" ? response.data : "";
    if (!html) return undefined;

    const $ = cheerio.load(html);
    const hrefs = new Set<string>();

    $("a[href]").each((_, element) => {
      const href = $(element).attr("href");
      if (href) hrefs.add(href);
    });

    for (const href of hrefs) {
      try {
        const absolute = new URL(href, finalUrl).toString();
        if (isAmazonIndiaLink(absolute)) {
          return absolute;
        }
      } catch {
        continue;
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
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
        const resolvedLink = await resolveAmazonIndiaLink(item.link);
        if (!resolvedLink) {
          continue;
        }

        const title = item.title || "Amazon India deal";
        const body = `${title} ${item.content || item.contentSnippet || item.summary || ""}`;

        deals.push({
          title,
          link: resolvedLink,
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

export async function fetchAndSendDeals(): Promise<{
  success: boolean;
  dealsFetched: number;
  dealsSelected: number;
  telegramPosted: number;
  whatsappPosted: number;
  message: string;
}> {
  const maxItems = Number.parseInt(process.env.DAILY_DEALS_LIMIT || "8", 10);
  const deals = await fetchAmazonIndiaDeals(maxItems);

  return {
    success: true,
    dealsFetched: deals.length,
    dealsSelected: deals.length,
    telegramPosted: 0,
    whatsappPosted: 0,
    message: deals.length
      ? "Deals fetched successfully"
      : "No Amazon India deals found in configured/default feeds",
  };
}

// Backward-compatible alias for typo variants used in some imports.
export const fetchAndSendDetails = fetchAndSendDeals;
