"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Card } from "@/components/ui/Card";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Zap,
  Sparkles,
} from "lucide-react";
import { formatCompact } from "@/lib/utils";

export function CapitalResilienceCard() {
  const accounts = useSelector((state: RootState) => state.accounts.items);

  const metrics = useMemo(() => {
    const active = accounts.filter(
      (a) => !a.excludeFromAnalytics && !a.isClosed,
    );

    const liquid = active
      .filter((a) => a.type === "bank" || a.type === "cash")
      .reduce((s, a) => s + Math.max(0, a.balance), 0);

    const investments = active
      .filter((a) => a.type === "investment")
      .reduce((s, a) => s + Math.max(0, a.balance), 0);

    const otherAssets = active
      .filter((a) => a.type === "asset")
      .reduce((s, a) => s + Math.max(0, a.balance), 0);

    const cardDebt = active
      .filter((a) => a.type === "card")
      .reduce((s, a) => s + Math.abs(a.balance), 0);

    const fixedDebt = active
      .filter((a) => a.type === "debt")
      .reduce((s, a) => s + Math.abs(a.balance), 0);

    const totalAssets = liquid + investments + otherAssets;
    const totalLiabilities = cardDebt + fixedDebt;
    const netWorth = Math.max(0, totalAssets - totalLiabilities);

    // Working Capital Surplus = Liquid Cash - Card Debt
    const netWorkingCapital = liquid - cardDebt;

    // Asset Coverage Multiplier: Assets / Liabilities
    const coverageRatio =
      totalLiabilities > 0 ? totalAssets / totalLiabilities : null;

    // Percentages
    const liquidPct = totalAssets > 0 ? (liquid / totalAssets) * 100 : 0;
    const investPct = totalAssets > 0 ? (investments / totalAssets) * 100 : 0;
    const otherAssetsPct =
      totalAssets > 0 ? (otherAssets / totalAssets) * 100 : 0;
    const debtToAsset =
      totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const unencumberedPct =
      totalAssets > 0 ? (netWorth / totalAssets) * 100 : 100;

    // Strategic Assessment
    let strategicNote = "";
    if (totalLiabilities === 0 && liquidPct > 30) {
      strategicNote = `High cash buffer (${liquidPct.toFixed(0)}%). Consider deploying idle capital into investments to compound faster.`;
    } else if (totalLiabilities === 0) {
      strategicNote = `100% debt-free. ${investPct.toFixed(0)}% is productive compounding capital with strong liquid reserves.`;
    } else if (cardDebt > 0 && liquid >= cardDebt) {
      strategicNote = `You hold ${formatCompact(cardDebt)} in card balances. Clearing them from liquid reserves saves interest drag.`;
    } else if (debtToAsset > 40) {
      strategicNote = `Leverage is elevated at ${debtToAsset.toFixed(0)}% debt-to-assets. Prioritize paying down liabilities.`;
    } else {
      strategicNote = `Resilient balance sheet: ${coverageRatio ? coverageRatio.toFixed(1) + "x" : "Strong"} asset backing with modest debt exposure.`;
    }

    return {
      liquid,
      investments,
      otherAssets,
      cardDebt,
      fixedDebt,
      totalAssets,
      totalLiabilities,
      netWorth,
      netWorkingCapital,
      coverageRatio,
      liquidPct,
      investPct,
      otherAssetsPct,
      debtToAsset,
      unencumberedPct,
      strategicNote,
    };
  }, [accounts]);

  return (
    <Card
      title="Capital Structure"
      subtitle="Capital deployment, leverage & balance sheet resilience"
      className="flex flex-col h-full shadow-none border-slate-100 dark:border-slate-800 p-4 sm:p-5"
    >
      <div className="flex flex-col justify-between flex-1 space-y-4 pt-1">
        {/* Coverage & Unencumbered Equity Banner */}
        <div className="bg-gradient-to-r from-slate-50 via-indigo-50/20 to-emerald-50/20 dark:from-white/[0.02] dark:via-indigo-950/20 dark:to-emerald-950/20 rounded-2xl p-3.5 border border-slate-200/60 dark:border-white/5 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Balance Sheet Health
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {metrics.unencumberedPct.toFixed(0)}% Owned Outright
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.coverageRatio !== null
                ? `${metrics.coverageRatio.toFixed(1)}x Assets vs Debt`
                : "100% Debt-Free · Unencumbered"}
            </div>
            <p className="text-[9px] font-bold text-slate-500 truncate max-w-sm">
              {metrics.totalLiabilities > 0
                ? `Every ₹1 of debt is protected by ₹${metrics.coverageRatio?.toFixed(1)} in total assets`
                : "Zero debt claims against your wealth ecosystem"}
            </p>
          </div>
          <div className="size-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-500">
            <ShieldCheck className="size-5" />
          </div>
        </div>

        {/* 4 Strategic Pillars Breakdown */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Growth Engine: Investments */}
          <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest">
                Growth Engine
              </span>
              <TrendingUp className="size-3 text-indigo-500" />
            </div>
            <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 tracking-tight truncate">
              {formatCompact(metrics.investments)}
            </div>
            <div className="text-[8px] font-bold text-slate-500 truncate">
              {metrics.investPct.toFixed(0)}% of productive capital
            </div>
          </div>

          {/* Defensive Reserves: Liquid Cash */}
          <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest">
                Defensive Cash
              </span>
              <Wallet className="size-3 text-emerald-500" />
            </div>
            <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
              {formatCompact(metrics.liquid)}
            </div>
            <div className="text-[8px] font-bold text-slate-500 truncate">
              {metrics.liquidPct.toFixed(0)}% liquid liquidity
            </div>
          </div>

          {/* Working Capital Surplus */}
          <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest">
                Working Capital
              </span>
              <Zap className="size-3 text-amber-500" />
            </div>
            <div
              className={`text-sm sm:text-base font-black tracking-tight truncate ${
                metrics.netWorkingCapital >= 0
                  ? "text-slate-900 dark:text-white"
                  : "text-rose-500"
              }`}
            >
              {formatCompact(metrics.netWorkingCapital)}
            </div>
            <div className="text-[8px] font-bold text-slate-500 truncate">
              Cash minus revolving cards
            </div>
          </div>

          {/* Total Liabilities & Leverage */}
          <div className="bg-slate-50/70 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-200/50 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest">
                Total Debt
              </span>
              <CreditCard className="size-3 text-rose-500" />
            </div>
            <div
              className={`text-sm sm:text-base font-black tracking-tight truncate ${
                metrics.totalLiabilities > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {formatCompact(metrics.totalLiabilities)}
            </div>
            <div className="text-[8px] font-bold text-slate-500 truncate">
              {metrics.debtToAsset.toFixed(1)}% leverage on assets
            </div>
          </div>
        </div>

        {/* Strategic Allocation Advice Pill */}
        <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-start gap-2 text-[10px]">
          <Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
            {metrics.strategicNote}
          </p>
        </div>
      </div>
    </Card>
  );
}
