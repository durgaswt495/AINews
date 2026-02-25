import { Telegraf, Context } from "telegraf";
import { Update } from "telegraf/types";
import { 
  SUPPORTED_LANGUAGES, 
  isValidLanguage, 
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
      "/news - Get latest news now"
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
      "📅 Every 6 hours (4 times daily) | Manual: /news\n\n" +
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
  
  try {
    await ctx.reply("🔄 Fetching fresh news for you...");
    
    const { fetchAndSendNews } = await import("../lib/news-fetcher.js");
    const result = await fetchAndSendNews(userId);
    
    if (result.articlesProcessed > 0) {
      await ctx.reply(`✅ Found ${result.articlesProcessed} new articles in your language!`);
    } else {
      await ctx.reply("📭 No new articles at the moment. Try again later!");
    }
  } catch (error) {
    console.error("Error fetching news from webhook:", error);
    await ctx.reply("❌ Sorry, couldn't fetch news right now. Please try again later.");
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
