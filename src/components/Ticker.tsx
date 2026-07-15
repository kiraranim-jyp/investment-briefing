"use client";

import { useEffect, useState } from "react";
import { cx } from "@/lib/utils";
import type { MarketOverview } from "@/lib/types";

export function Ticker() {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/market-overview")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => mounted && setOverview(data))
      .catch(() => mounted && setFailed(true));
    return () => {
      mounted = false;
    };
  }, []);

  if (failed) {
    return <div className="text-xs text-surface-border">지수 정보를 불러오지 못했습니다.</div>;
  }

  if (!overview) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-4 w-20 rounded" />
        ))}
      </div>
    );
  }

  const indices = [...overview.domesticIndices, ...overview.globalIndices];

  return (
    <div className="flex gap-5 overflow-x-auto text-xs whitespace-nowrap">
      {indices.map((idx) => (
        <div key={idx.name} className="flex items-center gap-1.5">
          <span className="text-gray-400">{idx.name}</span>
          <span className="font-semibold">{idx.value.toFixed(2)}</span>
          <span className={cx(idx.changePct >= 0 ? "text-rise" : "text-fall")}>
            {idx.changePct >= 0 ? "+" : ""}
            {idx.changePct.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}
