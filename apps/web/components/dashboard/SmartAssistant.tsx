"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Landmark,
  Target,
  BanknoteIcon,
} from "lucide-react";
import { formatCompact, getFiscalMonthStart } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";

interface Insight {
  id: string;
  type: "opportunity" | "warning" | "info" | "alert";
  title: string;
  description: string;
  icon: typeof Sparkles;
  cta?: string;
  color: string;
  badge?: string;
}

export function SmartAssistant() {
  const { user } = useAuth();
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const goals = useSelector((state: RootState) => state.goals.items);
  const allTransactions = useSelector(
    (state: RootState) => state.transactions.items,
  );

  const insights: Insight[] = useMemo(() => {
    const findings: Insight[] = [];

    // --- Derived Data Setup ---
    const analyticsAccounts = accounts.filter(
      (a) => !a.excludeFromAnalytics && !a.isClosed,
    );

    const liquidAccounts = analyticsAccounts.filter(
      (a) => a.type === "bank" || a.type === "cash",
    );
    const investmentAccounts = analyticsAccounts.filter(
      (a) => a.type === "investment",
    );
    const debtAccounts = analyticsAccounts.filter((a) => a.type === "debt");
    const cardAccounts = analyticsAccounts.filter((a) => a.type === "card");

    const liquidBalance = liquidAccounts.reduce(
      (s, a) => s + Math.max(0, a.balance),
      0,
    );
    const totalInvestments = investmentAccounts.reduce(
      (s, a) => s + Math.max(0, a.balance),
      0,
    );
    const totalDebts = debtAccounts.reduce(
      (s, a) => s + Math.abs(a.balance),
      0,
    );
    const totalCardDebt = cardAccounts.reduce(
      (s, a) => s + Math.max(0, Math.abs(a.balance)),
      0,
    );
    const totalLiabilities = totalDebts + totalCardDebt;
    const totalAssets = liquidBalance + totalInvestments;
    const netWorth = totalAssets - totalLiabilities;

    // --- Transactions: current fiscal month ---
    const monthStartDate = user?.monthStartDate || 1;
    const currentFiscalStart = getFiscalMonthStart(new Date(), monthStartDate);

    const confirmedTx = allTransactions.filter(
      (tx) => tx.status !== "pending_confirmation",
    );

    const currentMonthTx = confirmedTx.filter((tx) => {
      const d = new Date(tx.date);
      const end = new Date(currentFiscalStart);
      end.setMonth(end.getMonth() + 1);
      end.setMilliseconds(end.getMilliseconds() - 1);
      return d >= currentFiscalStart && d <= end;
    });

    const monthlyIncome = currentMonthTx
      .filter((tx) => tx.type === "income")
      .reduce((s, tx) => s + tx.amount, 0);
    const monthlyExpense = currentMonthTx
      .filter((tx) => tx.type === "expense")
      .reduce((s, tx) => s + tx.amount, 0);

    // Last 30 days average expense (for runway)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30DayExpenses = confirmedTx
      .filter(
        (tx) => tx.type === "expense" && new Date(tx.date) >= thirtyDaysAgo,
      )
      .reduce((s, t) => s + t.amount, 0);

    // Previous month transactions for comparison
    const prevMonthEnd = new Date(currentFiscalStart);
    prevMonthEnd.setMilliseconds(prevMonthEnd.getMilliseconds() - 1);
    const prevMonthStart = new Date(currentFiscalStart);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

    const prevMonthTx = confirmedTx.filter((tx) => {
      const d = new Date(tx.date);
      return d >= prevMonthStart && d <= prevMonthEnd;
    });
    const prevMonthExpense = prevMonthTx
      .filter((tx) => tx.type === "expense")
      .reduce((s, tx) => s + tx.amount, 0);
    const prevMonthIncome = prevMonthTx
      .filter((tx) => tx.type === "income")
      .reduce((s, tx) => s + tx.amount, 0);

    // --- Insight 1: Savings Rate ---
    if (monthlyIncome > 0) {
      const savingsRate =
        ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100;
      const saved = monthlyIncome - monthlyExpense;
      if (savingsRate >= 20) {
        findings.push({
          id: "savings-strong",
          type: "opportunity",
          title: "Strong Savings Rate",
          description: `You've saved ${formatCompact(saved)} this month — a ${savingsRate.toFixed(1)}% rate. That's above the 20% benchmark. Consider channeling the surplus into your investment portfolio.`,
          icon: Sparkles,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          badge: `${savingsRate.toFixed(1)}%`,
          cta: "Invest Surplus",
        });
      } else if (savingsRate < 10 && savingsRate >= 0) {
        findings.push({
          id: "savings-low",
          type: "warning",
          title: "Low Savings Rate",
          description: `Savings rate is only ${savingsRate.toFixed(1)}% (${formatCompact(saved)} saved). Aim for at least 20%. Try trimming ${formatCompact(monthlyExpense * 0.1)} from discretionary spend.`,
          icon: AlertCircle,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          badge: `${savingsRate.toFixed(1)}%`,
        });
      } else if (savingsRate < 0) {
        findings.push({
          id: "savings-deficit",
          type: "alert",
          title: "Spending Exceeds Income",
          description: `You've spent ${formatCompact(Math.abs(saved))} more than you earned this month. A deficit of ${(-savingsRate).toFixed(1)}% means you're drawing down reserves. Review your top expenses.`,
          icon: ShieldAlert,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          badge: "Deficit",
        });
      }
    }

    // --- Insight 2: Financial Runway (Emergency Fund) ---
    if (last30DayExpenses > 0) {
      const avgMonthlyExpense = last30DayExpenses; // 30-day sum ≈ monthly
      const runwayMonths = liquidBalance / avgMonthlyExpense;
      if (runwayMonths > 8) {
        const excessCash = liquidBalance - avgMonthlyExpense * 6;
        findings.push({
          id: "idle-capital",
          type: "opportunity",
          title: "Idle Capital Detected",
          description: `Liquid reserves cover ${runwayMonths.toFixed(1)} months of expenses. You have ~${formatCompact(excessCash)} idle beyond the 6-month safety buffer. Deploying it could generate better returns.`,
          icon: Landmark,
          color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
          badge: `${runwayMonths.toFixed(1)}mo`,
          cta: "Explore Plans",
        });
      } else if (runwayMonths < 3) {
        findings.push({
          id: "low-runway",
          type: "alert",
          title: "Emergency Fund Critical",
          description: `Liquid reserves cover only ${runwayMonths.toFixed(1)} months of expenses (${formatCompact(liquidBalance)} vs ${formatCompact(avgMonthlyExpense * 3)} needed for 3 months). Build this buffer first.`,
          icon: ShieldAlert,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          badge: `${runwayMonths.toFixed(1)}mo`,
        });
      }
    } else if (liquidBalance > 0) {
      findings.push({
        id: "no-expense-data",
        type: "info",
        title: "Log Expenses for Insights",
        description: `You have ${formatCompact(liquidBalance)} in liquid reserves. Add expense transactions to unlock runway analysis, savings rate, and spending insights.`,
        icon: Info,
        color: "text-primary bg-primary/10 border-primary/20",
        cta: "Add Transaction",
      });
    }

    // --- Insight 3: Spending Spike Detection ---
    if (prevMonthExpense > 0 && monthlyExpense > 0) {
      const spikePct =
        ((monthlyExpense - prevMonthExpense) / prevMonthExpense) * 100;
      if (spikePct > 25) {
        findings.push({
          id: "spending-spike",
          type: "warning",
          title: "Spending Spike Detected",
          description: `Expenses rose ${spikePct.toFixed(0)}% vs last month (${formatCompact(prevMonthExpense)} → ${formatCompact(monthlyExpense)}). A delta of ${formatCompact(monthlyExpense - prevMonthExpense)} warrants a category review.`,
          icon: TrendingUp,
          color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          badge: `+${spikePct.toFixed(0)}%`,
        });
      } else if (spikePct < -15) {
        findings.push({
          id: "spending-drop",
          type: "opportunity",
          title: "Disciplined Spending",
          description: `Expenses dropped ${Math.abs(spikePct).toFixed(0)}% vs last month, saving ${formatCompact(prevMonthExpense - monthlyExpense)} extra. This momentum builds long-term wealth.`,
          icon: TrendingDown,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          badge: `${spikePct.toFixed(0)}%`,
        });
      }
    }

    // --- Insight 4: Goal Pacing ---
    const behindGoals = goals.filter((g) => {
      if (!g.startDate || !g.targetDate) return false;
      const start = new Date(g.startDate);
      const target = new Date(g.targetDate);
      const now = new Date();
      if (now >= target) return false;
      const elapsed = Math.max(0, now.getTime() - start.getTime());
      const total = Math.max(1, target.getTime() - start.getTime());
      const timeProgress = elapsed / total;
      const amountProgress = g.currentAmount / Math.max(1, g.targetAmount);
      return amountProgress < timeProgress * 0.85; // >15% behind schedule
    });

    if (behindGoals.length > 0 && behindGoals[0]) {
      const g = behindGoals[0];
      const start = new Date(g.startDate!);
      const target = new Date(g.targetDate);
      const now = new Date();
      const elapsed = Math.max(0, now.getTime() - start.getTime());
      const total = Math.max(1, target.getTime() - start.getTime());
      const timeProgress = elapsed / total;
      const expectedAmount = g.targetAmount * timeProgress;
      const deficit = Math.max(0, expectedAmount - g.currentAmount);
      const monthsLeft = Math.max(
        1,
        Math.ceil((target.getTime() - now.getTime()) / (30 * 24 * 3600 * 1000)),
      );
      const catchUp = deficit / monthsLeft;

      findings.push({
        id: "goal-drift",
        type: "warning",
        title: "Goal Falling Behind",
        description: `"${g.name}" is ${((1 - g.currentAmount / Math.max(1, expectedAmount)) * 100).toFixed(0)}% behind schedule. Deficit: ${formatCompact(deficit)}. Add ${formatCompact(catchUp)}/mo to get back on track before ${target.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}.`,
        icon: Target,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        badge: `${behindGoals.length} Goal${behindGoals.length > 1 ? "s" : ""}`,
        cta: "View Goal",
      });
    }

    // --- Insight 5: Investment Performance ---
    if (investmentAccounts.length > 0) {
      const totalInvested = investmentAccounts.reduce((s, a) => {
        const cost =
          a.investedAmount && a.investedAmount > 0
            ? a.investedAmount
            : a.initialAmount && a.initialAmount > 0
              ? a.initialAmount
              : a.balance;
        return s + cost;
      }, 0);
      const gain = totalInvestments - totalInvested;
      const gainPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

      if (gainPct > 12) {
        findings.push({
          id: "inv-outperform",
          type: "opportunity",
          title: "Portfolio Outperforming",
          description: `Investments are up ${gainPct.toFixed(1)}% (${gain >= 0 ? "+" : ""}${formatCompact(gain)} on ${formatCompact(totalInvested)} invested). Consider partial profit-booking or rebalancing if concentration is high.`,
          icon: TrendingUp,
          color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
          badge: `+${gainPct.toFixed(1)}%`,
        });
      } else if (gainPct < -10) {
        findings.push({
          id: "inv-underperform",
          type: "warning",
          title: "Portfolio Under Pressure",
          description: `Investments are down ${Math.abs(gainPct).toFixed(1)}% (${formatCompact(gain)} unrealized loss on ${formatCompact(totalInvested)} cost). Long-term positions may warrant review.`,
          icon: TrendingDown,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          badge: `${gainPct.toFixed(1)}%`,
        });
      }
    }

    // --- Insight 6: Debt-to-Asset Ratio ---
    if (totalLiabilities > 0 && totalAssets > 0) {
      const dtiRatio = totalLiabilities / totalAssets;
      if (dtiRatio > 0.5) {
        findings.push({
          id: "high-debt",
          type: "alert",
          title: "High Debt Exposure",
          description: `Liabilities (${formatCompact(totalLiabilities)}) are ${(dtiRatio * 100).toFixed(0)}% of your assets (${formatCompact(totalAssets)}). A ratio above 50% increases financial fragility. Prioritize debt reduction.`,
          icon: BanknoteIcon,
          color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          badge: `${(dtiRatio * 100).toFixed(0)}% DTI`,
        });
      }
    }

    // --- Insight 7: Income trend ---
    if (prevMonthIncome > 0 && monthlyIncome > 0) {
      const incomeChange =
        ((monthlyIncome - prevMonthIncome) / prevMonthIncome) * 100;
      if (incomeChange > 20) {
        findings.push({
          id: "income-spike",
          type: "info",
          title: "Income Boost Detected",
          description: `Income rose ${incomeChange.toFixed(0)}% vs last month (+${formatCompact(monthlyIncome - prevMonthIncome)}). If recurring, consider revising savings targets upward.`,
          icon: TrendingUp,
          color: "text-primary bg-primary/10 border-primary/20",
          badge: `+${incomeChange.toFixed(0)}%`,
        });
      }
    }

    // --- Fallback: Healthy State ---
    if (findings.length === 0) {
      findings.push({
        id: "healthy",
        type: "info",
        title: netWorth > 0 ? "Finances Look Healthy" : "Getting Started",
        description:
          netWorth > 0
            ? `Net worth is ${formatCompact(netWorth)} with ${analyticsAccounts.length} active accounts. Keep logging transactions regularly to unlock deeper insights.`
            : "Add accounts and log transactions to get personalized AI-driven insights on your financial health.",
        icon: Info,
        color: "text-primary bg-primary/10 border-primary/20",
      });
    }

    return findings.slice(0, 5); // Max 5 insights
  }, [accounts, goals, allTransactions, user?.monthStartDate]);

  const typeOrder = { alert: 0, warning: 1, opportunity: 2, info: 3 };
  const sortedInsights = [...insights].sort(
    (a, b) => typeOrder[a.type] - typeOrder[b.type],
  );

  return (
    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 p-5 rounded-[2rem] shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Smart Assistant
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            Live Analysis
          </span>
        </div>
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="popLayout">
          {sortedInsights.map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`p-3.5 rounded-2xl border ${insight.color} space-y-2`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <insight.icon className="size-3.5 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest truncate">
                    {insight.title}
                  </span>
                </div>
                {insight.badge && (
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/50 dark:bg-black/20 border border-current/20 shrink-0">
                    {insight.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                {insight.description}
              </p>
              {insight.cta && (
                <button className="text-[8px] font-black uppercase tracking-[0.15em] py-1.5 px-3 rounded-lg bg-white dark:bg-slate-950 shadow-sm border border-slate-100 dark:border-white/5 hover:scale-105 transition-all active:scale-95">
                  {insight.cta} →
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
          {insights.length} insight{insights.length !== 1 ? "s" : ""} detected
        </span>
        <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
          Real-time data
        </span>
      </div>
    </div>
  );
}
