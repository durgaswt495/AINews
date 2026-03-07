export interface DealSource {
  name: string;
  url: string;
  category?: string;
}

const defaultDealSources: DealSource[] = [
  {
    name: "Slickdeals",
    url: "https://slickdeals.net/newsearch.php?searcharea=deals&searchin=first&rss=1",
    category: "General Deals",
  },
  {
    name: "Reddit BuildAPCSales",
    url: "https://www.reddit.com/r/buildapcsales/.rss",
    category: "Electronics",
  },
];

export function getDealSources(): DealSource[] {
  const envSources = process.env.DEAL_FEEDS;
  if (!envSources) {
    return defaultDealSources;
  }

  const parsed = envSources
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      name: `Custom Feed ${index + 1}`,
      url,
      category: "Custom",
    }));

  return parsed.length > 0 ? parsed : defaultDealSources;
}
