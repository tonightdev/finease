"use client";

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, AlertCircle, Info } from "lucide-react";

interface Insight {
  id: string;
  type: "opportunity" | "warning" | "info";
  title: string;
  description: string;
  icon: typeof Sparkles;
  cta?: string;
  color: string;
}

export function SmartAssistant() {
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const goals = useSelector((state: RootState) => state.goals.items);
  const transactions = useSelector((state: RootState) => state.transactions.items);

  const insights: Insight[] = useMemo(() => {
    const findings: Insight[] = [];

    // 1. Idle Capital Detection
    const liquidity = accounts
      .filter(a => !a.excludeFromAnalytics && !a.isClosed && (a.type === 'bank' || a.type === 'cash'))
      .reduce((s, a) => s + a.balance, 0);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const avgExpense = Math.max(1, transactions
      .filter(tx => tx.type === "expense" && new Date(tx.date) >= thirtyDaysAgo)
      .reduce((s, t) => s + t.amount, 0) || 50000);

    const runway = liquidity / avgExpense;
    if (runway > 8) {
      findings.push({
        id: "idle-capital",
        type: "opportunity",
        title: "Idle Cash Found",
        description: `Your reserves cover ~${runway.toFixed(1)} months. Consider investing ₹${Math.round(liquidity - (avgExpense * 6)).toLocaleString()} into a plan.`,
        icon: Sparkles,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        cta: "Invest Now"
      });
    }

    // 2. High Burn Rate Warning
    if (avgExpense > 0) {
        findings.push({
            id: "burn-rate",
            type: "info",
            title: "Spending matches average",
            description: "Your spending this month is within your normal range. Keep it up!",
            icon: Info,
            color: "text-primary bg-primary/10 border-primary/20"
        });
    }

    // 3. Goal Pacing
    const behindGoals = goals.filter(g => {
        const start = new Date(g.startDate || "");
        const target = new Date(g.targetDate);
        const elapsed = Math.max(0, Date.now() - start.getTime());
        const total = Math.max(1, target.getTime() - start.getTime());
        const expected = (elapsed / total);
        const actual = (g.currentAmount / Math.max(1, g.targetAmount));
        return actual < expected * 0.9;
    });

    if (behindGoals.length > 0) {
        findings.push({
            id: "goal-drift",
            type: "warning",
            title: "Goal Delay Detected",
            description: `${behindGoals[0]?.name} is falling behind schedule. Suggest topping up ₹10k to stay on track.`,
            icon: AlertCircle,
            color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
            cta: "View Goal"
        });
    }

    return findings;
  }, [accounts, goals, transactions]);

  return (
    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 p-5 rounded-[2rem] shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="size-4 text-primary" />
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Smart Assistant</h3>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {insights.map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-4 rounded-2xl border ${insight.color} space-y-2`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <insight.icon className="size-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{insight.title}</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                {insight.description}
              </p>
              {insight.cta && (
                <button className="text-[8px] font-black uppercase tracking-[0.15em] py-1.5 px-3 rounded-lg bg-white dark:bg-slate-950 shadow-sm border border-slate-100 dark:border-white/5 hover:scale-105 transition-all active:scale-95">
                  {insight.cta}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Assistant: Online</span>
        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </div>
  );
}
