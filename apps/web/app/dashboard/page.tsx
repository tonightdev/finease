"use client";

import { useState, useMemo, useEffect } from "react";
import { NetWorthChart } from "@/components/dashboard/NetWorthChart";
import { AssetAllocationDonut } from "@/components/dashboard/AssetLiabilityDonut";
import { GoalProgressCard } from "@/components/dashboard/GoalProgressCard";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { AccountList } from "@/components/accounts/AccountList";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { createAccount, fetchAccounts } from "@/store/slices/accountsSlice";
import { fetchAssetClasses } from "@/store/slices/assetClassesSlice";
import { fetchTransactions } from "@/store/slices/transactionsSlice";
import { fetchGoals } from "@/store/slices/goalsSlice";
import { fetchReminders } from "@/store/slices/remindersSlice";
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { FinancialGoal, AccountType } from "@repo/types";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { Plus, Target as TargetIcon, AlertTriangle, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/ui/PageContainer";
import { useSignals } from "@/components/providers/SignalProvider";
import { Button } from "@/components/ui/Button";
import { FeatureTour } from "@/components/ui/FeatureTour";
import { motion } from "framer-motion";
import { getHexFromTailwind, getFiscalMonthStart } from "@/lib/utils";


export default function Home() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { permission, requestPermission } = useSignals();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const allAccounts = useSelector((state: RootState) => state.accounts.items);
  // Accounts used for analytics/stats (excludes those marked as excluded)
  const analyticsAccounts = useMemo(() => allAccounts.filter(a => !a.excludeFromAnalytics), [allAccounts]);

  const goals = useSelector((state: RootState) => state.goals.items);
  const assetClasses = useSelector((state: RootState) => state.assetClasses.items);
  const stats = useSelector((state: RootState) => state.stats.data);
  const allTransactions = useSelector(
    (state: RootState) => state.transactions.items,
  );

  const transactions = useMemo(() => {
    const includedAccountIds = new Set(analyticsAccounts.map(a => a.id));
    return allTransactions.filter(tx => includedAccountIds.has(tx.accountId));
  }, [allTransactions, analyticsAccounts]);

  const loading = useSelector(
    (state: RootState) => state.accounts.loading || state.transactions.loading || state.reminders.loading,
  );

  const reminders = useSelector((state: RootState) => state.reminders.items);

  const expiringSoon = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return reminders.filter(r => {
      const expiry = new Date(r.expiryDate);
      return expiry > now && expiry <= thirtyDaysFromNow;
    });
  }, [reminders]);

  useEffect(() => {
    if (user) {
      dispatch(fetchAccounts({ force: true }));
      dispatch(fetchAssetClasses({ force: true }));
      dispatch(fetchTransactions({ force: true }));
      dispatch(fetchGoals({ force: true }));
      dispatch(fetchReminders());

      if (permission === "default") {
        requestPermission();
      }
    }
  }, [dispatch, user, permission, requestPermission]);

  // Regular accounts for display (includes excluded ones)
  const displayRegularAccounts = useMemo(() => {
    const filtered = allAccounts.filter(
      (acc) => acc.type === "bank" || acc.type === "cash" || acc.type === "card",
    );
    const order: Record<string, number> = { bank: 0, cash: 1, card: 2 };
    return [...filtered].sort((a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9));
  }, [allAccounts]);

  // Regular accounts for analytics (excludes excluded ones)
  const analyticsRegularAccounts = useMemo(() =>
    displayRegularAccounts.filter(a => !a.excludeFromAnalytics),
    [displayRegularAccounts]
  );

  const analyticsCards = useMemo(() => analyticsAccounts.filter(acc => acc.type === 'card'), [analyticsAccounts]);

  const analyticsInvestmentAccounts = analyticsAccounts.filter(
    (acc) => acc.type === "investment",
  );
  const analyticsDebts = analyticsAccounts.filter((acc) => acc.type === "debt");

  const assets = useMemo(() => {
    const liquid = analyticsRegularAccounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0);
    const invested = analyticsInvestmentAccounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0);
    const others = analyticsAccounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + Math.max(0, a.balance), 0);
    return liquid + invested + others;
  }, [analyticsRegularAccounts, analyticsInvestmentAccounts, analyticsAccounts]);

  const liabilities = useMemo(() => {
    const debtSum = analyticsDebts.reduce((sum, a) => sum + Math.max(0, Math.abs(a.balance)), 0);
    const cardSum = analyticsCards.reduce((sum, a) => sum + Math.max(0, Math.abs(a.balance)), 0);
    return debtSum + cardSum;
  }, [analyticsDebts, analyticsCards]);

  const realTimeNetWorth = assets - liabilities;

  const allocationMap = useMemo(() => {
    const assetsMap: Record<string, { value: number; type: "asset" }> = {};
    const liabilitiesMap: Record<string, { value: number; type: "liability" }> = {};

    // Assets
    analyticsInvestmentAccounts.forEach((inv) => {
      assetsMap[inv.assetType || "Other"] = {
        value: (assetsMap[inv.assetType || "Other"]?.value || 0) + inv.balance,
        type: "asset",
      };
    });

    analyticsRegularAccounts
      .filter((a) => a.type !== "card")
      .forEach((acc) => {
        const label = acc.type === "bank" ? "Bank" : "Cash";
        assetsMap[label] = {
          value: (assetsMap[label]?.value || 0) + acc.balance,
          type: "asset",
        };
      });

    // Liabilities
    analyticsCards.forEach((card) => {
      liabilitiesMap["Cards"] = {
        value: (liabilitiesMap["Cards"]?.value || 0) + Math.abs(card.balance),
        type: "liability",
      };
    });

    return { assets: assetsMap, liabilities: liabilitiesMap };
  }, [analyticsInvestmentAccounts, analyticsRegularAccounts, analyticsCards]);

  const realTimeAssetAllocation = useMemo(() => {
    const defaultColors: Record<string, string> = {
      Bank: "#3b82f6",
      Cash: "#10b981",
      Cards: "#f43f5e", // Liability color
      Debts: "#fb7185", // Liability color
      Other: "#94a3b8",
    };

    const fallbackPalette = [
      "#6366f1", "#ec4899", "#8b5cf6", "#06b6d4",
      "#f43f5e", "#10b981", "#f59e0b", "#3b82f6"
    ];

    const assets = Object.entries(allocationMap.assets).map(([id, data], index) => {
      const assetClass = assetClasses.find((a) => a.id === id);
      const rawColor = assetClass?.color || defaultColors[id] || fallbackPalette[index % fallbackPalette.length] || "#94a3b8";
      return {
        name: assetClass?.name || id,
        value: data.value,
        color: getHexFromTailwind(rawColor as string),
        type: data.type,
      };
    });

    const liabilities = Object.entries(allocationMap.liabilities).map(([id, data]) => {
      return {
        name: id,
        value: data.value,
        color: defaultColors[id] || "#f43f5e",
        type: data.type,
      };
    });

    return [...assets, ...liabilities].filter(item => item.value > 0).sort((a, b) => b.value - a.value);
  }, [allocationMap, assetClasses]);

  const computedNetWorthHistory = useMemo(() => {
    const history: { month: string; value: number; dateObj: Date }[] = [];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const now = new Date();

    const monthStartDate = user?.monthStartDate || 1;

    for (let i = 0; i < 6; i++) {
      const d = getFiscalMonthStart(now, monthStartDate);
      d.setMonth(d.getMonth() - i);
      history.unshift({
        month: `${months[d.getMonth()]}`,
        value: 0,
        dateObj: d,
      });
    }

    let runningNW = realTimeNetWorth;
    if (history[5]) history[5].value = runningNW;

    for (let i = 4; i >= 0; i--) {
      const nextMonthData = history[i + 1]!;
      const nextMonth = nextMonthData.dateObj;

      const txInNextMonth = transactions.filter((tx) => {
        if (tx.status === "pending_confirmation") return false;
        const txDate = new Date(tx.date);
        return (
          txDate.getTime() >= nextMonth.getTime()
        );
      });

      const netFlowNextMonth = txInNextMonth.reduce((acc, tx) => {
        return acc + (tx.type === "income" ? tx.amount : -tx.amount);
      }, 0);

      runningNW = runningNW - netFlowNextMonth;
      const historyItem = history[i];
      if (historyItem) historyItem.value = runningNW;
    }

    return history.map((h) => ({
      month: h.month,
      value: h.value > 0 ? h.value : 0,
    }));
  }, [transactions, realTimeNetWorth, user?.monthStartDate]);

  const netWorthChange = useMemo(() => {
    if (computedNetWorthHistory.length < 2) return 0;
    const last =
      computedNetWorthHistory[computedNetWorthHistory.length - 1]?.value || 0;
    const prev =
      computedNetWorthHistory[computedNetWorthHistory.length - 2]?.value || 0;
    if (prev === 0) return last > 0 ? 100 : 0;
    return parseFloat((((last - prev) / prev) * 100).toFixed(1));
  }, [computedNetWorthHistory]);

  const insights = useMemo(() => {
    const monthStartDate = user?.monthStartDate || 1;
    const currentFiscalStart = getFiscalMonthStart(new Date(), monthStartDate);

    const last30Days = transactions.filter((tx) => {
      if (tx.status === "pending_confirmation") return false;
      const d = new Date(tx.date);
      return d >= currentFiscalStart;
    });

    const monthlyIncome = last30Days
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyExpense = last30Days
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const avgExpense = monthlyExpense || assets * 0.05 || 1;
    const runwayMonths = (assets / avgExpense).toFixed(1);

    const runwayScore = Math.min(50, (parseFloat(runwayMonths) / 24) * 50);
    const savingsRate =
      monthlyIncome > 0 ? (monthlyIncome - monthlyExpense) / monthlyIncome : 0;
    const savingsScore = Math.min(25, savingsRate * 100);
    const goalScore =
      goals.length > 0
        ? (goals.reduce((sum, g) => sum + g.currentAmount / g.targetAmount, 0) /
          goals.length) *
        25
        : 0;

    const freedomScore = (runwayScore + savingsScore + goalScore).toFixed(1);

    let status = "Stabilizing";
    const scoreVal = parseFloat(freedomScore);
    if (scoreVal > 80) status = "Excellent";
    else if (scoreVal > 60) status = "Strong";
    else if (scoreVal > 40) status = "Moderate";

    const incompleteGoal = goals.find((g) => g.currentAmount < g.targetAmount);
    const suggestion = incompleteGoal
      ? `Increasing saving rate by 5% reaches "${incompleteGoal.name}" approx. ${Math.ceil((incompleteGoal.targetAmount - incompleteGoal.currentAmount) / (avgExpense * 0.05))} days faster.`
      : "You've reached all your primary goals!";

    return {
      runwayMonths,
      freedomScore,
      status,
      suggestion,
      savingsRate: (savingsRate * 100).toFixed(0),
      monthlyIncome,
      monthlyExpense,
      liquidCapital: analyticsRegularAccounts.filter(a => a.type !== 'card').reduce((sum, a) => sum + a.balance, 0)
    };
  }, [transactions, assets, goals, analyticsRegularAccounts, user?.monthStartDate]);

  if (loading && allAccounts.length === 0) {
    return (
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pt-4 pb-2 space-y-6 lg:space-y-8 animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="space-y-3 shadow-none border-slate-100 dark:border-slate-800"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <FeatureTour />
      <PageHeader
        title="Command Center"
        subtitle="Unified wealth landscape"
        actions={
          <div className="flex w-full sm:w-auto gap-2">
            <Button
              size="sm"
              onClick={() => setIsAccountModalOpen(true)}
              className="flex-1 sm:flex-initial"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Account
            </Button>
          </div>
        }
      />
      
      {expiringSoon.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full"
        >
          <Link href="/goals" className="block">
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between group hover:bg-rose-500/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight">
                    {expiringSoon.length} Signal Horizon{expiringSoon.length > 1 ? 's' : ''} require{expiringSoon.length === 1 ? 's' : ''} immediate attention
                  </h4>
                  <p className="text-[10px] font-bold text-rose-500/70 uppercase tracking-widest">
                    Impending expiry detected within 30-day window
                  </p>
                </div>
              </div>
              <ArrowRight className="size-5 text-rose-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <DashboardStatCard
          label="Net Worth"
          subtitle="Total assets minus debt"
          value={realTimeNetWorth}
          trend={{
            label: `${netWorthChange >= 0 ? "+" : ""}${netWorthChange}%`,
            color: "bg-emerald-500",
            showPulse: true,
          }}
        />

        <DashboardStatCard
          label="Period Inflow"
          subtitle="Total 30-day income"
          value={insights.monthlyIncome}
          valueColor="text-emerald-500"
          trend={{
            label: `${insights.savingsRate}% Savings Rate`,
            color: parseFloat(insights.savingsRate) >= 0 ? "bg-emerald-500" : "bg-rose-500",
            showPulse: true,
          }}
        />

        <DashboardStatCard
          label="Period Outflow"
          subtitle="Total period spending"
          value={insights.monthlyExpense}
          valueColor="text-rose-500"
          trend={{
            label: "Efficiency 100%",
            color: "bg-rose-500",
          }}
        />

        <DashboardStatCard
          label="Liquid Capital"
          subtitle="Bank & Cash reserves"
          value={insights.liquidCapital}
          valueColor="text-primary"
          trend={{
            label: "Fluid Assets",
            color: "bg-primary",
            showPulse: true,
          }}
        />
      </div>

      <div className="space-y-2">
        {allAccounts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border border-slate-100 dark:border-white/5 shadow-sm mx-4 sm:mx-0">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-700">
                account_balance
              </span>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                No accounts configured
              </p>
              <Button size="sm" onClick={() => setIsAccountModalOpen(true)}>
                Add your first account
              </Button>
            </div>
          </div>
        ) : (
          <>
            {displayRegularAccounts.length > 0 && (
              <div className="space-y-3">
                <div className="bg-slate-50 dark:bg-white/5 -mx-4 px-4 py-1.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Liquid Capital
                  </h3>
                  <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded tracking-[0.1em]">
                    {displayRegularAccounts.length} Units
                  </span>
                </div>
                <div className="pt-1">
                  <AccountList accounts={displayRegularAccounts} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:items-stretch">
        <AssetAllocationDonut
          data={
            realTimeAssetAllocation.length > 0
              ? realTimeAssetAllocation
              : stats?.assetAllocation || []
          }
        />

        <div className="space-y-4 flex flex-col">
          <div className="flex items-center justify-between px-1 group">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              Goal Velocity
              <span className="text-[7px] font-medium normal-case tracking-normal text-slate-400">Pacing towards milestones</span>
            </h3>
            <Link
              href="/goals"
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-colors"
            >
              View Map
            </Link>
          </div>

          <div className="space-y-4 lg:space-y-6">
            {goals.length === 0 ? (
              <div className="h-full p-6 sm:p-10 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3">
                <TargetIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 opacity-50" />
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                  No goals defined
                </p>
              </div>
            ) : (
              goals.slice(0, 3).map((goal: FinancialGoal) => {
                const pace = stats?.goalPacing.find(
                  (pByGoal) => pByGoal.goalId === goal.id,
                );
                return (
                  <GoalProgressCard
                    key={goal.id}
                    name={goal.name}
                    targetAmount={goal.targetAmount}
                    currentAmount={goal.currentAmount}
                    percentageSaved={pace?.actualPercentage || 0}
                    expectedPercentage={pace?.expectedPercentage || 0}
                  />
                );
              })
            )}
          </div>
        </div>

        <Card className="bg-slate-900 border-none relative overflow-hidden group shadow-2xl shadow-indigo-500/10 transition-transform active:scale-[0.98] min-h-[300px] flex flex-col justify-center">
          <div className="relative z-10">
            <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-2 leading-none">
              Portfolio Insights
            </div>
            <h4 className="text-white font-black text-xl mb-3 tracking-tight">
              Financial Freedom Score
            </h4>
            <div className="flex items-end gap-3 mb-5">
              <span className="text-5xl font-black text-white leading-none tracking-tighter">
                {insights.freedomScore}
              </span>
              <span
                className={`${insights.status === "Excellent" ? "text-emerald-500" : "text-primary"} font-bold text-xs mb-1.5 uppercase tracking-widest`}
              >
                {insights.status}
              </span>
            </div>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Assets cover{" "}
              <span className="text-white font-bold tracking-tight">
                {insights.runwayMonths} months
              </span>{" "}
              of expenses.
              {insights.suggestion}
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/30 transition-all duration-700" />
        </Card>
      </div>

      <div>
        <NetWorthChart
          data={computedNetWorthHistory}
          currentNetWorth={realTimeNetWorth}
          percentageChange={netWorthChange}
        />
      </div>




      <AddAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={async (data) => {
          await dispatch(
            createAccount({
              name: data.name,
              type: data.type as AccountType,
              assetType: "",
              balance: parseFloat(data.balance) || 0,
              minimumBalance: parseFloat(data.minimumBalance || "0") || 0,
              maxLimit: parseFloat(data.maxLimit || "0") || 0,
              currency: "INR",
              excludeFromAnalytics: data.excludeFromAnalytics,
            }),
          ).unwrap();
        }}
      />
    </PageContainer>
  );
}
