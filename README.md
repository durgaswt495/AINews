# Tech News Telegram Bot

A serverless Node.js application that aggregates tech news from multiple RSS feeds, **automatically detects article language**, and sends curated summaries to Telegram in your preferred language every 6 hours.

## Features

🇮🇳 **10 Indian Languages**: Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Odia, Punjabi

🌍 **6 International Languages**: English, Spanish, French, German, Chinese, Japanese

🤖 **Automatic Language Detection**: Detects language of each article using AI

✨ **News Aggregation**: Fetches from 14+ tech news sources (TechCrunch, Hacker News, Dev.to, etc.)

📊 **AI Processing**: Uses free Hugging Face models for:
- Text summarization (BART)
- Sentiment analysis (DistilBERT)
- Topic classification (Zero-shot)
- Language detection (Multilingual model)

📱 **Telegram Integration**: Sends formatted news summaries with sentiment indicators & language filtering

👤 **User Preferences**: Save your language preference and get updates in YOUR language

💾 **Deduplication**: Uses Vercel KV (Redis) to prevent duplicate articles

⚙️ **Serverless**: Runs on Vercel free tier with cron jobs every 6 hours

## Quick Start

1. Open Telegram bot
2. Send `/lang` to choose your language
3. Send `/hi` (or `/ta`, `/bn`, etc.) to select
4. Receive tech news in your language every 6 hours!

See [INDIAN_LANGUAGES.md](./INDIAN_LANGUAGES.md) for detailed language support guide.

## Prerequisites

- Node.js 18+ (for local development)
- A Telegram bot token (from @BotFather)
- A Hugging Face account + free API token
- A GitHub account (for deploying to Vercel)
- A Vercel account (free tier)

## Setup Instructions

### 1. Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow the instructions
3. You'll receive a token like: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`
4. Save this token - you'll need it later

### 2. Get Hugging Face API Token

1. Go to https://huggingface.co/settings/tokens
2. Create a new access token (read-only is fine)
3. Copy the token

### 3. Local Development Setup

```bash
# Clone or navigate to your project
cd NewsApp

# Install dependencies
npm install

# Create .env.local file
cp .env.local .env.local

# Edit .env.local and add your tokens:
# TELEGRAM_BOT_TOKEN=your_bot_token_here
# TELEGRAM_CHAT_ID=your_chat_id_here (see step 5)
# HF_TOKEN=your_hugging_face_token_here
```

### 4. Find Your Telegram Chat ID

Method 1: Use bot to find Chat ID
1. Start a conversation with your bot
2. Go to: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":YOUR_CHAT_ID}`

Method 2: Send a message to @get_id_bot

### 5. Update Environment Variables

Edit `.env.local`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
HF_TOKEN=your_hf_token
VERCEL_KV_URL=https://your-kv.upstash.io  # Will get after KV setup
VERCEL_KV_REST_API_TOKEN=your_kv_token    # Will get after KV setup
```

### 6. Test Locally

```bash
# Install Vercel CLI
npm i -g vercel

# Run development server (simulates Vercel environment)
vercel dev

# Test the API endpoint
curl http://localhost:3000/api/fetch-news

