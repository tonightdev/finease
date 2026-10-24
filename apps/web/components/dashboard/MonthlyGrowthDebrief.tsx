"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchMonthlyDebrief } from "@/store/slices/accountsSlice";
import { openModal } from "@/store/slices/uiSlice";
import { formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
} from "lucide-react";

export function MonthlyGrowthDebrief() {
  const dispatch = useDispatch<AppDispatch>();
  const debrief = useSelector((state: RootState) => state.accounts.debrief);
  const loading = useSelector(
    (state: RootState) => state.accounts.debriefLoading,
  );

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    dispatch(fetchMonthlyDebrief());
  }, [dispatch]);

  if (loading && !debrief) {
    return (
      <div className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.03] animate-pulse" />
    );
  }

  if (!debrief) return null;

  const totalCap =
    debrief.allocation.liquid +
    debrief.allocation.invested +
    debrief.allocation.debt;
  const liquidPct =
    totalCap > 0 ? (debrief.allocation.liquid / totalCap) * 100 : 0;
  const investedPct =
    totalCap > 0 ? (debrief.allocation.invested / totalCap) * 100 : 0;
  const debtPct = totalCap > 0 ? (debrief.allocation.debt / totalCap) * 100 : 0;

  const isNetPositive = debrief.netWorthDelta >= 0;
  const isMasked = formatCurrency(debrief.netWorthDelta) === "*****";

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-r from-white via-slate-50 to-indigo-50/20 dark:from-[#0d1117] dark:via-[#090b0e] dark:to-indigo-950/10 border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden transition-all">
      {/* Sleek Minimalist Executive Bar */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 text-xs">
        {/* Left: Icon, Title & Net Worth */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 sm:size-7 rounded-lg sm:rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="size-3 sm:size-3.5 text-amber-500" />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[10px] sm:text-[11px] shrink-0">
              Monthly Debrief
            </span>
            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline shrink-0">
              • {debrief.period}
            </span>
            <div className="h-3 w-[1px] bg-slate-200 dark:bg-white/10 hidden sm:block shrink-0" />
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hidden md:inline">
                Net Worth:
              </span>
              <span className="font-black text-slate-900 dark:text-white text-[11px] sm:text-xs">
                {formatCurrency(debrief.netWorth)}
              </span>
              <span
                className={`font-black text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border shrink-0 ${
                  isNetPositive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
                }`}
              >
                {isMasked ? (
                  "*****"
                ) : (
                  <>
                    {isNetPositive ? "+" : ""}
                    {formatCurrency(debrief.netWorthDelta)}
                    <span className="opacity-75 font-bold hidden sm:inline">
                      ({debrief.percentageDelta >= 0 ? "+" : ""}
                      {debrief.percentageDelta.toFixed(1)}%)
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Key Highlight & Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {debrief.topGainer && (
            <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 truncate max-w-[180px]">
              <TrendingUp className="size-3 shrink-0" />
              <span className="truncate">
                Top: {debrief.topGainer.accountName}
              </span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors shrink-0"
          >
            <span>{isExpanded ? "Less" : "Details"}</span>
            {isExpanded ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Optional Compact Drawer Content when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] p-3.5 sm:p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {/* Card 1: Asset Split */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Asset Allocation
                  </span>
                  <Zap className="size-3 text-primary" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Liquid ({liquidPct.toFixed(0)}%)</span>
                    <span>Invested ({investedPct.toFixed(0)}%)</span>
                    <span>Debt ({debtPct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex">
                    <div
                      style={{ width: `${liquidPct}%` }}
                      className="bg-blue-500 h-full"
                    />
                    <div
                      style={{ width: `${investedPct}%` }}
                      className="bg-emerald-500 h-full"
                    />
                    <div
                      style={{ width: `${debtPct}%` }}
                      className="bg-rose-500 h-full"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Top Driver */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Growth Driver
                </span>
                {debrief.topGainer ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                      {debrief.topGainer.accountName}
                    </span>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      {isMasked
                        ? "*****"
                        : `+${formatCurrency(debrief.topGainer.delta)}`}
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Stable allocation pattern
                  </p>
                )}
              </div>

              {/* Card 3: Action */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Check-in Action
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    60s Wealth Pulse
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(openModal("isWealthPulseOpen"))}
                  className="px-3 py-1.5 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-wider shadow-sm hover:bg-primary/90 transition-all shrink-0 flex items-center gap-1.5"
                >
                  <span>Sync</span>
                  <ArrowRight className="size-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
