# 🧪 Local Testing Guide

## Quick Test (Recommended)

### Option 1: Vercel Dev Server (Best - Simulates Vercel Environment)

This runs exactly like it will on Vercel production:

```bash
cd e:\MyWork\NewsApp

# Install Vercel CLI if you haven't
npm i -g vercel

# Start local Vercel environment
vercel dev
```

Output will show:
```
> Ready! Available at:
  http://localhost:3000
```

Then test the API:
```bash
# In another terminal, test the fetch-news function
curl http://localhost:3000/api/fetch-news

# Or open in browser
http://localhost:3000/api/fetch-news
```

**What happens:**
- Function will try to run
- Will fail because you need environment variables set
- See the error in terminal (this is good - shows it's working)

---

## Full Local Test (With Real Credentials)

### Step 1: Add Test Secrets to .env.local

Edit `e:\MyWork\NewsApp\.env.local`:
```env
TELEGRAM_BOT_TOKEN=your_real_bot_token_here
TELEGRAM_CHAT_ID=your_real_chat_id_here
HF_TOKEN=your_real_hf_token_here
VERCEL_KV_URL=https://your-kv-store.upstash.io
VERCEL_KV_REST_API_TOKEN=your_kv_token_here
NODE_ENV=development
```

### Step 2: Test with vercel dev

```bash
cd e:\MyWork\NewsApp
vercel dev
```

Then in another terminal:
```bash
curl http://localhost:3000/api/fetch-news
```

**This time:**
- Function will fully execute
- Fetch from RSS feeds
- Process with Hugging Face AI
- Store in KV
- **Send test message to your Telegram! 📱**

---

## Manual Testing Without Vercel Dev

### Test Individual JS Functions

```bash
cd e:\MyWork\NewsApp

# Build first
npm run build

# Test Hugging Face client directly
node -e "
const { summarizeText } = require('./lib/huggingface-client.ts');
summarizeText('This is a long article about AI...').then(console.log);
"
```

---

## What to Expect When Testing

### ✅ Success Output (When You Have Real Credentials)

```
Starting news fetch cycle...
Fetching from TechCrunch: https://techcrunch.com/feed/
Fetching from Hacker News: https://news.ycombinator.com/rss
Fetching from Dev.to: https://dev.to/feed
...
Total articles fetched: 45
Processing: "New AI Model Released"
Processing: "GitHub Adds New Feature"
...
Articles to send: 5
Successfully sent 5 articles to Telegram
```

### ⚠️ Common Testing Issues & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `TELEGRAM_BOT_TOKEN not set` | Missing env var | Add to `.env.local` |
| `VERCEL_KV_URL not set` | Missing KV setup | Skip KV for test, just check logs |
| `Invalid Telegram Token` | Wrong token | Get fresh token from @BotFather |
| `HF_TOKEN is invalid` | Wrong HF token | Get from huggingface.co/settings/tokens |
| `Connection timeout` | Network issue | Check internet, HF/Telegram APIs up |
| `TypeScript errors` | Code issues | Run `npm run build` to see full errors |

---

## No Credentials? Quick Mock Test

If you don't have credentials yet, test the code structure:

```bash
cd e:\MyWork\NewsApp

# Just verify it compiles
npm run build

# Should output nothing = success ✅
```

If you see TypeScript errors, something's wrong with the code. Otherwise it's fine!

---

## Step-by-Step Local Test

### 1. Get Your Credentials (2 min)

**Telegram:**
```
Open Telegram → Search @BotFather
Send: /newbot
Follow steps → Copy TOKEN
```

**Chat ID:**
```
Send message to your bot
Open browser: https://api.telegram.org/bot<TOKEN>/getUpdates
Find "chat":{"id":YOUR_ID}
Copy the number
```

**Hugging Face:**
```
Go to https://huggingface.co/settings/tokens
Create new token → Copy it
```

### 2. Update .env.local

```
TELEGRAM_BOT_TOKEN=123456:ABC-DEFghIklmnoPQRstuvWxyz
TELEGRAM_CHAT_ID=987654321
HF_TOKEN=hf_aBcDeFgHiJkLmNoPqRsTuVwXyZ
NODE_ENV=development

# KV is optional for testing - skip if not setup yet
VERCEL_KV_URL=https://your-kv.upstash.io
VERCEL_KV_REST_API_TOKEN=your_token
```

### 3. Run Test

```bash
cd e:\MyWork\NewsApp
vercel dev
```

### 4. In Another Terminal

```bash
curl http://localhost:3000/api/fetch-news

# Or open in browser
Start-Process "http://localhost:3000/api/fetch-news"
```

### 5. Check Results

**Look for:**
- ✅ News appearing in your Telegram
- ✅ Terminal shows success logs
- ✅ `Successfully sent X articles to Telegram`

---

## Testing Each Component

### Test 1: Just RSS Parsing (No AI)

Edit `api/fetch-news.ts` temporarily:
```typescript
// Add after fetching articles, before AI processing:
console.log('Sample articles:', allArticles.slice(0, 3));
return res.status(200).json({ articles: allArticles });
```

Run `vercel dev`, then `curl http://localhost:3000/api/fetch-news`

Should show raw articles.

### Test 2: Just Hugging Face (No RSS)

```bash
# Create test file
# test-hf.mjs
import { processArticle } from './lib/huggingface-client.ts';

const result = await processArticle(
  "New AI Model Breaks Records",
  "Scientists released a new AI model that achieves state-of-the-art results on benchmarks..."
);

console.log('Result:', result);
```

Run:
```bash
HF_TOKEN=your_token node test-hf.mjs
```

### Test 3: Just Telegram (Save to Console, Not Send)

Edit `lib/telegram-service.ts`, change:
```typescript
console.log('Would send:', message); // Instead of actual send
return;
```

Run `vercel dev` and trigger - should log messages without sending.

---

## Monitoring While Testing

### Terminal 1: Run Server
```bash
cd e:\MyWork\NewsApp
vercel dev
```

Keep this open - you'll see all logs here!

### Terminal 2: Trigger Test
```bash
curl http://localhost:3000/api/fetch-news
```

### Terminal 3: Monitor Telegram
Keep Telegram open to see messages arriving in real-time.

---

## Advanced: Debug Mode

Add debug logging by editing `api/fetch-news.ts`:

```typescript
console.log('=== DEBUG START ===');
console.log('Environment:', {
  botToken: process.env.TELEGRAM_BOT_TOKEN ? 'SET' : 'MISSING',
  chatId: process.env.TELEGRAM_CHAT_ID ? 'SET' : 'MISSING',
  hfToken: process.env.HF_TOKEN ? 'SET' : 'MISSING',
  kvUrl: process.env.VERCEL_KV_URL ? 'SET' : 'MISSING',
});
console.log('Total sources:', newsSources.length);
console.log('=== DEBUG END ===');
```

---

## Cleanup After Testing

```bash
# Stop vercel dev
# Press Ctrl+C in Terminal 1

# Remove test files if you created any
rm test-hf.mjs

# Optional: Clear KV database
curl -X DELETE "https://your-kv.upstash.io/flushall" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting Test Failures

### Issue: "Port 3000 already in use"
```bash
# Kill existing process
lsof -i :3000
kill -9 <PID>

# Or use different port
vercel dev --port 3001
```

### Issue: "Module not found"
```bash
# Reinstall dependencies
rm -r node_modules package-lock.json
npm install
npm run build
```

### Issue: "Can't find .env.local"
```bash
# Verify file exists
ls -la .env.local

# Should be in e:\MyWork\NewsApp\.env.local
```

### Issue: "Timeout waiting for response"
```bash
# Function taking too long? Check:
# 1. Increase timeout in vercel.json
# 2. Check HF API status
# 3. Check RSS feed availability
```

---

## Test Checklist

- [ ] Code compiles: `npm run build` ✅
- [ ] .env.local has credentials
- [ ] `vercel dev` starts without errors
- [ ] `curl http://localhost:3000/api/fetch-news` returns 200
- [ ] Articles appear in Telegram chat
- [ ] No JavaScript errors in terminal

Once all pass → **Ready to deploy to Vercel!** 🚀

---

## Quick Commands Reference

```bash
# Compile TypeScript
npm run build

# Start local dev server
vercel dev

# Test endpoint
curl http://localhost:3000/api/fetch-news

# Install all dependencies
npm install

# Check if build has errors
npm run build -- --listFiles

# Watch mode (if added to scripts)
npm run dev:watch
```

Ready to test? Start with `vercel dev`! 🧪
