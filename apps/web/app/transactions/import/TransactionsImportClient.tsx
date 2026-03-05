"use client";

import { useState } from "react";
import Link from "next/link";
import { Transaction } from "@repo/types";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import { ChevronRight, FileUp, CloudUpload, ClipboardCheck, ArrowLeft } from "lucide-react";

export default function TransactionsImportClient() {
  const [stage, setStage] = useState<"upload" | "review">("upload");
  // Review queue
  const [reviewQueue, setReviewQueue] = useState<Partial<Transaction>[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Mock data parsing directly to Review Queue
      setReviewQueue([
        { id: "mock-new-1", date: new Date().toISOString(), description: "UPI/ZOMATO/FOOD", amount: 450, category: "Food & Dining", type: "expense" },
        { id: "mock-new-2", date: new Date().toISOString(), description: "NEFT Salary", amount: 85000, category: "Salary", type: "income" },
      ]);
      setStage("review");
    }
  };

  const handleCommit = () => {
    toast.success("Committed mock data to local storage state!");
    window.location.href = "/transactions";
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-8">
        <nav aria-label="Breadcrumb" className="flex mb-4">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link href="/transactions" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors">
                <ArrowLeft className="w-3 h-3 mr-1.5" />
                Transactions
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRight className="text-slate-400 w-3 h-3" />
                <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-primary">Import Statement</span>
              </div>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Bank Statement Import</h1>
        <p className="mt-2 text-[10px] font-medium text-slate-500 uppercase tracking-widest">Upload PDF or CSV statements to the review queue.</p>
      </div>

      {stage === "upload" && (
        <div className="max-w-2xl">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <FileUp className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    Upload Dataset
                  </h2>
                </div>
                <span className="text-[8px] font-black px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 uppercase tracking-[0.2em]">
                  Multi-Channel Support
                </span>
              </div>
              
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept=".csv, .pdf" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" 
                />
                <div className="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-12 text-center transition-all group-hover:border-primary group-hover:bg-primary/[0.02] dark:group-hover:bg-primary/5">
                  <div className="bg-slate-50 dark:bg-white/5 rounded-2xl h-16 w-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <CloudUpload className="text-slate-400 dark:text-slate-500 w-8 h-8 group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Select statement file</p>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-2">PDF, CSV or Excel formats accepted</p>
                </div>
              </div>
          </div>
        </div>
      )}

      {stage === "review" && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                <ClipboardCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                Review Queue
              </h2>
            </div>
            <button onClick={handleCommit} className="bg-primary text-white rounded-xl px-6 h-10 hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
              Commit {reviewQueue.length} Cycles
            </button>
          </div>
          
          <div className="overflow-hidden border border-slate-100 dark:border-white/5 rounded-2xl">
            <table className="w-full text-left">
              <thead className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4">Narration</th>
                  <th className="px-6 py-4">Nexus Category</th>
                  <th className="px-6 py-4">Quantum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {reviewQueue.map(t => (
                  <tr key={t.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500">{t.date ? formatDate(t.date) : ''}</td>
                    <td className="px-6 py-4"><input defaultValue={t.description} className="bg-slate-50 dark:bg-white/5 border-none rounded-lg p-2 w-full text-[10px] font-black focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white"/></td>
                    <td className="px-6 py-4"><input defaultValue={t.category} className="bg-slate-50 dark:bg-white/5 border-none rounded-lg p-2 text-[10px] font-black focus:ring-1 focus:ring-primary outline-none text-slate-900 dark:text-white"/></td>
                    <td className={`px-6 py-4 text-[10px] font-black ${t.type === 'expense' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {t.type === 'expense' ? '-' : '+'} ₹{t.amount?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
