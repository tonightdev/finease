"use client";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { addGoal, updateGoal } from "@/store/slices/goalsSlice";
import { EditGoalModal } from "@/components/goals/EditGoalModal";
import { FinancialGoal } from "@repo/types";
import { formatDate } from "@/lib/utils";
import { TopUpModal } from "@/components/goals/TopUpModal";
import toast from "react-hot-toast";

export default function GoalsPageClient() {
  const dispatch = useDispatch();
  const goals = useSelector((state: RootState) => state.goals.items);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [topUpGoal, setTopUpGoal] = useState<FinancialGoal | null>(null);
  // Simple Savings Gap Calculator
  const calculateGap = (goal: FinancialGoal) => {
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const monthsRemaining = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
    
    if (monthsRemaining <= 0) return 0;
    
    const shortfall = goal.targetAmount - goal.currentAmount;
    return shortfall / monthsRemaining;
  };

  const totalRequiredMonthly = goals.reduce((acc: number, goal: FinancialGoal) => acc + calculateGap(goal), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 lg:mb-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 dark:text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">Goals</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base font-normal max-w-2xl">
            Track your progress towards your most critical financial milestones. You should be saving <span className="text-primary font-bold">₹{totalRequiredMonthly.toLocaleString(undefined, {maximumFractionDigits:0})}/mo</span> to meet all targets.
          </p>
        </div>
        <div className="flex items-stretch w-full sm:w-auto">
          <button 
            onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/25 active:scale-95 w-full sm:w-auto"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            <span>Add Goal</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 mt-4">
        {goals.map((goal: FinancialGoal) => {
          const reqMonthly = calculateGap(goal);
          const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100).toFixed(1);

          return (
            <div key={goal.id} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
               {/* Background Decorative Element */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
               
              <div className="flex flex-col gap-6 relative z-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-3xl">target</span>
                    </div>
                    <div className="flex flex-col">
                      <h3 className="text-slate-900 dark:text-white font-black text-xl tracking-tight">{goal.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Target:</span>
                        <span className="text-slate-900 dark:text-slate-200 text-xs font-black">{formatDate(goal.targetDate)}</span>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-widest border border-orange-100 dark:border-orange-500/20">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
                        <span>₹{reqMonthly.toLocaleString(undefined, {maximumFractionDigits:0})}/mo req.</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-primary font-black text-2xl tracking-tighter">{percent}%</div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end px-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">Position</span>
                      <span className="text-slate-900 dark:text-white font-black text-2xl tracking-tighter">
                        ₹{goal.currentAmount.toLocaleString()} 
                        <span className="text-sm text-slate-400 font-normal tracking-tight ml-2">/ ₹{goal.targetAmount.toLocaleString()}</span>
                      </span>
                    </div>
                  </div>

                  <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(59,130,246,0.3)]" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                    <span>Started {formatDate(goal.startDate)}</span>
                    <span>{Math.round(goal.targetAmount - goal.currentAmount).toLocaleString()} Left</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50 dark:border-white/5">
                  <button 
                    onClick={() => { setTopUpGoal(goal); setIsTopUpModalOpen(true); }}
                    className="flex-1 py-3 px-4 rounded-xl bg-primary text-white hover:bg-primary-dark text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                      <span className="material-symbols-outlined text-lg">payments</span>
                      Top Up
                  </button>
                  <button 
                    onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                      <span className="material-symbols-outlined text-lg">edit</span>
                      Edit
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <EditGoalModal 
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        editingGoal={editingGoal}
        onSave={(id, data) => {
          if (id) {
            const existing = goals.find((g: FinancialGoal) => g.id === id);
            if (existing) {
              dispatch(updateGoal({ ...existing, ...data }));
              toast.success("Goal updated");
            }
          } else {
            dispatch(addGoal({
              id: `goal-${Date.now()}`,
              userId: "user-1",
              name: data.name,
              targetAmount: data.targetAmount,
              currentAmount: 0,
              targetDate: data.targetDate,
              startDate: new Date().toISOString(),
              category: "General"
            }));
            toast.success("Goal created");
          }
          setIsGoalModalOpen(false);
        }}
      />

      <TopUpModal 
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        goal={topUpGoal}
        onSave={(amount) => {
          if (topUpGoal) {
            dispatch(updateGoal({
              ...topUpGoal,
              currentAmount: topUpGoal.currentAmount + amount
            }));
            toast.success(`Invested ₹${amount.toLocaleString()} in ${topUpGoal.name}`);
          }
          setIsTopUpModalOpen(false);
        }}
      />
    </div>
  );
}
