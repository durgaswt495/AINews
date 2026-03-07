const AFFILIATE_DOMAINS: Record<string, { key: string; env: string }> = {
  "amazon.": { key: "tag", env: "AMAZON_AFFILIATE_TAG" },
  "flipkart.": { key: "affid", env: "FLIPKART_AFFILIATE_ID" },
};

function applyDomainAffiliateParams(url: URL): void {
  const hostname = url.hostname.toLowerCase();

  for (const [needle, config] of Object.entries(AFFILIATE_DOMAINS)) {
    if (hostname.includes(needle)) {
      const value = process.env[config.env];
      if (value) {
        url.searchParams.set(config.key, value);
      }
    }
  }
}

export function buildAffiliateUrl(productUrl: string): string {
  try {
    const url = new URL(productUrl);
    applyDomainAffiliateParams(url);

    const genericParams = process.env.AFFILIATE_QUERY_PARAMS;
    if (genericParams) {
      const extra = new URLSearchParams(genericParams);
      for (const [key, value] of extra.entries()) {
        url.searchParams.set(key, value);
      }
    }

    const redirectBase = process.env.AFFILIATE_REDIRECT_BASE;
    if (redirectBase) {
      const redirect = new URL(redirectBase);
      redirect.searchParams.set("url", url.toString());
      return redirect.toString();
    }

    return url.toString();
  } catch {
    return productUrl;
  }
}
