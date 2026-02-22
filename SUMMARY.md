# 📦 Project Summary - Tech News Telegram Bot

## ✨ What You Have

A complete, production-ready **serverless Node.js application** that:
- 📰 Fetches tech news from 14+ sources every 6 hours
- 🤖 Processes articles with free Hugging Face AI models
- 📱 Sends curated summaries to your Telegram bot
- 💾 Deduplicates using Vercel KV (Redis)
- 🚀 Deploys free on Vercel
- 💰 **Costs: $0/month** ✅

---

## 📂 Project File Structure

```
NewsApp/
│
├── 📋 Configuration Files
│   ├── package.json              ← Dependencies & scripts
│   ├── tsconfig.json             ← TypeScript settings
│   ├── vercel.json               ← Vercel config + cron schedule
│   ├── .env.local                ← Local secrets (gitignored)
│   └── .gitignore               ← Git ignore rules
│
├── 🔧 API Routes (Serverless Functions)
│   └── api/
│       ├── fetch-news.ts         ← ⭐ Main function (runs every 6h)
│       │   • Fetches RSS feeds
│       │   • Processes with AI
│       │   • Sends to Telegram
│       │   • Stores in KV
│       │
│       └── webhook.ts            ← Optional Telegram webhook handler
│           • Handles /start, /help, /stats commands
│           • Interactive features (future)
│
├── 📚 Utility Libraries
│   └── lib/
│       ├── huggingface-client.ts ← AI Processing
│       │   • summarizeText() - BART summarization
│       │   • analyzeSentiment() - DistilBERT sentiment
│       │   • classifyTopic() - Zero-shot classification
│       │   • processArticle() - Orchestrates all 3
│       │
│       ├── telegram-service.ts   ← Telegram Bot
│       │   • sendNewsToTelegram() - Sends summaries
│       │   • sendErrorAlert() - Error notifications
│       │   • Formats messages with emojis
│       │
│       ├── news-sources.ts       ← RSS Feed Lists
│       │   • 14 tech news sources
│       │   • TechCrunch, Hacker News, Dev.to, etc.
│       │   • Niche blogs & specialized sources
│       │
│       └── vercel-kv.ts          ← Database Operations
│           • articleExists() - Check for duplicates
│           • storeArticle() - Save new articles
│           • getArticle() - Retrieve stored articles
│           • Uses REST API for Vercel KV
│
├── 📖 Documentation
│   ├── README.md                 ← Full documentation
│   ├── SETUP.md                  ← This setup guide (Step-by-step)
│   └── This file                 ← Overview & summary
│
└── 📦 Generated After Deployment
    ├── node_modules/             ← Installed packages
    ├── dist/                     ← Compiled JavaScript (from TS)
    ├── .vercel/                  ← Vercel metadata
    └── package-lock.json         ← Dependency lock file
```

---

## 🔑 Key Files & Their Purposes

### Configuration

| File | Purpose | Edit When |
|------|---------|-----------|
| `package.json` | Dependencies & npm scripts | Need new packages or change scripts |
| `tsconfig.json` | TypeScript compiler settings | Need ES modules, strict checking, etc. |
| `vercel.json` | Vercel deployment & cron config | Change update frequency or memory limits |
| `.env.local` | Local development secrets | Setting up local development |

### Backend Code

| File | Purpose | Key Functions |
|------|---------|---|
| `api/fetch-news.ts` | **Main scheduled function** | Orchestrates entire news cycle |
| `api/webhook.ts` | Telegram message handler | Handles bot commands |
| `lib/huggingface-client.ts` | NLP Processing | summarizeText, analyzeSentiment, classifyTopic |
| `lib/telegram-service.ts` | Bot Integration | sendNewsToTelegram, sendErrorAlert |
| `lib/news-sources.ts` | Data | Array of 14+ RSS feed URLs |
| `lib/vercel-kv.ts` | Database | CRUD operations for articles |

---

## ⚙️ Technology Stack

### Serverless Platform
- **Vercel** - Free tier: 4 CPU-hours/month, 1M invocations
  - Auto-scales, no server management
  - Built-in cron job support
  - Free tier includes all features

