import { NextResponse } from "next/server";
import { buildBriefing } from "@/lib/briefing";
import type { Market } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = body?.name?.trim();
  const market: Market = body?.market === "US" ? "US" : "KR";

  if (!name) {
    return NextResponse.json({ error: "기업명을 입력하세요." }, { status: 400 });
  }

  try {
    const briefing = await buildBriefing({ name, market });
    return NextResponse.json(briefing);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "브리핑 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
