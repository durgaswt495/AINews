# 🚀 Tech News Telegram Bot - Quick Start Guide

## ✅ Implementation Status

Your Node.js tech news aggregation bot is ready! Here's what has been built:

### Components Created

✨ **Core Application**
- `api/fetch-news.ts` - Main serverless function (triggered every 6 hours by Vercel cron)
- `api/webhook.ts` - Telegram webhook handler for interactive commands
- `lib/huggingface-client.ts` - Free AI model integration (summarization, sentiment, topic classification)
- `lib/telegram-service.ts` - Telegram bot messaging service
- `lib/news-sources.ts` - 14 top tech news RSS feeds (TechCrunch, HN, Dev.to, etc.)
- `lib/vercel-kv.ts` - Article deduplication & storage (Vercel KV)

📋 **Configuration**
- `vercel.json` - Vercel deployment config with cron schedule (every 6 hours)
- `package.json` - All dependencies configured
- `tsconfig.json` - TypeScript compiler settings
- `.env.local` - Local development secrets template

📚 **Documentation**
- `README.md` - Complete project documentation
- `.gitignore` - Git configuration to exclude secrets

---

## 📝 Next Steps (3-5 minutes to deploy)

### Step 1: Create Telegram Bot
1. Open Telegram → Search `@BotFather`
2. Send `/newbot`
3. Follow prompts → You'll get a **token** like: `123456:ABC-DEF...`
4. Save this token

**Get your Chat ID:**
- Send a message to your bot first
- Go to: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
- Look for `"chat":{"id":YOUR_CHAT_ID}` (the number)

**Example:**
```
TELEGRAM_BOT_TOKEN=123456:ABC-DEFghIklmnoPQRstuvWxyz
TELEGRAM_CHAT_ID=987654321
```

### Step 2: Get Hugging Face Token
1. Go to https://huggingface.co
2. Sign up (free) or log in
3. Settings → Access Tokens → Create New Token
4. Select "Read" permission only
5. Copy the token

**Example:**
```
HF_TOKEN=hf_aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

### Step 3: Deploy to Vercel (Free Tier ✅)

**Option A: Fast Deploy (Recommended)**
1. Push this folder to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/NewsApp.git
   git push -u origin main
   ```

2. Go to https://vercel.com/new
3. Click "Import Git Repository"
4. Select your NewsApp repository
5. Click **Deploy** (Vercel auto-configures)

**Option B: Vercel CLI (Local Deploy)**
```bash
npm i -g vercel        # Install Vercel CLI
vercel login           # Sign in to your Vercel account
vercel                 # Deploy from project folder
vercel env add         # Add environment variables
```

### Step 4: Add Environment Secrets to Vercel
In Vercel Dashboard → Settings → Environment Variables

Add:
```
TELEGRAM_BOT_TOKEN = your_bot_token_here
TELEGRAM_CHAT_ID = your_chat_id_here
HF_TOKEN = your_hugging_face_token_here
```

### Step 5: Setup Vercel KV (Redis) - Free Database
1. In Vercel Dashboard → Storage Tab
2. Click **Create Database** → Select **KV** (Redis)
3. Choose your region (closest to you)
4. Copy **REST API URL** and **REST API Token**
5. Add to Environment Variables:
   ```
   VERCEL_KV_URL = https://your-kv-store.upstash.io
   VERCEL_KV_REST_API_TOKEN = your_token_here
   ```

### Step 6: Redeploy (if deployed before Step 5)
- Go to Vercel Dashboard → Deployments
- Click the **...** button on latest deployment
- Select **Redeploy**

### Step 7: Test It Works
1. Check Telegram - you should receive a test message in 2-5 minutes
2. Or manually trigger: visit https://YOUR_APP.vercel.app/api/fetch-news in browser
3. Check Vercel Dashboard → Functions → fetch-news → Logs for execution details

---

## 📅 How It Works

### What Happens Every 6 Hours

```
[Vercel Cron Timer] → [Fetch News]
                     ↓
        [14+ RSS Feed Sources]
                     ↓
        [Check for Duplicates in KV]
                     ↓
        [Process with Hugging Face AI]
        • Summarize (BART): Long article → 2-3 sentence summary
        • Sentiment: Analyze mood (positive/negative/neutral)
        • Topic: Classify into tech categories (AI, Security, etc.)
                     ↓
        [Store in KV for 7 days] (prevent repeats)
                     ↓
        [Format & Send to Telegram]
```

### Telegram Message Format

