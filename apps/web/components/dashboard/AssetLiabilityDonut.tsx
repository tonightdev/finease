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
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">
          {payload[0]?.name}
        </p>
        <p className="text-sm font-black text-white leading-none">
          {formatCurrency(payload[0]?.value || 0)}
        </p>
      </div>
    );
  }
  return null;
};

export function AssetAllocationDonut({
  data,
}: {
  data: (AssetAllocationData & { type?: "asset" | "liability" })[];
}) {
  const assetsTotal = data.filter(d => d.type !== 'liability').reduce((acc, curr) => acc + curr.value, 0);
  const liabilitiesTotal = data.filter(d => d.type === 'liability').reduce((acc, curr) => acc + curr.value, 0);
  const netWorth = assetsTotal - liabilitiesTotal;
  
  const ghostData = [{ value: 1 }];

  return (
    <Card
      title="Wealth Split"
      subtitle="Asset distribution - Your capital across classes"
      className="flex flex-col h-full shadow-none border-slate-100 dark:border-slate-800"
    >
      <div className="flex flex-col items-center justify-center flex-1 gap-6 py-4">
        <div className="relative w-48 h-48 group">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ghostData}
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={82}
                dataKey="value"
                stroke="none"
                fill="#94a3b808"
                isAnimationActive={false}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={88}
                paddingAngle={data.length > 1 ? 4 : 0}
                dataKey="value"
                stroke="none"
                cornerRadius={data.length > 1 ? 8 : 0}
                animationBegin={0}
                animationDuration={1500}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-80 transition-all cursor-pointer outline-none filter drop-shadow-sm"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6 text-center overflow-hidden">
            <span className="text-slate-400 text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 truncate w-full">
              Net Worth
            </span>
            <span className="text-slate-900 dark:text-white text-lg font-black tracking-tighter leading-none truncate w-full">
              {formatCurrency(netWorth)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-4 w-full px-4">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 group/item w-[calc(50%-0.75rem)] min-w-[120px]">
              <div
                className="w-1 h-7 rounded-sm transition-transform group-hover/item:scale-y-110"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[7px] text-slate-400 font-black uppercase tracking-[0.15em] mb-0.5 flex items-center gap-1.5 truncate">
                  {item.name}
                  <span className={`text-[8px] font-bold ${item.type === 'liability' ? 'text-rose-500' : 'text-primary'}`}>
                    {assetsTotal > 0 ? `${item.type === 'liability' ? '-' : ''}${Math.round((item.value / assetsTotal) * 100)}%` : '0%'}
                  </span>
                </span>
                <span className={`text-[11px] font-black truncate ${item.type === 'liability' ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                  {item.type === 'liability' ? '-' : ''}{formatCurrency(item.value)}
                </span>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="w-full text-center py-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              No Asset Data Available
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
