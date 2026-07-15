import { buildBriefing } from "./briefing";
import { buildIndustryTrend } from "./industry";
import { generateInvestmentGuide } from "./ai/claude";
import { getLatestGuide, saveLatestGuide } from "./store/kv";
import { fetchChartMeta, resolveTicker } from "./sources/yahooFinance";
import type { InvestmentGuide, MarketOverview, WatchlistEntry } from "./types";

const NEAR_52WEEK_THRESHOLD = 0.03; // 52주 고점/저점 대비 3% 이내면 "근접"으로 표시

/**
 * 목표가/52주 신고가·신저가 근접 여부를 숫자로 직접 비교해 계산한다 (AI 아님).
 * 모닝메일이 하루 1회(크론) 생성될 때만 점검하므로 실시간 알림이 아니라 "일일 체크"다 —
 * Vercel Hobby 플랜 크론은 최소 주기가 1일이라 더 잦은 체크는 이 인프라에서 불가능하다.
 */
async function computePriceAlerts(entry: WatchlistEntry): Promise<string[]> {
  const alerts: string[] = [];
  try {
    const resolved = await resolveTicker(entry.name, entry.market);
    if (!resolved) return alerts;
    const meta = await fetchChartMeta(resolved.symbol);
    const price = meta.regularMarketPrice;

    if (entry.alertTargetPrice != null) {
      if (price >= entry.alertTargetPrice) {
        alerts.push(`목표가 ${entry.alertTargetPrice.toLocaleString()} 도달 (현재가 ${price.toLocaleString()})`);
      }
    }

    if (meta.fiftyTwoWeekHigh && price >= meta.fiftyTwoWeekHigh * (1 - NEAR_52WEEK_THRESHOLD)) {
      alerts.push(`52주 신고가(${meta.fiftyTwoWeekHigh.toLocaleString()}) 근접`);
    }
    if (meta.fiftyTwoWeekLow && price <= meta.fiftyTwoWeekLow * (1 + NEAR_52WEEK_THRESHOLD)) {
      alerts.push(`52주 신저가(${meta.fiftyTwoWeekLow.toLocaleString()}) 근접`);
    }
  } catch {
    // 시세 조회 실패 시 알림 없이 진행 (FR-6 부분 실패 허용)
  }
  return alerts;
}

export async function generateGuideForEntry(
  entry: WatchlistEntry,
  marketOverview: MarketOverview
): Promise<InvestmentGuide> {
  const [briefing, industry, previous, alerts] = await Promise.all([
    buildBriefing({ name: entry.name, market: entry.market }),
    buildIndustryTrend(entry.sector),
    getLatestGuide(entry.companyId).catch(() => null),
    computePriceAlerts(entry),
  ]);

  const guide = await generateInvestmentGuide({
    company: { name: entry.name, market: entry.market },
    briefing: {
      newsSummary: briefing.newsSummary,
      disclosureSummary: briefing.disclosureSummary,
      trends: briefing.trends,
      checkpoints: briefing.checkpoints,
    },
    marketSummary: marketOverview.summary,
    industrySummary: industry.summary,
    previousHeadline: previous?.headline,
    previousCheckpoints: previous?.checkpoints,
    sources: briefing.sources,
    alerts,
  });

  await saveLatestGuide(entry.companyId, guide);
  return guide;
}
