"use client";

import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { formatCurrency, formatCompact } from "@/lib/utils";
import { Landmark, TrendingUp, TrendingDown, Layers } from "lucide-react";
import { Card } from "@/components/ui/Card";

const ACCOUNT_COLORS: Record<string, string> = {
  bank: "#10b981", // emerald
  cash: "#06b6d4", // cyan
  investment: "#6366f1", // indigo
  asset: "#8b5cf6", // purple
  card: "#f43f5e", // rose
  debt: "#e11d48", // red
};

export function AccountTrajectoryChart() {
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const snapshots = useSelector(
    (state: RootState) => state.accounts.snapshots || [],
  );

  const activeAccounts = useMemo(
    () => accounts.filter((a) => !a.isClosed && !a.deletedAt),
    [accounts],
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");

  const selectedAccount = useMemo(
    () => activeAccounts.find((a) => a.id === selectedAccountId),
    [activeAccounts, selectedAccountId],
  );

  // Build chronological trajectory data points across snapshots
  const chartData = useMemo(() => {
    if (!snapshots || snapshots.length === 0) {
      // Fallback: Show current balance point if no historical snapshots exist yet
      return [
        {
          date: "Current",
          dateFormatted: "Current",
          ...activeAccounts.reduce(
            (acc, a) => ({ ...acc, [a.id]: a.balance }),
            {},
          ),
          total: activeAccounts.reduce(
            (sum, a) => sum + Math.max(0, a.balance),
            0,
          ),
        },
      ];
    }

    // Sort snapshots chronologically (oldest to newest)
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return sorted.map((s) => {
      const point: Record<string, string | number> = {
        date: s.date,
        dateFormatted: new Date(s.date).toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
      };

      let snapshotTotal = 0;

      if (s.accountSnapshots && Array.isArray(s.accountSnapshots)) {
        s.accountSnapshots.forEach((accSnap) => {
          point[accSnap.accountId] = accSnap.balance;
          if (accSnap.balance > 0) {
            snapshotTotal += accSnap.balance;
          }
        });
      }

      point.total = snapshotTotal > 0 ? snapshotTotal : s.netWorth;
      return point;
    });
  }, [snapshots, activeAccounts]);

  // Account specific metrics
  const selectedMetrics = useMemo(() => {
    if (!selectedAccount) return null;
    const currentBalance = selectedAccount.balance || 0;
    const historyValues = chartData
      .map((d) => d[selectedAccount.id])
      .filter((v) => typeof v === "number");

    const peak =
      historyValues.length > 0 ? Math.max(...historyValues) : currentBalance;
    const lowest =
      historyValues.length > 0 ? Math.min(...historyValues) : currentBalance;

    const first = historyValues[0] ?? currentBalance;
    const delta = currentBalance - first;
    const pctChange = first !== 0 ? (delta / Math.abs(first)) * 100 : 0;

    return {
      currentBalance,
      peak,
      lowest,
      delta,
      pctChange,
    };
  }, [selectedAccount, chartData]);

  if (activeAccounts.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 sm:p-5 border-slate-200/80 dark:border-white/5 bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-sm space-y-4">
      {/* Header and Account Filter Pill List */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <Landmark className="size-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Account-Wise Trajectory
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Individual node balance progression across wealth pulse
              checkpoints
            </p>
          </div>
        </div>

        {/* Account Selector Pill Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedAccountId("all")}
            className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 ${
              selectedAccountId === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
            }`}
          >
            <Layers className="size-3" />
            <span>All Accounts</span>
          </button>
          {activeAccounts.map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => setSelectedAccountId(acc.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary text-white shadow-sm shadow-primary/20"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                <span
                  className="size-2 rounded-full"
                  style={{
                    backgroundColor: ACCOUNT_COLORS[acc.type] || "#10b981",
                  }}
                />
                <span className="truncate max-w-[120px]">{acc.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Account Quick Metric Cards */}
      {selectedAccount && selectedMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Current Balance
            </span>
            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(selectedMetrics.currentBalance)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Net Change
            </span>
            <div
              className={`text-sm sm:text-base font-black flex items-center gap-1 ${
                selectedMetrics.delta >= 0
                  ? "text-emerald-500"
                  : "text-rose-500"
              }`}
            >
              {selectedMetrics.delta >= 0 ? (
                <TrendingUp className="size-3.5 shrink-0" />
              ) : (
                <TrendingDown className="size-3.5 shrink-0" />
              )}
              <span>
                {selectedMetrics.delta >= 0 ? "+" : ""}
                {formatCurrency(selectedMetrics.delta)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Peak Balance
            </span>
            <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(selectedMetrics.peak)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 space-y-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Node Type
            </span>
            <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-primary">
              {selectedAccount.type}
            </div>
          </div>
        </div>
      )}

      {/* Responsive Visual Chart */}
      <div className="h-[220px] sm:h-[280px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {selectedAccountId !== "all" && selectedAccount ? (
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="accountGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={
                      ACCOUNT_COLORS[selectedAccount.type] || "#10b981"
                    }
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={
                      ACCOUNT_COLORS[selectedAccount.type] || "#10b981"
                    }
                    stopOpacity={0.0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200/50 dark:text-white/5"
              />
              <XAxis
                dataKey="dateFormatted"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={45}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickFormatter={(val: number) => formatCompact(val)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const val = Number(payload[0]?.value) || 0;
                    return (
                      <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          {label}
                        </span>
                        <div className="text-sm font-black text-white">
                          {formatCurrency(val)}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 block">
                          {selectedAccount.name}
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={selectedAccount.id}
                stroke={ACCOUNT_COLORS[selectedAccount.type] || "#10b981"}
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#accountGradient)"
              />
            </AreaChart>
          ) : (
            <BarChart
              data={activeAccounts.map((acc) => ({
                name: acc.name,
                type: acc.type,
                balance: acc.balance,
                color: ACCOUNT_COLORS[acc.type] || "#10b981",
              }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-slate-200/50 dark:text-white/5"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 700 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={45}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickFormatter={(val: number) => formatCompact(val)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0]?.payload;
                    return (
                      <div className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs space-y-1">
                        <span className="text-xs font-black text-white block">
                          {item.name}
                        </span>
                        <div className="text-sm font-black text-emerald-400">
                          {formatCurrency(item.balance)}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                          Type: {item.type}
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="balance" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {activeAccounts.map((acc, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={ACCOUNT_COLORS[acc.type] || "#10b981"}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
