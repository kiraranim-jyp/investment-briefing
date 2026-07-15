"use client";

import { useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { Card } from "../ui/Card";
import { BriefingDetails } from "../BriefingDetails";
import { useToast } from "../ui/Toaster";
import { OpinionBanner } from "./OpinionBanner";
import { ScorePanel } from "./ScorePanel";
import { PriceChart } from "./PriceChart";
import { CompanyOverviewCard } from "./CompanyOverviewCard";
import { TechnicalIndicatorsCard } from "./TechnicalIndicatorsCard";
import { QuarterlyFinancialsCard } from "./QuarterlyFinancialsCard";
import { EarningsCalendarCard } from "./EarningsCalendarCard";
import { NewsSentimentCard } from "./NewsSentimentCard";
import { ScenarioCard } from "./ScenarioCard";
import type { StockReport } from "@/lib/types";

export function StockReportView({ report }: { report: StockReport }) {
  const { profile } = report;
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const toast = useToast();

  async function addToWatchlist() {
    setAdding(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: report.company.name, market: report.company.market }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "등록 실패");
      setAdded(true);
      toast.push(`${report.company.name} 워치리스트에 등록했습니다.`, "success");
    } catch (err: any) {
      toast.push(err.message ?? "워치리스트 등록에 실패했습니다.", "error");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      {report.partialFailures.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-800 bg-amber-950/50 p-3 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>일부 데이터 수집에 실패했습니다: {report.partialFailures.join(" / ")}</div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {profile.displayName || report.company.name}{" "}
            {profile.ticker && <span className="text-sm font-normal text-gray-400">{profile.ticker}</span>}
          </h2>
          {(profile.sector || profile.industry) && (
            <div className="text-xs text-gray-400 mt-0.5">
              {[profile.sector, profile.industry].filter(Boolean).join(" · ")}
            </div>
          )}
        </div>
        <button
          onClick={addToWatchlist}
          disabled={adding || added}
          className="flex items-center gap-1.5 rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          {added ? "등록됨" : "워치리스트 등록"}
        </button>
      </div>

      <OpinionBanner opinion={report.opinion} reason={report.opinionReason} />

      <Card>
        <ScorePanel score={report.score} scoreIsEstimated={report.scoreIsEstimated} />
      </Card>

      {profile.ticker ? (
        <Card>
          <PriceChart ticker={profile.ticker} currency={profile.currency} />
        </Card>
      ) : (
        <Card>
          <div className="text-xs text-gray-500 text-center py-6">
            시세 데이터를 찾지 못해 차트를 표시할 수 없습니다.
          </div>
        </Card>
      )}

      <CompanyOverviewCard
        profile={profile}
        strengths={report.strengths}
        weaknesses={report.weaknesses}
        starRating={report.starRating}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <TechnicalIndicatorsCard technicals={report.technicals} />
        <EarningsCalendarCard calendar={report.earningsCalendar} />
      </div>

      <QuarterlyFinancialsCard data={report.quarterlyFinancials} currency={profile.currency} />

      <div className="grid gap-4 sm:grid-cols-2">
        <NewsSentimentCard sentiment={report.newsSentiment} />
        <ScenarioCard scenarios={report.scenarios} currency={profile.currency} />
      </div>

      <BriefingDetails briefing={report.briefing} />
    </div>
  );
}