```
📰 Tech News Update (2/22/2026)
Found 5 new articles from your tech feeds.

*Article Title*

_TechCrunch_
📌 Artificial Intelligence 🟢

*Summary:*
AI-generated summary of the article in 2-3 sentences...

[Read Full Article](https://link...)

...

*Today's Sentiment Analysis:*
🟢 Positive: 3
🔴 Negative: 1
🟡 Neutral: 1
```

---

## 💰 Cost Breakdown (Free Forever ✅)

| Service | Free Tier | Cost |
|---------|-----------|------|
| **Vercel** | 4 CPU-hours/month, 1M invocations | ✅ Free |
| **Hugging Face API** | Unlimited (rate-limited) | ✅ Free |
| **Telegram Bot API** | Unlimited | ✅ Free |
| **Vercel KV** | 10K requests/day | ✅ Free |
| **GitHub** | Unlimited public repos | ✅ Free |
| **TOTAL MONTHLY COST** | - | **$0** |

---

## 🎨 News Sources Included

The bot monitors these 14+ sources:

**Major Tech News:**
- 🔥 TechCrunch
- 💻 Hacker News (Y Combinator)
- 🚀 Dev.to
- ✍️ Medium - Technology

**Web Development:**
- 🎨 CSS-Tricks
- 📖 A List Apart
- 🔨 Smashing Magazine

**Developer & Infrastructure:**
- 💾 David Walsh Blog
- ☁️ Cloudflare Blog
- 🐙 GitHub Blog

**Emerging Tech:**
- 🤖 OpenAI Blog
- 📈 VentureBeat - AI
- 🔒 Mozilla Security Blog
- ⛓️ More specialized sources

---

## 🔧 Customization (Optional)

### Add More News Sources
Edit `lib/news-sources.ts`:
```typescript
{
  name: "Your Source Name",
  url: "https://example.com/feed",
  category: "Tech News"
}
```

### Change Update Frequency
Edit `vercel.json`, change `schedule`:
```json
"schedule": "0 */3 * * *"    // Every 3 hours
"schedule": "0 0 * * *"      // Daily at midnight
"schedule": "0 */12 * * *"   // Every 12 hours
```

### Adjust Summary Length
Edit `lib/huggingface-client.ts`:
```typescript
max_length: 200,  // Longer: more detailed
min_length: 30,   // Or shorter: more concise
```

### Modify Sentiment Emojis
Edit `lib/telegram-service.ts`:
```typescript
const sentimentEmoji = {
  positive: "✅",   // Change these
  negative: "❌",
  neutral: "➖"
};
```

---

## 🐛 Troubleshooting

### Bot Not Sending Messages
**Check:**
1. Is Chat ID correct? 
   ```bash
   curl "https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates"
   ```
2. Check Vercel logs: Dashboard → Functions → fetch-news → Logs
3. Manually test: `curl https://YOUR_APP.vercel.app/api/fetch-news`

### Articles Are Duplicates
- KV store not working (check KV_URL and token in Env Vars)
- RSS feeds returning old articles (normal behavior after TTL expires)

### No Articles Found
- RSS feeds down (check their websites directly)
- Network timeout (Hugging Face API slow, will retry next cycle)

### "Rate Limit Exceeded"
- You've hit free Hugging Face tier limit
- Wait 1 hour, the bot will auto-retry

### TypeScript Errors on Deploy
- Check all environment variables are set
- Run `npm run build` locally to verify

---

## 📞 Quick Support

| Issue | Solution |
|-------|----------|
| Not authenticated to Vercel | Run `vercel login` |
| GitHub repo not visible | Make sure it's in your GitHub account |
| Secrets showing in logs | Check `.env.local` isn't committed (gitignore handles) |
| Slow first message | Cold start normal (Vercel warms up) |
| Bot commands don't work | Webhook not critical for cron mode (optional feature) |

---

## 🎉 You're All Set!

Your tech news bot is now:
- ✅ **Fully deployed** on Vercel (free tier)
- ✅ **Free forever** (0 monthly cost)
- ✅ **Autonomous** (no manual intervention needed)
- ✅ **Intelligent** (AI-powered summaries & analysis)
- ✅ **Reliable** (Vercel managed infrastructure)

**Next news update will arrive in 6 hours from deployment.** Check your Telegram! 📬

---

## 📚 Additional Resources

- [Vercel Cron Docs](https://vercel.com/docs/cron-jobs)
- [Hugging Face Inference API](https://huggingface.co/inference-api)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegraf.js Docs](https://telegraf.js.org/)

Happy news reading! 📰🤖✨
