import Parser from "rss-parser";
import axios from "axios";
import * as cheerio from "cheerio";
import { getDealSources } from "./deal-sources.js";
import { buildAffiliateUrl } from "./affiliate-utils.js";
import { articleExists, storeArticle, StoredArticle } from "./vercel-kv.js";
import { sendDealsToTelegram, DealMessage } from "./telegram-service.js";
import { sendDealsToWhatsApp } from "./whatsapp-service.js";
import { fetchAmazonDeals } from "./amazon-paapi.js";
import { updatePriceHistoryAndGetInsight } from "./deal-history.js";

interface FeedDeal {
  id?: string;
  title: string;
  source: string;
  link: string;
  snippet: string;
  imageUrl?: string;
  currentPrice?: number;
  originalPrice?: number;
  discountPercent?: number;
}

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["content:encoded", "encodedContent"],
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["description", "description"],
    ],
  },
});

function parsePrice(raw: string): number | undefined {
  const normalized = raw.replace(/,/g, "").trim();
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value)) return undefined;
  if (value <= 0) return undefined;
  return value;
}

function extractPrices(text: string): { currentPrice?: number; originalPrice?: number; discountPercent?: number } {
  const moneyMatches = [...text.matchAll(/(?:[$?]|USD\s?|INR\s?)(\d{1,6}(?:[.,]\d{1,2})?)/gi)];
  const prices = moneyMatches
    .map((match) => parsePrice(match[1]))
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);

  let currentPrice: number | undefined;
  let originalPrice: number | undefined;

  if (prices.length >= 2) {
    currentPrice = prices[0];
    originalPrice = prices[prices.length - 1];
  } else if (prices.length === 1) {
    currentPrice = prices[0];
  }

  let discountPercent: number | undefined;
  const explicitDiscount = text.match(/(\d{1,2})\s?%\s?(?:off|discount)/i);
  if (explicitDiscount) {
    discountPercent = Number.parseInt(explicitDiscount[1], 10);
  } else if (currentPrice && originalPrice && originalPrice > currentPrice) {
    discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  return { currentPrice, originalPrice, discountPercent };
}

function scoreDeal(deal: FeedDeal): number {
  const discountScore = deal.discountPercent ?? 0;
  const affordabilityScore = deal.currentPrice ? Math.max(0, 2000 - deal.currentPrice) / 100 : 0;
  return discountScore * 3 + affordabilityScore;
}

function resolveStableId(deal: FeedDeal): string {
  return deal.id || `${deal.source}:${deal.link || deal.title}`;
}

function qualifiesDeal(
  deal: FeedDeal,
  insights: { isThirtyDayLow: boolean }
): boolean {
  const minDiscount = Number.parseInt(process.env.MIN_DISCOUNT_PERCENT || "60", 10);
  const minKnownDiscount = Number.isFinite(minDiscount) ? minDiscount : 60;
  const hasHighDiscount = (deal.discountPercent || 0) >= minKnownDiscount;
  return hasHighDiscount || insights.isThirtyDayLow;
}

function scoreQualifiedDeal(
  deal: FeedDeal,
  insights: { isThirtyDayLow: boolean; thirtyDayLowPrice?: number }
): number {
  const base = scoreDeal(deal);
  const lowBonus = insights.isThirtyDayLow ? 250 : 0;
  const confidenceBonus = insights.thirtyDayLowPrice ? 20 : 0;
  return base + lowBonus + confidenceBonus;
}

function parseImageFromItem(item: any): string | undefined {
  const mediaContent = item.mediaContent;
  if (Array.isArray(mediaContent) && mediaContent.length > 0 && mediaContent[0].$?.url) {
    return mediaContent[0].$.url;
  }

  const mediaThumbnail = item.mediaThumbnail;
  if (Array.isArray(mediaThumbnail) && mediaThumbnail.length > 0 && mediaThumbnail[0].$?.url) {
    return mediaThumbnail[0].$.url;
  }

  if (item.enclosure?.url) {
    return item.enclosure.url;
  }

  return undefined;
}

async function fetchOpenGraphImage(url: string): Promise<string | undefined> {
  try {
    const response = await axios.get(url, { timeout: 12000 });
    const $ = cheerio.load(response.data);
    const og = $("meta[property='og:image']").attr("content") || $("meta[name='twitter:image']").attr("content");
    return og || undefined;
  } catch {
    return undefined;
  }
}

