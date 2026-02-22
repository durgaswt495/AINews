# 🚀 Quick Reference - Deployment in 5 Steps

## Credentials You Need (Get These First)

### 1. Telegram Bot Token
```
Go to: https://telegram.me/botfather
Send: /newbot
Follow steps → Get TOKEN (save it)
Example: 123456:ABC-DEFghIklmnoPQRstuvWxyz
```

### 2. Telegram Chat ID
```
Send a message to your bot
Go to: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
Find "chat":{"id":YOUR_CHAT_ID}
Save the number
Example: 987654321
```

### 3. Hugging Face Token
```
Go to: https://huggingface.co/settings/tokens
Create New Token (Read permission)
Copy it
Example: hf_aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

---

## Deploy in 3 Steps

### Step 1: GitHub (2 min)
```bash
cd NewsApp
git init
git add .
git commit -m "Tech news bot"
git remote add origin https://github.com/YOU/NewsApp.git
git push -u origin main
```

### Step 2: Vercel Deploy (3 min)
1. Go to https://vercel.com/new
2. Import NewsApp repo
3. Click **Deploy**
4. Wait for deployment ✅

### Step 3: Add Secrets (2 min)
1. Vercel Dashboard → Settings → Environment Variables
2. Add 3 variables:
   ```
   TELEGRAM_BOT_TOKEN = <your_token>
   TELEGRAM_CHAT_ID = <your_chat_id>
   HF_TOKEN = <your_hf_token>
   ```
3. Click **Save and Redeploy**

### Step 4: Setup Database (2 min)
1. Vercel Dashboard → Storage → Create Database → KV
2. Copy REST API URL and Token
3. Add to Environment Variables:
   ```
   VERCEL_KV_URL = <url>
   VERCEL_KV_REST_API_TOKEN = <token>
   ```
4. Redeploy

### Step 5: Test (1 min)
1. Visit: `https://YOUR_APP.vercel.app/api/fetch-news`
2. Check Telegram for message
3. Done! 🎉

---

## You'll Receive News Every 6 Hours

```
📰 Tech News Update
Found X new articles from your tech feeds.

*Article Title*
_Source_
📌 Topic 🟢 (sentiment)
*Summary:* AI-generated summary...
[Link]

*Today's Sentiment Analysis:*
🟢 Positive: X
🔴 Negative: X
🟡 Neutral: X
```

---

## Customization After Deploy

### Change Update Frequency
Edit `vercel.json`, change `schedule`:
```json
"0 */3 * * *"      // Every 3 hours
"0 0 * * *"        // Daily
"0 */12 * * *"     // Every 12 hours
```

### Add News Sources
Edit `lib/news-sources.ts`, add:
```typescript
{
  name: "Your Source",
  url: "https://example.com/feed",
  category: "Category"
}
```

### Adjust Summary Length
Edit `lib/huggingface-client.ts`:
```typescript
max_length: 200,  // Longer
min_length: 30,   // Shorter
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No messages | Check Vercel logs: Functions → fetch-news → Logs |
| Invalid Chat ID | Get fresh ID from `api.telegram.org/bot<TOKEN>/getUpdates` |
| KV not working | Add VERCEL_KV_URL and token to Env Vars |
| Duplicate articles | Setup Vercel KV and redeploy |
| HF API error | Wait 1 hour (rate limit), auto-retry next cycle |

---

## Cost

**$0/month** ✅

| Service | Free Tier |
|---------|-----------|
| Vercel | 4 CPU-hrs/month (uses 1 CPU-hr) |
| Hugging Face | Unlimited (rate-limited) |
| Telegram | Unlimited |
| Vercel KV | 10K requests/day (uses 100/day) |

---

## Files Created

✅ `api/fetch-news.ts` - Main function (6h cron)
✅ `api/webhook.ts` - Telegram handler
✅ `lib/huggingface-client.ts` - AI processing
✅ `lib/telegram-service.ts` - Bot messaging
✅ `lib/news-sources.ts` - 14 RSS feeds
✅ `lib/vercel-kv.ts` - Database ops
✅ `package.json` - Dependencies
✅ `tsconfig.json` - TypeScript config
✅ `vercel.json` - Vercel config
✅ `.env.local` - Local secrets
✅ `.gitignore` - Git config
✅ `README.md` - Full docs
✅ `SETUP.md` - Setup guide
✅ `SUMMARY.md` - Project summary
✅ `dist/` - Compiled JavaScript (auto-generated)

---

## Support

- [SETUP.md](./SETUP.md) - Detailed guide
- [README.md](./README.md) - Full documentation
- [Vercel Docs](https://vercel.com/docs)

---

**Ready? Start with GitHub push, then deploy to Vercel! 🚀**
