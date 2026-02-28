"use client";

import { useState } from "react";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";
import Link from "next/link";
import { TransactionModal } from "@/components/transactions/TransactionModal";

export default function TransactionsPageClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const filtered = MOCK_TRANSACTIONS.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and track your financial activities</p>
        </div>
        <div className="flex gap-4">
          <Link href="/transactions/import" className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none dark:border-border-dark dark:bg-surface-dark dark:text-slate-200 dark:hover:bg-border-dark">
            <span className="material-symbols-outlined mr-2 text-lg">upload_file</span>
            Import Statement
          </Link>
          <button onClick={() => { setEditingData(null); setIsModalOpen(true); }} className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark">
            <span className="material-symbols-outlined mr-2 text-lg">add</span>
            Add Transaction
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark mb-6">
        <div className="relative w-full md:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-symbols-outlined text-slate-400">search</span>
          </div>
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-surface-darker dark:text-white dark:ring-border-dark dark:focus:ring-primary" 
            placeholder="Search transactions..." 
            type="text"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-surface-darker dark:text-slate-300">
              <tr>
                <th className="px-6 py-4" scope="col">Date</th>
                <th className="px-6 py-4" scope="col">Description</th>
                <th className="px-6 py-4" scope="col">Category</th>
                <th className="px-6 py-4 text-right" scope="col">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
              {filtered.map(tx => (
                <tr key={tx.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900 dark:text-white">{new Date(tx.date).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{tx.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${tx.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                      {tx.type === 'expense' ? '-' : '+'} ₹{tx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 w-10 text-right">
                    <button 
                      onClick={() => { setEditingData(tx); setIsModalOpen(true); }}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        transaction={editingData}
        onSave={(data) => {
          console.log("Saving transaction", data);
          setIsModalOpen(false);
        }} 
      />
    </div>
  );
}
