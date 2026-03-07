import { Telegraf, Context } from "telegraf";
import { Update } from "telegraf/types";
import { 
  SUPPORTED_LANGUAGES, 
  getLanguageInfo, 
  formatLanguageList 
} from "../lib/language-service.js";
import { 
  getUserLanguage, 
  setUserLanguage 
} from "../lib/vercel-kv.js";

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
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "";

function escapeMarkdownV2(input: string): string {
  return input.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}

/**
 * Handle incoming Telegram webhook updates
 * This allows for interactive commands like /help, /stats, etc.
 */
bot.command("start", (ctx: Context) => {
  ctx.reply(
    "👋 Welcome to Tech News Bot! (टेक न्यूज़ बॉट में स्वागत है!)\n\n" +
      "📰 *News in Your Language*\n" +
      "Get curated tech news summaries every 6 hours in your preferred language.\n\n" +
      "🇮🇳 *Supported Indian Languages:*\n" +
      "Hindi (हिन्दी), Bengali (বাংলা), Telugu (తెలుగు), Tamil (தமிழ்), Marathi (मराठी),\n" +
      "Gujarati (ગુજરાતી), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Odia (ଓଡ଼ିଆ), Punjabi (ਪੰਜਾਬੀ)\n\n" +
      "Commands:\n" +
      "/lang - Choose your language\n" +
      "/help - Show help message\n" +
      "/stats - Show statistics\n" +
      "/news - Get latest news now\n" +
      "/deals - Get latest Amazon India deals"
  );
});

bot.command("help", (ctx: Context) => {
  ctx.reply(
    "📖 *Tech News Bot Help* (मदद)\n\n" +
      "*About:*\n" +
      "Get tech news automatically detected and delivered in Indian languages and more.\n\n" +
      "*How it works:*\n" +
      "1. Fetches articles from 14 major tech sources\n" +
      "2. Detects article language automatically\n" +
      "3. Filters news in YOUR preferred language\n" +
      "4. Summarizes using AI (BART model)\n" +
      "5. Analyzes sentiment (positive/negative/neutral)\n" +
      "6. Categorizes by tech topic (AI, Security, Web Dev, etc.)\n\n" +
      "*Update schedule:*\n" +
      "📅 Every 6 hours (4 times daily) | Manual: /news or /deals\n\n" +
      "*Get Started:*\n" +
      "Send /lang to choose from 10+ languages including Hindi, Bengali, Tamil, Telugu, and more!\n\n" +
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

bot.command("news", async (ctx: Context) => {
  const userId = ctx.from?.id?.toString() || "default";
  const chatId = ctx.chat?.id?.toString() || userId;

  try {
    await ctx.reply("Fetching fresh news for you...");

    const { fetchAndSendNews } = await import("../lib/news-fetcher.js");
    const result = await fetchAndSendNews(userId, chatId);

    if (result.articlesSent > 0) {
      await ctx.reply(`Sent ${result.articlesSent} new articles in your language.`);
    } else if (result.articlesProcessed > 0) {
      await ctx.reply("Processed new articles, but none matched your selected language.");
    } else {
      await ctx.reply("No new articles at the moment. Try again later!");
    }
  } catch (error) {
    console.error("Error fetching news from webhook:", error);
    await ctx.reply("Sorry, couldn't fetch news right now. Please try again later.");
  }
});

bot.command("deals", async (ctx: Context) => {
  try {
    await ctx.reply("Fetching latest Amazon India deals...");

    const { fetchAmazonIndiaDeals } = await import("../lib/deals-fetcher.js");
    const maxItems = Number.parseInt(process.env.DAILY_DEALS_LIMIT || "8", 10);
    const deals = await fetchAmazonIndiaDeals(maxItems);

    if (deals.length === 0) {
      await ctx.reply(
        "No Amazon India deals found right now. Configure DEAL_FEEDS and try again."
      );
      return;
    }

    await ctx.reply(`Found ${deals.length} Amazon India deals:`);

    for (const deal of deals) {
      const escapedTitle = escapeMarkdownV2(deal.title);
      const escapedSource = escapeMarkdownV2(deal.source);
      const priceText =
        typeof deal.priceInr === "number" ? `\u20B9${deal.priceInr.toLocaleString("en-IN")}` : "N/A";

      const message = [
        `*${escapedTitle}*`,
        `Source: ${escapedSource}`,
        `Price: ${priceText}`,
        `[Buy on Amazon\\.in](${deal.link})`,
      ].join("\n");

      await ctx.reply(message, {
        parse_mode: "MarkdownV2",
        link_preview_options: { is_disabled: true },
      });
    }
  } catch (error) {
    console.error("Error fetching deals from webhook:", error);
    await ctx.reply("Sorry, couldn't fetch deals right now. Please try again later.");
  }
});

bot.command("lang", async (ctx: Context) => {
  const userId = ctx.from?.id?.toString() || "default";
  const currentLang = await getUserLanguage(userId);
  const currentName = getLanguageInfo(currentLang as any).name;
  const currentScript = getLanguageInfo(currentLang as any).script;

  ctx.reply(
    `🌍 *Language Settings* (भाषा सेटिंग्स)\n\n` +
      `*Your Current Language:* ${currentName} (${currentScript})\n\n` +
      formatLanguageList() +
      `\n\n💡 *How to change:* Send the language code\n` +
      `Example: /hi for Hindi, /ta for Tamil, /en for English`,
    { parse_mode: "Markdown" }
  );
});

// Dynamically register language commands (e.g., /en, /es, /fr, etc.)
for (const [code, info] of Object.entries(SUPPORTED_LANGUAGES)) {
  bot.command(code, async (ctx: Context) => {
    const userId = ctx.from?.id?.toString() || "default";
    await setUserLanguage(userId, code);
    const flag = info.flag;
    const script = info.script;
    
    let confirmMsg = `${flag} *Language Updated*\n\n`;
    confirmMsg += `Your language preference has been set to *${info.name}* (${script}).\n\n`;
    confirmMsg += `You'll now receive tech news articles in ${info.name.toLowerCase()}.\n\n`;
    
    if (["hi", "bn", "te", "ta", "mr", "gu", "kn", "ml", "or", "pa"].includes(code)) {
      confirmMsg += `🇮🇳 आपको अब भारतीय भाषा में समाचार मिलेंगे!`;
    }
    
    ctx.reply(confirmMsg, { parse_mode: "Markdown" });
  });
}

bot.on("message", async (ctx: Context) => {
  const message = ctx.message;
  if (!message) {
    await ctx.reply("Send /help to see available commands.");
    return;
  }

  const text = "text" in message ? message.text?.trim().toLowerCase() : "";

  if (!text) {
    await ctx.reply("Send /help to see available commands.");
    return;
  }

  const normalized = text.startsWith("/") ? text.slice(1) : text;

  // Let users send just "hi", "ta", etc. without a leading slash.
  if (normalized in SUPPORTED_LANGUAGES) {
    const userId = ctx.from?.id?.toString() || "default";
    await setUserLanguage(userId, normalized);
    const info = getLanguageInfo(normalized as keyof typeof SUPPORTED_LANGUAGES);
    await ctx.reply(
      `${info.flag} Language updated to ${info.name} (${info.script}).`
    );
    return;
  }

  if (normalized.includes("news")) {
    await ctx.reply("Use /news to fetch the latest update right now.");
    return;
  }

  if (normalized.includes("deal")) {
    await ctx.reply("Use /deals to fetch latest Amazon India deals.");
    return;
  }

  await ctx.reply(
    "I'm a news and deals bot. Use /news for tech news or /deals for Amazon India deals."
  );
});

function parseTelegramUpdate(body: unknown): Update | null {
  if (!body) return null;

  if (typeof body === "string") {
    try {
      return JSON.parse(body) as Update;
    } catch {
      return null;
    }
  }

  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString("utf-8")) as Update;
    } catch {
      return null;
    }
  }

  if (typeof body === "object") {
    return body as Update;
  }

  return null;
}

