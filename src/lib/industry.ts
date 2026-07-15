import { fetchGoogleNews } from "./sources/googleNews";
import { summarizeIndustryTrend } from "./ai/claude";
import type { IndustryTrend } from "./types";

export async function buildIndustryTrend(sector: string): Promise<IndustryTrend> {
  const partialFailures: string[] = [];

  let relatedNews: IndustryTrend["relatedNews"] = [];
  try {
    relatedNews = await fetchGoogleNews(`${sector} 업황`, "ko", 6);
  } catch (err: any) {
    partialFailures.push(`산업 뉴스 수집 실패: ${err.message ?? err}`);
  }

  let summary: string;
  try {
    summary = await summarizeIndustryTrend(sector, relatedNews);
  } catch (err: any) {
    partialFailures.push(`AI 산업 요약 실패: ${err.message ?? err}`);
    summary = relatedNews.length
      ? "AI 요약을 생성하지 못했습니다. 아래 뉴스를 참고하세요."
      : "수집된 산업 뉴스가 없습니다.";
  }

  return { sector, relatedNews, summary, partialFailures };
}
