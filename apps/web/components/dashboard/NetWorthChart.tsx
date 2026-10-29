"use client";

import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatCompact } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  Activity,
} from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { motion } from "framer-motion";

interface NetWorthChartProps {
  data: { month: string; value: number }[];
  currentNetWorth: number;
  percentageChange?: number;
  trendPercentage?: string;
  trendDelta?: string;
  trendLabel?: string;
  isPositive?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl backdrop-blur-md bg-opacity-95 ring-1 ring-white/10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
          {label}
        </p>
        <p className="text-xl font-black text-white">
          {formatCurrency(payload[0]?.value || 0)}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-400">
            Net Worth Checkpoint
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function NetWorthChart({
  data,
  currentNetWorth,
  percentageChange,
  trendPercentage,
  trendDelta,
  trendLabel,
  isPositive,
}: NetWorthChartProps) {
  const [period, setPeriod] = useState("6M");

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (period === "1M") return data.slice(-2);
    if (period === "6M") return data.slice(-6);
    if (period === "1Y") return data.slice(-12);
    if (period === "ALL") {
      const firstNonZero = data.findIndex((d) => d.value > 0);
      if (firstNonZero !== -1) {
        return data.slice(Math.max(0, firstNonZero));
      }
      return data;
    }
    return data;
  }, [data, period]);

  // Compute insights from chart data
  const insights = useMemo(() => {
    const pts = filteredData.filter((d) => d.value > 0);
    if (pts.length < 2) return null;

    const values = pts.map((p) => p.value);
    const peak = Math.max(...values);
    const trough = Math.min(...values);
    const peakMonth = pts.find((p) => p.value === peak)?.month ?? "–";
    const troughMonth = pts.find((p) => p.value === trough)?.month ?? "–";

    // Month-over-month deltas
    const deltas: number[] = [];
    for (let i = 1; i < pts.length; i++) {
      deltas.push(pts[i]!.value - pts[i - 1]!.value);
    }

    const positiveMonths = deltas.filter((d) => d > 0).length;
    const totalMonths = deltas.length;
    const winRate = totalMonths > 0 ? (positiveMonths / totalMonths) * 100 : 0;

    // Volatility: std dev of % changes
    const pctChanges = deltas.map((d, i) =>
      pts[i]!.value > 0 ? (d / pts[i]!.value) * 100 : 0,
    );
    const avgPct =
      pctChanges.reduce((a, b) => a + b, 0) / (pctChanges.length || 1);
    const variance =
      pctChanges.reduce((sum, p) => sum + Math.pow(p - avgPct, 2), 0) /
      (pctChanges.length || 1);
    const volatility = Math.sqrt(variance);

    // Momentum: avg of last 2 deltas vs overall avg
    const recentAvg =
      deltas.slice(-2).reduce((a, b) => a + b, 0) /
      Math.max(1, deltas.slice(-2).length);
    const overallAvg =
      deltas.reduce((a, b) => a + b, 0) / Math.max(1, deltas.length);
    const momentum = overallAvg !== 0 ? recentAvg / overallAvg : 1;

    // Compound growth rate
    const first = pts[0]!.value;
    const last = pts[pts.length - 1]!.value;
    const cagr = first > 0 ? ((last - first) / first) * 100 : 0;

    return {
      peak,
      trough,
      peakMonth,
      troughMonth,
      winRate,
      volatility,
      momentum,
      cagr,
      positiveMonths,
      totalMonths,
    };
  }, [filteredData]);

  // avg net worth for reference line
  const avgNetWorth = useMemo(() => {
    const pts = filteredData.filter((d) => d.value > 0);
    if (pts.length === 0) return 0;
    return pts.reduce((s, p) => s + p.value, 0) / pts.length;
  }, [filteredData]);

  const getMomentumLabel = (m: number) => {
    if (m >= 1.5) return { label: "Accelerating", color: "text-emerald-500" };
    if (m >= 0.8) return { label: "Steady", color: "text-primary" };
    if (m >= 0) return { label: "Decelerating", color: "text-amber-500" };
    return { label: "Contracting", color: "text-rose-500" };
  };

  return (
    <Card
      className="h-auto min-h-[380px] sm:min-h-[420px] lg:min-h-[480px] group shadow-none border-slate-100 dark:border-slate-800 relative"
      title="Net Worth Trend"
      subtitle="Wealth trajectory & momentum analytics"
      headerAction={
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 scale-90 sm:scale-100">
          {["1M", "6M", "1Y", "ALL"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black rounded-lg transition-all ${period === p ? "bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"}`}
            >
              {p}
            </button>
          ))}
        </div>
      }
    >
      {/* Header: Net Worth + trend pill */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total Net Worth
          </div>
          <div className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            <AnimatedNumber value={currentNetWorth} prefix="₹" />
          </div>
          <div className="pt-1 flex items-center gap-2 flex-wrap font-sans">
            {isPositive === undefined ||
            (!trendDelta && (!trendPercentage || trendPercentage === "0%")) ||
            trendDelta === "₹0" ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 tracking-normal shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 shrink-0" />
                <span className="whitespace-nowrap">
                  Baseline · No change recorded
                </span>
              </div>
            ) : (
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs tracking-normal ${
                  isPositive !== false
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20"
                }`}
              >
                {isPositive !== false ? (
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>
                  {trendPercentage ||
                    (percentageChange != null
                      ? `${percentageChange >= 0 ? "+" : ""}${percentageChange.toFixed(1)}%`
                      : trendLabel || "0%")}
                </span>
                {trendDelta && trendDelta !== "₹0" && (
                  <span className="opacity-75 font-normal">({trendDelta})</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] xs:h-[220px] sm:h-[240px] lg:h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#135bec" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="#94a3b820"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 800 }}
              interval="preserveStartEnd"
              minTickGap={20}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={44}
              tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 700 }}
              tickFormatter={(v: number) => formatCompact(v)}
              domain={["dataMin * 0.97", "dataMax * 1.03"]}
            />
            {/* Average reference line */}
            {avgNetWorth > 0 && (
              <ReferenceLine
                y={avgNetWorth}
                stroke="#6366f1"
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={0.4}
              />
            )}
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#135bec",
                strokeWidth: 1.5,
                strokeDasharray: "6 6",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#135bec"
              strokeWidth={3}
              strokeLinecap="round"
              fillOpacity={1}
              fill="url(#wealthGradient)"
              activeDot={{
                r: 6,
                fill: "#135bec",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights Panel */}
      {insights && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-100 dark:border-white/5 space-y-3"
        >
          {/* 4-stat grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Peak */}
            <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                Peak
              </span>
              <div className="text-[11px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 truncate">
                {formatCompact(insights.peak)}
              </div>
              <span className="text-[9px] font-bold text-slate-400">
                {insights.peakMonth}
              </span>
            </div>

            {/* Trough */}
            <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/15">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                Trough
              </span>
              <div className="text-[11px] sm:text-xs font-black text-rose-600 dark:text-rose-400 truncate">
                {formatCompact(insights.trough)}
              </div>
              <span className="text-[9px] font-bold text-slate-400">
                {insights.troughMonth}
              </span>
            </div>

            {/* Win Rate */}
            <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/15">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                Win Rate
              </span>
              <div className="text-[11px] sm:text-xs font-black text-primary truncate">
                {insights.winRate.toFixed(0)}%
              </div>
              <span className="text-[9px] font-bold text-slate-400">
                {insights.positiveMonths}/{insights.totalMonths} mo
              </span>
            </div>

            {/* Momentum */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                Momentum
              </span>
              <div
                className={`text-[11px] sm:text-xs font-black truncate ${getMomentumLabel(insights.momentum).color}`}
              >
                {getMomentumLabel(insights.momentum).label}
              </div>
              <span className="text-[9px] font-bold text-slate-400">
                {insights.cagr >= 0 ? "+" : ""}
                {insights.cagr.toFixed(1)}% gain
              </span>
            </div>
          </div>

          {/* Insight footer bar */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/5">
            <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {insights.volatility < 2 ? (
                <Activity className="size-3.5" />
              ) : insights.momentum >= 0.8 ? (
                <Zap className="size-3.5" />
              ) : (
                <BarChart3 className="size-3.5" />
              )}
            </div>
            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-tight">
              {insights.volatility < 1
                ? `Ultra-stable trajectory · ${insights.winRate.toFixed(0)}% positive months · avg ${formatCompact(avgNetWorth)}`
                : insights.volatility < 3
                  ? `Low-volatility growth · consistent upward drift · avg baseline ${formatCompact(avgNetWorth)}`
                  : `High-volatility pattern · track monthly changes closely · avg ${formatCompact(avgNetWorth)}`}
            </p>
          </div>
        </motion.div>
      )}
    </Card>
  );
}
