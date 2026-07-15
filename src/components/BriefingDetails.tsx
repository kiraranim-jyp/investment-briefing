import { ExternalLink } from "lucide-react";
import { Card } from "./ui/Card";
import type { Briefing } from "@/lib/types";

export function BriefingDetails({ briefing }: { briefing: Briefing }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="text-xs font-semibold text-brand mb-2">뉴스 요약</div>
          <p className="text-sm text-gray-200 leading-relaxed">{briefing.newsSummary}</p>
        </Card>
        <Card>
          <div className="text-xs font-semibold text-brand mb-2">공시 요약</div>
          <p className="text-sm text-gray-200 leading-relaxed">{briefing.disclosureSummary}</p>
        </Card>
      </div>

      {briefing.trends.length > 0 && (
        <Card>
          <div className="text-xs font-semibold text-brand mb-2">최근 트렌드</div>
          <ul className="list-disc list-inside text-sm text-gray-200 space-y-1">
            {briefing.trends.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Card>
      )}

      {briefing.checkpoints.length > 0 && (
        <Card>
          <div className="text-xs font-semibold text-brand mb-2">체크포인트</div>
          <ul className="list-disc list-inside text-sm text-gray-200 space-y-1">
            {briefing.checkpoints.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="text-xs font-semibold text-gray-400 mb-2">뉴스 원문 소스</div>
          <ul className="space-y-1.5">
            {briefing.sources.news.map((n, i) => (
              <li key={i}>
                <a
                  href={n.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-brand"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{n.title}</span>
                </a>
              </li>
            ))}
            {!briefing.sources.news.length && <li className="text-xs text-gray-500">수집된 뉴스 없음</li>}
          </ul>
        </Card>
        <Card>
          <div className="text-xs font-semibold text-gray-400 mb-2">공시 원문 소스</div>
          <ul className="space-y-1.5">
            {briefing.sources.disclosures.map((d, i) => (
              <li key={i}>
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-gray-300 hover:text-brand"
                >
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{d.title}</span>
                </a>
              </li>
            ))}
            {!briefing.sources.disclosures.length && (
              <li className="text-xs text-gray-500">수집된 공시 없음</li>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
