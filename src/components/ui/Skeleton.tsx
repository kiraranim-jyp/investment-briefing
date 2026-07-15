import { cx } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-md", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-card p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}
