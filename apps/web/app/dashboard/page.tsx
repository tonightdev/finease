"use client";

import { useState, useMemo } from "react";
import { NetWorthChart } from "@/components/dashboard/NetWorthChart";
import { AssetAllocationDonut } from "@/components/dashboard/AssetLiabilityDonut";
import { GoalProgressCard } from "@/components/dashboard/GoalProgressCard";
import { AccountList } from "@/components/accounts/AccountList";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { createAccount, fetchAccounts } from "@/store/slices/accountsSlice";
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { FinancialGoal, AccountType } from "@repo/types";
import Link from "next/link";
import { useEffect } from "react";
import { Card } from "@/components/ui/Card";

import { useAuth } from "@/components/auth/AuthProvider";

export default function Home() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const goals = useSelector((state: RootState) => state.goals.items);
  const stats = useSelector((state: RootState) => state.stats.data);
  const transactions = useSelector((state: RootState) => state.transactions.items);

  useEffect(() => {
    if (user) {
      dispatch(fetchAccounts());
    }
  }, [dispatch, user]);

  const regularAccounts = accounts.filter(acc => acc.type === 'bank' || acc.type === 'cash' || acc.type === 'card');
  const investmentAccounts = accounts.filter(acc => acc.type === 'investment');
  const debts = accounts.filter(acc => acc.type === 'debt');

  const assets = accounts.filter(acc => acc.type !== 'debt').reduce((sum, item) => sum + item.balance, 0);
  const liabilities = Math.abs(debts.reduce((sum, item) => sum + item.balance, 0));
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

  // Computed Net Worth History (Last 6 Months)
  const computedNetWorthHistory = useMemo(() => {
    const history: { month: string; value: number; dateObj: Date }[] = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    
    // Create an initial array of the last 6 months (including current)
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        history.unshift({
            month: `${months[d.getMonth()]}`,
            value: 0,
            dateObj: d
        });
    }

    // Work backwards from the realTimeNetWorth to compute historical values
    let runningNW = realTimeNetWorth;
    // Set current month's calculated value
    history[5]!.value = runningNW;
    
    for (let i = 4; i >= 0; i--) {
        const nextMonthData = history[i+1]!;
        const nextMonth = nextMonthData.dateObj;
        
        // Find transactions that happened in nextMonth to reverse them
        const txInNextMonth = transactions.filter(tx => {
            if (tx.status === 'pending_confirmation') return false;
            const txDate = new Date(tx.date);
            return txDate.getMonth() === nextMonth.getMonth() && txDate.getFullYear() === nextMonth.getFullYear();
        });

        // Reversing: if we earned income, the past NW was LOWER. If we spent, the past NW was HIGHER.
        const netFlowNextMonth = txInNextMonth.reduce((acc, tx) => {
            return acc + (tx.type === 'income' ? tx.amount : -tx.amount);
        }, 0);

        runningNW = runningNW - netFlowNextMonth;
        history[i]!.value = runningNW;
    }

    return history.map(h => ({ month: h.month, value: h.value > 0 ? h.value : 0 }));
  }, [transactions, realTimeNetWorth]);

  // Net Worth Change percentage
  const netWorthChange = useMemo(() => {
    if (computedNetWorthHistory.length < 2) return 0;
    const last = computedNetWorthHistory[computedNetWorthHistory.length - 1]?.value || 0;
    const prev = computedNetWorthHistory[computedNetWorthHistory.length - 2]?.value || 0;
    if (prev === 0) return last > 0 ? 100 : 0;
    return parseFloat(((last - prev) / prev * 100).toFixed(1));
  }, [computedNetWorthHistory]);

  // Dynamic Insights Calculation
  const insights = useMemo(() => {
    const now = new Date();
    const last30Days = transactions.filter(tx => {
      if (tx.status === 'pending_confirmation') return false;
      const d = new Date(tx.date);
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    const monthlyIncome = last30Days.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const monthlyExpense = last30Days.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    
    // Average monthly expense baseline (fallback to 1 if 0 to avoid Infinity)
    const avgExpense = monthlyExpense || (assets * 0.05) || 1;
    const runwayMonths = (assets / avgExpense).toFixed(1);
    
    // Freedom Score Logic
    const runwayScore = Math.min(50, (parseFloat(runwayMonths) / 24) * 50);
    const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpense) / monthlyIncome : 0;
    const savingsScore = Math.min(25, savingsRate * 100);
    const goalScore = goals.length > 0 ? (goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount), 0) / goals.length) * 25 : 0;
    
    const freedomScore = (runwayScore + savingsScore + goalScore).toFixed(1);
    
    let status = "Stabilizing";
    if (parseFloat(freedomScore) > 80) status = "Excellent";
    else if (parseFloat(freedomScore) > 60) status = "Strong";
    else if (parseFloat(freedomScore) > 40) status = "Moderate";

    // Dynamic Suggestion
    const incompleteGoal = goals.find(g => g.currentAmount < g.targetAmount);
    const suggestion = incompleteGoal 
      ? `Increasing saving rate by 5% reaches "${incompleteGoal.name}" approx. ${Math.ceil((incompleteGoal.targetAmount - incompleteGoal.currentAmount) / (avgExpense * 0.05))} days faster.`
      : "You've reached all your primary goals! Time to set a new milestone.";

    return {
      runwayMonths,
      freedomScore,
      status,
      suggestion,
      savingsRate: (savingsRate * 100).toFixed(0)
    };
  }, [transactions, assets, goals]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 space-y-6 sm:space-y-10 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">Financial Command Center</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base uppercase tracking-widest">Welcome back, {user?.displayName || "Dhaval Pithwa"}. Unified wealth landscape.</p>
        </div>
        <div className="flex items-stretch mt-2 sm:mt-0">
          <button 
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-95 w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Account
          </button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-surface-dark border-none ring-1 ring-slate-100 dark:ring-white/5 p-5 sm:p-6 rounded-2xl shadow-sm group hover:ring-primary/50 transition-all bg-gradient-to-br from-white to-slate-50 dark:from-surface-dark dark:to-surface-dark/50">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 group-hover:text-primary transition-colors">Net Worth</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter truncate">₹ {realTimeNetWorth.toLocaleString()}</div>
          <div className="mt-3 flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">{netWorthChange >= 0 ? '+' : ''}{netWorthChange}% Growth</span>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark border-none ring-1 ring-slate-100 dark:ring-white/5 p-5 sm:p-6 rounded-2xl shadow-sm group hover:ring-emerald-500/50 transition-all bg-gradient-to-br from-white to-slate-50 dark:from-surface-dark dark:to-surface-dark/50">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 group-hover:text-emerald-500 transition-colors">Asset Power</div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter truncate">₹ {assets.toLocaleString()}</div>
          <div className="mt-3 flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-white/10" />
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Consolidated</span>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark border-none ring-1 ring-slate-100 dark:ring-white/5 p-5 sm:p-6 rounded-2xl shadow-sm group hover:ring-rose-500/50 transition-all bg-gradient-to-br from-white to-slate-50 dark:from-surface-dark dark:to-surface-dark/50">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 group-hover:text-rose-500 transition-colors">Liabilities</div>
          <div className="text-2xl sm:text-3xl font-black text-rose-500 tracking-tighter truncate">₹ {liabilities.toLocaleString()}</div>
          <div className="mt-3 flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-rose-500/20" />
             <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">Optimized</span>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark border-none ring-1 ring-slate-100 dark:ring-white/5 p-5 sm:p-6 rounded-2xl shadow-sm group hover:ring-primary/50 transition-all bg-gradient-to-br from-white to-slate-50 dark:from-surface-dark dark:to-surface-dark/50">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 group-hover:text-primary transition-colors">Goal Progress</div>
          <div className="text-2xl sm:text-3xl font-black text-primary tracking-tighter truncate">{goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount * 100), 0) / goals.length) : 0}%</div>
          <div className="mt-3 flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">On Track</span>
          </div>
        </div>
      </div>

      {/* Row 1: Split, Goals, Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:items-stretch">
        <AssetAllocationDonut data={realTimeAssetAllocation.length > 0 ? realTimeAssetAllocation : stats.assetAllocation} />
        
        <div className="space-y-4 flex flex-col">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Goal Velocity</h3>
              <Link href="/goals" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline transition-colors">View Map</Link>
            </div>
            
            <div className="flex-1 space-y-3">
            {goals.length === 0 ? (
              <div className="h-full p-10 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3">
                 <span className="material-symbols-outlined text-slate-300 text-3xl">target</span>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No goals defined</p>
              </div>
            ) : (
                goals.slice(0, 3).map((goal: FinancialGoal) => {
                  const pace = stats.goalPacing.find((pByGoal: { goalId: string; expectedPercentage: number; actualPercentage: number }) => pByGoal.goalId === goal.id);
                  return (
                    <GoalProgressCard 
                      key={goal.id}
                      name={goal.name}
                      targetAmount={goal.targetAmount}
                      currentAmount={goal.currentAmount}
                      percentageSaved={pace?.actualPercentage || 0}
                      expectedPercentage={pace?.expectedPercentage || 0}
                    />
                  );
                })
            )}
            </div>
          </div>

          <Card className="p-7 bg-slate-900 border-none relative overflow-hidden group shadow-2xl shadow-indigo-500/10 transition-transform active:scale-[0.98] min-h-[300px] flex flex-col justify-center">
             <div className="relative z-10">
               <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-2 leading-none">Portfolio Insights</div>
               <h4 className="text-white font-black text-xl mb-3 tracking-tight">Financial Freedom Score</h4>
               <div className="flex items-end gap-3 mb-5">
                 <span className="text-5xl font-black text-white leading-none tracking-tighter">{insights.freedomScore}</span>
                 <span className={`${insights.status === 'Excellent' ? 'text-emerald-500' : 'text-primary'} font-bold text-xs mb-1.5 uppercase tracking-widest`}>{insights.status}</span>
               </div>
               <p className="text-slate-400 text-sm font-medium leading-relaxed">
                 Assets cover <span className="text-white font-bold tracking-tight">{insights.runwayMonths} months</span> of expenses. 
                 {insights.suggestion}
               </p>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/30 transition-all duration-700" />
          </Card>
      </div>

      {/* Row 2: Wealth Pulse */}
      <div>
        <NetWorthChart 
            data={computedNetWorthHistory} 
            currentNetWorth={realTimeNetWorth} 
            percentageChange={netWorthChange} 
        />
      </div>

      {/* Row 3: Account Lists */}
      <div className="space-y-8">
            {regularAccounts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Liquid Capital</h3>
                  <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded tracking-widest">{regularAccounts.length} Units</span>
                </div>
                <AccountList accounts={regularAccounts} />
              </div>
            )}

            {investmentAccounts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Investment Portfolio</h3>
                  <span className="text-[10px] font-black text-indigo-500 uppercase bg-indigo-500/10 px-2 py-0.5 rounded tracking-widest">{investmentAccounts.length} Assets</span>
                </div>
                <AccountList accounts={investmentAccounts} />
              </div>
            )}
      </div>

      {/* Transfer UI Overlay */}
      <AddAccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        onSave={(data) => {
          dispatch(createAccount({
            name: data.name,
            type: data.type as AccountType,
            assetType: "",
            balance: parseFloat(data.balance) || 0,
            minimumBalance: parseFloat(data.minimumBalance || "0") || 0,
            maxLimit: parseFloat(data.maxLimit || "0") || 0,
            currency: "INR",
          }));
          setIsAccountModalOpen(false);
        }} 
      />
    </div>
  );
}
