import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_TOKEN);

export interface SummarizedArticle {
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  topic: string;
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

    return result[0]?.summary_text || "Failed to generate summary";
  } catch (error) {
    console.error("Summarization error:", error);
    throw new Error("Failed to summarize article");
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

  const [summary, sentiment, topic] = await Promise.all([
    summarizeText(textToProcess),
    analyzeSentiment(textToProcess),
    classifyTopic(textToProcess),
  ]);

  return {
    summary,
    sentiment,
    topic,
  };
}
