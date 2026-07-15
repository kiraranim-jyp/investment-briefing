# Daily Alpha — 개인 AI 투자 비서

관심 기업명을 입력하면 시세·재무·뉴스·공시를 종합한 AI 투자 리포트(투자점수/투자의견/강점·약점/
가격차트)를 즉시 생성하고, 워치리스트에 등록한 기업은 매일 아침 08:30(KST)에 시장개관 + 산업
트렌드 + 투자가이드를 결합한 메일을 자동 발송하는 개인용 투자 리서치 서비스.

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS + Recharts
- **저장소**: Vercel Marketplace Redis (Upstash, 워치리스트/최신 투자가이드/스톡리포트 캐시/메일 로그)
- **AI 요약/스코어링**: Anthropic Claude API
- **뉴스/공시**: Google News RSS, DART Open API(국내), SEC EDGAR(해외) — 인증 불필요한 소스는 키 없이 바로 동작
- **시세/재무**: Yahoo Finance (지수, 개별 종목 시세·차트·PER/PBR/ROE 등)
- **메일 발송**: Resend
- **스케줄링**: Vercel Cron Jobs (`vercel.json` — 매일 UTC 23:30 = KST 08:30)
- **배포**: Vercel

개인 사용을 전제로 로그인/회원가입/다중 사용자 없이, 단일 수신 이메일(`MAIL_TO`)로 동작합니다.

---

## 1. 로컬 실행

```bash
npm install
cp .env.example .env.local   # 아래 2번 참고해 값 채우기
npm run dev
```

`http://localhost:3000` — 즉시조회 화면
`http://localhost:3000/watchlist` — 워치리스트 관리

키가 없는 항목(예: `ANTHROPIC_API_KEY`, `DART_API_KEY`, `RESEND_API_KEY`, KV)은 해당 기능만
부분 실패로 처리되고 나머지는 정상 동작합니다 (예: 뉴스/SEC EDGAR/지수는 키 없이 바로 됨).

---

## 2. 환경변수 설정 (`.env.local`)

| 변수 | 필요 여부 | 발급처 |
|---|---|---|
| `ANTHROPIC_API_KEY` | AI 요약/투자가이드 생성에 필수 | https://console.anthropic.com |
| `ANTHROPIC_MODEL` | 선택 (기본값 내장) | 최신 모델명은 Anthropic 문서 확인 |
| `DART_API_KEY` | 국내 공시 조회에 필요 (무료) | https://opendart.fss.or.kr |
| `SEC_EDGAR_USER_AGENT` | 해외 공시 조회 시 권장 (연락처 명시) | 직접 설정 (예: `investment-briefing you@example.com`) |
| `RESEND_API_KEY` | 모닝 메일 발송에 필요 | https://resend.com |
| `MAIL_FROM` | 모닝 메일 발신자 (Resend에서 도메인 인증 필요) | Resend 대시보드 |
| `MAIL_TO` | 모닝 메일 수신자 (본인 이메일 고정) | 직접 설정 |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | 워치리스트/가이드 저장에 필수 | Vercel 프로젝트 → Storage → KV 생성 시 자동 발급 |
| `CRON_SECRET` | 크론 엔드포인트 보호 (배포 시 강력 권장) | 임의 문자열 직접 생성 |

Vercel에 KV를 만든 뒤 `vercel env pull .env.local`로 로컬에 동기화하는 것을 권장합니다.

---

## 3. Vercel 배포

### 3-1. GitHub 연동 배포 (권장)
```bash
git init
git add .
git commit -m "Initial commit: Daily Alpha investment briefing"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```
1. https://vercel.com/new 에서 저장소 Import
2. **Storage → Marketplace Database Providers → Upstash (Redis)** 로 스토어 생성 후 프로젝트에 연결 (환경변수 자동 주입)
3. **Settings → Environment Variables** 에 위 표의 나머지 값 입력
4. Deploy

### 3-2. Cron 확인
`vercel.json`에 정의된 `/api/cron/morning-mail`이 매일 UTC 23:30(KST 08:30, 서머타임 없음 -9시간 고정)에
자동 호출됩니다. Vercel 대시보드 **Settings → Cron Jobs**에서 실행 이력을 확인할 수 있습니다.
`CRON_SECRET`을 설정한 경우 Vercel이 자동으로 `Authorization: Bearer <CRON_SECRET>` 헤더를 붙여 호출합니다.

### 3-3. 수동 테스트
크론을 기다리지 않고 워치리스트 상세 화면에서 "지금 생성하기" 버튼으로 개별 기업의 투자가이드를
즉시 생성해 확인할 수 있습니다. 메일 전체 발송을 테스트하려면 배포 후
`GET /api/cron/morning-mail` 에 `Authorization: Bearer <CRON_SECRET>` 헤더를 붙여 직접 호출하세요.

---

## 4. 폴더 구조

