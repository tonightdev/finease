"use client";

import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchAccounts } from "@/store/slices/accountsSlice";
import {
  fetchStrategy,
  saveStrategy,
  addStrategyEntry,
  updateStrategyEntry,
  removeStrategyEntry,
  setStrategyBasis,
} from "@/store/slices/strategiesSlice";
import { Card } from "@/components/ui/Card";
import {
  Target,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Trash2,
  Edit2,
  Activity,
  AlertCircle,
  Save,
  Calendar,
  Clock,
  Zap,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/ui/PageContainer";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { StrategyEntry, Account, Category } from "@repo/types";

export default function StrategiesPage() {
  const { user, loading: authLoading, updateProfile } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector((state: RootState) => state.categories.items);
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const {
    current,
    loading: strategyLoading,
    lastFetched,
  } = useSelector((state: RootState) => state.strategies);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchAccounts());
    dispatch(fetchStrategy());
  }, [dispatch]);

  // Local state for sandbox strategy
  const [entries, setEntries] = useState<StrategyEntry[]>([]);
  const [protocol, setProtocol] = useState({
    needs: 50,
    wants: 30,
    savings: 20,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mobileTab, setMobileTab] = useState<"matrix" | "controls">("matrix");
  const [projectionMonths, setProjectionMonths] = useState(12);

  // Helper for protocol colors
  const getProtocolColor = (parentType?: string, type?: string) => {
    if (type === "transfer") return "text-sky-500";
    switch (parentType?.toLowerCase()) {
      case "needs":
        return "text-amber-500";
      case "wants":
        return "text-rose-500";
      case "savings":
        return "text-indigo-500";
      case "income":
        return "text-emerald-500";
      default:
        return "text-slate-400";
    }
  };

  const sortedEntries = useMemo(() => {
    const getRank = (entry: StrategyEntry) => {
      if (entry.type === "income") return 0;
      if (entry.type === "transfer") return 4;
      const pt = entry.parentType?.toLowerCase() || "needs";
      if (pt === "needs") return 1;
      if (pt === "savings" || pt === "saving") return 2;
      if (pt === "wants") return 3;
      return 5;
    };

    // Default: Sort by income, needs, savings, wants, then transfer at last, then alphabetically
    return [...entries].sort((a, b) => {
      const rankA = getRank(a);
      const rankB = getRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return (a.description || a.categoryName || "").localeCompare(
        b.description || b.categoryName || "",
        undefined,
        { sensitivity: "base" },
      );
    });
  }, [entries]);

  // New entry form state
  const [newEntry, setNewEntry] = useState<{
    amount: string;
    description: string;
    categoryId: string;
    type: "income" | "outflow" | "transfer";
    accountId: string;
    toAccountId: string;
    isMonthly: boolean;
  }>({
    amount: "",
    description: "",
    categoryId: "",
    type: "outflow",
    accountId: "",
    toAccountId: "",
    isMonthly: true,
  });

  // Load persistence state locally
  useEffect(() => {
    // Wait for the strategy to finish loading from the backend
    if (strategyLoading || lastFetched === null) return;

    // Only auto-initialize if we haven't already or if we are stuck in an empty state while data is available
    const hasCloudData =
      current &&
      (current.entries?.length > 0 ||
        (current.userId && current.userId !== ""));
    const isSandboxEmpty = entries.length === 0;

    if (hasCloudData && (isSandboxEmpty || !isInitialized)) {
      setEntries(current.entries || []);
      const initialProtocol = current.protocol ||
        user?.budgetTargets || { needs: 50, savings: 20, wants: 30 };
      setProtocol(initialProtocol);
      setIsInitialized(true);
    } else if (current?.userId === "" && !isInitialized) {
      // Handle case where strategy is truly empty/new (after first fetch)
      if (user?.budgetTargets) {
        setProtocol(user.budgetTargets);
      }
      setIsInitialized(true);
    }
  }, [
    current,
    isInitialized,
    strategyLoading,
    user,
    lastFetched,
    entries.length,
  ]);

  useEffect(() => {
    if (user?.budgetTargets) {
      const { needs = 50, savings = 20, wants = 30 } = user.budgetTargets;
      setProtocol((prev) => {
        if (
          prev.needs !== needs ||
          prev.savings !== savings ||
          prev.wants !== wants
        ) {
          return { needs, savings, wants };
        }
        return prev;
      });
    }
  }, [user?.budgetTargets]);

  const isProtocolValid = useMemo(() => {
    const { needs, savings, wants } = protocol;
    return needs + savings + wants === 100;
  }, [protocol]);

  const isProtocolDirty = useMemo(() => {
    const base = current?.protocol || user?.budgetTargets;
    if (!base) return true;
    return (
      protocol.needs !== base.needs ||
      protocol.savings !== base.savings ||
      protocol.wants !== base.wants
    );
  }, [protocol, current?.protocol, user?.budgetTargets]);

  // Auto-save logic removed in favor of granular entry persistence

  const handleBasisToggle = (newBasis: "monthly" | "yearly") => {
    if (newBasis === current?.basis) return;
    setIsSwitching(true);
    dispatch(setStrategyBasis(newBasis));
    toast.success(`Switched to ${newBasis} view`);
    setTimeout(() => setIsSwitching(false), 400);
  };

  const handleSaveProtocol = async () => {
    if (!isProtocolValid) {
      toast.error("Protocol must total exactly 100% before saving.");
      return;
    }
    if (!isProtocolDirty) {
      toast.success("Protocol is already finalized and up to date.");
      return;
    }
    try {
      // 1. Sync Strategy Cloud Store
      await dispatch(
        saveStrategy({
          protocol,
          entries,
        }),
      ).unwrap();

      // 2. Simultaneously sync User Profile Financial Adherence Rules
      if (updateProfile) {
        await updateProfile({
          budgetTargets: {
            needs: protocol.needs,
            savings: protocol.savings,
            wants: protocol.wants,
          },
        });
      }

      toast.success("Strategy protocol and financial adherence synced.");
    } catch {
      toast.error("Failed to sync strategy.");
    }
  };

  const filteredCategories = useMemo(() => {
    return categories
      .filter((c) =>
        newEntry.type === "income"
          ? c.type === "income" || c.parentType === "income"
          : c.type !== "income" && c.parentType !== "income",
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
  }, [categories, newEntry.type]);

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((a: Account) => {
        const type = a.type?.toLowerCase() || "";
        return !["asset", "debt", "investment", "card"].includes(type);
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
  }, [accounts]);

  // Derived calculations (Real-time)
  const strategyMetrics = useMemo(() => {
    let income = 0;
    let needsTotal = 0;
    let wantsTotal = 0;
    let savingsTotal = 0;

    const accountFlows: Record<
      string,
      { name: string; netFlow: number; income: number; outflow: number }
    > = {};

    entries.forEach((entry) => {
      let amt = parseFloat(entry.amount) || 0;

      // Dynamic Scaling
      if (current?.basis === "yearly" && (entry.isMonthly ?? true)) {
        amt *= 12;
      } else if (current?.basis === "monthly" && !(entry.isMonthly ?? true)) {
        amt /= 12;
      }

      if (entry.accountId) {
        if (!accountFlows[entry.accountId]) {
          accountFlows[entry.accountId] = {
            name: entry.accountName,
            netFlow: 0,
            income: 0,
            outflow: 0,
          };
        }
      }

      // If internal transfer, also ensure destination account is tracked in accountFlows
      if (entry.type === "transfer" && entry.toAccountId) {
        if (!accountFlows[entry.toAccountId]) {
          accountFlows[entry.toAccountId] = {
            name: entry.toAccountName || "Destination Account",
            netFlow: 0,
            income: 0,
            outflow: 0,
          };
        }
      }

      const flow = entry.accountId ? accountFlows[entry.accountId] : null;

      if (entry.type === "transfer") {
        // Internal account transfer: source loses funds, destination receives funds
        if (flow) {
          flow.netFlow -= amt;
          flow.outflow += amt;
        }
        if (entry.toAccountId && accountFlows[entry.toAccountId]) {
          const destFlow = accountFlows[entry.toAccountId];
          if (destFlow) {
            destFlow.netFlow += amt;
            destFlow.income += amt;
          }
        }
        // Transfers do not count as protocol income or external expense
      } else if (entry.type === "income") {
        income += amt;
        if (flow) {
          flow.netFlow += amt;
          flow.income += amt;
        }
      } else {
        if (flow) {
          flow.netFlow -= amt;
          flow.outflow += amt;
        }
        if (entry.parentType === "needs") needsTotal += amt;
        else if (entry.parentType === "wants") wantsTotal += amt;
        else if (entry.parentType === "savings") savingsTotal += amt;
        else needsTotal += amt;
      }
    });

    const totalOutflows = needsTotal + wantsTotal + savingsTotal;
    const surplus = income - totalOutflows;

    const needsPct = income > 0 ? (needsTotal / income) * 100 : 0;
    const wantsPct = income > 0 ? (wantsTotal / income) * 100 : 0;
    const savingsPct = income > 0 ? (savingsTotal / income) * 100 : 0;

    const suggestions: string[] = [];
    let efficiency = 100;

    if (income === 0 && totalOutflows > 0) {
      suggestions.push(
        "CRITICAL: Zero income injection detected. Your strategy architecture cannot sustain these outflows without an active income vector.",
      );
      efficiency = 0;
    } else {
      // AI-Logic: Needs Analysis
      if (needsPct > protocol.needs) {
        const excess = needsTotal - income * (protocol.needs / 100);
        suggestions.push(
          `High Fixed Costs: Needs are ${needsPct.toFixed(1)}% of income (Target: ${protocol.needs}%). Consider redirecting ${formatCurrency(excess)} to Savings to achieve protocol alignment.`,
        );
        efficiency -= needsPct - protocol.needs;
      }

      // AI-Logic: Wants Analysis
      if (wantsPct > protocol.wants) {
        const luxuryExcess = wantsTotal - income * (protocol.wants / 100);
        suggestions.push(
          `Lifestyle Inflation: Wants are currently consuming ${formatCurrency(luxuryExcess)} more than your ${protocol.wants}% protocol allowance.`,
        );
        efficiency -= wantsPct - protocol.wants;
      }

      // AI-Logic: Savings Velocity
      if (savingsPct < protocol.savings) {
        const gap = income * (protocol.savings / 100) - savingsTotal;
        suggestions.push(
          `Savings Deficit: To hit your ${protocol.savings}% goal, you need to increase your savings vector by ${formatCurrency(gap)} per ${current?.basis === "yearly" ? "year" : "month"}.`,
        );
        efficiency -= protocol.savings - savingsPct;
      }

      if (surplus < 0) {
        suggestions.unshift(
          `ALARM: Simulated Deficit of ${formatCurrency(Math.abs(surplus))}. Your current lifestyle/overhead vectors are mathematically unsustainable.`,
        );
        efficiency = Math.max(0, efficiency - 40);
      } else if (surplus > 0 && efficiency > 90) {
        suggestions.push(
          "Optimal Configuration: Your current vectors and protocol are perfectly aligned. You are maximizing capital efficiency.",
        );
      }

      // 4. Emergency Fund Analysis (New)
      const monthlyNeeds =
        current?.basis === "yearly" ? needsTotal / 12 : needsTotal;
      const targetEF = monthlyNeeds * 6;
      const currentLiquidSavings = accounts
        .filter(
          (a) =>
            !["debt", "card", "asset"].includes(a.type?.toLowerCase() || ""),
        )
        .reduce((sum, a) => sum + (a.balance || 0), 0);

      const monthlySavingsFlow =
        current?.basis === "yearly" ? savingsTotal / 12 : savingsTotal;

      if (currentLiquidSavings < targetEF) {
        const efGap = targetEF - currentLiquidSavings;
        const monthsToEF =
          monthlySavingsFlow > 0
            ? Math.ceil(efGap / monthlySavingsFlow)
            : Infinity;

        if (monthsToEF === Infinity) {
          suggestions.push(
            `EMERGENCY FUND: You need ${formatCurrency(targetEF)} for 6 months of backup. Increase savings vector to start building this buffer.`,
          );
        } else {
          suggestions.push(
            `ROADMAP: You'll reach your 6-month Emergency Fund of ${formatCurrency(targetEF)} in ${monthsToEF} months at your current ${formatCurrency(monthlySavingsFlow)} monthly rate.`,
          );
        }
      } else {
        suggestions.push(
          `SECURE: Your liquid reserves (${formatCurrency(currentLiquidSavings)}) fully cover 6 months of essential needs. Optimal safety achieved.`,
        );
      }
    }

    const activeAccounts = Object.entries(accountFlows)
      .map(([id, data]) => {
        // Normalize monthly net flow before multiplying by projectionMonths
        const monthlyNetFlow =
          current?.basis === "yearly" ? data.netFlow / 12 : data.netFlow;
        const projectedBalance = monthlyNetFlow * projectionMonths;

        return {
          id,
          name: data.name,
          netFlow: data.netFlow,
          monthlyNetFlow,
          projectedBalance,
          income: data.income,
          outflow: data.outflow,
        };
      })
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );

    return {
      income,
      needsTotal,
      wantsTotal,
      savingsTotal,
      totalOutflows,
      surplus,
      needsPct,
      wantsPct,
      savingsPct,
      suggestions: suggestions.slice(0, 4), // Keep it concise
      efficiency: Math.max(0, Math.min(100, Math.round(efficiency))),
      activeAccounts,
    };
  }, [entries, protocol, current?.basis, projectionMonths, accounts]);

  const hasData = entries.length > 0 && strategyMetrics.income > 0;

  const sentinelInsight = useMemo(() => {
    if (!hasData) {
      return {
        type: "neutral" as const,
        icon: Target,
        message: `Strategy protocol initialized to ${protocol.needs}% Needs, ${protocol.savings}% Savings, and ${protocol.wants}% Wants. Add income and expense entries to stream real-time drift telemetry.`,
        badge: "BASELINE PROTOCOL",
        badgeStyle: "bg-primary/10 text-primary border-primary/20",
        bannerStyle:
          "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-white/5 text-slate-600 dark:text-slate-300",
      };
    }

    const savingsDeficit = protocol.savings - strategyMetrics.savingsPct;
    const needsOverrun = strategyMetrics.needsPct - protocol.needs;
    const wantsOverrun = strategyMetrics.wantsPct - protocol.wants;
    const maxDeficit = Math.max(savingsDeficit, needsOverrun, wantsOverrun);

    if (maxDeficit <= 0) {
      return {
        type: "optimal" as const,
        icon: CheckCircle2,
        message: `Equilibrium Achieved: All execution vectors are operating in harmony with your ${protocol.needs}/${protocol.savings}/${protocol.wants} strategy protocol.`,
        badge: "PROTOCOL ALIGNED",
        badgeStyle: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        bannerStyle:
          "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
      };
    }

    if (savingsDeficit === maxDeficit && savingsDeficit > 0) {
      const gapAmount = strategyMetrics.income * (savingsDeficit / 100);
      return {
        type: "savings" as const,
        icon: TrendingUp,
        message: `Savings Deficit Alert: Savings is trailing by ${savingsDeficit.toFixed(1)}% (${formatCurrency(gapAmount)} gap). Increase savings allocations to hit your ${protocol.savings}% protocol target.`,
        badge: "SAVINGS FOCUS",
        badgeStyle: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        bannerStyle:
          "bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300",
      };
    }

    if (needsOverrun === maxDeficit && needsOverrun > 0) {
      const excessAmount = strategyMetrics.income * (needsOverrun / 100);
      return {
        type: "needs" as const,
        icon: AlertTriangle,
        message: `Needs Drift Alert: Fixed costs consume ${strategyMetrics.needsPct.toFixed(1)}% of flow (+${needsOverrun.toFixed(1)}% over target, ${formatCurrency(excessAmount)} excess). Review recurring overhead to restore buffer.`,
        badge: "NEEDS FOCUS",
        badgeStyle: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        bannerStyle:
          "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300",
      };
    }

    if (wantsOverrun === maxDeficit && wantsOverrun > 0) {
      const luxuryExcess = strategyMetrics.income * (wantsOverrun / 100);
      return {
        type: "wants" as const,
        icon: AlertCircle,
        message: `Lifestyle Drift Alert: Discretionary Wants consume ${strategyMetrics.wantsPct.toFixed(1)}% of flow (+${wantsOverrun.toFixed(1)}% over protocol, ${formatCurrency(luxuryExcess)} excess). Constrain lifestyle inflation.`,
        badge: "WANTS FOCUS",
        badgeStyle: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        bannerStyle:
          "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300",
      };
    }

    return {
      type: "optimal" as const,
      icon: CheckCircle2,
      message:
        "Execution vectors are in healthy alignment with target protocol benchmarks.",
      badge: "OPTIMAL FLOW",
      badgeStyle: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      bannerStyle:
        "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    };
  }, [hasData, protocol, strategyMetrics]);

  const handleAddEntry = () => {
    if (!newEntry.amount || parseFloat(newEntry.amount) <= 0) {
      toast.error("Valid positive amount is required.");
      return;
    }
    if (!newEntry.description.trim()) {
      toast.error("Description is required.");
      return;
    }
    if (!newEntry.accountId) {
      toast.error("Account routing is required.");
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === newEntry.accountId);
    if (!selectedAcc) {
      toast.error("Invalid account routing.");
      return;
    }

    let toAcc: Account | undefined;
    let selectedCat: Category | undefined;

    if (newEntry.type === "transfer") {
      if (!newEntry.toAccountId) {
        toast.error("Destination account is required for transfers.");
        return;
      }
      if (newEntry.accountId === newEntry.toAccountId) {
        toast.error("Source and destination accounts must be different.");
        return;
      }
      toAcc = accounts.find((a) => a.id === newEntry.toAccountId);
      if (!toAcc) {
        toast.error("Invalid destination account.");
        return;
      }
    } else {
      selectedCat = categories.find((c) => c.id === newEntry.categoryId);
      if (!selectedCat) {
        toast.error("Classification category is required.");
        return;
      }
    }

    const entryData: StrategyEntry = {
      id: editingId || Math.random().toString(36).substring(7),
      amount: newEntry.amount,
      isMonthly: newEntry.isMonthly,
      description: newEntry.description.trim(),
      categoryId: selectedCat?.id || "transfer",
      categoryName: selectedCat?.name || "Internal Transfer",
      accountId: selectedAcc.id,
      accountName: selectedAcc.name,
      toAccountId: toAcc?.id,
      toAccountName: toAcc?.name,
      parentType:
        newEntry.type === "transfer"
          ? undefined
          : selectedCat?.parentType ||
            (newEntry.type === "income" ? "income" : "needs"),
      type: newEntry.type,
    };

    if (editingId) {
      setEntries((prev) =>
        prev.map((e) => (e.id === editingId ? { ...e, ...entryData } : e)),
      );
      dispatch(updateStrategyEntry({ id: editingId, data: entryData }));
      setEditingId(null);
      toast.success("Vector updated.");
    } else {
      setEntries((prev) => [...prev, entryData]);
      dispatch(addStrategyEntry(entryData));
      toast.success("Vector recorded.");
    }
    setNewEntry({
      amount: "",
      description: "",
      categoryId: "",
      accountId: "",
      toAccountId: "",
      type: "outflow",
      isMonthly: true,
    });
  };

  const handleEditEntry = (entry: StrategyEntry) => {
    setEditingId(entry.id);
    setNewEntry({
      amount: entry.amount,
      description: entry.description,
      categoryId: entry.categoryId || "",
      accountId: entry.accountId || "",
      toAccountId: entry.toAccountId || "",
      type: entry.type,
      isMonthly: entry.isMonthly ?? true,
    });
    setMobileTab("controls");
  };

  const handleRemoveEntry = (id: string) => {
    setEntries((prev) => prev.filter((o) => o.id !== id));
    dispatch(removeStrategyEntry(id));
  };

  const handleProtocolChange = (key: keyof typeof protocol, value: number) => {
    setProtocol((prev) => ({ ...prev, [key]: value }));
  };

  if (authLoading || (strategyLoading && !isInitialized)) {
    return (
      <PageContainer>
        <div className="space-y-2 mb-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-col xl:flex-row gap-6 xl:gap-4 items-start">
          <div className="xl:w-[380px] w-full shrink-0 flex flex-col gap-4 sm:gap-4 xl:gap-5">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <div className="space-y-3">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <div className="space-y-6 pt-2">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          </div>
          <div className="flex-1 w-full bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-none sm:rounded-[2rem] border border-slate-100 dark:border-white/5 min-h-[600px] space-y-6">
            <div className="flex justify-between items-center border-b border-slate-50 dark:border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-2xl" />
              ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-white/5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/50 dark:bg-white/5"
                  >
                    <Skeleton className="size-8 rounded-lg shrink-0" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-2 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50/50 dark:bg-white/5 p-4 rounded-2xl space-y-3">
              <Skeleton className="h-4 w-40" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-4/6" />
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Strategies Hub"
        subtitle="Standalone sandbox for real-time predictive financial modeling."
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
              <button
                onClick={() => handleBasisToggle("monthly")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${(current?.basis || "monthly") === "monthly" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                <Clock className="size-3" /> Monthly
              </button>
              <button
                onClick={() => handleBasisToggle("yearly")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${current?.basis === "yearly" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                <Calendar className="size-3" /> Yearly
              </button>
            </div>

            <div className="sm:hidden flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5 h-11">
              <button
                onClick={() => handleBasisToggle("monthly")}
                className={`flex-1 h-full flex items-center justify-center gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${(current?.basis || "monthly") === "monthly" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500"}`}
              >
                <Clock className="size-3.5" /> Monthly
              </button>
              <button
                onClick={() => handleBasisToggle("yearly")}
                className={`flex-1 h-full flex items-center justify-center gap-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${current?.basis === "yearly" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500"}`}
              >
                <Calendar className="size-3.5" /> Yearly
              </button>
            </div>

            <div className="xl:hidden flex bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-sm sm:w-[240px] h-11">
              <button
                onClick={() => setMobileTab("matrix")}
                className={`flex-1 h-full text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${mobileTab === "matrix" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-500 hover:text-slate-700"}`}
              >
                Matrix
              </button>
              <button
                onClick={() => setMobileTab("controls")}
                className={`flex-1 h-full text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${mobileTab === "controls" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-500 hover:text-slate-700"}`}
              >
                Editor
              </button>
            </div>
          </div>
        }
      />

      <div className="flex flex-col xl:flex-row gap-6 xl:gap-4 items-start">
        <div
          className={`xl:w-[380px] shrink-0 flex flex-col gap-4 sm:gap-4 xl:gap-5 w-full min-w-0 ${mobileTab === "controls" ? "flex" : "hidden xl:flex"}`}
        >
          <Card className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm w-full space-y-3.5">
            <div className="flex p-1 mb-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/5">
              <button
                onClick={() =>
                  setNewEntry({ ...newEntry, type: "income", categoryId: "" })
                }
                className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all ${
                  newEntry.type === "income"
                    ? "bg-white dark:bg-emerald-500 text-emerald-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                Inflow
              </button>
              <button
                onClick={() =>
                  setNewEntry({ ...newEntry, type: "outflow", categoryId: "" })
                }
                className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all ${
                  newEntry.type === "outflow"
                    ? "bg-white dark:bg-rose-500 text-rose-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                Outflow
              </button>
              <button
                onClick={() =>
                  setNewEntry({ ...newEntry, type: "transfer", categoryId: "" })
                }
                className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all ${
                  newEntry.type === "transfer"
                    ? "bg-white dark:bg-sky-500 text-sky-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                Transfer
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-0.5">
                  Amount
                </label>
                <div className="relative group">
                  <Input
                    type="number"
                    placeholder={`Enter amount...`}
                    value={newEntry.amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewEntry({ ...newEntry, amount: e.target.value })
                    }
                    className={`font-mono h-9 text-xs font-bold pr-16 ${newEntry.type === "income" ? "text-emerald-500" : newEntry.type === "transfer" ? "text-sky-500" : "text-rose-500"}`}
                  />
                  <div className="absolute right-1 top-1 bottom-1 flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-white/5">
                    <button
                      onClick={() =>
                        setNewEntry({ ...newEntry, isMonthly: true })
                      }
                      className={`px-2 py-1 text-[8px] font-black uppercase rounded-xl transition-all ${newEntry.isMonthly ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500"}`}
                    >
                      MO
                    </button>
                    <button
                      onClick={() =>
                        setNewEntry({ ...newEntry, isMonthly: false })
                      }
                      className={`px-2 py-1 text-[8px] font-black uppercase rounded-xl transition-all ${!newEntry.isMonthly ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500"}`}
                    >
                      YR
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-0.5">
                  Description
                </label>
                <Input
                  placeholder={
                    newEntry.type === "transfer"
                      ? "E.g., Transfer to SBI, Emergency fund split..."
                      : "E.g., Salary, Rent..."
                  }
                  value={newEntry.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewEntry({ ...newEntry, description: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>

              {newEntry.type === "transfer" ? (
                <div className="flex flex-row gap-2">
                  <div className="flex-1 space-y-1 min-w-0">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-0.5">
                      From Account
                    </label>
                    <Select
                      value={newEntry.accountId}
                      onValueChange={(val: string) =>
                        setNewEntry({ ...newEntry, accountId: val })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs font-bold truncate">
                        <SelectValue placeholder="Source..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {filteredAccounts.map((acc: Account) => (
                          <SelectItem
                            key={acc.id}
                            value={acc.id}
                            disabled={acc.id === newEntry.toAccountId}
                          >
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-0.5">
                      To Account
                    </label>
                    <Select
                      value={newEntry.toAccountId}
                      onValueChange={(val: string) =>
                        setNewEntry({ ...newEntry, toAccountId: val })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs font-bold truncate">
                        <SelectValue placeholder="Destination..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {filteredAccounts.map((acc: Account) => (
                          <SelectItem
                            key={acc.id}
                            value={acc.id}
                            disabled={acc.id === newEntry.accountId}
                          >
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="flex flex-row gap-2">
                  <div className="flex-1 space-y-1 min-w-0">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-0.5">
                      Routing
                    </label>
                    <Select
                      value={newEntry.accountId}
                      onValueChange={(val: string) =>
                        setNewEntry({ ...newEntry, accountId: val })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs font-bold truncate">
                        <SelectValue placeholder="Account..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {filteredAccounts.map((acc: Account) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-0.5">
                      Classification
                    </label>
                    <Select
                      value={newEntry.categoryId}
                      onValueChange={(val: string) =>
                        setNewEntry({ ...newEntry, categoryId: val })
                      }
                    >
                      <SelectTrigger className="h-9 text-xs font-bold truncate">
                        <SelectValue placeholder="Category..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {filteredCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <Button
                onClick={handleAddEntry}
                className={`w-full h-9 rounded-xl font-black uppercase tracking-widest text-[10px] mt-0.5 gap-2 shadow-lg transition-all ${
                  newEntry.type === "income"
                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white"
                    : newEntry.type === "transfer"
                      ? "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20 text-white"
                      : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 text-white"
                }`}
              >
                {editingId ? "Update" : "Inject"}{" "}
                {newEntry.type === "income"
                  ? "Income"
                  : newEntry.type === "transfer"
                    ? "Transfer"
                    : "Outflow"}{" "}
                <ArrowRight className="size-3.5" />
              </Button>
              {editingId && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setNewEntry({
                      amount: "",
                      description: "",
                      categoryId: "",
                      accountId: "",
                      toAccountId: "",
                      type: "outflow",
                      isMonthly: true,
                    });
                  }}
                  className="w-full h-8 text-[10px] font-bold text-slate-400 mt-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel Edit
                </Button>
              )}
            </div>

            {entries.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Traction Matrix
                  </span>
                </div>
                <div className="max-h-[320px] overflow-y-auto pr-1 space-y-2 pb-2 no-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {sortedEntries.map((entry) => (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 shadow-sm group/item"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white truncate">
                            {entry.description}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest truncate ${entry.type === "transfer" ? "text-sky-500" : getProtocolColor(entry.parentType)}`}
                          >
                            {entry.type === "transfer" ? (
                              <span className="flex items-center gap-1">
                                <span>{entry.accountName}</span>
                                <span className="opacity-40">➔</span>
                                <span>{entry.toAccountName || "Account"}</span>
                              </span>
                            ) : (
                              <>
                                {entry.categoryName}{" "}
                                <span className="opacity-30">/</span>{" "}
                                {entry.accountName}
                              </>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <div className="text-right mr-3">
                            <div
                              className={`text-[11px] font-mono font-black ${
                                entry.type === "income"
                                  ? "text-emerald-500"
                                  : entry.type === "transfer"
                                    ? "text-sky-500"
                                    : getProtocolColor(entry.parentType)
                              }`}
                            >
                              {entry.type === "income"
                                ? "+"
                                : entry.type === "transfer"
                                  ? "⇄ "
                                  : "-"}
                              {formatCurrency(parseFloat(entry.amount) || 0)}
                            </div>
                            <div className="text-[8px] font-black uppercase tracking-tighter text-slate-400 opacity-70">
                              {(entry.isMonthly ?? true) ? "Monthly" : "Yearly"}{" "}
                              Flow
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditEntry(entry)}
                              className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveEntry(entry.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm w-full space-y-3.5">
            <div className="flex items-center justify-between py-1 mb-2 border-b border-slate-100 dark:border-white/5 sm:border-none">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-slate-50 dark:bg-white/10 flex items-center justify-center">
                  <Target className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Target Protocol
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400">
                    Sandbox constraints
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`text-xs font-black ${isProtocolValid ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {protocol.needs + protocol.savings + protocol.wants}%
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {(["needs", "savings", "wants"] as const).map((key) => {
                const item = {
                  needs: {
                    label: "Needs",
                    theme: "text-amber-500",
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20",
                  },
                  savings: {
                    label: "Savings",
                    theme: "text-indigo-500",
                    bg: "bg-indigo-500/10",
                    border: "border-indigo-500/20",
                  },
                  wants: {
                    label: "Wants",
                    theme: "text-rose-500",
                    bg: "bg-rose-500/10",
                    border: "border-rose-500/20",
                  },
                }[key];
                const target = protocol[key];
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center px-0.5">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${item.theme}`}
                      >
                        {item.label} Target
                      </span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={target}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>,
                          ) => {
                            const val = parseInt(e.target.value) || 0;
                            handleProtocolChange(key, val);
                          }}
                          className={`w-16 h-8 text-[11px] font-black ${item.bg} ${item.border} ${item.theme} text-center rounded-xl border-2 transition-all focus:ring-2 focus:ring-white/20`}
                        />
                        <span
                          className={`text-[10px] font-black ${item.theme} opacity-60`}
                        >
                          %
                        </span>
                      </div>
                    </div>
                    <div className="px-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={target}
                        onChange={(e) =>
                          handleProtocolChange(key, parseInt(e.target.value))
                        }
                        className={`w-full h-1.5 ${item.bg} rounded-xl appearance-none cursor-pointer accent-primary`}
                      />
                    </div>
                  </div>
                );
              })}

              {!isProtocolValid && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-400 leading-tight">
                  <div className="size-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="size-4" />
                  </div>
                  <span>
                    Protocol distribution must total 100% current:{" "}
                    {protocol.needs + protocol.savings + protocol.wants}%
                  </span>
                </div>
              )}

              <Button
                variant="primary"
                onClick={handleSaveProtocol}
                isLoading={strategyLoading}
                className={`w-full h-11 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] mt-1 gap-2 shadow-2xl transition-all ${isProtocolDirty ? "bg-primary text-white shadow-primary/20 hover:opacity-90" : "bg-slate-100 dark:bg-white/5 text-slate-400 shadow-none border border-slate-200 dark:border-white/5"} hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100`}
              >
                <Save className="size-4" /> Finalize Protocol
              </Button>
            </div>
          </Card>
        </div>

        <div
          className={`flex-1 w-full min-w-0 ${mobileTab === "matrix" ? "block" : "hidden xl:block"}`}
        >
          <Card className="h-auto sm:h-full min-h-[400px] sm:min-h-[500px] flex flex-col pt-0 px-3 pb-3 sm:p-3 sm:border sm:bg-white sm:dark:bg-slate-900 border-none bg-transparent shadow-none sm:shadow-sm sm:rounded-2xl rounded-none -mx-2 sm:mx-0 w-auto sm:w-full space-y-5 sm:space-y-4">
            {isSwitching ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="size-24 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center border border-dashed border-slate-200 dark:border-white/10 relative">
                  <Activity className="size-10 text-primary/40" />
                </div>
                <div className="max-w-sm space-y-2">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Syncing Timeline...
                  </h4>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400">
                    Processing vector re-hydration.
                  </p>
                </div>
              </div>
            ) : !isProtocolValid ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="size-24 rounded-xl bg-rose-500/10 flex items-center justify-center border border-dashed border-rose-500/30">
                  <AlertCircle className="size-10 text-rose-500" />
                </div>
                <div className="max-w-sm space-y-2">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Protocol Invalid (
                    {protocol.needs + protocol.wants + protocol.savings}%)
                  </h4>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400">
                    Strategy allocations must total exactly 100%.
                  </p>
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="size-24 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center border border-dashed border-slate-200 dark:border-white/10 relative">
                  <Activity className="size-10 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="max-w-sm space-y-2">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Awaiting Injection
                  </h4>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400">
                    Add Income and Outflow vectors to start building your
                    strategy model.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
                {/* 1. Primary Metrics Grid (2x2) */}
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <div
                    className={`p-2 sm:p-2.5 rounded-xl border transition-all flex flex-col justify-between min-h-[80px] ${strategyMetrics.surplus < 0 ? "bg-rose-50/50 dark:bg-rose-500/5 border-rose-200/50 dark:border-rose-500/10" : "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-500/10"}`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Net {current?.basis === "yearly" ? "Annual" : "Monthly"}{" "}
                      Flow
                    </span>
                    <div className="mt-auto">
                      <div
                        className={`text-base sm:text-lg font-black tracking-tighter truncate w-full ${strategyMetrics.surplus < 0 ? "text-rose-500" : "text-emerald-500"}`}
                        title={formatCurrency(strategyMetrics.surplus)}
                      >
                        {formatCurrency(strategyMetrics.surplus)}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                        {strategyMetrics.surplus >= 0 ? "Surplus" : "Deficit"}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-white/5 flex flex-col justify-between min-h-[90px]">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                      Flow Magnitude
                    </span>
                    <div className="space-y-2 mt-auto">
                      <div
                        className="text-xs font-mono font-black text-emerald-500 truncate sm:max-w-max"
                        title={formatCurrency(strategyMetrics.income)}
                      >
                        {formatCurrency(strategyMetrics.income)}
                      </div>
                      <div
                        className="text-xs font-mono font-black text-rose-500 truncate sm:max-w-max"
                        title={formatCurrency(strategyMetrics.totalOutflows)}
                      >
                        {formatCurrency(strategyMetrics.totalOutflows)}
                      </div>
                    </div>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-white/5 relative overflow-hidden group flex flex-col justify-between min-h-[90px]">
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Efficiency
                      </span>
                      <div className="mt-auto">
                        <div className="flex items-baseline justify-start w-full">
                          <div
                            className="text-base sm:text-lg font-black text-primary tracking-tighter truncate mr-1.5"
                            title={strategyMetrics.efficiency.toString()}
                          >
                            {strategyMetrics.efficiency}
                          </div>
                          <div className="text-[9px] font-black text-slate-400 tracking-widest">
                            / 100
                          </div>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mt-1.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${strategyMetrics.efficiency}%`,
                            }}
                            className="h-full bg-primary shadow-[0_0_8px_rgba(19,91,236,0.3)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-white/5 flex flex-col justify-between min-h-[90px]">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Velocity
                    </span>
                    <div className="mt-auto">
                      <div
                        className={`text-base sm:text-lg font-black tracking-tighter truncate w-full sm:w-auto ${
                          strategyMetrics.surplus >= 0
                            ? "text-emerald-500"
                            : "text-rose-500"
                        }`}
                        title={`${strategyMetrics.surplus >= 0 ? "+" : ""}${((strategyMetrics.surplus / (strategyMetrics.income || 1)) * 100).toFixed(1)}%`}
                      >
                        {strategyMetrics.surplus >= 0 ? "+" : ""}
                        {(
                          (strategyMetrics.surplus /
                            (strategyMetrics.income || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mt-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(100, (strategyMetrics.surplus / (strategyMetrics.income || 1)) * 100)}%`,
                          }}
                          className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Horizon Composition Matrix */}
                <div className="space-y-4 sm:space-y-3 mb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2.5 py-1 mb-1 border-b border-slate-100 dark:border-white/5 sm:border-none w-full sm:w-auto">
                    <Activity className="size-4 text-primary" /> Horizon
                    Composition Matrix
                  </h4>

                  <div className="space-y-3 pb-2">
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-white/10 space-y-3.5 shadow-sm">
                      {/* Dual Stream Header & Dynamic Attention Sentinel Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-white/5 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-md bg-primary/10 text-primary">
                            <GitCompare className="size-3.5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 block">
                              Allocation Dual Stream
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                              Target Protocol vs Live Reality
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider shadow-sm transition-all ${sentinelInsight.badgeStyle}`}
                        >
                          {sentinelInsight.badge}
                        </span>
                      </div>

                      {/* Stream 1: Target Protocol Baseline */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Target className="size-3 text-primary" />
                            <span>Target Protocol Baseline</span>
                          </div>
                          <span className="font-mono text-slate-500 dark:text-slate-300">
                            {protocol.needs}% Needs · {protocol.savings}%
                            Savings · {protocol.wants}% Wants
                          </span>
                        </div>
                        <div className="flex h-5 w-full rounded-lg overflow-hidden bg-slate-200/50 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 p-0.5 gap-0.5">
                          <div
                            style={{
                              width: `${(protocol.needs / (protocol.needs + protocol.savings + protocol.wants || 100)) * 100}%`,
                            }}
                            className="h-full rounded-sm bg-amber-400/80 dark:bg-amber-500/80 flex items-center justify-center group relative cursor-help transition-all hover:brightness-110"
                            title={`Target Needs: ${protocol.needs}%`}
                          >
                            <span className="text-[8px] font-black text-amber-950 truncate px-1 tracking-wider">
                              {protocol.needs}% N
                            </span>
                          </div>
                          <div
                            style={{
                              width: `${(protocol.savings / (protocol.needs + protocol.savings + protocol.wants || 100)) * 100}%`,
                            }}
                            className="h-full rounded-sm bg-indigo-400/80 dark:bg-indigo-500/80 flex items-center justify-center group relative cursor-help transition-all hover:brightness-110"
                            title={`Target Savings: ${protocol.savings}%`}
                          >
                            <span className="text-[8px] font-black text-indigo-950 truncate px-1 tracking-wider">
                              {protocol.savings}% S
                            </span>
                          </div>
                          <div
                            style={{
                              width: `${(protocol.wants / (protocol.needs + protocol.savings + protocol.wants || 100)) * 100}%`,
                            }}
                            className="h-full rounded-sm bg-rose-400/80 dark:bg-rose-500/80 flex items-center justify-center group relative cursor-help transition-all hover:brightness-110"
                            title={`Target Wants: ${protocol.wants}%`}
                          >
                            <span className="text-[8px] font-black text-rose-950 truncate px-1 tracking-wider">
                              {protocol.wants}% W
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Connected Drift Ribbons / Vector Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 pt-0.5">
                        {/* Needs Vector Card */}
                        <div className="p-2 sm:p-2.5 rounded-xl border border-slate-200/70 dark:border-white/5 bg-white/60 dark:bg-slate-800/20 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className="size-2 rounded-full bg-amber-400" />
                              <span className="text-[9px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                Needs Vector
                              </span>
                            </div>
                            <span className="text-[8px] font-mono font-bold text-slate-400">
                              Target {protocol.needs}%
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-sm font-mono font-black text-amber-500">
                              {hasData
                                ? `${strategyMetrics.needsPct.toFixed(1)}%`
                                : `${protocol.needs.toFixed(1)}%`}
                            </span>
                            <span
                              className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                !hasData
                                  ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                                  : strategyMetrics.needsPct > protocol.needs
                                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              }`}
                            >
                              {!hasData
                                ? "ON TARGET"
                                : strategyMetrics.needsPct > protocol.needs
                                  ? `+${(strategyMetrics.needsPct - protocol.needs).toFixed(1)}% OVER`
                                  : "ALIGNED"}
                            </span>
                          </div>
                        </div>

                        {/* Savings Vector Card (High Priority Attention) */}
                        <div className="p-2 sm:p-2.5 rounded-xl border border-slate-200/70 dark:border-white/5 bg-white/60 dark:bg-slate-800/20 flex flex-col justify-between shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className="size-2 rounded-full bg-indigo-400" />
                              <span className="text-[9px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                Savings Vector
                              </span>
                            </div>
                            <span className="text-[8px] font-mono font-bold text-slate-400">
                              Target {protocol.savings}%
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-sm font-mono font-black text-indigo-400">
                              {hasData
                                ? `${strategyMetrics.savingsPct.toFixed(1)}%`
                                : `${protocol.savings.toFixed(1)}%`}
                            </span>
                            <span
                              className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                !hasData
                                  ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                                  : strategyMetrics.savingsPct >=
                                      protocol.savings
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                    : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              }`}
                            >
                              {!hasData
                                ? "ON TARGET"
                                : strategyMetrics.savingsPct >= protocol.savings
                                  ? "MET"
                                  : `-${(protocol.savings - strategyMetrics.savingsPct).toFixed(1)}% DEFICIT`}
                            </span>
                          </div>
                        </div>

                        {/* Wants Vector Card */}
                        <div className="p-2 sm:p-2.5 rounded-xl border border-slate-200/70 dark:border-white/5 bg-white/60 dark:bg-slate-800/20 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className="size-2 rounded-full bg-rose-400" />
                              <span className="text-[9px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                Wants Vector
                              </span>
                            </div>
                            <span className="text-[8px] font-mono font-bold text-slate-400">
                              Target {protocol.wants}%
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-sm font-mono font-black text-rose-500">
                              {hasData
                                ? `${strategyMetrics.wantsPct.toFixed(1)}%`
                                : `${protocol.wants.toFixed(1)}%`}
                            </span>
                            <span
                              className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                !hasData
                                  ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                                  : strategyMetrics.wantsPct > protocol.wants
                                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              }`}
                            >
                              {!hasData
                                ? "ON TARGET"
                                : strategyMetrics.wantsPct > protocol.wants
                                  ? `+${(strategyMetrics.wantsPct - protocol.wants).toFixed(1)}% OVER`
                                  : "CONTROLLED"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Attention Sentinel Alert Banner */}
                      <div
                        className={`p-2.5 sm:p-3 rounded-xl border flex items-start gap-2.5 transition-all ${sentinelInsight.bannerStyle}`}
                      >
                        <sentinelInsight.icon className="size-4 shrink-0 mt-0.5" />
                        <div className="flex-1 text-[10px] sm:text-[11px] leading-relaxed font-medium">
                          <span className="font-black uppercase tracking-wider mr-1.5">
                            {sentinelInsight.badge}:
                          </span>
                          {sentinelInsight.message}
                        </div>
                      </div>

                      {/* Stress Test & Savings Velocity Diagnostics */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1 p-2 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-200/40 dark:border-white/5">
                          <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Zap className="size-3 text-amber-500" /> Stress
                            Test Telemetry
                          </div>
                          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-tight">
                            {hasData ? (
                              <>
                                If income drops by 20%, your Needs would consume{" "}
                                <span className="text-rose-500">
                                  {(
                                    (strategyMetrics.needsTotal /
                                      (strategyMetrics.income * 0.8 || 1)) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </span>{" "}
                                of total flow.
                              </>
                            ) : (
                              <>
                                At protocol baseline, a 20% income drop would
                                elevate Needs to{" "}
                                <span className="text-amber-500">
                                  {(protocol.needs / 0.8).toFixed(1)}%
                                </span>{" "}
                                of total flow.
                              </>
                            )}
                          </p>
                        </div>
                        <div className="space-y-1 p-2 rounded-lg bg-slate-100/50 dark:bg-white/5 border border-slate-200/40 dark:border-white/5">
                          <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <TrendingUp className="size-3 text-indigo-500" />{" "}
                            Savings Velocity
                          </div>
                          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-tight">
                            {hasData && strategyMetrics.savingsTotal > 0 ? (
                              <>
                                At current rates, you reaching your next{" "}
                                <span className="text-indigo-400">₹100k</span>{" "}
                                goal in{" "}
                                <span className="text-slate-900 dark:text-white">
                                  {(
                                    100000 / strategyMetrics.savingsTotal
                                  ).toFixed(1)}{" "}
                                  {current?.basis === "yearly"
                                    ? "years"
                                    : "months"}
                                </span>
                                .
                              </>
                            ) : (
                              <>
                                Goal timeline to next{" "}
                                <span className="text-indigo-400">₹100k</span>{" "}
                                will calculate dynamically as savings entries
                                are added.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Strategem Insights */}
                <div className="space-y-4 sm:space-y-3 mb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2.5 py-1 mb-1 border-b border-slate-100 dark:border-white/5 sm:border-none w-full sm:w-auto">
                    <Lightbulb className="size-4 text-primary" /> Insights Hub
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {strategyMetrics.suggestions.length > 0 ? (
                      strategyMetrics.suggestions.map((suggestion, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={i}
                          className="flex items-start gap-2 p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 shadow-sm min-h-[60px]"
                        >
                          <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <ArrowRight className="size-3 text-primary" />
                          </div>
                          <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">
                            {suggestion}
                          </p>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full py-8 text-center bg-slate-50/50 dark:bg-slate-800/10 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                        <p className="text-[10px] font-bold text-slate-400 text-center">
                          All systems optimal. No adjustments required.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Active Vector Flows (Consolidated) - Bottom */}
                {strategyMetrics.activeAccounts.length > 0 && (
                  <div className="pt-4 sm:pt-3 border-t border-slate-100 dark:border-white/5 space-y-4 sm:space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1 mb-1 border-b border-slate-100 dark:border-white/5 sm:border-none">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2.5 shrink-0">
                        <Activity className="size-4 text-primary" /> Account
                        Vectors ({projectionMonths} Month Projection)
                      </h4>
                      <div className="grid grid-cols-6 sm:flex sm:items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-lg border border-slate-200 dark:border-white/5 w-full sm:w-auto">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (m) => (
                            <button
                              key={m}
                              onClick={() => setProjectionMonths(m)}
                              className={`min-w-[32px] sm:min-w-[28px] h-8 sm:h-auto px-1.5 py-1 sm:py-0.5 rounded-md text-[8px] font-black uppercase transition-all shrink-0 ${projectionMonths === m ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                            >
                              {m}m
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                      {strategyMetrics.activeAccounts.map((acc) => (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          key={acc.id}
                          className="p-2.5 sm:p-3 border border-slate-100 dark:border-white/5 rounded-xl bg-white dark:bg-slate-800/40 shadow-sm flex flex-col justify-between"
                        >
                          <div className="text-[9px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest mb-2.5 truncate flex items-center gap-1.5 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />{" "}
                            <span className="truncate">{acc.name}</span>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between p-1.5 rounded-md bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 min-w-0">
                              <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest truncate mr-1">
                                In
                              </span>
                              <span className="text-[9px] font-mono font-black text-emerald-500 shrink-0">
                                +{formatCurrency(acc.income)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-1.5 rounded-md bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 min-w-0">
                              <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest truncate mr-1">
                                Out
                              </span>
                              <span className="text-[9px] font-mono font-black text-rose-500 shrink-0">
                                -{formatCurrency(acc.outflow)}
                              </span>
                            </div>
                            <div className="pt-1 border-t border-slate-100 dark:border-white/5 flex items-center justify-between px-0.5 mt-1 min-w-0">
                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest truncate mr-1">
                                Net /{" "}
                                {current?.basis === "yearly" ? "yr" : "mo"}
                              </span>
                              <span
                                className={`text-[9px] font-mono font-black shrink-0 ${acc.netFlow >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                              >
                                {acc.netFlow > 0 ? "+" : ""}
                                {formatCurrency(acc.netFlow)}
                              </span>
                            </div>
                            <div className="pt-1.5 mt-1 border-t border-dashed border-slate-100 dark:border-white/5">
                              <div className="flex justify-between items-center px-0.5">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                  Projected ({projectionMonths}M)
                                </span>
                                <span
                                  className={`text-[10px] font-mono font-black ${acc.projectedBalance >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                                >
                                  {acc.projectedBalance > 0 ? "+" : ""}
                                  {formatCurrency(acc.projectedBalance)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
