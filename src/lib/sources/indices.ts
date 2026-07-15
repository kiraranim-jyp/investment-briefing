import type { IndexQuote, MacroIndicator } from "../types";
import { fetchWithTimeout } from "../utils";

const DOMESTIC_TICKERS: Array<{ symbol: string; name: string }> = [
  { symbol: "^KS11", name: "코스피" },
  { symbol: "^KQ11", name: "코스닥" },
];

const GLOBAL_TICKERS: Array<{ symbol: string; name: string }> = [
  { symbol: "^DJI", name: "다우존스" },
  { symbol: "^IXIC", name: "나스닥" },
  { symbol: "^GSPC", name: "S&P500" },
];

const MACRO_TICKERS: Array<{ symbol: string; name: string; unit: string }> = [
  { symbol: "KRW=X", name: "원/달러 환율", unit: "KRW" },
  { symbol: "CL=F", name: "WTI 원유", unit: "USD" },
  { symbol: "^TNX", name: "미국채 10년 금리", unit: "%" },
];

async function fetchYahooQuote(
  symbol: string
): Promise<{ value: number; changePct: number } | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}`;
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": "Mozilla/5.0 (investment-briefing bot)" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== "number") return null;
  const value = meta.regularMarketPrice;
  const prevClose = meta.previousClose ?? meta.chartPreviousClose;
  const changePct = prevClose ? ((value - prevClose) / prevClose) * 100 : 0;
  return { value, changePct };
}

async function fetchQuoteGroup(
  tickers: Array<{ symbol: string; name: string }>
): Promise<{ quotes: IndexQuote[]; failures: string[] }> {
  const quotes: IndexQuote[] = [];
  const failures: string[] = [];
  const results = await Promise.allSettled(
    tickers.map((t) => fetchYahooQuote(t.symbol))
  );
  results.forEach((result, i) => {
    const t = tickers[i];
    if (result.status === "fulfilled" && result.value) {
      quotes.push({ name: t.name, value: result.value.value, changePct: result.value.changePct });
    } else {
      failures.push(t.name);
    }
  });
  return { quotes, failures };
}

export async function fetchDomesticIndices() {
  return fetchQuoteGroup(DOMESTIC_TICKERS);
}

export async function fetchGlobalIndices() {
  return fetchQuoteGroup(GLOBAL_TICKERS);
}

export async function fetchMacroIndicators(): Promise<{
  macro: MacroIndicator[];
  failures: string[];
}> {
  const macro: MacroIndicator[] = [];
  const failures: string[] = [];
  const results = await Promise.allSettled(
    MACRO_TICKERS.map((t) => fetchYahooQuote(t.symbol))
  );
  results.forEach((result, i) => {
    const t = MACRO_TICKERS[i];
    if (result.status === "fulfilled" && result.value) {
      macro.push({
        name: t.name,
        value: result.value.value,
        unit: t.unit,
        changePct: result.value.changePct,
      });
    } else {
      failures.push(t.name);
    }
  });
  return { macro, failures };
}
