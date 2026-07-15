import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "../ui/Card";
import { formatMarketCap } from "@/lib/format";
import type { QuarterlyFinancialPoint } from "@/lib/types";

export function QuarterlyFinancialsCard({
  data,
  currency,
}: {
  data: QuarterlyFinancialPoint[];
  currency: string | null;
}) {
  if (!data.length) {
    return (
      <Card>
        <div className="text-xs font-semibold text-brand mb-2">분기 실적 추이</div>
        <div className="text-xs text-gray-500 text-center py-4">분기 실적 데이터를 가져오지 못했습니다.</div>
      </Card>
    );
  }

  const chartData = data.map((q) => ({
    quarter: q.quarter.slice(2, 7),
    매출: q.revenue,
    순이익: q.netIncome,
  }));

  return (
    <Card>
      <div className="text-xs font-semibold text-brand mb-1">분기 실적 추이 (최근 {data.length}개 분기)</div>
      <div className="text-[11px] text-gray-500 mb-2">영업이익은 데이터 소스 결측으로 제공되지 않습니다.</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={chartData}>
          <XAxis dataKey="quarter" stroke="#8A93A6" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#8A93A6"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={50}
            tickFormatter={(v: number) => formatMarketCap(v, currency)}
          />
          <Tooltip
            contentStyle={{ background: "#141924", border: "1px solid #242B3A", borderRadius: 8, fontSize: 12 }}
            formatter={(value: number) => formatMarketCap(value, currency)}
          />
          <Bar dataKey="매출" fill="#5C8AFF" radius={[3, 3, 0, 0]} />
          <Bar dataKey="순이익" fill="#1454FF" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
        {data.map((q) => (
          <span key={q.quarter}>
            {q.quarter.slice(2, 7)} EPS {q.eps != null ? q.eps.toLocaleString() : "N/A"}
          </span>
        ))}
      </div>
    </Card>
  );
}
