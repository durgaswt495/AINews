import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_TOKEN);

// Supported languages with Indian languages prioritized
export const SUPPORTED_LANGUAGES = {
  // Indian Languages (Primary)
  hi: { name: "Hindi", flag: "🇮🇳", script: "Devanagari" },
  bn: { name: "Bengali", flag: "🇮🇳", script: "Bengali" },
  te: { name: "Telugu", flag: "🇮🇳", script: "Telugu" },
  ta: { name: "Tamil", flag: "🇮🇳", script: "Tamil" },
  mr: { name: "Marathi", flag: "🇮🇳", script: "Devanagari" },
  gu: { name: "Gujarati", flag: "🇮🇳", script: "Gujarati" },
  kn: { name: "Kannada", flag: "🇮🇳", script: "Kannada" },
  ml: { name: "Malayalam", flag: "🇮🇳", script: "Malayalam" },
  or: { name: "Odia", flag: "🇮🇳", script: "Odia" },
  pa: { name: "Punjabi", flag: "🇮🇳", script: "Gurmukhi" },
  
  // International Languages
  en: { name: "English", flag: "🌍", script: "Latin" },
  es: { name: "Spanish", flag: "🇪🇸", script: "Latin" },
  fr: { name: "French", flag: "🇫🇷", script: "Latin" },
  de: { name: "German", flag: "🇩🇪", script: "Latin" },
  zh: { name: "Chinese", flag: "🇨🇳", script: "Han" },
  ja: { name: "Japanese", flag: "🇯🇵", script: "Japanese" },
};

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Detect the language of a given text using Hugging Face
 * Falls back to 'en' if detection fails
 */
export async function detectLanguage(text: string): Promise<LanguageCode> {
  try {
    if (!text || text.length < 10) {
      return "en"; // Default for very short text
    }

    // Use Hugging Face's text classification for language detection
    const result: any = await hf.textClassification({
      model: "bert-base-multilingual-uncased",
      inputs: text.substring(0, 512), // Limit to first 512 chars
    });

    // Extract language from result - HF returns language labels
    if (Array.isArray(result) && result.length > 0) {
      const topLabel = result[0]?.label?.toLowerCase() || "en";

      // Map language labels to codes
      const languageMap: Record<string, LanguageCode> = {
        // Indian languages
        hindi: "hi",
        bengali: "bn",
        telugu: "te",
        tamil: "ta",
        marathi: "mr",
        gujarati: "gu",
        kannada: "kn",
        malayalam: "ml",
        odia: "or",
        punjabi: "pa",
        // International languages
        english: "en",
        spanish: "es",
        french: "fr",
        german: "de",
        chinese: "zh",
        japanese: "ja",
      };

      // Try to find the language code
      for (const [key, code] of Object.entries(languageMap)) {
        if (topLabel.includes(key)) {
          return code;
        }
      }
    }

    // Fallback: simple heuristic detection using character patterns
    return detectLanguageByCharacters(text);
  } catch (error) {
    console.error("Language detection error, defaulting to English:", error);
    return "en";
  }
}

/**
 * Fallback language detection based on character patterns
 * Prioritizes Indian scripts and languages
 */
function detectLanguageByCharacters(text: string): LanguageCode {
  // Indian Scripts (Unicode ranges)
  if (/[\u0900-\u097F]/.test(text)) return "hi"; // Devanagari (Hindi, Marathi, etc.)
  if (/[\u0980-\u09FF]/.test(text)) return "bn"; // Bengali
  if (/[\u0C00-\u0C7F]/.test(text)) return "te"; // Telugu
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta"; // Tamil
  if (/[\u0B00-\u0B7F]/.test(text)) return "or"; // Odia
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu"; // Gujarati
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn"; // Kannada
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml"; // Malayalam
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa"; // Punjabi (Gurmukhi)
  
  // International Scripts
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh"; // Chinese characters
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja"; // Japanese hiragana/katakana
  if (/[\u0400-\u04FF]/.test(text)) return "en"; // Cyrillic (fallback to English)

  // Default to English
  return "en";
}

/**
 * Validate if a language code is supported
 */
export function isValidLanguage(code: string): code is LanguageCode {
  return code in SUPPORTED_LANGUAGES;
}

/**
 * Get the name and flag of a language
 */
export function getLanguageInfo(code: LanguageCode) {
  return SUPPORTED_LANGUAGES[code] || SUPPORTED_LANGUAGES.en;
}

/**
 * Format language list for telegram messages
 * Groups Indian languages first, then international
 */
export function formatLanguageList(): string {
  const indianLanguages: string[] = [];
  const internationalLanguages: string[] = [];

  for (const [code, info] of Object.entries(SUPPORTED_LANGUAGES)) {
    const line = `${info.flag} /${code} - ${info.name}`;
    if (code.length === 2 && ["hi", "bn", "te", "ta", "mr", "gu", "kn", "ml", "or", "pa"].includes(code)) {
      indianLanguages.push(line);
    } else {
      internationalLanguages.push(line);
    }
  }

  return (
    `🇮🇳 *Indian Languages (भारतीय भाषाएं):*\n` +
    indianLanguages.join("\n") +
    `\n\n🌍 *International Languages:*\n` +
    internationalLanguages.join("\n")
  );
}
