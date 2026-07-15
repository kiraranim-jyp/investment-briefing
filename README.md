# Daily Alpha — 개인 투자 브리핑 서비스

관심 기업명을 입력하면 즉시 뉴스·공시를 모아 브리핑하고, 워치리스트에 등록한 기업은
매일 아침 08:30(KST)에 시장개관 + 산업 트렌드 + 투자가이드를 결합한 메일을 자동 발송하는
개인용 투자 리서치 서비스.

- **Frontend**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **저장소**: Vercel Marketplace Redis (Upstash, 워치리스트/최신 투자가이드/메일 로그)
- **AI 요약**: Anthropic Claude API
- **뉴스/공시**: Google News RSS, DART Open API(국내), SEC EDGAR(해외) — 인증 불필요한 소스는 키 없이 바로 동작
- **지수/매크로**: Yahoo Finance (코스피/코스닥/다우/나스닥/S&P500, 환율, WTI, 미국채 10년)
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
    page.tsx                       # 즉시조회 화면
    watchlist/page.tsx              # 워치리스트 관리
    watchlist/[companyId]/page.tsx  # 투자가이드 상세
    api/
      briefing/                     # 즉시조회 브리핑 생성
      watchlist/                    # 워치리스트 CRUD
      guide/[companyId]/            # 투자가이드 조회/수동 생성
      market-overview/              # 시장개관 조회
      cron/morning-mail/            # 매일 08:30 모닝메일 트리거
  components/                       # Header, Ticker, SearchForm, BriefingResult, ui/*
  lib/
    sources/                        # googleNews, dart, secEdgar, indices
    ai/claude.ts                    # 요약/가이드 생성 프롬프트
    store/kv.ts                     # Redis(Upstash) 저장소
    mail/                           # Resend 발송 + HTML 템플릿
    briefing.ts / market.ts / industry.ts / guide.ts   # 파이프라인 조합
```

## 5. v0.2 명세 대비 반영/추가 사항

- 시장개관에 국내외 지수 외 **매크로 지표(환율, WTI, 미국채 10년 금리)** 추가
- 투자가이드에 **전일 대비 변경점(`whatsNew`)** 필드 추가 — 매일 같은 내용 반복을 줄이기 위해 어제 브리핑과 비교해 새 이슈만 표시
- 저장소는 **Vercel Marketplace의 Upstash Redis**로 결정 (Vercel KV는 deprecated 되어 Upstash로 이전됨; 파일 기반은 서버리스에서 영속성 없음, Supabase는 무인증 개인용 목적에는 과함)
- 산업군 태깅은 **AI 자동 추정 + 등록 시 수동 override 가능**
- 개별 기업/데이터 소스 장애가 전체 파이프라인을 막지 않도록 `Promise.allSettled` 기반 격리 적용 (FR-6, FR-11.5)

## 6. 알려진 제한사항 (다음 단계)

- DART corp_code 매핑은 정확한 회사명 또는 부분일치로 검색 — 동명이인 기업이 있으면 오탐 가능
- Yahoo Finance 비공식 엔드포인트를 사용하므로 응답 스키마가 변경되면 지수 수집이 실패할 수 있음 (부분 실패로 격리되어 있어 전체 장애로는 번지지 않음)
- Vercel Hobby 플랜은 Cron 최소 주기가 1일 — 요구사항과 일치하지만 플랜을 낮추면 동작하지 않을 수 있음
