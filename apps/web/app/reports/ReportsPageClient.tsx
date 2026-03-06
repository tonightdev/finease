"use client";

import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { Transaction, Account, Category } from "@repo/types";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { SavingsVelocityChart } from "@/components/dashboard/SavingsVelocityChart";
import { TrendingDown, ArrowUpRight, Activity, Percent } from "lucide-react";
import { fetchTransactions } from "@/store/slices/transactionsSlice";
import { fetchAccounts } from "@/store/slices/accountsSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchGoals } from "@/store/slices/goalsSlice";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";

type ViewType = "Monthly" | "Quarterly" | "Yearly";

const EMPTY_ACCOUNTS: Account[] = [];
const EMPTY_TRANSACTIONS: Transaction[] = [];
const EMPTY_CATEGORIES: Category[] = [];

export default function ReportsPageClient() {
  const [viewType, setViewType] = useState<ViewType>("Monthly");
  const dispatch = useDispatch<AppDispatch>();
  const accounts = useSelector((state: RootState) => state.accounts?.items) ?? EMPTY_ACCOUNTS;
  const transactions = useSelector((state: RootState) => state.transactions?.items) ?? EMPTY_TRANSACTIONS;
  const categories = useSelector((state: RootState) => state.categories?.items) ?? EMPTY_CATEGORIES;
  const user = useSelector((state: RootState) => state.user?.profile);
  const loading = useSelector((state: RootState) => state.transactions?.loading || state.accounts?.loading);

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchTransactions());
    dispatch(fetchCategories());
    dispatch(fetchGoals());
  }, [dispatch]);

  const budgetTargets = user?.budgetTargets || { needs: 50, wants: 30, savings: 20 };

  const assets = accounts.filter((acc: { type: string }) => acc.type !== 'debt').reduce((sum: number, item: { balance: number }) => sum + item.balance, 0);
  const liabilities = Math.abs(accounts.filter((acc: { type: string }) => acc.type === 'debt').reduce((sum: number, item: { balance: number }) => sum + item.balance, 0));
  const netWorth = assets - liabilities;
  const now = useMemo(() => new Date(), []);
  
  // Determine the most recent period with data
  const latestData = useMemo(() => {
    if (transactions.length === 0) return { year: now.getFullYear(), month: now.getMonth() };
    const validTx = transactions.filter(t => t.status !== 'pending_confirmation');
    if (validTx.length === 0) return { year: now.getFullYear(), month: now.getMonth() };
    
    // Sort to find the absolute latest transaction date
    const sorted = [...validTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const d = new Date(sorted[0]!.date);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [transactions, now]);

  const currentYear = latestData.year;
  const currentMonth = viewType === "Monthly" ? latestData.month : now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3);

  // Calculate Net Worth History (Last 6 Months) similar to Dashboard
  const computedNetWorthHistory = useMemo(() => {
    const history: { month: string; value: number; dateObj: Date }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        history.unshift({
            month: `${monthNames[d.getMonth()]}`,
            value: 0,
            dateObj: d
        });
    }

    let runningNW = netWorth;
    history[5]!.value = runningNW;
    
    for (let i = 4; i >= 0; i--) {
        const nextMonthData = history[i+1]!;
        const nextMonth = nextMonthData.dateObj;
        
        const txInNextMonth = transactions.filter(tx => {
            if (tx.status === 'pending_confirmation') return false;
            const txDate = new Date(tx.date);
            return txDate.getMonth() === nextMonth.getMonth() && txDate.getFullYear() === nextMonth.getFullYear();
        });

        const netFlowNextMonth = txInNextMonth.reduce((acc, tx) => {
            return acc + (tx.type === 'income' ? tx.amount : -tx.amount);
        }, 0);

        runningNW = runningNW - netFlowNextMonth;
        history[i]!.value = runningNW > 0 ? runningNW : 0;
    }

    return history;
  }, [transactions, netWorth, now]);

  // Calculate Net Worth Change percentage
  const netWorthChange = useMemo(() => {
    if (computedNetWorthHistory.length < 2) return 0;
    const last = computedNetWorthHistory[computedNetWorthHistory.length - 1]?.value || 0;
    const prev = computedNetWorthHistory[computedNetWorthHistory.length - 2]?.value || 0;
    if (prev === 0) return last > 0 ? 100 : 0;
    return parseFloat(((last - prev) / prev * 100).toFixed(1));
  }, [computedNetWorthHistory]);

  // Filtering logic based on viewType
  const filteredTx = transactions.filter((tx: Transaction) => {
    if (tx.status === 'pending_confirmation') return false;
    const d = new Date(tx.date);
    const txYear = d.getFullYear();
    const txMonth = d.getMonth();

    if (txYear !== currentYear) return false;

    if (viewType === "Monthly") {
      return txMonth === currentMonth;
    } else if (viewType === "Quarterly") {
      const txQuarter = Math.floor(txMonth / 3);
      return txQuarter === currentQuarter;
    } else {
      // Yearly
      return true;
    }
  });

  const inflow = filteredTx.filter((tx: Transaction) => tx.type === 'income').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
  const outflow = filteredTx.filter((tx: Transaction) => tx.type === 'expense' || tx.type === 'transfer').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

  // Trend data labels - Dynamic based on viewType
  const trendData = useMemo(() => {
    const data = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    if (viewType === 'Monthly') {
      // Monthly view: Show daily data for the selected month
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dayTx = transactions.filter(tx => {
          if (tx.status === 'pending_confirmation') return false;
          const d = new Date(tx.date);
          return d.getDate() === i && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const mInflow = dayTx.filter((tx: Transaction) => tx.type === 'income').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
        const mOutflow = dayTx.filter((tx: Transaction) => tx.type === 'expense' || tx.type === 'transfer').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

        data.push({
          name: `${i}`,
          income: mInflow,
          expense: mOutflow,
          velocity: mInflow - mOutflow
        });
      }
    } else if (viewType === 'Quarterly') {
      // Quarterly view: Show 3 months of the quarter
      const startMonth = currentQuarter * 3;
      for (let i = 0; i < 3; i++) {
        const m = startMonth + i;
        const monthTx = transactions.filter(tx => {
          if (tx.status === 'pending_confirmation') return false;
          const d = new Date(tx.date);
          return d.getMonth() === m && d.getFullYear() === currentYear;
        });

        const mInflow = monthTx.filter((tx: Transaction) => tx.type === 'income').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
        const mOutflow = monthTx.filter((tx: Transaction) => tx.type === 'expense' || tx.type === 'transfer').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

        data.push({
          name: monthNames[m] || '???',
          income: mInflow,
          expense: mOutflow,
          velocity: mInflow - mOutflow
        });
      }
    } else {
      // Yearly view: Show all 12 months
      for (let i = 0; i < 12; i++) {
        const monthTx = transactions.filter(tx => {
          if (tx.status === 'pending_confirmation') return false;
          const d = new Date(tx.date);
          return d.getMonth() === i && d.getFullYear() === currentYear;
        });

        const mInflow = monthTx.filter((tx: Transaction) => tx.type === 'income').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
        const mOutflow = monthTx.filter((tx: Transaction) => tx.type === 'expense' || tx.type === 'transfer').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

        data.push({
          name: monthNames[i] || '???',
          income: mInflow,
          expense: mOutflow,
          velocity: mInflow - mOutflow
        });
      }
    }
    return data;
  }, [transactions, viewType, currentYear, currentMonth, currentQuarter]);

  const categoryTotals = filteredTx
    .filter((tx: Transaction) => tx.type === 'expense' || tx.type === 'transfer')
    .reduce((acc: Record<string, number>, tx: Transaction) => {
      const catKey = tx.category || 'transfer';
      acc[catKey] = (acc[catKey] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

  const expenseBreakdown = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([catKey, amount]) => {
      const catSettings = categories.find(c => c.id === catKey || c.name === catKey);
      
      let displayName = catKey;
      let color = "bg-slate-500";

      if (catSettings) {
        displayName = catSettings.name;
        color = catSettings.color;
      } else if (catKey === 'transfer') {
        displayName = 'Transfers & Scaling';
        color = "bg-primary";
      }

      return {
        category: displayName,
        amount,
        percent: outflow > 0 ? (amount / outflow) * 100 : 0,
        color
      };
    });



  const fiftyThirtyTwenty = useMemo(() => {
    let needs = 0;
    let wants = 0;
    let savings = 0;

    filteredTx.forEach((tx: Transaction) => {
      if (tx.type === 'expense' || tx.type === 'transfer') {
        const cat = categories.find(c => c.id === tx.category || c.name === tx.category);
        const pType = cat?.parentType || (tx.type === 'transfer' ? 'savings' : 'needs');
        if (pType === 'needs') needs += tx.amount;
        else if (pType === 'wants') wants += tx.amount;
        else if (pType === 'savings') savings += tx.amount;
      }
    });

    return {
      needs: { amount: needs, percent: outflow > 0 ? (needs / outflow) * 100 : 0 },
      wants: { amount: wants, percent: outflow > 0 ? (wants / outflow) * 100 : 0 },
      savings: { amount: savings, percent: outflow > 0 ? (savings / outflow) * 100 : 0 }
    };
  }, [filteredTx, categories, outflow]);

  if (loading && transactions.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-8 animate-pulse">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-8 h-[400px] shadow-none border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="flex-1 w-full" />
          </Card>
          <Card className="p-8 h-[400px] shadow-none border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="flex-1 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-4 sm:space-y-6 pb-20 lg:pb-8 pt-0">
      {/* Sticky Header Group */}
      <PageHeader
        title="Intelligence"
        subtitle="Unified analytics & predictive insights"
        actions={
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 w-fit">
             {(["Monthly", "Quarterly", "Yearly"] as ViewType[]).map((type) => (
               <button
                 key={type}
                 onClick={() => setViewType(type)}
                 className={`px-4 h-9 flex items-center text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewType === type ? "bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10" : "text-slate-500"}`}
               >
                 {type}
               </button>
             ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6 shadow-none border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-all group">
          <div className="text-xs font-bold text-slate-400 mb-2 group-hover:text-primary transition-colors">Net Worth</div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mb-2 truncate shrink-0">{formatCurrency(netWorth)}</div>
          <div className={`flex items-center gap-1.5 text-[10px] font-black ${netWorthChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
             <ArrowUpRight className={`w-3 h-3 ${netWorthChange < 0 ? 'rotate-90' : ''}`} />
             <span className="truncate">{netWorthChange >= 0 ? '+' : ''}{netWorthChange}%</span>
          </div>
        </Card>
        
        <Card className="p-4 sm:p-6 shadow-none border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 transition-all group">
          <div className="text-xs font-bold text-slate-400 mb-2 group-hover:text-emerald-500 transition-colors">Inflow</div>
          <div className="text-lg sm:text-2xl font-black text-emerald-500 mb-2 truncate shrink-0">{formatCurrency(inflow)}</div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
             <Activity className="w-3 h-3" />
             <span className="truncate leading-none">STREAMS</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 shadow-none border-slate-100 dark:border-slate-800 hover:border-rose-500/50 transition-all group">
          <div className="text-xs font-bold text-slate-400 mb-2 group-hover:text-rose-500 transition-colors">Outflow</div>
          <div className="text-lg sm:text-2xl font-black text-rose-500 mb-2 truncate shrink-0">{formatCurrency(outflow)}</div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-500/80">
             <TrendingDown className="w-3 h-3" />
             <span className="truncate leading-none">TRACKED</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 shadow-none border-slate-100 dark:border-slate-800 bg-primary/[0.03] border-primary/10 hover:bg-primary/[0.05] transition-all group">
          <div className="text-xs font-bold text-primary/60 mb-2">Savings</div>
          <div className="text-lg sm:text-2xl font-black text-primary mb-2 truncate shrink-0">
            {inflow > 0 ? Math.round(((inflow - outflow) / inflow) * 100) : 0}%
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-primary/80">
             <Percent className="w-3 h-3" />
             <span className="truncate leading-none">RATE</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Cash Flow Dynamics</h3>
            <Card className="p-4 sm:p-8 shadow-none border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px] flex items-center justify-center">
              {trendData.some(d => d.income > 0 || d.expense > 0) ? (
                <IncomeExpenseChart data={trendData} />
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No historical flux detected</p>
                </div>
              )}
            </Card>
        </div>

        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Savings Velocity</h3>
           <Card className="p-4 sm:p-8 shadow-none border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px] flex items-center justify-center">
              {trendData.some(d => Math.abs(d.velocity) > 0) ? (
                <SavingsVelocityChart data={trendData.map(d => ({ month: d.name, velocity: d.velocity }))} />
              ) : (
                <div className="text-center py-12">
                  <TrendingDown className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Velocity engine idle</p>
                </div>
              )}
           </Card>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Budget Target Benchmark</h3>
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Total Outflow: {formatCurrency(outflow)}</span>
        </div>
        <Card className="p-6 sm:p-8 shadow-none border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Needs</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{Math.round(fiftyThirtyTwenty.needs.percent)}% / Target {budgetTargets.needs}%</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(fiftyThirtyTwenty.needs.amount)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`bg-indigo-500 h-full rounded-full transition-all duration-1000 group-hover:opacity-80`} 
                  style={{ width: `${Math.min(fiftyThirtyTwenty.needs.percent, 100)}%` }}
                />
              </div>
            </div>

            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Wants</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{Math.round(fiftyThirtyTwenty.wants.percent)}% / Target {budgetTargets.wants}%</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(fiftyThirtyTwenty.wants.amount)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`bg-pink-500 h-full rounded-full transition-all duration-1000 group-hover:opacity-80`} 
                  style={{ width: `${Math.min(fiftyThirtyTwenty.wants.percent, 100)}%` }}
                />
              </div>
            </div>

            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Savings & Inv.</span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{Math.round(fiftyThirtyTwenty.savings.percent)}% / Target {budgetTargets.savings}%</span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(fiftyThirtyTwenty.savings.amount)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`bg-emerald-500 h-full rounded-full transition-all duration-1000 group-hover:opacity-80`} 
                  style={{ width: `${Math.min(fiftyThirtyTwenty.savings.percent, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Expense Intensity Breakdown</h3>
        <Card className="p-6 sm:p-8 shadow-none border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-6 sm:gap-y-8">
            {expenseBreakdown.map(e => (
              <div key={e.category} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{e.category}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{Math.round(e.percent)}% CONTRIBUTION</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(e.amount)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`${e.color} h-full rounded-full transition-all duration-1000 group-hover:opacity-80`} 
                    style={{ width: `${e.percent}%` }}
                  />
                </div>
              </div>
            ))}
            {expenseBreakdown.length === 0 && (
              <div className="col-span-full py-12 sm:py-20 text-center">
                 <Activity className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No transaction data traced</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
