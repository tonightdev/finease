"use client";

import { Target } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/lib/utils";

interface GoalProgressProps {
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentageSaved: number;
  expectedPercentage: number;
  requirementPerMonth?: number;
}

export function GoalProgressCard({
  name,
  targetAmount,
  currentAmount,
  percentageSaved,
  expectedPercentage,
  requirementPerMonth,
}: GoalProgressProps) {
  const diff = percentageSaved - expectedPercentage;
  const status = diff >= 0 ? (diff > 5 ? "ahead" : "ontrack") : "behind";

  return (
    <Card className="flex flex-col gap-2 p-2.5 bg-white dark:bg-surface-dark border-slate-200 dark:border-border-dark group hover:border-primary/50 transition-all shadow-sm rounded-2xl">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 border border-indigo-100 dark:border-indigo-500/20">
            <Target className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 dark:text-white text-[11px] font-black truncate max-w-[100px] sm:max-w-[150px] tracking-tight">
              {name}
            </p>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">
              {Math.round(percentageSaved)}% ACHIEVED
            </p>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0 ${
            status === "ahead"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : status === "ontrack"
                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          }`}
        >
          {status === "ahead"
            ? "⚡ Ahead"
            : status === "ontrack"
              ? "🎯 On Track"
              : `⏳ Lagging ${Math.abs(Math.round(diff))}%`}
        </div>
      </div>

      <div className="space-y-1.5">
        <ProgressBar
          progress={percentageSaved}
          expectedPace={expectedPercentage}
          barClassName={
            status === "ahead"
              ? "bg-emerald-500"
              : status === "ontrack"
                ? "bg-indigo-500"
                : "bg-amber-500"
          }
        />

        <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-white/5">
          <div className="flex flex-col gap-0.5">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Balance
            </span>
            <span className="text-[10px] font-black text-slate-900 dark:text-white">
              {formatCurrency(currentAmount)}
            </span>
          </div>
          {requirementPerMonth !== undefined && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[7px] font-black text-primary uppercase tracking-widest leading-none">
                Monthly Target
              </span>
              <span className="text-[10px] font-black text-primary">
                {formatCurrency(Math.ceil(requirementPerMonth))}
              </span>
            </div>
          )}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Objective
            </span>
            <span className="text-[10px] font-black text-slate-500">
              {formatCurrency(targetAmount)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
