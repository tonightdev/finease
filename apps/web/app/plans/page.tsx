"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import toast from "react-hot-toast";

import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";

// Icons
import {
  TrendingUp,
  Loader2,
  Zap,
  Plus,
  Trash2,
  Target,
  Bell,
  CheckCircle2,
  RefreshCw,
  Wallet,
} from "lucide-react";

import { PlanningStatusFilter } from "@/components/planning/PlanningStatusFilter";
import { useSwipe } from "@/lib/useSwipe";

// Redux Actions
import {
  createSimulationAction,
  deleteSimulationAction,
  fetchSimulations,
  updateSimulationAction,
} from "@/store/slices/simulationsSlice";
import {
  fetchGoals,
  addGoalAction,
  updateGoalAction,
  deleteGoalAction,
} from "@/store/slices/goalsSlice";
import {
  fetchExpiries,
  createExpiryAction,
  updateExpiryAction,
} from "@/store/slices/expiriesSlice";
import { fetchAccounts } from "@/store/slices/accountsSlice";
import { fetchTransactions } from "@/store/slices/transactionsSlice";
import {
  fetchYearlyExpenses,
  createYearlyExpense,
  updateYearlyExpense,
  deleteYearlyExpense,
  YearlyExpense,
} from "@/store/slices/yearlySlice";

// Shared Logic/Types
import {
  FinancialGoal,
  Simulation,
  SimAccount,
  SimExpense,
  Expiry,
} from "@repo/types";

// Modal Components
import { GoalCard } from "@/components/goals/GoalCard";
import { EditGoalModal } from "@/components/goals/EditGoalModal";
import { TopUpModal } from "@/components/goals/TopUpModal";
import { AddExpiryModal } from "@/components/expiries/AddExpiryModal";
import { ExpiryCountdown } from "@/components/expiries/ExpiryCountdown";

type TabType = "Simulations" | "Goals" | "Expiries" | "Yearly";

// Sub-components
import { YearlyExpenseCard } from "@/components/planning/YearlyExpenseCard";
import { AddYearlyExpenseModal } from "@/components/planning/AddYearlyExpenseModal";
import { YearlyBurdenCard } from "@/components/planning/YearlyBurdenCard";

