import { NextResponse } from "next/server";
import { listWatchlist, appendMailLog } from "@/lib/store/kv";
import { buildMarketOverview } from "@/lib/market";
import { generateGuideForEntry } from "@/lib/guide";
import { sendMorningMail } from "@/lib/mail/resend";
import { maskEmail } from "@/lib/utils";
import type { InvestmentGuide } from "@/lib/types";

// force-dynamic 없으면 빌드 시 정적 응답으로 캐시되어 매일 똑같은(오래된) 결과만 반환할 위험이 있다 —
// 크론이 매일 진짜로 실행되지 않고 빌드 시점 스냅샷만 도는 심각한 버그가 될 수 있어 명시적으로 강제한다.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // 로컬/설정 전에는 통과 (배포 시 반드시 CRON_SECRET 설정 권장)
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const to = process.env.MAIL_TO ?? "unknown";
  const recipientMasked = maskEmail(to);

  try {
    const watchlist = await listWatchlist();
    if (!watchlist.length) {
      await appendMailLog({
        sentAt: new Date().toISOString(),
        recipientMasked,
        status: "success",
        companiesIncluded: [],
      });
      return NextResponse.json({ message: "워치리스트가 비어있어 메일을 보내지 않았습니다." });
    }

    const marketOverview = await buildMarketOverview();

    // 기업 하나의 실패가 전체를 막지 않도록 격리 (FR-6, FR-11.5)
    const results = await Promise.allSettled(
      watchlist.map((entry) => generateGuideForEntry(entry, marketOverview))
    );

    const guides: InvestmentGuide[] = [];
    const failedCompanies: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        guides.push(r.value);
      } else {
        failedCompanies.push(watchlist[i].name);
      }
    });

    if (!guides.length) {
      throw new Error("모든 기업의 가이드 생성에 실패했습니다.");
    }

    await sendMorningMail(marketOverview, guides);

    await appendMailLog({
      sentAt: new Date().toISOString(),
      recipientMasked,
      status: failedCompanies.length ? "partial" : "success",
      companiesIncluded: guides.map((g) => g.company.name),
      error: failedCompanies.length ? `실패: ${failedCompanies.join(", ")}` : undefined,
    });

    return NextResponse.json({
      sent: guides.length,
      failed: failedCompanies,
    });
  } catch (err: any) {
    await appendMailLog({
      sentAt: new Date().toISOString(),
      recipientMasked,
      status: "failed",
      companiesIncluded: [],
      error: err.message ?? String(err),
    }).catch(() => {});

    return NextResponse.json({ error: err.message ?? "발송 실패" }, { status: 500 });
  }
}
