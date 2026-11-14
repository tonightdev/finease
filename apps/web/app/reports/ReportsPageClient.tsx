"use client";

import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { Account } from "@repo/types";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import {
  TrendingUp,
  ArrowUpRight,
  Activity,
  History,
  Landmark,
  ShieldCheck,
  Building2,
  CreditCard,
  Wallet,
  CheckCircle2,
  Briefcase,
  PieChart,
  Percent,
} from "lucide-react";
import { fetchAccounts, fetchSnapshots } from "@/store/slices/accountsSlice";
import { fetchAssetClasses } from "@/store/slices/assetClassesSlice";
import { fetchGoals } from "@/store/slices/goalsSlice";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/ui/PageContainer";
import { useAuth } from "@/components/auth/AuthProvider";
import { TrajectoryHistoryView } from "@/components/dashboard/TrajectoryHistoryView";
import { FinancialIndependenceRunwayCard } from "@/components/reports/FinancialIndependenceRunwayCard";

const EMPTY_ACCOUNTS: Account[] = [];

type AccountFilterType =
  | "all"
  | "liquid"
  | "investment"
  | "asset"
  | "liability";

export default function ReportsPageClient() {
  const [activeTab, setActiveTab] = useState<"trajectory" | "analytics">(
    "trajectory",
  );
  const [accountFilter, setAccountFilter] = useState<AccountFilterType>("all");

  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();

  const allAccounts =
    useSelector((state: RootState) => state.accounts?.items) ?? EMPTY_ACCOUNTS;

  // Active accounts for analytics (non-closed & non-excluded)
  const accounts = useMemo(
    () => allAccounts.filter((a) => !a.isClosed && !a.excludeFromAnalytics),
    [allAccounts],
  );

  const rawSnapshots = useSelector(
    (state: RootState) => state.accounts?.snapshots,
  );
  const snapshots = useMemo(() => rawSnapshots ?? [], [rawSnapshots]);

  useEffect(() => {
    if (user) {
      dispatch(fetchAccounts());
      dispatch(fetchSnapshots(50));
      dispatch(fetchAssetClasses());
      dispatch(fetchGoals());
    }
  }, [dispatch, user]);

  // Asset Breakdown Categories
  const liquidAccounts = useMemo(
    () =>
      accounts
        .filter(
          (a) => (a.type === "bank" || a.type === "cash") && a.balance > 0,
        )
        .sort((a, b) => b.balance - a.balance),
    [accounts],
  );

  const investmentAccounts = useMemo(
    () =>
      accounts
        .filter((a) => a.type === "investment" && a.balance > 0)
        .sort((a, b) => b.balance - a.balance),
    [accounts],
  );

  const physicalAccounts = useMemo(
    () =>
      accounts
        .filter((a) => a.type === "asset" && a.balance > 0)
        .sort((a, b) => b.balance - a.balance),
    [accounts],
  );

  // Liabilities Breakdown Categories
  const cardAccounts = useMemo(
    () =>
      accounts
        .filter((a) => a.type === "card" && Math.abs(a.balance) > 0)
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
    [accounts],
  );

  const debtAccounts = useMemo(
    () =>
      accounts
        .filter((a) => a.type === "debt" && Math.abs(a.balance) > 0)
        .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)),
    [accounts],
  );

  // Totals
  const totalLiquid = liquidAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalInvested = investmentAccounts.reduce(
    (sum, a) => sum + a.balance,
    0,
  );
  const totalPhysical = physicalAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalAssets = totalLiquid + totalInvested + totalPhysical;

  const totalCards = cardAccounts.reduce(
    (sum, a) => sum + Math.abs(a.balance),
    0,
  );
  const totalDebts = debtAccounts.reduce(
    (sum, a) => sum + Math.abs(a.balance),
    0,
  );
  const totalLiabilities = totalCards + totalDebts;

  const netWorth = totalAssets - totalLiabilities;

  // Solvency & Health Ratios
  const solvencyRatio = totalAssets > 0 ? (netWorth / totalAssets) * 100 : 100;
  const debtToAssetRatio =
    totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  const liquidRatio = totalAssets > 0 ? (totalLiquid / totalAssets) * 100 : 0;
  const investedRatio =
    totalAssets > 0 ? (totalInvested / totalAssets) * 100 : 0;
  const physicalRatio =
    totalAssets > 0 ? (totalPhysical / totalAssets) * 100 : 0;

  // Calculate Net Worth Change percentage from snapshots
  const netWorthChange = useMemo(() => {
    if (snapshots.length >= 2) {
      const sorted = [...snapshots].sort(
        (a, b) =>
          new Date(b.createdAt || b.date).getTime() -
          new Date(a.createdAt || a.date).getTime(),
      );
      const current = sorted[0]?.netWorth || 0;
      const prev = sorted[1]?.netWorth || 0;
      if (prev > 0) {
        return parseFloat((((current - prev) / prev) * 100).toFixed(1));
      }
      if (sorted[0]?.netWorthDelta != null && sorted[0].netWorthDelta !== 0) {
        const previousVal = current - sorted[0].netWorthDelta;
        if (previousVal > 0) {
          return parseFloat(
            ((sorted[0].netWorthDelta / previousVal) * 100).toFixed(1),
          );
        }
      }
    } else if (snapshots.length === 1 && snapshots[0]?.netWorthDelta) {
      const current = snapshots[0].netWorth;
      const delta = snapshots[0].netWorthDelta;
      const prev = current - delta;
      if (prev > 0) {
        return parseFloat(((delta / prev) * 100).toFixed(1));
      }
    }
    return 0;
  }, [snapshots]);

  // Filtered Accounts list for the Node explorer
  const displayedAccounts = useMemo(() => {
    if (accountFilter === "liquid") return liquidAccounts;
    if (accountFilter === "investment") return investmentAccounts;
    if (accountFilter === "asset") return physicalAccounts;
    if (accountFilter === "liability")
      return [...cardAccounts, ...debtAccounts];
    return accounts;
  }, [
    accountFilter,
    liquidAccounts,
    investmentAccounts,
    physicalAccounts,
    cardAccounts,
    debtAccounts,
    accounts,
  ]);

  return (
    <PageContainer className="gap-1.5 sm:gap-2">
      <PageHeader
        title="Review & Trajectory"
        subtitle="Periodic wealth trajectory & deep portfolio intelligence"
        className="space-y-1"
      />

      {/* Top Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl w-full sm:w-fit border border-slate-200/50 dark:border-white/5 my-1.5 sm:my-2 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("trajectory")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "trajectory"
              ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <History className="size-3.5" />
          <span>Trajectory</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "analytics"
              ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Activity className="size-3.5" />
          <span>Wealth Analytics</span>
        </button>
      </div>

      {activeTab === "trajectory" ? (
        <TrajectoryHistoryView />
      ) : (
        <div className="space-y-3">
          {/* 1. Four Pillar Wealth Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Card 1: Net Worth */}
            <Card className="shadow-none border-slate-100 dark:border-slate-800/80 p-2.5 sm:p-3 space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                Net Worth
              </span>
              <div className="text-sm sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {formatCurrency(netWorth)}
              </div>
              <div
                className={`flex items-center gap-1 text-[9px] font-black ${
                  netWorthChange >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                <ArrowUpRight
                  className={`size-3 ${netWorthChange < 0 ? "rotate-90" : ""}`}
                />
                <span>
                  {netWorthChange >= 0 ? "+" : ""}
                  {netWorthChange}% MoM
                </span>
              </div>
            </Card>

            {/* Card 2: Total Assets */}
            <Card className="shadow-none border-slate-100 dark:border-slate-800/80 p-2.5 sm:p-3 space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                Total Assets
              </span>
              <div className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400 truncate">
                {formatCurrency(totalAssets)}
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {liquidAccounts.length +
                  investmentAccounts.length +
                  physicalAccounts.length}{" "}
                contributing nodes
              </div>
            </Card>

            {/* Card 3: Total Liabilities */}
            <Card className="shadow-none border-slate-100 dark:border-slate-800/80 p-2.5 sm:p-3 space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                Total Debt
              </span>
              <div className="text-sm sm:text-lg font-black text-rose-500 truncate">
                {totalLiabilities > 0
                  ? `-${formatCurrency(totalLiabilities)}`
                  : "₹0"}
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {debtToAssetRatio > 0
                  ? `${debtToAssetRatio.toFixed(1)}% Debt Ratio`
                  : "Debt Free 🎉"}
              </div>
            </Card>

            {/* Card 4: Liquid Reserves */}
            <Card className="shadow-none border-slate-100 dark:border-slate-800/80 p-2.5 sm:p-3 space-y-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">
                Liquid Reserves
              </span>
              <div className="text-sm sm:text-lg font-black text-blue-600 dark:text-blue-400 truncate">
                {formatCurrency(totalLiquid)}
              </div>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {liquidRatio.toFixed(1)}% of Gross Assets
              </div>
            </Card>
          </div>

          {/* 2. Financial Runway Engine */}
          <FinancialIndependenceRunwayCard />

          {/* 3. Asset Allocation & Solvency Matrix (Dual Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {/* Widget A: Asset Allocation & Diversification */}
            <Card className="shadow-none border-slate-100 dark:border-slate-800/80 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <PieChart className="size-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Asset Allocation
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      Capital Diversification
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {totalAssets > 0 ? "Balanced Portfolio" : "Setup Accounts"}
                </span>
              </div>

              {/* Multi-Segment Allocation Bar */}
              <div className="space-y-1">
                <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex">
                  {liquidRatio > 0 && (
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${liquidRatio}%` }}
                      title={`Liquid: ${liquidRatio.toFixed(1)}%`}
                    />
                  )}
                  {investedRatio > 0 && (
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${investedRatio}%` }}
                      title={`Investments: ${investedRatio.toFixed(1)}%`}
                    />
                  )}
                  {physicalRatio > 0 && (
                    <div
                      className="h-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${physicalRatio}%` }}
                      title={`Physical: ${physicalRatio.toFixed(1)}%`}
                    />
                  )}
                </div>

                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest pt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-blue-500" />{" "}
                    Liquid {liquidRatio.toFixed(0)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-indigo-500" />{" "}
                    Investments {investedRatio.toFixed(0)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-amber-500" />{" "}
                    Physical {physicalRatio.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* 3 Detailed Asset Class Rows */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Landmark className="size-3.5 text-blue-500" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Liquid Bank & Cash
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(totalLiquid)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 ml-1.5">
                      ({liquidRatio.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-3.5 text-indigo-500" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Investments & Equity
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(totalInvested)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 ml-1.5">
                      ({investedRatio.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-3.5 text-amber-500" />
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Real Estate & Physical Assets
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-slate-900 dark:text-white">
                      {formatCurrency(totalPhysical)}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 ml-1.5">
                      ({physicalRatio.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Widget B: Capital Resilience & Solvency Matrix */}
            <Card className="shadow-none border-slate-100 dark:border-slate-800/80 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <ShieldCheck className="size-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Capital Resilience
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      Solvency & Leverage Health
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  Financial Stability
                </span>
              </div>

              {/* 4 Health Indicator Tiles */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400">
                    <span>Solvency Ratio</span>
                    <Percent className="size-2.5 text-emerald-500" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {solvencyRatio.toFixed(1)}%
                  </div>
                  <p className="text-[8px] font-bold text-slate-400">
                    {solvencyRatio >= 80
                      ? "High Equity Buffer"
                      : "Moderate Solvency"}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400">
                    <span>Debt-to-Asset</span>
                    <CreditCard className="size-2.5 text-rose-500" />
                  </div>
                  <div
                    className={`text-base sm:text-lg font-black ${
                      debtToAssetRatio === 0
                        ? "text-emerald-600"
                        : debtToAssetRatio < 30
                          ? "text-blue-600"
                          : "text-rose-600"
                    }`}
                  >
                    {debtToAssetRatio.toFixed(1)}%
                  </div>
                  <p className="text-[8px] font-bold text-slate-400">
                    {debtToAssetRatio === 0
                      ? "Zero Debt Exposure"
                      : debtToAssetRatio < 30
                        ? "Conservative Leverage"
                        : "High Leverage"}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400">
                    <span>Liquidity Share</span>
                    <Wallet className="size-2.5 text-blue-500" />
                  </div>
                  <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                    {liquidRatio.toFixed(1)}%
                  </div>
                  <p className="text-[8px] font-bold text-slate-400">
                    Accessible 24/7
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-1">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400">
                    <span>Debt Status</span>
                    <CheckCircle2 className="size-2.5 text-emerald-500" />
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white pt-1">
                    {totalLiabilities === 0
                      ? "Debt Free 🎉"
                      : `${cardAccounts.length + debtAccounts.length} Active Debts`}
                  </div>
                  <p className="text-[8px] font-bold text-slate-400">
                    {totalLiabilities === 0
                      ? "100% Unencumbered"
                      : formatCurrency(totalLiabilities)}
                  </p>
                </div>
              </div>

              {/* Solvency Summary Note */}
              <div className="p-2 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] text-[9px] text-slate-600 dark:text-slate-300 leading-relaxed flex items-center gap-1.5">
                <ShieldCheck className="size-3 text-emerald-500 shrink-0" />
                <span>
                  {solvencyRatio >= 90
                    ? "Excellent posture: Your net worth accounts for over 90% of your gross assets with minimal debt exposure."
                    : "Stable balance: Continue building liquid reserves while amortizing high-interest liabilities."}
                </span>
              </div>
            </Card>
          </div>

          {/* 4. Account Nodes Portfolio & Allocation Explorer */}
          <Card className="shadow-none border-slate-100 dark:border-slate-800/80 p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Briefcase className="size-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Node Distribution Explorer
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    Individual Account Holdings & Capital Weight
                  </p>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
                {(
                  [
                    { id: "all", label: `All (${accounts.length})` },
                    {
                      id: "liquid",
                      label: `Liquid (${liquidAccounts.length})`,
                    },
                    {
                      id: "investment",
                      label: `Invested (${investmentAccounts.length})`,
                    },
                    {
                      id: "asset",
                      label: `Physical (${physicalAccounts.length})`,
                    },
                    {
                      id: "liability",
                      label: `Debts (${cardAccounts.length + debtAccounts.length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAccountFilter(tab.id)}
                    className={`text-[9px] font-black px-2 py-1 rounded-lg whitespace-nowrap transition-all ${
                      accountFilter === tab.id
                        ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs"
                        : "bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Rows */}
            <div className="space-y-1.5 sm:max-h-[380px] sm:overflow-y-auto pr-1 no-scrollbar">
              {displayedAccounts.map((acc) => {
                const isDebt = acc.type === "debt" || acc.type === "card";
                const share =
                  totalAssets > 0
                    ? (Math.abs(acc.balance) / totalAssets) * 100
                    : 0;

                return (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:border-primary/20 transition-all text-xs gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <div
                        className={`size-6 rounded-lg flex items-center justify-center shrink-0 ${
                          isDebt
                            ? "bg-rose-500/10 text-rose-500"
                            : acc.type === "bank" || acc.type === "cash"
                              ? "bg-blue-500/10 text-blue-500"
                              : acc.type === "investment"
                                ? "bg-indigo-500/10 text-indigo-500"
                                : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {isDebt ? (
                          <CreditCard className="size-3" />
                        ) : acc.type === "bank" || acc.type === "cash" ? (
                          <Landmark className="size-3" />
                        ) : acc.type === "investment" ? (
                          <TrendingUp className="size-3" />
                        ) : (
                          <Building2 className="size-3" />
                        )}
                      </div>

                      <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white leading-tight break-words">
                          {acc.name}
                        </span>
                        {acc.institutionName && (
                          <span className="text-[7px] font-bold px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-white/10 text-slate-500 uppercase shrink-0">
                            {acc.institutionName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <span className="text-[9px] font-bold text-slate-400 font-mono">
                        {share.toFixed(1)}%
                      </span>
                      <span
                        className={`font-mono font-black ${
                          isDebt
                            ? "text-rose-500"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {isDebt ? "-" : ""}
                        {formatCurrency(Math.abs(acc.balance))}
                      </span>
                    </div>
                  </div>
                );
              })}

              {displayedAccounts.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No accounts found in this category
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
