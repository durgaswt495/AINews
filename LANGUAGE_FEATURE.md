# Language-Based News Updates

Your Tech News Bot now supports **multi-language filtering**! Users can select their preferred language and receive tech news articles only in that language.

## Features

✅ **10+ Supported Languages**:
- English 🇺🇸
- Spanish 🇪🇸
- French 🇫🇷
- German 🇩🇪
- Italian 🇮🇹
- Portuguese 🇵🇹
- Dutch 🇳🇱
- Russian 🇷🇺
- Chinese 🇨🇳
- Japanese 🇯🇵

✅ **Automatic Language Detection**: Each article is automatically analyzed to detect its language

✅ **User Preferences**: Each user can choose their preferred language; preferences are stored for 1 year

✅ **Filtered Updates**: Only articles matching the user's language preference are sent

## How It Works

### 1. **Detect Article Language**
When each article is fetched and processed:
- The HuggingFace multilingual model analyzes the text
- Language is detected from title + first part of content
- Fallback detection uses character patterns (Chinese characters, Cyrillic, etc.)

### 2. **Store User Preferences**
When a user selects a language via Telegram:
- Preference is stored in Vercel KV (or in-memory fallback)
- Preference persists for 1 year
- Stored with user's Telegram ID

### 3. **Filter & Send News**
During each cron execution:
- Fetch articles from all RSS sources
- Process and detect language of each article
- Retrieve user's language preference
- Filter articles to only those matching the language
- Send filtered articles to Telegram

## User Commands

### Set Language
```
/en    - Switch to English 🇺🇸
/es    - Switch to Spanish 🇪🇸
/fr    - Switch to French 🇫🇷
/de    - Switch to German 🇩🇪
/it    - Switch to Italian 🇮🇹
/pt    - Switch to Portuguese 🇵🇹
/nl    - Switch to Dutch 🇳🇱
/ru    - Switch to Russian 🇷🇺
/zh    - Switch to Chinese 🇨🇳
/ja    - Switch to Japanese 🇯🇵
```

### View Available Languages
```
/lang  - Show current language and all available options
```

### Other Commands
```
/start - Welcome message
/help  - Show help and available commands
/stats - Show article statistics
```

## Example Usage Flow

1. **User sends `/lang`**
   ```
   Bot replies with current language (default: English) and list of all available languages
   ```

2. **User sends `/es`**
   ```
   Bot replies: "🇪🇸 Language Updated
   Your language preference has been set to Spanish.
   You'll now receive tech news articles in Spanish."
   ```

3. **Next cron executes** (every 6 hours)
   ```
   - Fetches 50+ articles from RSS sources
   - Detects language of each article
   - Retrieves user's preference: Spanish
   - Filters articles: only Spanish articles remain
   - Sends Spanish articles to user
   ```

4. **User sends `/en`**
   ```
   Bot switches preference to English
   Next update will send English articles only
   ```

## Technical Implementation

### New Files
- **`lib/language-service.ts`**: Language detection and utils
  - `detectLanguage(text)` - Detects language using HF multilingual model
  - `isValidLanguage(code)` - Validates language code
  - `getLanguageInfo(code)` - Returns language name and flag emoji
  - `formatLanguageList()` - Formats language list for Telegram

### Modified Files
- **`lib/huggingface-client.ts`**
  - Added `language: LanguageCode` to `SummarizedArticle`
  - Updated `processArticle()` to detect and return language

- **`lib/vercel-kv.ts`**
  - Added `setUserLanguage(userId, language)` - Store preference
  - Added `getUserLanguage(userId)` - Retrieve preference (default: "en")
  - Preferences stored with key `user_lang:{userId}`
  - TTL: 1 year in KV, memory fallback

- **`lib/telegram-service.ts`**
  - Added `language: LanguageCode` to `NewsMessage` interface
  - Updated `sendNewsToTelegram(news, userLanguage?)` - Filter articles by language
  - Header message now shows language info