### AI/ML
- **Hugging Face Inference API** (Free tier)
  - `facebook/bart-large-cnn` - Summarization
  - `distilbert-base-uncased-finetuned-sst-2-english` - Sentiment
  - `facebook/bart-large-mnli` - Topic classification

### Data Sources
- **RSS Feeds** (14 sources)
  - TechCrunch, Hacker News, Dev.to, Medium, etc.
  - Lightweight, no authentication needed

### Storage
- **Vercel KV** (Redis-compatible)
  - Free tier: 10K requests/day
  - 7-day article expiration (automatic)
  - Deduplication & history

### Messaging
- **Telegram Bot API**
  - Free, unlimited messages
  - Webhook or polling support

### Language & Runtime
- **Node.js 18+** on Vercel
- **TypeScript** for type safety
- **ESM** (ES Modules) for modern code

### Dependencies (14 packages)

| Package | Purpose | Size |
|---------|---------|------|
| `telegraf` | Telegram bot framework | 📦 Modern, Vercel-ready |
| `@huggingface/inference` | HF API client | 📦 Official SDK |
| `rss-parser` | Parse RSS/Atom feeds | 📦 Lightweight |
| `axios` | HTTP client | 📦 Promise-based |
| `cheerio` | HTML parsing (optional) | 📦 jQuery-like |
| `dotenv` | Environment variables | 📦 Config management |
| `typescript` | Type safety | 🔧 Dev dependency |

---

## 🚀 How to Deploy (3 Steps)

### 1️⃣ Get Your Credentials (5 minutes)

**Telegram Bot Token:**
- Telegram → `@BotFather` → `/newbot` → Copy token
- Token example: `123456:ABC-DEFghIklmnoPQRstuvWxyz`

**Telegram Chat ID:**
- Send message to your bot
- Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
- Find `"chat":{"id":YOUR_CHAT_ID}`

**Hugging Face Token:**
- https://huggingface.co/settings/tokens → Create → Copy

### 2️⃣ Push to GitHub (2 minutes)

```bash
cd NewsApp
git init
git add .
git commit -m "Tech news bot"
git remote add origin https://github.com/YOUR_USERNAME/NewsApp.git
git push -u origin main
```

### 3️⃣ Deploy to Vercel (2 minutes)

1. Go to https://vercel.com/new
2. "Import Git Repository" → Select your NewsApp repo
3. Click **Deploy** ✅
4. Wait 2-5 minutes for deployment
5. Go to Settings → Environment Variables
6. Add 3 variables:
   ```
   TELEGRAM_BOT_TOKEN = your_token
   TELEGRAM_CHAT_ID = your_chat_id
   HF_TOKEN = your_hf_token
   ```
7. Redeploy (click ... → Redeploy)
8. Setup Vercel KV (see SETUP.md for details)
9. Redeploy again
10. ✅ Done!

---

## 💡 How It Works

### Every 6 Hours:

```
1. Vercel Cron triggers fetch-news.ts
   ↓
2. Fetch articles from 14 RSS feeds (parallel)
   ↓
3. For each article:
   a. Check KV: Is this article already processed?
   b. If YES → Skip (deduplication)
   c. If NO → Continue
   ↓
4. Process with Hugging Face (parallel):
   a. Summarize (BART) → 130 tokens max
   b. Analyze sentiment → positive/negative/neutral
   c. Classify topic → AI, Security, Web Dev, etc.
   ↓
5. Store in KV with 7-day expiration
   ↓
6. Format as Telegram message with:
   - ✅ Article title
   - 🔗 Link to original
   - 📝 AI summary
   - 🟢 Sentiment indicator
   - 📌 Topic tag
   ↓
7. Send batch to Telegram
   ↓
8. Send stats summary to Telegram
   ↓
9. Log success in Vercel
```

### Example Telegram Message:

```
📰 Tech News Update (2/22/2026)
Found 3 new articles from your tech feeds.

*New AI Safety Benchmark Released*

_OpenAI Blog_
📌 Artificial Intelligence 🟢

*Summary:*
Researchers introduce HELM, a comprehensive AI 
safety benchmark. Shows progress on common AI risks 
and suggests areas for future improvement.

[Read Full Article](https://openai.com/...)

---

*Today's Sentiment Analysis:*
🟢 Positive: 2
🔴 Negative: 0
🟡 Neutral: 1
```

