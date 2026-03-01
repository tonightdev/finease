"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { ExpenseChart } from "@/components/dashboard/ExpenseChart";
import { Transaction } from "@repo/types";

export default function ReportsPageClient() {
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const transactions = useSelector((state: RootState) => state.transactions.items);
  const categories = useSelector((state: RootState) => state.categories.items);

  const netWorth = accounts.reduce((sum: number, acc: { type: string, balance: number }) => acc.type !== 'loan' ? sum + acc.balance : sum - acc.balance, 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const currentMonthTx = transactions.filter((tx: Transaction) => {
    const d = new Date(tx.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const inflow = currentMonthTx.filter((tx: Transaction) => tx.type === 'income').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
  const outflow = currentMonthTx.filter((tx: Transaction) => tx.type === 'expense').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

  const categoryTotals = currentMonthTx.filter((tx: Transaction) => tx.type === 'expense').reduce((acc: Record<string, number>, tx: Transaction) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const expenseBreakdown = Object.entries(categoryTotals)
    .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
    .map(([category, amount]: [string, number]) => {
      const catSettings = categories.find((c: { name: string; color?: string }) => c.name === category);
      return {
        category,
        amount: amount,
        percent: outflow > 0 ? (amount / outflow) * 100 : 0,
        color: catSettings?.color || "bg-slate-500"
      };
    });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Analytics for current month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Net Worth</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">₹ {netWorth.toLocaleString()}</h2>
            <span className="text-sm font-semibold text-slate-500">Live</span>
          </div>
        </div>
        
        <div className="p-5 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Cash Flow</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-bold text-emerald-500">₹ {inflow.toLocaleString()}</h2>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Inflow</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="text-2xl font-bold text-rose-500">₹ {outflow.toLocaleString()}</h2>
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Outflow</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Portfolio Organic Growth</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className={`text-3xl font-bold ${inflow - outflow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ₹ {(inflow - outflow).toLocaleString()}
            </h2>
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
