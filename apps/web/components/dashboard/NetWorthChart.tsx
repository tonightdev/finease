"use client";

import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

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
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-xl font-black text-white">{formatCurrency(payload[0]?.value || 0)}</p>
        <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400">Stable Growth Pattern</span>
        </div>
      </div>
    );
  }
  return null;
};

export function NetWorthChart({ data, currentNetWorth, percentageChange }: NetWorthChartProps) {
  const [period, setPeriod] = useState("1Y");

  return (
    <Card 
      className="h-[480px] overflow-hidden group shadow-none border-slate-100 dark:border-slate-800 relative"
      title="Wealth Pulse"
      subtitle="Comprehensive net worth trajectory"
      headerAction={
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-white/5">
          {["1M", "6M", "1Y", "ALL"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${period === p ? "bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10" : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"}`}
            >
              {p}
            </button>
          ))}
        </div>
      }
    >
      <div className="mb-10 flex items-end justify-between">
        <div className="space-y-1">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Liquidity</div>
          <div className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white flex items-baseline gap-3">
            {formatCurrency(currentNetWorth)}
            <div className="flex flex-col">
              <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {percentageChange}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-[300px] w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#135bec" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
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
              tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 800 }}
              interval="preserveStartEnd"
              dy={15}
            />
            <YAxis 
              hide
              domain={['dataMin * 0.98', 'dataMax * 1.02']}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: '#135bec', strokeWidth: 1.5, strokeDasharray: '6 6' }} 
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#135bec"
              strokeWidth={5}
              strokeLinecap="round"
              fillOpacity={1}
              fill="url(#wealthGradient)"
              animationDuration={2500}
              filter="url(#glow)"
              activeDot={{ r: 8, fill: '#135bec', stroke: '#fff', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
