"use client";

import { Transaction } from "@repo/types";
import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Check, X, FileText, Landmark } from "lucide-react";

interface VerificationListProps {
  transactions: Transaction[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function VerificationList({ transactions, onApprove, onReject }: VerificationListProps) {
  return (
    <Card title="Pending Verification" subtitle={`${transactions.length} items awaiting approval`}>
      <div className="divide-y divide-slate-100 dark:divide-border-dark">
        {transactions.map((tx) => (
          <div key={tx.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-border-dark text-slate-400 group-hover:text-primary transition-colors">
                {tx.metadata?.isCashWithdrawal ? <Landmark className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{tx.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {formatDate(tx.date)}
                  </p>
                  <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {tx.category}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end gap-6">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {formatCurrency(tx.amount)}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onApprove(tx.id)}
                  className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-emerald-600 rounded-lg transition-all border border-transparent hover:border-emerald-100 dark:hover:border-emerald-500/20"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onReject(tx.id)}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-lg transition-all border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="py-12 text-center">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-border-dark">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">All clear!</p>
            <p className="text-xs text-slate-500 mt-1">No transactions awaiting verification.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
