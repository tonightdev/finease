"use client";

import { useState, useEffect, useMemo } from "react";
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
  Pencil,
  Target,
  Bell,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

import { PlanningStatusFilter } from "@/components/planning/PlanningStatusFilter";

// Redux Actions
import { createSimulationAction, deleteSimulationAction, fetchSimulations, updateSimulationAction } from "@/store/slices/simulationsSlice";
import {
  fetchGoals,
  addGoalAction,
  updateGoalAction,
  deleteGoalAction,
} from "@/store/slices/goalsSlice";
import { fetchExpiries, createExpiryAction, updateExpiryAction } from "@/store/slices/expiriesSlice";
import { fetchAccounts } from "@/store/slices/accountsSlice";
import { fetchTransactions } from "@/store/slices/transactionsSlice";

// Shared Logic/Types
import { FinancialGoal, Simulation, SimAccount, SimExpense, Expiry } from "@repo/types";
import { formatDate } from "@/lib/utils";

// Modal Components
import { EditGoalModal } from "@/components/goals/EditGoalModal";
import { TopUpModal } from "@/components/goals/TopUpModal";
import { AddExpiryModal } from "@/components/expiries/AddExpiryModal";
import { ExpiryCountdown } from "@/components/expiries/ExpiryCountdown";

type TabType = "Simulations" | "Goals" | "Expiries";

