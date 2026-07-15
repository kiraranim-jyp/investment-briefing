import { Card } from "../ui/Card";
import type { NewsSentiment } from "@/lib/types";

export function NewsSentimentCard({ sentiment }: { sentiment: NewsSentiment | null }) {
  if (!sentiment) {
    return (
      <Card>
        <div className="text-xs font-semibold text-brand mb-2">뉴스 영향도</div>
        <div className="text-xs text-gray-500 text-center py-4">감성분석 데이터가 없습니다.</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="text-xs font-semibold text-brand mb-2">뉴스 영향도</div>
      <div className="h-2.5 w-full rounded-full overflow-hidden flex mb-2">
        <div className="bg-emerald-500" style={{ width: `${sentiment.positivePct}%` }} />
        <div className="bg-gray-500" style={{ width: `${sentiment.neutralPct}%` }} />
        <div className="bg-red-500" style={{ width: `${sentiment.negativePct}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-gray-400 mb-3">
        <span className="text-emerald-400">긍정 {sentiment.positivePct}%</span>
        <span>중립 {sentiment.neutralPct}%</span>
        <span className="text-red-400">부정 {sentiment.negativePct}%</span>
      </div>
      <p className="text-sm text-gray-200">{sentiment.summary}</p>
    </Card>
  );
}
