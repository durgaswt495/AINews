import crypto from "crypto";
import axios from "axios";

export interface AmazonDeal {
  id: string;
  title: string;
  productUrl: string;
  imageUrl?: string;
  currentPrice?: number;
  originalPrice?: number;
  discountPercent?: number;
  source: string;
}

interface AmazonApiItem {
  ASIN?: string;
  DetailPageURL?: string;
  ItemInfo?: {
    Title?: { DisplayValue?: string };
  };
  Images?: {
    Primary?: {
      Large?: { URL?: string };
      Medium?: { URL?: string };
      Small?: { URL?: string };
    };
  };
  Offers?: {
    Listings?: Array<{
      Price?: {
        Amount?: number;
        Savings?: { Amount?: number; Percentage?: number };
      };
    }>;
    Summaries?: Array<{
      LowestPrice?: { Amount?: number };
      HighestPrice?: { Amount?: number };
    }>;
  };
}

function isoTimestamp(date: Date): string {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function getSignatureKey(secret: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function getEnv(name: string): string {
  const value = process.env[name];
  return value ? value.trim() : "";
}

export async function fetchAmazonDeals(): Promise<AmazonDeal[]> {
  const accessKey = getEnv("AMAZON_PAAPI_ACCESS_KEY");
  const secretKey = getEnv("AMAZON_PAAPI_SECRET_KEY");
  const partnerTag = getEnv("AMAZON_PAAPI_PARTNER_TAG") || getEnv("AMAZON_AFFILIATE_TAG");

  if (!accessKey || !secretKey || !partnerTag) {
    return [];
  }

  const host = getEnv("AMAZON_PAAPI_HOST") || "webservices.amazon.in";
  const region = getEnv("AMAZON_PAAPI_REGION") || "eu-west-1";
  const marketplace = getEnv("AMAZON_PAAPI_MARKETPLACE") || "www.amazon.in";
  const keywords = (getEnv("AMAZON_KEYWORDS") || "laptop,headphones,smartphone")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 5);

  const endpoint = `https://${host}/paapi5/searchitems`;
  const results: AmazonDeal[] = [];

  for (const keyword of keywords) {
    const payloadObj = {
      Keywords: keyword,
      SearchIndex: "All",
      ItemCount: 10,
      PartnerTag: partnerTag,
      PartnerType: "Associates",
      Marketplace: marketplace,
      SortBy: "Relevance",
      Resources: [
        "Images.Primary.Large",
        "ItemInfo.Title",
        "Offers.Listings.Price",
        "Offers.Summaries.LowestPrice",
        "Offers.Summaries.HighestPrice",
      ],
    };

    const payload = JSON.stringify(payloadObj);
    const amzDate = isoTimestamp(new Date());
    const dateStamp = amzDate.slice(0, 8);

    const method = "POST";
    const canonicalUri = "/paapi5/searchitems";
    const canonicalQueryString = "";

    const canonicalHeaders = [
      `content-encoding:amz-1.0\n`,
      `content-type:application/json; charset=utf-8\n`,
      `host:${host}\n`,
      `x-amz-date:${amzDate}\n`,
      `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems\n`,
    ].join("");

    const signedHeaders = "content-encoding;content-type;host;x-amz-date;x-amz-target";
    const payloadHash = sha256Hex(payload);

    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/ProductAdvertisingAPI/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join("\n");

    const signingKey = getSignatureKey(secretKey, dateStamp, region, "ProductAdvertisingAPI");
    const signature = crypto.createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

    const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    try {
      const response = await axios.post(
        endpoint,
        payload,
        {
          timeout: 20000,
          headers: {
            "Content-Encoding": "amz-1.0",
            "Content-Type": "application/json; charset=utf-8",
            Host: host,
            "X-Amz-Date": amzDate,
            "X-Amz-Target": "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems",
            Authorization: authorization,
          },
        }
      );

      const items: AmazonApiItem[] = response.data?.SearchResult?.Items || [];
      for (const item of items) {
        const listing = item.Offers?.Listings?.[0];
        const currentPrice = listing?.Price?.Amount;
        const savingsAmount = listing?.Price?.Savings?.Amount;
        const explicitPercent = listing?.Price?.Savings?.Percentage;
        const originalPrice = currentPrice && savingsAmount ? currentPrice + savingsAmount : undefined;
        const discountPercent = explicitPercent ?? (
          currentPrice && originalPrice && originalPrice > currentPrice
            ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
            : undefined
        );

        const title = item.ItemInfo?.Title?.DisplayValue || "Amazon product";
        const asin = item.ASIN || title;
        const productUrl = item.DetailPageURL || `https://${marketplace}/dp/${asin}`;

        results.push({
          id: `amazon:${asin}`,
          title,
          productUrl,
          imageUrl:
            item.Images?.Primary?.Large?.URL ||
            item.Images?.Primary?.Medium?.URL ||
            item.Images?.Primary?.Small?.URL,
          currentPrice,
          originalPrice,
          discountPercent,
          source: "Amazon",
        });
      }
    } catch (error) {
      console.error(`Amazon PA-API request failed for keyword '${keyword}':`, error);
    }
  }

  return results;
}
