import 'dotenv/config';

const chatId = process.env.TELEGRAM_CHAT_ID || 'default';

(async () => {
  try {
    const { fetchAndSendNews } = await import('./dist/lib/news-fetcher.js');
    console.log('Running fetchAndSendNews for', chatId);
    const res = await fetchAndSendNews(chatId);
    console.log('Result:', res);
  } catch (err) {
    console.error('Runner error:', err);
    process.exitCode = 1;
  }
})();
