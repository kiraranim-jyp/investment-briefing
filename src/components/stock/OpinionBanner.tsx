import { AlertTriangle, Minus, TrendingUp } from "lucide-react";
import { cx } from "@/lib/utils";
import type { InvestmentOpinion } from "@/lib/types";

const CONFIG: Record<
  InvestmentOpinion,
  { icon: typeof TrendingUp; border: string; bg: string; text: string }
> = {
  매수: { icon: TrendingUp, border: "border-emerald-800", bg: "bg-emerald-950/40", text: "text-emerald-400" },
  관망: { icon: Minus, border: "border-amber-800", bg: "bg-amber-950/40", text: "text-amber-400" },
  주의: { icon: AlertTriangle, border: "border-red-800", bg: "bg-red-950/40", text: "text-red-400" },
};

export function OpinionBanner({ opinion, reason }: { opinion: InvestmentOpinion; reason: string }) {
  const { icon: Icon, border, bg, text } = CONFIG[opinion];
  return (
    <div className={cx("rounded-2xl border p-5", border, bg)}>
      <div className={cx("flex items-center gap-2 text-sm font-bold mb-2", text)}>
        <Icon className="h-5 w-5" />
        AI 투자의견 · {opinion}
      </div>
      <p className="text-sm text-gray-200 leading-relaxed">{reason}</p>
      <p className="mt-3 text-[11px] text-gray-500">
        본 의견은 공개 데이터를 바탕으로 한 AI 참고 의견이며 투자 자문이 아닙니다. 최종 판단과 책임은 본인에게 있습니다.
      </p>
    </div>
  );
}
