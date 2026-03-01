"use client";

import { useState } from "react";
import Link from "next/link";
import { Transaction } from "@repo/types";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 w-full p-4 md:p-8">
      <div className="mb-8">
        <nav aria-label="Breadcrumb" className="flex mb-4">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/transactions" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white">
                Transactions
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <span className="material-symbols-outlined text-slate-400 text-lg">chevron_right</span>
                <span className="ml-1 text-sm font-medium text-primary md:ml-2">Import Statement</span>
              </div>
            </li>
          </ol>
        </nav>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Import Bank Statement</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Upload your bank statement (PDF or CSV) to a Review Queue.</p>
      </div>

      {stage === "upload" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">upload_file</span>
                  Upload File
                </h2>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  Supports HDFC, SBI, ICICI
                </span>
              </div>
              
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept=".csv, .pdf" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" 
                />
                <div className="border-2 border-dashed border-slate-300 dark:border-border-dark rounded-lg p-10 text-center transition-all group-hover:border-primary group-hover:bg-primary/5 dark:group-hover:bg-primary/10">
                  <div className="bg-slate-100 dark:bg-surface-hover rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-2xl group-hover:text-primary">cloud_upload</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Click to upload or drag and drop</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PDF, CSV or Excel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {stage === "review" && (
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">checklist</span>
              Review Queue
            </h2>
            <button onClick={handleCommit} className="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary-dark transition text-sm font-bold">
              Commit {reviewQueue.length} Transactions
            </button>
          </div>
          
          <div className="overflow-x-auto border border-slate-200 dark:border-border-dark rounded-lg">
            <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-surface-hover dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Suggested Category</th>
                  <th className="px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-border-dark">
                {reviewQueue.map(t => (
                  <tr key={t.id} className="bg-white dark:bg-background-dark hover:bg-slate-50 dark:hover:bg-surface-hover/50">
                    <td className="px-4 py-3">{t.date ? formatDate(t.date) : ''}</td>
                    <td className="px-4 py-3"><input defaultValue={t.description} className="bg-transparent border-0 ring-1 ring-slate-300 dark:ring-border-dark rounded p-1 w-full text-sm"/></td>
                    <td className="px-4 py-3"><input defaultValue={t.category} className="bg-transparent border-0 ring-1 ring-slate-300 dark:ring-border-dark rounded p-1 text-sm"/></td>
                    <td className={`px-4 py-3 font-medium ${t.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {t.type === 'expense' ? '-' : '+'} ₹{t.amount}
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
