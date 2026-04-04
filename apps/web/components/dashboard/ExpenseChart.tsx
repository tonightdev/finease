"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { useState } from "react";

interface ExpenseData {
  category: string;
  amount: number;
  isBounce: boolean;
}

interface ExpenseChartProps {
  data: ExpenseData[];
  showBounce: boolean;
}

export function ExpenseChart({ data, showBounce }: ExpenseChartProps) {
  const [view, setView] = useState<"all" | "organic">("all");

  const filteredData = data.filter((item) => {
    if (!showBounce && item.isBounce) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6 glass-card h-[350px] sm:h-[400px]"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Expense Breakdown</h3>
          <p className="text-sm text-gray-400">Where your money goes</p>
        </div>
        <div className="flex bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setView("all")}
            className={`px-3 py-1 text-xs rounded-md transition-all ${view === "all" ? "bg-brand-accent text-white" : "text-gray-400 hover:text-white"}`}
          >
            Total
          </button>
          <button
            onClick={() => setView("organic")}
            className={`px-3 py-1 text-xs rounded-md transition-all ${view === "organic" ? "bg-brand-accent text-white" : "text-gray-400 hover:text-white"}`}
          >
            Organic
          </button>
        </div>
      </div>

      <div className="h-[230px] sm:h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredData} layout="vertical">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff10"
              horizontal={false}
            />
            <XAxis type="number" hide />
            <YAxis
              dataKey="category"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              width={80}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
                color: "#fff",
              }}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {filteredData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isBounce ? "#ef444499" : "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-gray-400">Regular</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-400/60" />
          <span className="text-gray-400">Bounce (One-off)</span>
        </div>
      </div>
    </motion.div>
  );
}
