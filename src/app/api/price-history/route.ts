import { NextResponse } from "next/server";
import { fetchPriceHistory, type ChartRange } from "@/lib/sources/yahooFinance";

export const dynamic = "force-dynamic";

const VALID_RANGES: ChartRange[] = ["1D", "1W", "1M", "1Y"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  const rangeParam = searchParams.get("range") ?? "1M";

  if (!ticker) {
    return NextResponse.json({ error: "ticker가 필요합니다." }, { status: 400 });
  }
  if (!VALID_RANGES.includes(rangeParam as ChartRange)) {
    return NextResponse.json({ error: "range는 1D/1W/1M/1Y 중 하나여야 합니다." }, { status: 400 });
  }

  try {
    const points = await fetchPriceHistory(ticker, rangeParam as ChartRange);
    return NextResponse.json({ ticker, range: rangeParam, points });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "가격 조회 실패" }, { status: 500 });
  }
}
