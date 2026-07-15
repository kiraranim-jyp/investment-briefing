import Link from "next/link";
import { LineChart } from "lucide-react";
import { Ticker } from "./Ticker";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/95 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <LineChart className="h-5 w-5 text-brand" />
            <span className="font-bold tracking-tight text-white">Daily Alpha</span>
          </Link>
          <div className="hidden md:block min-w-0">
            <Ticker />
          </div>
        </div>
        <nav className="flex items-center gap-4 text-sm shrink-0">
          <Link href="/" className="text-gray-300 hover:text-white">
            즉시조회
          </Link>
          <Link href="/watchlist" className="text-gray-300 hover:text-white">
            워치리스트
          </Link>
          <Link href="/compare" className="text-gray-300 hover:text-white">
            종목비교
          </Link>
        </nav>
      </div>
      <div className="md:hidden px-4 pb-3">
        <Ticker />
      </div>
    </header>
  );
}
