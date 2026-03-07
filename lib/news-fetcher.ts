import Parser from "rss-parser";
import { newsSources } from "./news-sources.js";
import { processArticle } from "./huggingface-client.js";
import { sendNewsToTelegram, NewsMessage } from "./telegram-service.js";
import {
  articleExists,
  storeArticle,
  StoredArticle,
  getUserLanguage,
} from "./vercel-kv.js";

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

async function fetchFromRSSFeed(
  feedUrl: string,
  sourceName: string
): Promise<ParsedArticle[]> {
  try {
    console.log(`Fetching from ${sourceName}: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);

    const articles: ParsedArticle[] = (feed.items || [])
      .slice(0, 5)
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

async function processArticleWithNLP(
  article: ParsedArticle
): Promise<NewsMessage | null> {
  try {
    const exists = await articleExists(article.title, article.source);
    if (exists) {
      console.log(`Article already processed: ${article.title}`);
      return null;
    }

    console.log(`Processing: ${article.title}`);
    const processed = await processArticle(article.title, article.content);

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
      language: processed.language,
    };
  } catch (error) {
    console.error(`Error processing article: ${article.title}`, error);
    return null;
  }
}

export async function fetchAndSendNews(
  userId: string,
  targetChatId?: string
): Promise<{
  success: boolean;
  articlesFetched: number;
  articlesProcessed: number;
  articlesSent: number;
  message: string;
}> {
  try {
    console.log(`Fetching news for user: ${userId}`);
    const allArticles: ParsedArticle[] = [];

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
      return {
        success: true,
        articlesFetched: 0,
        articlesProcessed: 0,
        articlesSent: 0,
        message: "No articles fetched",
      };
    }

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

    const userLanguage = await getUserLanguage(userId);

    let articlesSent = 0;
    if (newsToSend.length > 0) {
      articlesSent = await sendNewsToTelegram(
        newsToSend,
        userLanguage,
        targetChatId
      );
    } else {
      console.log("No new articles to send");
    }

    return {
      success: true,
      articlesFetched: allArticles.length,
      articlesProcessed: newsToSend.length,
      articlesSent,
      message: "News cycle completed",
    };
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
}
