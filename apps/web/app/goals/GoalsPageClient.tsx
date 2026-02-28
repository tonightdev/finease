"use client";

import { useState } from "react";
import { MOCK_GOALS } from "@/lib/mock-data";
import { EditGoalModal } from "@/components/goals/EditGoalModal";

export default function GoalsPageClient() {
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  // Simple Savings Gap Calculator
  const calculateGap = (goal: typeof MOCK_GOALS[0]) => {
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const monthsRemaining = (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth());
    
    if (monthsRemaining <= 0) return 0;
    
    const shortfall = goal.targetAmount - goal.currentAmount;
    return shortfall / monthsRemaining;
  };

  const totalRequiredMonthly = MOCK_GOALS.reduce((acc, goal) => acc + calculateGap(goal), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-wrap justify-between items-end gap-4 px-1 mb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-slate-900 dark:text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">North Star Goals</h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-normal max-w-2xl">
            Track your progress towards your most critical financial milestones. You should be saving <span className="text-primary font-bold">₹{totalRequiredMonthly.toLocaleString(undefined, {maximumFractionDigits:0})}/mo</span> to meet all targets.
          </p>
        </div>
        <button 
          onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/25"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          <span>Add Goal</span>
        </button>
      </div>

      <div className="flex flex-col gap-6 mt-4">
        {MOCK_GOALS.map(goal => {
          const reqMonthly = calculateGap(goal);
          const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100).toFixed(1);

          return (
            <div key={goal.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex gap-4 min-w-[200px]">
                  <div className="size-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-2xl">flag</span>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-slate-900 dark:text-white font-bold text-lg">{goal.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Target: {new Date(goal.targetDate).toLocaleDateString()}</p>
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs font-bold w-fit">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span>
                      <span>Requires: ₹{reqMonthly.toLocaleString(undefined, {maximumFractionDigits:0})}/mo</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center gap-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Progress</span>
                        <span className="text-slate-900 dark:text-white font-bold text-xl">₹{goal.currentAmount.toLocaleString()} <span className="text-sm text-slate-400 font-normal">/ ₹{goal.targetAmount.toLocaleString()}</span></span>
                      </div>
                      <span className="text-primary font-bold text-xl">{percent}%</span>
                    </div>

                    <div className="relative h-4 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="absolute h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-slate-400">Started: {new Date(goal.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center items-end min-w-[120px] border-l border-slate-100 dark:border-slate-700 pl-4 lg:pl-8">
                  <button className="w-full py-2 px-4 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white text-sm font-semibold transition-colors mb-2">
                      Top Up
                  </button>
                  <button 
                    onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }}
                    className="w-full py-2 px-4 rounded-lg text-primary hover:bg-primary/10 text-sm font-semibold transition-colors"
                  >
                      Edit Details
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
          console.log("Saving goal", id, data);
          setIsGoalModalOpen(false);
        }}
      />
    </div>
  );
}
