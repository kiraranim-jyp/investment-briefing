import { fetchWithTimeout, withTimeout } from "../utils";
import { containsHangul, lookupKrTicker } from "./krTickers";
import { resolveKrStockCodeFromDart } from "./dart";
import type { Market } from "../types";

const UA = "Mozilla/5.0 (investment-briefing bot)";

export type ChartRange = "1D" | "1W" | "1M" | "1Y";

const RANGE_PARAMS: Record<ChartRange, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1wk" },
};

export interface PricePoint {
  time: string; // ISO
  close: number;
}

export interface ChartMeta {
  currency: string;
  regularMarketPrice: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  regularMarketVolume: number;
  longName: string;
  shortName: string;
  chartPreviousClose: number;
}

export interface QuoteFundamentals {
  trailingPE: number | null;
  priceToBook: number | null;
  returnOnEquity: number | null;
  dividendYield: number | null;
  marketCap: number | null;
  trailingEps: number | null;
  sector: string | null;
  industry: string | null;
  longBusinessSummary: string | null;
}

async function fetchChart(symbol: string, range: string, interval: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=${range}&interval=${interval}`;
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": UA } }, 10000);
  if (!res.ok) throw new Error(`Yahoo Finance chart 요청 실패 (${res.status})`);
  const json = await withTimeout(res.json(), 8000, "Yahoo chart 응답 파싱");
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("Yahoo Finance에서 데이터를 찾을 수 없습니다.");
  return result;
}

export async function fetchChartMeta(symbol: string): Promise<ChartMeta> {
  const result = await fetchChart(symbol, "5d", "1d");
  const meta = result.meta;
  return {
    currency: meta.currency,
    regularMarketPrice: meta.regularMarketPrice,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    regularMarketVolume: meta.regularMarketVolume,
    longName: meta.longName ?? meta.shortName ?? symbol,
    shortName: meta.shortName ?? symbol,
    chartPreviousClose: meta.chartPreviousClose ?? meta.previousClose,
  };
}

export async function fetchPriceHistory(symbol: string, range: ChartRange): Promise<PricePoint[]> {
  const { range: r, interval } = RANGE_PARAMS[range];
  const result = await fetchChart(symbol, r, interval);
  const timestamps: number[] = result.timestamp ?? [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
  const points: PricePoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close == null) continue;
    points.push({ time: new Date(timestamps[i] * 1000).toISOString(), close });
  }
  return points;
}

let crumbCache: { cookie: string; crumb: string; fetchedAt: number } | null = null;
const CRUMB_TTL_MS = 30 * 60 * 1000;

async function getCrumbSession(): Promise<{ cookie: string; crumb: string } | null> {
  if (crumbCache && Date.now() - crumbCache.fetchedAt < CRUMB_TTL_MS) {
    return crumbCache;
  }
  try {
    const cookieRes = await fetchWithTimeout(
      "https://fc.yahoo.com",
      { headers: { "User-Agent": UA }, redirect: "manual" },
      8000
    );
    const setCookie = cookieRes.headers.get("set-cookie");
    const cookie = setCookie ? setCookie.split(";")[0] : "";
    if (!cookie) return null;

    const crumbRes = await fetchWithTimeout(
      "https://query1.finance.yahoo.com/v1/test/getcrumb",
      { headers: { "User-Agent": UA, Cookie: cookie } },
      8000
    );
    if (!crumbRes.ok) return null;
    const crumb = await withTimeout(crumbRes.text(), 5000, "Yahoo crumb 응답 읽기");
    if (!crumb || crumb.includes("<html")) return null;

    crumbCache = { cookie, crumb, fetchedAt: Date.now() };
    return crumbCache;
  } catch {
    return null;
  }
}

/**
 * PER/PBR/ROE/배당수익률 등은 Yahoo의 quoteSummary 엔드포인트가 필요한데, 이 엔드포인트는
 * 쿠키+crumb 기반 비공식 인증을 요구한다(2024년경 변경). 인증에 실패하면 null을 반환해
 * 상위 레이어가 chart meta만으로 부분적인 리포트를 만들도록 한다 (FR-6 부분 실패 허용).
 */
export async function fetchQuoteFundamentals(symbol: string): Promise<QuoteFundamentals | null> {
  const session = await getCrumbSession();
  if (!session) return null;

  const modules = "summaryProfile,defaultKeyStatistics,financialData,summaryDetail";
  const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
    symbol
  )}?modules=${modules}&crumb=${encodeURIComponent(session.crumb)}`;

  try {
    const res = await fetchWithTimeout(
      url,
      { headers: { "User-Agent": UA, Cookie: session.cookie } },
      10000
    );
    if (!res.ok) return null;
    const json = await withTimeout(res.json(), 8000, "Yahoo quoteSummary 응답 파싱");
    const r = json?.quoteSummary?.result?.[0];
    if (!r) return null;

    const num = (v: any): number | null => (typeof v?.raw === "number" ? v.raw : null);

    return {
      trailingPE: num(r.summaryDetail?.trailingPE),
      priceToBook: num(r.defaultKeyStatistics?.priceToBook),
      returnOnEquity: num(r.financialData?.returnOnEquity),
      dividendYield: num(r.summaryDetail?.dividendYield),
      marketCap: num(r.summaryDetail?.marketCap) ?? num(r.price?.marketCap),
      trailingEps: num(r.defaultKeyStatistics?.trailingEps),
      sector: r.summaryProfile?.sector ?? null,
      industry: r.summaryProfile?.industry ?? null,
      longBusinessSummary: r.summaryProfile?.longBusinessSummary ?? null,
    };
  } catch {
    return null;
  }
}

