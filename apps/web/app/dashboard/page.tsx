"use client";

import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NetWorthChart } from "@/components/dashboard/NetWorthChart";
import { AssetAllocationDonut } from "@/components/dashboard/AssetLiabilityDonut";
import { GoalProgressCard } from "@/components/dashboard/GoalProgressCard";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { WealthIndex } from "@/components/dashboard/WealthIndex";
import { SmartAssistant } from "@/components/dashboard/SmartAssistant";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchAccounts, fetchSnapshots } from "@/store/slices/accountsSlice";
import { fetchAssetClasses } from "@/store/slices/assetClassesSlice";
import { fetchTransactions } from "@/store/slices/transactionsSlice";
import { fetchGoals } from "@/store/slices/goalsSlice";
import { fetchExpiries } from "@/store/slices/expiriesSlice";
import { openModal } from "@/store/slices/uiSlice";
import { FinancialGoal } from "@repo/types";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Target as TargetIcon,
  AlertTriangle,
  ArrowRight,
  Landmark,
  Sparkles,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/ui/PageContainer";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { Button } from "@/components/ui/Button";
import { FeatureTour } from "@/components/ui/FeatureTour";
import { motion } from "framer-motion";
import { getHexFromTailwind, getFiscalMonthStart } from "@/lib/utils";
import { MonthlyGrowthDebrief } from "@/components/dashboard/MonthlyGrowthDebrief";
import { LiquidCapitalCard } from "@/components/dashboard/LiquidCapitalCard";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { permission, requestPermission } = useNotifications();

  const allAccounts = useSelector((state: RootState) => state.accounts.items);
  // Accounts used for analytics/stats (excludes those marked as excluded)
  const analyticsAccounts = useMemo(
    () => allAccounts.filter((a) => !a.excludeFromAnalytics && !a.isClosed),
    [allAccounts],
  );

  const goals = useSelector((state: RootState) => state.goals.items);
  const assetClasses = useSelector(
    (state: RootState) => state.assetClasses.items,
  );
  const allTransactions = useSelector(
    (state: RootState) => state.transactions.items,
  );

  const transactions = useMemo(() => {
    const includedAccountIds = new Set(analyticsAccounts.map((a) => a.id));
    return allTransactions.filter((tx) => includedAccountIds.has(tx.accountId));
  }, [allTransactions, analyticsAccounts]);

  const loading = useSelector(
    (state: RootState) =>
      state.accounts.loading ||
      state.transactions.loading ||
      state.expiries.loading,
  );

  const expiries = useSelector((state: RootState) => state.expiries.items);
  const snapshots = useSelector(
    (state: RootState) => state.accounts.snapshots || [],
  );

  const expiringSoon = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return expiries.filter((r) => {
      const expiry = new Date(r.expiryDate);
      return expiry > now && expiry <= sevenDaysFromNow;
    });
  }, [expiries]);

  useEffect(() => {
    if (user) {
      dispatch(fetchAccounts());
      dispatch(fetchSnapshots(12));
      dispatch(fetchAssetClasses());
      dispatch(fetchTransactions());
      dispatch(fetchGoals());
      dispatch(fetchExpiries());

      if (permission === "default") {
        requestPermission();
      }
    }
  }, [dispatch, user, permission, requestPermission]);

  // Regular accounts for display (includes excluded ones)
  const displayRegularAccounts = useMemo(() => {
    const filtered = allAccounts.filter(
      (acc) =>
        !acc.isClosed &&
        (acc.type === "bank" || acc.type === "cash" || acc.type === "card"),
    );
    const order: Record<string, number> = { bank: 0, cash: 1, card: 2 };
    return [...filtered].sort(
      (a, b) => (order[a.type] ?? 9) - (order[b.type] ?? 9),
    );
  }, [allAccounts]);

  // Regular accounts for analytics (excludes excluded ones)
  const analyticsRegularAccounts = useMemo(
    () => displayRegularAccounts.filter((a) => !a.excludeFromAnalytics),
    [displayRegularAccounts],
  );

  const analyticsCards = useMemo(
    () => analyticsAccounts.filter((acc) => acc.type === "card"),
    [analyticsAccounts],
  );

  const analyticsInvestmentAccounts = analyticsAccounts.filter(
    (acc) => acc.type === "investment",
  );
  const analyticsDebts = analyticsAccounts.filter((acc) => acc.type === "debt");

  const assets = useMemo(() => {
    const liquid = analyticsRegularAccounts.reduce(
      (sum, a) => sum + Math.max(0, a.balance),
      0,
    );
    const invested = analyticsInvestmentAccounts.reduce(
      (sum, a) => sum + Math.max(0, a.balance),
      0,
    );
    const others = analyticsAccounts
      .filter((a) => a.type === "asset")
      .reduce((sum, a) => sum + Math.max(0, a.balance), 0);
    return liquid + invested + others;
  }, [
    analyticsRegularAccounts,
    analyticsInvestmentAccounts,
    analyticsAccounts,
  ]);

  const liabilities = useMemo(() => {
    const debtSum = analyticsDebts.reduce(
      (sum, a) => sum + Math.max(0, Math.abs(a.balance)),
      0,
    );
    const cardSum = analyticsCards.reduce(
      (sum, a) => sum + Math.max(0, Math.abs(a.balance)),
      0,
    );
    return debtSum + cardSum;
  }, [analyticsDebts, analyticsCards]);

  const realTimeNetWorth = assets - liabilities;

  const totalInvestments = useMemo(() => {
    return analyticsInvestmentAccounts.reduce(
      (sum, a) => sum + Math.max(0, a.balance),
      0,
    );
  }, [analyticsInvestmentAccounts]);

  const totalInvestedCapital = useMemo(() => {
    return analyticsInvestmentAccounts.reduce((sum, a) => {
      const invested =
        a.investedAmount && a.investedAmount > 0
          ? a.investedAmount
          : a.initialAmount && a.initialAmount > 0
            ? a.initialAmount
            : a.valuationAdjustment
              ? a.balance - a.valuationAdjustment
              : a.balance;
      return sum + invested;
    }, 0);
  }, [analyticsInvestmentAccounts]);

  const investmentGain = totalInvestments - totalInvestedCapital;
  const investmentYieldPct =
    totalInvestedCapital > 0 ? (investmentGain / totalInvestedCapital) * 100 : 0;

  const activeDebtsCount =
    analyticsDebts.length + analyticsCards.filter((c) => c.balance !== 0).length;

  const allocationMap = useMemo(() => {
    const assetsMap: Record<string, { value: number; type: "asset" }> = {};
    const liabilitiesMap: Record<string, { value: number; type: "liability" }> =
      {};

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
      "#6366f1",
      "#ec4899",
      "#8b5cf6",
      "#06b6d4",
      "#f43f5e",
      "#10b981",
      "#f59e0b",
      "#3b82f6",
    ];

    const assets = Object.entries(allocationMap.assets).map(
      ([id, data], index) => {
        const assetClass = assetClasses.find((a) => a.id === id);
        const rawColor =
          assetClass?.color ||
          defaultColors[id] ||
          fallbackPalette[index % fallbackPalette.length] ||
          "#94a3b8";
        return {
          name: assetClass?.name || id,
          value: data.value,
          color: getHexFromTailwind(rawColor as string),
          type: data.type,
        };
      },
    );

    const liabilities = Object.entries(allocationMap.liabilities).map(
      ([id, data]) => {
        return {
          name: id,
          value: data.value,
          color: defaultColors[id] || "#f43f5e",
          type: data.type,
        };
      },
    );

    return [...assets, ...liabilities]
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
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

    // Populate each month from snapshots if available
    for (let i = 0; i < history.length; i++) {
      const item = history[i]!;
      const start = item.dateObj;
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setMilliseconds(end.getMilliseconds() - 1);

      const matchingSnapshots = snapshots.filter((s) => {
        const sd = new Date(s.createdAt || s.date);
        return sd.getTime() >= start.getTime() && sd.getTime() <= end.getTime();
      });

      if (matchingSnapshots.length > 0) {
        const latest = matchingSnapshots.sort(
          (a, b) =>
            new Date(b.createdAt || b.date).getTime() -
            new Date(a.createdAt || a.date).getTime(),
        )[0]!;
        item.value = latest.netWorth;
      }
    }

    // Latest month defaults to real-time Net Worth
    if (history[5]) {
      history[5].value = realTimeNetWorth;
    }

    const chronSnapshots = [...snapshots].sort(
      (a, b) =>
        new Date(a.createdAt || a.date).getTime() -
        new Date(b.createdAt || b.date).getTime(),
    );
    const earliestSnap = chronSnapshots[0];
    const earliestDate = earliestSnap
      ? new Date(earliestSnap.createdAt || earliestSnap.date)
      : null;
    const baselineNW =
      earliestSnap?.previousNetWorth ??
      (earliestSnap
        ? Math.max(0, earliestSnap.netWorth - (earliestSnap.netWorthDelta || 0))
        : 0);

    // Backfill any empty months using transactions net flow or baseline
    for (let i = 4; i >= 0; i--) {
      const current = history[i]!;
      const next = history[i + 1]!;

      if (current.value === 0) {
        if (earliestDate && current.dateObj.getTime() < earliestDate.getTime()) {
          current.value = baselineNW;
        } else {
          const start = next.dateObj;
          const end = new Date(start);
          end.setMonth(end.getMonth() + 1);
          end.setMilliseconds(end.getMilliseconds() - 1);

          const txInMonth = transactions.filter((tx) => {
            if (tx.status === "pending_confirmation") return false;
            const txDate = new Date(tx.date);
            return (
              txDate.getTime() >= start.getTime() &&
              txDate.getTime() <= end.getTime()
            );
          });

          const netFlow = txInMonth.reduce(
            (acc, tx) => acc + (tx.type === "income" ? tx.amount : -tx.amount),
            0,
          );

          current.value = Math.max(0, next.value - netFlow);
        }
      }
    }

    return history.map((h) => ({
      month: h.month,
      value: h.value > 0 ? h.value : 0,
    }));
  }, [snapshots, transactions, realTimeNetWorth, user?.monthStartDate]);

  const dashboardStats = useMemo(() => {
    const monthStartDate = user?.monthStartDate || 1;
    const currentFiscalStart = getFiscalMonthStart(new Date(), monthStartDate);

    const periodTx = transactions.filter((tx) => {
      if (tx.status === "pending_confirmation") return false;
      const d = new Date(tx.date);
      return d >= currentFiscalStart;
    });

    const monthlyIncome = periodTx
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthlyExpense = periodTx
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const savingsRate =
      monthlyIncome > 0
        ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100
        : 0;

    const liquidCapital = analyticsRegularAccounts
      .filter((a) => a.type !== "card")
      .reduce((sum, a) => sum + a.balance, 0);

    return {
      monthlyIncome,
      monthlyExpense,
      savingsRate: savingsRate.toFixed(1),
      liquidCapital,
    };
  }, [transactions, analyticsRegularAccounts, user?.monthStartDate]);

  const netWorthTrend = useMemo(() => {
    // 1. Sort snapshots descending (newest first)
    const sorted = [...snapshots].sort(
      (a, b) =>
        new Date(b.createdAt || b.date).getTime() -
        new Date(a.createdAt || a.date).getTime(),
    );

    let delta = 0;
    let prevNW = 0;
    let referenceLabel = "vs last pulse";

    // Compare real-time net worth to latest snapshot if real-time has moved
    if (sorted.length > 0 && Math.abs(realTimeNetWorth - sorted[0]!.netWorth) >= 1) {
      delta = realTimeNetWorth - sorted[0]!.netWorth;
      prevNW = sorted[0]!.netWorth;
      referenceLabel = "since last pulse";
    } else if (sorted.length >= 2 && sorted[0] && sorted[1]) {
      delta = sorted[0].netWorth - sorted[1].netWorth;
      prevNW = sorted[1].netWorth;
      referenceLabel = "vs previous pulse";
    } else if (sorted.length === 1 && sorted[0]?.netWorthDelta != null && sorted[0].netWorthDelta !== 0) {
      delta = sorted[0].netWorthDelta;
      prevNW = sorted[0].previousNetWorth ?? (sorted[0].netWorth - delta);
      referenceLabel = "vs previous pulse";
    } else if (computedNetWorthHistory.length >= 2) {
      const last =
        computedNetWorthHistory[computedNetWorthHistory.length - 1]?.value || 0;
      const prev =
        computedNetWorthHistory[computedNetWorthHistory.length - 2]?.value || 0;
      if (prev > 0) {
        delta = last - prev;
        prevNW = prev;
        referenceLabel = "MoM";
      }
    }

    // Fallback to month-to-date transaction net flow
    if (delta === 0 && prevNW === 0) {
      const netFlow = dashboardStats.monthlyIncome - dashboardStats.monthlyExpense;
      const startingNW = realTimeNetWorth - netFlow;
      if (startingNW > 0 && netFlow !== 0) {
        delta = netFlow;
        prevNW = startingNW;
        referenceLabel = "this month";
      }
    }

    const pct = prevNW > 0 ? (delta / prevNW) * 100 : 0;
    const absDelta = Math.abs(delta);
    const absPct = Math.abs(pct);

    let pctFormatted = "0%";
    if (absPct >= 1) {
      pctFormatted = `${absPct.toFixed(1)}%`;
    } else if (absPct >= 0.01) {
      pctFormatted = `${absPct.toFixed(2)}%`;
    } else if (absPct > 0) {
      pctFormatted = `<0.01%`;
    }

    const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
    const trendPercentage = delta !== 0 ? `${sign}${pctFormatted}` : "0%";
    const trendDelta =
      delta !== 0
        ? `${sign}₹${Math.round(absDelta).toLocaleString()}`
        : "₹0";
    const label =
      delta !== 0 ? `${trendDelta} (${trendPercentage})` : "₹0 (Stable)";

    return {
      delta,
      pct,
      trendPercentage,
      trendDelta,
      label,
      color:
        delta > 0
          ? "bg-emerald-500"
          : delta < 0
            ? "bg-rose-500"
            : "bg-slate-400",
      referenceLabel,
    };
  }, [snapshots, realTimeNetWorth, computedNetWorthHistory, dashboardStats]);

  if (loading && allAccounts.length === 0) {
    return (
      <PageContainer className="space-y-6 lg:space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm space-y-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-2 w-12" />
                <Skeleton className="h-2 w-24" />
              </div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <FeatureTour />
      <PageHeader
        title="Dashboard"
        subtitle="Unified wealth landscape"
        className="space-y-3"
        actions={
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Button
              size="sm"
              onClick={() => dispatch(openModal("isWealthPulseOpen"))}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white shadow-md shadow-primary/20"
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            >
              60s Wealth Pulse
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
          <Link href="/plans?tab=Expiries" className="block">
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between group hover:bg-rose-500/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    {expiringSoon.length} Expiry Horizon
                    {expiringSoon.length > 1 ? "s" : ""} require
                    {expiringSoon.length === 1 ? "s" : ""} immediate attention
                  </h4>
                  <p className="text-[10px] font-bold text-rose-500/70 uppercase tracking-widest">
                    Impending expiry detected within 7-day window
                  </p>
                </div>
              </div>
              <ArrowRight className="size-5 text-rose-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* 4 Distinctive Wealth Pillars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <DashboardStatCard
          className="w-full"
          label="Net Worth"
          subtitle="Assets minus debt"
          icon={<Sparkles className="size-3 text-emerald-500" />}
          value={realTimeNetWorth}
          trend={{
            label: netWorthTrend.label,
            color: netWorthTrend.color,
            showPulse: netWorthTrend.delta !== 0,
          }}
        />

        <DashboardStatCard
          className="w-full"
          label="Liquid Reserves"
          subtitle="Cash & Bank"
          icon={<Landmark className="size-3 text-blue-500" />}
          value={dashboardStats.liquidCapital}
          valueColor="text-blue-600 dark:text-blue-400"
          trend={{
            label: `${analyticsRegularAccounts.length} Active Account${analyticsRegularAccounts.length !== 1 ? "s" : ""}`,
            color: "bg-blue-500",
          }}
        />

        <DashboardStatCard
          className="w-full"
          label="Investments"
          subtitle="Portfolio value"
          icon={<TrendingUp className="size-3 text-indigo-500" />}
          value={totalInvestments}
          valueColor="text-indigo-600 dark:text-indigo-400"
          onClick={() => router.push("/portfolio")}
          trend={{
            label:
              totalInvestedCapital > 0
                ? `${investmentGain >= 0 ? "+" : ""}${investmentYieldPct.toFixed(1)}% Return`
                : "Active Holdings",
            color: investmentGain >= 0 ? "bg-emerald-500" : "bg-rose-500",
          }}
        />

        <DashboardStatCard
          className="w-full"
          label="Liabilities"
          subtitle="Loans & Cards"
          icon={<CreditCard className="size-3 text-rose-500" />}
          value={liabilities}
          valueColor="text-rose-500"
          onClick={() => router.push("/portfolio")}
          trend={{
            label: `${activeDebtsCount} Active ${activeDebtsCount === 1 ? "Debt" : "Debts"}`,
            color: "bg-rose-500",
          }}
        />
      </div>

      {/* Monthly Overview & Liquid Accounts (Restored below Monthly Overview) */}
      <div className="space-y-2.5">
        <MonthlyGrowthDebrief
          monthlyIncome={dashboardStats.monthlyIncome}
          monthlyExpense={dashboardStats.monthlyExpense}
          savingsRate={dashboardStats.savingsRate}
        />

        <LiquidCapitalCard
          accounts={displayRegularAccounts}
          totalBalance={dashboardStats.liquidCapital}
        />
      </div>

      {allAccounts.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Landmark className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              No accounts configured
            </p>
            <Button
              size="sm"
              onClick={() => dispatch(openModal("isAccountModalOpen"))}
            >
              Add your first account
            </Button>
          </div>
        </div>
      )}

      {/* Premium Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <WealthIndex />
        </div>
        <div className="lg:col-span-2">
          <SmartAssistant />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:items-stretch">
        <div className="w-full">
          <AssetAllocationDonut
            data={realTimeAssetAllocation}
          />
        </div>

        <div className="w-full space-y-3 flex flex-col">
          <div className="flex items-center justify-between px-1 group">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              Goal Progress
              <span className="text-[7px] font-medium normal-case tracking-normal text-slate-400">
                Pacing towards goals
              </span>
            </h3>
            <Link
              href="/plans?tab=Goals"
              className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-colors active:scale-95 flex items-center gap-1.5"
            >
              View Maps
              <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {goals.filter((g) => g.currentAmount < g.targetAmount).length ===
              0 ? (
              <div className="h-full p-6 sm:p-10 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3">
                <TargetIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 opacity-50" />
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                  No active goals defined
                </p>
              </div>
            ) : (
              goals
                .filter((g) => g.currentAmount < g.targetAmount)
                .slice(0, 3)
                .map((goal: FinancialGoal) => {
                  const percentageSaved = Math.min(
                    100,
                    (goal.currentAmount / goal.targetAmount) * 100,
                  );

                  // Calculate expected pace based on time elapsed
                  const now = new Date();
                  const start = new Date(goal.startDate || now);
                  const target = new Date(goal.targetDate);
                  const totalDuration = target.getTime() - start.getTime();
                  const elapsed = now.getTime() - start.getTime();
                  const expectedPercentage =
                    totalDuration > 0
                      ? Math.min(
                        100,
                        Math.max(0, (elapsed / totalDuration) * 100),
                      )
                      : 100;

                  return (
                    <GoalProgressCard
                      key={goal.id}
                      name={goal.name}
                      targetAmount={goal.targetAmount}
                      currentAmount={goal.currentAmount}
                      percentageSaved={percentageSaved}
                      expectedPercentage={expectedPercentage}
                      requirementPerMonth={(() => {
                        const today = new Date();
                        const targetDate = new Date(goal.targetDate);
                        const monthsRemaining =
                          (targetDate.getFullYear() - today.getFullYear()) *
                          12 +
                          (targetDate.getMonth() - today.getMonth());
                        if (monthsRemaining <= 0) return 0;
                        const shortfall =
                          goal.targetAmount - goal.currentAmount;
                        return shortfall / monthsRemaining;
                      })()}
                    />
                  );
                })
            )}
          </div>
        </div>
      </div>

      <div>
        <NetWorthChart
          data={computedNetWorthHistory}
          currentNetWorth={realTimeNetWorth}
          percentageChange={netWorthTrend.pct}
          trendPercentage={netWorthTrend.trendPercentage}
          trendDelta={netWorthTrend.trendDelta}
          trendLabel={netWorthTrend.label}
          isPositive={netWorthTrend.delta >= 0}
        />
      </div>

      {/* Floating Action for PWA Mobile */}
      <div className="lg:hidden fixed bottom-18 right-4 z-40">
        <button
          type="button"
          onClick={() => dispatch(openModal("isWealthPulseOpen"))}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-indigo-600 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-primary/40 active:scale-95 transition-all"
        >
          <Sparkles className="size-4 text-amber-300" />
          <span>Pulse</span>
        </button>
      </div>
    </PageContainer>
  );
}
