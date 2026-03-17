"use client";

import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { Transaction, Account, Category } from "@repo/types";
import { Card } from "@/components/ui/Card";
import { formatCurrency, getFiscalMonthStart } from "@/lib/utils";
import { IncomeExpenseChart } from "@/components/dashboard/IncomeExpenseChart";
import { SavingsVelocityChart } from "@/components/dashboard/SavingsVelocityChart";
import { TrendingDown, ArrowUpRight, Activity, Percent, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { fetchTransactions } from "@/store/slices/transactionsSlice";
import { fetchAccounts } from "@/store/slices/accountsSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchGoals } from "@/store/slices/goalsSlice";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/components/auth/AuthProvider";

type ViewType = "Day" | "Week" | "Month" | "Year";

const EMPTY_ACCOUNTS: Account[] = [];
const EMPTY_TRANSACTIONS: Transaction[] = [];
const EMPTY_CATEGORIES: Category[] = [];

export default function ReportsPageClient() {
  const [viewType, setViewType] = useState<ViewType>("Month");
  const [cursorDate, setCursorDate] = useState<Date>(new Date());
  const [showAllExpenses, setShowAllExpenses] = useState(false);
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
    return allTransactions.filter(tx => includedIds.has(tx.accountId));
  }, [allTransactions, accounts]);

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
  const currentMonth = cursorDate.getMonth();

  // Trend data labels - Dynamic based on viewType
  const trendData = useMemo(() => {
    const data = [];
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (viewType === "Day") {
      const intervals = [
        { name: "Night (12am-6am)", start: 0, end: 6 },
        { name: "Morning (6am-12pm)", start: 6, end: 12 },
        { name: "Afternoon (12pm-6pm)", start: 12, end: 18 },
        { name: "Evening (6pm-12am)", start: 18, end: 24 },
      ];
      intervals.forEach((interval) => {
        const intervalTx = transactions.filter((tx) => {
          if (tx.status === "pending_confirmation") return false;
          const d = new Date(tx.date);
          return (
            d.getDate() === cursorDate.getDate() &&
            d.getMonth() === cursorDate.getMonth() &&
            d.getFullYear() === cursorDate.getFullYear() &&
            d.getHours() >= interval.start &&
            d.getHours() < interval.end
          );
        });
        const mInflow = intervalTx
          .filter((tx: Transaction) => tx.type === "income")
          .reduce((sum, tx) => sum + tx.amount, 0);
        const mOutflow = intervalTx
          .filter(
            (tx: Transaction) =>
              tx.type === "expense" || tx.type === "transfer",
          )
          .reduce((sum, tx) => sum + tx.amount, 0);
        data.push({
          name: interval.name,
          income: mInflow,
          expense: mOutflow,
          velocity: mInflow - mOutflow,
        });
      });
    } else if (viewType === "Week") {
      const startOfWeek = new Date(cursorDate);
      startOfWeek.setDate(cursorDate.getDate() - cursorDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const targetDay = new Date(startOfWeek);
        targetDay.setDate(startOfWeek.getDate() + i);

        const dayTx = transactions.filter((tx) => {
          if (tx.status === "pending_confirmation") return false;
          const d = new Date(tx.date);
          return (
            d.getDate() === targetDay.getDate() &&
            d.getMonth() === targetDay.getMonth() &&
            d.getFullYear() === targetDay.getFullYear()
          );
        });

        const mInflow = dayTx
          .filter((tx: Transaction) => tx.type === "income")
          .reduce((sum, tx) => sum + tx.amount, 0);
        const mOutflow = dayTx
          .filter(
            (tx: Transaction) =>
              tx.type === "expense" || tx.type === "transfer",
          )
          .reduce((sum, tx) => sum + tx.amount, 0);
        data.push({
          name: dayNames[i] || "???",
          income: mInflow,
          expense: mOutflow,
          velocity: mInflow - mOutflow,
        });
      }
    } else if (viewType === "Month") {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        // Find transactions for this specific day
        const dayTx = transactions.filter((tx) => {
          if (tx.status === "pending_confirmation") return false;
          const d = new Date(tx.date);
          return (
            d.getDate() === i &&
            d.getMonth() === currentMonth &&
            d.getFullYear() === currentYear
          );
        });
        const mInflow = dayTx
          .filter((tx: Transaction) => tx.type === "income")
          .reduce((sum, tx) => sum + tx.amount, 0);
        const mOutflow = dayTx
          .filter(
            (tx: Transaction) =>
              tx.type === "expense" || tx.type === "transfer",
          )
          .reduce((sum, tx) => sum + tx.amount, 0);
        data.push({
          name: `${i}`,
          income: mInflow,
          expense: mOutflow,
          velocity: mInflow - mOutflow,
        });
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const monthTx = transactions.filter((tx) => {
          if (tx.status === "pending_confirmation") return false;
          const d = new Date(tx.date);
          return d.getMonth() === i && d.getFullYear() === currentYear;
        });
        const mInflow = monthTx
          .filter((tx: Transaction) => tx.type === "income")
          .reduce((sum, tx) => sum + tx.amount, 0);
        const mOutflow = monthTx
          .filter(
            (tx: Transaction) =>
              tx.type === "expense" || tx.type === "transfer",
          )
          .reduce((sum, tx) => sum + tx.amount, 0);
        data.push({
          name: monthNames[i] || "???",
          income: mInflow,
          expense: mOutflow,
          velocity: mInflow - mOutflow,
        });
      }
    }
    return data;
  }, [transactions, viewType, currentYear, currentMonth, cursorDate]);

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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-8 animate-pulse text-center">
        <div className="space-y-3 flex flex-col items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={`skeleton-${i}`}
              className="space-y-3 shadow-none border-slate-100 dark:border-slate-800"
            >
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-24" />
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="h-[400px] shadow-none border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="flex-1 w-full" />
          </Card>
          <Card className="h-[400px] shadow-none border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="flex-1 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-4 sm:space-y-6 pb-20 lg:pb-8 pt-0">
      <PageHeader
        title="Intelligence"
        subtitle="Unified analytics & predictive insights"
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 overflow-x-auto no-scrollbar shadow-sm w-full sm:w-auto">
              {(["Day", "Week", "Month", "Year"] as ViewType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 h-9 flex items-center justify-center text-[10px] sm:text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${viewType === type
                    ? "bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl p-1 shadow-sm w-full sm:w-auto">
              <button
                onClick={handlePrev}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors shrink-0"
                aria-label="Previous Period"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 px-2 min-w-[120px] sm:min-w-[140px] justify-center flex-1 sm:flex-auto">
                <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="flex flex-col items-center sm:flex-row sm:gap-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 truncate">
                    {formattedCursorDate}
                  </span>
                </div>
              </div>
              <button
                onClick={handleNext}
                disabled={cursorDate.getTime() > now.getTime()}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors shrink-0 ${cursorDate.getTime() > now.getTime()
                  ? "opacity-50 cursor-not-allowed text-slate-300 dark:text-slate-600"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary"
                  }`}
                aria-label="Next Period"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="sm:p-6 shadow-none border-slate-100 dark:border-slate-800 hover:border-primary/50 transition-all group">
          <div className="text-xs font-bold text-slate-400 mb-2 group-hover:text-primary transition-colors">
            Net Worth
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mb-2 truncate shrink-0">
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

        <Card className="sm:p-6 shadow-none border-slate-100 dark:border-slate-800 hover:border-emerald-500/50 transition-all group">
          <div className="text-xs font-bold text-slate-400 mb-2 group-hover:text-emerald-500 transition-colors">
            Inflow
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-500 mb-2 truncate shrink-0">
            {formatCurrency(inflow)}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
            <Activity className="w-3 h-3" />
            <span className="truncate leading-none">STREAMS</span>
          </div>
        </Card>

        <Card className="sm:p-6 shadow-none border-slate-100 dark:border-slate-800 hover:border-rose-500/50 transition-all group">
          <div className="text-xs font-bold text-slate-400 mb-2 group-hover:text-rose-500 transition-colors">
            Outflow
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-500 mb-2 truncate shrink-0">
            {formatCurrency(outflow)}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-500/80">
            <TrendingDown className="w-3 h-3" />
            <span className="truncate leading-none">TRACKED</span>
          </div>
        </Card>

        <Card className="sm:p-6 shadow-none border-slate-100 dark:border-slate-800 bg-primary/[0.03] border-primary/10 hover:bg-primary/[0.05] transition-all group">
          <div className="text-xs font-bold text-primary/60 mb-2">Savings</div>
          <div className="text-lg sm:text-2xl font-black text-primary mb-2 truncate shrink-0">
            {formatCurrency(inflow - outflow)}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-primary/80">
            <Percent className="w-3 h-3" />
            <span className="truncate leading-none">
              {inflow > 0 ? Math.round(((inflow - outflow) / inflow) * 100) : 0}% RATE
            </span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
            Cash Flow Dynamics
          </h3>
          <Card className="sm:p-8 shadow-none border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px] flex items-center justify-center">
            {trendData.some((d) => d.income > 0 || d.expense > 0) ? (
              <IncomeExpenseChart data={trendData} />
            ) : (
              <div className="text-center py-12">
                <Activity className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No historical flux detected
                </p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
            Savings Velocity
          </h3>
          <Card className="sm:p-8 shadow-none border-slate-100 dark:border-slate-800 overflow-hidden min-h-[400px] flex items-center justify-center">
            {trendData.some((d) => Math.abs(d.velocity) > 0) ? (
              <SavingsVelocityChart
                data={trendData.map((d) => ({
                  month: d.name,
                  velocity: d.velocity,
                }))}
              />
            ) : (
              <div className="text-center py-12">
                <TrendingDown className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Velocity engine idle
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Budget Target Benchmark
          </h3>
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">
            Total Outflow: {formatCurrency(outflow)}
          </span>
        </div>
        <Card className="sm:p-8 shadow-none border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Needs
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {Math.round(fiftyThirtyTwenty.needs.percent)}% / Target{" "}
                    {budgetTargets.needs}%
                  </span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {formatCurrency(fiftyThirtyTwenty.needs.amount)}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`bg-indigo-500 h-full rounded-full`}
                  style={{
                    width: `${Math.min(fiftyThirtyTwenty.needs.percent, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Wants
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {Math.round(fiftyThirtyTwenty.wants.percent)}% / Target{" "}
                    {budgetTargets.wants}%
                  </span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {formatCurrency(fiftyThirtyTwenty.wants.amount)}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`bg-pink-500 h-full rounded-full`}
                  style={{
                    width: `${Math.min(fiftyThirtyTwenty.wants.percent, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Savings & Inv.
                  </span>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {Math.round(fiftyThirtyTwenty.savings.percent)}% / Target{" "}
                    {budgetTargets.savings}%
                  </span>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {formatCurrency(fiftyThirtyTwenty.savings.amount)}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`bg-emerald-500 h-full rounded-full`}
                  style={{
                    width: `${Math.min(fiftyThirtyTwenty.savings.percent, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
          Expense Intensity Breakdown
        </h3>
        <Card className="sm:p-8 shadow-none border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-6 sm:gap-y-8">
            {(showAllExpenses
              ? expenseBreakdown
              : expenseBreakdown.slice(0, 6)
            ).map((e, index) => (
              <div key={e.category || index} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {e.category}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {Math.round(e.percent)}% CONTRIBUTION
                    </span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {formatCurrency(e.amount)}
                  </span>
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
              <div className="col-span-full py-12 sm:py-20 text-center">
                <Activity className="w-8 h-8 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  No transaction data traced
                </p>
              </div>
            )}
          </div>
          {expenseBreakdown.length > 6 && (
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-center">
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
    </div>
  );
}
