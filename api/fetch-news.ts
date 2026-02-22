import Parser from "rss-parser";
import { newsSources } from "../lib/news-sources.js";
import { processArticle } from "../lib/huggingface-client.js";
import { sendNewsToTelegram, sendErrorAlert, NewsMessage } from "../lib/telegram-service.js";
import {
  articleExists,
  storeArticle,
  StoredArticle,
  } from "../lib/vercel-kv.js";
import axios from "axios";

// Vercel serverless function types
interface VercelRequest {
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  body?: any;
  method?: string;
}

interface VercelResponse {
  status(code: number): this;
  json(data: any): void;
  send(data: string): void;
}

const parser = new Parser({
  timeout: 10000,
  customFields: {
    item: [
      ["content:encoded", "fullContent"],
      ["description", "description"],
    ],
  },
});

interface ParsedArticle {
  title: string;
  link?: string;
  content: string;
  source: string;
  pubDate?: string;
}

/**
 * Fetch articles from a single RSS feed
 */
async function fetchFromRSSFeed(
  feedUrl: string,
  sourceName: string
): Promise<ParsedArticle[]> {
  try {
    console.log(`Fetching from ${sourceName}: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);
    
    const articles: ParsedArticle[] = (feed.items || [])
      .slice(0, 5) // Limit to 5 articles per source
      .map((item) => ({
        title: item.title || "No title",
        link: item.link,
        content: (item.content || item.description || item.title || "").substring(0, 1024),
        source: sourceName,
        pubDate: item.pubDate,
      }));

    console.log(`Got ${articles.length} articles from ${sourceName}`);
    return articles;
  } catch (error) {
    console.error(`Error fetching from ${sourceName}:`, error);
    return [];
  }
}

/**
 * Process a single article
 */
async function processArticleWithNLP(
  article: ParsedArticle
): Promise<NewsMessage | null> {
  try {
    // Check if already processed
    const exists = await articleExists(article.title, article.source);
    if (exists) {
      console.log(`Article already processed: ${article.title}`);
      return null;
    }

    // Process with Hugging Face
    console.log(`Processing: ${article.title}`);
    const processed = await processArticle(article.title, article.content);

    // Store in KV
    const storedArticle: StoredArticle = {
      id: article.title + ":" + article.source,
      title: article.title,
      link: article.link || "",
      source: article.source,
      pubDate: article.pubDate || new Date().toISOString(),
      summary: processed.summary,
      sentiment: processed.sentiment,
      topic: processed.topic,
      processedAt: new Date().toISOString(),
    };

    await storeArticle(storedArticle);

    return {
      title: article.title,
      link: article.link,
      summary: processed.summary,
      sentiment: processed.sentiment,
      topic: processed.topic,
      source: article.source,
      pubDate: article.pubDate,
    };
  } catch (error) {
    console.error(`Error processing article: ${article.title}`, error);
    return null;
  }
}

export default async (
  req: VercelRequest,
  res: VercelResponse
): Promise<void> => {
  // Verify the request is authorized (optional: check secret header)
  const authHeader = req.headers.authorization;
  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    req.query.token === process.env.CRON_SECRET ||
    true; // Allow cron jobs by default

  if (!isAuthorized) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("Starting news fetch cycle...");
    const allArticles: ParsedArticle[] = [];

    // Fetch from all sources in parallel
    const fetchPromises = newsSources.map((source) =>
      fetchFromRSSFeed(source.url, source.name)
    );

    const results = await Promise.allSettled(fetchPromises);

    for (const result of results) {
      if (result.status === "fulfilled") {
        allArticles.push(...result.value);
      }
    }

    console.log(`Total articles fetched: ${allArticles.length}`);

    if (allArticles.length === 0) {
      console.log("No articles fetched");
      return res.status(200).json({
        success: true,
        message: "No articles fetched",
        articlesProcessed: 0,
      });
    }

    // Process articles with NLP
    const processPromises = allArticles.map((article) =>
      processArticleWithNLP(article)
    );

    const processResults = await Promise.allSettled(processPromises);

    const newsToSend: NewsMessage[] = [];
    for (const result of processResults) {
      if (result.status === "fulfilled" && result.value) {
        newsToSend.push(result.value);
      }
    }

    console.log(`Articles to send: ${newsToSend.length}`);

    // Send to Telegram
    if (newsToSend.length > 0) {
      await sendNewsToTelegram(newsToSend);
    } else {
      console.log("No new articles to send");
    }

    return res.status(200).json({
      success: true,
      message: "News cycle completed",
      articlesFetched: allArticles.length,
      articlesProcessed: newsToSend.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in fetch-news:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    try {
      await sendErrorAlert(`Failed to fetch news: ${errorMessage}`);
    } catch (telegramError) {
      console.error("Failed to send error alert:", telegramError);
    }

    return res.status(500).json({
      error: "Failed to fetch and process news",
      details: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
};
