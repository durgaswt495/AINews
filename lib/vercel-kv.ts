import axios from "axios";
import crypto from "crypto";

interface KVConfig {
  url: string;
  token: string;
}

// In-memory fallback store when Vercel KV is not configured or unreachable
const inMemoryStore = new Map<string, StoredArticle>();

const getKVConfig = (): KVConfig | null => {
  const url = process.env.VERCEL_KV_URL;
  const token = process.env.VERCEL_KV_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  return { url, token };
};

export interface StoredArticle {
  id: string;
  title: string;
  link: string;
  source: string;
  pubDate: string;
  summary: string;
  sentiment: string;
  topic: string;
  processedAt: string;
}

/**
 * Generate a unique hash for an article based on title and source
 */
function generateArticleId(title: string, source: string): string {
  return crypto
    .createHash("md5")
    .update(`${title}:${source}`)
    .digest("hex");
}

/**
 * Check if an article already exists in the KV store
 */
export async function articleExists(
  title: string,
  source: string
): Promise<boolean> {
  try {
    const config = getKVConfig();
    const articleId = generateArticleId(title, source);

    if (!config) {
      // Fallback to in-memory store
      return inMemoryStore.has(articleId);
    }

    const response = await axios.get(
      `${config.url}/get/${articleId}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      }
    );

    return response.data.result !== null;
  } catch (error) {
    // Article doesn't exist if GET returns error
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return false;
    }
    console.error("Error checking article existence:", error);
    return false;
  }
}

/**
 * Store a processed article in KV
 */
export async function storeArticle(article: StoredArticle): Promise<void> {
  try {
    const config = getKVConfig();
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds

    if (!config) {
      // Fallback to in-memory store
      inMemoryStore.set(article.id, article);
      console.log(`Stored article in memory: ${article.id}`);
      return;
    }

    try {
      await axios.post(
        `${config.url}/set/${article.id}`,
        JSON.stringify(article),
        {
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          params: {
            ex: ttl, // Set expiration time
          },
        }
      );

      console.log(`Stored article: ${article.id}`);
    } catch (kvError) {
      console.error("KV store failed, falling back to in-memory store:", kvError);
      inMemoryStore.set(article.id, article);
      console.log(`Stored article in memory: ${article.id}`);
    }
  } catch (error) {
    console.error("Unexpected error storing article:", error);
  }
}

/**
 * Retrieve article from KV store
 */
export async function getArticle(
  title: string,
  source: string
): Promise<StoredArticle | null> {
  try {
    const config = getKVConfig();
    const articleId = generateArticleId(title, source);

    if (!config) {
      return inMemoryStore.get(articleId) || null;
    }

    const response = await axios.get(
      `${config.url}/get/${articleId}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      }
    );

    return response.data.result;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error("Error retrieving article from KV:", error);
    return null;
  }
}

/**
 * Delete article from KV store
 */
export async function deleteArticle(
  title: string,
  source: string
): Promise<void> {
  try {
    const config = getKVConfig();
    const articleId = generateArticleId(title, source);

    if (!config) {
      inMemoryStore.delete(articleId);
      console.log(`Deleted article from memory: ${articleId}`);
      return;
    }

    await axios.delete(
      `${config.url}/del/${articleId}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      }
    );

    console.log(`Deleted article: ${articleId}`);
  } catch (error) {
    console.error("Error deleting article from KV:", error);
  }
}

/**
 * Get all stored articles (with pattern matching)
 */
export async function getAllArticles(
  pattern: string = "*"
): Promise<StoredArticle[]> {
  try {
    const config = getKVConfig();

    if (!config) {
      return Array.from(inMemoryStore.values());
    }

    const response = await axios.get(
      `${config.url}/keys/${pattern}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      }
    );

    const keys: string[] = response.data.result || [];
    const articles: StoredArticle[] = [];

    for (const key of keys) {
      const article = await getArticle(key, "");
      if (article) {
        articles.push(article);
      }
    }

    return articles;
  } catch (error) {
    console.error("Error retrieving all articles from KV:", error);
    return [];
  }
}

/**
 * Clear all articles from KV store (use with caution!)
 */
export async function clearAllArticles(): Promise<void> {
  try {
    const config = getKVConfig();

    if (!config) {
      const count = inMemoryStore.size;
      inMemoryStore.clear();
      console.log(`Cleared ${count} articles from in-memory store`);
      return;
    }

    const response = await axios.get(
      `${config.url}/keys/*`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      }
    );

    const keys: string[] = response.data.result || [];

    for (const key of keys) {
      await axios.delete(
        `${config.url}/del/${key}`,
        {
          headers: {
            Authorization: `Bearer ${config.token}`,
          },
        }
      );
    }

    console.log(`Cleared ${keys.length} articles from KV store`);
  } catch (error) {
    console.error("Error clearing KV store:", error);
  }
}
