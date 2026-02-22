# Deployment Guide: Tech News Telegram Bot

## Overview
This application fetches tech news from RSS feeds every **6 hours**, summarizes them using AI, analyzes sentiment/topics, and sends them to a Telegram chat.

**Deployment Model**: Vercel Serverless Functions + Cron
**Schedule**: Every 6 hours (4 times per day)
**Trigger Types**: 
- ✅ Automatic: Cron scheduler (6-hour intervals)
- ✅ Manual: Webhook + Telegram commands (`/help`, `/stats`, `/news`)

---

## Prerequisites

### 1. Vercel Account & Project
- Sign up at [vercel.com](https://vercel.com)
- Create a project or use existing `dailynews` project

### 2. Required Environment Variables
Set these in your Vercel Project Settings → Environment Variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | `7919866002:AAG7FAofjZI8bb...` |
| `TELEGRAM_CHAT_ID` | Numeric chat ID (not @username) | `8253950737` |
| `HF_TOKEN` | Hugging Face API token | `hf_QdxBAljIioVWVAGOWHV...` |
| `VERCEL_KV_URL` *(optional)* | Vercel KV Redis endpoint | `https://your-store.upstash.io` |
| `VERCEL_KV_REST_API_TOKEN` *(optional)* | KV authentication token | `your_kv_token_here` |

**Note**: KV is optional—the app falls back to in-memory storage if KV is unavailable.

---

## Getting TELEGRAM_CHAT_ID

### Method 1: Using BotFather
1. Open Telegram → Search `@BotFather`
2. Send `/newbot` → follow the prompts
3. Send `/mybots` → select your bot
4. Go to **Bot Settings** → find **Chat ID** (if available)

### Method 2: Using getUpdates API
1. Send a message to your bot in the chat
2. Run:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates"
   ```
3. Look for the numeric `id` field in the response:
   ```json
   {
     "ok": true,
     "result": [
       {
         "update_id": 123,
         "message": {
           "chat": {
             "id": 8253950737,  ← This is your TELEGRAM_CHAT_ID
             "first_name": "Your Name"
           }
         }
       }
     ]
   }
   ```

---

## Deployment Steps

### Option A: Using Vercel Dashboard

1. **Connect Repository** (if using Git)
   - Go to [vercel.com/new](https://vercel.com/new)
   - Connect your GitHub/GitLab repo
   - Select this project

2. **Configure Environment Variables**
   - Navigate to Project Settings → Environment Variables
   - Add all variables from the Prerequisites section above
   - **Important**: Set them for `Preview` and `Production` environments

3. **Verify Configuration**
   - Check that `vercel.json` exists and contains:
     ```json
     {
       "crons": [
         {
           "path": "/api/fetch-news",
           "schedule": "0 */6 * * *"
         }
       ]
     }
     ```

4. **Deploy**
   - Push to your repository (auto-deploys)
   - Or click "Deploy" in Vercel dashboard

---

### Option B: Using Vercel CLI

1. **Install Vercel CLI** (if not already)
   ```bash
   npm install -g vercel
   ```

2. **Link Project**
   ```bash
   vercel link
   ```
   - Select scope: `Durgaprasad's projects`
   - Select project: `dailynews`
   - Confirm without local `.vercel` override

3. **Set Environment Variables** (via CLI or Dashboard)
   ```bash
   vercel env add TELEGRAM_BOT_TOKEN
   vercel env add TELEGRAM_CHAT_ID
   vercel env add HF_TOKEN
   vercel env add VERCEL_KV_URL
   vercel env add VERCEL_KV_REST_API_TOKEN
   ```

4. **Deploy to Production**
   ```bash
   npm run build
   vercel --prod
   ```

5. **Verify Deployment**
   - Check: `https://dailynews.vercel.app/api/webhook` (GET returns status)
   - Telegram bot will send first update at the next cron interval (up to 6 hours)

---

## Testing Before Production

### Local Testing
```bash
# Load environment and run fetch job
npm run build
node -r dotenv/config run-fetch-news.mjs
```

Expected output:
```
Starting news fetch cycle...
Fetching from 14 sources...
Total articles fetched: 50
Articles to send: 50
Successfully sent 50 articles to Telegram
Response JSON: {"success": true, ...}
```

### Vercel Testing (Preview)
1. Push to a branch (not `main`)
2. Vercel auto-creates a preview deployment
3. Cron jobs must be tested after production deployment

---

## Cron Schedule Explanation

The schedule `0 */6 * * *` means:
- **Field 1** (`0`): Minute 0
- **Field 2** (`*/6`): Every 6 hours
- **Field 3** (`*`): Every day of month
- **Field 4** (`*`): Every month
- **Field 5** (`*`): Every day of week

**Execution times**: 00:00, 06:00, 12:00, 18:00 UTC

To change schedule:
1. Edit `vercel.json` → `crons[0].schedule`
2. Redeploy

Example schedules:
- Every 1 hour: `0 * * * *`
- Every 12 hours: `0 */12 * * *`
- Daily at 9 AM UTC: `0 9 * * *`

---

## Webhook Configuration (for Telegram Commands)

The app also listens for Telegram updates via webhook to handle user commands:

- `/start` → Welcome message
- `/help` → Show help and available commands
- `/stats` → Show article statistics (coming soon)
- `/news` → Fetch latest news immediately

### Enable Webhook in Telegram
```bash
curl -X POST https://api.telegram.org/bot<BOT_TOKEN>/setWebhook \
  -d url=https://dailynews.vercel.app/api/webhook \
  -d secret_token=your_secret_token
```

---

## Production Monitoring

### Check Deployment Status
- Vercel Dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
- View logs: Click project → **Deployments** → **Logs**

### Monitor Cron Execution
- Logs appear in Vercel **Functions** tab
- Each execution timestamp is logged

### Troubleshooting
- **No messages received**: Check TELEGRAM_CHAT_ID is numeric and bot is in the chat
- **KV errors**: They're non-fatal; app uses in-memory fallback
- **HF summarization fails**: App logs fallback message and continues

---

## Environment Variable Security

**Important**: Never commit `.env.local` with secrets to Git!

1. Add to `.gitignore` (already done):
   ```
   .env.local
   .env
   .vercel
   ```

2. Set secrets only in Vercel Dashboard (Project Settings → Environment Variables)

3. For local testing, create `.env.local`:
   ```
   # Copy from Vercel dashboard
   TELEGRAM_BOT_TOKEN=your_token_here
   TELEGRAM_CHAT_ID=your_chat_id
   HF_TOKEN=your_hf_token
   ```

---

## Rollback & Redeployment

If issues occur:

**Via Vercel Dashboard**:
1. Go to **Deployments** tab
2. Click a previous successful build
3. Click **...** → **Promote to Production**

**Via CLI**:
```bash
vercel deployments ls  # List all deployments
vercel promote <deployment-url>
```

---

## Next Steps

1. ✅ Verify all environment variables in `.env.local`
2. ✅ Test locally: `node -r dotenv/config run-fetch-news.mjs`
3. ✅ Confirm correct `TELEGRAM_CHAT_ID` (numeric, not @username)
4. 📋 Deploy via CLI: `vercel --prod`
5. 📋 Wait for first cron execution (up to 6 hours)
6. 📋 Check Vercel dashboard logs for confirm success

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Telegraf.js**: https://telegraf.js.org/
- **CRON Syntax**: https://crontab.guru/ (test schedules)
- **Telegram Bot API**: https://core.telegram.org/bots/api

---

*Last Updated: Feb 22, 2026*
