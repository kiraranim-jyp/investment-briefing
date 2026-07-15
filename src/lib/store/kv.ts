import { Redis } from "@upstash/redis";
import type { InvestmentGuide, MailLog, WatchlistEntry } from "../types";

const WATCHLIST_SET = "watchlist:ids";
const watchlistEntryKey = (id: string) => `watchlist:entry:${id}`;
const guideLatestKey = (id: string) => `guide:latest:${id}`;
const MAIL_LOG_LIST = "maillog";
const MAIL_LOG_CAP = 60; // 최근 60일치만 보관

let redisSingleton: Redis | null = null;

function kv(): Redis {
  if (redisSingleton) return redisSingleton;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      "저장소(Redis)가 설정되지 않았습니다. Vercel 프로젝트에서 Redis 스토어를 생성하고 " +
        "KV_REST_API_URL / KV_REST_API_TOKEN 환경변수를 설정하세요 (README 참고)."
    );
  }
  redisSingleton = new Redis({ url, token });
  return redisSingleton;
}

export async function listWatchlist(): Promise<WatchlistEntry[]> {
  const client = kv();
  const ids = await client.smembers(WATCHLIST_SET);
  if (!ids.length) return [];
  const entries = await Promise.all(
    ids.map((id) => client.get<WatchlistEntry>(watchlistEntryKey(id)))
  );
  return entries
    .filter((e): e is WatchlistEntry => Boolean(e))
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export async function addToWatchlist(entry: WatchlistEntry): Promise<void> {
  const client = kv();
  await client.sadd(WATCHLIST_SET, entry.companyId);
  await client.set(watchlistEntryKey(entry.companyId), entry);
}

export async function removeFromWatchlist(companyId: string): Promise<void> {
  const client = kv();
  await client.srem(WATCHLIST_SET, companyId);
  await client.del(watchlistEntryKey(companyId));
  await client.del(guideLatestKey(companyId));
}

export async function getLatestGuide(companyId: string): Promise<InvestmentGuide | null> {
  return (await kv().get<InvestmentGuide>(guideLatestKey(companyId))) ?? null;
}

export async function saveLatestGuide(
  companyId: string,
  guide: InvestmentGuide
): Promise<void> {
  await kv().set(guideLatestKey(companyId), guide);
}

export async function appendMailLog(log: MailLog): Promise<void> {
  const client = kv();
  await client.lpush(MAIL_LOG_LIST, log);
  await client.ltrim(MAIL_LOG_LIST, 0, MAIL_LOG_CAP - 1);
}

export async function listMailLogs(limit = 20): Promise<MailLog[]> {
  return kv().lrange<MailLog>(MAIL_LOG_LIST, 0, limit - 1);
}
