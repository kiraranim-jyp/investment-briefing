"use client";

import { useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { useToast } from "./ui/Toaster";
import { BriefingDetails } from "./BriefingDetails";
import type { Briefing } from "@/lib/types";

export function BriefingResult({ briefing }: { briefing: Briefing }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const toast = useToast();

  async function addToWatchlist() {
    setAdding(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: briefing.company.name, market: briefing.company.market }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "등록 실패");
      setAdded(true);
      toast.push(`${briefing.company.name} 워치리스트에 등록했습니다.`, "success");
    } catch (err: any) {
      toast.push(err.message ?? "워치리스트 등록에 실패했습니다.", "error");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      {briefing.partialFailures.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-800 bg-amber-950/50 p-3 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            일부 데이터 수집에 실패했습니다: {briefing.partialFailures.join(" / ")}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {briefing.company.name}{" "}
          <span className="text-sm font-normal text-gray-400">({briefing.company.market})</span>
        </h2>
        <button
          onClick={addToWatchlist}
          disabled={adding || added}
          className="flex items-center gap-1.5 rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          {added ? "워치리스트에 등록됨" : "워치리스트 등록"}
        </button>
      </div>

      <BriefingDetails briefing={briefing} />
    </div>
  );
}
