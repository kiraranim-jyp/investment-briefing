"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toaster";
import type { InvestmentGuide } from "@/lib/types";

export default function GuideDetailPage({ params }: { params: { companyId: string } }) {
  const [guide, setGuide] = useState<InvestmentGuide | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const toast = useToast();

  async function load() {
    setNotFound(false);
    const res = await fetch(`/api/guide/${encodeURIComponent(params.companyId)}`);
    if (res.status === 404) {
      setNotFound(true);
      setGuide(null);
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      toast.push(data.error ?? "조회 실패", "error");
      return;
    }
    setGuide(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.companyId]);

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch(`/api/guide/${encodeURIComponent(params.companyId)}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      setGuide(data);
      setNotFound(false);
      toast.push("투자가이드를 새로 생성했습니다.", "success");
    } catch (err: any) {
      toast.push(err.message ?? "생성에 실패했습니다.", "error");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/watchlist" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white w-fit">
        <ArrowLeft className="h-4 w-4" /> 워치리스트로
      </Link>

      {!guide && !notFound && (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {notFound && (
        <Card className="text-center space-y-4">
          <p className="text-sm text-gray-300">
            아직 생성된 투자가이드가 없습니다. 다음 모닝 브리핑(매일 08:30)에 자동 포함되거나,
            지금 바로 생성할 수 있습니다.
          </p>
          <button
            onClick={regenerate}
            disabled={regenerating}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {regenerating ? "생성 중..." : "지금 생성하기"}
          </button>
        </Card>
      )}

      {guide && (
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-brand font-semibold">
                {guide.company.name} · {guide.company.market}
              </div>
              <h1 className="text-2xl font-bold text-white">{guide.headline}</h1>
              <div className="text-xs text-gray-500 mt-1">
                생성: {new Date(guide.generatedAt).toLocaleString("ko-KR")}
              </div>
            </div>
            <button
              onClick={regenerate}
              disabled={regenerating}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs text-gray-300 hover:border-brand hover:text-brand disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`} />
              다시 생성
            </button>
          </div>

          {guide.whatsNew.length > 0 && (
            <Card className="border-brand/50">
              <div className="text-xs font-semibold text-brand mb-2">어제와 달라진 점</div>
              <ul className="list-disc list-inside text-sm text-gray-200 space-y-1">
                {guide.whatsNew.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <div className="text-xs font-semibold text-gray-400 mb-2">시장/산업 맥락</div>
            <p className="text-sm text-gray-200 leading-relaxed mb-2">{guide.marketContext}</p>
            <p className="text-sm text-gray-400 leading-relaxed">{guide.industryContext}</p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <div className="text-xs font-semibold text-emerald-400 mb-2">강점 요인</div>
              <ul className="list-disc list-inside text-sm text-gray-200 space-y-1">
                {guide.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Card>
            <Card>
              <div className="text-xs font-semibold text-red-400 mb-2">리스크 요인</div>
              <ul className="list-disc list-inside text-sm text-gray-200 space-y-1">
                {guide.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </Card>
          </div>

          {guide.opinion && (
            <Card>
              <div className="text-xs font-semibold text-gray-400 mb-2">개인 의견</div>
              <p className="text-sm text-gray-200">{guide.opinion}</p>
            </Card>
          )}

          <Card>
            <div className="text-xs font-semibold text-gray-400 mb-2">체크포인트</div>
            <ul className="list-disc list-inside text-sm text-gray-200 space-y-1">
              {guide.checkpoints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="text-xs font-semibold text-gray-400 mb-2">근거 소스</div>
            <ul className="space-y-1.5">
              {[...guide.sources.news, ...guide.sources.disclosures].map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-gray-300 hover:text-brand truncate block"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
