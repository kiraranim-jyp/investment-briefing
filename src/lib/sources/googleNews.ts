import { XMLParser } from "fast-xml-parser";
import type { NewsItem } from "../types";
import { fetchWithTimeout } from "../utils";

const parser = new XMLParser({ ignoreAttributes: false });

/**
 * Google News RSS는 인증이 필요 없다. 검색어 기반으로 국내(ko)/해외(en) 뉴스를 가져온다.
 */
export async function fetchGoogleNews(
  query: string,
  lang: "ko" | "en" = "ko",
  limit = 8
): Promise<NewsItem[]> {
  const hl = lang === "ko" ? "ko" : "en-US";
  const gl = lang === "ko" ? "KR" : "US";
  const ceid = lang === "ko" ? "KR:ko" : "US:en";
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query
  )}&hl=${hl}&gl=${gl}&ceid=${ceid}`;

  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": "Mozilla/5.0 (investment-briefing bot)" },
  });
  if (!res.ok) {
    throw new Error(`Google News RSS 요청 실패 (${res.status})`);
  }
  const xml = await res.text();
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item;
  const list = Array.isArray(items) ? items : items ? [items] : [];

  return list.slice(0, limit).map((item: any) => ({
    title: String(item.title ?? ""),
    url: String(item.link ?? ""),
    source: String(item.source?.["#text"] ?? item.source ?? "Google News"),
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
  }));
}
