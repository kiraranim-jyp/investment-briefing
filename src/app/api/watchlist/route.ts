import { NextResponse } from "next/server";
import { addToWatchlist, getLatestGuide, listWatchlist, removeFromWatchlist } from "@/lib/store/kv";
import { estimateSector } from "@/lib/ai/claude";
import { companyId } from "@/lib/utils";
import type { Market } from "@/lib/types";

export async function GET() {
  try {
    const entries = await listWatchlist();
    const withPreview = await Promise.all(
      entries.map(async (entry) => {
        const guide = await getLatestGuide(entry.companyId).catch(() => null);
        return { ...entry, latestHeadline: guide?.headline ?? null, latestGeneratedAt: guide?.generatedAt ?? null };
      })
    );
    return NextResponse.json(withPreview);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "조회 실패" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = body?.name?.trim();
  const market: Market = body?.market === "US" ? "US" : "KR";
  const manualSector = body?.sector?.trim();

  if (!name) {
    return NextResponse.json({ error: "기업명을 입력하세요." }, { status: 400 });
  }

  try {
    let sector = manualSector;
    if (!sector) {
      sector = await estimateSector({ name, market }).catch(() => "미분류");
    }
    const entry = {
      companyId: companyId(name, market),
      name,
      market,
      sector,
      addedAt: new Date().toISOString(),
    };
    await addToWatchlist(entry);
    return NextResponse.json(entry, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "등록 실패" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("companyId");
  if (!id) {
    return NextResponse.json({ error: "companyId가 필요합니다." }, { status: 400 });
  }
  try {
    await removeFromWatchlist(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "삭제 실패" }, { status: 500 });
  }
}