export default async (
  req: VercelRequest,
  res: VercelResponse
): Promise<void> => {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return res.status(500).json({
        error: "Webhook is not configured",
        message: "Missing TELEGRAM_BOT_TOKEN",
      });
    }

    // Handle Telegram webhook
    if (req.method === "POST") {
      if (webhookSecret) {
        const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
        if (incomingSecret !== webhookSecret) {
          return res.status(401).json({ ok: false, error: "Invalid webhook secret" });
        }
      }

      console.log("Webhook POST received at", new Date().toISOString());

      // Mask and log headers (avoid printing secrets)
      const headersToLog: Record<string, string | undefined> = {};
      for (const [k, v] of Object.entries(req.headers || {})) {
        const key = k.toLowerCase();
        if (["authorization", "cookie", "set-cookie", "x-hf-token", "hf_token"].includes(key)) {
          headersToLog[key] = "[REDACTED]";
        } else {
          headersToLog[key] = v as string;
        }
      }
      console.log("Webhook headers:", headersToLog);

      // Safely stringify and truncate body for logs
      let bodyStr = "";
      try {
        bodyStr = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      } catch (e) {
        bodyStr = String(req.body);
      }
      const truncated = bodyStr.length > 1024 ? bodyStr.slice(0, 1024) + "...[truncated]" : bodyStr;
      console.log("Webhook body (truncated):", truncated);

      const update = parseTelegramUpdate(req.body);
      if (!update) {
        return res.status(400).json({ ok: false, error: "Invalid Telegram update payload" });
      }

      try {
        await bot.handleUpdate(update);
      } catch (err) {
        console.error("bot.handleUpdate error:", err);
        return res.status(500).json({ ok: false, error: String(err) });
      }

      return res.status(200).json({ ok: true });
    }

    // Health check
    if (req.method === "GET") {
      return res.status(200).json({
        status: "ok",
        message: "Tech News Bot webhook is running",
        webhookSecretConfigured: Boolean(webhookSecret),
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


