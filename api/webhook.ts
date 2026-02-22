import { Telegraf, Context } from "telegraf";
import { Update } from "telegraf/types";

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

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "");

/**
 * Handle incoming Telegram webhook updates
 * This allows for interactive commands like /help, /stats, etc.
 */
bot.command("start", (ctx: Context) => {
  ctx.reply(
    "👋 Welcome to Tech News Bot!\n\n" +
      "This bot sends you curated tech news summaries every 6 hours.\n\n" +
      "Commands:\n" +
      "/help - Show help message\n" +
      "/stats - Show recent article statistics\n" +
      "/news - Get latest news now (if available)"
  );
});

bot.command("help", (ctx: Context) => {
  ctx.reply(
    "📖 *Tech News Bot Help*\n\n" +
      "*About:*\n" +
      "This bot aggregates tech news from RSS feeds, processes them using AI, and sends daily summaries.\n\n" +
      "*How it works:*\n" +
      "1. Fetches articles from major tech sources\n" +
      "2. Summarizes using BART (Facebook's AI)\n" +
      "3. Analyzes sentiment (positive/negative/neutral)\n" +
      "4. Categorizes by tech topic (AI, Security, Web Dev, etc.)\n\n" +
      "*Update schedule:*\n" +
      "📅 Every 6 hours (4 times daily)\n\n" +
      "*Data sources:*\n" +
      "TechCrunch, Hacker News, Dev.to, Medium, and more...",
    { parse_mode: "Markdown" }
  );
});

bot.command("stats", (ctx: Context) => {
  ctx.reply(
    "📊 *Statistics*\n\n" +
      "_Note: Stats generation is coming soon_\n\n" +
      "Current features:\n" +
      "✅ News aggregation (14 sources)\n" +
      "✅ AI summarization\n" +
      "✅ Sentiment analysis\n" +
      "✅ Topic classification",
    { parse_mode: "Markdown" }
  );
});

bot.on("message", (ctx: Context) => {
  ctx.reply(
    "I'm a news bot! Use /help to see available commands, or just wait for the next news update."
  );
});

export default async (
  req: VercelRequest,
  res: VercelResponse
): Promise<void> => {
  try {
    // Handle Telegram webhook
    if (req.method === "POST") {
      const update: Update = req.body;

      if (update) {
        await bot.handleUpdate(update);
      }

      return res.status(200).json({ ok: true });
    }

    // Health check
    if (req.method === "GET") {
      return res.status(200).json({
        status: "ok",
        message: "Tech News Bot webhook is running",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({
      error: "Webhook processing failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
