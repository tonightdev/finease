"use client";

import { useState, useMemo } from "react";
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
import { Trash2, Edit2, Filter, X, ChevronDown, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";

export default function TransactionsPageClient() {
  const dispatch = useDispatch();
  const transactions = useSelector((state: RootState) => state.transactions.items);
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const categories = useSelector((state: RootState) => state.categories.items);
  const goals = useSelector((state: RootState) => state.goals.items);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"actual" | "automated">("actual");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryEditMode, setIsCategoryEditMode] = useState(false);
  const [editingData, setEditingData] = useState<Transaction | null>(null);
  const [viewingData, setViewingData] = useState<Transaction | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; color: string } | null>(null);

  // Filter States
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filtered = useMemo(() => {
    return transactions.filter((t: Transaction) => {
      // Basic Tab & Search
      const isSearchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const isTabMatch = activeTab === "automated" ? !!t.isAutomated : !t.isAutomated;
      if (!isSearchMatch || !isTabMatch) return false;

      // Category Filter
      if (filterCategory !== "all" && t.category !== filterCategory) return false;

      // Account Filter
      if (filterAccount !== "all") {
        const isSource = t.accountId === filterAccount;
        const isDest = t.toAccountId === filterAccount;
        if (!isSource && !isDest) return false;
      }

      // Type Filter
      if (filterType !== "all" && t.type !== filterType) return false;

      // Date Filters
      if (filterDateFrom) {
        if (new Date(t.date) < new Date(filterDateFrom)) return false;
      }
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(t.date) > toDate) return false;
      }

      return true;
    });
  }, [transactions, searchTerm, activeTab, filterCategory, filterAccount, filterType, filterDateFrom, filterDateTo]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTransactions = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const resetFilters = () => {
    setFilterCategory("all");
    setFilterAccount("all");
    setFilterType("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setSearchTerm("");
  };

  const activeFilterCount = [
    filterCategory !== "all",
    filterAccount !== "all",
    filterType !== "all",
    !!filterDateFrom,
    !!filterDateTo
  ].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white leading-none">Transactions</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest leading-none">Unified financial ledger</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch gap-3 w-full sm:w-auto">
          <Link href="/transactions/import" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all dark:border-white/5 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 shadow-sm">
            <span className="material-symbols-outlined mr-2 text-lg">download</span>
            Import
          </Link>
          <button 
            type="button"
            onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }} 
            className="inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 px-5 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition shadow-sm"
          >
            <span className="material-symbols-outlined mr-2 text-lg">add</span>
            Category
          </button>
          <button 
            type="button"
            onClick={() => { setEditingData(null); setIsModalOpen(true); }} 
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <span className="material-symbols-outlined mr-2 text-lg">add</span>
            Transaction
          </button>
        </div>
      </div>

      {/* Tabs - No Scroll Mobile */}
      <div className="border-b border-slate-200 dark:border-white/5">
        <nav aria-label="Tabs" className="-mb-px flex w-full">
          <button 
            type="button"
            onClick={() => { setActiveTab("actual"); setCurrentPage(1); }}
            className={`flex-1 text-center border-b-2 py-4 px-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 transition-colors ${activeTab === 'actual' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Actual
            <span className={`rounded-full py-0.5 px-2 text-[9px] font-bold ${activeTab === 'actual' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
              {transactions.filter((t: Transaction) => !t.isAutomated).length}
            </span>
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab("automated"); setCurrentPage(1); }}
            className={`flex-1 text-center border-b-2 py-4 px-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 transition-colors ${activeTab === 'automated' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Automated
            <span className={`rounded-full py-0.5 px-2 text-[9px] font-bold ${activeTab === 'automated' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
              {transactions.filter((t: Transaction) => !!t.isAutomated).length}
            </span>
          </button>
        </nav>
      </div>

      {/* Categories Chips - Wrapping for No Scroll on Mobile */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expense Categories</h3>
          <div className="flex items-center gap-3">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden xl:block">Double-click or icon to edit</p>
            <button 
              onClick={() => setIsCategoryEditMode(!isCategoryEditMode)}
              className={`xl:hidden flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isCategoryEditMode ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
            >
              <Edit2 className="w-2.5 h-2.5" />
              {isCategoryEditMode ? 'Done' : 'Edit'}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 py-2">
          <button
            onClick={() => { setFilterCategory("all"); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${filterCategory === 'all' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-white/5 hover:border-primary/30'}`}
          >
            All
          </button>
          {categories.map(c => (
            <div key={c.id} className="relative group/chip">
              <button 
                onClick={() => { 
                  if (isCategoryEditMode) {
                    setEditingCategory(c);
                    setIsCategoryModalOpen(true);
                  } else {
                    setFilterCategory(c.name); 
                    setCurrentPage(1); 
                  }
                }}
                onDoubleClick={() => { setEditingCategory(c); setIsCategoryModalOpen(true); }}
                className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${isCategoryEditMode || filterCategory === c.name ? 'pr-7' : ''} ${filterCategory === c.name ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-slate-950 border-transparent shadow-md' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-white/5 hover:border-primary/30'} ${isCategoryEditMode ? 'border-primary/50 bg-primary/5' : ''}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
                {c.name}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingCategory(c); setIsCategoryModalOpen(true); }}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-primary transition-colors ${isCategoryEditMode ? 'flex text-primary' : 'hidden xl:flex'}`}
                title="Edit category"
              >
                <Edit2 className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative flex-1 group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined">search</span>
                </div>
                <input 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="block w-full rounded-2xl border-none py-3.5 pl-12 pr-4 text-slate-900 ring-1 ring-inset ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary dark:bg-slate-900 dark:text-white dark:ring-white/5 shadow-sm transition-all text-sm font-medium" 
                    placeholder="Search ledger..." 
                    type="text"
                />
            </div>
            
            <button 
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all relative ${showFilters || activeFilterCount > 0 ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'bg-white dark:bg-slate-900 text-slate-600 border border-slate-100 dark:border-white/5'}`}
            >
                <Filter className="w-4 h-4" />
                <span>Filters Center</span>
                {activeFilterCount > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-[9px] font-black">{activeFilterCount}</span>
                )}
            </button>

            {activeFilterCount > 0 && (
                <button 
                    type="button"
                    onClick={resetFilters}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all w-fit mx-auto md:mx-0"
                >
                    <X className="w-4 h-4" />
                    Reset
                </button>
            )}
        </div>

        {showFilters && (
            <div className="p-6 md:p-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-2xl relative overflow-hidden transition-all">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                          <div className="w-1 h-1 bg-primary rounded-full" />
                          Source
                        </label>
                        <div className="relative">
                          <select 
                              value={filterAccount}
                              onChange={(e) => { setFilterAccount(e.target.value); setCurrentPage(1); }}
                              className="w-full h-12 rounded-xl border-slate-100 dark:border-white/10 dark:bg-slate-950 text-sm font-bold focus:ring-2 focus:ring-primary appearance-none px-4 transition-all hover:border-primary/50"
                          >
                              <option value="all">Everything</option>
                              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                          <div className="w-1 h-1 bg-primary rounded-full" />
                          Type
                        </label>
                        <div className="relative">
                          <select 
                              value={filterType}
                              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
                              className="w-full h-12 rounded-xl border-slate-100 dark:border-white/10 dark:bg-slate-950 text-sm font-bold focus:ring-2 focus:ring-primary appearance-none px-4 transition-all hover:border-primary/50"
                          >
                              <option value="all">Every type</option>
                              <option value="expense">Outflow</option>
                              <option value="income">Inflow</option>
                              <option value="transfer">Transfer</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-3 lg:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                          <CalendarIcon className="w-3 h-3 text-primary" />
                          Period
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <input 
                                type="date" 
                                value={filterDateFrom}
                                onChange={(e) => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
                                className="w-full h-12 rounded-xl border-slate-100 dark:border-white/10 dark:bg-slate-950 text-[10px] font-black focus:ring-2 focus:ring-primary px-3 transition-all uppercase tracking-widest bg-transparent" 
                            />
                            <input 
                                type="date" 
                                value={filterDateTo}
                                onChange={(e) => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
                                className="w-full h-12 rounded-xl border-slate-100 dark:border-white/10 dark:bg-slate-950 text-[10px] font-black focus:ring-2 focus:ring-primary px-3 transition-all uppercase tracking-widest bg-transparent" 
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Mobile & Tablet Card List (Visible up to lg/1024px) */}
      <div className="block lg:hidden space-y-4">
        {paginatedTransactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-100 dark:border-white/5 shadow-sm">
             <div className="flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-4xl text-slate-200">history</span>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No activities found</p>
             </div>
          </div>
        ) : (
          paginatedTransactions.map((tx: Transaction) => (
            <div 
              key={tx.id} 
              onClick={() => setViewingData(tx)}
              className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm active:scale-95 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${categories.find(c => c.name === tx.category)?.color || 'bg-slate-400'}`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tx.category}</span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{tx.description}</h4>
                </div>
                <div className={`text-right font-black text-base tracking-tighter ${tx.type === 'expense' ? 'text-rose-500' : tx.type === 'income' ? 'text-emerald-500' : 'text-primary'}`}>
                  {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''} ₹{tx.amount.toLocaleString()}
                </div>
              </div>
              
              <div className="flex justify-between items-end pt-4 border-t border-slate-50 dark:border-white/5">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Account</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-900 dark:text-slate-200">{accounts.find(a => a.id === tx.accountId)?.name}</span>
                    {tx.type === 'transfer' && tx.toAccountId && (
                      <ArrowRight className="w-2.5 h-2.5 text-primary/50" />
                    )}
                    {tx.type === 'transfer' && tx.toAccountId && (
                      <span className="text-[10px] font-bold text-primary">{accounts.find(a => a.id === tx.toAccountId)?.name || goals.find(g => g.id === tx.toAccountId)?.name}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{formatDate(tx.date)}</span>
                  <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setEditingData(tx); setIsModalOpen(true); }} className="p-1.5 text-slate-400"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); /* delete logic ... */ }} className="p-1.5 text-rose-400"><Trash2 className="w-3 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table (Visible only on lg screens 1024px+) */}
      <div className="hidden lg:block overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-white/5 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:bg-slate-800/50">
              <tr>
                <th className="px-8 py-6" scope="col">Execution Date</th>
                <th className="px-8 py-6" scope="col">Description</th>
                <th className="px-8 py-6" scope="col">Entity</th>
                <th className="px-8 py-6" scope="col">Nexus Category</th>
                <th className="px-8 py-6 text-right" scope="col">Quantum Amount</th>
                <th className="px-8 py-6 text-right w-36" scope="col">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-5">
                        <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                          <span className="material-symbols-outlined text-3xl text-slate-300">history</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">No matching activities</p>
                          <p className="text-xs font-medium text-slate-400">Expand your filters to view more results</p>
                        </div>
                        {activeFilterCount > 0 && (
                          <button onClick={resetFilters} className="text-primary text-[10px] font-black uppercase tracking-[0.2em] bg-primary/10 px-6 py-2 rounded-full hover:bg-primary/20 transition-all">Clear filters</button>
                        )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx: Transaction) => (
                <tr key={tx.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="font-bold text-slate-900 dark:text-white text-xs">
                      {formatDate(tx.date)}
                      {tx.isAutomated && (
                         <div className="text-[9px] text-primary/70 mt-1.5 flex items-center gap-1.5 font-black uppercase tracking-widest bg-primary/5 w-fit px-2 py-0.5 rounded-full">
                           <div className="w-1 h-1 bg-primary rounded-full animate-pulse" />
                           {tx.frequency}
                         </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <button onClick={() => setViewingData(tx)} className="font-bold text-slate-900 dark:text-white hover:text-primary transition-colors text-left truncate max-w-[220px] inline-block tracking-tight text-sm">{tx.description}</button>
                  </td>
                  <td className="px-8 py-5">
                    <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-900 dark:text-white border border-slate-200 dark:border-white/5">{accounts.find(a => a.id === tx.accountId)?.name || 'N/A'}</span>
                      {tx.type === 'transfer' && tx.toAccountId && (
                        <>
                          <span className="material-symbols-outlined text-[16px] text-primary/40">trending_flat</span>
                          <span className="bg-primary/5 text-primary px-2.5 py-1 rounded-lg border border-primary/10 tracking-widest">{accounts.find(a => a.id === tx.toAccountId)?.name || goals.find(g => g.id === tx.toAccountId)?.name || 'N/A'}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="inline-flex items-center rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600 dark:bg-slate-800/50 dark:border-white/5 dark:text-slate-400">
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${categories.find(c => c.name === tx.category)?.color || 'bg-slate-400'}`} />
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className={`text-base font-black tracking-tighter ${tx.type === 'expense' ? 'text-rose-500' : tx.type === 'income' ? 'text-emerald-500' : 'text-primary'}`}>
                      {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''} ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <button 
                        type="button"
                        onClick={() => { setEditingData(tx); setIsModalOpen(true); }}
                        className="p-2.5 rounded-xl hover:bg-primary/10 text-slate-400 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                        title="Edit entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                         type="button"
                        onClick={() => {
                          if (confirm("Delete this transaction? This action will reverse balance changes.")) {
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
                            toast.success("Entry removed from ledger");
                          }
                        }}
                        className="p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
                        title="Purge entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Universal Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {currentPage} <span className="mx-1 text-slate-300">/</span> {totalPages}
            </p>
            <div className="flex gap-2">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-600 disabled:opacity-30 shadow-sm"
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-600 disabled:opacity-30 shadow-sm"
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        </div>
      )}
      
      {/* Modals */}
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
