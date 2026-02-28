"use client";

import { useState } from "react";
import { NetWorthChart } from "@/components/dashboard/NetWorthChart";
import { AssetAllocationDonut } from "@/components/dashboard/AssetLiabilityDonut";
import { GoalProgressCard } from "@/components/dashboard/GoalProgressCard";
import { VerificationList } from "@/components/verification/VerificationList";
import { AccountList } from "@/components/accounts/AccountList";
import { TransferModal } from "@/components/accounts/TransferModal";
import { FileUploadZone } from "@/components/verification/FileUploadZone";
import { StatWidget } from "@/components/ui/StatWidget";
import type { ParsedTransaction } from "@/lib/csv-parser";

import { MOCK_STATS, MOCK_GOALS, MOCK_ACCOUNTS, MOCK_TRANSACTIONS } from "@/lib/mock-data";
import { Plus, RefreshCw, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Home() {
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState(MOCK_TRANSACTIONS);

  const handleApprove = (id: string) => {
    setPendingTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Financial Command Center</h1>
          <p className="text-slate-500 font-medium mt-1">Welcome back, Rahul. Here represents your unified wealth landscape.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsTransferOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
          <button className="p-2.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl text-slate-500 hover:text-primary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget 
          label="Cash Flow" 
          value="+₹2.45L" 
          subValue="This Month" 
          icon={<ArrowUpRight className="w-5 h-5" />} 
          iconBg="bg-emerald-500/10" 
          iconColor="text-emerald-500" 
        />
        <StatWidget 
          label="Total Expenses" 
          value="₹1.12L" 
          subValue="45% Savings Rate" 
          icon={<ArrowDownRight className="w-5 h-5" />} 
          iconBg="bg-blue-500/10" 
          iconColor="text-blue-500" 
        />
        <StatWidget 
          label="Unmatched Items" 
          value={pendingTransactions.length} 
          subValue="Awaiting Verification" 
          icon={<AlertCircle className="w-5 h-5" />} 
          iconBg="bg-amber-500/10" 
          iconColor="text-amber-500" 
        />
        <StatWidget 
          label="Net Change" 
          value="+₹12.5L" 
          subValue="YoY Growth" 
          icon={<RefreshCw className="w-5 h-5" />} 
          iconBg="bg-primary/10" 
          iconColor="text-primary" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Net Worth Chart (Lager Span) */}
        <div className="lg:col-span-2">
          <NetWorthChart 
            data={MOCK_STATS.netWorthHistory} 
            currentNetWorth={MOCK_STATS.netWorth} 
            percentageChange={12.5} 
          />
        </div>

        {/* Asset Allocation Donut */}
        <div className="lg:col-span-1">
          <AssetAllocationDonut data={MOCK_STATS.assetAllocation} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Goal Navigator */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Goal Navigator</h3>
            <button className="text-sm font-bold text-primary hover:underline">View All</button>
          </div>
          {MOCK_GOALS.map((goal) => {
            const pace = MOCK_STATS.goalPacing.find(p => p.goalId === goal.id);
            return (
              <GoalProgressCard 
                key={goal.id}
                name={goal.name}
                targetAmount={goal.targetAmount}
                currentAmount={goal.currentAmount}
                percentageSaved={pace?.actualPercentage || 0}
                expectedPercentage={pace?.expectedPercentage || 0}
                targetDate={goal.targetDate}
              />
            );
          })}
        </div>

        {/* Verification & Staging Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verification & Staging</h3>
            <p className="text-xs text-slate-500 font-medium">Stage your bank statements to reconcile accounts</p>
          </div>
          
          <FileUploadZone 
            onTransactionsParsed={(parsed: ParsedTransaction[]) => {
              const newTransactions = [{
                id: `staged-${Date.now()}`,
                userId: "user-1",
                accountId: "acc-1",
                amount: 1250,
                date: new Date().toISOString(),
                description: "Swiggy Delivery",
                category: "Food",
                type: "expense" as const,
                status: "pending" as const,
                metadata: {}
              }];
              setPendingTransactions(prev => [...newTransactions as any, ...prev]);
            }} 
          />


          <VerificationList 
            transactions={pendingTransactions} 
            onApprove={handleApprove}
            onReject={handleApprove}
          />
        </div>
      </div>


      {/* Account Management section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Managed Accounts</h3>
          <button className="text-sm font-bold text-primary hover:underline">Manage Connections</button>
        </div>
        <AccountList accounts={MOCK_ACCOUNTS} />
      </div>

      {/* Transfer UI */}
      <TransferModal 
        isOpen={isTransferOpen} 
        onClose={() => setIsTransferOpen(false)} 
        onTransfer={(amount) => {
          console.log("Transferring", amount);
          setIsTransferOpen(false);
        }} 
      />
    </div>
  );
}

