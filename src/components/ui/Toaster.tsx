"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cx } from "@/lib/utils";

interface Toast {
  id: number;
  message: string;
  variant: "info" | "error" | "success";
}

interface ToastContextValue {
  push: (message: string, variant?: Toast["variant"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast는 ToastProvider 안에서 사용해야 합니다.");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, variant: Toast["variant"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "rounded-lg px-4 py-3 text-sm shadow-lg border backdrop-blur",
              t.variant === "error" && "bg-red-950/90 border-red-800 text-red-200",
              t.variant === "success" && "bg-emerald-950/90 border-emerald-800 text-emerald-200",
              t.variant === "info" && "bg-surface-card/95 border-surface-border text-white"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
