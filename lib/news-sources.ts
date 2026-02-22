export interface NewsSource {
  name: string;
  url: string;
  category?: string;
}

export const newsSources: NewsSource[] = [
  // Major Tech News Sources
  {
    name: "TechCrunch",
    url: "https://techcrunch.com/feed/",
    category: "Tech News",
  },
  {
    name: "Hacker News",
    url: "https://news.ycombinator.com/rss",
    category: "Tech News",
  },
  {
    name: "Dev.to",
    url: "https://dev.to/feed",
    category: "Developer News",
  },
  {
    name: "Medium - Technology",
    url: "https://medium.com/feed/tag/technology",
    category: "Developer News",
  },

  // Niche Tech Blogs
  {
    name: "CSS-Tricks",
    url: "https://css-tricks.com/feed/",
    category: "Web Development",
  },
  {
    name: "A List Apart",
    url: "https://alistapart.com/feed/",
    category: "Web Development",
  },
  {
    name: "David Walsh Blog",
    url: "https://davidwalsh.name/feed",
    category: "Developer News",
  },
  {
    name: "Smashing Magazine",
    url: "https://www.smashingmagazine.com/feed/",
    category: "Web Development",
  },
  {
    name: "ThoughtWorks Technology Radar",
    url: "https://www.thoughtworks.com/insights",
    category: "Tech News",
  },
  {
    name: "OpenAI Blog",
    url: "https://openai.com/blog/rss/",
    category: "AI",
  },
  {
    name: "Cloudflare Blog",
    url: "https://blog.cloudflare.com/rss/",
    category: "Cloud Computing",
  },
  {
    name: "GitHub Blog",
    url: "https://github.blog/feed/",
    category: "Developer Tools",
  },
  {
    name: "VentureBeat - AI",
    url: "https://venturebeat.com/feed/?category=ai",
    category: "AI",
  },
  {
    name: "Speculative Execution",
    url: "https://blog.mozilla.org/feed/",
    category: "Browser/Security",
  },
];

export function getSourceUrl(index: number): string | undefined {
  return newsSources[index]?.url;
}

export function getSourceName(index: number): string {
  return newsSources[index]?.name || "Unknown";
}
