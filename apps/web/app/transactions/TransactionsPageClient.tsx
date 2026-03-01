"use client";

import { useState } from "react";
import Link from "next/link";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { TransactionDetailsModal } from "@/components/transactions/TransactionDetailsModal";
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { addTransaction, updateTransaction, deleteTransaction } from "@/store/slices/transactionsSlice";
import { addAccount, updateAccountBalance } from "@/store/slices/accountsSlice";
import { addCategory, updateCategory, removeCategory } from "@/store/slices/categoriesSlice";
import { updateGoal } from "@/store/slices/goalsSlice";
import { AddCategoryModal } from "@/components/categories/AddCategoryModal";
import { Transaction } from "@repo/types";
import { Trash2, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

export default function TransactionsPageClient() {
  const dispatch = useDispatch();
  const transactions = useSelector((state: RootState) => state.transactions.items);
  const accounts = useSelector((state: RootState) => state.accounts.items);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"actual" | "automated">("actual");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Transaction | null>(null);
  const [viewingData, setViewingData] = useState<Transaction | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; color: string } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const categories = useSelector((state: RootState) => state.categories.items);
  const goals = useSelector((state: RootState) => state.goals.items);

  const filtered = transactions.filter((t: Transaction) => {
    const isSearchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const isTabMatch = activeTab === "automated" ? !!t.isAutomated : !t.isAutomated;
    return isSearchMatch && isTabMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTransactions = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and track your financial activities</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch gap-3 w-full md:w-auto mt-4 md:mt-0">
          <Link href="/transactions/import" className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none dark:border-border-dark dark:bg-surface-dark dark:text-slate-200 dark:hover:bg-border-dark col-span-1 w-full sm:w-auto">
            <span className="material-symbols-outlined mr-2 text-lg">upload_file</span>
            Import
          </Link>
          <button onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }} className="inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition col-span-1 w-full sm:w-auto">
            <span className="material-symbols-outlined text-lg mr-2">add</span>
            Category
          </button>
          <button onClick={() => { setEditingData(null); setIsModalOpen(true); }} className="col-span-2 sm:col-span-1 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark w-full sm:w-auto mt-3 sm:mt-0">
            <span className="material-symbols-outlined mr-2 text-lg">add</span>
            Transaction
          </button>
        </div>
      </div>

      <div className="mb-6 border-b border-slate-200 dark:border-border-dark overflow-x-auto">
        <nav aria-label="Tabs" className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
          <button 
            onClick={() => { setActiveTab("actual"); setCurrentPage(1); }}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold inline-flex items-center gap-2 transition-colors ${activeTab === 'actual' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            Actual Transactions
            <span className={`hidden rounded-full py-0.5 px-2.5 text-xs font-medium md:inline-block ${activeTab === 'actual' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
              {transactions.filter((t: Transaction) => !t.isAutomated).length}
            </span>
          </button>
          <button 
            onClick={() => { setActiveTab("automated"); setCurrentPage(1); }}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-semibold inline-flex items-center gap-2 transition-colors ${activeTab === 'automated' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined text-[20px]">autorenew</span>
            Automated Movements
            <span className={`hidden rounded-full py-0.5 px-2.5 text-xs font-medium md:inline-block ${activeTab === 'automated' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
              {transactions.filter((t: Transaction) => !!t.isAutomated).length}
            </span>
          </button>
        </nav>
      </div>

      <div className="space-y-6 mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Spending Categories</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map(c => (
            <div 
              key={c.id} 
              onClick={() => { setEditingCategory(c); setIsCategoryModalOpen(true); }}
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark flex items-center justify-between cursor-pointer hover:border-primary transition-colors group"
            >
               <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{c.name}</span>
               <div className={`w-3 h-3 rounded-full ${c.color}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border-dark dark:bg-surface-dark mb-6">
        <div className="relative w-full md:w-96">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-symbols-outlined text-slate-400">search</span>
          </div>
          <input 
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 dark:bg-[#0b0d12] dark:text-white dark:ring-border-dark dark:focus:ring-primary" 
            placeholder="Search transactions..." 
            type="text"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-[#0b0d12] dark:text-slate-300">
              <tr>
                <th className="px-6 py-4" scope="col">Date</th>
                <th className="px-6 py-4" scope="col">Description</th>
                <th className="px-6 py-4" scope="col">Account</th>
                <th className="px-6 py-4" scope="col">Category</th>
                <th className="px-6 py-4 text-right" scope="col">Amount</th>
                <th className="px-6 py-4 text-right" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-slate-500">No transactions found.</td>
                </tr>
              ) : (
                paginatedTransactions.map((tx: Transaction) => (
                <tr key={tx.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {formatDate(tx.date)}
                      {tx.isAutomated && (
                         <div className="text-xs text-purple-500 mt-0.5">
                           Every {tx.frequency} ({tx.recurringCount}x)
                         </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setViewingData(tx)} className="font-medium text-slate-900 dark:text-white hover:text-primary transition-colors text-left underline decoration-primary/30 underline-offset-2">{tx.description}</button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900 dark:text-white flex items-center gap-1">
                      {accounts.find(a => a.id === tx.accountId)?.name || 'Unknown'}
                      {tx.type === 'transfer' && tx.toAccountId && (
                        <>
                          <span className="material-symbols-outlined text-[14px] text-slate-400">arrow_forward</span>
                          {accounts.find(a => a.id === tx.toAccountId)?.name || goals.find(g => g.id === tx.toAccountId)?.name || 'Unknown'}
                        </>
                      )}
                    </div>
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
                  <td className="px-6 py-4 w-20 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setEditingData(tx); setIsModalOpen(true); }}
                        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-primary transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          if (!tx.isAutomated) {
                            dispatch(updateAccountBalance({ id: tx.accountId, amountChange: tx.type === 'expense' ? tx.amount : -tx.amount }));
                            if (tx.toAccountId) {
                              const destAcc = accounts.find(a => a.id === tx.toAccountId);
                              if (destAcc) {
                                dispatch(updateAccountBalance({ id: tx.toAccountId, amountChange: -tx.amount, interestAmount: tx.interestAmount }));
                              } else {
                                const destGoal = goals.find(g => g.id === tx.toAccountId);
                                if (destGoal) {
                                  dispatch(updateGoal({ ...destGoal, currentAmount: destGoal.currentAmount - tx.amount }));
                                }
                              }
                            }
                          }
                          dispatch(deleteTransaction(tx.id));
                          toast.success("Transaction deleted");
                        }}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-[#0b0d12] px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-border-dark dark:bg-surface-dark dark:text-slate-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-border-dark dark:bg-surface-dark dark:text-slate-300"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-medium">{filtered.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-border-dark dark:hover:bg-white/5"
                    >
                      <span className="sr-only">Previous</span>
                      &larr;
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${currentPage === i + 1 ? 'z-10 bg-primary text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary' : 'text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-border-dark hover:bg-slate-50 dark:hover:bg-white/5 focus:z-20 focus:outline-offset-0'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 dark:ring-border-dark dark:hover:bg-white/5"
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        transaction={editingData || undefined}
        onSave={(data) => {
          const amountVar = parseFloat(data.amount);
          const interestVar = data.interestAmount ? parseFloat(data.interestAmount) : undefined;
          
          if (editingData) {
            if (!editingData.isAutomated) {
              dispatch(updateAccountBalance({ id: editingData.accountId, amountChange: editingData.type === 'expense' ? editingData.amount : -editingData.amount }));
              if (editingData.toAccountId) {
                const prevDestAcc = accounts.find(a => a.id === editingData.toAccountId);
                if (prevDestAcc) {
                  dispatch(updateAccountBalance({ id: editingData.toAccountId, amountChange: -editingData.amount, interestAmount: editingData.interestAmount }));
                } else {
                  const prevDestGoal = goals.find(g => g.id === editingData.toAccountId);
                  if (prevDestGoal) {
                    dispatch(updateGoal({ ...prevDestGoal, currentAmount: prevDestGoal.currentAmount - editingData.amount }));
                  }
                }
              }
            }
            if (!data.isAutomated) {
              dispatch(updateAccountBalance({ id: data.accountId, amountChange: data.type === 'expense' ? -amountVar : amountVar }));
              if (data.toAccountId) {
                const newDestAcc = accounts.find(a => a.id === data.toAccountId);
                if (newDestAcc) {
                  dispatch(updateAccountBalance({ id: data.toAccountId, amountChange: amountVar, interestAmount: interestVar }));
                } else {
                  const newDestGoal = goals.find(g => g.id === data.toAccountId);
                  if (newDestGoal) {
                    dispatch(updateGoal({ ...newDestGoal, currentAmount: newDestGoal.currentAmount + amountVar }));
                  }
                }
              }
            }
            dispatch(updateTransaction({ ...editingData, ...data, amount: amountVar, interestAmount: interestVar }));
          } else {
            const newTx: Transaction = {
              id: `tx-${Date.now()}`,
              userId: "user-1",
              accountId: data.accountId,
              toAccountId: data.toAccountId || undefined,
              amount: amountVar,
              interestAmount: interestVar,
              date: data.date,
              description: data.description,
              category: data.category,
              type: data.type,
              status: "pending",
              metadata: {},
              isAutomated: data.isAutomated,
              frequency: data.frequency,
              recurringCount: data.recurringCount
            };
            
            if (!newTx.isAutomated) {
              dispatch(updateAccountBalance({ id: newTx.accountId, amountChange: newTx.type === 'expense' ? -newTx.amount : newTx.amount }));
              if (newTx.toAccountId) {
                const newDestAcc = accounts.find(a => a.id === newTx.toAccountId);
                if (newDestAcc) {
                  dispatch(updateAccountBalance({ id: newTx.toAccountId, amountChange: newTx.amount, interestAmount: newTx.interestAmount }));
                } else {
                  const newDestGoal = goals.find(g => g.id === newTx.toAccountId);
                  if (newDestGoal) {
                    dispatch(updateGoal({ ...newDestGoal, currentAmount: newDestGoal.currentAmount + newTx.amount }));
                  }
                }
              }
            }
            dispatch(addTransaction(newTx));
          }
          setIsModalOpen(false);
        }} 
      />
      
      <TransactionDetailsModal
        isOpen={!!viewingData}
        onClose={() => setViewingData(null)}
        transaction={viewingData}
        accounts={accounts}
        goals={goals}
      />

      <AddAccountModal 
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={(data) => {
          dispatch(addAccount({
            id: `acc-${Date.now()}`,
            userId: "user-1",
            name: data.name,
            type: data.type as "bank" | "cash" | "loan" | "investment" | "card",
            assetType: "",
            balance: parseFloat(data.balance) || 0,
            currency: "INR",
            lastSyncedAt: new Date().toISOString()
          }));
          setIsAccountModalOpen(false);
        }}
      />
      <AddCategoryModal 
        isOpen={isCategoryModalOpen}
        category={editingCategory}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={(data) => {
          const isNameDuplicate = categories.some(c => c.name.toLowerCase() === data.name.trim().toLowerCase() && c.id !== data.id);
          const isColorDuplicate = categories.some(c => c.color === data.color && c.id !== data.id);
          
          if (isNameDuplicate) {
            toast.error("Category name already exists");
            return;
          }
          if (isColorDuplicate) {
            toast.error("Color theme is already used by another category");
            return;
          }
          if (data.id) {
            dispatch(updateCategory({
              id: data.id,
              name: data.name,
              color: data.color
            }));
          } else {
            dispatch(addCategory({
              id: `cat-${Date.now()}`,
              name: data.name,
              color: data.color
            }));
          }
          setIsCategoryModalOpen(false);
          toast.success(data.id ? "Category updated" : "Category added");
        }}
        onDelete={(id) => {
          dispatch(removeCategory(id));
          setIsCategoryModalOpen(false);
          toast.success("Category deleted");
        }}
      />
    </div>
  );
}
