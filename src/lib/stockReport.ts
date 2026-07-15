import { buildBriefing } from "./briefing";
import { generateStockReport } from "./ai/claude";
import { cacheStockReport, getCachedStockReport } from "./store/kv";
import {
  fetchChartMeta,
  fetchPriceHistory,
  fetchQuoteFundamentals,
  resolveTicker,
  type PricePoint,
} from "./sources/yahooFinance";
import { companyId } from "./utils";
import type { Company, CompanyProfile, StockReport } from "./types";

function computeMomentumSummary(
  profile: CompanyProfile,
  points: PricePoint[]
): { available: boolean; summary: string } {
  if (points.length < 2 || profile.price == null) {
    return { available: false, summary: "" };
  }
  const first = points[0].close;
  const last = points[points.length - 1].close;
  const periodReturnPct = ((last - first) / first) * 100;

  const parts: string[] = [`최근 1개월 수익률 ${periodReturnPct >= 0 ? "+" : ""}${periodReturnPct.toFixed(1)}%`];

  if (profile.fiftyTwoWeekHigh != null && profile.fiftyTwoWeekLow != null) {
    const range = profile.fiftyTwoWeekHigh - profile.fiftyTwoWeekLow;
    if (range > 0) {
      const positionPct = ((profile.price - profile.fiftyTwoWeekLow) / range) * 100;
      const fromHighPct = ((profile.price - profile.fiftyTwoWeekHigh) / profile.fiftyTwoWeekHigh) * 100;
      parts.push(
        `52주 레인지 내 위치 ${positionPct.toFixed(0)}% (52주 고점 대비 ${fromHighPct.toFixed(1)}%)`
      );
    }
  }

  const recentWindow = points.slice(-5);
  if (recentWindow.length >= 2) {
    const recentReturn =
      ((recentWindow[recentWindow.length - 1].close - recentWindow[0].close) / recentWindow[0].close) * 100;
    parts.push(`최근 5거래일 ${recentReturn >= 0 ? "상승" : "하락"} 흐름(${recentReturn >= 0 ? "+" : ""}${recentReturn.toFixed(1)}%)`);
  }

  return { available: true, summary: parts.join(", ") };
}

async function buildCompanyProfile(company: Company): Promise<CompanyProfile> {
  const partialFailures: string[] = [];
  const resolved = await resolveTicker(company.name, company.market).catch(() => null);

  if (!resolved) {
    partialFailures.push("시세/재무 데이터 소스에서 종목을 찾지 못했습니다.");
    return {
      ticker: null,
      displayName: company.name,
      currency: null,
      price: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      volume: null,
      per: null,
      pbr: null,
      roe: null,
      dividendYield: null,
      marketCap: null,
      eps: null,
      sector: null,
      industry: null,
      businessSummary: null,
      partialFailures,
    };
  }

  const [metaResult, fundamentals] = await Promise.all([
    fetchChartMeta(resolved.symbol).catch((err) => {
      partialFailures.push(`시세 조회 실패: ${err.message ?? err}`);
      return null;
    }),
    fetchQuoteFundamentals(resolved.symbol).catch(() => null),
  ]);

  if (!fundamentals) {
    partialFailures.push("PER/PBR/ROE 등 상세 재무지표를 가져오지 못했습니다 (시세 정보만 제공).");
  }

  return {
    ticker: resolved.symbol,
    displayName: resolved.displayName,
    currency: metaResult?.currency ?? null,
    price: metaResult?.regularMarketPrice ?? null,
    fiftyTwoWeekHigh: metaResult?.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: metaResult?.fiftyTwoWeekLow ?? null,
    volume: metaResult?.regularMarketVolume ?? null,
    per: fundamentals?.trailingPE ?? null,
    pbr: fundamentals?.priceToBook ?? null,
    roe: fundamentals?.returnOnEquity ?? null,
    dividendYield: fundamentals?.dividendYield ?? null,
    marketCap: fundamentals?.marketCap ?? null,
    eps: fundamentals?.trailingEps ?? null,
    sector: fundamentals?.sector ?? null,
    industry: fundamentals?.industry ?? null,
    businessSummary: fundamentals?.longBusinessSummary ?? null,
    partialFailures,
  };
}

export async function buildStockReport(company: Company, useCache = true): Promise<StockReport> {
  const id = companyId(company.name, company.market);

  if (useCache) {
    const cached = await getCachedStockReport(id);
    if (cached) return cached;
  }

  const [profile, briefing] = await Promise.all([buildCompanyProfile(company), buildBriefing(company)]);

  const points = profile.ticker
    ? await fetchPriceHistory(profile.ticker, "1M").catch(() => [] as PricePoint[])
    : [];

  const momentum = computeMomentumSummary(profile, points);
  const supplyDemandAvailable = false; // Sprint 1: 실제 수급 데이터 소스 없음 (뉴스 기반 AI 추정으로 대체)

  const partialFailures = [...profile.partialFailures, ...briefing.partialFailures];
  if (!momentum.available) {
    partialFailures.push("가격 히스토리를 가져오지 못해 기술점수는 뉴스/공시 기반 추정치입니다.");
  }

  let ai;
  try {
    ai = await generateStockReport({
      company,
      profile,
      briefing: {
        newsSummary: briefing.newsSummary,
        disclosureSummary: briefing.disclosureSummary,
        trends: briefing.trends,
        checkpoints: briefing.checkpoints,
      },
      momentum,
      supplyDemandAvailable,
    });
  } catch (err: any) {
    partialFailures.push(`AI 투자 리포트 생성 실패: ${err.message ?? err}`);
    ai = {
      strengths: [],
      weaknesses: [],
      starRating: 3,
      score: {
        financial: 50,
        technical: 50,
        news: 50,
        supplyDemand: 50,
        growth: 50,
        valuation: 50,
        total: 50,
        rating: "위험" as const,
      },
      opinion: "주의" as const,
      opinionReason: "AI 리포트를 생성하지 못했습니다. 데이터 부족으로 보수적 점수를 표시합니다.",
    };
  }

  const report: StockReport = {
    company,
    generatedAt: new Date().toISOString(),
    profile,
    strengths: ai.strengths,
    weaknesses: ai.weaknesses,
    starRating: ai.starRating,
    score: ai.score,
    scoreIsEstimated: {
      supplyDemand: !supplyDemandAvailable,
      technical: !momentum.available,
    },
    opinion: ai.opinion,
    opinionReason: ai.opinionReason,
    briefing,
    partialFailures,
  };

  await cacheStockReport(id, report);
  return report;
}
