import { Card } from "../ui/Card";
import { cx } from "@/lib/utils";
import type { ScenarioSet } from "@/lib/types";

export function ScenarioCard({ scenarios, currency }: { scenarios: ScenarioSet | null; currency: string | null }) {
  if (!scenarios) {
    return (
      <Card>
        <div className="text-xs font-semibold text-brand mb-2">투자 시나리오</div>
        <div className="text-xs text-gray-500 text-center py-4">시나리오 데이터가 없습니다.</div>
      </Card>
    );
  }

  const rows: Array<{ label: string; key: keyof ScenarioSet; color: string }> = [
    { label: "Bull (낙관)", key: "bull", color: "text-emerald-400" },
    { label: "Base (기본)", key: "base", color: "text-amber-400" },
    { label: "Bear (비관)", key: "bear", color: "text-red-400" },
  ];

  return (
    <Card>
      <div className="text-xs font-semibold text-brand mb-3">투자 시나리오 (AI 추정)</div>
      <div className="space-y-3">
        {rows.map(({ label, key, color }) => {
          const s = scenarios[key];
          return (
            <div key={key} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className={cx("text-xs font-semibold", color)}>{label}</div>
                <p className="text-xs text-gray-400 mt-0.5">{s.rationale}</p>
              </div>
              <div className="text-sm font-bold text-white shrink-0">
                {s.targetPrice != null ? `${s.targetPrice.toLocaleString()} ${currency ?? ""}` : "N/A"}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 pt-3 border-t border-surface-border text-[11px] text-gray-500">
        AI가 공개 데이터를 바탕으로 산출한 참고용 시나리오이며 투자 자문이 아닙니다.
      </p>
    </Card>
  );
}
