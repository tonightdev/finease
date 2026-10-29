"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Card } from "@/components/ui/Card";
import {
  Sunrise,
  Clock,
  Flame,
  Wallet,
  Sparkles,
  Info,
  TrendingUp,
} from "lucide-react";
import { formatCompact, formatCurrency } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type FireModelType = "lean" | "standard" | "fat";

export function FinancialIndependenceRunwayCard() {
  const [model, setModel] = useState<FireModelType>("standard");
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  const rawAccounts = useSelector((state: RootState) => state.accounts.items);
  const rawTransactions = useSelector(
    (state: RootState) => state.transactions.items,
  );
  const rawSnapshots = useSelector(
    (state: RootState) => state.accounts.snapshots || [],
  );
  const strategy = useSelector((state: RootState) => state.strategies.current);

  const firMetrics = useMemo(() => {
    // 1. Filter accounts: non-excluded from analytics & not closed
    const activeAccounts = rawAccounts.filter(
      (a) => !a.excludeFromAnalytics && !a.isClosed,
    );

    const liquidCash = activeAccounts
      .filter((a) => a.type === "bank" || a.type === "cash")
      .reduce((s, a) => s + Math.max(0, a.balance), 0);

    const investments = activeAccounts
      .filter((a) => a.type === "investment")
      .reduce((s, a) => s + Math.max(0, a.balance), 0);

    const otherAssets = activeAccounts
      .filter((a) => a.type === "asset")
      .reduce((s, a) => s + Math.max(0, a.balance), 0);

    const totalAssets = liquidCash + investments + otherAssets;

    const totalLiabilities = activeAccounts
      .filter((a) => a.type === "debt" || a.type === "card")
      .reduce((s, a) => s + Math.abs(a.balance), 0);

    const currentNetWorth = Math.max(0, totalAssets - totalLiabilities);

    // 2. Realistic monthly expense baseline:
    // Group all valid expenses by month to compute the actual monthly burn
    const validExpenseTx = rawTransactions.filter(
      (tx) => tx.type === "expense" && tx.status !== "pending_confirmation",
    );
    const expensesByMonth: Record<string, number> = {};
    validExpenseTx.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      expensesByMonth[key] = (expensesByMonth[key] || 0) + tx.amount;
    });

    const monthExpenseValues = Object.values(expensesByMonth);
    const txAvgMonthlyExpense =
      monthExpenseValues.length > 0
        ? monthExpenseValues.reduce((a, b) => a + b, 0) /
          monthExpenseValues.length
        : 0;

    // Strategy monthly planned outflow fallback
    const strategyOutflow = (strategy?.entries || [])
      .filter((e) => e.type === "outflow")
      .reduce((s, e) => {
        const amt = parseFloat(e.amount) || 0;
        return s + (e.isMonthly !== false ? amt : amt / 12);
      }, 0);

    const avgMonthlyExpense =
      txAvgMonthlyExpense > 0
        ? txAvgMonthlyExpense
        : strategyOutflow > 0
          ? strategyOutflow
          : 0;

    const annualExpenses = avgMonthlyExpense * 12;

    // 3. Dual Runway Calculations
    const liquidRunwayMonths =
      avgMonthlyExpense > 0 ? liquidCash / avgMonthlyExpense : null;
    const totalWealthRunwayMonths =
      avgMonthlyExpense > 0 ? currentNetWorth / avgMonthlyExpense : null;

    // 4. FIRE Corpus Targets (Trinity Study Standard)
    const leanMultiplier = 20; // 5% Safe Withdrawal Rate (SWR)
    const standardMultiplier = 25; // 4% SWR (Classic Trinity Study Rule)
    const fatMultiplier = 33; // 3% SWR (Ultra-Safe / High Comfort)

    const leanCorpus = annualExpenses * leanMultiplier;
    const standardCorpus = annualExpenses * standardMultiplier;
    const fatCorpus = annualExpenses * fatMultiplier;

    const activeCorpus =
      model === "lean"
        ? leanCorpus
        : model === "fat"
          ? fatCorpus
          : standardCorpus;

    const activeMultiplier =
      model === "lean"
        ? leanMultiplier
        : model === "fat"
          ? fatMultiplier
          : standardMultiplier;

    const activeProgress =
      activeCorpus > 0
        ? Math.min(100, (currentNetWorth / activeCorpus) * 100)
        : 0;

    const activeDeficit = Math.max(0, activeCorpus - currentNetWorth);

    // 5. Perpetual Passive Monthly Income via 4% SWR Rule
    const perpetualMonthlyIncome = (currentNetWorth * 0.04) / 12;
    const passiveCoveragePct =
      avgMonthlyExpense > 0
        ? Math.min(100, (perpetualMonthlyIncome / avgMonthlyExpense) * 100)
        : 0;

    // 6. Monthly Savings & Net Worth Growth Rate
    const validIncomeTx = rawTransactions.filter(
      (tx) => tx.type === "income" && tx.status !== "pending_confirmation",
    );
    const incomeByMonth: Record<string, number> = {};
    validIncomeTx.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      incomeByMonth[key] = (incomeByMonth[key] || 0) + tx.amount;
    });

    const monthIncomeValues = Object.values(incomeByMonth);
    const avgMonthlyIncome =
      monthIncomeValues.length > 0
        ? monthIncomeValues.reduce((a, b) => a + b, 0) /
          monthIncomeValues.length
        : 0;

    const monthlySavings = Math.max(0, avgMonthlyIncome - avgMonthlyExpense);

    // Default healthy 8% nominal CAGR for diversified wealth
    let annualGrowthRate = 0.08;
    if (rawSnapshots.length >= 2) {
      const sorted = [...rawSnapshots].sort(
        (a, b) =>
          new Date(a.createdAt || a.date).getTime() -
          new Date(b.createdAt || b.date).getTime(),
      );
      const oldest = sorted[0]!;
      const newest = sorted[sorted.length - 1]!;
      const daysDiff = Math.max(
        30,
        (new Date(newest.createdAt || newest.date).getTime() -
          new Date(oldest.createdAt || oldest.date).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (
        oldest.netWorth > 0 &&
        newest.netWorth > oldest.netWorth &&
        daysDiff >= 30
      ) {
        const cagr =
          Math.pow(newest.netWorth / oldest.netWorth, 365 / daysDiff) - 1;
        annualGrowthRate = Math.min(Math.max(cagr, 0.06), 0.25);
      }
    }

    // 7. Project Freedom Date using Compound Growth Model:
    let projectedRetirementDate: Date | null = null;
    let yearsToFreedom: number | null = null;

    if (activeCorpus > 0 && currentNetWorth >= activeCorpus) {
      yearsToFreedom = 0;
      projectedRetirementDate = new Date();
    } else if (activeCorpus > 0 && currentNetWorth > 0) {
      const monthlyRate =
        annualGrowthRate > 0
          ? Math.pow(1 + annualGrowthRate, 1 / 12) - 1
          : 0.006;
      let lo = 0;
      let hi = 480; // 40 years max
      for (let i = 0; i < 50; i++) {
        const mid = (lo + hi) / 2;
        const fv =
          monthlyRate > 0
            ? currentNetWorth * Math.pow(1 + monthlyRate, mid) +
              monthlySavings *
                ((Math.pow(1 + monthlyRate, mid) - 1) / monthlyRate)
            : currentNetWorth + monthlySavings * mid;
        if (fv >= activeCorpus) hi = mid;
        else lo = mid;
      }
      yearsToFreedom = Math.ceil((hi / 12) * 10) / 10;
      projectedRetirementDate = new Date();
      projectedRetirementDate.setMonth(
        projectedRetirementDate.getMonth() + Math.ceil(hi),
      );
    }

    return {
      liquidCash,
      investments,
      totalLiabilities,
      currentNetWorth,
      avgMonthlyExpense,
      annualExpenses,
      liquidRunwayMonths,
      totalWealthRunwayMonths,
      leanCorpus,
      standardCorpus,
      fatCorpus,
      activeCorpus,
      activeMultiplier,
      activeProgress,
      activeDeficit,
      perpetualMonthlyIncome,
      passiveCoveragePct,
      monthlySavings,
      annualGrowthRate,
      yearsToFreedom,
      projectedRetirementDate,
    };
  }, [rawAccounts, rawTransactions, rawSnapshots, model, strategy]);

  return (
    <div className="w-full">
      <Card className="shadow-none border-slate-200/80 dark:border-white/5 p-0 overflow-hidden bg-white dark:bg-slate-900/60 backdrop-blur-xl">
        {/* Top vibrant gradient accent line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-600 via-primary to-emerald-500" />

        <div className="p-3.5 sm:p-5 space-y-4 sm:space-y-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 sm:size-11 rounded-2xl bg-gradient-to-br from-violet-500/10 to-primary/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <Sunrise className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    Financial Independence Runway
                  </h3>
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                    FIRE Engine
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Zero-income survival horizon & self-sufficiency analytics
                </p>
              </div>
            </div>

            {/* FIRE Model Selector Tabs */}
            <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-white/5 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setModel("lean")}
                className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all ${
                  model === "lean"
                    ? "bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Lean FI (20x)
              </button>
              <button
                type="button"
                onClick={() => setModel("standard")}
                className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all ${
                  model === "standard"
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Standard (25x)
              </button>
              <button
                type="button"
                onClick={() => setModel("fat")}
                className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-all ${
                  model === "fat"
                    ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Fat FI (33x)
              </button>
            </div>
          </div>

          {/* 4 Main Core Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Metric 1: Liquid Cash Runway */}
            <div className="bg-slate-50/80 dark:bg-white/[0.02] rounded-2xl p-3 sm:p-3.5 border border-slate-200/60 dark:border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Liquid Cash Runway
                </span>
                <Wallet className="size-3.5 text-emerald-500" />
              </div>
              <div>
                <div
                  className={`text-xl sm:text-2xl font-black tracking-tight ${
                    firMetrics.liquidRunwayMonths === null
                      ? "text-slate-400"
                      : firMetrics.liquidRunwayMonths >= 6
                        ? "text-emerald-600 dark:text-emerald-400"
                        : firMetrics.liquidRunwayMonths >= 3
                          ? "text-amber-500"
                          : "text-rose-500"
                  }`}
                >
                  {firMetrics.liquidRunwayMonths === null
                    ? "—"
                    : firMetrics.liquidRunwayMonths >= 120
                      ? "10+ yrs"
                      : `${firMetrics.liquidRunwayMonths.toFixed(1)} mo`}
                </div>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5 truncate">
                  {formatCompact(firMetrics.liquidCash)} bank & cash
                </p>
              </div>
              <div className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Zero-Income Survival
              </div>
            </div>

            {/* Metric 2: Total Wealth Runway */}
            <div className="bg-slate-50/80 dark:bg-white/[0.02] rounded-2xl p-3 sm:p-3.5 border border-slate-200/60 dark:border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Total Wealth Runway
                </span>
                <Flame className="size-3.5 text-amber-500" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {firMetrics.totalWealthRunwayMonths === null
                    ? "—"
                    : firMetrics.totalWealthRunwayMonths >= 360
                      ? "30+ yrs (FI!)"
                      : firMetrics.totalWealthRunwayMonths >= 12
                        ? `${(firMetrics.totalWealthRunwayMonths / 12).toFixed(1)} yrs`
                        : `${firMetrics.totalWealthRunwayMonths.toFixed(1)} mo`}
                </div>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5 truncate">
                  {firMetrics.avgMonthlyExpense > 0
                    ? `At ${formatCompact(firMetrics.avgMonthlyExpense)}/mo living cost`
                    : "Configure monthly expense"}
                </p>
              </div>
              <div className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                Full Portfolio Horizon
              </div>
            </div>

            {/* Metric 3: Perpetual Passive Cashflow (4% SWR) */}
            <div className="bg-slate-50/80 dark:bg-white/[0.02] rounded-2xl p-3 sm:p-3.5 border border-slate-200/60 dark:border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[9px] font-black uppercase tracking-widest">
                  Passive Income (4%)
                </span>
                <TrendingUp className="size-3.5 text-primary" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                  {formatCompact(firMetrics.perpetualMonthlyIncome)}/mo
                </div>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5 truncate">
                  {firMetrics.passiveCoveragePct > 0
                    ? `Covers ${firMetrics.passiveCoveragePct.toFixed(0)}% living costs`
                    : "Permanent monthly yield"}
                </p>
              </div>
              <div className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit bg-primary/10 text-primary">
                Perpetual Yield
              </div>
            </div>

            {/* Metric 4: Projected Freedom Date / FI Corpus */}
            <div className="bg-gradient-to-br from-violet-500/5 via-indigo-500/5 to-emerald-500/5 dark:from-violet-500/10 dark:via-indigo-500/10 dark:to-emerald-500/10 rounded-2xl p-3 sm:p-3.5 border border-violet-500/20 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">
                  {firMetrics.activeProgress >= 100
                    ? "Status"
                    : "Freedom Horizon"}
                </span>
                <Clock className="size-3.5 text-violet-500" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400 tracking-tight">
                  {firMetrics.activeCorpus === 0
                    ? "Set Budget"
                    : firMetrics.activeProgress >= 100
                      ? "FIRE Achieved! 🎊"
                      : firMetrics.projectedRetirementDate
                        ? firMetrics.projectedRetirementDate.toLocaleDateString(
                            "en-IN",
                            { month: "short", year: "numeric" },
                          )
                        : "—"}
                </div>
                <p className="text-[9px] font-bold text-slate-500 mt-0.5 truncate">
                  {firMetrics.activeCorpus === 0
                    ? "Log expenses to project"
                    : firMetrics.activeProgress >= 100
                      ? "100% financially independent"
                      : `Target: ${formatCompact(firMetrics.activeCorpus)} (${firMetrics.activeMultiplier}x)`}
                </p>
              </div>
              <div className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit bg-violet-500/10 text-violet-600 dark:text-violet-400">
                {firMetrics.activeProgress.toFixed(1)}% Completed
              </div>
            </div>
          </div>

          {/* Progress Bar with Milestones */}
          <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 sm:p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] font-black uppercase tracking-widest gap-1">
              <span className="text-slate-500">
                Corpus Accumulation:{" "}
                {formatCurrency(firMetrics.currentNetWorth)}{" "}
                {firMetrics.activeCorpus > 0 &&
                  `of ${formatCurrency(Math.round(firMetrics.activeCorpus))}`}
              </span>
              <span className="text-violet-600 dark:text-violet-400 font-black">
                {firMetrics.activeProgress.toFixed(1)}% Completed
              </span>
            </div>

            {/* Visual Bar */}
            <div className="relative h-2.5 w-full bg-slate-200/70 dark:bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${firMetrics.activeProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-violet-600 via-primary to-emerald-500 rounded-full"
              />
            </div>

            {/* Milestone Markers */}
            <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest pt-0.5">
              <span>0% Start</span>
              <span>25% Buffer</span>
              <span>50% Halfway</span>
              <span>75% Lean FI</span>
              <span>100% Free</span>
            </div>
          </div>

          {/* Insight & Freedom Multiplier Banner */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-violet-500/5 to-primary/5 dark:from-violet-500/10 dark:to-primary/10 border border-violet-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="size-3.5 text-violet-500 shrink-0" />
                <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  The SWR Independence Milestone
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                Under the proven 4% Safe Withdrawal Rule, your current portfolio
                already generates{" "}
                <strong className="text-slate-900 dark:text-white">
                  {formatCurrency(
                    Math.round(firMetrics.perpetualMonthlyIncome),
                  )}
                  /month
                </strong>{" "}
                in permanent passive cash flow.
                {firMetrics.avgMonthlyExpense > 0 && (
                  <span>
                    {" "}
                    This permanently covers{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {firMetrics.passiveCoveragePct.toFixed(1)}%
                    </strong>{" "}
                    of your monthly living costs (
                    {formatCurrency(Math.round(firMetrics.avgMonthlyExpense))}
                    /mo) forever without ever touching your principal capital!
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowFormulaInfo(!showFormulaInfo)}
              className="text-[9px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest hover:underline flex items-center gap-1 self-start sm:self-auto shrink-0"
            >
              <Info className="size-3" />
              <span>{showFormulaInfo ? "Hide Formula" : "How it Works"}</span>
            </button>
          </div>

          {/* Expandable Explanation */}
          <AnimatePresence>
            {showFormulaInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-1 leading-relaxed"
              >
                <p>
                  <strong>
                    The FIR (Financial Independence Runway) Formula:
                  </strong>{" "}
                  Multiplies your annualized living costs by 20x (Lean, 5% SWR),
                  25x (Standard 4% Trinity Rule), or 33x (Fat FI, 3%
                  conservative rule).
                </p>
                <p>
                  Your passive income is modeled at the academic 4% Safe
                  Withdrawal Rate (
                  {formatCompact(firMetrics.perpetualMonthlyIncome)}/month),
                  showing exactly how much of your daily life is already
                  liberated from employment.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
