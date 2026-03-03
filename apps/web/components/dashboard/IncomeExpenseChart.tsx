"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, type TooltipProps } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ComparisonData {
  name: string;
  income: number;
  expense: number;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const income = (payload[0]?.value as number | undefined) ?? 0;
    const expense = (payload[1]?.value as number | undefined) ?? 0;
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Income</span>
            <span className="text-sm font-black text-emerald-500">{formatCurrency(income)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Expense</span>
            <span className="text-sm font-black text-rose-500">{formatCurrency(expense)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

export function IncomeExpenseChart({ data }: { data: ComparisonData[] }) {
  return (
    <div className="h-[380px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="income" 
            name="Income" 
            fill="#10b981" 
            radius={[4, 4, 0, 0]} 
            barSize={15}
          />
          <Bar 
            dataKey="expense" 
            name="Expense" 
            fill="#ef4444" 
            radius={[4, 4, 0, 0]} 
            barSize={15}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
