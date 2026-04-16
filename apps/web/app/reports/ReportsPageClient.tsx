"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { Transaction, Account, Category } from "@repo/types";
import { Card } from "@/components/ui/Card";
import { formatCurrency, getFiscalMonthStart } from "@/lib/utils";
import { TrendingDown, ArrowUpRight, Activity, Percent, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, X, ChevronDown, Check, Wallet, PiggyBank, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTransactions } from "@/store/slices/transactionsSlice";
import { fetchAccounts } from "@/store/slices/accountsSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchGoals } from "@/store/slices/goalsSlice";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/ui/PageContainer";
import { useAuth } from "@/components/auth/AuthProvider";
import { ProgressBar } from "@/components/ui/ProgressBar";


type ViewType = "Day" | "Week" | "Month" | "Year";

const EMPTY_ACCOUNTS: Account[] = [];
const EMPTY_TRANSACTIONS: Transaction[] = [];
const EMPTY_CATEGORIES: Category[] = [];

// Custom Dropdown Component
function FilterDropdown({
  label,
  value,
  options,
  onSelect,
  onClear,
  multi = false,
  icon: Icon
}: {
  label: string;
  value: string | string[];
  options: { id: string; name: string }[];
  onSelect: (id: string) => void;
  onClear?: () => void;
  multi?: boolean;
  icon?: React.ElementType;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCount = multi ? (value as string[]).length : (value === "all" ? 0 : 1);
  const isSelected = (id: string) => multi ? (value as string[]).includes(id) : value === id;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-2.5 h-8 rounded-lg border transition-all duration-300 text-[9px] font-black uppercase tracking-widest ${isOpen || selectedCount > 0
          ? "bg-white dark:bg-slate-800 border-primary text-primary shadow-sm"
          : "bg-white dark:bg-slate-900 border-slate-200/50 dark:border-white/5 text-slate-500 hover:border-primary/40"
          }`}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-3.5" />}
          <span className="truncate">{label}</span>
          {selectedCount > 0 && (
            <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-lg ml-1 shrink-0">
              {selectedCount}
            </span>
          )}
        </div>
        <ChevronDown className={`size-3.5 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 min-w-[220px]"
          >
            <div className="p-2 max-h-[280px] overflow-y-auto no-scrollbar">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onSelect(option.id);
                    if (!multi) setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-bold ${isSelected(option.id)
                    ? "bg-primary/10 text-primary"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                >
                  <span className="truncate">{option.name}</span>
                  {isSelected(option.id) && <Check className="size-3.5" />}
                </button>
              ))}
            </div>
            {onClear && selectedCount > 0 && (
              <div className="p-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  onClick={() => {
                    onClear();
                    setIsOpen(false);
                  }}
                  className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReportsPageClient() {
  const [viewType, setViewType] = useState<ViewType>("Month");
  const [cursorDate, setCursorDate] = useState<Date>(new Date());
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showAllLiquidity, setShowAllLiquidity] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const allAccounts =
    useSelector((state: RootState) => state.accounts?.items) ?? EMPTY_ACCOUNTS;
  const accounts = useMemo(() => allAccounts.filter(a => !a.excludeFromAnalytics), [allAccounts]);

  const allTransactions =
    useSelector((state: RootState) => state.transactions?.items) ??
    EMPTY_TRANSACTIONS;
  const transactions = useMemo(() => {
    const includedIds = new Set(accounts.map(a => a.id));
    let filtered = allTransactions.filter(tx => includedIds.has(tx.accountId));

    if (selectedAccountIds.length > 0) {
      const selectedSet = new Set(selectedAccountIds);
      filtered = filtered.filter(tx => selectedSet.has(tx.accountId));
    }

    if (selectedCategoryIds.length > 0) {
      const selectedSet = new Set(selectedCategoryIds);
      filtered = filtered.filter(tx => selectedSet.has(tx.category));
    }

    if (selectedType !== "all") {
      filtered = filtered.filter(tx => tx.type === selectedType);
    }

    return filtered;
  }, [allTransactions, accounts, selectedAccountIds, selectedCategoryIds, selectedType]);

  const categories =
    useSelector((state: RootState) => state.categories?.items) ??
    EMPTY_CATEGORIES;
  const loading = useSelector(
    (state: RootState) =>
      state.transactions?.loading || state.accounts?.loading,
  );

  useEffect(() => {
    if (user) {
      dispatch(fetchAccounts());
      dispatch(fetchTransactions());
      dispatch(fetchCategories());
      dispatch(fetchGoals());
    }
  }, [dispatch, user]);

  const now = useMemo(() => new Date(), []);

  // Adjust cursor date when view type changes
  useEffect(() => {
    setCursorDate(new Date());
  }, [viewType]);

  const handlePrev = () => {
    setCursorDate((prev) => {
      const next = new Date(prev);
      if (viewType === "Day") next.setDate(next.getDate() - 1);
      if (viewType === "Week") next.setDate(next.getDate() - 7);
      if (viewType === "Month") {
        next.setMonth(next.getMonth() - 1);
      }
      if (viewType === "Year") next.setFullYear(next.getFullYear() - 1);
      return next;
    });
  };

  const handleNext = () => {
    setCursorDate((prev) => {
      const next = new Date(prev);
      if (viewType === "Day") next.setDate(next.getDate() + 1);
      if (viewType === "Week") next.setDate(next.getDate() + 7);
      if (viewType === "Month") {
        next.setMonth(next.getMonth() + 1);
      }
      if (viewType === "Year") next.setFullYear(next.getFullYear() + 1);
      return next;
    });
  };

  const formattedCursorDate = useMemo(() => {
    if (viewType === "Day") {
      return cursorDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    if (viewType === "Week") {
      const start = new Date(cursorDate);
      start.setDate(cursorDate.getDate() - cursorDate.getDay()); // Sunday
      const end = new Date(start);
      end.setDate(start.getDate() + 6); // Saturday
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    if (viewType === "Month") {
      const fiscalStartDay = user?.monthStartDate || 1;
      const start = getFiscalMonthStart(cursorDate, fiscalStartDay);

      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(end.getDate() - 1);

      // Helper to get ordinal suffix (st, nd, rd, th)
      const getOrdinal = (n: number) => {
        const v = n % 100;
        if (v >= 11 && v <= 13) return n + "th";
        const tail = n % 10;
        if (tail === 1) return n + "st";
        if (tail === 2) return n + "nd";
        if (tail === 3) return n + "rd";
        return n + "th";
      };

      const startDay = getOrdinal(start.getDate());
      const endDay = getOrdinal(end.getDate());

      const startMonth = start.toLocaleDateString("en-US", { month: "short" });
      const endMonth = end.toLocaleDateString("en-US", { month: "short" });

      const startYear = start.getFullYear();
      const endYear = end.getFullYear();

      if (startYear !== endYear) {
        return `${startDay} ${startMonth} ${startYear} to ${endDay} ${endMonth} ${endYear}`;
      }
      return `${startDay} ${startMonth} to ${endDay} ${endMonth} ${startYear}`;
    }
    return cursorDate.getFullYear().toString();
  }, [cursorDate, viewType, user?.monthStartDate]);

  const budgetTargets = user?.budgetTargets || {
    needs: 50,
    wants: 30,
    savings: 20,
  };

  const assets = accounts
    .filter((acc: { type: string }) => acc.type !== "debt")
    .reduce((sum: number, item: { balance: number }) => sum + item.balance, 0);
  const liabilities = Math.abs(
    accounts
      .filter((acc: { type: string }) => acc.type === "debt")
      .reduce(
        (sum: number, item: { balance: number }) => sum + item.balance,
        0,
      ),
  );
  const netWorth = assets - liabilities;

  // Calculate Net Worth History (Last 6 Months)
  const computedNetWorthHistory = useMemo(() => {
    const history: { month: string; value: number; dateObj: Date }[] = [];
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const monthStartDate = user?.monthStartDate || 1;
    for (let i = 0; i < 6; i++) {
      const d = getFiscalMonthStart(now, monthStartDate);
      d.setMonth(d.getMonth() - i);
      history.unshift({
        month: `${monthNames[d.getMonth()]}`,
        value: 0,
        dateObj: d,
      });
    }

    let runningNW = netWorth;
    const lastMonth = history[5];
    if (lastMonth) {
      lastMonth.value = runningNW;
    }

    for (let i = 4; i >= 0; i--) {
      const nextMonthData = history[i + 1];
      if (!nextMonthData) continue;
      const nextMonth = nextMonthData.dateObj;

      const txInNextMonth = transactions.filter((tx) => {
        if (tx.status === "pending_confirmation") return false;
        const txDate = new Date(tx.date);
        return txDate.getTime() >= nextMonth.getTime();
      });

      const netFlowNextMonth = txInNextMonth.reduce((acc, tx) => {
        return acc + (tx.type === "income" ? tx.amount : -tx.amount);
      }, 0);

      runningNW = runningNW - netFlowNextMonth;
      const currentItem = history[i];
      if (currentItem) {
        currentItem.value = runningNW > 0 ? runningNW : 0;
      }
    }

    return history;
  }, [transactions, netWorth, now, user?.monthStartDate]);

  // Calculate Net Worth Change percentage
  const netWorthChange = useMemo(() => {
    if (computedNetWorthHistory.length < 2) return 0;
    const last =
      computedNetWorthHistory[computedNetWorthHistory.length - 1]?.value || 0;
    const prev =
      computedNetWorthHistory[computedNetWorthHistory.length - 2]?.value || 0;
    if (prev === 0) return last > 0 ? 100 : 0;
    return parseFloat((((last - prev) / prev) * 100).toFixed(1));
  }, [computedNetWorthHistory]);

  const currentYear = cursorDate.getFullYear();



  // Filtering logic based on viewType
  const filteredTx = useMemo(() => {
    const monthStartDate = user?.monthStartDate || 1;
    const currentFiscalStart = getFiscalMonthStart(cursorDate, monthStartDate);

    const dStartOfWeek = new Date(cursorDate);
    dStartOfWeek.setDate(cursorDate.getDate() - cursorDate.getDay());
    dStartOfWeek.setHours(0, 0, 0, 0);

    const dEndOfWeek = new Date(dStartOfWeek);
    dEndOfWeek.setDate(dStartOfWeek.getDate() + 6);
    dEndOfWeek.setHours(23, 59, 59, 999);

    return transactions.filter((tx: Transaction) => {
      if (tx.status === "pending_confirmation") return false;
      const d = new Date(tx.date);

      if (viewType === "Day") {
        return (
          d.getDate() === cursorDate.getDate() &&
          d.getMonth() === cursorDate.getMonth() &&
          d.getFullYear() === cursorDate.getFullYear()
        );
      } else if (viewType === "Week") {
        return d.getTime() >= dStartOfWeek.getTime() && d.getTime() <= dEndOfWeek.getTime();
      } else if (viewType === "Month") {
        // Find end of month based on start of month
        const currentFiscalEnd = new Date(currentFiscalStart);
        currentFiscalEnd.setMonth(currentFiscalEnd.getMonth() + 1);
        currentFiscalEnd.setMilliseconds(currentFiscalEnd.getMilliseconds() - 1);
        return d.getTime() >= currentFiscalStart.getTime() && d.getTime() <= currentFiscalEnd.getTime();
      } else {
        return d.getFullYear() === currentYear;
      }
    });
  }, [transactions, currentYear, viewType, cursorDate, user?.monthStartDate]);

  const inflow = useMemo(
    () =>
      filteredTx
        .filter((tx: Transaction) => tx.type === "income")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [filteredTx],
  );
  const outflow = useMemo(
    () =>
      filteredTx
        .filter(
          (tx: Transaction) => tx.type === "expense" || tx.type === "transfer",
        )
        .reduce((sum, tx) => sum + tx.amount, 0),
    [filteredTx],
  );

  const fiftyThirtyTwenty = useMemo(() => {
    let needs = 0;
    let wants = 0;
    let savings = 0;

    filteredTx.forEach((tx: Transaction) => {
      if (tx.type === "expense" || tx.type === "transfer") {
        const cat = categories.find(
          (c) => c.id === tx.category || c.name === tx.category,
        );
        const pType =
          cat?.parentType || (tx.type === "transfer" ? "savings" : "needs");
        if (pType === "needs") needs += tx.amount;
        else if (pType === "wants") wants += tx.amount;
        else if (pType === "savings") savings += tx.amount;
      }
    });

    return {
      needs: {
        amount: needs,
        percent: outflow > 0 ? (needs / outflow) * 100 : 0,
      },
      wants: {
        amount: wants,
        percent: outflow > 0 ? (wants / outflow) * 100 : 0,
      },
      savings: {
        amount: savings,
        percent: outflow > 0 ? (savings / outflow) * 100 : 0,
      },
    };
  }, [filteredTx, categories, outflow]);

  const insights = useMemo(() => {
    const monthStartDate = user?.monthStartDate || 1;
    const currentFiscalStart = getFiscalMonthStart(new Date(), monthStartDate);

    const periodTx = transactions.filter((tx) => {
      if (tx.status === "pending_confirmation") return false;
      const d = new Date(tx.date);
      return d >= currentFiscalStart;
    });

    const monthlyIncome = periodTx
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthlyExpense = periodTx
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const savingsRate = monthlyIncome > 0
      ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100
      : 0;

    const liquidCapital = accounts
      .filter(a => !a.excludeFromAnalytics && a.type !== 'card')
      .reduce((sum, a) => sum + a.balance, 0);

    const score = monthlyExpense > 0
      ? (liquidCapital / monthlyExpense).toFixed(1)
      : (liquidCapital > 0 ? "100+" : "0");

    return {
      monthlyIncome,
      monthlyExpense,
      savingsRate: savingsRate.toFixed(1),
      liquidCapital,
      score: parseFloat(score)
    };
  }, [transactions, accounts, user?.monthStartDate]);

  const expenseBreakdown = useMemo(() => {
    const totals = filteredTx
      .filter(
        (tx: Transaction) => tx.type === "expense" || tx.type === "transfer",
      )
      .reduce(
        (acc: Record<string, number>, tx: Transaction) => {
          const catKey = tx.category || "transfer";
          acc[catKey] = (acc[catKey] || 0) + tx.amount;
          return acc;
        },
        {} as Record<string, number>,
      );

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([catKey, amount]) => {
        const catSettings = categories.find(
          (c) => c.id === catKey || c.name === catKey,
        );
        let displayName = catKey;
        let color = "bg-slate-500";
        if (catSettings) {
          displayName = catSettings.name;
          color = catSettings.color;
        } else if (catKey === "transfer") {
          displayName = "Transfers & Scaling";
          color = "bg-primary";
        }
        return {
          category: displayName,
          amount,
          percent: outflow > 0 ? (amount / outflow) * 100 : 0,
          color,
        };
      });
  }, [filteredTx, categories, outflow]);

  if (authLoading || (loading && transactions.length === 0)) {
    return (
      <PageContainer>
        <div className="space-y-3 mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={`stat-skeleton-${i}`}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-4 rounded-3xl shadow-sm space-y-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-2 w-12" />
                <Skeleton className="h-2 w-24" />
              </div>
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-white/5 h-[400px] flex flex-col gap-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="flex-1 w-full rounded-2xl" />
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-white/5 h-[400px] flex flex-col gap-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="flex-1 w-full rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!user) return null;

  return (
    <PageContainer className="gap-1.5 sm:gap-2">
      <PageHeader
        title="Intelligence"
        subtitle="Unified analytics & predictive insights"
        className="space-y-1.5"
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`h-8 px-3.5 flex-1 sm:flex-none flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border shadow-sm ${showFilters
                  ? "bg-primary text-white border-primary"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/50 dark:border-white/5 hover:border-primary/50"
                  }`}
              >
                {showFilters ? <X className="size-3.5" /> : <Filter className="size-3.5" />}
                <span>Filters</span>
                {(selectedAccountIds.length > 0 || selectedCategoryIds.length > 0 || selectedType !== "all") && (
                  <span className="size-4 rounded-full bg-rose-500 text-white text-[8px] flex items-center justify-center">
                    {selectedAccountIds.length + selectedCategoryIds.length + (selectedType !== "all" ? 1 : 0)}
                  </span>
                )}
              </button>

              {(selectedAccountIds.length > 0 || selectedCategoryIds.length > 0 || selectedType !== "all") && (
                <button
                  onClick={() => {
                    setSelectedAccountIds([]);
                    setSelectedCategoryIds([]);
                    setSelectedType("all");
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:scale-[1.03] active:scale-95 transition-all shrink-0"
                  title="Clear Filters"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 overflow-x-auto no-scrollbar shadow-sm w-full">
              {(["Day", "Week", "Month", "Year"] as ViewType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setViewType(type);
                  }}
                  className={`flex-1 sm:flex-none px-2.5 h-7.5 flex items-center justify-center text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${viewType === type
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between sm:justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-lg p-0.5 shadow-sm w-full sm:w-auto">
              <button
                onClick={handlePrev}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors shrink-0 disabled:opacity-20"
                aria-label="Previous Period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 px-1.5 min-w-[110px] sm:min-w-[130px] justify-center flex-1 sm:flex-auto">
                <CalendarIcon className="w-3 h-3 text-primary shrink-0" />
                <div className="flex flex-col items-center sm:flex-row sm:gap-1.5">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
                    {formattedCursorDate}
                  </span>
                </div>
              </div>
              <button
                onClick={handleNext}
                disabled={cursorDate.getTime() > now.getTime()}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors shrink-0 ${cursorDate.getTime() > now.getTime()
                  ? "opacity-20 cursor-not-allowed text-slate-300 dark:text-slate-600"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary"
                  }`}
                aria-label="Next Period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        }
      >
        {showFilters && (
          <div className="bg-slate-50/50 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm flex flex-wrap gap-2.5 mt-2">
            <div className="flex-1 min-w-[130px]">
              <FilterDropdown
                label="Account"
                multi
                value={selectedAccountIds}
                options={accounts.map(a => ({ id: a.id, name: a.name }))}
                onSelect={(id) => {
                  setSelectedAccountIds(prev =>
                    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                  );
                }}
                onClear={() => setSelectedAccountIds([])}
              />
            </div>

            <div className="flex-1 min-w-[130px]">
              <FilterDropdown
                label="Category"
                multi
                value={selectedCategoryIds}
                options={categories.map(c => ({ id: c.id, name: c.name }))}
                onSelect={(id) => {
                  setSelectedCategoryIds(prev =>
                    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                  );
                }}
                onClear={() => setSelectedCategoryIds([])}
              />
            </div>

            <div className="flex-1 min-w-[130px]">
              <FilterDropdown
                label="Type"
                value={selectedType}
                options={[
                  { id: "all", name: "All Types" },
                  { id: "income", name: "Income" },
                  { id: "expense", name: "Expense" },
                  { id: "transfer", name: "Transfers" },
                ]}
                onSelect={setSelectedType}
              />
            </div>
          </div>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-2 mb-0">
        <Card className="shadow-none border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-all group p-3">
          <div className="text-[10px] font-bold text-slate-400 mb-1 group-hover:text-primary transition-colors uppercase tracking-widest">
            Net Worth
          </div>
          <div className="text-base sm:text-xl font-black text-slate-900 dark:text-white mb-1 truncate shrink-0">
            {formatCurrency(netWorth)}
          </div>
          <div
            className={`flex items-center gap-1.5 text-[10px] font-black ${netWorthChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}
          >
            <ArrowUpRight
              className={`w-3 h-3 ${netWorthChange < 0 ? "rotate-90" : ""}`}
            />
            <span className="truncate">
              {netWorthChange >= 0 ? "+" : ""}
              {netWorthChange}%
            </span>
          </div>
        </Card>

        <Card className="shadow-none border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 transition-all group p-3">
          <div className="text-[10px] font-bold text-slate-400 mb-1 group-hover:text-emerald-500 transition-colors uppercase tracking-widest">
            Total Inflow
          </div>
          <div className="text-base sm:text-xl font-black text-emerald-600 mb-1 truncate shrink-0">
            {formatCurrency(inflow)}
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
            {filteredTx.filter((t) => t.type === "income").length} Confirmations
          </div>
        </Card>

        <Card className="shadow-none border-slate-100 dark:border-slate-800 hover:border-rose-500/50 transition-all group p-3">
          <div className="text-[10px] font-bold text-slate-400 mb-1 group-hover:text-rose-500 transition-colors uppercase tracking-widest">
            Total Outflow
          </div>
          <div className="text-base sm:text-xl font-black text-rose-500 mb-1 truncate shrink-0">
            {formatCurrency(outflow)}
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
            {filteredTx.filter((t) => t.type !== "income").length} Authorizations
          </div>
        </Card>

        <Card className="shadow-none border-slate-100 dark:border-slate-800 hover:border-amber-500/50 transition-all group p-3">
          <div className="text-[10px] font-bold text-slate-400 mb-1 group-hover:text-amber-500 transition-colors uppercase tracking-widest">
            Net Results
          </div>
          <div
            className={`text-base sm:text-xl font-black mb-1 truncate shrink-0 ${inflow - outflow >= 0 ? "text-emerald-600" : "text-rose-500"}`}
          >
            {formatCurrency(inflow - outflow)}
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
            Final Balance
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 mt-1.5 mb-0">
        <Card className="shadow-none border-slate-100 dark:border-slate-800 space-y-1.5 p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Percent className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  Equilibrium Scan
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Target Protocol Analysis
                </p>
              </div>
            </div>
            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">
              {viewType} Status
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-3 space-y-3 border border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Activity className="size-3 text-primary" />
                  </div>
                  <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Financial Freedom Score</span>
                </div>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg tracking-widest">
                  SCORE: {insights.score}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capital Endurance</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{insights.score} Months</span>
                </div>
                <ProgressBar progress={Math.min((insights.score / 6) * 100, 100)} className="h-1.5" />
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Your liquid capital covers <span className="text-primary">{insights.score} months</span> of current expansion. Target is 6.0 units.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {Object.entries(fiftyThirtyTwenty).map(([key, data]) => {
              const target = budgetTargets[key as keyof typeof budgetTargets];
              const isOver =
                key !== "savings" ? data.percent > target : data.percent < target;
              const diff = Math.abs(data.percent - target);

              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-[0.2em]">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-400">{key}</span>
                      <span className="text-slate-900 dark:text-white text-xs">
                        {formatCurrency(data.amount)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={
                          isOver && diff > 5 ? "text-rose-500" : "text-emerald-500"
                        }
                      >
                        {data.percent.toFixed(1)}% / {target}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                    <div
                      className="absolute top-0 bottom-0 left-0 bg-primary/20 p-px z-10 border-r-2 border-primary/40"
                      style={{ width: `${target}%` }}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isOver && diff > 5 ? "bg-rose-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(data.percent, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="shadow-none border-slate-100 dark:border-slate-800 space-y-1.5 p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  Absorption Grid
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Top Outflow Categories
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
            {(showAllExpenses
              ? expenseBreakdown
              : expenseBreakdown.slice(0, 6)
            ).map((e) => (
              <div key={e.category} className="space-y-2 group">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-400 group-hover:text-primary transition-colors">
                    {e.category}
                  </span>
                  <div className="flex gap-3">
                    <span className="text-slate-400">{e.percent.toFixed(1)}%</span>
                    <span className="text-slate-900 dark:text-white">
                      {formatCurrency(e.amount)}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`${e.color} h-full rounded-full`}
                    style={{ width: `${e.percent}%` }}
                  />
                </div>
              </div>
            ))}
            {expenseBreakdown.length === 0 && (
              <div className="col-span-full py-6 sm:py-10 text-center">
                <Activity className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  No transaction data traced
                </p>
              </div>
            )}
          </div>
          {expenseBreakdown.length > 6 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-center">
              <button
                onClick={() => setShowAllExpenses(!showAllExpenses)}
                className="flex items-center gap-2 px-6 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-primary transition-all border border-transparent hover:border-primary/20"
              >
                {showAllExpenses
                  ? "Collapse Breakdown"
                  : `Show ${expenseBreakdown.length - 6} More Categories`}
              </button>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5 mt-1.5 mb-0">
        {/* Account Liquidity Widget */}
        <Card className="shadow-none border-slate-100 dark:border-white/5 space-y-1.5 p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  Liquidity Grid
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Active Asset Distribution
                </p>
              </div>
            </div>
            <div className="text-[10px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
              {accounts.length} Nodes
            </div>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-2 no-scrollbar">
            {(showAllLiquidity ? accounts : accounts.slice(0, 4)).map((acc) => (
              <div key={acc.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 hover:border-primary/20 transition-all group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-white/10 group-hover:scale-110 transition-transform">
                    <Briefcase className="size-3.5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-black text-slate-900 dark:text-white truncate">{acc.name}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{acc.type}</div>
                  </div>
                </div>
                <div className="text-[11px] font-black text-slate-900 dark:text-white font-mono">
                  {formatCurrency(acc.balance)}
                </div>
              </div>
            ))}
          </div>
          {accounts.length > 4 && (
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-center">
              <button
                onClick={() => setShowAllLiquidity(!showAllLiquidity)}
                className="flex items-center gap-2 px-6 h-9 rounded-xl bg-slate-100 dark:bg-slate-900 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-all"
              >
                {showAllLiquidity ? "Minimize View" : `Audit ${accounts.length - 4} More Nodes`}
              </button>
            </div>
          )}
        </Card>

        {/* Savings Performance Widget */}
        <Card className="shadow-none border-slate-100 dark:border-white/5 space-y-1.5 p-2.5 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <PiggyBank size={140} />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <PiggyBank className="size-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  Savings Vector
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Accumulation Performance
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-4 py-4">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="text-4xl font-black text-emerald-500 tracking-tighter">
                {fiftyThirtyTwenty.savings.percent.toFixed(1)}%
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Current Savings Rate
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Target Efficiency</span>
                <span className="text-primary">{budgetTargets.savings}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((fiftyThirtyTwenty.savings.percent / budgetTargets.savings) * 100, 100)}%` }}
                  className={`h-full rounded-full ${fiftyThirtyTwenty.savings.percent >= budgetTargets.savings ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-primary'}`}
                />
              </div>
              <p className="text-[9px] font-bold text-slate-400 leading-relaxed text-center px-4">
                {fiftyThirtyTwenty.savings.percent >= budgetTargets.savings
                  ? "EXCELLENT: Your accumulation vector is outperforming the target protocol. Surplus capital identified."
                  : `ATTENTION: You are currently operating at ${(budgetTargets.savings - fiftyThirtyTwenty.savings.percent).toFixed(1)}% below your defined savings architecture.`}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