function PlansDirectoryPageContent() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>("Simulations");

  const { items: plans, loading: plansLoading, lastFetched: plansFetched } = useSelector((state: RootState) => state.simulations);
  const { items: goals, loading: goalsLoading, lastFetched: goalsFetched } = useSelector((state: RootState) => state.goals);
  const { items: expiries, loading: expiriesLoading, lastFetched: expiriesFetched } = useSelector((state: RootState) => state.expiries);

  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [simFilter, setSimFilter] = useState<"ongoing" | "completed">("ongoing");
  const [goalFilter, setGoalFilter] = useState<"ongoing" | "completed">("ongoing");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navMessage, setNavMessage] = useState("");

  // Modals Local State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState<Expiry | null>(null);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [topUpGoal, setTopUpGoal] = useState<FinancialGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);
  const [isGoalDeleteModalOpen, setIsGoalDeleteModalOpen] = useState(false);

  // Sync tab with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "Goals" || tabParam === "Expiries" || tabParam === "Simulations") {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      dispatch(fetchSimulations());
      dispatch(fetchGoals());
      dispatch(fetchExpiries());
      dispatch(fetchAccounts());
      dispatch(fetchTransactions());
    }
  }, [user, dispatch]);

  // Calculations
  const calculateGap = (goal: FinancialGoal) => {
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const monthsRemaining =
      (targetDate.getFullYear() - today.getFullYear()) * 12 +
      (targetDate.getMonth() - today.getMonth());

    if (monthsRemaining <= 0) return 0;
    const shortfall = goal.targetAmount - goal.currentAmount;
    return shortfall / monthsRemaining;
  };

  const totalRequiredMonthly = useMemo(() => {
    return goals.reduce((acc: number, goal: FinancialGoal) => acc + calculateGap(goal), 0);
  }, [goals]);

  // Handlers
  const handleCreatePlan = async () => {
    setIsProcessing(true);
    try {
      const newPlan = {
        name: `Simulation ${plans.length + 1}`,
        createdAt: new Date().toISOString(),
        accounts: [],
        expenses: [],
        status: "ongoing" as const
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
      const newStatus: "ongoing" | "completed" = plan.status === "completed" ? "ongoing" : "completed";
      await dispatch(updateSimulationAction({ id: plan.id, data: { status: newStatus } })).unwrap();
      toast.success(newStatus === "completed" ? "Simulation completed" : "Simulation reopened");
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
    return plans.filter(p => (p.status || "ongoing") === simFilter);
  }, [plans, simFilter]);

  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      const isCompleted = g.currentAmount >= g.targetAmount;
      return goalFilter === "completed" ? isCompleted : !isCompleted;
    });
  }, [goals, goalFilter]);

  return (
    <PageContainer>
      <PageHeader
        title="Planning Hub"
        subtitle={
          activeTab === "Goals" ? (
            <div className="flex items-center gap-1.5 transition-all">
              Need <span className="text-primary font-bold">₹{totalRequiredMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span> to meet all targets.
            </div>
          ) : activeTab === "Expiries" ? (
            "Active triggers and financial expiries"
          ) : (
            "Tactical simulations for capital management and events"
          )
        }
        className="space-y-2"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar w-full sm:w-auto">
            {(["Simulations", "Goals", "Expiries"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                  ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab === "Simulations" && (
              <Button
                onClick={handleCreatePlan}
                disabled={isProcessing}
                size="sm"
                className="w-full sm:w-auto"
                leftIcon={isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              >
                {isProcessing ? "Initializing..." : "Initialize Simulation"}
              </Button>
            )}
            {activeTab === "Goals" && (
              <Button
                onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}
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
                onClick={() => setIsExpiryModalOpen(true)}
                disabled={isProcessing}
                size="sm"
                className="w-full sm:w-auto"
                leftIcon={<Bell className="w-3.5 h-3.5" />}
              >
                Add Expiry
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
              className="space-y-4"
            >
              <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                <div className="space-y-4 py-2 px-1">
                  <PlanningStatusFilter
                    activeStatus={simFilter}
                    onChange={setSimFilter}
                    options={[
                      { value: "ongoing", label: "Active Simulations" },
                      { value: "completed", label: "Historical Simulations" },
                    ]}
                  />

                  {plansLoading || !plansFetched ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={`plan-skeleton-${i}`} className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-4 rounded-xl space-y-4 h-full min-h-[140px]">
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
                        {simFilter === "completed" ? "No historical simulations found" : "No active simulations configured"}
                      </p>
                      {simFilter === "ongoing" && (
                        <Button onClick={handleCreatePlan} variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} className="w-auto mt-4">
                          Initialize Simulation
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <AnimatePresence mode="popLayout">
                        {filteredPlans.map(plan => (
                          <motion.div
                            layout
                            key={plan.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            whileHover={{ y: -6, scale: 1.02 }}
                            onClick={() => {
                              setNavMessage("Opening Environment...");
                              setIsNavigating(true);
                              router.push(`/plans/${plan.id}`);
                            }}
                            className={`group relative p-3.5 sm:p-5 rounded-2xl sm:rounded-[2rem] border transition-all h-full flex flex-col justify-between cursor-pointer ${plan.status === "completed" ? "opacity-75 grayscale-[0.2]" : ""
                              } bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border-slate-100 dark:border-white/5 hover:border-primary/40 hover:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.1)] overflow-hidden`}
                          >
                            {/* Animated Background Mesh Gradient (on hover) */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700 bg-[radial-gradient(circle_at_top_right,var(--primary-light),transparent),radial-gradient(circle_at_bottom_left,var(--secondary-light),transparent)]" />

                            {/* Accent Edge */}
                            <div className={`absolute top-0 left-0 w-full h-[3px] transition-all duration-300 ${plan.status === "completed" ? "bg-slate-300 dark:bg-slate-700" : "bg-gradient-to-r from-primary via-indigo-500 to-emerald-500"}`} />

                            <div className="space-y-3.5 sm:space-y-5 relative z-10">
                              <div className="flex justify-between items-start">
                                <div className="size-9 sm:size-11 rounded-xl sm:rounded-2xl border bg-gradient-to-br from-indigo-50 to-indigo-100/30 dark:from-indigo-900/40 dark:to-indigo-500/10 text-primary border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-1 rounded-xl border border-slate-100 dark:border-white/10 shadow-sm transition-all">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePlanStatus(plan);
                                      }}
                                      className="p-1 px-2 text-slate-400 hover:text-emerald-500 transition-all rounded-lg hover:bg-emerald-500/5"
                                      title={plan.status === "completed" ? "Reopen Strategy" : "Complete Strategy"}
                                    >
                                      {plan.status === "completed" ? <RefreshCw className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPlanToDelete(plan.id);
                                      }}
                                      className={`p-1 px-2 transition-all rounded-lg ${plan.status === "completed" ? "text-rose-500 hover:bg-rose-500/10" : "text-slate-400 hover:text-rose-500 hover:bg-rose-500/5"}`}
                                      title={plan.status === "completed" ? "Purge Strategy" : "Delete Strategy"}
                                    >
                                      {plan.status === "completed" ? <Zap className="size-3.5" /> : <Trash2 className="size-3.5" />}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-center text-center">
                                <h4 className="text-[13px] sm:text-[15px] font-black tracking-tighter text-slate-900 dark:text-white uppercase transition-colors group-hover:text-primary leading-tight">
                                  {plan.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-1.5 justify-center">
                                  <div className="h-0.5 w-4 bg-primary/20 rounded-full" />
                                  <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    {new Date(plan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </p>
                                  <div className="h-0.5 w-4 bg-primary/20 rounded-full" />
                                </div>
                              </div>

                              <div className="">
                                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                                  {/* Stat Pill: Liquidity */}
                                  <div className="flex flex-col p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 group-hover:border-emerald-300 dark:group-hover:border-emerald-500/30 transition-colors">
                                    <span className="text-[6px] sm:text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none mb-1 sm:mb-1.5">
                                      Liquidity
                                    </span>
                                    <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                                      ₹{(plan.accounts || []).reduce((acc: number, a: SimAccount) => acc + a.balance, 0).toLocaleString()}
                                    </span>
                                  </div>

                                  {/* Stat Pill: Burn Rate */}
                                  <div className="flex flex-col p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-rose-50/30 dark:bg-rose-500/5 border border-rose-100/50 dark:border-rose-500/10 group-hover:border-rose-300 dark:group-hover:border-rose-500/30 transition-colors">
                                    <span className="text-[6px] sm:text-[7px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-none mb-1 sm:mb-1.5">
                                      Burn Rate
                                    </span>
                                    <span className="text-xs font-black text-rose-600 dark:text-rose-400 tabular-nums">
                                      ₹{(plan.expenses || []).reduce((acc: number, e: SimExpense) => acc + e.amount, 0).toLocaleString()}
                                    </span>
                                  </div>
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
              className="space-y-4"
            >
              <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                <div className="space-y-4 py-2 px-1">
                  <PlanningStatusFilter
                    activeStatus={goalFilter}
                    onChange={setGoalFilter}
                    options={[
                      { value: "ongoing", label: "Active Goals" },
                      { value: "completed", label: "Completed Goals" },
                    ]}
                  />

                  {goalsLoading || !goalsFetched ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={`goal-skeleton-${i}`} className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-4 rounded-xl space-y-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-2 w-16" />
                            </div>
                            <Skeleton className="h-5 w-10 rounded-lg" />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between"><Skeleton className="h-2 w-12" /><Skeleton className="h-2 w-12" /></div>
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
                      title={goalFilter === "completed" ? "No completed goals" : "No active goals set"}
                      subtitle={goalFilter === "completed" ? "Your achievements will be archived here." : "Define your first financial target to track progress with high precision."}
                      actionText={goalFilter === "ongoing" ? "Add your first goal" : undefined}
                      onAction={goalFilter === "ongoing" ? () => { setEditingGoal(null); setIsGoalModalOpen(true); } : undefined}
                      actionIcon={<Plus className="w-3.5 h-3.5" />}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredGoals.map((goal: FinancialGoal) => {
                        const reqMonthly = calculateGap(goal);
                        const isCompleted = goal.currentAmount >= goal.targetAmount;
                        const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100).toFixed(1);
                        return (
                          <div key={goal.id} className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-3 rounded-xl flex flex-col justify-between group">
                            <div className="flex justify-between items-start mb-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-slate-900 dark:text-white font-black text-xs tracking-wider uppercase truncate">{goal.name}</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Target: {formatDate(goal.targetDate)}</p>
                              </div>
                              <div className={`px-1.5 py-0.5 text-[8px] font-black rounded-lg border ${isCompleted ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                                {isCompleted ? "COMPLETED" : `${percent}%`}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between items-baseline text-[10px] font-black uppercase tracking-tight">
                                <span className={isCompleted ? "text-emerald-500" : "text-slate-900 dark:text-white"}>₹{goal.currentAmount.toLocaleString()}</span>
                                <span className="text-slate-400">₹{goal.targetAmount.toLocaleString()}</span>
                              </div>
                              <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${isCompleted ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${percent}%` }} />
                              </div>
                              <div className="flex justify-between text-[7px] font-black uppercase tracking-[0.15em] text-slate-400">
                                <span>{isCompleted ? "Target Achieved" : `Gap: ₹${(goal.targetAmount - goal.currentAmount).toLocaleString()}`}</span>
                                {!isCompleted && <span className="text-orange-500">₹{reqMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>}
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50 dark:border-white/5">
                              {!isCompleted && (
                                <button
                                  onClick={() => { setTopUpGoal(goal); setIsTopUpModalOpen(true); }}
                                  className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-[8px] font-black uppercase py-1.5 rounded-lg transition-all"
                                >
                                  Top Up
                                </button>
                              )}
                              <button
                                onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }}
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 p-1.5 rounded-lg text-slate-500 transition-all ml-auto"
                              >
                                <Pencil className="size-3" />
                              </button>
                              <button
                                onClick={() => { setGoalToDelete(goal); setIsGoalDeleteModalOpen(true); }}
                                className={`p-1.5 rounded-lg transition-all ${isCompleted ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white" : "bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100"}`}
                                title={isCompleted ? "Purge Goal" : "Delete Goal"}
                              >
                                {isCompleted ? <Zap className="size-3" /> : <Trash2 className="size-3" />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
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
              className="space-y-4"
            >
              {expiriesLoading || !expiriesFetched ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`expiry-skeleton-${i}`} className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-4 rounded-xl space-y-4 h-full min-h-[140px]">
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
                <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                  <ExpiryCountdown
                    expiries={expiries}
                    onEdit={(expiry) => { setSelectedExpiry(expiry); setIsExpiryModalOpen(true); }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals - Plans */}
      <ConfirmModal
        isOpen={!!planToDelete}
        onCancel={() => setPlanToDelete(null)}
        onConfirm={() => { if (planToDelete) { handlePurgeSimulation(planToDelete); } }}
        title={plans.find(p => p.id === planToDelete)?.status === "completed" ? "Purge Simulation" : "Destroy Simulation"}
        message={plans.find(p => p.id === planToDelete)?.status === "completed"
          ? "This will permanently sanitize this simulation node from the ledger. This action is irreversible."
          : "This will completely remove this simulation environment and all child nodes."}
        confirmText={plans.find(p => p.id === planToDelete)?.status === "completed" ? "Purge Node" : "Confirm Destruction"}
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
              await dispatch(updateGoalAction({
                id,
                data: { ...editingGoal, ...data }
              })).unwrap();
              toast.success("Goal updated");
            } else if (user) {
              await dispatch(addGoalAction({
                userId: user.uid,
                name: data.name,
                targetAmount: data.targetAmount,
                currentAmount: 0,
                targetDate: data.targetDate,
                startDate: new Date().toISOString(),
                category: "General",
              })).unwrap();
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
              await dispatch(updateGoalAction({ id: topUpGoal.id, data: { currentAmount: topUpGoal.currentAmount + amount } })).unwrap();
              toast.success(`Invested ₹${amount.toLocaleString()} in ${topUpGoal.name}`);
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
              await dispatch(deleteGoalAction({ id: goalToDelete.id, purge: goalToDelete.currentAmount >= goalToDelete.targetAmount })).unwrap();
              toast.success(goalToDelete.currentAmount >= goalToDelete.targetAmount ? "Goal purged" : "Goal removed");
              setIsGoalDeleteModalOpen(false);
            } catch {
              toast.error("Failed to remove goal");
            } finally {
              setIsProcessing(false);
            }
          }
        }}
        title={goalToDelete && goalToDelete.currentAmount >= goalToDelete.targetAmount ? "Purge Goal" : "Remove Goal"}
        message={goalToDelete && goalToDelete.currentAmount >= goalToDelete.targetAmount
          ? "This will permanently sanitize this goal artifact from your trajectory. This operation cannot be undone."
          : "Permanently remove this financial target from your trajectory?"}
        confirmText={goalToDelete && goalToDelete.currentAmount >= goalToDelete.targetAmount ? "Purge Artifact" : "Confirm Removal"}
        isDestructive={true}
      />

      <LoadingOverlay
        isOpen={isNavigating}
        message={navMessage}
        subMessage="Parsing Lattice Fragments..."
      />

      <AddExpiryModal
        isOpen={isExpiryModalOpen}
        onClose={() => { setIsExpiryModalOpen(false); setSelectedExpiry(null); }}
        onSave={async (data) => {
          setIsProcessing(true);
          try {
            if (selectedExpiry) {
              await dispatch(updateExpiryAction({ id: selectedExpiry.id, data })).unwrap();
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
    </PageContainer>
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

function EmptyState({ icon, title, subtitle, actionText, onAction, actionIcon }: EmptyStateProps) {
  return (
    <div className="py-20 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] bg-white/50 dark:bg-slate-900/50">
      <div className="size-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-black uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto mb-6">{subtitle}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="outline" size="sm" leftIcon={actionIcon} className="w-auto">
          {actionText}
        </Button>
      )}
    </div>
  );
}

import { Suspense } from "react";

export default function PlansDirectoryPage() {
  return (
    <Suspense fallback={
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
    }>
      <PlansDirectoryPageContent />
    </Suspense>
  );
}
