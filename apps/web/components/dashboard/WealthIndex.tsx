"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { motion } from "framer-motion";
import { Shield, Zap, Target } from "lucide-react";

export function WealthIndex() {
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const goals = useSelector((state: RootState) => state.goals.items);
  const transactions = useSelector((state: RootState) => state.transactions.items);

  const scoreData = useMemo(() => {
    // 1. Savings Rate Calculation (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const periodTx = transactions.filter(tx => new Date(tx.date) >= thirtyDaysAgo);
    const income = periodTx.filter(tx => tx.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = periodTx.filter(tx => tx.type === "expense").reduce((s, t) => s + t.amount, 0);
    
    const savingsRate = income > 0 ? (income - expense) / income : 0;
    const savingsScore = Math.min(40, Math.max(0, savingsRate * 100 * 0.4));

    // 2. Liquidity Calculation
    const liquidCapital = accounts
      .filter(a => !a.excludeFromAnalytics && !a.isClosed && (a.type === 'bank' || a.type === 'cash'))
      .reduce((s, a) => s + a.balance, 0);
    
    // Safety check for division by zero
    const avgMonthlyExpense = Math.max(1, expense || 50000); 
    const runwayMonths = liquidCapital / avgMonthlyExpense;
    // 3 months runway = 15 points, 6 months = 30 points
    const liquidityScore = Math.min(30, Math.max(0, (runwayMonths / 6) * 30));

    // 3. Goal Pacing
    const activeGoals = goals.filter(g => g.currentAmount < g.targetAmount);
    const avgGoalProgress = activeGoals.length > 0 
      ? activeGoals.reduce((s, g) => s + Math.min(1, (g.currentAmount / Math.max(1, g.targetAmount))), 0) / activeGoals.length
      : 1; // 100% if no active goals
    const goalScore = Math.min(30, avgGoalProgress * 30);

    const totalScore = Math.round(savingsScore + liquidityScore + goalScore);

    return {
      totalScore,
      savingsRate: Math.round(savingsRate * 100),
      runwayMonths: runwayMonths.toFixed(1),
      goalProgress: Math.round(avgGoalProgress * 100),
    };
  }, [accounts, goals, transactions]);

  // Gauge colors
  const getColor = (score: number) => {
    if (score > 80) return "text-emerald-500 stroke-emerald-500";
    if (score > 60) return "text-primary stroke-primary";
    if (score > 40) return "text-amber-500 stroke-amber-500";
    return "text-rose-500 stroke-rose-500";
  };

  const percentage = scoreData.totalScore;
  const strokeDasharray = `${percentage}, 100`;

  return (
    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 p-5 rounded-[2rem] shadow-sm relative overflow-hidden group">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 size-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-6">
          <div className="space-y-0.5">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Financial Health</h3>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest opacity-60">Overall Status</p>
          </div>
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5">
            <Shield className="size-4 text-slate-400" />
          </div>
        </div>

        <div className="relative size-40 sm:size-48 flex items-center justify-center">
          {/* SVG Gauge */}
          <svg viewBox="0 0 36 36" className="size-full -rotate-90 transition-all duration-1000">
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-slate-100 dark:text-white/5"
            />
            <motion.circle
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray={strokeDasharray}
              strokeDashoffset="0"
              strokeLinecap="round"
              className={getColor(percentage)}
              initial={{ strokeDasharray: "0, 100" }}
              animate={{ strokeDasharray }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <motion.span 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 dark:text-white"
            >
              {percentage || 0}
            </motion.span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Health Score</span>
          </div>
        </div>

        <div className="grid grid-cols-3 w-full gap-2 mt-8 py-4 border-t border-slate-100 dark:border-white/5">
          <div className="text-center space-y-1">
            <Zap className="size-3 text-emerald-500 mx-auto" />
            <p className="text-[10px] font-black text-slate-900 dark:text-white">{scoreData.savingsRate}%</p>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Savings</p>
          </div>
          <div className="text-center space-y-1 border-x border-slate-100 dark:border-white/5">
            <Shield className="size-3 text-primary mx-auto" />
            <p className="text-[10px] font-black text-slate-900 dark:text-white">{scoreData.runwayMonths}m</p>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Liquid</p>
          </div>
          <div className="text-center space-y-1">
            <Target className="size-3 text-amber-500 mx-auto" />
            <p className="text-[10px] font-black text-slate-900 dark:text-white">{scoreData.goalProgress}%</p>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Goals</p>
          </div>
        </div>
      </div>
    </div>
  );
}
