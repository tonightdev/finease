"use client";

import { MOCK_STATS } from "@/lib/mock-data";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";

export default function ReportsPageClient() {
  const expenseBreakdown = [
    { category: "Housing", amount: 24000, percent: 45, color: "bg-indigo-500" },
    { category: "Food & Dining", amount: 12500, percent: 25, color: "bg-orange-500" },
    { category: "Transport", amount: 8200, percent: 15, color: "bg-blue-500" },
    { category: "Shopping", amount: 5100, percent: 10, color: "bg-pink-500" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Analytics for Oct 2023</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Net Worth</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">₹ {MOCK_STATS.netWorth.toLocaleString()}</h2>
            <span className="text-sm font-semibold text-emerald-500">+12.4%</span>
          </div>
        </div>
        
        <div className="p-5 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Cash Flow</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">₹ 1,24,000</h2>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Inflow</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: "65%" }}></div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Portfolio Organic Growth</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">₹ 5,20,000</h2>
            <span className="text-sm font-semibold text-emerald-500">↑ 12.5%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 mt-8">
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Cash Flow Trends</h3>
           <ExpenseChart data={expenseBreakdown.map(e => ({
             category: e.category,
             amount: e.amount,
             isBounce: false
           }))} showBounce={false} />
        </div>
        
        <div className="lg:col-span-1 p-6 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Spending Heatmap</h3>
          <div className="space-y-4">
            {expenseBreakdown.map(e => (
              <div key={e.category} className="group">
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-slate-600 dark:text-slate-300">{e.category}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">₹ {e.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-surface-darker rounded-full h-2">
                  <div className={`${e.color} h-2 rounded-full`} style={{ width: `${e.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
