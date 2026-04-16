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
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { motion } from "framer-motion";
import { TrendingUp, Sunrise, ArrowRight } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

interface NetWorthChartProps {
  data: { month: string; value: number }[];
  currentNetWorth: number;
  percentageChange: number;
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
            Stable Growth Pattern
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
}: NetWorthChartProps) {
  const [period, setPeriod] = useState("1M");
  const [projectionMonths, setProjectionMonths] = useState(0);

  const chartData = useMemo(() => {
    if (projectionMonths === 0) return data;
    
    // Calculate velocity (avg growth per month)
    const lastPoint = data[data.length - 1];
    const firstPoint = data[0];
    if (!lastPoint || !firstPoint) return data;
    
    const velocity = (lastPoint.value - firstPoint.value) / Math.max(1, data.length - 1);
    const result = [...data.map(d => ({ ...d, isProjected: false }))];
    
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const lastMonthIdx = months.indexOf(lastPoint.month);
    
    for (let i = 1; i <= projectionMonths; i++) {
        const nextMonth = months[(lastMonthIdx + i) % 12]!;
        result.push({
            month: nextMonth,
            value: Math.max(0, lastPoint.value + (velocity * i)),
            isProjected: true
        } as any);
    }
    
    return result;
  }, [data, projectionMonths]);

  return (
    <Card
      className="h-auto min-h-[380px] sm:min-h-[420px] lg:min-h-[480px] group shadow-none border-slate-100 dark:border-slate-800 relative"
      title="Net Worth Trend"
      subtitle="Comprehensive balance trajectory"
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
      <div className="mb-6 sm:mb-10 flex items-end justify-between">
        <div className="space-y-0.5 sm:space-y-1">
          <div className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Total Balance
          </div>
          <div className="text-xl xs:text-2xl sm:text-3xl lg:text-5xl font-black tracking-tighter text-slate-900 dark:text-white flex items-baseline gap-2 sm:gap-3 flex-wrap">
            <AnimatedNumber value={currentNetWorth} prefix="₹" />
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs font-black text-emerald-500 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 h-3" />
                {percentageChange}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[220px] xs:h-[240px] sm:h-[280px] lg:h-[320px] w-full pb-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
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
              className="hidden sm:block"
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
            <YAxis hide domain={["dataMin * 0.98", "dataMax * 1.02"]} />
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
              data={chartData.filter(d => !(d as any).isProjected || d === data[data.length-1])}
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
            {projectionMonths > 0 && (
              <Area
                type="monotone"
                data={chartData.filter((d, i) => (d as any).isProjected || i === data.length - 1)}
                dataKey="value"
                stroke="#135bec"
                strokeWidth={3}
                strokeDasharray="5 5"
                strokeLinecap="round"
                fill="transparent"
                activeDot={{
                  r: 6,
                  fill: "#135bec",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Financial Horizon Slider */}
      <div className="pt-6 sm:pt-8 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Sunrise className="size-3.5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Future Projection</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.15em]">Gaze into the future</p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase">+{projectionMonths} Months</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={projectionMonths}
            onChange={(e) => setProjectionMonths(parseInt(e.target.value))}
            className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
        
        {projectionMonths > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between"
          >
            <p className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none">
              Projected Net Worth: <span className="font-black underline underline-offset-4 decoration-primary/30">{formatCurrency(chartData[chartData.length - 1]?.value || 0)}</span> by {chartData[chartData.length - 1]?.month}
            </p>
            <ArrowRight className="size-3 text-primary animate-pulse" />
          </motion.div>
        )}
      </div>
    </Card>
  );
}
