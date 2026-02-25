import { HfInference } from "@huggingface/inference";
import { detectLanguage, type LanguageCode } from "./language-service.js";

const hf = new HfInference(process.env.HF_TOKEN);

export interface SummarizedArticle {
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  topic: string;
  language: LanguageCode;
}

async function summarizeText(text: string): Promise<string> {
  try {
    const result: any = await hf.summarization({
      model: "facebook/bart-large-cnn",
      inputs: text,
      parameters: {
        max_length: 130,
        min_length: 30,
        do_sample: false,
      },
    });

    // Handle different provider response formats
    if (!result) {
      throw new Error("Empty summarization result");
    }

    // If provider returns an array of objects with `summary_text`
    if (Array.isArray(result) && result.length > 0) {
      const first = result[0];
      if (typeof first === "string") return first;
      if (first.summary_text) return first.summary_text;
    }

    // If provider returns a string
    if (typeof result === "string") return result;

    // If provider returns an object with `summary_text`
    if (result.summary_text) return result.summary_text;

    throw new Error("Unsupported summarization result format");
  } catch (error) {
    console.error("Summarization error, falling back to extractive summary:", error);

    // Fallback: simple extractive summary (first 2 sentences)
    try {
      const sentences = text
        .replace(/\n+/g, " ")
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean);
      return sentences.slice(0, 2).join(" ").trim() || text.substring(0, 200);
    } catch (e) {
      return text.substring(0, 200);
    }
  }
}

async function analyzeSentiment(
  text: string
): Promise<"positive" | "negative" | "neutral"> {
  try {
    const result = await hf.textClassification({
      model: "distilbert-base-uncased-finetuned-sst-2-english",
      inputs: text.substring(0, 512), // Limit to 512 tokens
    });

    const topLabel = result[0];
    const sentimentMap: Record<string, "positive" | "negative" | "neutral"> = {
      POSITIVE: "positive",
      NEGATIVE: "negative",
      NEUTRAL: "neutral",
    };

    return sentimentMap[topLabel.label] || "neutral";
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    return "neutral";
  }
}

async function classifyTopic(text: string): Promise<string> {
  try {
    const techTopics = [
      "Artificial Intelligence",
      "Machine Learning",
      "Cybersecurity",
      "Web Development",
      "Mobile Development",
      "Cloud Computing",
      "DevOps",
      "Blockchain",
      "APIs",
      "Databases",
      "Infrastructure",
    ];

    const result: any = await hf.zeroShotClassification({
      model: "facebook/bart-large-mnli",
      inputs: text.substring(0, 1024),
      candidate_labels: techTopics,
      parameters: {
        multi_label: false,
      } as any,
    });

    return result.labels?.[0] || "Technology";
  } catch (error) {
    console.error("Topic classification error:", error);
    return "Technology";
  }
}

export async function processArticle(
  title: string,
  content: string
): Promise<SummarizedArticle> {
  const textToProcess = `${title}. ${content}`.substring(0, 1024);

  const [summary, sentiment, topic, language] = await Promise.all([
    summarizeText(textToProcess),
    analyzeSentiment(textToProcess),
    classifyTopic(textToProcess),
    detectLanguage(textToProcess),
  ]);

  return {
    summary,
    sentiment,
    topic,
    language,
  };
}
