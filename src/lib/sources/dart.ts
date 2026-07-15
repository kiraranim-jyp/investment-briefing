import JSZip from "jszip";
import type { DisclosureItem } from "../types";
import { fetchWithTimeout } from "../utils";

interface CorpCodeEntry {
  corpCode: string;
  corpName: string;
}

let corpCodeCache: { entries: CorpCodeEntry[]; fetchedAt: number } | null = null;
const CORP_CODE_TTL_MS = 24 * 60 * 60 * 1000; // 하루 캐시 (같은 서버리스 인스턴스가 살아있는 동안)

// corpCode.xml은 <list><corp_code>..</corp_code><corp_name>..</corp_name>...</list> 형태가
// 11만건 이상 반복되는 단순 구조. 범용 XML DOM 파서(fast-xml-parser)는 이 크기에서 CPU 바운드로
// 수 초~수십 초까지 걸려 서버리스 타임아웃을 유발할 수 있어, 알려진 고정 포맷에 한해 정규식으로
// 직접 추출한다 (로컬 벤치마크 기준 DOM 파싱 대비 약 50배 빠름).
function parseCorpCodeXml(xml: string): CorpCodeEntry[] {
  const entries: CorpCodeEntry[] = [];
  const re = /<corp_code>([^<]*)<\/corp_code>\s*<corp_name>([^<]*)<\/corp_name>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    entries.push({ corpCode: m[1], corpName: m[2] });
  }
  return entries;
}

async function loadCorpCodes(apiKey: string): Promise<CorpCodeEntry[]> {
  if (corpCodeCache && Date.now() - corpCodeCache.fetchedAt < CORP_CODE_TTL_MS) {
    return corpCodeCache.entries;
  }
  const res = await fetchWithTimeout(
    `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${apiKey}`,
    {},
    15000
  );
  if (!res.ok) throw new Error(`DART corpCode 요청 실패 (${res.status})`);

  const zip = await JSZip.loadAsync(await res.arrayBuffer());
  const xmlFile = zip.file("CORPCODE.xml");
  if (!xmlFile) throw new Error("DART corpCode.xml 파싱 실패: CORPCODE.xml 없음");
  const xml = await xmlFile.async("text");
  const entries = parseCorpCodeXml(xml);
  corpCodeCache = { entries, fetchedAt: Date.now() };
  return entries;
}

function findCorpCode(entries: CorpCodeEntry[], companyName: string): string | null {
  const target = companyName.trim();
  const exact = entries.find((e) => e.corpName === target);
  if (exact) return exact.corpCode;
  const partial = entries.find((e) => e.corpName.includes(target));
  return partial?.corpCode ?? null;
}

/**
 * DART Open API로 최근 공시 목록을 가져온다. API 키가 없으면 명시적으로 실패시켜
 * 상위 레이어에서 부분 실패로 처리하도록 한다 (FR-6).
 */
export async function fetchDartDisclosures(
  companyName: string,
  limit = 8
): Promise<DisclosureItem[]> {
  const apiKey = process.env.DART_API_KEY;
  if (!apiKey) {
    throw new Error("DART_API_KEY가 설정되지 않았습니다.");
  }

  const entries = await loadCorpCodes(apiKey);
  const corpCode = findCorpCode(entries, companyName);
  if (!corpCode) {
    throw new Error(`DART에서 "${companyName}"에 해당하는 기업을 찾을 수 없습니다.`);
  }

  const end = new Date();
  const begin = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000); // 최근 90일
  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

  const url = `https://opendart.fss.or.kr/api/list.json?crtfc_key=${apiKey}&corp_code=${corpCode}&bgn_de=${fmt(
    begin
  )}&end_de=${fmt(end)}&page_no=1&page_size=${limit}`;

  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`DART 공시목록 요청 실패 (${res.status})`);
  const data = await res.json();

  if (data.status !== "000") {
    if (data.status === "013") return []; // 조회된 데이터 없음
    throw new Error(`DART API 오류: ${data.message ?? data.status}`);
  }

  return (data.list ?? []).slice(0, limit).map((item: any) => ({
    title: String(item.report_nm ?? ""),
    type: String(item.pblntf_ty ?? "공시"),
    date: String(item.rcept_dt ?? ""),
    url: `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`,
  }));
}
