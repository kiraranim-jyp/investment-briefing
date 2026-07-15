"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { SearchForm } from "@/components/SearchForm";
import { useToast } from "@/components/ui/Toaster";
import type { Market, WatchlistEntry } from "@/lib/types";

type WatchlistItem = WatchlistEntry & {
  latestHeadline: string | null;
  latestGeneratedAt: string | null;
};

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[] | null>(null);
  const [adding, setAdding] = useState(false);
  const toast = useToast();

  async function load() {
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "조회 실패");
      setItems(data);
    } catch (err: any) {
      toast.push(err.message ?? "워치리스트 조회에 실패했습니다.", "error");
      setItems([]);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAdd(name: string, market: Market) {
    setAdding(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, market }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "등록 실패");
      toast.push(`${name} 워치리스트에 등록했습니다.`, "success");
      await load();
    } catch (err: any) {
      toast.push(err.message ?? "등록에 실패했습니다.", "error");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(companyId: string) {
    try {
      const res = await fetch(`/api/watchlist?companyId=${encodeURIComponent(companyId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "삭제 실패");
      setItems((prev) => prev?.filter((i) => i.companyId !== companyId) ?? null);
      toast.push("워치리스트에서 삭제했습니다.", "success");
    } catch (err: any) {
      toast.push(err.message ?? "삭제에 실패했습니다.", "error");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">워치리스트</h1>
        <p className="text-sm text-gray-400">
          매일 아침 08:30, 등록된 기업의 투자가이드를 메일로 받습니다.
        </p>
      </div>

      <SearchForm onSubmit={handleAdd} loading={adding} />

      {items === null && (
        <div className="grid gap-4 sm:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {items?.length === 0 && (
        <div className="text-sm text-gray-500">등록된 기업이 없습니다.</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {items?.map((item) => (
          <Card key={item.companyId} className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-brand font-semibold">
                  {item.market} · {item.sector}
                </div>
                <Link
                  href={`/watchlist/${encodeURIComponent(item.companyId)}`}
                  className="text-lg font-bold text-white hover:text-brand"
                >
                  {item.name}
                </Link>
              </div>
              <button
                onClick={() => handleRemove(item.companyId)}
                className="text-gray-500 hover:text-red-400"
                aria-label="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-300">
              <TrendingUp className="h-4 w-4 mt-0.5 shrink-0 text-brand" />
              <span>{item.latestHeadline ?? "아직 생성된 투자가이드가 없습니다 (다음 모닝 브리핑에 포함됩니다)."}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