function PlansDirectoryPageContent() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>("Goals");

  const {
    items: plans,
    loading: plansLoading,
    lastFetched: plansFetched,
  } = useSelector((state: RootState) => state.simulations);
  const {
    items: goals,
    loading: goalsLoading,
    lastFetched: goalsFetched,
  } = useSelector((state: RootState) => state.goals);
  const {
    items: expiries,
    loading: expiriesLoading,
    lastFetched: expiriesFetched,
  } = useSelector((state: RootState) => state.expiries);
  const {
    items: yearlyExpenses,
    loading: yearlyLoading,
    lastFetched: yearlyFetched,
  } = useSelector((state: RootState) => state.yearlyExpenses);
  const { items: accounts } = useSelector((state: RootState) => state.accounts);

  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [simFilter, setSimFilter] = useState<"ongoing" | "completed">(
    "ongoing",
  );
  const [goalFilter, setGoalFilter] = useState<"ongoing" | "completed">(
    "ongoing",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navMessage, setNavMessage] = useState("");

  // Modals Local State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
  const [isYearlyModalOpen, setIsYearlyModalOpen] = useState(false);

  const [selectedExpiry, setSelectedExpiry] = useState<Expiry | null>(null);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [topUpGoal, setTopUpGoal] = useState<FinancialGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);
  const [isGoalDeleteModalOpen, setIsGoalDeleteModalOpen] = useState(false);

  const [editingYearly, setEditingYearly] = useState<YearlyExpense | null>(
    null,
  );
  const [yearlyToDelete, setYearlyToDelete] = useState<string | null>(null);
  const [yearlyAccountFilter, setYearlyAccountFilter] = useState<string>("all");

  // Sync tab with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      const match = (
        ["Goals", "Yearly", "Expiries", "Simulations"] as TabType[]
      ).find(
        (t) =>
          t.toLowerCase() === tabParam.toLowerCase() ||
          t.toLowerCase().startsWith(tabParam.toLowerCase()),
      );
      if (match) {
        setActiveTab(match);
      }
    }
    const accParam = searchParams.get("account");
    if (accParam) {
      setYearlyAccountFilter(accParam);
    }
  }, [searchParams]);

  const handleTabChange = useCallback(
    (tab: TabType) => {
      setActiveTab(tab);
      router.replace(`/plans?tab=${tab}`, { scroll: false });
    },
    [router],
  );

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      const tabs: TabType[] = ["Goals", "Yearly", "Expiries", "Simulations"];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1 && tabs[currentIndex + 1]) {
        handleTabChange(tabs[currentIndex + 1]!);
      }
    },
    onSwipeRight: () => {
      const tabs: TabType[] = ["Goals", "Yearly", "Expiries", "Simulations"];
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0 && tabs[currentIndex - 1]) {
        handleTabChange(tabs[currentIndex - 1]!);
      }
    },
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchSimulations());
      dispatch(fetchGoals());
      dispatch(fetchExpiries());
      dispatch(fetchYearlyExpenses());
      dispatch(fetchAccounts());
      dispatch(fetchTransactions());
    }
  }, [user, dispatch]);

  // Calculations
  const calculateGap = useCallback((goal: FinancialGoal) => {
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const monthsRemaining =
      (targetDate.getFullYear() - today.getFullYear()) * 12 +
      (targetDate.getMonth() - today.getMonth());

    if (monthsRemaining <= 0) return 0;
    const shortfall = goal.targetAmount - goal.currentAmount;
    return shortfall / monthsRemaining;
  }, []);

  const totalRequiredMonthly = useMemo(() => {
    return goals.reduce(
      (acc: number, goal: FinancialGoal) => acc + calculateGap(goal),
      0,
    );
  }, [goals, calculateGap]);

  const totalYearlyBurden = useMemo(() => {
    return (yearlyExpenses || []).reduce((acc: number, exp: YearlyExpense) => {
      const amount = Number(exp.yearlyAmount) || 0;
      return acc + amount / 12;
    }, 0);
  }, [yearlyExpenses]);

  const yearlyBurdenByAccount = useMemo(() => {
    const groups: Record<
      string,
      {
        accountId: string;
        name: string;
        amount: number;
        balance: number;
        expenses: YearlyExpense[];
      }
    > = {};
    (yearlyExpenses || []).forEach((exp: YearlyExpense) => {
      const accountId = exp.accountId || "unlinked";
      const account = (accounts || []).find((a) => a.id === accountId);
      const accountName = account?.name || exp.accountName || "Unlinked";
      const balance = account?.balance || 0;

      const monthlyAmount = (Number(exp.yearlyAmount) || 0) / 12;
      if (!groups[accountId]) {
        groups[accountId] = {
          accountId,
          name: accountName,
          amount: 0,
          balance,
          expenses: [],
        };
      }
      groups[accountId].amount += monthlyAmount;
      groups[accountId].expenses.push(exp);
    });

    Object.values(groups).forEach((g) => {
      g.expenses.sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", undefined, {
          sensitivity: "base",
        }),
      );
    });

    return Object.values(groups).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [yearlyExpenses, accounts]);

  const effectiveAccountFilter = useMemo(() => {
    if (
      yearlyAccountFilter !== "all" &&
      !yearlyBurdenByAccount.some((g) => g.accountId === yearlyAccountFilter)
    ) {
      return "all";
    }
    return yearlyAccountFilter;
  }, [yearlyAccountFilter, yearlyBurdenByAccount]);

  const displayedAccountGroups = useMemo(() => {
    if (effectiveAccountFilter === "all") {
      return yearlyBurdenByAccount;
    }
    return yearlyBurdenByAccount.filter(
      (g) => g.accountId === effectiveAccountFilter,
    );
  }, [yearlyBurdenByAccount, effectiveAccountFilter]);

  // Handlers
  const handleCreatePlan = async () => {
    setIsProcessing(true);
    try {
      const newPlan = {
        name: `Simulation ${plans.length + 1}`,
        createdAt: new Date().toISOString(),
        accounts: [],
        expenses: [],
        status: "ongoing" as const,
      };
      setNavMessage("Initializing Simulation...");
      setIsNavigating(true);
      const created = await dispatch(createSimulationAction(newPlan)).unwrap();
      toast.success("Simulation initialized");
      router.push(`/plans/${created.id}`);
    } catch {
      toast.error("Failed to initialize simulation");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTogglePlanStatus = async (plan: Simulation) => {
    setIsProcessing(true);
    try {
      const newStatus: "ongoing" | "completed" =
        plan.status === "completed" ? "ongoing" : "completed";
      await dispatch(
        updateSimulationAction({ id: plan.id, data: { status: newStatus } }),
      ).unwrap();
      toast.success(
        newStatus === "completed"
          ? "Simulation completed"
          : "Simulation reopened",
      );
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurgeSimulation = async (id: string) => {
    setIsProcessing(true);
    try {
      await dispatch(deleteSimulationAction({ id, purge: true })).unwrap();
      toast.success("Simulation purged from lattice");
      setPlanToDelete(null);
    } catch {
      toast.error("Failed to purge simulation");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredPlans = useMemo(() => {
    return plans
      .filter((p: Simulation) => (p.status || "ongoing") === simFilter)
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        }),
      );
  }, [plans, simFilter]);

  const filteredGoals = useMemo(() => {
    return goals
      .filter((g: FinancialGoal) => {
        const isCompleted = g.currentAmount >= g.targetAmount;
        return goalFilter === "completed" ? isCompleted : !isCompleted;
      })
      .sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, {
          sensitivity: "base",
        }),
      );
  }, [goals, goalFilter]);

  return (
    <div {...swipeHandlers} className="flex-1 flex flex-col min-h-0">
      <PageContainer>
        <PageHeader
          title="Planning Hub"
          subtitle={
            activeTab === "Goals" ? (
              <div className="flex items-center gap-1.5 transition-all">
                Need{" "}
                <span className="text-primary font-bold">
                  ₹
                  {totalRequiredMonthly.toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}
                  /mo
                </span>{" "}
                to meet all targets.
              </div>
            ) : activeTab === "Expiries" ? (
              "Active triggers and financial expiries"
            ) : activeTab === "Yearly" ? (
              effectiveAccountFilter !== "all" && displayedAccountGroups[0] ? (
                <div className="flex items-center gap-1.5 transition-all">
                  Reserve for{" "}
                  <span className="text-primary font-bold">
                    {displayedAccountGroups[0].name}
                  </span>
                  :{" "}
                  <span className="text-primary font-bold">
                    ₹
                    {displayedAccountGroups[0].amount.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}
                    /mo
                  </span>
                </div>
              ) : (
                `Monthly capital reserves: ₹${totalYearlyBurden.toLocaleString("en-IN", { maximumFractionDigits: 0 })}/mo`
              )
            ) : (
              "Tactical simulations for capital management and events"
            )
          }
          className="space-y-2"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl h-11 w-full sm:w-auto overflow-x-auto no-scrollbar">
              {(
                ["Goals", "Yearly", "Expiries", "Simulations"] as TabType[]
              ).map((tab) => (
                <Button
                  key={tab}
                  type="button"
                  variant="ghost"
                  onClick={() => handleTabChange(tab)}
                  className={`flex-1 sm:flex-none shrink-0 px-3 sm:px-4 h-full rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab
                      ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {activeTab === "Simulations" && (
                <Button
                  onClick={handleCreatePlan}
                  disabled={isProcessing}
                  size="sm"
                  className="w-full sm:w-auto"
                  leftIcon={
                    isProcessing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {isProcessing ? "Initializing..." : "Initialize Simulation"}
                </Button>
              )}
              {activeTab === "Goals" && (
                <Button
                  onClick={() => {
                    setEditingGoal(null);
                    setIsGoalModalOpen(true);
                  }}
                  disabled={isProcessing}
                  size="sm"
                  className="w-full sm:w-auto"
                  leftIcon={<Target className="w-3.5 h-3.5" />}
                >
                  Add Goal
                </Button>
              )}
              {activeTab === "Expiries" && (
                <Button
                  onClick={() => {
                    setSelectedExpiry(null);
                    setIsExpiryModalOpen(true);
                  }}
                  disabled={isProcessing}
                  size="sm"
                  className="w-full sm:w-auto"
                  leftIcon={<Bell className="w-3.5 h-3.5" />}
                >
                  Add Expiry
                </Button>
              )}
              {activeTab === "Yearly" && (
                <Button
                  onClick={() => {
                    setEditingYearly(null);
                    setIsYearlyModalOpen(true);
                  }}
                  disabled={isProcessing}
                  size="sm"
                  className="w-full sm:w-auto"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Commitment
                </Button>
              )}
            </div>
          </div>
        </PageHeader>

        <div className="mt-2 min-h-[500px] relative">
          <AnimatePresence mode="popLayout" initial={false}>
            {activeTab === "Simulations" && (
              <motion.div
                key="simulations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 sm:space-y-3"
              >
                <div className="px-3 pb-3 sm:p-3 sm:border sm:bg-white sm:dark:bg-slate-900 border-none bg-transparent shadow-none sm:shadow-sm sm:rounded-2xl rounded-none -mx-2 sm:mx-0 w-auto sm:w-full space-y-4 sm:space-y-3">
                  <div className="space-y-4">
                    <PlanningStatusFilter
                      activeStatus={simFilter}
                      onChange={setSimFilter}
                      options={[
                        { value: "ongoing", label: "Active Simulations" },
                        { value: "completed", label: "Historical Simulations" },
                      ]}
                    />

                    {plansLoading || !plansFetched ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={`plan-skeleton-${i}`}
                            className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-4 rounded-xl space-y-4 h-full min-h-[140px]"
                          >
                            <div className="flex justify-between items-start">
                              <Skeleton className="size-6 rounded-lg" />
                              <Skeleton className="h-4 w-12 rounded" />
                            </div>
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-3 w-2/3" />
                            </div>
                            <div className="pt-2 border-t border-slate-50 dark:border-white/5 flex justify-between items-end">
                              <div className="space-y-1">
                                <Skeleton className="h-2 w-10" />
                                <Skeleton className="h-3 w-16" />
                              </div>
                              <div className="flex gap-1">
                                <Skeleton className="size-6 rounded-lg" />
                                <Skeleton className="size-6 rounded-lg" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredPlans.length === 0 ? (
                      <div className="py-10 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-slate-900/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {simFilter === "completed"
                            ? "No historical simulations found"
                            : "No active simulations configured"}
                        </p>
                        {simFilter === "ongoing" && (
                          <Button
                            onClick={handleCreatePlan}
                            variant="outline"
                            size="sm"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                            className="w-auto mt-4"
                          >
                            Initialize Simulation
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                        <AnimatePresence mode="popLayout">
                          {filteredPlans.map((plan: Simulation, planIdx) => (
                            <motion.div
                              key={plan.id || `sim-plan-${planIdx}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              onClick={() => {
                                setNavMessage("Opening Environment...");
                                setIsNavigating(true);
                                router.push(`/plans/${plan.id}`);
                              }}
                              className={`group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all h-full flex flex-col justify-between cursor-pointer ${
                                plan.status === "completed"
                                  ? "opacity-75 grayscale-[0.2]"
                                  : ""
                              } bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-100 dark:border-white/5 hover:border-primary/40 hover:shadow-md overflow-hidden`}
                            >
                              {/* Animated Background Mesh Gradient (on hover) */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-[radial-gradient(circle_at_top_right,var(--primary-light),transparent),radial-gradient(circle_at_bottom_left,var(--secondary-light),transparent)]" />

                              {/* Accent Edge */}
                              <div
                                className={`absolute top-0 left-0 w-full h-[2.5px] transition-all duration-300 ${plan.status === "completed" ? "bg-slate-300 dark:bg-slate-700" : "bg-gradient-to-r from-primary via-indigo-500 to-emerald-500"}`}
                              />

                              <div className="space-y-3 relative z-10">
                                <div className="flex items-start justify-between gap-2.5">
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="size-8 sm:size-9 rounded-xl border bg-gradient-to-br from-indigo-50 to-indigo-100/30 dark:from-indigo-900/40 dark:to-indigo-500/10 text-primary border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shrink-0 shadow-xs">
                                      <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase transition-colors group-hover:text-primary leading-snug break-words">
                                        {plan.name}
                                      </h4>
                                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 leading-none">
                                        {new Date(
                                          plan.createdAt,
                                        ).toLocaleDateString("en-IN", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm p-0.5 rounded-lg border border-slate-100 dark:border-white/10 shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePlanStatus(plan);
                                      }}
                                      className="p-1 px-1.5 text-slate-400 hover:text-emerald-500 transition-all rounded hover:bg-emerald-500/10"
                                      title={
                                        plan.status === "completed"
                                          ? "Reopen Strategy"
                                          : "Complete Strategy"
                                      }
                                    >
                                      {plan.status === "completed" ? (
                                        <RefreshCw className="size-3.5" />
                                      ) : (
                                        <CheckCircle2 className="size-3.5" />
                                      )}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPlanToDelete(plan.id);
                                      }}
                                      className={`p-1 px-1.5 transition-all rounded ${plan.status === "completed" ? "text-rose-500 hover:bg-rose-500/10" : "text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"}`}
                                      title={
                                        plan.status === "completed"
                                          ? "Purge Strategy"
                                          : "Delete Strategy"
                                      }
                                    >
                                      {plan.status === "completed" ? (
                                        <Zap className="size-3.5" />
                                      ) : (
                                        <Trash2 className="size-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                                  {/* Stat Pill: Liquidity */}
                                  <div className="flex flex-col p-2 rounded-xl bg-emerald-50/40 dark:bg-emerald-500/5 border border-emerald-100/60 dark:border-emerald-500/10 group-hover:border-emerald-300 dark:group-hover:border-emerald-500/30 transition-colors">
                                    <span className="text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1">
                                      Liquidity
                                    </span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                                      ₹
                                      {(plan.accounts || [])
                                        .reduce(
                                          (acc: number, a: SimAccount) =>
                                            acc + a.balance,
                                          0,
                                        )
                                        .toLocaleString("en-IN")}
                                    </span>
                                  </div>

                                  {/* Stat Pill: Burn Rate */}
                                  <div className="flex flex-col p-2 rounded-xl bg-rose-50/40 dark:bg-rose-500/5 border border-rose-100/60 dark:border-rose-500/10 group-hover:border-rose-300 dark:group-hover:border-rose-500/30 transition-colors">
                                    <span className="text-[7px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-none mb-1">
                                      Burn Rate
                                    </span>
                                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 tabular-nums">
                                      ₹
                                      {(plan.expenses || [])
                                        .reduce(
                                          (acc: number, e: SimExpense) =>
                                            acc + e.amount,
                                          0,
                                        )
                                        .toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "Goals" && (
              <motion.div
                key="goals"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 sm:space-y-3"
              >
                <div className="px-3 pb-3 sm:p-3 sm:border sm:bg-white sm:dark:bg-slate-900 border-none bg-transparent shadow-none sm:shadow-sm sm:rounded-2xl rounded-none -mx-2 sm:mx-0 w-auto sm:w-full space-y-4 sm:space-y-3">
                  <div className="space-y-4">
                    <PlanningStatusFilter
                      activeStatus={goalFilter}
                      onChange={setGoalFilter}
                      options={[
                        { value: "ongoing", label: "Active Goals" },
                        { value: "completed", label: "Completed Goals" },
                      ]}
                    />

                    {goalsLoading || !goalsFetched ? (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={`goal-skeleton-${i}`}
                            className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-4 rounded-xl space-y-4"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="space-y-2 flex-1">
                                <Skeleton className="h-3 w-24" />
                                <Skeleton className="h-2 w-16" />
                              </div>
                              <Skeleton className="h-5 w-10 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Skeleton className="h-2 w-12" />
                                <Skeleton className="h-2 w-12" />
                              </div>
                              <Skeleton className="h-1 w-full rounded-full" />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Skeleton className="h-8 flex-1 rounded-lg" />
                              <Skeleton className="size-8 rounded-lg" />
                              <Skeleton className="size-8 rounded-lg" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredGoals.length === 0 ? (
                      <EmptyState
                        icon={<Target className="size-8" />}
                        title={
                          goalFilter === "completed"
                            ? "No completed goals"
                            : "No active goals set"
                        }
                        subtitle={
                          goalFilter === "completed"
                            ? "Your achievements will be archived here."
                            : "Define your first financial target to track progress with high precision."
                        }
                        actionText={
                          goalFilter === "ongoing"
                            ? "Add your first goal"
                            : undefined
                        }
                        onAction={
                          goalFilter === "ongoing"
                            ? () => {
                                setEditingGoal(null);
                                setIsGoalModalOpen(true);
                              }
                            : undefined
                        }
                        actionIcon={<Plus className="w-3.5 h-3.5" />}
                      />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {filteredGoals.map((goal: FinancialGoal) => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            onTopUp={(g) => {
                              setTopUpGoal(g);
                              setIsTopUpModalOpen(true);
                            }}
                            onEdit={(g) => {
                              setEditingGoal(g);
                              setIsGoalModalOpen(true);
                            }}
                            onDelete={(g) => {
                              setGoalToDelete(g);
                              setIsGoalDeleteModalOpen(true);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "Expiries" && (
              <motion.div
                key="expiries"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 sm:space-y-3"
              >
                <div className="px-3 pb-3 sm:p-3 sm:border sm:bg-white sm:dark:bg-slate-900 border-none bg-transparent shadow-none sm:shadow-sm sm:rounded-2xl rounded-none -mx-2 sm:mx-0 w-auto sm:w-full space-y-4 sm:space-y-3">
                  {expiriesLoading || !expiriesFetched ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={`expiry-skeleton-${i}`}
                          className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-4 rounded-xl space-y-4 h-full min-h-[140px]"
                        >
                          <div className="flex justify-between items-start">
                            <Skeleton className="size-6 rounded-lg" />
                            <Skeleton className="h-4 w-12 rounded" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                          <div className="pt-2 border-t border-slate-50 dark:border-white/5 flex justify-between items-end">
                            <div className="space-y-1">
                              <Skeleton className="h-2 w-10" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                            <div className="flex gap-1">
                              <Skeleton className="size-6 rounded-lg" />
                              <Skeleton className="size-6 rounded-lg" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-transparent">
                      <ExpiryCountdown
                        expiries={expiries}
                        onEdit={(expiry) => {
                          setSelectedExpiry(expiry);
                          setIsExpiryModalOpen(true);
                        }}
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {activeTab === "Yearly" && (
              <motion.div
                key="yearly"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 sm:space-y-3"
              >
                <div className="px-3 pb-3 sm:p-3 sm:border sm:bg-white sm:dark:bg-slate-900 border-none bg-transparent shadow-none sm:shadow-sm sm:rounded-2xl rounded-none -mx-2 sm:mx-0 w-auto sm:w-full space-y-4 sm:space-y-3">
                  {yearlyBurdenByAccount.length > 0 && (
                    <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pb-2.5 mb-2.5 border-b border-slate-100 dark:border-white/5 overflow-x-auto no-scrollbar">
                      {yearlyBurdenByAccount.length > 1 && (
                        <div className="min-w-[190px] sm:min-w-0 shrink-0 sm:shrink">
                          <YearlyBurdenCard
                            key="all-accounts"
                            name="All Accounts"
                            monthlyAmount={totalYearlyBurden}
                            count={yearlyExpenses.length}
                            isAll={true}
                            isSelected={effectiveAccountFilter === "all"}
                            onClick={() => setYearlyAccountFilter("all")}
                          />
                        </div>
                      )}
                      {yearlyBurdenByAccount.map((group, idx) => (
                        <div
                          key={
                            group.accountId
                              ? `burden-${group.accountId}`
                              : `burden-${idx}`
                          }
                          className="min-w-[190px] sm:min-w-0 shrink-0 sm:shrink"
                        >
                          <YearlyBurdenCard
                            name={group.name}
                            balance={group.balance}
                            monthlyAmount={group.amount}
                            count={group.expenses.length}
                            isSelected={
                              effectiveAccountFilter === group.accountId
                            }
                            onClick={() => {
                              setYearlyAccountFilter((prev) =>
                                prev === group.accountId
                                  ? "all"
                                  : group.accountId,
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {yearlyLoading || !yearlyFetched ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                      ))}
                    </div>
                  ) : yearlyExpenses.length === 0 ? (
                    <EmptyState
                      icon={<TrendingUp className="size-8" />}
                      title="No yearly commitments"
                      subtitle="Track large annual expenses like insurance or taxes and break them into monthly targets."
                      actionText="Add Commitment"
                      onAction={() => {
                        setEditingYearly(null);
                        setIsYearlyModalOpen(true);
                      }}
                      actionIcon={<Plus className="w-3.5 h-3.5" />}
                    />
                  ) : displayedAccountGroups.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-slate-900/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        No commitments found for this account
                      </p>
                      <Button
                        onClick={() => setYearlyAccountFilter("all")}
                        variant="outline"
                        size="sm"
                        className="w-auto mt-4"
                      >
                        Show All Accounts
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {displayedAccountGroups.map((group, groupIdx) => (
                        <div
                          key={
                            group.accountId
                              ? `account-group-${group.accountId}`
                              : `account-group-${groupIdx}`
                          }
                          className="space-y-3"
                        >
                          {/* Account Dividing Header */}
                          <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/10">
                                <Wallet className="size-3.5" />
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">
                                  {group.name}
                                </h3>
                                <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-white/10 shrink-0">
                                  {group.expenses.length}{" "}
                                  {group.expenses.length === 1
                                    ? "commitment"
                                    : "commitments"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                                Monthly Reserve
                              </span>
                              <span className="text-xs font-black text-primary">
                                ₹
                                {group.amount.toLocaleString("en-IN", {
                                  maximumFractionDigits: 0,
                                })}
                                /mo
                              </span>
                            </div>
                          </div>

                          {/* Account Commitments Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                            <AnimatePresence mode="popLayout" initial={false}>
                              {group.expenses.map(
                                (exp: YearlyExpense, expIdx) => (
                                  <YearlyExpenseCard
                                    key={
                                      exp.id ||
                                      `yearly-exp-${group.accountId}-${expIdx}`
                                    }
                                    expense={exp}
                                    onEdit={(data) => {
                                      setEditingYearly(data);
                                      setIsYearlyModalOpen(true);
                                    }}
                                    onDelete={(id) => setYearlyToDelete(id)}
                                  />
                                ),
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modals - Plans */}
        <ConfirmModal
          isOpen={!!planToDelete}
          onCancel={() => setPlanToDelete(null)}
          onConfirm={() => {
            if (planToDelete) {
              handlePurgeSimulation(planToDelete);
            }
          }}
          title={
            plans.find((p: Simulation) => p.id === planToDelete)?.status ===
            "completed"
              ? "Purge Simulation"
              : "Destroy Simulation"
          }
          message={
            plans.find((p: Simulation) => p.id === planToDelete)?.status ===
            "completed"
              ? "This will permanently sanitize this simulation node from the ledger. This action is irreversible."
              : "This will completely remove this simulation environment and all child nodes."
          }
          confirmText={
            plans.find((p: Simulation) => p.id === planToDelete)?.status ===
            "completed"
              ? "Purge Node"
              : "Confirm Destruction"
          }
          isDestructive={true}
        />

        {/* Modals - Goals */}
        <EditGoalModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          editingGoal={editingGoal}
          onSave={async (id, data) => {
            setIsProcessing(true);
            try {
              if (id && editingGoal) {
                await dispatch(
                  updateGoalAction({
                    id,
                    data: { ...editingGoal, ...data },
                  }),
                ).unwrap();
                toast.success("Goal updated");
              } else if (user) {
                await dispatch(
                  addGoalAction({
                    userId: user.uid,
                    name: data.name,
                    targetAmount: data.targetAmount,
                    currentAmount: 0,
                    targetDate: data.targetDate,
                    startDate: new Date().toISOString(),
                    category: "General",
                  }),
                ).unwrap();
                toast.success("Goal synchronized");
              }
              setIsGoalModalOpen(false);
            } catch {
              toast.error("Failed to sync goal");
            } finally {
              setIsProcessing(false);
            }
          }}
        />

        <TopUpModal
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          goal={topUpGoal}
          onSave={async (amount) => {
            if (topUpGoal) {
              setIsProcessing(true);
              try {
                await dispatch(
                  updateGoalAction({
                    id: topUpGoal.id,
                    data: { currentAmount: topUpGoal.currentAmount + amount },
                  }),
                ).unwrap();
                toast.success(
                  `Invested ₹${amount.toLocaleString("en-IN")} in ${topUpGoal.name}`,
                );
                setIsTopUpModalOpen(false);
              } catch {
                toast.error("Failed to process top-up");
              } finally {
                setIsProcessing(false);
              }
            }
          }}
        />

        <ConfirmModal
          isOpen={isGoalDeleteModalOpen}
          onCancel={() => setIsGoalDeleteModalOpen(false)}
          onConfirm={async () => {
            if (goalToDelete) {
              setIsProcessing(true);
              try {
                await dispatch(
                  deleteGoalAction({
                    id: goalToDelete.id,
                    purge:
                      goalToDelete.currentAmount >= goalToDelete.targetAmount,
                  }),
                ).unwrap();
                toast.success(
                  goalToDelete.currentAmount >= goalToDelete.targetAmount
                    ? "Goal purged"
                    : "Goal removed",
                );
                setIsGoalDeleteModalOpen(false);
              } catch {
                toast.error("Failed to remove goal");
              } finally {
                setIsProcessing(false);
              }
            }
          }}
          title={
            goalToDelete &&
            goalToDelete.currentAmount >= goalToDelete.targetAmount
              ? "Purge Goal"
              : "Remove Goal"
          }
          message={
            goalToDelete &&
            goalToDelete.currentAmount >= goalToDelete.targetAmount
              ? "This will permanently sanitize this goal artifact from your trajectory. This operation cannot be undone."
              : "Permanently remove this financial target from your trajectory?"
          }
          confirmText={
            goalToDelete &&
            goalToDelete.currentAmount >= goalToDelete.targetAmount
              ? "Purge Artifact"
              : "Confirm Removal"
          }
          isDestructive={true}
        />

        <LoadingOverlay
          isOpen={isNavigating}
          message={navMessage}
          subMessage="Parsing Lattice Fragments..."
        />

        <AddExpiryModal
          isOpen={isExpiryModalOpen}
          onClose={() => {
            setIsExpiryModalOpen(false);
            setSelectedExpiry(null);
          }}
          onSave={async (data) => {
            setIsProcessing(true);
            try {
              if (selectedExpiry) {
                await dispatch(
                  updateExpiryAction({ id: selectedExpiry.id, data }),
                ).unwrap();
                toast.success("Expiry updated.");
              } else {
                await dispatch(createExpiryAction(data)).unwrap();
                toast.success("Expiry synchronized.");
              }
              setIsExpiryModalOpen(false);
            } catch {
              toast.error("Failed to synchronize expiry");
            } finally {
              setIsProcessing(false);
            }
          }}
          expiry={selectedExpiry}
        />

        {/* Modals - Yearly Expenses */}
        <AddYearlyExpenseModal
          isOpen={isYearlyModalOpen}
          onClose={() => {
            setIsYearlyModalOpen(false);
            setEditingYearly(null);
          }}
          editingExpense={editingYearly}
          onSave={async (data) => {
            setIsProcessing(true);
            try {
              if (editingYearly) {
                await dispatch(
                  updateYearlyExpense({ id: editingYearly.id, data }),
                ).unwrap();
                toast.success("Commitment updated");
              } else {
                await dispatch(createYearlyExpense(data)).unwrap();
                toast.success("Annual expenditure synchronized");
              }
              setIsYearlyModalOpen(false);
              setEditingYearly(null);
            } catch {
              toast.error("Failed to sync expenditure node");
            } finally {
              setIsProcessing(false);
            }
          }}
        />

        <ConfirmModal
          isOpen={!!yearlyToDelete}
          onCancel={() => setYearlyToDelete(null)}
          onConfirm={async () => {
            if (yearlyToDelete) {
              setIsProcessing(true);
              try {
                await dispatch(deleteYearlyExpense(yearlyToDelete)).unwrap();
                toast.success("Commitment sanitized from ledger");
                setYearlyToDelete(null);
              } catch {
                toast.error("Failed to sanitize commitment");
              } finally {
                setIsProcessing(false);
              }
            }
          }}
          isDestructive={true}
          title="Sanitize Commitment"
          message="Permanently remove this annual expenditure node? This will clear all historical allocation tracking for this item."
          confirmText="Confirm Sanitization"
        />
      </PageContainer>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

function EmptyState({
  icon,
  title,
  subtitle,
  actionText,
  onAction,
  actionIcon,
}: EmptyStateProps) {
  return (
    <div className="py-20 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] bg-white/50 dark:bg-slate-900/50">
      <div className="size-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-black uppercase tracking-widest mb-1">
        {title}
      </h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto mb-6">
        {subtitle}
      </p>
      {actionText && onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          size="sm"
          leftIcon={actionIcon}
          className="w-auto"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}

import { Suspense } from "react";

export default function PlansDirectoryPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <div className="space-y-3 mb-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        </PageContainer>
      }
    >
      <PlansDirectoryPageContent />
    </Suspense>
  );
}
