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
      color: "text-emerald-600"
    },
    ontrack: { 
      label: "On Track", 
      badge: "ontrack",
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      color: "text-blue-600"
    },
    behind: { 
      label: `Behind by ${Math.abs(Math.round(diff))}%`, 
      badge: "behind",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      color: "text-red-500"
    }
  };

  const currentStatus = statusConfig[status as keyof typeof statusConfig];

  return (
    <Card className="flex flex-col p-4 gap-3 bg-white dark:bg-surface-dark border-slate-200 dark:border-border-dark group hover:border-primary/50 transition-all">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 border border-indigo-100 dark:border-indigo-500/20">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <p className="text-slate-900 dark:text-white text-sm font-bold truncate max-w-[120px] sm:max-w-[200px]">{name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{Math.round(percentageSaved)}% SAVED</p>
          </div>
        </div>
        <Badge variant={currentStatus.badge as "ahead" | "behind" | "ontrack" | "default"} className="text-[10px] px-1.5 py-0">
          {currentStatus.label}
        </Badge>
      </div>

      <div className="space-y-2">
        <ProgressBar 
          progress={percentageSaved} 
          expectedPace={expectedPercentage}
          barClassName={status === 'behind' ? 'bg-red-500' : 'bg-indigo-500'}
        />
        
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          <span>{formatCurrency(currentAmount)}</span>
          <span>Target: {formatCurrency(targetAmount)}</span>
        </div>
      </div>
    </Card>
  );
}

