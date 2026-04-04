"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { TransactionDetailsModal } from "@/components/transactions/TransactionDetailsModal";
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { ArrowRight, Download, Trash2, Edit2, Filter, CheckCircle2, Plus, FileUp, History } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import {
  fetchTransactions,
  createTransaction,
  deleteTransaction,
  updateTransaction,
  confirmTransaction,
} from "@/store/slices/transactionsSlice";
import { fetchAccounts, createAccount } from "@/store/slices/accountsSlice";
import {
  addCategoryAction,
  updateCategoryAction,
  removeCategoryAction,
  fetchCategories,
} from "@/store/slices/categoriesSlice";
import { fetchGoals } from "@/store/slices/goalsSlice";
import { AddCategoryModal } from "@/components/categories/AddCategoryModal";
import { Transaction, AccountType, CategoryParentType } from "@repo/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/ui/PageContainer";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatDate, calculateRunningBalances } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";


const liquidTypes: AccountType[] = ["bank", "cash", "card"];

export default function TransactionsPageClient() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const transactions = useSelector(
    (state: RootState) => state.transactions.items,
  );
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const categories = useSelector((state: RootState) => state.categories.items);
  const goals = useSelector((state: RootState) => state.goals.items);

  useEffect(() => {
    if (user) {
      dispatch(fetchTransactions());
      dispatch(fetchAccounts());
      dispatch(fetchGoals());
    }
  }, [dispatch, user]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"actual" | "automated">("actual");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<Transaction | null>(null);
  const [viewingData, setViewingData] = useState<Transaction | null>(null);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    color: string;
  } | null>(null);
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);

  // Filter States
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const itemsPerPage = 12; // Grid friendly (divisible by 2, 3, 4)

  const pendingAutomatedCount = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0] || "";
    return (transactions || []).filter(
      (t: Transaction) =>
        t &&
        t.isAutomated &&
        t.status === "pending_confirmation" &&
        t.date &&
        (t.date.split("T")[0] ?? "") <= todayStr,
    ).length;
  }, [transactions]);

  const explodedTransactions = useMemo(() => {
    const result: Transaction[] = [];
    (transactions || []).forEach((t: Transaction) => {
      result.push(t);
      if (t.type === "transfer" && t.toAccountId) {
        const toAcc = accounts.find((a) => a.id === t.toAccountId);
        if (toAcc && liquidTypes.includes(toAcc.type)) {
          result.push({
            ...t,
            id: `${t.id}-credit`,
            accountId: t.toAccountId,
            toAccountId: t.accountId,
            type: "income",
            balanceAfter: t.toBalanceAfter,
            isVirtual: true,
          } as Transaction & { isVirtual: boolean });
        }
      }
    });
    return result;
  }, [transactions, accounts]);

  const filtered = useMemo(() => {
    const result = explodedTransactions.filter((t: Transaction) => {
      const isSearchMatch = t.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const isTabMatch =
        activeTab === "automated"
          ? !!t.isAutomated && t.status === "pending_confirmation"
          : t.status === "completed";

      if (!isSearchMatch || !isTabMatch) return false;
      if (filterCategory !== "all" && t.category !== filterCategory) return false;
      if (filterAccount !== "all" && t.accountId !== filterAccount) return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterDateFrom && new Date(t.date) < new Date(filterDateFrom)) return false;
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(t.date) > toDate) return false;
      }
      return true;
    });

    // Default sort by date desc
    return [...result].sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });
  }, [explodedTransactions, searchTerm, activeTab, filterCategory, filterAccount, filterType, filterDateFrom, filterDateTo]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTransactions = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const handleExportCSV = () => {
    const enriched = calculateRunningBalances(filtered);
    const dataToExport = enriched.map((t) => ({
      Date: formatDate(t.date),
      Description: t.description,
      Amount: t.amount,
      Type: t.type.toUpperCase(),
      Category: categories.find((c) => c.id === t.category)?.name || t.category,
      Account: accounts.find((a) => a.id === t.accountId)?.name || t.accountId,
      "Balance Before": t.balanceBefore.toFixed(2),
      "Balance After": t.balanceAfter.toFixed(2),
      Status: t.status,
    }));
    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `FinEase_Ledger_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    setShowExportOptions(false);
    toast.success("CSV Exported");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(22).setTextColor(19, 91, 236).text("FinEase", 14, 20);
    doc.setFontSize(10).setTextColor(100).text("Architectural Wealth Ledger", 14, 27);
    const enriched = calculateRunningBalances(filtered);
    const tableData = enriched.map((t) => [formatDate(t.date), t.description, categories.find(c => c.id === t.category)?.name || t.category, accounts.find(a => a.id === t.accountId)?.name || "N/A", `${t.type === "expense" ? "-" : "+"} ${t.amount.toLocaleString()}`, t.balanceBefore.toLocaleString(), t.balanceAfter.toLocaleString()]);
    autoTable(doc, { startY: 40, head: [["Date", "Description", "Category", "Source", "Quantum", "Before", "After"]], body: tableData });
    doc.save(`FinEase_Ledger_${new Date().toISOString().split("T")[0]}.pdf`);
    setShowExportOptions(false);
    toast.success("PDF Exported");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Transactions"
        subtitle="Unified financial ledger"
        className="space-y-3"
        actions={
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none" ref={exportDropdownRef}>
                <Button variant="secondary" size="sm" onClick={() => setShowExportOptions(!showExportOptions)} className="w-full sm:w-auto" leftIcon={<Download className="w-3.5 h-3.5" />}>Export</Button>
                {showExportOptions && (
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={handleExportCSV} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg">CSV Sheet</button>
                    <button onClick={handleExportPDF} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg">PDF Report</button>
                  </div>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={() => toast.success("Import coming soon")} className="flex-1 sm:flex-none" leftIcon={<FileUp className="w-3.5 h-3.5" />}>Import</Button>
            </div>
            <Button size="sm" onClick={() => { setEditingData(null); setIsModalOpen(true); }} className="w-full sm:w-auto" leftIcon={<Plus className="w-3.5 h-3.5" />}>Record</Button>
          </div>
        }
      >
        <div className={`flex items-center gap-2 py-0.5 ${showAllCategories ? "flex-wrap" : "overflow-x-auto no-scrollbar"}`}>
          <button onClick={() => { setEditingCategory(null); setIsCategoryModalOpen(true); }} className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary flex items-center justify-center shrink-0"><Plus size={14} /></button>
          {(showAllCategories ? categories : categories.slice(0, 5)).map(c => (
            <div key={c.id} className="relative group shrink-0">
              <button onClick={() => { setFilterCategory(filterCategory === c.id ? "all" : c.id); setCurrentPage(1); }} className={`flex items-center gap-2 pl-3 pr-7 py-1.5 rounded-xl border transition-all ${filterCategory === c.id ? "bg-primary/10 border-primary shadow-sm" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
                <span className={`font-bold text-[9px] uppercase tracking-widest ${filterCategory === c.id ? "text-primary" : "text-slate-500"}`}>{c.name}</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setEditingCategory(c); setIsCategoryModalOpen(true); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-primary bg-white dark:bg-slate-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={10} /></button>
            </div>
          ))}
          {categories.length > 5 && <button onClick={() => setShowAllCategories(!showAllCategories)} className="px-3 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[9px] font-black uppercase text-slate-500 hover:text-primary transition-all shrink-0">{showAllCategories ? "Less" : `+${categories.length - 5} More`}</button>}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-0.5 rounded-xl w-full sm:w-64">
            <button onClick={() => { setActiveTab("actual"); setCurrentPage(1); }} className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === "actual" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500"}`}>Actual</button>
            <button onClick={() => { setActiveTab("automated"); setCurrentPage(1); }} className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activeTab === "automated" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500"}`}>Automated {pendingAutomatedCount > 0 && <span className="bg-primary/10 text-primary px-1 rounded-full text-[7px]">{pendingAutomatedCount}</span>}</button>
          </div>
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">search</span>
              <input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full h-8 bg-white dark:bg-slate-900 rounded-xl pl-9 text-[9px] font-bold ring-1 ring-slate-100 dark:ring-white/5 outline-none focus:ring-2 focus:ring-primary" placeholder="Search..." />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`h-8 px-3 rounded-xl flex items-center gap-2 transition-all ${showFilters ? "bg-primary text-white" : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-white/5"}`}><Filter size={14} /></button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-2 p-3 bg-white dark:bg-slate-950/80 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Source Account</label>
              <select value={filterAccount} onChange={(e) => { setFilterAccount(e.target.value); setCurrentPage(1); }} className="w-full h-8 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 text-[10px] font-bold outline-none ring-1 ring-slate-100 dark:ring-white/5"><option value="all">All Accounts</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Flow Type</label>
              <div className="flex gap-1">{(["all", "expense", "income", "transfer"] as const).map(t => <button key={t} onClick={() => { setFilterType(t); setCurrentPage(1); }} className={`flex-1 h-8 rounded-lg text-[8px] font-black uppercase transition-all ${filterType === t ? "bg-primary text-white" : "bg-slate-50 dark:bg-slate-900 text-slate-500 ring-1 ring-slate-100 dark:ring-white/5"}`}>{t}</button>)}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">From Date</label>
              <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setCurrentPage(1); }} className="w-full h-8 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 text-[10px] font-bold outline-none ring-1 ring-slate-100 dark:ring-white/5" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">To Date</label>
              <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setCurrentPage(1); }} className="w-full h-8 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 text-[10px] font-bold outline-none ring-1 ring-slate-100 dark:ring-white/5" />
            </div>
          </div>
        )}
      </PageHeader>

      <div className="mb-4">
        <Pagination currentPage={currentPage} totalPages={totalPages} totalEntries={filtered.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
      </div>

      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5">
              <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Date</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Description</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Category</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Source</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Quantum</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Balance</th>
              <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-20 text-center flex flex-col items-center justify-center gap-4">
                  <History size={48} className="text-slate-200 dark:text-slate-800" />
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">No activities recorded</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Expand your filters to view more data</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx: Transaction) => (
                <tr key={tx.id} className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors cursor-pointer group" onClick={() => setViewingData(tx)}>
                  <td className="px-4 py-3 text-[10px] font-bold text-slate-500 whitespace-nowrap">{formatDate(tx.date)}</td>
                  <td className="px-4 py-3">
                    <div className="text-[11px] font-black text-slate-900 dark:text-white truncate max-w-[200px]" title={tx.description}>{tx.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${categories.find(c => c.id === tx.category)?.color || "bg-slate-400"}`} />
                      <span className="font-bold text-[9px] uppercase tracking-widest text-slate-500 truncate max-w-[100px]">{categories.find(c => c.id === tx.category)?.name || tx.category}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 truncate max-w-[120px]">
                      {accounts.find(a => a.id === tx.accountId)?.name}
                      {tx.type === "transfer" && tx.toAccountId && (
                        <>
                          <ArrowRight size={10} className="text-slate-300" />
                          <span className="text-primary truncate max-w-[80px]">{accounts.find(a => a.id === tx.toAccountId)?.name || goals.find(g => g.id === tx.toAccountId)?.name}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right font-black text-xs ${tx.type === "expense" || tx.type === "transfer" ? "text-rose-500" : "text-emerald-500"}`}>
                    {tx.type === "expense" || tx.type === "transfer" ? "-" : "+"} ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[10px] text-slate-500 whitespace-nowrap">
                    ₹{tx.balanceAfter?.toLocaleString() || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 transition-opacity">
                      {tx.isAutomated && tx.status === "pending_confirmation" && (
                        <button onClick={(e) => { e.stopPropagation(); dispatch(confirmTransaction(tx.id)).then(() => { dispatch(fetchAccounts({ force: true })); dispatch(fetchTransactions({ force: true })); }); toast.success("Confirmed"); }} className="size-7 flex items-center justify-center bg-emerald-500 text-white rounded-lg"><CheckCircle2 size={12} /></button>
                      )}
                      {!(tx as any).isVirtual && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); setEditingData(tx); setIsModalOpen(true); }} className="size-7 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary rounded-lg transition-colors"><Edit2 size={12} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setTransactionToDelete(tx); }} className="size-7 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-lg transition-colors"><Trash2 size={12} /></button>
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

      <div className="lg:hidden grid grid-cols-2 gap-3 mb-3">
        {paginatedTransactions.length === 0 ? (
          <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center gap-4">
            <History size={48} className="text-slate-200 dark:text-slate-800" />
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">No activities recorded</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Expand your filters to view more data</p>
            </div>
          </div>
        ) : (
          paginatedTransactions.map((tx: Transaction) => (
            <Card key={tx.id} onClick={() => setViewingData(tx)} className="group p-2.5 hover:border-primary/50 transition-all cursor-pointer relative overflow-hidden flex flex-col gap-2 min-h-[90px] justify-between">
              <div className="space-y-1.5">
                <div className="flex justify-between items-start gap-1.5 min-w-0">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${categories.find(c => c.id === tx.category)?.color || "bg-slate-400"}`} />
                      <span className="text-[7px] font-black uppercase text-slate-400 leading-none">{categories.find(c => c.id === tx.category)?.name}</span>
                    </div>
                    <h4 className="text-[10px] font-black text-slate-900 dark:text-white leading-tight break-words" title={tx.description}>{tx.description}</h4>
                  </div>
                  <div className={`text-xs font-black tracking-tighter shrink-0 tabular-nums ${tx.type === "expense" || tx.type === "transfer" ? "text-rose-500" : "text-emerald-500"}`}>
                    {tx.type === "expense" || tx.type === "transfer" ? "-" : "+"}₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="flex flex-col gap-1 border-l border-slate-100 dark:border-white/5 mt-1">
                  <div className="flex items-center flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-tighter">
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-slate-500">Source:</span>
                      <span className="text-primary">{accounts.find(a => a.id === tx.accountId)?.name}</span>
                    </div>
                    {tx.type === "transfer" && tx.toAccountId && (
                      <div className="flex items-center gap-1 shrink-0">
                        <ArrowRight size={8} className="text-slate-400" />
                        <span className="text-slate-500">To:</span>
                        <span className="text-primary">{accounts.find(a => a.id === tx.toAccountId)?.name || goals.find(g => g.id === tx.toAccountId)?.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Date:</span>
                    <span>{formatDate(tx.date)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-1.5 border-t border-slate-50 dark:border-white/5 pt-1 mt-auto">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {tx.balanceAfter !== undefined && (
                    <span className="text-[9px] font-black text-slate-900 dark:text-slate-200 tabular-nums px-1.5 py-0.5 bg-slate-50 dark:bg-white/5 rounded-sm line-clamp-1">₹{tx.balanceAfter.toLocaleString()}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {tx.isAutomated && tx.status === "pending_confirmation" && (
                    <button onClick={(e) => { e.stopPropagation(); dispatch(confirmTransaction(tx.id)).then(() => { dispatch(fetchAccounts({ force: true })); dispatch(fetchTransactions({ force: true })); }); toast.success("Confirmed"); }} className="size-6 flex items-center justify-center bg-emerald-500 text-white rounded-md transition-transform hover:scale-110 active:scale-95"><CheckCircle2 size={10} /></button>
                  )}
                  {!(tx as any).isVirtual && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setEditingData(tx); setIsModalOpen(true); }} className="size-6 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary rounded-md transition-all hover:scale-110 active:scale-95"><Edit2 size={10} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setTransactionToDelete(tx); }} className="size-6 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 rounded-md transition-all hover:scale-110 active:scale-95"><Trash2 size={10} /></button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} totalEntries={filtered.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} className="border-t border-slate-100 dark:border-white/5 pt-2" />

      <TransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} transaction={editingData} onSave={async (data) => { if (editingData) { await dispatch(updateTransaction({ id: editingData.id, data })).unwrap(); } else { await dispatch(createTransaction(data)).unwrap(); } dispatch(fetchAccounts({ force: true })); dispatch(fetchTransactions({ force: true })); dispatch(fetchGoals({ force: true })); }} />
      <TransactionDetailsModal isOpen={!!viewingData} onClose={() => setViewingData(null)} transaction={viewingData} accounts={accounts} goals={goals} categories={categories} />
      <AddAccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} onSave={async (data) => { await dispatch(createAccount({ ...data, type: data.type as AccountType, balance: parseFloat(data.balance) || 0, minimumBalance: data.minimumBalance ? parseFloat(data.minimumBalance) : undefined, maxLimit: data.maxLimit ? parseFloat(data.maxLimit) : undefined, currency: "INR" })).unwrap(); dispatch(fetchAccounts({ force: true })); }} />
      <AddCategoryModal isOpen={isCategoryModalOpen} category={editingCategory} existingCategories={categories} onClose={() => setIsCategoryModalOpen(false)} onSave={async (data) => { const categoryData = { ...data, parentType: data.parentType as CategoryParentType }; if (data.id) { await dispatch(updateCategoryAction({ id: data.id, data: categoryData })).unwrap(); } else { await dispatch(addCategoryAction(categoryData)).unwrap(); } dispatch(fetchCategories()); }} onDelete={async (id) => { await dispatch(removeCategoryAction(id)).unwrap(); dispatch(fetchCategories()); }} />
      <ConfirmModal isOpen={!!transactionToDelete} title="Destroy Record?" message="Irreversible retroactive update detected." onConfirm={async () => { if (transactionToDelete) { await dispatch(deleteTransaction(transactionToDelete.id)).unwrap(); dispatch(fetchAccounts({ force: true })); dispatch(fetchTransactions({ force: true })); setTransactionToDelete(null); } }} onCancel={() => setTransactionToDelete(null)} />
    </PageContainer>
  );
}
