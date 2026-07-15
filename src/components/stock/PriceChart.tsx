"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cx } from "@/lib/utils";
import { Skeleton } from "../ui/Skeleton";

type Range = "1D" | "1W" | "1M" | "1Y";
const RANGES: Range[] = ["1D", "1W", "1M", "1Y"];

interface PricePoint {
  time: string;
  close: number;
}

export function PriceChart({ ticker, currency }: { ticker: string; currency: string | null }) {
  const [range, setRange] = useState<Range>("1M");
  const [points, setPoints] = useState<PricePoint[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    setPoints(null);
    setFailed(false);
    fetch(`/api/price-history?ticker=${encodeURIComponent(ticker)}&range=${range}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => mounted && setPoints(data.points))
      .catch(() => mounted && setFailed(true));
    return () => {
      mounted = false;
    };
  }, [ticker, range]);

  const changePct =
    points && points.length >= 2
      ? ((points[points.length - 1].close - points[0].close) / points[0].close) * 100
      : null;

  const formatTick = (iso: string) => {
    const d = new Date(iso);
    if (range === "1D") return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cx(
                "px-3 py-1 rounded-lg text-xs font-semibold",
                r === range ? "bg-brand text-white" : "text-gray-400 hover:text-white"
              )}
            >
              {r}
            </button>
          ))}
        </div>
        {changePct != null && (
          <span className={cx("text-sm font-semibold", changePct >= 0 ? "text-rise" : "text-fall")}>
            {changePct >= 0 ? "+" : ""}
            {changePct.toFixed(2)}%
          </span>
        )}
      </div>

      {failed && <div className="text-xs text-gray-500 py-8 text-center">차트 데이터를 불러오지 못했습니다.</div>}

      {!failed && !points && <Skeleton className="h-48 w-full" />}

      {!failed && points && points.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={points}>
            <XAxis
              dataKey="time"
              tickFormatter={formatTick}
              stroke="#8A93A6"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              domain={["auto", "auto"]}
              stroke="#8A93A6"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={60}
              tickFormatter={(v: number) => v.toLocaleString()}
            />
            <Tooltip
              contentStyle={{ background: "#141924", border: "1px solid #242B3A", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(v) => new Date(v as string).toLocaleString("ko-KR")}
              formatter={(value: number) => [`${value.toLocaleString()} ${currency ?? ""}`, "종가"]}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke={changePct != null && changePct < 0 ? "#1A73E8" : "#D93025"}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {!failed && points && points.length === 0 && (
        <div className="text-xs text-gray-500 py-8 text-center">표시할 가격 데이터가 없습니다.</div>
      )}
    </div>
  );
}
