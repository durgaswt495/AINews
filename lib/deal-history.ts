import axios from "axios";
import crypto from "crypto";

interface KVConfig {
  url: string;
  token: string;
}

interface PricePoint {
  ts: string;
  price: number;
}

export interface PriceInsight {
  thirtyDayLowPrice?: number;
  isThirtyDayLow: boolean;
}

const memory = new Map<string, PricePoint[]>();

function getKVConfig(): KVConfig | null {
  const url = process.env.VERCEL_KV_URL;
  const token = process.env.VERCEL_KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

function buildKey(id: string): string {
  const hash = crypto.createHash("md5").update(id).digest("hex");
  return `price_hist:${hash}`;
}

async function readHistory(key: string): Promise<PricePoint[]> {
  const config = getKVConfig();
  if (!config) {
    return memory.get(key) || [];
  }

  try {
    const response = await axios.get(`${config.url}/get/${key}`, {
      headers: { Authorization: `Bearer ${config.token}` },
    });

    const raw = response.data?.result;
    if (!raw) return [];
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw) as PricePoint[];
      return Array.isArray(parsed) ? parsed : [];
    }

    if (Array.isArray(raw)) {
      return raw as PricePoint[];
    }

    return [];
  } catch {
    return [];
  }
}

async function writeHistory(key: string, history: PricePoint[]): Promise<void> {
  const config = getKVConfig();
  if (!config) {
    memory.set(key, history);
    return;
  }

  const ttl = 35 * 24 * 60 * 60;
  await axios.post(`${config.url}/set/${key}`, JSON.stringify(history), {
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    params: { ex: ttl },
  });
}

export async function updatePriceHistoryAndGetInsight(
  productStableId: string,
  currentPrice?: number
): Promise<PriceInsight> {
  if (!currentPrice || !Number.isFinite(currentPrice) || currentPrice <= 0) {
    return { isThirtyDayLow: false };
  }

  const key = buildKey(productStableId);
  const now = new Date();
  const threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const existing = await readHistory(key);
  const trimmed = existing.filter((point) => new Date(point.ts) >= threshold);
  const withCurrent = [...trimmed, { ts: now.toISOString(), price: currentPrice }];

  const thirtyDayLowPrice = withCurrent.reduce((min, point) => Math.min(min, point.price), currentPrice);
  const epsilon = Number.parseFloat(process.env.THIRTY_DAY_LOW_EPSILON || "0.5");
  const isThirtyDayLow = currentPrice <= thirtyDayLowPrice + epsilon;

  await writeHistory(key, withCurrent);

  return {
    thirtyDayLowPrice,
    isThirtyDayLow,
  };
}
