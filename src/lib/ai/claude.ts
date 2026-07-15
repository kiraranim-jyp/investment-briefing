import Anthropic from "@anthropic-ai/sdk";
import type {
  BuyStrategy,
  Company,
  CompanyProfile,
  DisclosureItem,
  EarningsCalendar,
  IndexQuote,
  InvestmentGuide,
  InvestmentOpinion,
  InvestmentScoreBreakdown,
  MacroIndicator,
  NewsItem,
  NewsSentiment,
  QuarterlyFinancialPoint,
  ScenarioSet,
  SellStrategy,
  TechnicalIndicators,
} from "../types";

// 최신 모델명은 Anthropic 문서를 확인해 필요시 ANTHROPIC_MODEL 환경변수로 교체하세요.
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  return new Anthropic({ apiKey });
}

async function askForJson<T>(system: string, prompt: string, maxTokens = 1500): Promise<T> {
  const client = getClient();
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
  const res = await client.messages.create({
    model,
    max_tokens: maxTokens,
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
  alerts?: string[]; // 목표가/52주 신고가·신저가 근접 등 — 호출측에서 숫자 비교로 계산해 그대로 전달 (AI 생성 아님)
}): Promise<InvestmentGuide> {
  const { company, briefing, marketSummary, industrySummary, previousHeadline, previousCheckpoints, sources, alerts } =
    params;
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
    alerts: alerts ?? [],
    sources,
  };
}

function ratingFromScore(total: number): InvestmentScoreBreakdown["rating"] {
  if (total >= 90) return "적극매수";
  if (total >= 80) return "매수";
  if (total >= 70) return "관망";
  if (total >= 60) return "비추천";
  return "위험";
}

function opinionFromScore(total: number): InvestmentOpinion {
  if (total >= 80) return "매수";
  if (total >= 60) return "관망";
  return "주의";
}

export interface StockReportAiResult {
  strengths: string[];
  weaknesses: string[];
  starRating: number;
  score: InvestmentScoreBreakdown;
  opinion: InvestmentOpinion;
  opinionReason: string;
  newsSentiment: NewsSentiment;
  scenarios: ScenarioSet;
  buyStrategy: BuyStrategy;
  sellStrategy: SellStrategy;
}

/**
 * 기업 종합 리포트(강점/약점, 6개 서브점수, 투자의견, 뉴스 감성분석, Bull/Base/Bear 시나리오)를
 * 한 번의 호출로 생성한다. 별도 호출로 나누지 않고 하나로 묶은 이유는 AI 호출 횟수(=비용)를
 * Sprint 1과 동일하게 2회로 유지하기 위함이다.
 * total/rating/opinion은 AI가 준 서브점수를 코드에서 결정적으로 계산해, 밴드 기준
 * (90+ 적극매수 / 80+ 매수 / 70+ 관망 / 60+ 비추천 / 60미만 위험)이 항상 일관되게 한다.
 */