- **`api/webhook.ts`**
  - Added `/lang` command to show language settings
  - Dynamically registered commands for each language (`/en`, `/es`, etc.)
  - Imported `language-service` and `vercel-kv` functions

- **`api/fetch-news.ts`**
  - Updated `processArticleWithNLP()` to return `language`
  - Retrieve user's language preference before sending
  - Pass language to `sendNewsToTelegram()`

## Storage

### User Language Preferences
```
Key: user_lang:{userId}
Value: { userId, language, setAt }
Storage: Vercel KV or in-memory fallback
TTL: 1 year (31,536,000 seconds)
```

### Example KV Entry
```json
{
  "userId": "123456789",
  "language": "es",
  "setAt": "2026-02-22T10:30:00.000Z"
}
```

## Fallback Behavior

### If Language Detection Fails
```
Uses character pattern detection:
- Chinese chars (U+4E00-U+9FFF) → Chinese
- Japanese chars (Hiragana/Katakana) → Japanese
- Cyrillic chars (U+0400-U+04FF) → Russian
- Otherwise → Default to English
```

### If Vercel KV is Unavailable
```
- User preferences stored in in-memory Map
- Preferences persist during the session
- Resets on function restart (every 6 hours for cron)
```

### If No User Preference is Set
```
- Default language: English
- All articles in all languages are sent
```

## Future Enhancements

🚀 **Coming Soon**:
- [ ] Multiple language preferences per user (e.g., `/es /en` for both Spanish and English)
- [ ] Topic filtering combined with language filtering
- [ ] Language-specific news sources (Spanish-language tech blogs, etc.)
- [ ] Language statistics in `/stats` command
- [ ] User language preference in `/lang` response with current counts per language among available articles

## Testing Language Feature

### Local Testing
```bash
# Build the project
npm run build

# Run the fetch job with language detection
node -r dotenv/config run-fetch-news.mjs
```

### Check Output
```
Processing: Article Title...
Language detected: en
Summary: ...
Sentiment: positive
Topic: AI
```

### Verify KV Storage (Vercel Dashboard)
1. Go to Vercel Project → Storage → KV
2. Look for keys starting with `user_lang:`
3. Example: `user_lang:8253950737` → value: `{"userId":"8253950737","language":"es",...}`

## API Reference

### Language Detection
```typescript
import { detectLanguage } from "./lib/language-service.js";

const lang = await detectLanguage("Article text here...");
// Returns: "en" | "es" | "fr" | "de" | "it" | "pt" | "nl" | "ru" | "zh" | "ja"
```

### User Language Preferences
```typescript
import { setUserLanguage, getUserLanguage } from "./lib/vercel-kv.js";

// Set preference
await setUserLanguage("123456789", "es");

// Get preference (defaults to "en")
const lang = await getUserLanguage("123456789"); // "es"
```

### Send Filtered News
```typescript
import { sendNewsToTelegram } from "./lib/telegram-service.js";

// Send only articles matching user's Spanish preference
await sendNewsToTelegram(newsArticles, "es");

// Send all articles regardless of language
await sendNewsToTelegram(newsArticles); // or pass "all"
```

## Troubleshooting

### Q: User doesn't receive any articles after setting language
**A:** Check that articles in that language are available:
- Use test command to see detected languages
- Broader sources may be needed for rare languages
- Check VERCEL_KV_URL is set correctly in environment

### Q: Language detection seems inaccurate
**A:** The multilingual model sometimes misidentifies languages
- Very short text has lower accuracy
- Mixed-language content is detected as primary language
- Character pattern fallback is more reliable for CJK languages

### Q: User preferences not persisting
**A:** Check Vercel KV configuration:
- Ensure VERCEL_KV_URL and VERCEL_KV_REST_API_TOKEN are set
- Check network connectivity to Upstash
- Preview environment may have different KV database than Production

---

*Feature added: February 22, 2026*
*Supported languages: 10+*
*Storage: Vercel KV + memory fallback*
