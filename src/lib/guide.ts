import { buildBriefing } from "./briefing";
import { buildIndustryTrend } from "./industry";
import { generateInvestmentGuide } from "./ai/claude";
import { getLatestGuide, saveLatestGuide } from "./store/kv";
import type { InvestmentGuide, MarketOverview, WatchlistEntry } from "./types";

export async function generateGuideForEntry(
  entry: WatchlistEntry,
  marketOverview: MarketOverview
): Promise<InvestmentGuide> {
  const [briefing, industry, previous] = await Promise.all([
    buildBriefing({ name: entry.name, market: entry.market }),
    buildIndustryTrend(entry.sector),
    getLatestGuide(entry.companyId).catch(() => null),
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
  });

  await saveLatestGuide(entry.companyId, guide);
  return guide;
}
