-- =====================================================================
-- Daily Alpha — 개인 AI 투자 브리핑 서비스 (investment-briefing 저장소)
-- 이 스크립트는 화물차 그리스 예약 서비스(truck-grease-reservation)와
-- 완전히 무관합니다. 다른 프로젝트에 실행하지 마세요.
-- =====================================================================
-- 실행 위치: Supabase 대시보드 → investment-briefing 프로젝트 → SQL Editor
-- (주소가 hanvihfgsaphixsbmkoe.supabase.co 인 그 프로젝트입니다)

create table if not exists watchlist (
  company_id text primary key,
  name text not null,
  market text not null check (market in ('KR', 'US')),
  sector text not null,
  added_at timestamptz not null default now(),
  alert_target_price numeric
);

create table if not exists guides (
  company_id text primary key references watchlist (company_id) on delete cascade,
  payload jsonb not null,
  generated_at timestamptz not null default now()
);

create table if not exists stock_report_cache (
  company_id text primary key,
  payload jsonb not null,
  expires_at timestamptz not null
);

create table if not exists mail_log (
  id bigserial primary key,
  sent_at timestamptz not null default now(),
  recipient_masked text not null,
  status text not null check (status in ('success', 'partial', 'failed')),
  companies_included text[] not null default '{}',
  error text
);

create index if not exists mail_log_sent_at_idx on mail_log (sent_at desc);

-- 개인 사용 목적이라 서버 코드에서 secret key(서비스 롤 동급, RLS 우회)로만 접근합니다.
-- anon key는 이 앱에서 전혀 사용하지 않으므로, 혹시 모를 노출에 대비해 RLS를 켜고
-- 정책은 추가하지 않습니다(= service_role 외 모든 접근 차단).
alter table watchlist enable row level security;
alter table guides enable row level security;
alter table stock_report_cache enable row level security;
alter table mail_log enable row level security;

-- 실행 후 이 결과가 나오면 investment-briefing 테이블 4개가 정상 생성된 것입니다.
select 'investment-briefing 스키마 생성 완료: watchlist, guides, stock_report_cache, mail_log' as status;
