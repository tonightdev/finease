"use client";

import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Transaction } from "@repo/types";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { SavingsVelocityChart } from "@/components/dashboard/SavingsVelocityChart";
import { TrendingDown, ArrowUpRight, Activity, Percent } from "lucide-react";

type ViewType = "Monthly" | "Quarterly" | "Yearly";

export default function ReportsPageClient() {
  const [viewType, setViewType] = useState<ViewType>("Monthly");
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const transactions = useSelector((state: RootState) => state.transactions.items);
  const categories = useSelector((state: RootState) => state.categories.items);
  const stats = useSelector((state: RootState) => state.stats.data);
  const user = useSelector((state: RootState) => state.user.profile);

  const budgetTargets = user?.budgetTargets || { needs: 50, wants: 30, savings: 20 };

  const netWorth = accounts.reduce((sum: number, acc: { type: string; balance: number }) => acc.type !== 'debt' ? sum + acc.balance : sum - acc.balance, 0);
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(currentMonth / 3);

  // Calculate Net Worth Change percentage
  const netWorthChange = useMemo(() => {
    const history = stats.netWorthHistory || [];
    if (history.length < 2) return 0;
    const last = history[history.length - 1]?.value || 0;
    const prev = history[history.length - 2]?.value || 0;
    if (prev === 0) return 0;
    return parseFloat(((last - prev) / prev * 100).toFixed(1));
  }, [stats.netWorthHistory]);

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
  const outflow = filteredTx.filter((tx: Transaction) => tx.type === 'expense').reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);

  // Trend data labels
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  const trendData = months.map((month, idx) => {
    const monthTx = transactions.filter(tx => {
      if (tx.status === 'pending_confirmation') return false;
      const d = new Date(tx.date);
      return d.getMonth() === idx && d.getFullYear() === currentYear;
    });
    const mInflow = monthTx.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const mOutflow = monthTx.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    return {
      name: month,
      income: mInflow,
      expense: mOutflow,
      velocity: mInflow - mOutflow
    };
  }).filter(d => d.income > 0 || d.expense > 0);

  const categoryTotals = filteredTx.filter((tx: Transaction) => tx.type === 'expense').reduce((acc: Record<string, number>, tx: Transaction) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const expenseBreakdown = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => {
      const catSettings = categories.find(c => c.name === category);
      return {
        category,
        amount,
        percent: outflow > 0 ? (amount / outflow) * 100 : 0,
        color: catSettings?.color || "bg-slate-500"
      };
    });

  const getPeriodLabel = () => {
    if (viewType === "Monthly") return `${months[currentMonth]} ${currentYear}`;
    if (viewType === "Quarterly") return `Q${currentQuarter + 1} ${currentYear}`;
    return `${currentYear} Full Year`;
  };

  const fiftyThirtyTwenty = useMemo(() => {
    let needs = 0;
    let wants = 0;
    let savings = 0;

    filteredTx.forEach((tx: Transaction) => {
      if (tx.type === 'expense') {
        const cat = categories.find(c => c.name === tx.category);
        const pType = cat?.parentType || 'needs';
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-6 sm:space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Financial Intelligence</h1>
          <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base uppercase tracking-widest">Unified analytics & predictive insights for {getPeriodLabel()}.</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-900/50 p-1 sm:p-1.5 rounded-xl border border-slate-200/50 dark:border-white/5 w-fit">
           {(["Monthly", "Quarterly", "Yearly"] as ViewType[]).map((type) => (
             <button
               key={type}
               onClick={() => setViewType(type)}
               className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-200 ${
                 viewType === type 
                   ? "bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10" 
                   : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
               }`}
             >
               {type}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 sm:p-6 shadow-none border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-all group">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Total Net Worth</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">{formatCurrency(netWorth)}</div>
          <div className={`flex items-center gap-1.5 text-[10px] font-black ${netWorthChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
             <ArrowUpRight className={`w-3 h-3 ${netWorthChange < 0 ? 'rotate-90' : ''}`} />
             {netWorthChange >= 0 ? 'GROWING' : 'DECLINING'} {Math.abs(netWorthChange)}%
          </div>
        </Card>
        
        <Card className="p-5 sm:p-6 shadow-none border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 transition-all group">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Period Inflow</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-500 mb-2">{formatCurrency(inflow)}</div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
             <Activity className="w-3 h-3" />
             ACTIVE STREAMS
          </div>
        </Card>

        <Card className="p-5 sm:p-6 shadow-none border-slate-100 dark:border-slate-800 hover:border-rose-500/50 transition-all group">
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1 group-hover:text-rose-500 transition-colors">Period Outflow</div>
          <div className="text-xl sm:text-2xl font-black text-rose-500 mb-2">{formatCurrency(outflow)}</div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-500/80">
             <TrendingDown className="w-3 h-3" />
             TRACKED SPENDING
          </div>
        </Card>

        <Card className="p-5 sm:p-6 shadow-none border-slate-100 dark:border-slate-800 bg-primary/[0.03] border-primary/10 hover:bg-primary/[0.05] transition-all group">
          <div className="text-[10px] text-primary/60 font-black uppercase tracking-widest mb-1">Savings Rate</div>
          <div className="text-xl sm:text-2xl font-black text-primary mb-2">
            {inflow > 0 ? Math.round(((inflow - outflow) / inflow) * 100) : 0}%
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-primary/80">
             <Percent className="w-3 h-3" />
             STRATEGIC TARGET
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Cash Flow Dynamics</h3>
           <Card className="p-4 sm:p-8 shadow-none border-slate-100 dark:border-slate-800 overflow-hidden">
             <IncomeExpenseChart data={trendData} />
           </Card>
        </div>

        <div className="space-y-4">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Savings Velocity</h3>
           <Card className="p-4 sm:p-8 shadow-none border-slate-100 dark:border-slate-800 overflow-hidden">
             <SavingsVelocityChart data={trendData.map(d => ({ month: d.name, velocity: d.velocity }))} />
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
