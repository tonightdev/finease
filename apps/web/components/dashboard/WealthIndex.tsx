"use client";

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useAuth } from "@/components/auth/AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Zap, TrendingUp, CreditCard, Info } from "lucide-react";
import { getFiscalMonthStart, formatCompact } from "@/lib/utils";

export function WealthIndex() {
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const transactions = useSelector(
    (state: RootState) => state.transactions.items,
  );
  const { user } = useAuth();

  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  const healthData = useMemo(() => {
    const monthStartDate = user?.monthStartDate || 1;
    const currentFiscalStart = getFiscalMonthStart(new Date(), monthStartDate);

    // --- Accounts Split ---
    const activeAccounts = accounts.filter(
      (a) => !a.excludeFromAnalytics && !a.isClosed,
    );

    const liquidCapital = activeAccounts
      .filter((a) => a.type === "bank" || a.type === "cash")
      .reduce((s, a) => s + Math.max(0, a.balance), 0);

    const investments = activeAccounts
      .filter((a) => a.type === "investment")
      .reduce((s, a) => s + Math.max(0, a.balance), 0);

    const liabilities = activeAccounts
      .filter((a) => a.type === "debt" || a.type === "card")
      .reduce((s, a) => s + Math.abs(a.balance), 0);

    const otherAssets = activeAccounts
      .filter((a) => a.type === "asset")
      .reduce((s, a) => s + Math.max(0, a.balance), 0);

    const totalAssets = liquidCapital + investments + otherAssets;

    // --- Transactions & Burn Rate ---
    // 1. Current Fiscal Month
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

    // 2. 90-Day Trailing Baseline for stable burn rate
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const trailing90Expense = transactions
      .filter((tx) => {
        if (tx.status === "pending_confirmation" || tx.type !== "expense")
          return false;
        return new Date(tx.date) >= ninetyDaysAgo;
      })
      .reduce((s, t) => s + t.amount, 0);

    const avgMonthlyExpense =
      trailing90Expense > 0
        ? trailing90Expense / 3
        : Math.max(1, fiscalExpense);

    // ==========================================
    // PILLAR 1: Liquidity & Emergency Cushion (25 pts)
    // ==========================================
    const runwayMonths =
      avgMonthlyExpense > 0 ? liquidCapital / avgMonthlyExpense : 12;

    let liquidityScore = 0;
    if (runwayMonths >= 6) {
      liquidityScore = 25;
    } else if (runwayMonths >= 3) {
      liquidityScore = 18 + ((runwayMonths - 3) / 3) * 7;
    } else if (runwayMonths >= 1) {
      liquidityScore = 10 + ((runwayMonths - 1) / 2) * 8;
    } else {
      liquidityScore = Math.max(0, runwayMonths * 10);
    }
    liquidityScore = Math.round(liquidityScore);

    // ==========================================
    // PILLAR 2: Savings & Cash Flow Rate (25 pts)
    // ==========================================
    let savingsRate = 0;
    let savingsScore = 0;
    if (fiscalIncome > 0) {
      savingsRate = Math.max(
        -100,
        Math.min(100, ((fiscalIncome - fiscalExpense) / fiscalIncome) * 100),
      );
      if (savingsRate >= 40) {
        savingsScore = 25;
      } else if (savingsRate >= 20) {
        savingsScore = 18 + ((savingsRate - 20) / 20) * 7;
      } else if (savingsRate >= 5) {
        savingsScore = 10 + ((savingsRate - 5) / 15) * 8;
      } else if (savingsRate >= 0) {
        savingsScore = 5 + (savingsRate / 5) * 5;
      } else {
        savingsScore = 0;
      }
    } else {
      // If no income logged yet this cycle, neutral baseline
      savingsRate = 0;
      savingsScore = 12;
    }
    savingsScore = Math.round(savingsScore);

    // ==========================================
    // PILLAR 3: Solvency & Debt Exposure (25 pts)
    // ==========================================
    const debtToAsset =
      totalAssets > 0
        ? (liabilities / totalAssets) * 100
        : liabilities > 0
          ? 100
          : 0;
    let solvencyScore = 0;
    if (liabilities === 0) {
      solvencyScore = 25;
    } else if (debtToAsset <= 10) {
      solvencyScore = 23;
    } else if (debtToAsset <= 25) {
      solvencyScore = 18 + ((25 - debtToAsset) / 15) * 5;
    } else if (debtToAsset <= 50) {
      solvencyScore = 10 + ((50 - debtToAsset) / 25) * 8;
    } else if (debtToAsset <= 75) {
      solvencyScore = 5 + ((75 - debtToAsset) / 25) * 5;
    } else {
      solvencyScore = 2;
    }
    solvencyScore = Math.round(solvencyScore);

    // ==========================================
    // PILLAR 4: Capital Growth & Deployment (25 pts)
    // ==========================================
    // Encourages having capital actively growing rather than 100% idle
    const investmentRatio =
      totalAssets > 0 ? (investments / totalAssets) * 100 : 0;

    let growthScore = 0;
    if (investmentRatio >= 30 && investmentRatio <= 85) {
      growthScore = 25; // ideal balanced portfolio
    } else if (investmentRatio > 85) {
      growthScore = 22; // very high investment, slightly aggressive on cash
    } else if (investmentRatio >= 15) {
      growthScore = 17 + ((investmentRatio - 15) / 15) * 8;
    } else if (investmentRatio > 0) {
      growthScore = 10 + (investmentRatio / 15) * 7;
    } else {
      growthScore = totalAssets > 0 ? 8 : 12; // all cash or no assets
    }
    growthScore = Math.round(growthScore);

    const totalScore = Math.min(
      100,
      Math.max(0, liquidityScore + savingsScore + solvencyScore + growthScore),
    );

    // Diagnosis & Recommendation
    let diagnosis = "Your financial health profile is balanced and resilient.";
    let badgeLabel = "Strong";
    let badgeColor = "text-primary bg-primary/10 border-primary/20";
    let gaugeColor = "#3b82f6";

    if (totalScore >= 85) {
      badgeLabel = "Elite";
      badgeColor =
        "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      gaugeColor = "#10b981";
      diagnosis =
        "Top-tier health: robust emergency reserves, minimal debt, and strong capital growth.";
    } else if (totalScore >= 70) {
      badgeLabel = "Strong";
      badgeColor =
        "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
      gaugeColor = "#6366f1";
      diagnosis =
        "Solid financial foundation. Focus on expanding investments while maintaining reserves.";
    } else if (totalScore >= 50) {
      badgeLabel = "Fair";
      badgeColor =
        "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
      gaugeColor = "#f59e0b";
      if (runwayMonths < 3) {
        diagnosis = `Liquidity is low (${runwayMonths.toFixed(1)} mo). Prioritize building a 3-month cash buffer.`;
      } else if (debtToAsset > 35) {
        diagnosis = `Debt ratio is ${debtToAsset.toFixed(0)}%. Accelerate debt paydown to boost solvency.`;
      } else {
        diagnosis =
          "Moderate resilience. Increase savings rate to build a thicker financial cushion.";
      }
    } else {
      badgeLabel = "Vulnerable";
      badgeColor =
        "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
      gaugeColor = "#ef4444";
      if (liabilities > totalAssets * 0.5) {
        diagnosis =
          "High debt load requires immediate attention. Focus on high-interest liability reduction.";
      } else {
        diagnosis =
          "Buffer is critically lean. Reduce discretionary outflow to rebuild liquid savings.";
      }
    }

    return {
      totalScore,
      badgeLabel,
      badgeColor,
      gaugeColor,
      diagnosis,
      pillars: [
        {
          id: "liquidity",
          name: "Liquidity Buffer",
          score: liquidityScore,
          max: 25,
          stat: `${runwayMonths >= 120 ? "10+ yrs" : `${runwayMonths.toFixed(1)} mo`}`,
          label: "Cash Runway",
          icon: ShieldCheck,
          color:
            runwayMonths >= 6
              ? "text-emerald-500"
              : runwayMonths >= 3
                ? "text-primary"
                : "text-amber-500",
          detail: `Liquid cash of ${formatCompact(liquidCapital)} covers ~${runwayMonths.toFixed(1)} months of average expenses (${formatCompact(avgMonthlyExpense)}/mo).`,
        },
        {
          id: "savings",
          name: "Cash Flow Velocity",
          score: savingsScore,
          max: 25,
          stat: `${savingsRate >= 0 ? "+" : ""}${savingsRate.toFixed(0)}%`,
          label: "Savings Rate",
          icon: Zap,
          color:
            savingsRate >= 20
              ? "text-emerald-500"
              : savingsRate >= 5
                ? "text-primary"
                : "text-amber-500",
          detail: `Saved ${formatCompact(Math.max(0, fiscalIncome - fiscalExpense))} of ${formatCompact(fiscalIncome)} earned this fiscal cycle.`,
        },
        {
          id: "solvency",
          name: "Debt Solvency",
          score: solvencyScore,
          max: 25,
          stat: `${debtToAsset.toFixed(0)}%`,
          label: "Debt-to-Asset",
          icon: CreditCard,
          color:
            debtToAsset <= 15
              ? "text-emerald-500"
              : debtToAsset <= 35
                ? "text-primary"
                : "text-rose-500",
          detail: `Total liabilities of ${formatCompact(liabilities)} represent ${debtToAsset.toFixed(1)}% of your total assets (${formatCompact(totalAssets)}).`,
        },
        {
          id: "growth",
          name: "Capital Growth",
          score: growthScore,
          max: 25,
          stat: `${investmentRatio.toFixed(0)}%`,
          label: "Invested Share",
          icon: TrendingUp,
          color: investmentRatio >= 25 ? "text-indigo-500" : "text-slate-400",
          detail: `${formatCompact(investments)} in appreciating holdings out of ${formatCompact(totalAssets)} total capital.`,
        },
      ],
    };
  }, [accounts, transactions, user?.monthStartDate]);

  const percentage = healthData.totalScore;
  const strokeDasharray = `${percentage}, 100`;

  return (
    <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm relative overflow-hidden group flex flex-col justify-between h-full">
      {/* Background ambient glow */}
      <div
        className="absolute top-0 right-0 -mr-20 -mt-20 size-56 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors"
        style={{ background: healthData.gaugeColor }}
      />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-[0.2em]">
                Financial Health
              </h3>
              <span
                className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${healthData.badgeColor}`}
              >
                {healthData.badgeLabel}
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              4-Pillar Capital Resilience Index
            </p>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5">
            <ShieldCheck className="size-4 text-slate-500 dark:text-slate-400" />
          </div>
        </div>

        {/* Circular Gauge & Score */}
        <div className="flex items-center gap-4 sm:gap-6 py-1">
          <div className="relative size-28 sm:size-32 shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 36 36"
              className="size-full -rotate-90 transition-all duration-1000"
            >
              {/* Background ring */}
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="2.8"
                className="text-slate-100 dark:text-white/5"
              />
              {/* Animated Progress ring */}
              <motion.circle
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke={healthData.gaugeColor}
                strokeWidth="2.8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset="0"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white"
              >
                {percentage}
              </motion.span>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                / 100
              </span>
            </div>
          </div>

          {/* Quick Context & Diagnosis */}
          <div className="space-y-2 flex-1 min-w-0">
            <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
              {healthData.diagnosis}
            </p>
            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
              <Info className="size-3 shrink-0 text-slate-400" />
              <span>Evaluated against liquidity, burn, debt & investments</span>
            </div>
          </div>
        </div>

        {/* 4 Pillars Sub-Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
          {healthData.pillars.map((pillar) => {
            const Icon = pillar.icon;
            const isExpanded = expandedPillar === pillar.id;

            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
                className="text-left bg-slate-50/70 dark:bg-white/[0.02] hover:bg-slate-100/70 dark:hover:bg-white/[0.05] p-2.5 rounded-xl border border-slate-200/50 dark:border-white/5 transition-all group/item"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`size-3.5 ${pillar.color}`} />
                    <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider truncate">
                      {pillar.name}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-slate-900 dark:text-white">
                    {pillar.score}/{pillar.max}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {pillar.stat}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    {pillar.label}
                  </span>
                </div>

                {/* Micro progress bar */}
                <div className="h-1 w-full bg-slate-200/70 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(pillar.score / pillar.max) * 100}%`,
                      backgroundColor:
                        pillar.score >= 20
                          ? "#10b981"
                          : pillar.score >= 12
                            ? "#3b82f6"
                            : "#f59e0b",
                    }}
                  />
                </div>

                {/* Expandable detail explanation */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-200/50 dark:border-white/5 leading-normal"
                    >
                      {pillar.detail}
                    </motion.p>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
