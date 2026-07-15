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
