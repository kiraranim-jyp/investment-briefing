import Anthropic from "@anthropic-ai/sdk";
import type {
  Company,
  DisclosureItem,
  IndexQuote,
  InvestmentGuide,
  MacroIndicator,
  NewsItem,
} from "../types";

// 최신 모델명은 Anthropic 문서를 확인해 필요시 ANTHROPIC_MODEL 환경변수로 교체하세요.
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  return new Anthropic({ apiKey });
}

async function askForJson<T>(system: string, prompt: string): Promise<T> {
  const client = getClient();
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const res = await client.messages.create({
    model,
    max_tokens: 1500,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const text = res.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI 응답에서 JSON을 찾지 못했습니다.");
  return JSON.parse(jsonMatch[0]) as T;
}

export interface BriefingSummary {
  newsSummary: string;
  disclosureSummary: string;
  trends: string[];
  checkpoints: string[];
}

export async function summarizeCompanyBriefing(
  company: Company,
  news: NewsItem[],
  disclosures: DisclosureItem[]
): Promise<BriefingSummary> {
  const system =
    "너는 한국 개인 투자자를 위한 리서치 애널리스트다. 반드시 JSON만 출력한다.";
  const prompt = `기업: ${company.name} (${company.market})

최근 뉴스:
${news.map((n) => `- ${n.title} (${n.source})`).join("\n") || "(수집된 뉴스 없음)"}

최근 공시:
${disclosures.map((d) => `- ${d.title} [${d.type}, ${d.date}]`).join("\n") || "(수집된 공시 없음)"}

위 정보를 바탕으로 아래 JSON 스키마로만 응답해:
{
  "newsSummary": "뉴스 흐름 2~3문장 요약",
  "disclosureSummary": "공시 핵심 내용 2~3문장 요약 (없으면 '최근 90일 내 특이 공시 없음')",
  "trends": ["최근 트렌드 포인트 1", "포인트 2"],
  "checkpoints": ["투자자가 확인해야 할 체크포인트 1", "체크포인트 2"]
}`;
  return askForJson<BriefingSummary>(system, prompt);
}

export async function summarizeMarketOverview(
  domesticIndices: IndexQuote[],
  globalIndices: IndexQuote[],
  macro: MacroIndicator[]
): Promise<string> {
  const system = "너는 한국 개인 투자자를 위한 시황 캐스터다. 반드시 JSON만 출력한다.";
  const prompt = `국내 지수: ${domesticIndices
    .map((i) => `${i.name} ${i.value.toFixed(2)} (${i.changePct >= 0 ? "+" : ""}${i.changePct.toFixed(2)}%)`)
    .join(", ") || "데이터 없음"}

해외 지수: ${globalIndices
    .map((i) => `${i.name} ${i.value.toFixed(2)} (${i.changePct >= 0 ? "+" : ""}${i.changePct.toFixed(2)}%)`)
    .join(", ") || "데이터 없음"}

매크로 지표: ${macro
    .map((m) => `${m.name} ${m.value.toFixed(2)}${m.unit}`)
    .join(", ") || "데이터 없음"}

위 데이터로 오늘의 국내/해외 증시 흐름을 1~2문단으로 요약해. 아래 JSON으로만 응답:
{ "summary": "..." }`;
  const result = await askForJson<{ summary: string }>(system, prompt);
  return result.summary;
}

export async function summarizeIndustryTrend(
  sector: string,
  news: NewsItem[]
): Promise<string> {
  const system = "너는 산업 섹터 리서치 애널리스트다. 반드시 JSON만 출력한다.";
  const prompt = `산업군: ${sector}

관련 뉴스:
${news.map((n) => `- ${n.title}`).join("\n") || "(수집된 뉴스 없음)"}

수급, 이슈, 정책 변화 관점에서 이 산업군의 최근 트렌드를 1~2문단으로 요약해. 아래 JSON으로만 응답:
{ "summary": "..." }`;
  const result = await askForJson<{ summary: string }>(system, prompt);
  return result.summary;
}

export async function estimateSector(company: Company): Promise<string> {
  const system =
    "너는 기업의 산업군/섹터를 분류하는 애널리스트다. 반드시 JSON만 출력한다.";
  const prompt = `기업명: ${company.name} (${company.market} 시장)
이 기업이 속한 산업군/섹터를 한국어로 짧게 (예: "반도체", "2차전지", "바이오") 하나만 답해.
{ "sector": "..." }`;
  const result = await askForJson<{ sector: string }>(system, prompt);
  return result.sector;
}

export async function generateInvestmentGuide(params: {
  company: Company;
  briefing: BriefingSummary;
  marketSummary: string;
  industrySummary: string;
  previousHeadline?: string;
  previousCheckpoints?: string[];
  sources: { news: NewsItem[]; disclosures: DisclosureItem[] };
}): Promise<InvestmentGuide> {
  const { company, briefing, marketSummary, industrySummary, previousHeadline, previousCheckpoints, sources } = params;
  const system =
    "너는 개인 투자자 본인을 위해 작성하는 투자 리서치 애널리스트다. 모든 판단에는 근거를 함께 표기한다. 반드시 JSON만 출력한다.";
  const prompt = `기업: ${company.name} (${company.market})

기업 뉴스 요약: ${briefing.newsSummary}
공시 요약: ${briefing.disclosureSummary}
시장개관: ${marketSummary}
산업 트렌드: ${industrySummary}

${previousHeadline ? `어제 헤드라인: ${previousHeadline}` : "(어제 브리핑 없음 — 최초 생성)"}
${previousCheckpoints?.length ? `어제 체크포인트: ${previousCheckpoints.join(", ")}` : ""}

아래 JSON 스키마로만 응답해:
{
  "headline": "오늘의 한줄 요약",
  "marketContext": "시장/산업 배경과 연결한 코멘트 2~3문장",
  "strengths": ["강점 요인 1", "강점 요인 2"],
  "risks": ["리스크 요인 1", "리스크 요인 2"],
  "checkpoints": ["참고 체크포인트 1", "체크포인트 2"],
  "opinion": "개인 의견 (선택, 한 문장)",
  "whatsNew": ["어제 브리핑 대비 새로 생긴 이슈만 (없으면 빈 배열)"]
}`;

  const result = await askForJson<{
    headline: string;
    marketContext: string;
    strengths: string[];
    risks: string[];
    checkpoints: string[];
    opinion?: string;
    whatsNew: string[];
  }>(system, prompt);

  return {
    company,
    generatedAt: new Date().toISOString(),
    headline: result.headline,
    marketContext: result.marketContext,
    industryContext: industrySummary,
    strengths: result.strengths,
    risks: result.risks,
    checkpoints: result.checkpoints,
    opinion: result.opinion,
    whatsNew: result.whatsNew,
    sources,
  };
}
