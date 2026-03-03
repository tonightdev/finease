"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

interface AssetAllocationData {
  name: string;
  value: number;
  color: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: AssetAllocationData }[];
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-2xl ring-1 ring-white/10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">{payload[0]?.name}</p>
        <p className="text-sm font-black text-white leading-none">{formatCurrency(payload[0]?.value || 0)}</p>
      </div>
    );
  }
  return null;
};

export function AssetAllocationDonut({ data }: { data: AssetAllocationData[] }) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const ghostData = [{ value: 1 }];

  return (
    <Card 
      title="Wealth Split" 
      subtitle="Asset distribution"
      className="flex flex-col h-full shadow-none border-slate-100 dark:border-slate-800"
    >
      <div className="flex flex-col items-center justify-center flex-1 gap-6 py-4">
        <div className="relative w-44 h-44 group">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ghostData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={80}
                dataKey="value"
                stroke="none"
                fill="#94a3b810"
                isAnimationActive={false}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={data.length > 1 ? 6 : 0}
                dataKey="value"
                stroke="none"
                cornerRadius={data.length > 1 ? 10 : 0}
                animationBegin={0}
                animationDuration={1500}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    className="hover:opacity-80 transition-opacity cursor-pointer outline-none shadow-xl" 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-slate-400 text-[8px] font-black uppercase tracking-[0.2em] mb-0.5">Total</span>
            <span className="text-slate-900 dark:text-white text-xl font-black">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-4 w-full px-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 group/item">
              <div 
                className="w-1 h-6 rounded-full transition-transform group-hover/item:scale-y-125" 
                style={{ backgroundColor: item.color }} 
              />
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5 flex items-center gap-1">
                  {item.name}
                  <span className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 font-bold">
                    {total > 0 ? Math.round((item.value / total) * 100) : 0}%
                  </span>
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {formatCurrency(item.value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
