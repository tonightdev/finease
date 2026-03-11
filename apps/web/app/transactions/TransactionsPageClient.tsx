"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { TransactionDetailsModal } from "@/components/transactions/TransactionDetailsModal";
import { AddAccountModal } from "@/components/accounts/AddAccountModal";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
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
} from "@/store/slices/categoriesSlice";
import { fetchGoals } from "@/store/slices/goalsSlice";
import { AddCategoryModal } from "@/components/categories/AddCategoryModal";
import { Transaction } from "@repo/types";
import {
  Trash2,
  Edit2,
  Filter,
  ArrowRight,
  CheckCircle2,
  Plus,
  Download,
  ChevronUp,
  ChevronDown,
  FileUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { formatDate, calculateRunningBalances } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { Button } from "@/components/ui/Button";

const liquidTypes = ["bank", "cash", "card"];

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
  const itemsPerPage = 10;

  const pendingAutomatedCount = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0] || "";
    return (transactions || []).filter(
      (t) =>
        t &&
        t.isAutomated &&
        t.status === "pending_confirmation" &&
        t.date &&
        (t.date.split("T")[0] ?? "") <= todayStr,
    ).length;
  }, [transactions]);

  const explodedTransactions = useMemo(() => {
    const result: Transaction[] = [];
    (transactions || []).forEach((t) => {
      // Add the primary transaction
      result.push(t);

      // If it's a transfer between liquid accounts, add a virtual "credit" entry
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

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction | "date";
    direction: "asc" | "desc";
  }>({
    key: "date",
    direction: "desc",
  });

  const handleSort = (key: keyof Transaction | "date") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "desc" ? "asc" : "desc",
    }));
  };

  const filtered = useMemo(() => {
    const result = explodedTransactions.filter((t: Transaction) => {
      // Basic Tab & Search
      const isSearchMatch = t.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const isTabMatch =
        activeTab === "automated"
          ? !!t.isAutomated && t.status === "pending_confirmation"
          : t.status === "completed";

      if (!isSearchMatch || !isTabMatch) return false;

      // Category Filter
      if (filterCategory !== "all" && t.category !== filterCategory)
        return false;

      // Account Filter
      if (filterAccount !== "all" && t.accountId !== filterAccount)
        return false;

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

      if (sortConfig.key === "date") {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        return sortConfig.direction === "asc" ? timeA - timeB : timeB - timeA;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      return sortConfig.direction === "asc"
        ? String(aValue || "").localeCompare(String(bValue || ""))
        : String(bValue || "").localeCompare(String(aValue || ""));
    });

    return sortedResult;
  }, [
    explodedTransactions,
    searchTerm,
    activeTab,
    filterCategory,
    filterAccount,
    filterType,
    filterDateFrom,
    filterDateTo,
    sortConfig,
  ]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedTransactions = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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
    !!filterDateTo,
  ].filter(Boolean).length;

  const [showExportOptions, setShowExportOptions] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target as Node)
      ) {
        setShowExportOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

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
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `FinEase_Ledger_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportOptions(false);
    toast.success("CSV Ledger Exported with Balances");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF("landscape");

    doc.setFontSize(22);
    doc.setTextColor(19, 91, 236);
    doc.text("FinEase", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Architectural Wealth Ledger (Omni-Channel Report)", 14, 27);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33);

    const enriched = calculateRunningBalances(filtered);

    const tableData = enriched.map((t) => [
      formatDate(t.date),
      t.description,
      categories.find((c) => c.id === t.category)?.name || t.category,
      accounts.find((a) => a.id === t.accountId)?.name || "N/A",
      `${t.type === "expense" ? "-" : "+"} ${t.amount.toLocaleString()}`,
      t.balanceBefore.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      t.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 }),
    ]);

    autoTable(doc, {
      startY: 40,
      head: [
        [
          "Execution Date",
          "Description",
          "Nexus Category",
          "Source Entity",
          "Quantum",
          "Bal. Before",
          "Bal. After",
        ],
      ],
      body: tableData,
      headStyles: {
        fillColor: [19, 91, 236],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      styles: { fontSize: 7, cellPadding: 3 },
      columnStyles: {
        5: { halign: "right", fontStyle: "bold" },
        6: { halign: "right", fontStyle: "bold", textColor: [19, 91, 236] },
      },
    });

    doc.save(`FinEase_Ledger_${new Date().toISOString().split("T")[0]}.pdf`);
    setShowExportOptions(false);
    toast.success("PDF Ledger Exported with Balances");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-4 pb-20 lg:pb-8 pt-0">
      <PageHeader
        title="Transactions"
        subtitle="Unified financial ledger"
        className="space-y-3"
        actions={
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <div className="relative" ref={exportDropdownRef}>
              <Button
                variant={showExportOptions ? "primary" : "secondary"}
                size="sm"
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="w-full sm:w-auto"
                leftIcon={
                  <Download
                    className={`w-3.5 h-3.5 mr-1.5 transition-transform duration-300 ${showExportOptions ? "rotate-180" : ""}`}
                  />
                }
              >
                Export
              </Button>
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-white/5 z-[110] p-1.5 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-3.5 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg flex items-center justify-between group transition-colors"
                  >
                    CSV Sheet
                    <div className="size-1.5 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100" />
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full text-left px-3.5 py-2.5 text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg flex items-center justify-between group transition-colors"
                  >
                    PDF Report
                    <div className="size-1.5 rounded-full bg-rose-500 opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100" />
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => toast.success("Ledger Import coming soon", { icon: "🚀" })}
              className="inline-flex items-center justify-center h-8 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm dark:border-white/5 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/10 transition-all duration-200"
            >
              <FileUp className="w-3.5 h-3.5 mr-1.5" />
              Import
            </button>
            <Button
              size="sm"
              onClick={() => {
                setEditingData(null);
                setIsModalOpen(true);
              }}
              className="col-span-2 sm:col-auto"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Record
            </Button>
          </div>
        }
      >
        <div
          className={`flex items-center gap-2 py-0.5 ${showAllCategories ? "flex-wrap" : "overflow-x-auto overflow-y-hidden no-scrollbar"}`}
        >
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-primary transition-all active:scale-90"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {(showAllCategories ? categories : categories.slice(0, 5)).map(
            (c) => (
              <div key={c.id} className="relative group/cat shrink-0">
                <button
                  onClick={() => {
                    setFilterCategory(filterCategory === c.id ? "all" : c.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center gap-2 pl-3 pr-7 py-1.5 rounded-xl border transition-all ${filterCategory === c.id ? "bg-primary/10 border-primary shadow-sm" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5"}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
                  <span
                    className={`font-bold text-[9px] uppercase tracking-widest ${filterCategory === c.id ? "text-primary" : "text-slate-500"}`}
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
                  className="absolute top-1/2 -translate-y-1/2 right-1.5 p-1 bg-white dark:bg-slate-800 rounded-full shadow-lg opacity-100 transition-opacity border border-slate-100 dark:border-white/5 z-10 hover:scale-110 active:scale-90"
                >
                  <Edit2 className="w-2.5 h-2.5 text-primary" />
                </button>
              </div>
            ),
          )}
          {categories.length > 5 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all border border-transparent hover:border-primary/20"
            >
              {showAllCategories ? "Less" : `+${categories.length - 5} More`}
              {showAllCategories ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-0.5 rounded-xl w-full sm:w-64">
            <button
              onClick={() => {
                setActiveTab("actual");
                setCurrentPage(1);
              }}
              className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === "actual" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500"}`}
            >
              Actual
            </button>
            <button
              onClick={() => {
                setActiveTab("automated");
                setCurrentPage(1);
              }}
              className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === "automated" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500"}`}
            >
              Automated
              {pendingAutomatedCount > 0 && (
                <span className="bg-primary/10 text-primary px-1 py-0.5 rounded-full text-[7px] font-bold">
                  {pendingAutomatedCount}
                </span>
              )}
            </button>
          </div>
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                search
              </span>
              <input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-8 bg-white dark:bg-slate-900 border-none rounded-xl pl-9 text-[10px] ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none"
                placeholder="Search ledger..."
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-8 px-3 rounded-xl flex items-center gap-2 transition-all ${showFilters || activeFilterCount > 0 ? "bg-primary text-white" : "bg-white dark:bg-slate-900 text-slate-500 border border-slate-100 dark:border-white/5"}`}
            >
              <Filter className="w-3.5 h-3.5" />
              {activeFilterCount > 0 && (
                <span className="text-[10px] font-black">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-2 p-3 bg-white dark:bg-slate-950/80 backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-white/10 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full h-8 bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-2 text-[10px] font-bold outline-none ring-1 ring-slate-100 dark:ring-white/5"
                >
                  <option value="all">All Accounts</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
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
                  {[
                    { id: "all", label: "All" },
                    { id: "expense", label: "Out" },
                    { id: "income", label: "In" },
                    { id: "transfer", label: "Xfer" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setFilterType(
                          t.id as "all" | "expense" | "income" | "transfer",
                        );
                        setCurrentPage(1);
                      }}
                      className={`flex-1 h-8 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${filterType === t.id ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-50 dark:bg-slate-900 text-slate-500 ring-1 ring-slate-100 dark:ring-white/5"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full h-8 bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-2 text-[10px] font-bold outline-none ring-1 ring-slate-100 dark:ring-white/5"
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
                  className="w-full h-8 bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-2 text-[10px] font-bold outline-none ring-1 ring-slate-100 dark:ring-white/5"
                />
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="w-full py-1.5 text-[8px] font-black uppercase text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-500/20"
              >
                Clear All {activeFilterCount} Filters
              </button>
            )}
          </div>
        )}
      </PageHeader>

      <div className="block lg:hidden space-y-4">
        {paginatedTransactions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-100 dark:border-white/5 shadow-sm mx-4 sm:mx-0 flex flex-col items-center justify-center text-center">
            <div className="flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-4xl text-slate-200">
                history
              </span>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                No activities found
              </p>
            </div>
          </div>
        ) : (
          paginatedTransactions.map((tx: Transaction) => (
            <div
              key={tx.id}
              onClick={() => setViewingData(tx)}
              className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm active:scale-95 transition-all flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${categories.find((c) => c.id === tx.category)?.color || "bg-slate-400"}`}
                    />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">
                      {categories.find((c) => c.id === tx.category)?.name ||
                        tx.category}
                    </span>
                  </div>
                  <h4 className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight truncate pr-4">
                    {tx.description}
                  </h4>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`text-sm font-black tracking-tighter ${tx.type === "expense" || tx.type === "transfer" ? "text-rose-500" : "text-emerald-500"}`}
                  >
                    {tx.type === "expense" || tx.type === "transfer"
                      ? "-"
                      : "+"}{" "}
                    ₹{tx.amount.toLocaleString()}
                  </div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {formatDate(tx.date)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-white/5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[9px] font-bold text-slate-500 truncate">
                    {accounts.find((a) => a.id === tx.accountId)?.name}
                  </span>
                  {tx.type === "transfer" && tx.toAccountId && (
                    <>
                      <ArrowRight className="w-2 h-2 text-slate-300" />
                      <span className="text-[9px] font-bold text-primary truncate">
                        {accounts.find((a) => a.id === tx.toAccountId)?.name ||
                          goals.find((g) => g.id === tx.toAccountId)?.name}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {tx.isAutomated &&
                    tx.status === "pending_confirmation" &&
                    (String(tx.date).split("T")[0] || "") <=
                      (new Date().toISOString().split("T")[0] || "") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(confirmTransaction(tx.id)).then(() => {
                            dispatch(fetchAccounts({ force: true }));
                            dispatch(fetchTransactions({ force: true }));
                            dispatch(fetchGoals({ force: true }));
                          });
                          toast.success("Confirmed");
                        }}
                        className="px-2 py-1 bg-primary text-white text-[8px] font-black uppercase tracking-widest rounded-lg shadow-sm"
                      >
                        OK
                      </button>
                    )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingData(tx);
                      setIsModalOpen(true);
                    }}
                    className="p-1 px-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTransactionToDelete(tx);
                    }}
                    className="p-1 px-2 text-rose-400 hover:text-rose-500 transition-colors bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <Trash2 className="w-2.5 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden lg:block overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-white/5 dark:bg-slate-900 dark:shadow-none">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:bg-slate-800/50">
              <tr>
                <th
                  className="px-8 py-6 cursor-pointer hover:text-primary transition-colors"
                  scope="col"
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center gap-2">
                    Execution Date
                    {sortConfig.key === "date" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3 h-3 text-primary" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-primary" />
                      ))}
                  </div>
                </th>
                <th
                  className="px-8 py-6 cursor-pointer hover:text-primary transition-colors"
                  scope="col"
                  onClick={() => handleSort("description")}
                >
                  <div className="flex items-center gap-2">
                    Description
                    {sortConfig.key === "description" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3 h-3 text-primary" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-primary" />
                      ))}
                  </div>
                </th>
                <th className="px-8 py-6" scope="col">
                  Entity
                </th>
                <th
                  className="px-8 py-6 cursor-pointer hover:text-primary transition-colors"
                  scope="col"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center gap-2">
                    Nexus Category
                    {sortConfig.key === "category" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3 h-3 text-primary" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-primary" />
                      ))}
                  </div>
                </th>
                <th
                  className="px-8 py-6 text-right cursor-pointer hover:text-primary transition-colors"
                  scope="col"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Quantum Amount
                    {sortConfig.key === "amount" &&
                      (sortConfig.direction === "asc" ? (
                        <ChevronUp className="w-3 h-3 text-primary" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-primary" />
                      ))}
                  </div>
                </th>
                <th className="px-8 py-6 text-right" scope="col">
                  Running Balance
                </th>
                <th className="px-8 py-6 text-right w-36" scope="col">
                  Operations
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-24">
                    <div className="flex flex-col items-center justify-center text-center gap-6">
                      <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center border border-slate-100 dark:border-white/5 shadow-inner">
                        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">
                          history
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                          No matching activities
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-80">
                          Expand your filtration nexus to view more results
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx: Transaction) => (
                  <tr
                    key={tx.id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all"
                  >
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
                      <button
                        onClick={() => setViewingData(tx)}
                        className="font-bold text-slate-900 dark:text-white hover:text-primary transition-colors text-left truncate max-w-[220px] inline-block tracking-tight text-sm"
                      >
                        {tx.description}
                      </button>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 flex items-center gap-2 uppercase tracking-widest">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-slate-900 dark:text-white border border-slate-200 dark:border-white/5">
                          {accounts.find((a) => a.id === tx.accountId)?.name ||
                            "N/A"}
                        </span>
                        {tx.type === "transfer" && tx.toAccountId && (
                          <>
                            <span className="material-symbols-outlined text-[16px] text-primary/40">
                              trending_flat
                            </span>
                            <span className="bg-primary/5 text-primary px-2.5 py-1 rounded-lg border border-primary/10 tracking-widest">
                              {accounts.find((a) => a.id === tx.toAccountId)
                                ?.name ||
                                goals.find((g) => g.id === tx.toAccountId)
                                  ?.name ||
                                "N/A"}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600 dark:bg-slate-800/50 dark:border-white/5 dark:text-slate-400">
                        <div
                          className={`w-1.5 h-1.5 rounded-full mr-2 ${categories.find((c) => c.id === tx.category)?.color || "bg-slate-400"}`}
                        />
                        {categories.find((c) => c.id === tx.category)?.name ||
                          tx.category}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right flex flex-col items-end gap-1">
                      <span
                        className={`text-base font-black tracking-tighter ${tx.type === "expense" || tx.type === "transfer" ? "text-rose-500" : "text-emerald-500"}`}
                      >
                        {tx.type === "expense" || tx.type === "transfer"
                          ? "-"
                          : "+"}{" "}
                        ₹
                        {tx.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                      {tx.status === "pending_confirmation" && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/5 px-2 py-0.5 rounded-md border border-orange-500/10">
                          Pending Confirmation
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right font-bold text-slate-500 text-xs">
                      {tx.balanceAfter !== undefined
                        ? `₹${tx.balanceAfter.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        {tx.isAutomated &&
                          tx.status === "pending_confirmation" &&
                          (String(tx.date).split("T")[0] || "") <=
                            (new Date().toISOString().split("T")[0] || "") && (
                            <Button
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await dispatch(
                                  confirmTransaction(tx.id),
                                ).unwrap();
                                dispatch(fetchAccounts({ force: true }));
                                dispatch(fetchTransactions({ force: true }));
                                dispatch(fetchGoals({ force: true }));
                                toast.success("Transaction Confirmed");
                              }}
                              leftIcon={<CheckCircle2 className="w-3 h-3" />}
                            >
                              Confirm
                            </Button>
                          )}
                        {!(tx as Transaction & { isVirtual?: boolean })
                          .isVirtual && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingData(tx);
                                setIsModalOpen(true);
                              }}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 pt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {currentPage} <span className="mx-1 text-slate-300">/</span>{" "}
            {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-600 disabled:opacity-30 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-600 disabled:opacity-30 shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={editingData}
        onSave={async (data) => {
          const amountVar = data.amount || 0;
          const interestVar = data.interestAmount;

          if (editingData) {
            await dispatch(
              updateTransaction({
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
                  recurringCount: data.recurringCount,
                },
              }),
            ).unwrap();
          } else {
            await dispatch(
              createTransaction({
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
                recurringCount: data.recurringCount,
              }),
            ).unwrap();
          }
          dispatch(fetchAccounts({ force: true }));
          dispatch(fetchTransactions({ force: true }));
          dispatch(fetchGoals({ force: true }));
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
              name: data.name,
              type: data.type as
                | "bank"
                | "cash"
                | "debt"
                | "investment"
                | "card",
              balance: parseFloat(data.balance) || 0,
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
          if (data.id) {
            await dispatch(
              updateCategoryAction({
                id: data.id,
                data: {
                  name: data.name,
                  color: data.color,
                  parentType: data.parentType as
                    | "needs"
                    | "wants"
                    | "savings"
                    | "income",
                },
              }),
            ).unwrap();
            toast.success("Category updated");
          } else {
            await dispatch(
              addCategoryAction({
                name: data.name,
                color: data.color,
                parentType: data.parentType as
                  | "needs"
                  | "wants"
                  | "savings"
                  | "income",
              }),
            ).unwrap();
            toast.success("Category created");
          }
        }}
        onDelete={async (id) => {
          await dispatch(removeCategoryAction(id)).unwrap();
          toast.success("Category deleted");
        }}
      />

      <ConfirmModal
        isOpen={!!transactionToDelete}
        title="Destroy Transaction?"
        message="This will retroactively update all running balances. This action is irreversible."
        onConfirm={async () => {
          if (transactionToDelete) {
            await dispatch(deleteTransaction(transactionToDelete.id)).unwrap();
            dispatch(fetchAccounts({ force: true }));
            dispatch(fetchTransactions({ force: true }));
            dispatch(fetchGoals({ force: true }));
            toast.success("Record destroyed");
            setTransactionToDelete(null);
          }
        }}
        onCancel={() => setTransactionToDelete(null)}
      />
    </div>
  );
}