export async function generateStockReport(params: {
  company: Company;
  profile: CompanyProfile;
  briefing: BriefingSummary;
  momentum: { available: boolean; summary: string };
  supplyDemandAvailable: boolean;
  technicals: TechnicalIndicators | null;
  quarterlyFinancials: QuarterlyFinancialPoint[];
  earningsCalendar: EarningsCalendar | null;
  newsForSentiment: NewsItem[];
}): Promise<StockReportAiResult> {
  const {
    company,
    profile,
    briefing,
    momentum,
    supplyDemandAvailable,
    technicals,
    quarterlyFinancials,
    earningsCalendar,
    newsForSentiment,
  } = params;
  const system =
    "너는 개인 투자자 본인을 위해 종합 투자 리포트를 작성하는 애널리스트다. " +
    "판단은 항상 근거(재무 수치, 뉴스, 가격 흐름)와 함께 제시하고, 데이터가 없거나 불확실하면 " +
    "점수를 보수적으로 매기고 그 사실을 명시한다. 반드시 JSON만 출력한다.";

  const fmtPct = (v: number | null) => (v == null ? "N/A" : `${(v * 100).toFixed(1)}%`);
  const fmtNum = (v: number | null) => (v == null ? "N/A" : v.toLocaleString());

  const technicalsText = technicals
    ? `RSI(14): ${fmtNum(technicals.rsi14)}, MACD: ${
        technicals.macd ? `${technicals.macd.value.toFixed(2)} (시그널선 대비 ${technicals.macd.histogram >= 0 ? "+" : ""}${technicals.macd.histogram.toFixed(2)})` : "N/A"
      }, 20일선: ${fmtNum(technicals.sma20)}, 50일선: ${fmtNum(technicals.sma50)}, 추세: ${technicals.trendLabel}`
    : "데이터 없음";

  const quarterlyText = quarterlyFinancials.length
    ? quarterlyFinancials
        .map((q) => `${q.quarter}: 매출 ${fmtNum(q.revenue)}, 순이익 ${fmtNum(q.netIncome)}, EPS ${fmtNum(q.eps)}`)
        .join(" / ")
    : "데이터 없음";

  const calendarText = earningsCalendar?.nextEarningsDate
    ? `다음 실적발표 예정일 ${earningsCalendar.nextEarningsDate} (컨센서스 EPS ${fmtNum(
        earningsCalendar.epsEstimate
      )}, 매출 ${fmtNum(earningsCalendar.revenueEstimate)})`
    : "예정된 실적발표 정보 없음";

  const newsListText =
    newsForSentiment.map((n) => `- ${n.title}`).join("\n") || "(뉴스 없음)";

  const prompt = `기업: ${company.name} (${company.market}) ${profile.ticker ? `[${profile.ticker}]` : ""}
섹터/산업: ${profile.sector ?? "N/A"} / ${profile.industry ?? "N/A"}
현재가: ${fmtNum(profile.price)} ${profile.currency ?? ""} (52주 고점 ${fmtNum(
    profile.fiftyTwoWeekHigh
  )} / 저점 ${fmtNum(profile.fiftyTwoWeekLow)})
PER: ${fmtNum(profile.per)}, PBR: ${fmtNum(profile.pbr)}, ROE: ${fmtPct(profile.roe)}, 배당수익률: ${fmtPct(
    profile.dividendYield
  )}, 시가총액: ${fmtNum(profile.marketCap)}

가격 모멘텀: ${momentum.available ? momentum.summary : "데이터 없음 (기술점수는 뉴스/공시 기반으로만 보수적으로 추정)"}
기술적 지표: ${technicalsText}
최근 분기 실적(매출/순이익/EPS, 영업이익은 데이터 소스 결측으로 미제공): ${quarterlyText}
${calendarText}

뉴스 요약: ${briefing.newsSummary}
공시 요약: ${briefing.disclosureSummary}
최근 트렌드: ${briefing.trends.join(", ") || "없음"}

뉴스 감성분석용 원문 목록:
${newsListText}

${supplyDemandAvailable ? "" : "주의: 외국인/기관 수급 실데이터는 제공되지 않음. supplyDemand 점수는 뉴스/공시에 나타난 수급 관련 언급만으로 보수적으로 추정할 것 (근거 부족 시 50점 근처로)."}

아래 JSON 스키마로만 응답해 (각 점수는 0~100 정수, 감성분석 비율의 합은 100):
{
  "strengths": ["강점 1", "강점 2", "강점 3"],
  "weaknesses": ["약점 1", "약점 2"],
  "starRating": 1~5 정수 (기업 경쟁력 종합 평가),
  "scores": {
    "financial": 0~100,
    "technical": 0~100,
    "news": 0~100,
    "supplyDemand": 0~100,
    "growth": 0~100,
    "valuation": 0~100
  },
  "opinionReason": "종합 의견 3~4문장. 재무/뉴스/가격흐름을 근거로 들어 설명",
  "newsSentiment": {
    "positivePct": 0~100,
    "neutralPct": 0~100,
    "negativePct": 0~100,
    "summary": "뉴스 톤에 대한 한 문장 요약"
  },
  "scenarios": {
    "bull": { "targetPrice": 숫자 (현재가 기준 통화, 알 수 없으면 null), "rationale": "낙관 시나리오 근거 1~2문장" },
    "base": { "targetPrice": 숫자, "rationale": "기본 시나리오 근거 1~2문장" },
    "bear": { "targetPrice": 숫자, "rationale": "비관 시나리오 근거 1~2문장" }
  },
  "buyStrategy": {
    "tranches": [
      { "price": 현재가보다 낮은 1차 매수가, "weightPct": 비중(%), "rationale": "1~2문장" },
      { "price": 2차 매수가 (1차보다 낮음), "weightPct": 비중(%), "rationale": "1~2문장" },
      { "price": 3차 매수가 (2차보다 낮음), "weightPct": 비중(%), "rationale": "1~2문장" }
    ]
  },
  "sellStrategy": {
    "takeProfitTranches": [
      { "price": 1차 익절가 (현재가보다 높음), "weightPct": 비중(%), "rationale": "1~2문장" },
      { "price": 2차 익절가 (1차보다 높음), "weightPct": 비중(%), "rationale": "1~2문장" }
    ],
    "stopLossPrice": 손절가 (현재가보다 낮음, 알 수 없으면 null),
    "stopLossRationale": "손절 기준 1문장"
  }
}
buyStrategy.tranches의 weightPct 합은 100, sellStrategy.takeProfitTranches의 weightPct 합은 100이어야 한다.
가격 데이터(현재가/52주 레인지/기술적 지표)가 없으면 price를 null로 두고 rationale에 그 사실을 명시할 것.`;

  const result = await askForJson<{
    strengths: string[];
    weaknesses: string[];
    starRating: number;
    scores: {
      financial: number;
      technical: number;
      news: number;
      supplyDemand: number;
      growth: number;
      valuation: number;
    };
    opinionReason: string;
    newsSentiment: NewsSentiment;
    scenarios: ScenarioSet;
    buyStrategy: BuyStrategy;
    sellStrategy: SellStrategy;
  }>(system, prompt, 2800);

  const { financial, technical, news, supplyDemand, growth, valuation } = result.scores;
  const total = Math.round((financial + technical + news + supplyDemand + growth + valuation) / 6);

  return {
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    starRating: Math.max(1, Math.min(5, Math.round(result.starRating))),
    score: {
      financial,
      technical,
      news,
      supplyDemand,
      growth,
      valuation,
      total,
      rating: ratingFromScore(total),
    },
    opinion: opinionFromScore(total),
    opinionReason: result.opinionReason,
    newsSentiment: result.newsSentiment,
    scenarios: result.scenarios,
    buyStrategy: result.buyStrategy,
    sellStrategy: result.sellStrategy,
  };
}
