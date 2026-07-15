import { CalendarClock } from "lucide-react";
import { Card } from "../ui/Card";
import type { EarningsCalendar } from "@/lib/types";

export function EarningsCalendarCard({ calendar }: { calendar: EarningsCalendar | null }) {
  return (
    <Card>
      <div className="text-xs font-semibold text-brand mb-2">다음 이벤트</div>
      {calendar?.nextEarningsDate ? (
        <div className="flex items-start gap-2">
          <CalendarClock className="h-4 w-4 mt-0.5 text-brand shrink-0" />
          <div>
            <div className="text-sm font-semibold text-white">실적발표 예정일 {calendar.nextEarningsDate}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              컨센서스 EPS {calendar.epsEstimate?.toLocaleString() ?? "N/A"}
              {calendar.revenueEstimate != null && ` · 매출 ${calendar.revenueEstimate.toLocaleString()}`}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500 text-center py-2">예정된 이벤트 정보가 없습니다.</div>
      )}
    </Card>
  );
}
