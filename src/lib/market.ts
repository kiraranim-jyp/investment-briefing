import { fetchDomesticIndices, fetchGlobalIndices, fetchMacroIndicators } from "./sources/indices";
import { summarizeMarketOverview } from "./ai/claude";
import type { MarketOverview } from "./types";

export async function buildMarketOverview(): Promise<MarketOverview> {
  const [domestic, global, macroResult] = await Promise.all([
    fetchDomesticIndices(),
    fetchGlobalIndices(),
    fetchMacroIndicators(),
  ]);

  const partialFailures = [...domestic.failures, ...global.failures, ...macroResult.failures].map(
    (name) => `${name} 데이터 수집 실패`
  );

  let summary: string;
  try {
    summary = await summarizeMarketOverview(domestic.quotes, global.quotes, macroResult.macro);
  } catch (err: any) {
    partialFailures.push(`AI 시장 요약 실패: ${err.message ?? err}`);
    summary = "AI 요약을 생성하지 못했습니다. 아래 지수 데이터를 참고하세요.";
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    domesticIndices: domestic.quotes,
    globalIndices: global.quotes,
    macro: macroResult.macro,
    summary,
    partialFailures,
  };
}
