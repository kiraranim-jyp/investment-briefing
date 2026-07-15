"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { StockReportView } from "@/components/stock/StockReportView";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toaster";
import type { Market, StockReport } from "@/lib/types";

export default function HomePage() {
  const [report, setReport] = useState<StockReport | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleSearch(name: string, market: Market) {
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch("/api/stock-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, market }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "투자 리포트 조회에 실패했습니다.");
      setReport(data);
    } catch (err: any) {
      toast.push(err.message ?? "투자 리포트 조회에 실패했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">AI 투자 리포트</h1>
        <p className="text-sm text-gray-400">
          관심 기업명을 입력하면 시세·재무·뉴스·공시를 종합한 AI 투자 리포트를 즉시 생성합니다.
        </p>
      </div>

      <SearchForm onSubmit={handleSearch} loading={loading} />

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {!loading && report && <StockReportView report={report} />}
    </div>
  );
}
