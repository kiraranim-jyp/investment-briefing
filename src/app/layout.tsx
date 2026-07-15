import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { ToastProvider } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "Daily Alpha — 개인 투자 브리핑",
  description: "관심 기업 실시간 브리핑 + 매일 아침 08:30 투자가이드 메일",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans">
        <ToastProvider>
          <Header />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