# You should receive news in Telegram within 30 seconds
```

## Deployment to Vercel

### Prerequisites
- GitHub repository with your code
- Vercel account (connect with GitHub)

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/NewsApp.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com/new
   - Select "Import Git Repository"
   - Choose your NewsApp repository
   - Click "Deploy"

3. **Add Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from your `.env.local`:
     - `TELEGRAM_BOT_TOKEN`
     - `TELEGRAM_CHAT_ID`
     - `HF_TOKEN`
     - `VERCEL_KV_URL` (see next section)
     - `VERCEL_KV_REST_API_TOKEN`

4. **Setup Vercel KV (Free Tier)**
   - In Vercel dashboard, go to Storage Tab
   - Click "Create Database" → "KV"
   - Select your region (closest to you)
   - Copy the connection strings
   - Add to Environment Variables:
     - `VERCEL_KV_URL`
     - `VERCEL_KV_REST_API_TOKEN`
   - Re-deploy

5. **Verify Cron Schedule**
   - Check Vercel dashboard → Functions → Crons
   - Should show `fetch-news` running every 6 hours
   - Manual test: Click the "..." button and select "Test Cron"

## Project Structure

```
NewsApp/
├── api/
│   ├── fetch-news.ts          # Cron function (fetches + processes news)
│   └── webhook.ts              # Telegram webhook handler (optional)
├── lib/
│   ├── huggingface-client.ts   # HF NLP processing
│   ├── telegram-service.ts     # Telegram bot integration
│   ├── news-sources.ts         # RSS feed URLs
│   └── vercel-kv.ts            # KV store operations
├── package.json
├── tsconfig.json
├── vercel.json                 # Vercel configuration + cron schedule
├── .env.local                  # Local environment variables
└── README.md
```

## How It Works

### Scheduled Execution (Every 6 hours)

1. **Vercel Cron** triggers `/api/fetch-news`
2. **Fetch Phase**: Articles fetched from 14+ RSS feeds
3. **Filter Phase**: Duplicate check via KV store
4. **Process Phase**: Articles summarized, sentiment & topic classified by HF
5. **Store Phase**: New articles saved to KV (7-day expiration)
6. **Send Phase**: Formatted summaries sent to Telegram with sentiment indicators

### Telegram Message Format

```
📰 Tech News Update (2/22/2026)
Found 5 new articles from your tech feeds.

*Article Title*

_TechCrunch_
📌 Artificial Intelligence 🟢

*Summary:*
Brief AI-generated summary of the article...

[Read Full Article](https://...)

...

*Today's Sentiment Analysis:*
🟢 Positive: 3
🔴 Negative: 1
🟡 Neutral: 1
```

## Cost Analysis

### Free Tier Costs

| Service | Free Tier Limit | Cost |
|---------|-----------------|------|
| **Vercel** | 4 CPU-hours/month, 1M invocations | ✅ Free |
| **Hugging Face** | Unlimited API calls (rate-limited) | ✅ Free |
| **Telegram Bot** | Unlimited | ✅ Free |
| **Vercel KV** | 10,000 requests/day | ✅ Free |
| **Total Cost** | - | **$0/month** |

### Storage Usage
- ~500 bytes per article
- 5 sources × 5 articles × 4 cycles/day = 100 articles/day
- 100 × 500 bytes = 50 KB/day
- Very minimal KV usage

## Troubleshooting

### Not Receiving Messages

1. Check Telegram Chat ID is correct
   ```bash
   curl https://api.telegram.org/bot<TOKEN>/getUpdates
   ```

2. Check function logs in Vercel
   - Dashboard → Functions → fetch-news → Logs

3. Manually trigger cron:
   ```bash
   curl https://your-app.vercel.app/api/fetch-news
   ```

### Slow/Empty Articles

1. RSS feed might be down - check vercel logs
2. HF API rate limit - wait 1 hour and retry
3. KV not initialized - verify KV_URL and token

### Bot Not Responding to Commands

- Webhook not set up (optional feature)
- Send `/start` to bot to activate

## Customization

### Add More News Sources

Edit `lib/news-sources.ts` and add to `newsSources` array:
```typescript
{
  name: "Your Source",
  url: "https://example.com/feed",
  category: "Tech News"
}
```

### Change Update Frequency

Edit `vercel.json`, change cron schedule:
```json
"schedule": "0 */3 * * *"  // Every 3 hours
```

### Adjust Summarization Length

Edit `lib/huggingface-client.ts`:
```typescript
max_length: 200,  // Longer summaries
min_length: 50,
```

### Modify Sentiment Emoji

Edit `lib/telegram-service.ts`:
```typescript
const sentimentEmoji = {
  positive: "✅",
  negative: "❌",
  neutral: "➖"
};
```

## API Endpoints

### `GET/POST /api/fetch-news`
Manually trigger news fetch cycle
- Returns: `{success: true, articlesFetched: N, articlesProcessed: M}`

### `POST /api/webhook`
Telegram webhook handler
- Forwards updates to bot

## License

MIT

## Support

For issues or feature requests, check the logs in Vercel dashboard or open an issue on GitHub.

---

**Happy news reading! 📰🤖**
