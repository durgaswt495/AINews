import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "");

export interface DealMessage {
  id: string;
  title: string;
  source: string;
  productUrl: string;
  affiliateUrl: string;
  imageUrl?: string;
  currentPrice?: number;
  originalPrice?: number;
  discountPercent?: number;
  isThirtyDayLow?: boolean;
  thirtyDayLowPrice?: number;
}

function escapeMarkdownV2(input: string): string {
  return input.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

function formatPrice(value?: number): string {
  if (!value || Number.isNaN(value)) return "N/A";
  return `$${value.toFixed(2)}`;
}

export async function sendDealsToTelegram(deals: DealMessage[]): Promise<number> {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    console.warn("TELEGRAM_CHAT_ID not configured. Skipping Telegram publishing.");
    return 0;
  }

  if (deals.length === 0) {
    return 0;
  }

  await bot.telegram.sendMessage(
    chatId,
    `Daily affiliate deals: ${deals.length} picks for ${new Date().toISOString().slice(0, 10)}`
  );

  for (const deal of deals) {
    const discountLine =
      typeof deal.discountPercent === "number" ? `Discount: ${deal.discountPercent}%` : "Discount: N/A";
    const lowLine = deal.isThirtyDayLow
      ? `30d Low: Yes (${formatPrice(deal.thirtyDayLowPrice)})`
      : `30d Low: No (${formatPrice(deal.thirtyDayLowPrice)})`;

    const caption = [
      `*${escapeMarkdownV2(deal.title)}*`,
      `Source: ${escapeMarkdownV2(deal.source)}`,
      `Price: ${escapeMarkdownV2(formatPrice(deal.currentPrice))}`,
      `MRP: ${escapeMarkdownV2(formatPrice(deal.originalPrice))}`,
      `${escapeMarkdownV2(discountLine)}`,
      `${escapeMarkdownV2(lowLine)}`,
      `[Buy Now](${deal.affiliateUrl})`,
    ].join("\n");

    if (deal.imageUrl) {
      await bot.telegram.sendPhoto(
        chatId,
        { url: deal.imageUrl },
        { caption, parse_mode: "MarkdownV2" }
      );
    } else {
      await bot.telegram.sendMessage(chatId, caption, {
        parse_mode: "MarkdownV2",
        link_preview_options: { is_disabled: true },
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return deals.length;
}

export async function sendErrorAlert(errorMessage: string): Promise<void> {
  if (!process.env.TELEGRAM_CHAT_ID) {
    return;
  }

  try {
    await bot.telegram.sendMessage(
      process.env.TELEGRAM_CHAT_ID,
      `Deal bot error: ${errorMessage}`
    );
  } catch (error) {
    console.error("Failed to send Telegram error alert:", error);
  }
}
