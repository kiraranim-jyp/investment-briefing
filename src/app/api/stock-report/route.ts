import { NextResponse } from "next/server";
import { buildStockReport } from "@/lib/stockReport";
import type { Market } from "@/lib/types";

export const maxDuration = 30;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = body?.name?.trim();
  const market: Market = body?.market === "US" ? "US" : "KR";
  const refresh = body?.refresh === true;

  if (!name) {
    return NextResponse.json({ error: "기업명을 입력하세요." }, { status: 400 });
  }

  try {
    const report = await buildStockReport({ name, market }, !refresh);
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "투자 리포트 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
