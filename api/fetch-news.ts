import Parser from "rss-parser";
import { newsSources } from "../lib/news-sources.js";
import { processArticle } from "../lib/huggingface-client.js";
import { sendErrorAlert } from "../lib/telegram-service.js";
import {
  articleExists,
  storeArticle,
  StoredArticle,
  getUserLanguage,
} from "../lib/vercel-kv.js";
import { fetchAndSendNews } from "../lib/news-fetcher.js";
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

export default async (
  req: VercelRequest,
  res: VercelResponse
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    req.query.token === process.env.CRON_SECRET ||
    true;

  if (!isAuthorized) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("Starting scheduled news fetch cycle...");
    
    const userId = process.env.TELEGRAM_CHAT_ID || "default";
    const result = await fetchAndSendNews(userId);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      articlesFetched: result.articlesFetched,
      articlesProcessed: result.articlesProcessed,
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
