export type Market = "KR" | "US";

export interface Company {
  name: string;
  market: Market;
  code?: string;
}

export interface SourceLink {
  title: string;
  url: string;
  publishedAt?: string;
}

export interface NewsItem extends SourceLink {
  source: string;
}

export interface DisclosureItem extends SourceLink {
  type: string;
  date: string;
}

export interface IndexQuote {
  name: string;
  value: number;
  changePct: number;
}

export interface MacroIndicator {
  name: string; // 환율(USD/KRW), WTI, 국고채 3년, 미국채 10년 등
  value: number;
  unit: string;
  changePct?: number;
}

export interface MarketOverview {
  date: string;
  domesticIndices: IndexQuote[];
  globalIndices: IndexQuote[];
  macro: MacroIndicator[];
  summary: string;
  partialFailures: string[];
}

export interface IndustryTrend {
  sector: string;
  relatedNews: NewsItem[];
  summary: string;
  partialFailures: string[];
}

export interface Briefing {
  company: Company;
  generatedAt: string;
  newsSummary: string;
  disclosureSummary: string;
  trends: string[];
  checkpoints: string[];
  sources: {
    news: NewsItem[];
    disclosures: DisclosureItem[];
  };
  partialFailures: string[];
}

export interface InvestmentGuide {
  company: Company;
  generatedAt: string;
  headline: string;
  marketContext: string;
  industryContext: string;
  strengths: string[];
  risks: string[];
  checkpoints: string[];
  opinion?: string;
  whatsNew: string[];
  alerts: string[]; // 목표가 도달/52주 신고가·신저가 근접 등 — 매일 08:30 모닝메일 생성 시 1회 점검 (실시간 아님)
  sources: {
    news: NewsItem[];
    disclosures: DisclosureItem[];
  };
}

export interface WatchlistEntry {
  companyId: string; // `${market}:${name}` 정규화 키
  name: string;
  market: Market;
  sector: string;
  addedAt: string;
  alertTargetPrice: number | null; // 사용자가 설정한 목표가. 모닝메일 생성 시 1일 1회 체크
}

export interface MailLog {
  sentAt: string;
  recipientMasked: string;
  status: "success" | "partial" | "failed";
  companiesIncluded: string[];
  error?: string;
}

export interface CompanyProfile {
  ticker: string | null;
  displayName: string;
  currency: string | null;
  price: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  per: number | null;
  pbr: number | null;
  roe: number | null; // 0~1 비율
  dividendYield: number | null; // 0~1 비율
  marketCap: number | null;
  eps: number | null;
  sector: string | null;
  industry: string | null;
  businessSummary: string | null;
  partialFailures: string[];
}

export interface InvestmentScoreBreakdown {
  financial: number;
  technical: number;
  news: number;
  supplyDemand: number;
  growth: number;
  valuation: number;
  total: number;
  rating: "적극매수" | "매수" | "관망" | "비추천" | "위험";
}

export type InvestmentOpinion = "매수" | "관망" | "주의";

export interface TechnicalIndicators {
  rsi14: number | null;
  macd: { value: number; signal: number; histogram: number } | null;
  bollinger: { upper: number; middle: number; lower: number } | null;
  sma20: number | null;
  sma50: number | null;
  trendLabel: string;
}

export interface QuarterlyFinancialPoint {
  quarter: string; // 예: "2026-03-31"
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
}

export interface EarningsCalendar {
  nextEarningsDate: string | null;
  epsEstimate: number | null;
  revenueEstimate: number | null;
}

export interface NewsSentiment {
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  summary: string;
}

export interface ScenarioTarget {
  targetPrice: number | null;
  rationale: string;
}

export interface ScenarioSet {
  bull: ScenarioTarget;
  base: ScenarioTarget;
  bear: ScenarioTarget;
}

export interface BuyTranche {
  price: number | null;
  weightPct: number; // 해당 단계에 배분할 비중 (%), 3단계 합 100
  rationale: string;
}

export interface BuyStrategy {
  tranches: BuyTranche[]; // 1~3차 분할매수
}

export interface SellStrategy {
  takeProfitTranches: BuyTranche[]; // 익절 단계 (price/weightPct/rationale 재사용)
  stopLossPrice: number | null;
  stopLossRationale: string;
}

export interface StockReport {
  company: Company;
  generatedAt: string;
  profile: CompanyProfile;
  strengths: string[];
  weaknesses: string[];
  starRating: number; // 1~5
  score: InvestmentScoreBreakdown;
  scoreIsEstimated: {
    supplyDemand: boolean; // true면 실제 수급 데이터가 아니라 뉴스 기반 AI 추정치
    technical: boolean; // true면 가격 히스토리 조회 실패로 AI 정성 추정
  };
  opinion: InvestmentOpinion;
  opinionReason: string;
  technicals: TechnicalIndicators | null;
  quarterlyFinancials: QuarterlyFinancialPoint[]; // 최근 4분기, 없으면 빈 배열 (영업이익은 데이터 소스 결측으로 미제공)
  earningsCalendar: EarningsCalendar | null;
  newsSentiment: NewsSentiment | null;
  scenarios: ScenarioSet | null;
  buyStrategy: BuyStrategy | null;
  sellStrategy: SellStrategy | null;
  briefing: Briefing;
  partialFailures: string[];
}
