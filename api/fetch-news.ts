import { sendErrorAlert } from "../lib/telegram-service.js";
import { fetchAndSendDeals } from "../lib/deals-fetcher.js";

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
    process.env.NODE_ENV !== "production";

  if (!isAuthorized) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("Starting scheduled deals publish cycle...");
    const result = await fetchAndSendDeals();

    return res.status(200).json({
      success: result.success,
      message: result.message,
      dealsFetched: result.dealsFetched,
      dealsSelected: result.dealsSelected,
      telegramPosted: result.telegramPosted,
      whatsappPosted: result.whatsappPosted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in fetch-news:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    try {
      await sendErrorAlert(`Failed to publish deals: ${errorMessage}`);
    } catch (telegramError) {
      console.error("Failed to send error alert:", telegramError);
    }

    return res.status(500).json({
      error: "Failed to fetch and publish deals",
      details: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
};