---

## 🎯 Next Actions

### Immediate (Deploy Now)
1. ✅ Code is ready ← You are here
2. ⏭️ Get credentials (Telegram, HF token) → 5 min
3. ⏭️ Push to GitHub → 2 min
4. ⏭️ Deploy to Vercel → 5 min
5. ⏭️ Setup Vercel KV → 3 min
6. 🎉 Done! Receive first news in 6 hours

### After Deployment (Optional)
- Add more news sources in `lib/news-sources.ts`
- Change update frequency in `vercel.json`
- Adjust summary length in `lib/huggingface-client.ts`
- Customize Telegram message format
- Add interactive bot commands
- Set up error logging

---

## 🆘 Troubleshooting Quick Ref

| Problem | Solution |
|---------|----------|
| "No Bot Token" | Set `TELEGRAM_BOT_TOKEN` in Vercel ENV |
| "Chat ID invalid" | Get fresh ID: https://api.telegram.org/bot<TOKEN>/getUpdates |
| "Articles not storing" | Setup Vercel KV, add `VERCEL_KV_URL` and token |
| "TypeScript errors" | Run `npm run build` locally to verify |
| "No messages received" | Check Vercel logs: Dashboard → Logs → fetch-news |
| "HF API rate limit" | Free tier has limits, wait 1 hour |

---

## 📊 Resource Usage (Free Tier)

### Monthly Quotas:
- **Vercel**: 4 CPU-hours/month ← You use ~2 min/day = 1 CPU-hour/month ✅
- **Vercel KV**: 10K requests/day ← You use ~100 requests/day ✅
- **HF API**: Unlimited (rate-limited) ✅
- **Telegram**: Unlimited ✅

**Monthly Cost: $0** 🎉

---

## 📞 Support Resources

- [SETUP.md](./SETUP.md) - Detailed deployment guide
- [README.md](./README.md) - Full project documentation
- [Vercel Docs](https://vercel.com/docs)
- [Hugging Face Docs](https://huggingface.co/docs/inference-client/en/index)
- [Telegraf.js Docs](https://telegraf.js.org/)

---

## 🎓 What Each Component Does

```
┌──────────────────────────────────────────────────────┐
│        Vercel Serverless Functions (Free)            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  api/fetch-news.ts (Runs every 6 hours)             │
│  ├─ Calls lib/news-sources.ts → Get RSS URLs        │
│  ├─ Uses rss-parser → Fetch articles                │
│  ├─ Calls lib/vercel-kv.ts → Check duplicates       │
│  ├─ Calls lib/huggingface-client.ts → AI processing │
│  ├─ Stores result back to KV                        │
│  └─ Calls lib/telegram-service.ts → Send message    │
│                                                      │
│  api/webhook.ts (Optional, on-demand)               │
│  └─ Handles Telegram commands                       │
│                                                      │
└──────────────────────────────────────────────────────┘
        ↓               ↓               ↓
  ┌──────────┐  ┌──────────────┐  ┌──────────┐
  │ Telegram │  │ Hugging Face │  │Vercel KV │
  │API (Free)│  │API (Free)    │  │(Free 10K)│
  └──────────┘  └──────────────┘  └──────────┘
```

---

## ✅ Pre-Deployment Checklist

Before deploying, you have:

- ✅ Full source code (api/, lib/)
- ✅ TypeScript configuration (tsconfig.json)
- ✅ Vercel configuration (vercel.json with cron)
- ✅ All dependencies defined (package.json)
- ✅ Environment variable template (.env.local)
- ✅ Complete documentation (README.md, SETUP.md)
- ✅ Git ignore (secrets not committed)
- ✅ Code compiles (npm run build passes)
- ✅ 14+ news sources configured
- ✅ AI models selected and ready
- ✅ Telegram integration ready
- ✅ KV deduplication ready
- ✅ Error handling included

**Everything is ready! See SETUP.md for deployment instructions.** 🚀

---

**Built with ❤️ for tech news passion**
