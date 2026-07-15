// Yahoo Finance의 검색 API(v1/finance/search)는 한글 검색어를 거부한다(400 Invalid Search Query).
// 그래서 한국 기업은 이름 -> 티커 매핑을 직접 들고 있어야 한다. 여기서는 확신도가 높은 대형주만
// 수동으로 큐레이션하고, 목록에 없는 기업은 DART corp_code의 stock_code로 폴백한다(dart.ts 참고).
// 코드가 틀리면 엉뚱한 기업 데이터를 보여주는 사고로 이어지므로, 확실하지 않은 종목은 넣지 않는다.
export const KR_TICKER_MAP: Record<string, string> = {
  "삼성전자": "005930.KS",
  "SK하이닉스": "000660.KS",
  "LG에너지솔루션": "373220.KS",
  "삼성바이오로직스": "207940.KS",
  "현대차": "005380.KS",
  "현대자동차": "005380.KS",
  "기아": "000270.KS",
  "셀트리온": "068270.KS",
  "POSCO홀딩스": "005490.KS",
  "포스코홀딩스": "005490.KS",
  "NAVER": "035420.KS",
  "네이버": "035420.KS",
  "삼성SDI": "006400.KS",
  "LG화학": "051910.KS",
  "현대모비스": "012330.KS",
  "카카오": "035720.KS",
  "KB금융": "105560.KS",
  "신한지주": "055550.KS",
  "삼성물산": "028260.KS",
  "SK이노베이션": "096770.KS",
  "LG전자": "066570.KS",
  "SK텔레콤": "017670.KS",
  "KT": "030200.KS",
  "하나금융지주": "086790.KS",
  "삼성생명": "032830.KS",
  "LG생활건강": "051900.KS",
  "한국전력": "015760.KS",
  "삼성전기": "009150.KS",
  "우리금융지주": "316140.KS",
  "SK스퀘어": "402340.KS",
  "한화솔루션": "009830.KS",
  "롯데케미칼": "011170.KS",
  "아모레퍼시픽": "090430.KS",
  "에코프로": "086520.KQ",
  "에코프로비엠": "247540.KQ",
  "크래프톤": "259960.KS",
  "엔씨소프트": "036570.KS",
  "넷마블": "251270.KS",
  "카카오뱅크": "323410.KS",
  "카카오페이": "377300.KS",
  "HMM": "011200.KS",
  "LG디스플레이": "034220.KS",
  "대한항공": "003490.KS",
  "미래에셋증권": "006800.KS",
};

export function lookupKrTicker(companyName: string): string | null {
  const target = companyName.trim();
  if (KR_TICKER_MAP[target]) return KR_TICKER_MAP[target];
  const noSpace = target.replace(/\s+/g, "");
  return KR_TICKER_MAP[noSpace] ?? null;
}

export function containsHangul(text: string): boolean {
  return /[가-힣]/.test(text);
}
