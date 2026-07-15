import type { DisclosureItem } from "../types";
import { fetchWithTimeout } from "../utils";

interface TickerEntry {
  cik_str: number;
  ticker: string;
  title: string;
}

let tickerCache: { entries: TickerEntry[]; fetchedAt: number } | null = null;
const TICKER_TTL_MS = 24 * 60 * 60 * 1000;

function userAgentHeaders() {
  const userAgent =
    process.env.SEC_EDGAR_USER_AGENT || "investment-briefing contact@example.com";
  return { "User-Agent": userAgent };
}

async function loadTickers(): Promise<TickerEntry[]> {
  if (tickerCache && Date.now() - tickerCache.fetchedAt < TICKER_TTL_MS) {
    return tickerCache.entries;
  }
  const res = await fetchWithTimeout(
    "https://www.sec.gov/files/company_tickers.json",
    { headers: userAgentHeaders() },
    15000
  );
  if (!res.ok) throw new Error(`SEC company_tickers 요청 실패 (${res.status})`);
  const data = (await res.json()) as Record<string, TickerEntry>;
  const entries = Object.values(data);
  tickerCache = { entries, fetchedAt: Date.now() };
  return entries;
}

function findCik(entries: TickerEntry[], companyName: string): TickerEntry | null {
  const target = companyName.trim().toLowerCase();
  const tickerMatch = entries.find((e) => e.ticker.toLowerCase() === target);
  if (tickerMatch) return tickerMatch;
  const exact = entries.find((e) => e.title.toLowerCase() === target);
  if (exact) return exact;
  const partial = entries.find((e) => e.title.toLowerCase().includes(target));
  return partial ?? null;
}

/**
 * SEC EDGAR는 API 키가 필요 없지만, User-Agent에 식별 가능한 연락처를 요구한다.
 * company_tickers.json으로 CIK을 찾고, data.sec.gov submissions API로 최근 제출 서류를 가져온다.
 */
export async function fetchSecFilings(
  companyName: string,
  limit = 8
): Promise<DisclosureItem[]> {
  const entries = await loadTickers();
  const match = findCik(entries, companyName);
  if (!match) {
    throw new Error(`SEC EDGAR에서 "${companyName}"에 해당하는 기업을 찾을 수 없습니다.`);
  }

  const cik = String(match.cik_str).padStart(10, "0");
  const res = await fetchWithTimeout(
    `https://data.sec.gov/submissions/CIK${cik}.json`,
    { headers: userAgentHeaders() },
    15000
  );
  if (!res.ok) throw new Error(`SEC EDGAR 제출서류 요청 실패 (${res.status})`);
  const data = await res.json();

  const recent = data?.filings?.recent;
  if (!recent?.accessionNumber?.length) return [];

  const count = Math.min(limit, recent.accessionNumber.length);
  const items: DisclosureItem[] = [];
  for (let i = 0; i < count; i++) {
    const accessionNoDashes = String(recent.accessionNumber[i]).replace(/-/g, "");
    const primaryDoc = recent.primaryDocument?.[i];
    items.push({
      title: `${recent.form[i]} — ${recent.primaryDocDescription?.[i] || match.title}`,
      type: String(recent.form[i] ?? "filing"),
      date: String(recent.filingDate[i] ?? ""),
      url: primaryDoc
        ? `https://www.sec.gov/Archives/edgar/data/${match.cik_str}/${accessionNoDashes}/${primaryDoc}`
        : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=&dateb=&owner=include&count=10`,
    });
  }
  return items;
}
