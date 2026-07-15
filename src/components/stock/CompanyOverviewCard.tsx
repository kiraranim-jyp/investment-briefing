import { Star } from "lucide-react";
import { Card } from "../ui/Card";
import { cx } from "@/lib/utils";
import { formatMarketCap, formatPercent, formatPrice, formatRatio } from "@/lib/format";
import type { CompanyProfile } from "@/lib/types";

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

export function CompanyOverviewCard({
  profile,
  strengths,
  weaknesses,
  starRating,
}: {
  profile: CompanyProfile;
  strengths: string[];
  weaknesses: string[];
  starRating: number;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-brand">기업 경쟁력</div>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cx("h-4 w-4", i < starRating ? "fill-amber-400 text-amber-400" : "text-surface-border")}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 pb-4 border-b border-surface-border">
        <StatItem label="현재가" value={formatPrice(profile.price, profile.currency)} />
        <StatItem label="시가총액" value={formatMarketCap(profile.marketCap, profile.currency)} />
        <StatItem label="PER" value={formatRatio(profile.per)} />
        <StatItem label="PBR" value={formatRatio(profile.pbr)} />
        <StatItem label="ROE" value={formatPercent(profile.roe)} />
        <StatItem label="배당수익률" value={formatPercent(profile.dividendYield)} />
      </div>

      {strengths.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-semibold text-emerald-400 mb-1.5">강점</div>
          <ul className="space-y-1">
            {strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-200 flex gap-1.5">
                <span className="text-emerald-400 shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {weaknesses.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-red-400 mb-1.5">약점</div>
          <ul className="space-y-1">
            {weaknesses.map((s, i) => (
              <li key={i} className="text-sm text-gray-200 flex gap-1.5">
                <span className="text-red-400 shrink-0">-</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.businessSummary && (
        <p className="mt-4 pt-4 border-t border-surface-border text-xs text-gray-400 leading-relaxed line-clamp-4">
          {profile.businessSummary}
        </p>
      )}
    </Card>
  );
}
