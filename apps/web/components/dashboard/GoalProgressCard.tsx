"use client";

import { Target, CheckCircle, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency } from "@/lib/utils";

interface GoalProgressProps {
  name: string;
  targetAmount: number;
  currentAmount: number;
  percentageSaved: number;
  expectedPercentage: number;
}

export function GoalProgressCard({
  name,
  targetAmount,
  currentAmount,
  percentageSaved,
  expectedPercentage,
}: GoalProgressProps) {
  const diff = percentageSaved - expectedPercentage;
  const status = diff >= 0 ? (diff > 5 ? "ahead" : "ontrack") : "behind";

  const statusConfig = {
    ahead: {
      label: "Ahead of schedule",
      badge: "ahead",
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      color: "text-emerald-600",
    },
    ontrack: {
      label: "On Track",
      badge: "ontrack",
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      color: "text-blue-600",
    },
    behind: {
      label: `Behind by ${Math.abs(Math.round(diff))}%`,
      badge: "behind",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      color: "text-red-500",
    },
  };

  const currentStatus = statusConfig[status as keyof typeof statusConfig];

  return (
    <Card className="flex flex-col p-3.5 gap-3 bg-white dark:bg-surface-dark border-slate-200 dark:border-border-dark group hover:border-primary/50 transition-all shadow-sm rounded-2xl">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 border border-indigo-100 dark:border-indigo-500/20">
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 dark:text-white text-sm font-black truncate max-w-[100px] sm:max-w-[150px] tracking-tight">
              {name}
            </p>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              {Math.round(percentageSaved)}% ARCHIEVED
            </p>
          </div>
        </div>
        <Badge
          variant={
            currentStatus.badge as "ahead" | "behind" | "ontrack" | "default"
          }
          className="text-[9px] px-1.5 py-0 border font-black uppercase tracking-widest"
        >
          {currentStatus.badge}
        </Badge>
      </div>

      <div className="space-y-2">
        <ProgressBar
          progress={percentageSaved}
          expectedPace={expectedPercentage}
          barClassName={status === "behind" ? "bg-red-500" : "bg-indigo-500"}
        />

        <div className="flex justify-between items-center pt-1 border-t border-slate-50 dark:border-white/5">
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">
              Balance
            </span>
            <span className="text-[10px] font-black text-slate-900 dark:text-white">
              {formatCurrency(currentAmount)}
            </span>
          </div>
          <div className="flex flex-col items-end">
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
