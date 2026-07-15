"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { Market } from "@/lib/types";

export function SearchForm({
  onSubmit,
  loading,
}: {
  onSubmit: (name: string, market: Market) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [market, setMarket] = useState<Market>("KR");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit(name.trim(), market);
      }}
      className="flex flex-col sm:flex-row gap-3"
    >
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="기업명을 입력하세요 (예: 삼성전자, Apple)"
          className="w-full rounded-xl border border-surface-border bg-surface-card py-3 pl-10 pr-4 text-sm outline-none focus:border-brand"
        />
      </div>
      <select
        value={market}
        onChange={(e) => setMarket(e.target.value as Market)}
        className="rounded-xl border border-surface-border bg-surface-card px-4 py-3 text-sm outline-none focus:border-brand"
      >
        <option value="KR">국내</option>
        <option value="US">해외</option>
      </select>
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {loading ? "조회 중..." : "브리핑 조회"}
      </button>
    </form>
  );
}
