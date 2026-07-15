import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { InvestmentGuide, MailLog, StockReport, WatchlistEntry } from "../types";

const STOCK_REPORT_TTL_MS = 6 * 60 * 60 * 1000; // 6시간 — 장중 재조회 시 AI/데이터 재호출 비용 절감
const MAIL_LOG_CAP = 60; // 최근 60건만 보관

let supabaseSingleton: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (supabaseSingleton) return supabaseSingleton;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "저장소(Supabase)가 설정되지 않았습니다. Supabase 프로젝트를 만들고 " +
        "SUPABASE_URL / SUPABASE_SECRET_KEY 환경변수를 설정하세요 (README 참고)."
    );
  }
  supabaseSingleton = createClient(url, key, { auth: { persistSession: false } });
  return supabaseSingleton;
}

interface WatchlistRow {
  company_id: string;
  name: string;
  market: "KR" | "US";
  sector: string;
  added_at: string;
  alert_target_price: number | null;
}

function rowToWatchlistEntry(row: WatchlistRow): WatchlistEntry {
  return {
    companyId: row.company_id,
    name: row.name,
    market: row.market,
    sector: row.sector,
    addedAt: row.added_at,
    alertTargetPrice: row.alert_target_price,
  };
}

export async function listWatchlist(): Promise<WatchlistEntry[]> {
  const { data, error } = await db()
    .from("watchlist")
    .select("*")
    .order("added_at", { ascending: false });
  if (error) throw new Error(`워치리스트 조회 실패: ${error.message}`);
  return (data as WatchlistRow[]).map(rowToWatchlistEntry);
}

export async function addToWatchlist(entry: WatchlistEntry): Promise<void> {
  const { error } = await db()
    .from("watchlist")
    .upsert({
      company_id: entry.companyId,
      name: entry.name,
      market: entry.market,
      sector: entry.sector,
      added_at: entry.addedAt,
      alert_target_price: entry.alertTargetPrice,
    });
  if (error) throw new Error(`워치리스트 등록 실패: ${error.message}`);
}

export async function removeFromWatchlist(companyId: string): Promise<void> {
  // guides는 watchlist.company_id에 ON DELETE CASCADE로 걸려 있어 함께 삭제된다.
  const { error } = await db().from("watchlist").delete().eq("company_id", companyId);
  if (error) throw new Error(`워치리스트 삭제 실패: ${error.message}`);
}

export async function getLatestGuide(companyId: string): Promise<InvestmentGuide | null> {
  const { data, error } = await db()
    .from("guides")
    .select("payload")
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) throw new Error(`투자가이드 조회 실패: ${error.message}`);
  return (data?.payload as InvestmentGuide) ?? null;
}

export async function saveLatestGuide(companyId: string, guide: InvestmentGuide): Promise<void> {
  const { error } = await db()
    .from("guides")
    .upsert({ company_id: companyId, payload: guide, generated_at: new Date().toISOString() });
  if (error) throw new Error(`투자가이드 저장 실패: ${error.message}`);
}

export async function appendMailLog(log: MailLog): Promise<void> {
  const client = db();
  const { error } = await client.from("mail_log").insert({
    sent_at: log.sentAt,
    recipient_masked: log.recipientMasked,
    status: log.status,
    companies_included: log.companiesIncluded,
    error: log.error ?? null,
  });
  if (error) throw new Error(`메일 로그 저장 실패: ${error.message}`);

  // 최근 MAIL_LOG_CAP건만 유지 (개인 사용 규모라 매번 정리해도 부담 없음)
  const { data: excess } = await client
    .from("mail_log")
    .select("id")
    .order("sent_at", { ascending: false })
    .range(MAIL_LOG_CAP, MAIL_LOG_CAP + 100);
  if (excess?.length) {
    await client.from("mail_log").delete().in("id", excess.map((r) => r.id));
  }
}

export async function listMailLogs(limit = 20): Promise<MailLog[]> {
  const { data, error } = await db()
    .from("mail_log")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`메일 로그 조회 실패: ${error.message}`);
  return (data ?? []).map((row) => ({
    sentAt: row.sent_at,
    recipientMasked: row.recipient_masked,
    status: row.status,
    companiesIncluded: row.companies_included ?? [],
    error: row.error ?? undefined,
  }));
}

// 스톡 리포트 캐싱은 부가 기능이라 Supabase 미설정 시에도 조회 자체는 정상 동작해야 한다 (실패를 삼킨다).
export async function getCachedStockReport(companyId: string): Promise<StockReport | null> {
  try {
    const { data, error } = await db()
      .from("stock_report_cache")
      .select("payload, expires_at")
      .eq("company_id", companyId)
      .maybeSingle();
    if (error || !data) return null;
    if (new Date(data.expires_at).getTime() < Date.now()) return null;
    return data.payload as StockReport;
  } catch {
    return null;
  }
}

export async function cacheStockReport(companyId: string, report: StockReport): Promise<void> {
  try {
    await db()
      .from("stock_report_cache")
      .upsert({
        company_id: companyId,
        payload: report,
        expires_at: new Date(Date.now() + STOCK_REPORT_TTL_MS).toISOString(),
      });
  } catch {
    // Supabase 미설정 시 캐싱만 생략
  }
}