```
src/
  app/
    page.tsx                       # AI 투자 리포트 (즉시조회) 화면
    watchlist/page.tsx              # 워치리스트 관리
    watchlist/[companyId]/page.tsx  # 투자가이드 상세
    api/
      stock-report/                 # AI 투자 리포트 생성 (점수/의견/프로필/브리핑 통합)
      price-history/                # 가격 차트 데이터 (1D/1W/1M/1Y)
      briefing/                     # 뉴스·공시 브리핑 생성 (stock-report의 하위 빌딩블록)
      watchlist/                    # 워치리스트 CRUD
      guide/[companyId]/            # 투자가이드 조회/수동 생성
      market-overview/              # 시장개관 조회
      cron/morning-mail/            # 매일 08:30 모닝메일 트리거
  components/
    stock/                          # PriceChart, ScorePanel, OpinionBanner, CompanyOverviewCard, StockReportView
    Header, Ticker, SearchForm, BriefingResult, BriefingDetails, ui/*
  lib/
    sources/                        # googleNews, dart, secEdgar, indices, yahooFinance, krTickers
    ai/claude.ts                    # 요약/가이드/스톡리포트 생성 프롬프트
    store/kv.ts                     # Redis(Upstash) 저장소 (워치리스트/가이드/스톡리포트 캐시)
    mail/                           # Resend 발송 + HTML 템플릿
    briefing.ts / market.ts / industry.ts / guide.ts / stockReport.ts   # 파이프라인 조합
```

## 5. 반영된 기획 변경 사항

**v0.2 명세 대비**
- 시장개관에 국내외 지수 외 **매크로 지표(환율, WTI, 미국채 10년 금리)** 추가
- 투자가이드에 **전일 대비 변경점(`whatsNew`)** 필드 추가 — 매일 같은 내용 반복을 줄이기 위해 어제 브리핑과 비교해 새 이슈만 표시
- 저장소는 **Vercel Marketplace의 Upstash Redis**로 결정 (Vercel KV는 deprecated 되어 Upstash로 이전됨; 파일 기반은 서버리스에서 영속성 없음, Supabase는 무인증 개인용 목적에는 과함)
- 산업군 태깅은 **AI 자동 추정 + 등록 시 수동 override 가능**
- 개별 기업/데이터 소스 장애가 전체 파이프라인을 막지 않도록 `Promise.allSettled` 기반 격리 적용 (FR-6, FR-11.5)

**Sprint 1 (AI 투자비서 MVP) 반영**
- 즉시조회가 단순 뉴스/공시 요약에서 **종합 투자 리포트**(기업 프로필, 강점/약점, 6개 서브점수 종합
  투자점수, AI 투자의견, 가격 차트)로 확장됨
- 종합점수 → 등급 매핑(90+ 적극매수 / 80+ 매수 / 70+ 관망 / 60+ 비추천 / 60미만 위험)과 3단계
  투자의견(매수/관망/주의)은 AI가 준 서브점수로부터 **코드에서 결정적으로 계산** — LLM의 산술
  오차나 밴드 불일치를 방지
- **외국인/기관 수급 데이터는 무료 소스로 구할 수 없어 이번 스프린트에서 제외** — `supplyDemand`
  점수는 뉴스/공시에 나타난 언급만으로 AI가 보수적으로 추정하며, `scoreIsEstimated.supplyDemand`로
  UI에 "(추정)" 표기해 실데이터와 구분
- 분석 결과는 Redis에 6시간 TTL로 캐싱 (반복 조회 시 AI/외부 API 재호출 비용 절감)

**Sprint 2 반영**
- **기술적 지표(RSI14/MACD/볼린저밴드/이동평균)** 추가 — `src/lib/technicalIndicators.ts`에서
  AI 없이 표준 공식으로 결정적으로 계산 (Yahoo 6개월 일별 종가 기반). 계산 가능하면
  `scoreIsEstimated.technical`이 `false`로 바뀌어 기술점수가 더 이상 AI 정성 추정이 아님을 표시
- **분기 실적 추이(최근 4분기)** 추가 — 매출/순이익/EPS만 제공. Yahoo
  `incomeStatementHistoryQuarterly`의 매출총이익/영업이익 필드가 항상 0으로 오는 데이터 결측이
  확인되어(Yahoo 측 문제로 추정) 영업이익은 의도적으로 노출하지 않음 (0을 실제 값처럼 보여주는
  것이 표시 안 하는 것보다 나쁘다고 판단)
- **다음 실적발표일 + 컨센서스(EPS/매출)** 추가 — Yahoo `calendarEvents`, 실제 데이터
- **뉴스 감성분석**과 **Bull/Base/Bear 시나리오+목표가**를 기존 `generateStockReport` 프롬프트에
  통합 — 별도 AI 호출을 추가하면 리포트 1건당 비용이 커지므로, Sprint 1과 동일하게 Claude 호출
  2회(뉴스/공시 요약 + 종합 리포트 생성)를 유지한 채 출력 스키마만 확장
- 외국인/기관 수급은 여전히 무료 실데이터가 없어 AI 추정 유지 (Sprint 1과 동일)

