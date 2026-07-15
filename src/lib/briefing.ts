import { fetchGoogleNews } from "./sources/googleNews";
import { fetchDartDisclosures } from "./sources/dart";
import { fetchSecFilings } from "./sources/secEdgar";
import { summarizeCompanyBriefing } from "./ai/claude";
import type { Briefing, Company, DisclosureItem, NewsItem } from "./types";

export async function buildBriefing(company: Company): Promise<Briefing> {
  const partialFailures: string[] = [];

  const [newsResult, disclosureResult] = await Promise.allSettled([
    fetchGoogleNews(company.name, company.market === "KR" ? "ko" : "en"),
    company.market === "KR"
      ? fetchDartDisclosures(company.name)
      : fetchSecFilings(company.name),
  ]);

  let news: NewsItem[] = [];
  if (newsResult.status === "fulfilled") {
    news = newsResult.value;
  } else {
    partialFailures.push(`뉴스 수집 실패: ${newsResult.reason?.message ?? newsResult.reason}`);
  }

  let disclosures: DisclosureItem[] = [];
  if (disclosureResult.status === "fulfilled") {
    disclosures = disclosureResult.value;
  } else {
    partialFailures.push(
      `공시 수집 실패: ${disclosureResult.reason?.message ?? disclosureResult.reason}`
    );
  }

  let summary;
  try {
    summary = await summarizeCompanyBriefing(company, news, disclosures);
  } catch (err: any) {
    partialFailures.push(`AI 요약 실패: ${err.message ?? err}`);
    summary = {
      newsSummary: news.length ? "AI 요약을 생성하지 못했습니다. 원문 뉴스를 참고하세요." : "수집된 뉴스가 없습니다.",
      disclosureSummary: disclosures.length
        ? "AI 요약을 생성하지 못했습니다. 원문 공시를 참고하세요."
        : "수집된 공시가 없습니다.",
      trends: [],
      checkpoints: [],
    };
  }

  return {
    company,
    generatedAt: new Date().toISOString(),
    newsSummary: summary.newsSummary,
    disclosureSummary: summary.disclosureSummary,
    trends: summary.trends,
    checkpoints: summary.checkpoints,
    sources: { news, disclosures },
    partialFailures,
  };
}
