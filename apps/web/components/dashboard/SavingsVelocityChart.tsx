"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface VelocityData {
  month: string;
  velocity: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black text-primary">{formatCurrency(payload[0]?.value || 0)} saved</p>
      </div>
    );
  }
  return null;
};

export function SavingsVelocityChart({ data }: { data: VelocityData[] }) {
  return (
    <div className="h-[380px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="velocity" 
            stroke="#135bec" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#135bec', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
