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
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { Plus, Target as TargetIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

export default function Home() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const goals = useSelector((state: RootState) => state.goals.items);
  const stats = useSelector((state: RootState) => state.stats.data);
  const transactions = useSelector((state: RootState) => state.transactions.items);
  const loading = useSelector((state: RootState) => state.accounts.loading || state.transactions.loading);

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

  if (loading && accounts.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-8 animate-pulse text-white">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        
        <div className="space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
              <Skeleton className="h-24 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 space-y-3 shadow-none border-slate-100 dark:border-slate-800">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6 w-full pb-8 lg:pb-8 pt-0">
      {/* Sticky Top Section */}
      <PageHeader
        title="Command Center"
        subtitle="Unified wealth landscape"
        actions={
          <button 
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center justify-center gap-2 h-8 px-4 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/20 w-full sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            Account
          </button>
        }
      />

      {/* Row 1: Account Lists at Top */}
      <div className="space-y-4">
            {regularAccounts.length > 0 && (
              <div className="space-y-2">
                <div className="bg-slate-50 dark:bg-white/5 -mx-4 px-4 py-1.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Liquid Capital</h3>
                  <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded tracking-[0.1em]">{regularAccounts.length} Units</span>
                </div>
                <AccountList accounts={regularAccounts} />
              </div>
            )}

            {investmentAccounts.length > 0 && (
              <div className="space-y-2">
                <div className="bg-slate-50 dark:bg-white/5 -mx-4 px-4 py-1.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Investment Portfolio</h3>
                  <span className="text-[8px] font-black text-indigo-500 uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded tracking-[0.1em]">{investmentAccounts.length} Assets</span>
                </div>
                <AccountList accounts={investmentAccounts} />
              </div>
            )}
      </div>

      {/* Row 2: Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border-none ring-1 ring-slate-100 dark:ring-white/5 p-4 rounded-2xl shadow-sm transition-all">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Net Worth</div>
          <div className="text-lg font-black text-slate-900 dark:text-white tracking-tighter truncate">₹{realTimeNetWorth.toLocaleString()}</div>
          <div className="mt-2 flex items-center gap-1.5">
             <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{netWorthChange >= 0 ? '+' : ''}{netWorthChange}%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-none ring-1 ring-slate-100 dark:ring-white/5 p-4 rounded-2xl shadow-sm transition-all">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Period Inflow</div>
          <div className="text-lg font-black text-emerald-500 tracking-tighter truncate">₹{(parseInt(insights.runwayMonths) * 0).toLocaleString() /* Placeholder for period flow logic if available, else 0 */} {insights.savingsRate}% Savings</div>
          <div className="mt-2 flex items-center gap-1.5">
             <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/10" />
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">30 Day Window</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-none ring-1 ring-slate-100 dark:ring-white/5 p-4 rounded-2xl shadow-sm transition-all">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Period Outflow</div>
          <div className="text-lg font-black text-rose-500 tracking-tighter truncate">₹{liabilities.toLocaleString() /* Using liabilities as a fallback or similar flow stat */}</div>
          <div className="mt-2 flex items-center gap-1.5">
             <div className="w-1 h-1 rounded-full bg-rose-500/20" />
             <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Efficiency 100%</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-none ring-1 ring-slate-100 dark:ring-white/5 p-4 rounded-2xl shadow-sm transition-all">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Freedom Score</div>
          <div className="text-lg font-black text-primary tracking-tighter truncate">{insights.freedomScore}</div>
          <div className="mt-2 flex items-center gap-1.5">
             <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
             <span className="text-[8px] font-black text-primary uppercase tracking-widest">{insights.status}</span>
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
                 <TargetIcon className="w-8 h-8 text-slate-300 dark:text-slate-700 opacity-50" />
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