async function fetchDealsFromSource(url: string, source: string): Promise<FeedDeal[]> {
  try {
    const feed = await parser.parseURL(url);

    const deals: FeedDeal[] = [];
    for (const item of (feed.items || []).slice(0, 30)) {
      if (!item.link || !item.title) {
        continue;
      }

      const description = (item.description || (item as any).encodedContent || item.content || "") as string;
      const mergedText = `${item.title} ${description}`;
      const pricing = extractPrices(mergedText);

      if (!pricing.currentPrice && !pricing.discountPercent) {
        continue;
      }

      deals.push({
        title: item.title,
        source,
        link: item.link,
        snippet: cheerio.load(`<div>${description}</div>`).text().slice(0, 300),
        imageUrl: parseImageFromItem(item as any),
        currentPrice: pricing.currentPrice,
        originalPrice: pricing.originalPrice,
        discountPercent: pricing.discountPercent,
      });
    }

    return deals;
  } catch (error) {
    console.error(`Failed to fetch deals from ${source}:`, error);
    return [];
  }
}

async function normalizeDeal(
  deal: FeedDeal,
  insights: { isThirtyDayLow: boolean; thirtyDayLowPrice?: number }
): Promise<DealMessage | null> {
  const exists = await articleExists(deal.title, deal.source);
  if (exists) {
    return null;
  }

  const imageUrl = deal.imageUrl || (await fetchOpenGraphImage(deal.link));
  const affiliateUrl = buildAffiliateUrl(deal.link);

  const stored: StoredArticle = {
    id: `${deal.source}:${deal.title}`,
    title: deal.title,
    link: deal.link,
    source: deal.source,
    pubDate: new Date().toISOString(),
    summary: deal.snippet,
    sentiment: "neutral",
    topic: "deal",
    processedAt: new Date().toISOString(),
  };

  await storeArticle(stored);

  return {
    id: stored.id,
    title: deal.title,
    source: deal.source,
    productUrl: deal.link,
    affiliateUrl,
    imageUrl,
    currentPrice: deal.currentPrice,
    originalPrice: deal.originalPrice,
    discountPercent: deal.discountPercent,
    isThirtyDayLow: insights.isThirtyDayLow,
    thirtyDayLowPrice: insights.thirtyDayLowPrice,
  };
}

export async function fetchAndSendDeals(): Promise<{
  success: boolean;
  dealsFetched: number;
  dealsSelected: number;
  telegramPosted: number;
  whatsappPosted: number;
  message: string;
}> {
  const sources = getDealSources();
  const maxDeals = Number.parseInt(process.env.DAILY_DEALS_LIMIT || "8", 10);

  const amazonDeals = await fetchAmazonDeals();

  const fetched = await Promise.all(
    sources.map((source) => fetchDealsFromSource(source.url, source.name))
  );

  const combined = fetched.flat();
  for (const amazonDeal of amazonDeals) {
    combined.push({
      id: amazonDeal.id,
      title: amazonDeal.title,
      source: amazonDeal.source,
      link: amazonDeal.productUrl,
      snippet: "Top Amazon affiliate deal",
      imageUrl: amazonDeal.imageUrl,
      currentPrice: amazonDeal.currentPrice,
      originalPrice: amazonDeal.originalPrice,
      discountPercent: amazonDeal.discountPercent,
    });
  }
  const unique = new Map<string, FeedDeal>();
  for (const deal of combined) {
    const key = resolveStableId(deal);
    if (!unique.has(key)) {
      unique.set(key, deal);
    }
  }

  const qualified: Array<{
    deal: FeedDeal;
    insights: { isThirtyDayLow: boolean; thirtyDayLowPrice?: number };
    score: number;
  }> = [];
  for (const deal of unique.values()) {
    const insights = await updatePriceHistoryAndGetInsight(resolveStableId(deal), deal.currentPrice);
    if (!qualifiesDeal(deal, insights)) {
      continue;
    }
    qualified.push({
      deal,
      insights,
      score: scoreQualifiedDeal(deal, insights),
    });
  }

  qualified.sort((a, b) => b.score - a.score);
  const selected = qualified.slice(0, maxDeals);

  const normalizedDeals = (
    await Promise.all(selected.map(({ deal, insights }) => normalizeDeal(deal, insights)))
  ).filter((deal): deal is DealMessage => Boolean(deal));

  const telegramPosted = await sendDealsToTelegram(normalizedDeals);
  const whatsappPosted = await sendDealsToWhatsApp(normalizedDeals);

  return {
    success: true,
    dealsFetched: combined.length,
    dealsSelected: normalizedDeals.length,
    telegramPosted,
    whatsappPosted,
    message: normalizedDeals.length
      ? "Daily deals published successfully"
      : "No new qualified deals found",
  };
}
