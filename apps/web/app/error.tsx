"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FinEase PWA Error Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="size-14 mx-auto rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertTriangle className="size-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Something went wrong
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            A temporary issue occurred while rendering this view. Your financial
            records and sessions are completely safe.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 text-xs font-black uppercase tracking-wider h-11"
          >
            <RefreshCw className="size-3.5 mr-2" />
            Reload View
          </Button>
          <Link href="/dashboard" className="flex-1">
            <Button
              variant="secondary"
              className="w-full text-xs font-black uppercase tracking-wider h-11"
            >
              <Home className="size-3.5 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
