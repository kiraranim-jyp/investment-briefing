import { cx } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-surface-border bg-surface-card p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
