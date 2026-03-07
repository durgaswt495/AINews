import { fetchAndSendDeals } from "./deals-fetcher.js";

export async function fetchAndSendNews(
  _userId: string,
  _targetChatId?: string
): Promise<{
  success: boolean;
  articlesFetched: number;
  articlesProcessed: number;
  articlesSent: number;
  message: string;
}> {
  const result = await fetchAndSendDeals();

  return {
    success: result.success,
    articlesFetched: result.dealsFetched,
    articlesProcessed: result.dealsSelected,
    articlesSent: result.telegramPosted,
    message: result.message,
  };
}
