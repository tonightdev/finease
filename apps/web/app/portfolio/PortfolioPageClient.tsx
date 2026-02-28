"use client";

import { MOCK_STATS } from "@/lib/mock-data";
import { useState } from "react";
import { NetWorthChart } from "@/components/dashboard/NetWorthChart";
import { AddInvestmentModal } from "@/components/portfolio/AddInvestmentModal";

export default function PortfolioPageClient() {
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);
  const assets = MOCK_STATS.assetAllocation.reduce((sum, item) => sum + item.value, 0);
  // Simple mock deduction for liabilities
  const liabilities = 350000; 
  const netWorth = assets - liabilities;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Investment Portfolio</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your wealth growth across all asset classes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-border-dark dark:bg-surface-dark dark:text-slate-200 dark:hover:bg-surface-hover transition">
            <span className="material-symbols-outlined text-lg">download</span>
            Export
          </button>
          <button 
            onClick={() => setIsAddInvestmentOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-lg text-sm font-medium text-white hover:bg-primary-dark transition shadow-lg shadow-primary/25"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Investment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Net Worth</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹ {(netWorth).toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-2">Assets - Liabilities</div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Total Invested (Assets)</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹ {assets.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-2">Current Value</div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <span className="material-symbols-outlined">credit_card</span>
            </div>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Liabilities</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹ {liabilities.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-2">Active Loans</div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
              <span className="material-symbols-outlined">percent</span>
            </div>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Portfolio XIRR</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">18.4%</div>
          <div className="text-xs text-slate-500 mt-2">Annualized Return</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 mt-8">
        <NetWorthChart data={MOCK_STATS.netWorthHistory} currentNetWorth={netWorth} percentageChange={12.5} />
      </div>

      <AddInvestmentModal 
        isOpen={isAddInvestmentOpen}
        onClose={() => setIsAddInvestmentOpen(false)}
        onSave={(data) => {
          console.log("Saving investment", data);
          setIsAddInvestmentOpen(false);
        }}
      />
    </div>
  );
}
