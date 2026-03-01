"use client";

import { useState } from "react";
import { NetWorthChart } from "@/components/dashboard/NetWorthChart";
import { AssetAllocationDonut } from "@/components/dashboard/AssetLiabilityDonut";
import { GoalProgressCard } from "@/components/dashboard/GoalProgressCard";
import { AccountList } from "@/components/accounts/AccountList";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { addAccount } from "@/store/slices/accountsSlice";
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { FinancialGoal } from "@repo/types";
import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";

export default function Home() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const goals = useSelector((state: RootState) => state.goals.items);
  const stats = useSelector((state: RootState) => state.stats.data);

  const regularAccounts = accounts.filter(acc => acc.type !== 'investment' && acc.type !== 'loan');
  const investmentAccounts = accounts.filter(acc => acc.type === 'investment');
  const loans = accounts.filter(acc => acc.type === 'loan');

  const assets = accounts.filter(acc => acc.type !== 'loan').reduce((sum, item) => sum + item.balance, 0);
  const liabilities = Math.abs(loans.reduce((sum, item) => sum + item.balance, 0));
  const realTimeNetWorth = assets - liabilities;

  // Real-time asset allocation from investments
  const allocationMap: Record<string, number> = {};
  investmentAccounts.forEach(inv => {
    allocationMap[inv.assetType || 'Other'] = (allocationMap[inv.assetType || 'Other'] || 0) + inv.balance;
  });
  
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
  const realTimeAssetAllocation = Object.entries(allocationMap).map(([name, value], idx) => ({
    name,
    value,
    color: colors[idx % colors.length] || '#000000'
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Financial Command Center</h1>
          <p className="text-slate-500 font-medium mt-1">Welcome back, {user?.displayName || "User"}. Here represents your unified wealth landscape.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto mt-4 md:mt-0">
          <button 
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-primary/25 active:scale-95 w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Account
          </button>
        </div>
      </div>



{regularAccounts.length > 0 && (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Accounts</h3>
        <AccountList accounts={regularAccounts} />
      </div>
)}

      {investmentAccounts.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Investments</h3>
          <AccountList accounts={investmentAccounts} />
        </div>
      )}

      {loans.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Liabilities</h3>
          <AccountList accounts={loans} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <NetWorthChart 
            data={stats.netWorthHistory || []} 
            currentNetWorth={realTimeNetWorth} 
            percentageChange={0} 
          />
        </div>
        <div className="lg:col-span-1">
          <AssetAllocationDonut data={realTimeAssetAllocation.length > 0 ? realTimeAssetAllocation : stats.assetAllocation} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Goal Navigator</h3>
          <Link href="/goals" className="text-sm font-bold text-primary hover:underline">View All</Link>
        </div>
        
        {goals.length === 0 ? (
          <p className="text-sm text-slate-500">No goals set up yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {goals.map((goal: FinancialGoal) => {
              const pace = stats.goalPacing.find((p: { goalId: string; expectedPercentage: number; actualPercentage: number }) => p.goalId === goal.id);
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
        )}
      </div>

      {/* Transfer UI */}
      <AddAccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        onSave={(data) => {
          dispatch(addAccount({
            id: `acc-${Date.now()}`,
            userId: "user-1",
            name: data.name,
            type: data.type as "bank" | "cash" | "loan" | "investment" | "card",
            assetType: "",
            balance: parseFloat(data.balance) || 0,
            currency: "INR",
            lastSyncedAt: new Date().toISOString()
          }));
          setIsAccountModalOpen(false);
        }} 
      />
    </div>
  );
}

