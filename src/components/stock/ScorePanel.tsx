import { cx } from "@/lib/utils";
import type { InvestmentScoreBreakdown } from "@/lib/types";

const LABELS: Record<keyof Omit<InvestmentScoreBreakdown, "total" | "rating">, string> = {
  financial: "재무점수",
  technical: "기술적점수",
  news: "뉴스점수",
  supplyDemand: "수급점수",
  growth: "성장성점수",
  valuation: "가치평가",
};

const RATING_COLOR: Record<InvestmentScoreBreakdown["rating"], string> = {
  적극매수: "text-emerald-400",
  매수: "text-emerald-400",
  관망: "text-amber-400",
  비추천: "text-orange-400",
  위험: "text-red-400",
};

function ScoreBar({ label, value, estimated }: { label: string; value: number; estimated?: boolean }) {
  const color = value >= 80 ? "bg-emerald-500" : value >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-400">
          {label}
          {estimated && <span className="text-gray-600 ml-1">(추정)</span>}
        </span>
        <span className="font-semibold text-white">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
        <div className={cx("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ScorePanel({
  score,
  scoreIsEstimated,
}: {
  score: InvestmentScoreBreakdown;
  scoreIsEstimated: { supplyDemand: boolean; technical: boolean };
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs text-gray-400 mb-1">종합점수</div>
          <div className="text-4xl font-bold text-white">{score.total}</div>
        </div>
        <div className={cx("text-lg font-bold", RATING_COLOR[score.rating])}>{score.rating}</div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {(Object.keys(LABELS) as Array<keyof typeof LABELS>).map((key) => (
          <ScoreBar
            key={key}
            label={LABELS[key]}
            value={score[key]}
            estimated={key === "supplyDemand" ? scoreIsEstimated.supplyDemand : key === "technical" ? scoreIsEstimated.technical : false}
          />
        ))}
      </div>
    </div>
  );
}
