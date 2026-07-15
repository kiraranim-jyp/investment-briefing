"use client";

import { useState } from "react";
import { Plus, Trash2, Star } from "lucide-react";
import { useToast } from "@/components/ui/Toaster";
import { cx } from "@/lib/utils";
import { formatMarketCap, formatPercent, formatPrice, formatRatio } from "@/lib/format";
import type { Market, StockReport } from "@/lib/types";

interface Row {
  name: string;
  market: Market;
}

const MAX_COMPANIES = 5;

const RATING_COLOR: Record<string, string> = {
  적극매수: "text-emerald-400",
  매수: "text-emerald-400",
  관망: "text-amber-400",
  비추천: "text-orange-400",
  위험: "text-red-400",
};

export default function ComparePage() {
  const [rows, setRows] = useState<Row[]>([{ name: "", market: "KR" }, { name: "", market: "KR" }]);
  const [reports, setReports] = useState<(StockReport | null)[] | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function addRow() {
    if (rows.length >= MAX_COMPANIES) return;
    setRows((prev) => [...prev, { name: "", market: "KR" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleCompare() {
    const targets = rows.filter((r) => r.name.trim());
    if (targets.length < 2) {
      toast.push("비교할 기업을 2개 이상 입력하세요.", "error");
      return;
    }
    setLoading(true);
    setReports(null);
    try {
      const results = await Promise.allSettled(
        targets.map((r) =>
          fetch("/api/stock-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: r.name, market: r.market }),
          }).then(async (res) => {
            if (!res.ok) throw new Error((await res.json()).error ?? "조회 실패");
            return res.json() as Promise<StockReport>;
          })
        )
      );
      const values = results.map((r) => (r.status === "fulfilled" ? r.value : null));
      const failedNames = targets.filter((_, i) => results[i].status === "rejected").map((r) => r.name);
      if (failedNames.length) {
        toast.push(`일부 기업 조회 실패: ${failedNames.join(", ")}`, "error");
      }
      setReports(values);
    } finally {
      setLoading(false);
    }
  }

  const validReports = reports?.filter((r): r is StockReport => r !== null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">종목 비교</h1>
        <p className="text-sm text-gray-400">
          최대 {MAX_COMPANIES}개 기업의 AI 투자 리포트를 나란히 비교합니다. 캐시되지 않은 기업은 검색 1회와
          동일한 비용이 발생합니다.
        </p>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={row.name}
              onChange={(e) => updateRow(i, { name: e.target.value })}
              placeholder={`기업 ${i + 1} (예: 삼성전자)`}
              className="flex-1 rounded-xl border border-surface-border bg-surface-card px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <select
              value={row.market}
              onChange={(e) => updateRow(i, { market: e.target.value as Market })}
              className="rounded-xl border border-surface-border bg-surface-card px-3 py-2.5 text-sm outline-none focus:border-brand"
            >
              <option value="KR">국내</option>
              <option value="US">해외</option>
            </select>
            {rows.length > 2 && (
              <button
                onClick={() => removeRow(i)}
                className="text-gray-500 hover:text-red-400 px-2"
                aria-label="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        <div className="flex items-center gap-3 pt-1">
          {rows.length < MAX_COMPANIES && (
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" /> 기업 추가
            </button>
          )}
          <button
            onClick={handleCompare}
            disabled={loading}
            className="ml-auto rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "비교 중..." : "비교하기"}
          </button>
        </div>
      </div>

      {validReports.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-surface-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left p-3 text-gray-400 font-medium sticky left-0 bg-surface-card">항목</th>
                {validReports.map((r) => (
                  <th key={r.company.name} className="text-left p-3 min-w-[160px]">
                    <div className="font-bold text-white">{r.profile.displayName || r.company.name}</div>
                    <div className="text-xs text-gray-500">{r.profile.ticker ?? r.company.market}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              <CompareRow label="AI 투자의견" values={validReports.map((r) => r.opinion)} />
              <CompareRow
                label="등급"
                values={validReports.map((r) => r.score.rating)}
                colorMap={RATING_COLOR}
              />
              <CompareRow label="종합점수" values={validReports.map((r) => String(r.score.total))} />
              <CompareRow
                label="기업 경쟁력"
                render={validReports.map((r) => (
                  <div key={r.company.name} className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cx(
                          "h-3.5 w-3.5",
                          i < r.starRating ? "fill-amber-400 text-amber-400" : "text-surface-border"
                        )}
                      />
                    ))}
                  </div>
                ))}
              />
              <CompareRow
                label="현재가"
                values={validReports.map((r) => formatPrice(r.profile.price, r.profile.currency))}
              />
              <CompareRow
                label="시가총액"
                values={validReports.map((r) => formatMarketCap(r.profile.marketCap, r.profile.currency))}
              />
              <CompareRow label="PER" values={validReports.map((r) => formatRatio(r.profile.per))} />
              <CompareRow label="PBR" values={validReports.map((r) => formatRatio(r.profile.pbr))} />
              <CompareRow label="ROE" values={validReports.map((r) => formatPercent(r.profile.roe))} />
              <CompareRow
                label="배당수익률"
                values={validReports.map((r) => formatPercent(r.profile.dividendYield))}
              />
              <CompareRow
                label="RSI(14)"
                values={validReports.map((r) => (r.technicals?.rsi14 != null ? r.technicals.rsi14.toFixed(1) : "N/A"))}
              />
              <CompareRow label="기술적 추세" values={validReports.map((r) => r.technicals?.trendLabel ?? "N/A")} />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CompareRow({
  label,
  values,
  render,
  colorMap,
}: {
  label: string;
  values?: string[];
  render?: React.ReactNode[];
  colorMap?: Record<string, string>;
}) {
  return (
    <tr>
      <td className="p-3 text-gray-400 sticky left-0 bg-surface">{label}</td>
      {render
        ? render.map((node, i) => (
            <td key={i} className="p-3">
              {node}
            </td>
          ))
        : values?.map((v, i) => (
            <td key={i} className={cx("p-3 font-medium text-white", colorMap?.[v])}>
              {v}
            </td>
          ))}
    </tr>
  );
}
