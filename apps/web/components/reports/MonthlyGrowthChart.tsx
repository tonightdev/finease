"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  formatCurrency,
  getFiscalMonthStart,
  formatCompact,
} from "@/lib/utils";
import { Account, Transaction, WealthSnapshot } from "@repo/types";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  Layers,
  BarChart3,
  LineChart as LineChartIcon,
  Landmark,
} from "lucide-react";

interface MonthlyGrowthChartProps {
  accounts: Account[];
  transactions: Transaction[];
  snapshots: WealthSnapshot[];
  monthStartDate?: number;
  className?: string;
}

export type DataScope = "all" | "accounts_cash";
type TimeframeOption = "6M" | "12M" | "YTD";
type ChartViewMode = "combined" | "growth" | "networth";

interface MonthlyDataPoint {
  month: string;
  monthShort: string;
  year: number;
  dateObj: Date;
  netWorth: number;
  growth: number;
  growthPercentage: number;
  inflow: number;
  outflow: number;
  isCurrentMonth: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    payload: MonthlyDataPoint;
  }>;
  label?: string;
  dataScope?: DataScope;
}

function CustomTooltip({
  active,
  payload,
  dataScope = "all",
}: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data: MonthlyDataPoint = payload[0]!.payload;
    const isPositive = data.growth >= 0;
    const isMasked = formatCurrency(data.netWorth) === "*****";

    return (
      <div className="bg-slate-900/95 dark:bg-[#0a0d14]/95 border border-slate-700/60 dark:border-white/10 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-2xl backdrop-blur-md max-w-[220px] sm:max-w-xs space-y-2 text-xs">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3 text-slate-400" />
            <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider">
              {data.month}
            </span>
          </div>
          {data.isCurrentMonth && (
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-primary/20 text-primary">
              Current
            </span>
          )}
        </div>

        {/* Growth Delta & Stats */}
        {data.netWorth === 0 && data.growth === 0 && !data.isCurrentMonth ? (
          <div className="py-1">
            <span className="text-[10px] text-slate-400 font-medium italic">
              Tracking not started yet
            </span>
          </div>
        ) : (
          <>
            <div>
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                {dataScope === "accounts_cash"
                  ? "Monthly Cash Change"
                  : "Monthly Wealth Change"}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                {isPositive ? (
                  <TrendingUp className="size-3 text-emerald-400 shrink-0" />
                ) : (
                  <TrendingDown className="size-3 text-rose-400 shrink-0" />
                )}
                <span
                  className={`text-xs sm:text-sm font-black ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isMasked ? (
                    "*****"
                  ) : (
                    <>
                      {isPositive ? "+" : ""}
                      {formatCurrency(data.growth)}
                      <span className="text-[9px] sm:text-[10px] font-bold opacity-80 ml-1">
                        ({data.growthPercentage > 0 ? "+" : ""}
                        {data.growthPercentage.toFixed(1)}%)
                      </span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Net Worth or Liquid Capital */}
            <div className="pt-1 border-t border-white/5 flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">
                {dataScope === "accounts_cash"
                  ? "Cash & Accounts:"
                  : "Net Worth:"}
              </span>
              <span className="text-[11px] sm:text-xs font-black text-white">
                {formatCurrency(data.netWorth)}
              </span>
            </div>

            {/* Cash Flow */}
            {(data.inflow > 0 || data.outflow > 0) && (
              <div className="pt-1 border-t border-white/5 space-y-0.5 text-[9px] sm:text-[10px]">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">Inflow:</span>
                  <span className="text-emerald-400 font-mono">
                    {formatCurrency(data.inflow)}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-slate-400">Outflow:</span>
                  <span className="text-rose-400 font-mono">
                    {formatCurrency(data.outflow)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
  return null;
}

export function MonthlyGrowthChart({
  accounts,
  transactions,
  snapshots,
  monthStartDate = 1,
  className = "",
}: MonthlyGrowthChartProps) {
  const [dataScope, setDataScope] = useState<DataScope>("all");
  const [timeframe, setTimeframe] = useState<TimeframeOption>("6M");
  const [viewMode, setViewMode] = useState<ChartViewMode>("combined");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isLiquid = (type: string) => type === "bank" || type === "cash";

  const liquidAccountIds = useMemo(() => {
    return new Set(
      accounts.filter((a) => !a.isClosed && isLiquid(a.type)).map((a) => a.id),
    );
  }, [accounts]);

  // Current Net Worth from active accounts (based on scope)
  const currentNetWorth = useMemo(() => {
    if (dataScope === "accounts_cash") {
      return accounts
        .filter((a) => !a.isClosed && isLiquid(a.type))
        .reduce((sum, a) => sum + Math.max(0, a.balance), 0);
    }
    const assets = accounts
      .filter((a) => !a.isClosed && a.type !== "debt")
      .reduce((sum, a) => sum + Math.max(0, a.balance), 0);
    const debts = accounts
      .filter((a) => !a.isClosed && (a.type === "debt" || a.type === "card"))
      .reduce((sum, a) => sum + Math.abs(a.balance), 0);
    return assets - debts;
  }, [accounts, dataScope]);

  // Compute monthly growth data points
  const monthlyData: MonthlyDataPoint[] = useMemo(() => {
    const now = new Date();
    const monthNames = [
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

    let monthCount = 6;
    if (timeframe === "12M") monthCount = 12;
    if (timeframe === "YTD") {
      monthCount = now.getMonth() + 1; // months from Jan to current
      if (monthCount < 3) monthCount = 3;
    }

    // Build chronological month slots
    const points: MonthlyDataPoint[] = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = getFiscalMonthStart(now, monthStartDate);
      d.setMonth(d.getMonth() - i);

      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const isCur = i === 0;

      points.push({
        month: `${monthNames[mIdx]} ${yr}`,
        monthShort: `${monthNames[mIdx]}`,
        year: yr,
        dateObj: d,
        netWorth: 0,
        growth: 0,
        growthPercentage: 0,
        inflow: 0,
        outflow: 0,
        isCurrentMonth: isCur,
      });
    }

    // Determine end of each month slot
    for (let i = 0; i < points.length; i++) {
      const pt = points[i]!;
      const start = pt.dateObj;
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setMilliseconds(end.getMilliseconds() - 1);

      // Inflow & outflow in that fiscal month
      const txs = transactions.filter((tx) => {
        if (tx.status === "pending_confirmation") return false;
        const d = new Date(tx.date);
        const inWindow =
          d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
        if (!inWindow) return false;
        if (dataScope === "accounts_cash") {
          return liquidAccountIds.has(tx.accountId);
        }
        return true;
      });

      if (dataScope === "accounts_cash") {
        pt.inflow = txs
          .filter(
            (t) =>
              t.type === "income" ||
              (t.type === "transfer" &&
                t.toAccountId &&
                liquidAccountIds.has(t.toAccountId) &&
                !liquidAccountIds.has(t.accountId)),
          )
          .reduce((sum, t) => sum + t.amount, 0);
        pt.outflow = txs
          .filter(
            (t) =>
              t.type === "expense" ||
              (t.type === "transfer" &&
                (!t.toAccountId || !liquidAccountIds.has(t.toAccountId))),
          )
          .reduce((sum, t) => sum + t.amount, 0);
      } else {
        pt.inflow = txs
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);
        pt.outflow = txs
          .filter((t) => t.type === "expense" || t.type === "transfer")
          .reduce((sum, t) => sum + t.amount, 0);
      }

      // Check if a Wealth Snapshot exists in this month
      const monthSnapshots = snapshots.filter((s) => {
        const sd = new Date(s.createdAt || s.date);
        return sd.getTime() >= start.getTime() && sd.getTime() <= end.getTime();
      });

      if (monthSnapshots.length > 0) {
        // Pick latest snapshot in this month
        const latest = monthSnapshots.sort(
          (a, b) =>
            new Date(b.createdAt || b.date).getTime() -
            new Date(a.createdAt || a.date).getTime(),
        )[0]!;

        if (dataScope === "accounts_cash") {
          if (latest.accountSnapshots && latest.accountSnapshots.length > 0) {
            pt.netWorth = latest.accountSnapshots
              .filter((acc) => isLiquid(acc.type))
              .reduce((sum, acc) => sum + acc.balance, 0);
          } else if (latest.liquidCapital !== undefined) {
            pt.netWorth = latest.liquidCapital;
          } else {
            pt.netWorth = latest.netWorth;
          }
        } else {
          pt.netWorth = latest.netWorth;
        }

        // If no manual transactions logged, extract cash flows from snapshot account deltas
        if (pt.inflow === 0 && pt.outflow === 0) {
          let snapInflow = 0;
          let snapOutflow = 0;
          for (const s of monthSnapshots) {
            if (s.accountSnapshots && s.accountSnapshots.length > 0) {
              const eligibleAccs =
                dataScope === "accounts_cash"
                  ? s.accountSnapshots.filter((acc) => isLiquid(acc.type))
                  : s.accountSnapshots;
              for (const acc of eligibleAccs) {
                if (acc.delta > 0) snapInflow += acc.delta;
                if (acc.delta < 0) snapOutflow += Math.abs(acc.delta);
              }
            } else if (dataScope === "all" && s.netWorthDelta) {
              if (s.netWorthDelta > 0) snapInflow += s.netWorthDelta;
              if (s.netWorthDelta < 0) snapOutflow += Math.abs(s.netWorthDelta);
            }
          }
          if (snapInflow > 0 || snapOutflow > 0) {
            pt.inflow = snapInflow;
            pt.outflow = snapOutflow;
          }
        }
      }
    }

    // Chronological snapshots to find baseline
    const chronSnapshots = [...snapshots].sort(
      (a, b) =>
        new Date(a.createdAt || a.date).getTime() -
        new Date(b.createdAt || b.date).getTime(),
    );
    const earliestSnap = chronSnapshots[0];
    let baselineNW = 0;
    if (earliestSnap) {
      if (dataScope === "accounts_cash") {
        if (
          earliestSnap.accountSnapshots &&
          earliestSnap.accountSnapshots.length > 0
        ) {
          baselineNW = earliestSnap.accountSnapshots
            .filter((acc) => isLiquid(acc.type))
            .reduce(
              (sum, acc) => sum + (acc.previousBalance ?? acc.balance),
              0,
            );
        } else if (earliestSnap.liquidCapital !== undefined) {
          baselineNW = earliestSnap.liquidCapital;
        }
      } else {
        baselineNW =
          earliestSnap.previousNetWorth ??
          Math.max(
            0,
            earliestSnap.netWorth - (earliestSnap.netWorthDelta || 0),
          );
      }
    }

    // Latest month net worth uses current real-time Net Worth if available
    const lastPoint = points[points.length - 1];
    if (lastPoint && currentNetWorth > 0) {
      lastPoint.netWorth = currentNetWorth;
    }

    // Determine the first month that has actual user activity
    // (a snapshot, non-zero cash flow, or current month with active accounts)
    let firstActiveIdx = -1;
    for (let i = 0; i < points.length; i++) {
      const pt = points[i]!;
      const start = pt.dateObj;
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setMilliseconds(end.getMilliseconds() - 1);

      const hasSnap = snapshots.some((s) => {
        const sd = new Date(s.createdAt || s.date);
        return sd.getTime() >= start.getTime() && sd.getTime() <= end.getTime();
      });

      const hasTx = pt.inflow > 0 || pt.outflow > 0;
      const isCurWithBalance = pt.isCurrentMonth && currentNetWorth > 0;

      if (hasSnap || hasTx || isCurWithBalance) {
        firstActiveIdx = i;
        break;
      }
    }

    if (firstActiveIdx === -1) {
      return points;
    }

    // Pre-tracking historical months have 0 net worth and 0 growth
    for (let i = 0; i < firstActiveIdx; i++) {
      points[i]!.netWorth = 0;
      points[i]!.growth = 0;
      points[i]!.growthPercentage = 0;
    }

    // Fill any gap months between firstActiveIdx and lastPoint using net transactions or interpolation
    for (let i = firstActiveIdx; i < points.length; i++) {
      const pt = points[i]!;
      if (pt.netWorth === 0) {
        if (i === points.length - 1 && currentNetWorth > 0) {
          pt.netWorth = currentNetWorth;
        } else if (i > firstActiveIdx) {
          const prev = points[i - 1]!;
          const netFlow = pt.inflow - pt.outflow;
          pt.netWorth = Math.max(0, (prev.netWorth || 0) + netFlow);
        }
      }
    }

    // Calculate month-over-month Growth & Percentage from firstActiveIdx onwards
    for (let i = firstActiveIdx; i < points.length; i++) {
      const pt = points[i]!;
      const start = pt.dateObj;
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setMilliseconds(end.getMilliseconds() - 1);

      const monthSnapshots = snapshots.filter((s) => {
        const sd = new Date(s.createdAt || s.date);
        return sd.getTime() >= start.getTime() && sd.getTime() <= end.getTime();
      });

      let monthDelta = 0;
      if (monthSnapshots.length > 0) {
        if (dataScope === "accounts_cash") {
          for (const s of monthSnapshots) {
            if (s.accountSnapshots && s.accountSnapshots.length > 0) {
              monthDelta += s.accountSnapshots
                .filter((acc) => isLiquid(acc.type))
                .reduce((sum, acc) => sum + (acc.delta || 0), 0);
            }
          }
        } else {
          monthDelta = monthSnapshots.reduce(
            (sum, s) => sum + (Number(s.netWorthDelta) || 0),
            0,
          );
        }
      }

      if (monthSnapshots.length > 0 && monthDelta !== 0) {
        pt.growth = monthDelta;
        const prevNW = Math.max(0, pt.netWorth - monthDelta);
        pt.growthPercentage = prevNW > 0 ? (pt.growth / prevNW) * 100 : 0;
      } else if (i === firstActiveIdx) {
        // Initial month where tracking began: established capital vs baseline
        pt.growth = pt.netWorth - baselineNW;
        pt.growthPercentage =
          baselineNW > 0 ? (pt.growth / baselineNW) * 100 : 100;
      } else {
        const prev = points[i - 1]!;
        pt.growth = pt.netWorth - prev.netWorth;
        pt.growthPercentage =
          prev.netWorth > 0 ? (pt.growth / prev.netWorth) * 100 : 0;
      }
    }

    return points;
  }, [
    snapshots,
    transactions,
    currentNetWorth,
    monthStartDate,
    timeframe,
    dataScope,
    liquidAccountIds,
  ]);

  // Summary Metrics across the selected timeframe
  // Only count months that actually have real data (snapshot or non-zero transactions)
  const metrics = useMemo(() => {
    if (monthlyData.length === 0) {
      return {
        totalGrowth: 0,
        avgMonthlyGrowth: 0,
        bestMonth: null,
        positiveRatio: 0,
        positiveCount: 0,
        totalCount: 0,
      };
    }

    // "Live" months = months with an actual snapshot or real cash flow transactions
    const livePoints = monthlyData.filter(
      (p) =>
        p.growth !== 0 || p.inflow > 0 || p.outflow > 0 || p.isCurrentMonth,
    );

    const nonZeroPoints = monthlyData.filter((p) => p.netWorth > 0);
    const activeTransitions = livePoints.filter((p) => p.growth !== 0);

    const totalGrowth =
      activeTransitions.length > 0
        ? activeTransitions.reduce((sum, p) => sum + p.growth, 0)
        : nonZeroPoints.length >= 2
          ? nonZeroPoints[nonZeroPoints.length - 1]!.netWorth -
            nonZeroPoints[0]!.netWorth
          : 0;

    const avgMonthlyGrowth =
      activeTransitions.length > 0
        ? activeTransitions.reduce((a, b) => a + b.growth, 0) /
          activeTransitions.length
        : livePoints.length > 0
          ? totalGrowth / livePoints.length
          : totalGrowth;

    // Best performing month — only among live months
    const sorted = [...livePoints].sort((a, b) => b.growth - a.growth);
    const bestMonth = sorted.find((p) => p.growth > 0) || null;

    // Positive months count — only among months with actual activity
    const positiveCount = livePoints.filter((p) => p.growth > 0).length;
    const positiveRatio =
      activeTransitions.length > 0
        ? (positiveCount / activeTransitions.length) * 100
        : livePoints.length > 0
          ? (positiveCount / livePoints.length) * 100
          : 100;

    return {
      totalGrowth,
      avgMonthlyGrowth,
      bestMonth,
      positiveRatio,
      positiveCount,
      totalCount: livePoints.length || monthlyData.length,
    };
  }, [monthlyData]);

  const isMasked = formatCurrency(metrics.totalGrowth) === "*****";

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 p-3.5 shadow-sm space-y-3 ${className}`}
    >
      {/* Top Header Row with Title, Controls & Filters */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Title and Desktop Scope Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="size-9 sm:size-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-primary/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="size-4.5 sm:size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="text-xs sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Monthly Growth & Trajectory
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hidden sm:inline">
                  {dataScope === "accounts_cash"
                    ? "Accounts & Cash"
                    : "All Wealth"}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {dataScope === "accounts_cash"
                  ? "Liquid cash velocity & delta across bank & cash accounts"
                  : "Net worth delta progression & monthly capital velocity"}
              </p>
            </div>
          </div>

          {/* Desktop/Tablet Scope Toggle */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
            <button
              type="button"
              onClick={() => setDataScope("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                dataScope === "all"
                  ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Include all assets, investments, accounts & debts"
            >
              <Layers className="size-3.5" />
              <span>All Data</span>
            </button>
            <button
              type="button"
              onClick={() => setDataScope("accounts_cash")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                dataScope === "accounts_cash"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Only bank accounts and liquid cash"
            >
              <Landmark className="size-3.5" />
              <span>Accounts & Cash</span>
            </button>
          </div>
        </div>

        {/* Row 2 (Mobile only): Full-width Segmented Scope Toggle */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5 sm:hidden">
          <button
            type="button"
            onClick={() => setDataScope("all")}
            className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              dataScope === "all"
                ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="size-3.5 shrink-0" />
            <span>All Data</span>
          </button>
          <button
            type="button"
            onClick={() => setDataScope("accounts_cash")}
            className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              dataScope === "accounts_cash"
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Landmark className="size-3.5 shrink-0" />
            <span>Accounts & Cash</span>
          </button>
        </div>

        {/* Row 3 (Mobile) / Secondary Bar: View Mode & Timeframe Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full">
          {/* Chart View Mode Toggle */}
          <div className="flex items-center gap-0.5 p-0.5 sm:p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
            <button
              type="button"
              onClick={() => setViewMode("combined")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "combined"
                  ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Combined Growth Bars & Net Worth Line"
            >
              <Layers className="size-3" />
              <span>All</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("growth")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "growth"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Growth Delta Only"
            >
              <BarChart3 className="size-3" />
              <span>Growth</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("networth")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "networth"
                  ? "bg-white dark:bg-slate-800 text-indigo-500 shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
              title="Net Worth Line"
            >
              <LineChartIcon className="size-3" />
              <span>Trend</span>
            </button>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center gap-0.5 p-0.5 sm:p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200/60 dark:border-white/5">
            {(["6M", "12M", "YTD"] as TimeframeOption[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  timeframe === tf
                    ? "bg-white dark:bg-slate-800 text-primary shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Metric Pills - Mobile 2-Col / Desktop 4-Col */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-0.5">
        {/* Metric 1: Total Period Growth */}
        <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-0.5">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">
            {dataScope === "accounts_cash"
              ? "Period Liquid Growth"
              : "Period Growth"}
          </span>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span
              className={`text-xs sm:text-base font-black truncate ${
                metrics.totalGrowth >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {isMasked ? (
                "*****"
              ) : (
                <>
                  {metrics.totalGrowth >= 0 ? "+" : ""}
                  {formatCurrency(metrics.totalGrowth)}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Metric 2: Average Monthly Growth */}
        <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-0.5">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">
            {dataScope === "accounts_cash"
              ? "Avg Liquid MoM"
              : "Avg MoM Growth"}
          </span>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span
              className={`text-xs sm:text-base font-black truncate ${
                metrics.avgMonthlyGrowth >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {isMasked ? (
                "*****"
              ) : (
                <>
                  {metrics.avgMonthlyGrowth >= 0 ? "+" : ""}
                  {formatCurrency(metrics.avgMonthlyGrowth)}
                </>
              )}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">
              /mo
            </span>
          </div>
        </div>

        {/* Metric 3: Best Month */}
        <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-0.5">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">
            Best Month
          </span>
          {metrics.bestMonth ? (
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-[11px] sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {metrics.bestMonth.monthShort}
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 truncate">
                {isMasked
                  ? "*****"
                  : `+${formatCurrency(metrics.bestMonth.growth)}`}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Stable</span>
          )}
        </div>

        {/* Metric 4: Positive Consistency Rate */}
        <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 space-y-0.5">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 block truncate">
            Consistency
          </span>
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              {metrics.positiveRatio.toFixed(0)}% Positive
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">
              {metrics.positiveCount}/{metrics.totalCount} mo
            </span>
          </div>
        </div>
      </div>

      {/* Main Responsive Chart Container */}
      <div className="h-[240px] sm:h-[320px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={monthlyData}
            margin={{
              top: 10,
              right: isMobile ? 5 : 15,
              left: isMobile ? -25 : -10,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient id="growthGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="growthRose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#e11d48" stopOpacity={0.9} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="currentColor"
              className="text-slate-200/60 dark:text-white/5"
            />

            <XAxis
              dataKey="monthShort"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#94a3b8",
                fontSize: isMobile ? 9 : 11,
                fontWeight: 700,
              }}
            />

            {/* Left Axis: Growth Delta */}
            {(viewMode === "combined" || viewMode === "growth") && (
              <YAxis
                yAxisId="deltaAxis"
                axisLine={false}
                tickLine={false}
                width={isMobile ? 36 : 50}
                tick={{ fill: "#94a3b8", fontSize: isMobile ? 8 : 10 }}
                tickFormatter={(val: number) => formatCompact(val)}
              />
            )}

            {/* Right Axis: Total Net Worth for Line (hide on small mobile in combined mode to avoid cramming) */}
            {(viewMode === "combined" || viewMode === "networth") && (
              <YAxis
                yAxisId="netWorthAxis"
                orientation={viewMode === "networth" ? "left" : "right"}
                hide={isMobile && viewMode === "combined"}
                axisLine={false}
                tickLine={false}
                width={isMobile ? 36 : 50}
                tick={{ fill: "#6366f1", fontSize: isMobile ? 8 : 10 }}
                tickFormatter={(val: number) => formatCompact(val)}
              />
            )}

            {/* Reference Line at 0 for clear gain / loss horizon */}
            {(viewMode === "combined" || viewMode === "growth") && (
              <ReferenceLine
                y={0}
                yAxisId="deltaAxis"
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="2 2"
                opacity={0.4}
              />
            )}

            <Tooltip content={<CustomTooltip dataScope={dataScope} />} />

            {/* Bars for Monthly Growth */}
            {(viewMode === "combined" || viewMode === "growth") && (
              <Bar
                yAxisId="deltaAxis"
                dataKey="growth"
                name={
                  dataScope === "accounts_cash"
                    ? "Cash & Accounts Growth"
                    : "Monthly Growth"
                }
                maxBarSize={isMobile ? 24 : 38}
                radius={[4, 4, 0, 0]}
              >
                {monthlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.growth >= 0
                        ? "url(#growthGreen)"
                        : "url(#growthRose)"
                    }
                  />
                ))}
              </Bar>
            )}

            {/* Line for Net Worth Trend */}
            {(viewMode === "combined" || viewMode === "networth") && (
              <Line
                yAxisId="netWorthAxis"
                type="monotone"
                dataKey="netWorth"
                name={
                  dataScope === "accounts_cash"
                    ? "Cash & Accounts"
                    : "Net Worth Trend"
                }
                stroke="#6366f1"
                strokeWidth={isMobile ? 2 : 2.5}
                dot={{
                  r: isMobile ? 3 : 4,
                  fill: "#6366f1",
                  strokeWidth: 1.5,
                  stroke: "#fff",
                }}
                activeDot={{ r: isMobile ? 5 : 6, fill: "#4f46e5" }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Insight Note */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 pt-2 border-t border-slate-100 dark:border-white/5 text-[9px] sm:text-[10px] font-bold text-slate-400">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {(viewMode === "combined" || viewMode === "growth") && (
            <>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-xs bg-emerald-500 shrink-0" />
                <span>Positive Expansion</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-xs bg-rose-500 shrink-0" />
                <span>Contraction</span>
              </div>
            </>
          )}
          {(viewMode === "combined" || viewMode === "networth") && (
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-0.5 bg-indigo-500 rounded-full shrink-0" />
              <span className="text-indigo-600 dark:text-indigo-400">
                {dataScope === "accounts_cash"
                  ? "Cash & Accounts Line"
                  : "Net Worth Line"}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-400">
          <Sparkles className="size-3 text-amber-500 shrink-0" />
          <span>Tap bars for full audit details</span>
        </div>
      </div>
    </div>
  );
}
