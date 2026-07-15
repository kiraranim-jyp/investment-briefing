import { NextResponse } from "next/server";
import { buildMarketOverview } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const overview = await buildMarketOverview();
    return NextResponse.json(overview);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "시장개관 조회 실패" },
      { status: 500 }
    );
  }
}
