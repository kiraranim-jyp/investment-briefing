"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { BriefingResult } from "@/components/BriefingResult";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toaster";
import type { Briefing, Market } from "@/lib/types";

export default function HomePage() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function handleSearch(name: string, market: Market) {
    setLoading(true);
    setBriefing(null);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, market }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "브리핑 조회에 실패했습니다.");
      setBriefing(data);
    } catch (err: any) {
      toast.push(err.message ?? "브리핑 조회에 실패했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">즉시조회 브리핑</h1>
        <p className="text-sm text-gray-400">
          관심 기업명을 입력하면 뉴스·공시를 즉시 모아 요약해드립니다.
        </p>
      </div>

      <SearchForm onSubmit={handleSearch} loading={loading} />

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {!loading && briefing && <BriefingResult briefing={briefing} />}
    </div>
  );
}
