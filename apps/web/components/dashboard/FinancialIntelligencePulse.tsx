"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useAuth } from "@/components/auth/AuthProvider";
import { Flame, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  formatCompact,
  formatCurrency,
  getFiscalMonthStart,
} from "@/lib/utils";

export function FinancialIntelligencePulse() {
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const transactions = useSelector(
    (state: RootState) => state.transactions.items,
  );
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"burn" | "cushion" | "capital">(
    "burn",
  );

  const pulseData = useMemo(() => {
    const monthStartDate = user?.monthStartDate || 1;
    const now = new Date();
    const currentFiscalStart = getFiscalMonthStart(now, monthStartDate);

    // Compute next fiscal month start
    const nextFiscalStart = new Date(currentFiscalStart);
    nextFiscalStart.setMonth(nextFiscalStart.getMonth() + 1);

    const totalCycleDays = Math.max(
      1,
      Math.round(
        (nextFiscalStart.getTime() - currentFiscalStart.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    const elapsedDays = Math.max(
      1,
      Math.min(
        totalCycleDays,
        Math.round(
          (now.getTime() - currentFiscalStart.getTime()) /
            (1000 * 60 * 60 * 24),
        ) + 1,
      ),
    );
    const daysRemaining = Math.max(0, totalCycleDays - elapsedDays);

    // Accounts
    const activeAccounts = accounts.filter(
      (a) => !a.excludeFromAnalytics && !a.isClosed,
    );

    const liquidCash = activeAccounts
      .filter((a) => a.type === "bank" || a.type === "cash")
      .reduce((s, a) => s + Math.max(0, a.balance), 0);

    const investments = activeAccounts
      .filter((a) => a.type === "investment")
      .reduce((s, a) => s + Math.max(0, a.balance), 0);

    const cardDebt = activeAccounts
      .filter((a) => a.type === "card")
      .reduce((s, a) => s + Math.abs(a.balance), 0);

    const totalDebts = activeAccounts
      .filter((a) => a.type === "debt" || a.type === "card")
      .reduce((s, a) => s + Math.abs(a.balance), 0);

    // Fiscal transactions
    const fiscalTx = transactions.filter((tx) => {
      if (tx.status === "pending_confirmation") return false;
      return new Date(tx.date) >= currentFiscalStart;
    });

    const fiscalIncome = fiscalTx
      .filter((tx) => tx.type === "income")
      .reduce((s, t) => s + t.amount, 0);

    const fiscalExpense = fiscalTx
      .filter((tx) => tx.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    // Daily burn rate in current cycle
    const dailyBurnRate = fiscalExpense / elapsedDays;
    const projectedCycleExpense = dailyBurnRate * totalCycleDays;

    // 90-day baseline for emergency reserves
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const trailing90Expense = transactions
      .filter(
        (tx) =>
          tx.type === "expense" &&
          tx.status !== "pending_confirmation" &&
          new Date(tx.date) >= ninetyDaysAgo,
      )
      .reduce((s, t) => s + t.amount, 0);

    const avgMonthlyExpense =
      trailing90Expense > 0
        ? trailing90Expense / 3
        : Math.max(1, fiscalExpense);

    // Emergency reserve benchmarks
    const target3Month = avgMonthlyExpense * 3;
    const target6Month = avgMonthlyExpense * 6;
    const surplusVs3Month = liquidCash - target3Month;
    const surplusVs6Month = liquidCash - target6Month;
    const runwayMonths =
      avgMonthlyExpense > 0 ? liquidCash / avgMonthlyExpense : 12;

    // Quick Ratio: Liquid assets vs Card liabilities
    const cashToCardRatio = cardDebt > 0 ? liquidCash / cardDebt : null;
    const netLiquidCapital = liquidCash - cardDebt;

    // Net savings this cycle
    const netSavings = fiscalIncome - fiscalExpense;
    const savingsRate =
      fiscalIncome > 0 ? (netSavings / fiscalIncome) * 100 : 0;

    return {
      totalCycleDays,
      elapsedDays,
      daysRemaining,
      dailyBurnRate,
      projectedCycleExpense,
      fiscalIncome,
      fiscalExpense,
      avgMonthlyExpense,
      liquidCash,
      investments,
      cardDebt,
      totalDebts,
      target3Month,
      target6Month,
      surplusVs3Month,
      surplusVs6Month,
      runwayMonths,
      cashToCardRatio,
      netLiquidCapital,
      netSavings,
      savingsRate,
    };
  }, [accounts, transactions, user?.monthStartDate]);

  return (
    <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm relative overflow-hidden group flex flex-col justify-between h-full">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 size-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

      <div className="space-y-4">
        {/* Header & Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">
                Capital Insights & Velocity
              </h3>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-full">
                Monthly Cycle · {pulseData.daysRemaining}d to reset
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Monthly capital velocity, safety reserves & solvency analytics
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-white/5 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("burn")}
              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all ${
                activeTab === "burn"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Monthly Velocity
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cushion")}
              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all ${
                activeTab === "cushion"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Safety Buffer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("capital")}
              className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all ${
                activeTab === "capital"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Solvency
            </button>
          </div>
        </div>

        {/* Tab 1: Monthly Velocity & Run-rate */}
        {activeTab === "burn" && (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Monthly Outflow */}
              <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Monthly Outflow
                  </span>
                  <Flame className="size-3 text-rose-500" />
                </div>
                <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 tracking-tight">
                  {formatCurrency(pulseData.fiscalExpense)}
                </div>
                <div className="text-[8px] font-bold text-slate-500 truncate">
                  Current cycle spend
                </div>
              </div>

              {/* Monthly Inflow */}
              <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Monthly Inflow
                  </span>
                  <ArrowUpRight className="size-3 text-emerald-500" />
                </div>
                <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {formatCurrency(pulseData.fiscalIncome)}
                </div>
                <div className="text-[8px] font-bold text-slate-500 truncate">
                  Incoming capital
                </div>
              </div>

              {/* Net Cash Flow / Surplus */}
              <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Monthly Surplus
                  </span>
                  {pulseData.netSavings >= 0 ? (
                    <ArrowUpRight className="size-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="size-3 text-rose-500" />
                  )}
                </div>
                <div
                  className={`text-base sm:text-lg font-black tracking-tight ${
                    pulseData.netSavings >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-500"
                  }`}
                >
                  {pulseData.netSavings >= 0 ? "+" : ""}
                  {formatCompact(pulseData.netSavings)}
                </div>
                <div className="text-[8px] font-bold text-slate-500 truncate">
                  Net capital delta
                </div>
              </div>

              {/* Savings Velocity */}
              <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Savings Rate
                  </span>
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {pulseData.savingsRate.toFixed(0)}%
                </div>
                <div className="text-[8px] font-bold text-slate-500 truncate">
                  {pulseData.daysRemaining}d to cycle reset
                </div>
              </div>
            </div>

            {/* Micro Context Bar */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300">
              <span className="font-medium">
                Baseline living expenses run at{" "}
                <strong className="text-slate-900 dark:text-white">
                  {formatCompact(pulseData.avgMonthlyExpense)}/mo
                </strong>
                . Liquid capital covers{" "}
                <strong className="text-slate-900 dark:text-white">
                  {pulseData.runwayMonths.toFixed(1)} months
                </strong>{" "}
                of complete autonomy.
              </span>
              <span className="font-black text-primary shrink-0 hidden sm:inline-block">
                {pulseData.liquidCash >= pulseData.avgMonthlyExpense * 3
                  ? "✓ 3+ Mo Cushion Secured"
                  : "⚠ Build Safety Cushion"}
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Safety Cushion & Emergency Buffer */}
        {activeTab === "cushion" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Liquid Reserves */}
              <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Liquid Reserves
                </span>
                <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatCompact(pulseData.liquidCash)}
                </div>
                <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                  {pulseData.runwayMonths.toFixed(1)} Months Runway
                </div>
              </div>

              {/* 3-Month Minimum Buffer */}
              <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    3-Mo Minimum
                  </span>
                  <span
                    className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
                      pulseData.surplusVs3Month >= 0
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-rose-500/10 text-rose-500"
                    }`}
                  >
                    {pulseData.surplusVs3Month >= 0 ? "MET" : "DEFICIT"}
                  </span>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {formatCompact(pulseData.target3Month)}
                </div>
                <div className="text-[9px] font-bold text-slate-500">
                  {pulseData.surplusVs3Month >= 0
                    ? `+${formatCompact(pulseData.surplusVs3Month)} surplus`
                    : `${formatCompact(Math.abs(pulseData.surplusVs3Month))} gap`}
                </div>
              </div>

              {/* 6-Month Optimal Buffer */}
              <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    6-Mo Ideal
                  </span>
                  <span
                    className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
                      pulseData.surplusVs6Month >= 0
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {pulseData.surplusVs6Month >= 0 ? "MET" : "PROGRESS"}
                  </span>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {formatCompact(pulseData.target6Month)}
                </div>
                <div className="text-[9px] font-bold text-slate-500">
                  {pulseData.surplusVs6Month >= 0
                    ? `+${formatCompact(pulseData.surplusVs6Month)} surplus`
                    : `${formatCompact(Math.abs(pulseData.surplusVs6Month))} to goal`}
                </div>
              </div>
            </div>

            {/* Buffer Progress Bar */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 space-y-2">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-500">
                <span>Emergency Cushion Coverage (vs 6-Month Target)</span>
                <span>
                  {Math.min(
                    100,
                    Math.round(
                      (pulseData.liquidCash /
                        Math.max(1, pulseData.target6Month)) *
                        100,
                    ),
                  )}
                  %
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200/70 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (pulseData.liquidCash / Math.max(1, pulseData.target6Month)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Solvency & Debt Health */}
        {activeTab === "capital" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Net Liquid Position */}
              <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Net Liquid Cash
                </span>
                <div
                  className={`text-lg font-black tracking-tight ${
                    pulseData.netLiquidCapital >= 0
                      ? "text-slate-900 dark:text-white"
                      : "text-rose-500"
                  }`}
                >
                  {formatCurrency(pulseData.netLiquidCapital)}
                </div>
                <div className="text-[8px] font-bold text-slate-500">
                  Cash minus card debt
                </div>
              </div>

              {/* Quick Ratio */}
              <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Cash-to-Card Cover
                </span>
                <div className="text-lg font-black text-primary tracking-tight">
                  {pulseData.cashToCardRatio !== null
                    ? `${pulseData.cashToCardRatio.toFixed(1)}x`
                    : "Zero Card Debt"}
                </div>
                <div className="text-[8px] font-bold text-slate-500">
                  {pulseData.cardDebt > 0
                    ? `${formatCompact(pulseData.cardDebt)} card balance`
                    : "Pristine short-term solvency"}
                </div>
              </div>

              {/* Total Obligations */}
              <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Total Liabilities
                </span>
                <div className="text-lg font-black text-rose-500 tracking-tight">
                  {formatCurrency(pulseData.totalDebts)}
                </div>
                <div className="text-[8px] font-bold text-slate-500">
                  Loans & revolving credit
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300">
              <span className="font-medium">
                {pulseData.cardDebt === 0
                  ? "No credit card liabilities. Your liquid cash reserves remain 100% unencumbered."
                  : `Your liquid cash covers your credit card balance by ${pulseData.cashToCardRatio?.toFixed(1) ?? "—"}x.`}
              </span>
              <span className="text-primary font-bold shrink-0 hidden sm:inline-block">
                {pulseData.totalDebts === 0 ? "✓ Debt Free" : "Active Monitor"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
