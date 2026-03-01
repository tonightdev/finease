"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

interface AssetAllocationData {
  name: string;
  value: number;
  color: string;
}

export function AssetAllocationDonut({ data }: { data: AssetAllocationData[] }) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <Card 
      title="Asset Allocation" 
      className="flex flex-col h-full"
    >
      <div className="flex flex-col items-center justify-center flex-1 gap-8 py-4">
        <div className="relative w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "#0f1115", 
                  border: "1px solid #2a2f3a",
                  borderRadius: "12px",
                  color: "#fff"
                }}
                formatter={(value: number) => [formatCurrency(value), "Value"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Net Assets</span>
            <span className="text-slate-900 dark:text-white text-xl font-black mt-0.5">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 w-full">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div 
                className="w-3 h-3 mt-1 rounded-full shadow-sm flex-shrink-0" 
                style={{ backgroundColor: item.color }} 
              />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                  {item.name} ({Math.round((item.value / total) * 100)}%)
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
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

