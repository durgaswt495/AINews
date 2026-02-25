import { Telegraf } from "telegraf";
import type { LanguageCode } from "./language-service.js";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "");

export interface NewsMessage {
  title: string;
  link?: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  topic: string;
  source: string;
  pubDate?: string;
  language: LanguageCode;
}

const sentimentEmoji = {
  positive: "🟢",
  negative: "🔴",
  neutral: "🟡",
};

export async function sendNewsToTelegram(
  news: NewsMessage[],
  userLanguage?: string
): Promise<void> {
  if (!process.env.TELEGRAM_CHAT_ID) {
    throw new Error("TELEGRAM_CHAT_ID not set");
  }

  // Filter news by user language if specified
  const filteredNews =
    userLanguage && userLanguage !== "all"
      ? news.filter((article) => article.language === userLanguage)
      : news;

  if (filteredNews.length === 0) {
    console.log(
      `No articles found in user's language (${userLanguage}). Total available: ${news.length}`
    );
    return;
  }

  try {
    // Send header message
    const languageInfo =
      userLanguage && userLanguage !== "all"
        ? ` (${userLanguage.toUpperCase()})`
        : "";
    const header =
      `📰 *Tech News Update* 🇮🇳 (${new Date().toLocaleDateString()})${languageInfo}\n\n` +
      `Found ${filteredNews.length} new articles from your tech feeds.\n\n`;

    await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, header, {
      parse_mode: "Markdown",
    });

    // Send each article as a separate message to avoid length limits
    for (const article of filteredNews) {
      const emoji = sentimentEmoji[article.sentiment];
      const message =
        `*${article.title}*\n\n` +
        `_${article.source}_\n` +
        `📌 ${article.topic} ${emoji}\n\n` +
        `*Summary:*\n${article.summary}\n\n` +
        (article.link ? `[Read Full Article](${article.link})` : "");

      await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, message, {
        parse_mode: "Markdown",
        link_preview_options: { is_disabled: true },
      });

      // Add a small delay between messages to avoid hitting rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Send footer message with stats
    const positiveCount = filteredNews.filter(
      (n) => n.sentiment === "positive"
    ).length;
    const negativeCount = filteredNews.filter(
      (n) => n.sentiment === "negative"
    ).length;
    const neutralCount = filteredNews.filter((n) => n.sentiment === "neutral").length;

    const footer =
      `*Today's Sentiment Analysis:*\n` +
      `🟢 Positive: ${positiveCount}\n` +
      `🔴 Negative: ${negativeCount}\n` +
      `🟡 Neutral: ${neutralCount}`;

    await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, footer, {
      parse_mode: "Markdown",
    });

    console.log(`Successfully sent ${filteredNews.length} articles to Telegram`);
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
    throw error;
  }
}

export async function sendErrorAlert(errorMessage: string): Promise<void> {
  if (!process.env.TELEGRAM_CHAT_ID) {
    console.error("TELEGRAM_CHAT_ID not set, cannot send error alert");
    return;
  }

  try {
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_CHAT_ID,
      `⚠️ *News Bot Error*\n\n${errorMessage}`,
      {
        parse_mode: "Markdown",
      }
    );
  } catch (error) {
    console.error("Failed to send error alert to Telegram:", error);
  }
}
