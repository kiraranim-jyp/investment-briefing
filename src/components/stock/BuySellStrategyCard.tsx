import { Card } from "../ui/Card";
import type { BuyStrategy, SellStrategy } from "@/lib/types";

function fmtPrice(price: number | null, currency: string | null): string {
  return price != null ? `${price.toLocaleString()} ${currency ?? ""}` : "N/A";
}

export function BuySellStrategyCard({
  buyStrategy,
  sellStrategy,
  currency,
}: {
  buyStrategy: BuyStrategy | null;
  sellStrategy: SellStrategy | null;
  currency: string | null;
}) {
  if (!buyStrategy && !sellStrategy) {
    return (
      <Card>
        <div className="text-xs font-semibold text-brand mb-2">매수/매도 전략</div>
        <div className="text-xs text-gray-500 text-center py-4">전략 데이터가 없습니다.</div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <div className="text-xs font-semibold text-emerald-400 mb-3">분할매수 전략</div>
        <div className="space-y-2.5">
          {buyStrategy?.tranches.map((t, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 rounded bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  {i + 1}차 · {t.weightPct}%
                </span>
                <p className="text-xs text-gray-400 truncate">{t.rationale}</p>
              </div>
              <div className="text-sm font-bold text-white shrink-0">{fmtPrice(t.price, currency)}</div>
            </div>
          ))}
          {!buyStrategy?.tranches.length && <div className="text-xs text-gray-500">데이터 없음</div>}
        </div>
      </Card>

      <Card>
        <div className="text-xs font-semibold text-red-400 mb-3">매도 전략</div>
        <div className="space-y-2.5">
          {sellStrategy?.takeProfitTranches.map((t, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 rounded bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  익절 {i + 1}차 · {t.weightPct}%
                </span>
                <p className="text-xs text-gray-400 truncate">{t.rationale}</p>
              </div>
              <div className="text-sm font-bold text-white shrink-0">{fmtPrice(t.price, currency)}</div>
            </div>
          ))}
          {sellStrategy && (
            <div className="flex items-start justify-between gap-3 pt-2 border-t border-surface-border">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 rounded bg-red-950 border border-red-800 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                  손절
                </span>
                <p className="text-xs text-gray-400 truncate">{sellStrategy.stopLossRationale}</p>
              </div>
              <div className="text-sm font-bold text-white shrink-0">
                {fmtPrice(sellStrategy.stopLossPrice, currency)}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
