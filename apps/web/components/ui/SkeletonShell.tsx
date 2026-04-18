import React from "react";

export function SkeletonShell() {
  return (
    <div className="flex flex-col flex-1 w-full min-h-[100dvh] bg-background-light dark:bg-background-dark animate-pulse">
      {/* Header Skeleton */}
      <div className="h-16 border-b border-slate-200 dark:border-white/5 backdrop-blur-md sticky top-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="w-24 h-4 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        <div className="space-y-2">
          <div className="w-48 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="w-64 h-4 rounded bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-4 space-y-3">
              <div className="w-1/3 h-4 rounded bg-slate-100 dark:bg-slate-800" />
              <div className="w-2/3 h-8 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>

        <div className="h-64 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5" />
      </main>

      {/* Bottom Nav Skeleton (Mobile) */}
      <div className="h-20 border-t border-slate-200 dark:border-white/5 flex items-center justify-around px-4 lg:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="w-8 h-2 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
