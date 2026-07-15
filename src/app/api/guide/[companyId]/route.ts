import { NextResponse } from "next/server";
import { getLatestGuide, listWatchlist } from "@/lib/store/kv";
import { generateGuideForEntry } from "@/lib/guide";
import { buildMarketOverview } from "@/lib/market";

export async function GET(
  _req: Request,
  { params }: { params: { companyId: string } }
) {
  try {
    const guide = await getLatestGuide(decodeURIComponent(params.companyId));
    if (!guide) {
      return NextResponse.json({ error: "아직 생성된 가이드가 없습니다." }, { status: 404 });
    }
    return NextResponse.json(guide);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "조회 실패" }, { status: 500 });
  }
}

// 크론을 기다리지 않고 즉시 재생성 (테스트/수동 새로고침용)
export async function POST(
  _req: Request,
  { params }: { params: { companyId: string } }
) {
  const id = decodeURIComponent(params.companyId);
  try {
    const entries = await listWatchlist();
    const entry = entries.find((e) => e.companyId === id);
    if (!entry) {
      return NextResponse.json({ error: "워치리스트에 없는 기업입니다." }, { status: 404 });
    }
    const marketOverview = await buildMarketOverview();
    const guide = await generateGuideForEntry(entry, marketOverview);
    return NextResponse.json(guide);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "가이드 생성 실패" }, { status: 500 });
  }
}
