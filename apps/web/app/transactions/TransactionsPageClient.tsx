"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { TransactionDetailsModal } from "@/components/transactions/TransactionDetailsModal";
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchTransactions, createTransaction, deleteTransaction, updateTransaction, confirmTransaction } from "@/store/slices/transactionsSlice";
import { fetchAccounts, createAccount } from "@/store/slices/accountsSlice";
import { addCategoryAction, updateCategoryAction, removeCategoryAction } from "@/store/slices/categoriesSlice";
import { AddCategoryModal } from "@/components/categories/AddCategoryModal";
import { CategoryParentType, Transaction } from "@repo/types";
import { Trash2, Edit2, Filter, X, ChevronDown, Calendar as CalendarIcon, ArrowRight, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatDate } from "@/lib/utils";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

const liquidTypes = ["bank", "cash", "card"];

export default function TransactionsPageClient() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const transactions = useSelector((state: RootState) => state.transactions.items);
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const categories = useSelector((state: RootState) => state.categories.items);
  const goals = useSelector((state: RootState) => state.goals.items);
  
  useEffect(() => {
    if (user) {
      dispatch(fetchTransactions());
      dispatch(fetchAccounts());
    }
  }, [dispatch, user]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"actual" | "automated">("actual");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Transaction | null>(null);
  const [viewingData, setViewingData] = useState<Transaction | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; color: string } | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Filter States
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const pendingAutomatedCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0] || "";
    return (transactions || []).filter(t => 
      t && t.isAutomated && 
      t.status === 'pending_confirmation' && 
      t.date && (t.date.split('T')[0] ?? "") <= todayStr
    ).length;
  }, [transactions]);

  const explodedTransactions = useMemo(() => {
    const result: Transaction[] = [];
    (transactions || []).forEach(t => {
      // Add the primary transaction
      result.push(t);

      // If it's a transfer between liquid accounts, add a virtual "credit" entry
      if (t.type === 'transfer' && t.toAccountId) {
        const toAcc = accounts.find(a => a.id === t.toAccountId);
        if (toAcc && liquidTypes.includes(toAcc.type)) {
          result.push({
            ...t,
            id: `${t.id}-credit`,
            accountId: t.toAccountId,
            toAccountId: t.accountId,
            type: 'income',
            balanceAfter: t.toBalanceAfter,
            isVirtual: true,
          } as Transaction & { isVirtual: boolean });
        }
      }
    });
    return result;
  }, [transactions, accounts]);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | 'date'; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc'
  });

  const handleSort = (key: keyof Transaction | 'date') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const filtered = useMemo(() => {
    const result = explodedTransactions.filter((t: Transaction) => {
      // Basic Tab & Search
      const isSearchMatch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const isTabMatch = activeTab === "automated" 
        ? (!!t.isAutomated && t.status === 'pending_confirmation')
        : (t.status === 'completed');
      
      if (!isSearchMatch || !isTabMatch) return false;

      // Category Filter
      if (filterCategory !== "all" && t.category !== filterCategory) return false;

      // Account Filter
      if (filterAccount !== "all" && t.accountId !== filterAccount) return false;

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

    // Apply Sorting
    const sortedResult = [...result].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'date') {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return sortConfig.direction === 'asc' 
        ? String(aValue || "").localeCompare(String(bValue || ""))
        : String(bValue || "").localeCompare(String(aValue || ""));
    });

    return sortedResult;
  }, [explodedTransactions, searchTerm, activeTab, filterCategory, filterAccount, filterType, filterDateFrom, filterDateTo, sortConfig, categories, accounts]);

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
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab("automated"); setCurrentPage(1); }}
            className={`flex-1 text-center border-b-2 py-4 px-1 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 transition-colors ${activeTab === 'automated' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Automated
            {pendingAutomatedCount > 0 && (
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                {pendingAutomatedCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Categories Section - Redesigned for Premium Look */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Expense Categories</h3>
            <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
          </div>
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">Double-tap or click icon to manage</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 py-2">
          <button
            onClick={() => { setFilterCategory("all"); setCurrentPage(1); }}
            className={`group relative px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border ${filterCategory === 'all' ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-xl shadow-slate-200 dark:shadow-none' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'}`}
          >
            All Ledger
          </button>
          {categories.map(c => (
            <div key={c.id} className="relative group/chip">
              <button 
                onClick={() => { 
                  setFilterCategory(c.id); 
                  setCurrentPage(1); 
                }}
                onDoubleClick={() => { setEditingCategory(c); setIsCategoryModalOpen(true); }}
                className={`pl-4 pr-10 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-3 relative overflow-hidden backdrop-blur-sm ${filterCategory === c.id ? 'border-primary bg-primary/[0.03] text-primary dark:text-primary-light shadow-lg shadow-primary/5' : 'bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'}`}
              >
                <div className={`w-2 h-2 rounded-full shadow-sm ${c.color} ${filterCategory === c.id ? 'ring-4 ring-primary/20 scale-110' : ''} transition-all`} />
                {c.name}
              </button>
              
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setEditingCategory(c); 
                  setIsCategoryModalOpen(true); 
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary dark:hover:text-primary-light transition-all rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 opacity-100 sm:opacity-0 group-hover/chip:opacity-100 focus:opacity-100 z-10"
                title="Edit category"
              >
                <Edit2 className="w-3 h-3" />
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
                    <div className={`w-2 h-2 rounded-full ${categories.find(c => c.id === tx.category)?.color || 'bg-slate-400'}`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {categories.find(c => c.id === tx.category)?.name || tx.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{tx.description}</h4>
                </div>
                <div className={`text-right font-black text-base tracking-tighter ${tx.type === 'expense' || tx.type === 'transfer' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {tx.type === 'expense' || tx.type === 'transfer' ? '-' : '+'} ₹{tx.amount.toLocaleString()}
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Balance After</span>
                <span className="text-xs font-black text-slate-600 dark:text-slate-300 tracking-tight">₹{(tx.balanceAfter ?? 0).toLocaleString()}</span>
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
                  {tx.status === 'pending_confirmation' && (
                    <span className="text-[7px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/5 px-1.5 py-0.5 rounded border border-orange-500/10">Pending Review</span>
                  )}
                  <div className="flex items-center gap-2">
                      {tx.isAutomated && tx.status === 'pending_confirmation' && (String(tx.date).split('T')[0] || "") <= (new Date().toISOString().split('T')[0] || "") && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(confirmTransaction(tx.id)).then(() => {
                              dispatch(fetchAccounts());
                              dispatch(fetchTransactions());
                            });
                            toast.success("Transaction Confirmed");
                          }}
                          className="px-4 py-1.5 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-primary/20 active:scale-95"
                        >
                          Confirm
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setEditingData(tx); setIsModalOpen(true); }} className="p-1.5 text-slate-400"><Edit2 className="w-3 h-3" /></button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setTransactionToDelete(tx);
                        }} 
                        className="p-1.5 text-rose-400"
                      >
                        <Trash2 className="w-3 h-4" />
                      </button>
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
                <th className="px-8 py-6 cursor-pointer hover:text-primary transition-colors" scope="col" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-2">
                    Execution Date
                    {sortConfig.key === 'date' && (
                      <span className="material-symbols-outlined text-xs">{sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more'}</span>
                    )}
                  </div>
                </th>
                <th className="px-8 py-6 cursor-pointer hover:text-primary transition-colors" scope="col" onClick={() => handleSort('description')}>
                  <div className="flex items-center gap-2">
                    Description
                    {sortConfig.key === 'description' && (
                      <span className="material-symbols-outlined text-xs">{sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more'}</span>
                    )}
                  </div>
                </th>
                <th className="px-8 py-6" scope="col">Entity</th>
                <th className="px-8 py-6 cursor-pointer hover:text-primary transition-colors" scope="col" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-2">
                    Nexus Category
                    {sortConfig.key === 'category' && (
                      <span className="material-symbols-outlined text-xs">{sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more'}</span>
                    )}
                  </div>
                </th>
                <th className="px-8 py-6 text-right cursor-pointer hover:text-primary transition-colors" scope="col" onClick={() => handleSort('amount')}>
                  <div className="flex items-center justify-end gap-2">
                    Quantum Amount
                    {sortConfig.key === 'amount' && (
                      <span className="material-symbols-outlined text-xs">{sortConfig.direction === 'asc' ? 'expand_less' : 'expand_more'}</span>
                    )}
                  </div>
                </th>
                <th className="px-8 py-6 text-right" scope="col">Running Balance</th>
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
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${categories.find(c => c.id === tx.category)?.color || 'bg-slate-400'}`} />
                      {categories.find(c => c.id === tx.category)?.name || tx.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right flex flex-col items-end gap-1">
                    <span className={`text-base font-black tracking-tighter ${tx.type === 'expense' || tx.type === 'transfer' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {tx.type === 'expense' || tx.type === 'transfer' ? '-' : '+'} ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {tx.status === 'pending_confirmation' && (
                       <span className="text-[8px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/5 px-2 py-0.5 rounded-md border border-orange-500/10">Pending Confirmation</span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right font-bold text-slate-500 text-xs">
                    {tx.balanceAfter !== undefined ? `₹${tx.balanceAfter.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      {tx.isAutomated && tx.status === 'pending_confirmation' && (String(tx.date).split('T')[0] || "") <= (new Date().toISOString().split('T')[0] || "") && (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(confirmTransaction(tx.id)).then(() => {
                              dispatch(fetchAccounts());
                              dispatch(fetchTransactions());
                            });
                            toast.success("Transaction Confirmed");
                          }}
                          className="px-4 py-2 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 active:scale-95 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Confirm
                        </button>
                      )}
                      {!(tx as Transaction & { isVirtual?: boolean }).isVirtual && (
                        <>
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
                              setTransactionToDelete(tx);
                            }}
                            className="p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
                            title="Delete entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
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
          const amountVar = data.amount || 0;
          const interestVar = data.interestAmount;
          
          if (editingData) {
            dispatch(updateTransaction({
              id: editingData.id,
              data: {
                accountId: data.accountId,
                toAccountId: data.toAccountId || undefined,
                amount: amountVar,
                interestAmount: interestVar,
                date: data.date,
                description: data.description,
                category: data.category,
                type: data.type,
                isAutomated: data.isAutomated,
                frequency: data.frequency,
                recurringCount: data.recurringCount
              }
            })).then(() => {
              dispatch(fetchAccounts());
              dispatch(fetchTransactions());
              setIsModalOpen(false);
            });
          } else {
            dispatch(createTransaction({
              accountId: data.accountId,
              toAccountId: data.toAccountId || undefined,
              amount: amountVar,
              interestAmount: interestVar,
              date: data.date,
              description: data.description,
              category: data.category,
              type: data.type,
              isAutomated: data.isAutomated,
              frequency: data.frequency,
              recurringCount: data.recurringCount
            })).then(() => {
              dispatch(fetchAccounts());
              dispatch(fetchTransactions());
              setIsModalOpen(false);
            });
          }
        }} 
      />
      
      <TransactionDetailsModal
        isOpen={!!viewingData}
        onClose={() => setViewingData(null)}
        transaction={viewingData}
        accounts={accounts}
        goals={goals}
        categories={categories}
      />

      <AddAccountModal 
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={(data) => {
          dispatch(createAccount({
            name: data.name,
            type: data.type as "bank" | "cash" | "debt" | "investment" | "card",
            balance: parseFloat(data.balance) || 0,
            currency: "INR",
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
            dispatch(updateCategoryAction({
              id: data.id,
              data: {
                name: data.name,
                color: data.color,
                parentType: data.parentType as CategoryParentType
              }
            }));
          } else {
            dispatch(addCategoryAction({
              name: data.name,
              color: data.color,
              parentType: data.parentType as CategoryParentType
            }));
          }
          setIsCategoryModalOpen(false);
          toast.success(data.id ? "Category updated" : "Category added");
        }}
        onDelete={(id) => {
          dispatch(removeCategoryAction(id));
          setIsCategoryModalOpen(false);
          toast.success("Category deleted");
        }}
      />
      
      <ConfirmModal 
        isOpen={!!transactionToDelete}
        title="Delete Activity"
        message={`Are you sure you want to permanently delete this ${transactionToDelete?.isAutomated ? "automated " : ""}activity? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={() => {
          if (transactionToDelete) {
            dispatch(deleteTransaction(transactionToDelete.id));
            toast.success("Activity Deleted");
          }
          setTransactionToDelete(null);
        }}
        onCancel={() => setTransactionToDelete(null)}
      />
    </div>
  );
}