function normalizeForCompare(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
}

// 후보 티커가 실제로 검색한 기업과 맞는지 이름을 대조해 검증한다. 틀린 티커로 엉뚱한 기업의
// 데이터를 보여주는 사고를 막기 위한 안전장치 (큐레이션 목록/DART 폴백 모두에 적용).
function nameLooksRelated(companyName: string, candidateNames: string[]): boolean {
  const target = normalizeForCompare(companyName);
  if (!target) return false;
  return candidateNames.some((name) => {
    const n = normalizeForCompare(name);
    return n.length > 0 && (n.includes(target) || target.includes(n));
  });
}

async function searchYahooTicker(query: string): Promise<string | null> {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    query
  )}&quotesCount=5&newsCount=0`;
  const res = await fetchWithTimeout(url, { headers: { "User-Agent": UA } }, 8000);
  if (!res.ok) return null;
  const json = await withTimeout(res.json(), 5000, "Yahoo search 응답 파싱");
  const quotes = json?.quotes ?? [];
  const equity = quotes.find((q: any) => q.quoteType === "EQUITY");
  return equity?.symbol ?? null;
}

export interface ResolvedTicker {
  symbol: string;
  displayName: string;
}

/**
 * 기업명 -> Yahoo Finance 티커 심볼 해석.
 * - 미국/영문 검색어: Yahoo 검색 API 사용 (한글 검색어는 Yahoo가 400으로 거부하므로 불가)
 * - 한국/한글 검색어: 큐레이션 목록(krTickers.ts) 우선, 없으면 DART stock_code로 KS/KQ 추정
 * 어떤 경로든 최종적으로 chart meta의 회사명과 대조해 확인한 뒤에만 반환한다.
 */
export async function resolveTicker(
  companyName: string,
  market: Market
): Promise<ResolvedTicker | null> {
  // trusted: 이미 수동 검증된 매핑이라 이름 대조 없이 신뢰. unverified: 반드시 이름 대조 후 사용.
  const trusted: string[] = [];
  const unverified: string[] = [];

  if (market === "KR" && containsHangul(companyName)) {
    const curated = lookupKrTicker(companyName);
    if (curated) trusted.push(curated);

    const stockCode = await resolveKrStockCodeFromDart(companyName);
    if (stockCode) {
      unverified.push(`${stockCode}.KS`, `${stockCode}.KQ`);
    }
  } else {
    const symbol = await searchYahooTicker(companyName);
    if (symbol) unverified.push(symbol);
  }

  for (const symbol of trusted) {
    try {
      const meta = await fetchChartMeta(symbol);
      return { symbol, displayName: meta.longName };
    } catch {
      // 다음 후보 시도
    }
  }

  for (const symbol of unverified) {
    try {
      const meta = await fetchChartMeta(symbol);
      if (nameLooksRelated(companyName, [meta.longName, meta.shortName, symbol])) {
        return { symbol, displayName: meta.longName };
      }
    } catch {
      // 다음 후보 시도
    }
  }
  return null;
}
