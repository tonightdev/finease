"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { TransactionDetailsModal } from "@/components/transactions/TransactionDetailsModal";
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  ArrowRight,
  Download,
  Trash2,
  Edit2,
  Filter,
  CheckCircle2,
  Plus,
  History,
  Search,
} from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
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

const liquidTypes: AccountType[] = ["bank", "cash", "card"];

export default function TransactionsPageClient() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { items: transactions, loading: transactionsLoading } = useSelector(
    (state: RootState) => state.transactions,
  );
  const { items: accounts, loading: accountsLoading } = useSelector(
    (state: RootState) => state.accounts,
  );
  const { items: categories, loading: categoriesLoading } = useSelector(
    (state: RootState) => state.categories,
  );
  const { items: goals, loading: goalsLoading } = useSelector(
    (state: RootState) => state.goals,
  );

  const isDataLoading =
    transactionsLoading || accountsLoading || categoriesLoading || goalsLoading;

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
      if (filterCategory !== "all" && t.category !== filterCategory)
        return false;
      if (filterAccount !== "all" && t.accountId !== filterAccount)
        return false;
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterDateFrom && new Date(t.date) < new Date(filterDateFrom))
        return false;
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
  }, [
    explodedTransactions,
    searchTerm,
    activeTab,
    filterCategory,
    filterAccount,
    filterType,
    filterDateFrom,
    filterDateTo,
  ]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTransactions = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking or tapping outside
  useEffect(() => {
    if (!showExportOptions) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportOptions(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowExportOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showExportOptions]);

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
    doc
      .setFontSize(10)
      .setTextColor(100)
      .text("Architectural Wealth Ledger", 14, 27);
    const enriched = calculateRunningBalances(filtered);
    const tableData = enriched.map((t) => [
      formatDate(t.date),
      t.description,
      categories.find((c) => c.id === t.category)?.name || t.category,
      accounts.find((a) => a.id === t.accountId)?.name || "N/A",
      `${t.type === "expense" ? "-" : "+"} ${t.amount.toLocaleString("en-IN")}`,
      t.balanceBefore.toLocaleString("en-IN"),
      t.balanceAfter.toLocaleString("en-IN"),
    ]);
    autoTable(doc, {
      startY: 40,
      head: [
        [
          "Date",
          "Description",
          "Category",
          "Source",
          "Quantum",
          "Before",
          "After",
        ],
      ],
      body: tableData,
    });
    doc.save(`FinEase_Ledger_${new Date().toISOString().split("T")[0]}.pdf`);
    setShowExportOptions(false);
    toast.success("PDF Exported");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Transactions"
        subtitle="Unified financial ledger"
        className="space-y-1.5"
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                setEditingData(null);
                setIsModalOpen(true);
              }}
              className="h-10 px-4 rounded-xl text-xs font-bold shadow-sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Record
            </Button>
            <div className="relative" ref={exportDropdownRef}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="h-10 px-4 rounded-xl text-xs font-bold"
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export
              </Button>
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-white/10 z-50 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg cursor-pointer"
                  >
                    CSV Sheet
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg cursor-pointer"
                  >
                    PDF Report
                  </button>
                </div>
              )}
            </div>
          </div>
        }
      >
        <div
          className={`flex items-center gap-1.5 py-0.5 ${showAllCategories ? "flex-wrap" : "overflow-x-auto no-scrollbar"}`}
        >
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-primary flex items-center justify-center shrink-0"
          >
            <Plus size={12} />
          </button>
          {(showAllCategories ? categories : categories.slice(0, 7)).map(
            (c, index) => (
              <div
                key={c.id || `category-${index}`}
                className="relative group shrink-0"
              >
                <button
                  onClick={() => {
                    setFilterCategory(filterCategory === c.id ? "all" : c.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-1.5 pl-2.5 pr-6 py-1 rounded-lg border transition-all ${filterCategory === c.id ? "bg-primary/10 border-primary shadow-sm" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5"}`}
                >
                  <div className={`w-1 h-1 rounded-full ${c.color}`} />
                  <span
                    className={`font-black text-[8px] uppercase tracking-widest ${filterCategory === c.id ? "text-primary" : "text-slate-500"}`}
                  >
                    {c.name}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(c);
                    setIsCategoryModalOpen(true);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-primary bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-white/5 transition-all hover:scale-110 active:scale-90"
                >
                  <Edit2 size={8} />
                </button>
              </div>
            ),
          )}
          {categories.length > 7 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="px-2 h-7 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[8px] font-black uppercase text-slate-500 hover:text-primary transition-all shrink-0"
            >
              {showAllCategories ? "Less" : `+${categories.length - 7} More`}
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
          <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl w-full sm:w-60 shrink-0 border border-slate-200/80 dark:border-white/10 h-10 items-center">
            <button
              type="button"
              onClick={() => {
                setActiveTab("actual");
                setCurrentPage(1);
              }}
              className={`flex-1 h-8 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center ${activeTab === "actual" ? "bg-white dark:bg-slate-800 text-primary shadow-xs font-black" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
            >
              Actual
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("automated");
                setCurrentPage(1);
              }}
              className={`flex-1 h-8 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === "automated" ? "bg-white dark:bg-slate-800 text-primary shadow-xs font-black" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
            >
              <span>Automated</span>
              {pendingAutomatedCount > 0 && (
                <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded-full text-[8px] font-black">
                  {pendingAutomatedCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 flex items-center gap-2 min-w-0 w-full">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 bg-white dark:bg-slate-900 rounded-xl pl-10 pr-9 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-300 dark:border-white/15 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
                placeholder="Search transactions..."
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-black p-1 cursor-pointer"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-10 px-4 rounded-xl flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-xs ${showFilters ? "bg-primary text-white shadow-primary/20" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5"}`}
            >
              <Filter size={13} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-2 p-3 bg-white dark:bg-slate-950/80 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                Source Account
              </label>
              <select
                value={filterAccount}
                onChange={(e) => {
                  setFilterAccount(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 text-[10px] font-bold outline-none ring-1 ring-slate-100 dark:ring-white/5"
              >
                <option value="all">All Accounts</option>
                {accounts.map((a, index) => (
                  <option key={a.id || `account-${index}`} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                Flow Type
              </label>
              <div className="flex gap-1">
                {(["all", "expense", "income", "transfer"] as const).map(
                  (t) => (
                    <button
                      key={t}
                      onClick={() => {
                        setFilterType(t);
                        setCurrentPage(1);
                      }}
                      className={`flex-1 h-8 rounded-lg text-[8px] font-black uppercase transition-all ${filterType === t ? "bg-primary text-white" : "bg-slate-50 dark:bg-slate-900 text-slate-500 ring-1 ring-slate-100 dark:ring-white/5"}`}
                    >
                      {t}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                From Date
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => {
                  setFilterDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 text-[10px] font-bold outline-none ring-1 ring-slate-100 dark:ring-white/5"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                To Date
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 text-[10px] font-bold outline-none ring-1 ring-slate-100 dark:ring-white/5"
              />
            </div>
          </div>
        )}
      </PageHeader>

      <div className="mb-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalEntries={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>

      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5">
              <th className="px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                Date
              </th>
              <th className="px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                Description
              </th>
              <th className="px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                Category
              </th>
              <th className="px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
                Source
              </th>
              <th className="px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                Quantum
              </th>
              <th className="px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                Balance
              </th>
              <th className="px-3 py-2 text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isDataLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr
                  key={`skeleton-row-${i}`}
                  className="border-b border-slate-50 dark:border-white/5"
                >
                  <td className="px-3 py-4">
                    <Skeleton className="h-3 w-16" />
                  </td>
                  <td className="px-3 py-4">
                    <Skeleton className="h-3 w-48" />
                  </td>
                  <td className="px-3 py-4">
                    <Skeleton className="h-3 w-24" />
                  </td>
                  <td className="px-3 py-4">
                    <Skeleton className="h-3 w-32" />
                  </td>
                  <td className="px-3 py-4 text-right">
                    <Skeleton className="h-3 w-20 ml-auto" />
                  </td>
                  <td className="px-3 py-4 text-right">
                    <Skeleton className="h-3 w-20 ml-auto" />
                  </td>
                  <td className="px-3 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Skeleton className="size-7 rounded-lg" />
                      <Skeleton className="size-7 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))
            ) : paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-20">
                  <div className="flex flex-col items-center justify-center gap-4 text-center">
                    <History
                      size={48}
                      className="text-slate-200 dark:text-slate-800"
                    />
                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        No activities recorded
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Expand your filters to view more data
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((tx: Transaction, index: number) => (
                <tr
                  key={tx.id || `tx-${index}`}
                  className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                  onClick={() => setViewingData(tx)}
                >
                  <td className="px-3 py-1.5 text-[10px] font-bold text-slate-500 whitespace-nowrap">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-3 py-1.5">
                    <div
                      className="text-[11px] font-black text-slate-900 dark:text-white truncate max-w-[200px]"
                      title={tx.description}
                    >
                      {tx.description}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${categories.find((c) => c.id === tx.category)?.color || "bg-slate-400"}`}
                      />
                      <span className="font-bold text-[9px] uppercase tracking-widest text-slate-500 truncate max-w-[100px]">
                        {categories.find((c) => c.id === tx.category)?.name ||
                          tx.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 truncate max-w-[120px]">
                      {accounts.find((a) => a.id === tx.accountId)?.name}
                      {tx.type === "transfer" && tx.toAccountId && (
                        <>
                          <ArrowRight size={10} className="text-slate-300" />
                          <span className="text-primary truncate max-w-[80px]">
                            {accounts.find((a) => a.id === tx.toAccountId)
                              ?.name ||
                              goals.find((g) => g.id === tx.toAccountId)?.name}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-black text-xs ${tx.type === "expense" || tx.type === "transfer" ? "text-rose-500" : "text-emerald-500"}`}
                  >
                    {tx.type === "expense" || tx.type === "transfer"
                      ? "-"
                      : "+"}{" "}
                    ₹
                    {tx.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 1,
                    })}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-[10px] text-slate-500 whitespace-nowrap">
                    ₹{tx.balanceAfter?.toLocaleString("en-IN") || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 transition-opacity">
                      {tx.isAutomated &&
                        tx.status === "pending_confirmation" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(confirmTransaction(tx.id));
                              toast.success("Confirmed");
                            }}
                            className="size-7 flex items-center justify-center bg-emerald-500 text-white rounded-lg"
                          >
                            <CheckCircle2 size={12} />
                          </button>
                        )}
                      {!("isVirtual" in tx && tx.isVirtual) && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingData(tx);
                              setIsModalOpen(true);
                            }}
                            className="size-7 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary rounded-lg transition-colors"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransactionToDelete(tx);
                            }}
                            className="size-7 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-lg transition-colors"
                          >
                            <Trash2 size={12} />
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

      <div className="lg:hidden flex flex-col gap-2.5 mb-3">
        {isDataLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`skeleton-card-${i}`}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="pt-2 border-t border-slate-50 dark:border-white/5 flex justify-between items-center">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="size-7 rounded-lg" />
              </div>
            </div>
          ))
        ) : paginatedTransactions.length === 0 ? (
          <div className="py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center gap-3">
            <History size={40} className="text-slate-200 dark:text-slate-800" />
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                No activities recorded
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Expand your filters to view more data
              </p>
            </div>
          </div>
        ) : (
          paginatedTransactions.map((tx: Transaction, index: number) => (
            <div
              key={tx.id || `tx-card-${index}`}
              onClick={() => setViewingData(tx)}
              className="group p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-primary/50 transition-all cursor-pointer relative shadow-xs flex flex-col gap-2 active:scale-[0.99] touch-manipulation select-none"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`size-2 rounded-full shrink-0 ${categories.find((c) => c.id === tx.category)?.color || "bg-slate-400"}`}
                  />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 truncate">
                    {categories.find((c) => c.id === tx.category)?.name ||
                      tx.category}
                  </span>
                  <span className="text-slate-300 dark:text-white/20 text-xs">
                    •
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                    {formatDate(tx.date)}
                  </span>
                </div>
                <div
                  className={`text-sm font-black tracking-tight tabular-nums shrink-0 ${tx.type === "expense" || tx.type === "transfer" ? "text-rose-500" : "text-emerald-500"}`}
                >
                  {tx.type === "expense" || tx.type === "transfer" ? "-" : "+"}₹
                  {tx.amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 1,
                  })}
                </div>
              </div>

              <h4
                className="text-xs font-black text-slate-900 dark:text-white leading-snug break-words"
                title={tx.description}
              >
                {tx.description}
              </h4>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-1.5 min-w-0 text-[9px] font-bold text-slate-500 truncate">
                  <span className="text-primary font-black truncate">
                    {accounts.find((a) => a.id === tx.accountId)?.name}
                  </span>
                  {tx.type === "transfer" && tx.toAccountId && (
                    <>
                      <ArrowRight
                        size={9}
                        className="text-slate-400 shrink-0"
                      />
                      <span className="text-primary font-black truncate">
                        {accounts.find((a) => a.id === tx.toAccountId)?.name ||
                          goals.find((g) => g.id === tx.toAccountId)?.name}
                      </span>
                    </>
                  )}
                  {tx.balanceAfter !== undefined && (
                    <span className="text-slate-400 ml-1 shrink-0 font-medium">
                      (₹{tx.balanceAfter.toLocaleString("en-IN")})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {tx.isAutomated && tx.status === "pending_confirmation" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(confirmTransaction(tx.id));
                        toast.success("Confirmed");
                      }}
                      className="size-7 flex items-center justify-center bg-emerald-500 text-white rounded-lg transition-transform active:scale-90 cursor-pointer"
                      title="Confirm"
                    >
                      <CheckCircle2 size={12} />
                    </button>
                  )}
                  {!("isVirtual" in tx && tx.isVirtual) && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingData(tx);
                          setIsModalOpen(true);
                        }}
                        className="size-7 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary rounded-lg transition-all active:scale-90 cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTransactionToDelete(tx);
                        }}
                        className="size-7 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-lg transition-all active:scale-90 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalEntries={filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        className="border-t border-slate-100 dark:border-white/5 pt-2"
      />

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={editingData}
        onSave={async (data) => {
          if (editingData) {
            await dispatch(
              updateTransaction({ id: editingData.id, data }),
            ).unwrap();
          } else {
            await dispatch(createTransaction(data)).unwrap();
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
        onSave={async (data) => {
          await dispatch(
            createAccount({
              ...data,
              type: data.type as AccountType,
              balance: parseFloat(data.balance) || 0,
              minimumBalance: data.minimumBalance
                ? parseFloat(data.minimumBalance)
                : undefined,
              maxLimit: data.maxLimit ? parseFloat(data.maxLimit) : undefined,
              currency: "INR",
            }),
          ).unwrap();
        }}
      />
      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        category={editingCategory}
        existingCategories={categories}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={async (data) => {
          const categoryData = {
            ...data,
            parentType: data.parentType as CategoryParentType,
          };
          if (data.id) {
            await dispatch(
              updateCategoryAction({ id: data.id, data: categoryData }),
            ).unwrap();
          } else {
            await dispatch(addCategoryAction(categoryData)).unwrap();
          }
          dispatch(fetchCategories());
        }}
        onDelete={async (id) => {
          await dispatch(removeCategoryAction(id)).unwrap();
          dispatch(fetchCategories());
        }}
      />
      <ConfirmModal
        isOpen={!!transactionToDelete}
        title="Destroy Record?"
        message="Irreversible retroactive update detected."
        onConfirm={async () => {
          if (transactionToDelete) {
            await dispatch(deleteTransaction(transactionToDelete.id)).unwrap();
            setTransactionToDelete(null);
          }
        }}
        onCancel={() => setTransactionToDelete(null)}
      />
    </PageContainer>
  );
}
