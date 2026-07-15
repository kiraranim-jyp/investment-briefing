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
  briefing: Briefing;
  partialFailures: string[];
}
