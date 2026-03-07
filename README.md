# Affiliate Deals Publisher (Vercel)

Serverless app that fetches product deals, picks the best ones, converts links into affiliate links, and posts them once per day to Telegram and WhatsApp.

## What it does

- Pulls deals from:
  - Amazon Product Advertising API (when configured)
  - RSS feeds (`DEAL_FEEDS`) as fallback/supplement
- Tracks price history and qualifies deals only when:
  - discount is `>= MIN_DISCOUNT_PERCENT` (default 60), or
  - current price is at/near the 30-day low
- Resolves product image (API/feed media/OpenGraph)
- Adds affiliate parameters (Amazon/Flipkart/custom)
- Posts to:
  - Telegram channel/chat
  - WhatsApp recipients through Meta Cloud API
- Runs daily on Vercel Cron
- Prevents duplicate reposting using Vercel KV

## Endpoints

- `GET /api/fetch-news`:
  - Manual trigger for deals publishing
  - Requires `Authorization: Bearer <CRON_SECRET>` in production

## Vercel Cron

Configured in `vercel.json`:

- `30 3 * * *` (daily at 03:30 UTC = 09:00 IST)

## Environment variables

Use `.env.example` as the source of truth.

Required for core flow:

- `CRON_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_RECIPIENTS`
- `DAILY_DEALS_LIMIT`
- `MIN_DISCOUNT_PERCENT`
- `THIRTY_DAY_LOW_EPSILON`

For Amazon affiliate product fetch (recommended):

- `AMAZON_PAAPI_ACCESS_KEY`
- `AMAZON_PAAPI_SECRET_KEY`
- `AMAZON_PAAPI_PARTNER_TAG`
- `AMAZON_PAAPI_HOST`
- `AMAZON_PAAPI_REGION`
- `AMAZON_PAAPI_MARKETPLACE`
- `AMAZON_KEYWORDS`

Affiliate tracking params:

- `AMAZON_AFFILIATE_TAG`
- `FLIPKART_AFFILIATE_ID`
- optional `AFFILIATE_QUERY_PARAMS`
- optional `AFFILIATE_REDIRECT_BASE`

Optional RSS sources:

- `DEAL_FEEDS`

Recommended for dedupe persistence:

- `VERCEL_KV_URL`
- `VERCEL_KV_REST_API_TOKEN`

## Local test

```bash
npm install
npm run build
npx vercel dev
curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/fetch-news
```

## Deploy on Vercel

1. Import repository into Vercel.
2. Add all env vars from `.env.example` in Vercel Project Settings.
3. Deploy.
4. Test cron manually from Vercel dashboard or hit `/api/fetch-news` with bearer token.

## WhatsApp note

Current integration uses Meta WhatsApp Cloud API recipients (`WHATSAPP_RECIPIENTS`). If you specifically need WhatsApp Channels posting, share the provider/API you want to use and I will adapt the sender accordingly.
