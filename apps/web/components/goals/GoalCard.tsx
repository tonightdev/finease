"use client";

import React from "react";
import { FinancialGoal } from "@repo/types";
import { formatDate } from "@/lib/utils";
import { Wallet, Pencil, Trash2 } from "lucide-react";

interface GoalCardProps {
  goal: FinancialGoal;
  onTopUp: (goal: FinancialGoal) => void;
  onEdit: (goal: FinancialGoal) => void;
  onDelete: (goal: FinancialGoal) => void;
  className?: string;
}

export function GoalCard({
  goal,
  onTopUp,
  onEdit,
  onDelete,
  className,
}: GoalCardProps) {
  const isCompleted = goal.currentAmount >= goal.targetAmount;
  const percentNum = (goal.currentAmount / goal.targetAmount) * 100;
  const percent = Math.min(100, percentNum).toFixed(1);

  const calculateGap = (g: FinancialGoal) => {
    const today = new Date();
    const targetDate = new Date(g.targetDate);
    const monthsRemaining =
      (targetDate.getFullYear() - today.getFullYear()) * 12 +
      (targetDate.getMonth() - today.getMonth());

    if (monthsRemaining <= 0) return 0;
    const shortfall = g.targetAmount - g.currentAmount;
    return shortfall / monthsRemaining;
  };

  const reqMonthly = calculateGap(goal);

  // Calculate pace
  const today = new Date();
  const targetDate = new Date(goal.targetDate);
  const createdDate = goal.startDate
    ? new Date(goal.startDate)
    : goal.createdAt
      ? new Date(goal.createdAt)
      : new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
  const totalDays = Math.max(
    1,
    (targetDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const elapsedDays = Math.max(
    0,
    (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const expectedPace = Math.min(100, (elapsedDays / totalDays) * 100);
  const paceDiff = percentNum - expectedPace;
  const paceStatus =
    paceDiff >= 0 ? (paceDiff > 5 ? "ahead" : "ontrack") : "behind";

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3.5 sm:p-4 rounded-2xl flex flex-col justify-between group shadow-sm hover:shadow-md transition-all h-full ${
        className || ""
      }`}
    >
      <div>
        {/* Header: Name, Target Date, Status Badge & Percent */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-slate-900 dark:text-white font-black text-xs sm:text-sm tracking-tight leading-snug break-words uppercase">
              {goal.name}
            </h3>
            <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-1">
              Target: {formatDate(goal.targetDate)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                isCompleted
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : paceStatus === "ahead"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : paceStatus === "ontrack"
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              }`}
            >
              {isCompleted
                ? "✓ Done"
                : paceStatus === "ahead"
                  ? "⚡ Ahead"
                  : paceStatus === "ontrack"
                    ? "🎯 On Track"
                    : "⏳ Lagging"}
            </span>
            <div className="text-[9px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 tracking-wider">
              {percent}%
            </div>
          </div>
        </div>

        {/* Progress Values & Bar */}
        <div className="space-y-1.5 my-3">
          <div className="flex justify-between items-baseline gap-1 text-[11px] sm:text-xs">
            <span
              data-balance="true"
              className="font-black text-slate-900 dark:text-white cloaked-balance"
            >
              ₹{goal.currentAmount.toLocaleString("en-IN")}
            </span>
            <span className="text-[9px] font-bold text-slate-400">
              Target: ₹{goal.targetAmount.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isCompleted
                  ? "bg-emerald-500"
                  : paceStatus === "ahead"
                    ? "bg-emerald-500"
                    : paceStatus === "ontrack"
                      ? "bg-primary"
                      : "bg-amber-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400 mt-1.5">
            <span>
              {isCompleted
                ? "Goal Accomplished"
                : `Gap: ₹${Math.max(
                    0,
                    goal.targetAmount - goal.currentAmount,
                  ).toLocaleString("en-IN")}`}
            </span>
            {!isCompleted && reqMonthly > 0 && (
              <span className="text-orange-500 font-black">
                ₹
                {reqMonthly.toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })}
                /mo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons: Always Visible */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/5 mt-auto">
        {!isCompleted && (
          <button
            type="button"
            onClick={() => onTopUp(goal)}
            className="flex-1 px-2.5 py-1.5 rounded-xl bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors hover:bg-primary/20 active:scale-95 cursor-pointer"
          >
            <Wallet className="size-3" />
            <span>Top Up</span>
          </button>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-colors active:scale-95 cursor-pointer"
            title="Edit Goal"
          >
            <Pencil className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal)}
            className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors active:scale-95 cursor-pointer"
            title="Delete Goal"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoalCard;