**Sprint 3 반영**
- **분할매수/매도 전략** 추가 — 1~3차 매수가·비중, 익절 단계, 손절가를 기존
  `generateStockReport` 프롬프트에 통합 (역시 AI 호출 추가 없음)
- **종목 비교 화면**(`/compare`, 최대 5개) 추가 — 각 기업의 `/api/stock-report`를 병렬 호출해
  종합점수/등급/의견/PER/PBR/ROE/RSI/추세를 표로 비교. 캐시되지 않은 기업 수만큼 AI 호출이
  늘어나므로 화면에 비용 안내 문구를 명시
- **워치리스트 목표가 알림** 추가 — 사용자가 목표가를 설정하면 모닝메일 생성(크론) 시점에
  1일 1회 현재가와 비교해 도달 여부, 52주 신고가/신저가 근접 여부를 확인해 메일과 상세 페이지에
  표시. **Vercel Hobby 플랜은 크론 최소 주기가 1일**이라 실시간 알림은 이 인프라에서 애초에
  불가능 — "일일 체크"임을 UI 문구에 명시해 실시간으로 오해하지 않도록 함
- 미구현으로 남긴 것: 포트폴리오 비중분석, AI 매매일지/복기 (각각 새로운 사용자 입력·데이터
  모델이 필요해 범위상 다음 라운드로 이월)

## 6. 데이터 소스 관련 제약

- **한국 기업명 → 티커 매핑**: Yahoo Finance 검색 API가 한글 검색어를 거부해서(400 Bad Request),
  `src/lib/sources/krTickers.ts`에 수동 검증한 대형주 ~40개만 우선 매핑하고, 목록에 없으면 DART
  corp_code의 `stock_code`로 `.KS`/`.KQ` 후보를 만들어 폴백한다. 목록 밖 중소형주는 DART 조회가
  느리거나(아래 항목 참고) 실패하면 시세/차트가 아예 나오지 않을 수 있음.
- **PER/PBR/ROE 등 상세 재무지표**: Yahoo의 `quoteSummary` 엔드포인트가 비공식 쿠키+crumb 인증을
  요구한다(2024년경 변경). `yahooFinance.ts`에서 매번 크럼을 발급받아 쓰는데, Yahoo가 이 흐름을
  막으면 기업 개요 화면에서 PER/PBR 등이 전부 N/A로 빠질 수 있음(가격/차트는 별도 엔드포인트라 영향 없음).
- DART corp_code 매핑은 정확한 회사명 또는 부분일치로 검색 — 동명이인 기업이 있으면 오탐 가능
- DART corpCode.xml(11만+건)은 배포 환경(Vercel icn1)에서 응답 헤더는 빠르지만 본문(3~4MB) 전송이 비정상적으로 느리거나 멈추는 현상이 관측됨 — 원인 미상(DART 서버 측 이슈로 추정). 코드에서 10초 하드 타임아웃으로 격리해 공시만 부분 실패 처리되고 나머지(뉴스/AI 요약)는 정상 응답하도록 방어했지만, 국내 공시 조회 자체는 이 이슈가 해소되기 전까지 자주 실패할 수 있음. 같은 서버리스 인스턴스가 살아있는 동안은 성공 시 메모리 캐시로 재사용됨. Redis에 파싱 결과를 캐싱하면 반복 비용은 줄일 수 있으나 최초 다운로드 지연 자체는 해결되지 않음 (다음 단계: DART 문의 또는 대체 소스 검토)
- Yahoo Finance 비공식 엔드포인트를 사용하므로 응답 스키마가 변경되면 시세/지수 수집이 실패할 수 있음 (부분 실패로 격리되어 있어 전체 장애로는 번지지 않음)
- Vercel Hobby 플랜은 Cron 최소 주기가 1일 — 요구사항과 일치하지만 플랜을 낮추면 동작하지 않을 수 있음

## 7. Sprint 4 로드맵 (미구현)

명세에서 제안된 다음 단계. 필요할 때 별도 세션에서 이어서 진행:
- Sprint 4: AI 투자 토론(대화형 근거 설명), 반대의견 생성, 신뢰도 표시, 과거 예측 검증(AI 의견 vs 실제 주가),
  투자성향 맞춤 리포트, PDF 생성
- Sprint 3 중 이월된 항목: 포트폴리오 비중분석(보유 종목·비중 입력 → AI 추천 비중), AI 매매일지/복기
  (실제 매매 기록 로깅 + 과거 AI 의견과의 비교) — 둘 다 새로운 사용자 입력 데이터 모델이 필요
- 워치리스트 알림을 가격 외 거래량/뉴스 조건까지 확장하려면 guide.ts 파이프라인에 거래량 데이터
  소스 추가 필요 (현재는 목표가·52주 신고가/신저가만 지원)
- 외국인/기관 수급 실데이터: 한국투자증권 개발자센터(KIS Developers) 등 유료/등록형 API 연동 필요
- 분기 실적을 8분기(2년)로 확장하려면 `incomeStatementHistoryQuarterly`가 최근 4분기만 주는 한계를
  우회할 다른 소스가 필요 (Yahoo 자체 한도로 보임)
