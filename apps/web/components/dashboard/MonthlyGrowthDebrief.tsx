"use client";

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchMonthlyDebrief } from "@/store/slices/accountsSlice";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ArrowLeftRight,
  Percent,
} from "lucide-react";

interface MonthlyOverviewProps {
  monthlyIncome?: number;
  monthlyExpense?: number;
  savingsRate?: string;
}

export function MonthlyGrowthDebrief({
  monthlyIncome = 0,
  monthlyExpense = 0,
  savingsRate = "0.0",
}: MonthlyOverviewProps) {
  const dispatch = useDispatch<AppDispatch>();
  const debrief = useSelector((state: RootState) => state.accounts.debrief);
  const loading = useSelector(
    (state: RootState) => state.accounts.debriefLoading,
  );

  useEffect(() => {
    dispatch(fetchMonthlyDebrief());
  }, [dispatch]);

  if (loading || !debrief) {
    return (
      <div className="relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-slate-50/90 to-indigo-50/30 dark:from-[#0d121c] dark:via-[#090d14] dark:to-indigo-950/20 border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
        {/* Top bar skeleton */}
        <div className="h-1 w-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-white/10 dark:via-white/5 dark:to-white/10 animate-pulse" />
        <div className="p-3 sm:p-5 space-y-3.5">
          {/* Header row skeleton */}
          <div className="flex items-center gap-2.5">
            <div className="size-8 sm:size-9 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-3 w-28 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
                <div className="h-4 w-16 rounded-full bg-slate-100 dark:bg-white/5 animate-pulse" />
              </div>
              <div className="h-2.5 w-48 rounded-full bg-slate-100 dark:bg-white/5 animate-pulse" />
            </div>
          </div>
          {/* 4 metric cards skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="h-2.5 w-16 sm:w-20 rounded-full bg-slate-100 dark:bg-white/5 animate-pulse" />
                  <div className="size-5 sm:size-6 rounded-lg bg-slate-100 dark:bg-white/5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="h-5 w-20 sm:w-28 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse" />
                  <div className="h-2.5 w-24 sm:w-32 rounded-full bg-slate-100 dark:bg-white/5 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 1. Inflow: Use monthlyIncome if transactions logged; otherwise use pulse delta from debrief
  const pulseInflow =
    debrief.inflow ??
    (debrief.netWorthDelta > 0
      ? debrief.netWorthDelta
      : debrief.topGainer?.delta && debrief.topGainer.delta > 0
        ? debrief.topGainer.delta
        : 0);

  const effectiveInflow = monthlyIncome > 0 ? monthlyIncome : pulseInflow;

  // 2. Outflow: Use monthlyExpense if transactions logged; otherwise use topLeak or contraction
  const pulseOutflow =
    debrief.outflow ??
    (debrief.topLeak && debrief.topLeak.delta < 0
      ? Math.abs(debrief.topLeak.delta)
      : debrief.netWorthDelta < 0
        ? Math.abs(debrief.netWorthDelta)
        : 0);

  const effectiveOutflow = monthlyExpense > 0 ? monthlyExpense : pulseOutflow;

  // 3. Net Surplus: Cash flow from transactions or net pulse delta
  const netSurplus =
    monthlyIncome > 0 || monthlyExpense > 0
      ? monthlyIncome - monthlyExpense
      : (debrief.netCashFlow ?? debrief.netWorthDelta);

  const isSurplusPositive = netSurplus >= 0;

  const numericSavingsRate = parseFloat(savingsRate) || 0;

  const isMasked = formatCurrency(effectiveInflow) === "*****";

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-slate-50/90 to-indigo-50/30 dark:from-[#0d121c] dark:via-[#090d14] dark:to-indigo-950/20 border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden transition-all duration-300">
      {/* Top Ambient Highlight Glow */}
      <div
        className={`h-1 w-full bg-gradient-to-r ${
          isSurplusPositive
            ? "from-emerald-500 via-primary to-indigo-500"
            : "from-rose-500 via-amber-500 to-indigo-500"
        } opacity-90`}
      />

      <div className="p-3 sm:p-5 space-y-3.5">
        {/* Header Row: Title, Period, and Toggle Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`size-8 sm:size-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isSurplusPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              <ArrowLeftRight className="size-4" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] sm:text-xs">
                  Monthly Overview
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 shrink-0">
                  {debrief.period}
                </span>
                <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                  • 30-Day Cash Flow
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {debrief.insight ||
                  "Track how income and spending shape your monthly surplus"}
              </p>
            </div>
          </div>
        </div>

        {/* 4 Distinctive Cash Flow Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Monthly Inflow */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/5 shadow-xs flex flex-col justify-between gap-1.5 group hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
                Period Inflow
              </span>
              <div className="size-5 sm:size-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="size-3 sm:size-3.5" />
              </div>
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
                {isMasked ? "*****" : formatCurrency(effectiveInflow)}
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                {debrief.topGainer
                  ? `Top: ${debrief.topGainer.accountName} (+${formatCurrency(debrief.topGainer.delta)})`
                  : "Recorded incoming funds"}
              </p>
            </div>
          </div>

          {/* Card 2: Monthly Outflow */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/5 shadow-xs flex flex-col justify-between gap-1.5 group hover:border-rose-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
                Period Outflow
              </span>
              <div className="size-5 sm:size-6 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <TrendingDown className="size-3 sm:size-3.5" />
              </div>
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 tracking-tight truncate">
                {isMasked ? "*****" : formatCurrency(effectiveOutflow)}
              </div>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                {debrief.topLeak
                  ? `Top: ${debrief.topLeak.accountName} (-${formatCurrency(Math.abs(debrief.topLeak.delta))})`
                  : "Zero leakage • Fully preserved"}
              </p>
            </div>
          </div>

          {/* Card 3: Net Cash Flow (Surplus / Deficit) */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/5 shadow-xs flex flex-col justify-between gap-1.5 group hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
                Net Cash Flow
              </span>
              <div
                className={`size-5 sm:size-6 rounded-lg flex items-center justify-center shrink-0 ${
                  isSurplusPositive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                <ShieldCheck className="size-3 sm:size-3.5" />
              </div>
            </div>

            <div className="space-y-0.5 min-w-0">
              <div
                className={`text-base sm:text-lg font-black tracking-tight truncate ${
                  isSurplusPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isMasked
                  ? "*****"
                  : `${isSurplusPositive ? "+" : ""}${formatCurrency(netSurplus)}`}
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    isSurplusPositive
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
                  }`}
                >
                  {isSurplusPositive ? "Positive Reserve" : "Capital Deficit"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 4: Capital Retention / Savings Rate */}
          <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/5 shadow-xs flex flex-col justify-between gap-1.5 group hover:border-indigo-500/30 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
                Capital Retention
              </span>
              <div className="size-5 sm:size-6 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Percent className="size-3 sm:size-3.5" />
              </div>
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 tracking-tight truncate">
                {isMasked
                  ? "*****"
                  : `${numericSavingsRate > 0 ? numericSavingsRate.toFixed(1) : savingsRate}%`}
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                    numericSavingsRate >= 20
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400"
                      : numericSavingsRate > 0
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                  }`}
                >
                  {numericSavingsRate >= 50
                    ? "High Retention"
                    : numericSavingsRate >= 20
                      ? "Healthy Buffer"
                      : numericSavingsRate > 0
                        ? "Modest Surplus"
                        : isSurplusPositive
                          ? "Balanced Flow"
                          : "Contraction"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { MonthlyGrowthDebrief as MonthlyOverview };
