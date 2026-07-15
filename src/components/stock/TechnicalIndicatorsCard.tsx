import { Card } from "../ui/Card";
import { cx } from "@/lib/utils";
import type { TechnicalIndicators } from "@/lib/types";

function fmt(v: number | null, digits = 2): string {
  return v == null ? "N/A" : v.toFixed(digits);
}

export function TechnicalIndicatorsCard({ technicals }: { technicals: TechnicalIndicators | null }) {
  if (!technicals) {
    return (
      <Card>
        <div className="text-xs font-semibold text-brand mb-2">기술적 분석</div>
        <div className="text-xs text-gray-500 text-center py-4">가격 데이터가 부족해 계산할 수 없습니다.</div>
      </Card>
    );
  }

  const rsiZone =
    technicals.rsi14 == null ? null : technicals.rsi14 >= 70 ? "과매수" : technicals.rsi14 <= 30 ? "과매도" : "중립";

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-brand">기술적 분석</div>
        <div className="text-xs font-semibold text-white">{technicals.trendLabel}</div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <div className="text-[11px] text-gray-500">RSI(14)</div>
          <div className="font-semibold text-white">
            {fmt(technicals.rsi14, 1)}
            {rsiZone && (
              <span
                className={cx(
                  "ml-1 text-[11px]",
                  rsiZone === "과매수" ? "text-red-400" : rsiZone === "과매도" ? "text-emerald-400" : "text-gray-400"
                )}
              >
                {rsiZone}
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500">MACD</div>
          <div className="font-semibold text-white">
            {technicals.macd ? (
              <span className={technicals.macd.histogram >= 0 ? "text-rise" : "text-fall"}>
                {technicals.macd.histogram >= 0 ? "+" : ""}
                {fmt(technicals.macd.histogram)}
              </span>
            ) : (
              "N/A"
            )}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500">20일 이동평균</div>
          <div className="font-semibold text-white">{fmt(technicals.sma20, 0)}</div>
        </div>
        <div>
          <div className="text-[11px] text-gray-500">50일 이동평균</div>
          <div className="font-semibold text-white">{fmt(technicals.sma50, 0)}</div>
        </div>
      </div>
      {technicals.bollinger && (
        <div className="mt-3 pt-3 border-t border-surface-border text-[11px] text-gray-500">
          볼린저밴드: 상단 {fmt(technicals.bollinger.upper, 0)} · 중심 {fmt(technicals.bollinger.middle, 0)} · 하단{" "}
          {fmt(technicals.bollinger.lower, 0)}
        </div>
      )}
    </Card>
  );
}
