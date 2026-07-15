"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Trash2, TrendingUp } from "lucide-react";
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
  const [alertDrafts, setAlertDrafts] = useState<Record<string, string>>({});
  const toast = useToast();

  async function load() {
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "조회 실패");
      setItems(data);
      const drafts: Record<string, string> = {};
      for (const item of data as WatchlistItem[]) {
        drafts[item.companyId] = item.alertTargetPrice != null ? String(item.alertTargetPrice) : "";
      }
      setAlertDrafts(drafts);
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

  async function handleSaveAlert(companyId: string) {
    const raw = alertDrafts[companyId]?.trim();
    const alertTargetPrice = raw ? Number(raw) : null;
    if (raw && (Number.isNaN(alertTargetPrice) || (alertTargetPrice as number) <= 0)) {
      toast.push("목표가는 0보다 큰 숫자로 입력하세요.", "error");
      return;
    }
    try {
      const res = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, alertTargetPrice }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "저장 실패");
      setItems((prev) => prev?.map((i) => (i.companyId === companyId ? { ...i, alertTargetPrice } : i)) ?? null);
      toast.push(
        alertTargetPrice ? `목표가 알림을 ${alertTargetPrice.toLocaleString()}로 설정했습니다.` : "목표가 알림을 해제했습니다.",
        "success"
      );
    } catch (err: any) {
      toast.push(err.message ?? "저장에 실패했습니다.", "error");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">워치리스트</h1>
        <p className="text-sm text-gray-400">
          매일 아침 08:30, 등록된 기업의 투자가이드를 메일로 받습니다. 목표가를 설정하면 도달 여부를
          모닝메일에서 하루 1회 확인합니다 (실시간 알림 아님).
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
            <div className="flex items-center gap-2 pt-2 border-t border-surface-border">
              <Bell className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              <input
                type="number"
                min={0}
                placeholder="목표가 알림 설정"
                value={alertDrafts[item.companyId] ?? ""}
                onChange={(e) => setAlertDrafts((prev) => ({ ...prev, [item.companyId]: e.target.value }))}
                className="flex-1 min-w-0 rounded-lg border border-surface-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-brand"
              />
              <button
                onClick={() => handleSaveAlert(item.companyId)}
                className="shrink-0 rounded-lg border border-brand px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white"
              >
                저장
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
