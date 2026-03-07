import axios from "axios";
import type { DealMessage } from "./telegram-service.js";

const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || "v22.0";

function getRecipients(): string[] {
  const recipients = process.env.WHATSAPP_RECIPIENTS || "";
  return recipients
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

function formatPrice(value?: number): string {
  if (!value || Number.isNaN(value)) return "N/A";
  return `$${value.toFixed(2)}`;
}

function formatMessage(deal: DealMessage): string {
  const discount =
    typeof deal.discountPercent === "number" ? `${deal.discountPercent}% OFF` : "Deal";
  const lowSignal = deal.isThirtyDayLow
    ? `30d low: yes (${formatPrice(deal.thirtyDayLowPrice)})`
    : `30d low: no (${formatPrice(deal.thirtyDayLowPrice)})`;

  return [
    `*${deal.title}*`,
    `Source: ${deal.source}`,
    `Price: ${formatPrice(deal.currentPrice)}`,
    `MRP: ${formatPrice(deal.originalPrice)}`,
    discount,
    lowSignal,
    `Buy: ${deal.affiliateUrl}`,
  ].join("\n");
}

async function sendSingleMessage(to: string, deal: DealMessage): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    throw new Error("Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID");
  }

  const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;

  if (deal.imageUrl) {
    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to,
        type: "image",
        image: {
          link: deal.imageUrl,
          caption: formatMessage(deal),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return;
  }

  await axios.post(
    url,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body: formatMessage(deal),
      },
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
}

export async function sendDealsToWhatsApp(deals: DealMessage[]): Promise<number> {
  if (deals.length === 0) {
    return 0;
  }

  const recipients = getRecipients();
  if (recipients.length === 0) {
    console.warn("WHATSAPP_RECIPIENTS not configured. Skipping WhatsApp publishing.");
    return 0;
  }

  let sent = 0;

  for (const recipient of recipients) {
    for (const deal of deals) {
      await sendSingleMessage(recipient, deal);
      sent += 1;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  return sent;
}
