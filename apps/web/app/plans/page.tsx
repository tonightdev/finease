"use client";

import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import toast from "react-hot-toast";

import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

// Icons
import {
  Plus,
  Trash2,
  FileText,
  Pencil,
  Target,
  Bell,
} from "lucide-react";

// Redux Actions
import { createPlanAction, deletePlanAction, fetchPlans } from "@/store/slices/plansSlice";
import {
  fetchGoals,
  addGoalAction,
  updateGoalAction,
  deleteGoalAction,
} from "@/store/slices/goalsSlice";
import { fetchReminders, createReminder, updateReminder, Reminder } from "@/store/slices/remindersSlice";
import { fetchAccounts } from "@/store/slices/accountsSlice";
import { fetchTransactions } from "@/store/slices/transactionsSlice";

// Shared Logic/Types
import { FinancialGoal } from "@repo/types";
import { formatDate } from "@/lib/utils";

// Modal Components
import { EditGoalModal } from "@/components/goals/EditGoalModal";
import { TopUpModal } from "@/components/goals/TopUpModal";
import { AddReminderModal } from "@/components/reminders/AddReminderModal";
import { ReminderCountdown } from "@/components/reminders/ReminderCountdown";

type TabType = "Simulations" | "Goals" | "Expiries";

export default function PlansDirectoryPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>("Simulations");

  const { items: plans, loading: plansLoading } = useSelector((state: RootState) => state.plans);
  const { items: goals, loading: goalsLoading } = useSelector((state: RootState) => state.goals);
  const { items: reminders, loading: remindersLoading } = useSelector((state: RootState) => state.reminders);

  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  // Modals Local State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [topUpGoal, setTopUpGoal] = useState<FinancialGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);
  const [isGoalDeleteModalOpen, setIsGoalDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchPlans());
      dispatch(fetchGoals());
      dispatch(fetchReminders());
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
    const newPlan = {
      name: `Simulation ${plans.length + 1}`,
      createdAt: new Date().toISOString(),
      accounts: [],
      expenses: []
    };
    const created = await dispatch(createPlanAction(newPlan)).unwrap();
    router.push(`/plans/${created.id}`);
  };

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
            "Simulated architectural spaces for events and events"
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
                size="sm"
                className="w-full sm:w-auto"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Initialize Simulation
              </Button>
            )}
            {activeTab === "Goals" && (
              <Button
                onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}
                size="sm"
                className="w-full sm:w-auto"
                leftIcon={<Target className="w-3.5 h-3.5" />}
              >
                Add Goal
              </Button>
            )}
            {activeTab === "Expiries" && (
              <Button
                onClick={() => setIsReminderModalOpen(true)}
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

      <div className="mt-2 min-h-[400px]">
        <AnimatePresence mode="wait">
          {activeTab === "Simulations" && (
            <motion.div
              key="simulations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {plansLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`plan-skeleton-${i}`} className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-4 rounded-xl space-y-4">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-2 w-20" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-2 w-full" />
                        <Skeleton className="h-1 w-full rounded-full" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 flex-1 rounded-lg" />
                        <Skeleton className="size-8 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : plans.length === 0 ? (
                <EmptyState
                  icon={<FileText className="size-8" />}
                  title="No active simulations"
                  subtitle="Create your first simulation environment to mock accounts and expenses."
                  actionText="Initialize your first simulation"
                  onAction={handleCreatePlan}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans.map(plan => (
                    <Card
                      key={plan.id}
                      className="group cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 overflow-hidden relative flex flex-col h-full min-h-[110px]"
                      onClick={() => router.push(`/plans/${plan.id}`)}
                    >
                      <div className="flex flex-col">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="flex flex-col">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-wider uppercase leading-none">{plan.name}</h4>
                            <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mt-1.5">
                              {new Date(plan.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 -mr-1.5 -mt-1 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setPlanToDelete(plan.id); }}
                              className="p-1.5 text-slate-400 transition-colors hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 space-y-2.5">
                          <div className="flex justify-between items-end gap-2">
                            <div className="flex flex-col">
                              <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Target Capital / Yield</span>
                              <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-xs font-black text-emerald-500 leading-none">
                                  ₹{plan.accounts.reduce((acc, a) => acc + a.balance, 0).toLocaleString()}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">
                                  / ₹{plan.expenses.reduce((acc, e) => acc + e.amount, 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="h-0.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min(100, (plan.accounts.reduce((acc, a) => acc + a.balance, 0) / (plan.expenses.reduce((acc, e) => acc + e.amount, 0) || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
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
              {goalsLoading ? (
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
              ) : goals.length === 0 ? (
                <EmptyState
                  icon={<Target className="size-8" />}
                  title="No goals set"
                  subtitle="Define your first financial target to track progress with high precision."
                  actionText="Add your first goal"
                  onAction={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {goals.map((goal: FinancialGoal) => {
                    const reqMonthly = calculateGap(goal);
                    const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100).toFixed(1);
                    return (
                      <div key={goal.id} className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-3 rounded-xl flex flex-col justify-between group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-slate-900 dark:text-white font-black text-xs tracking-wider uppercase truncate">{goal.name}</h3>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Target: {formatDate(goal.targetDate)}</p>
                          </div>
                          <div className="px-1.5 py-0.5 bg-primary/10 text-primary text-[8px] font-black rounded-lg border border-primary/20">
                            {percent}%
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline text-[10px] font-black uppercase tracking-tight">
                            <span className="text-slate-900 dark:text-white">₹{goal.currentAmount.toLocaleString()}</span>
                            <span className="text-slate-400">₹{goal.targetAmount.toLocaleString()}</span>
                          </div>
                          <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                          </div>
                          <div className="flex justify-between text-[7px] font-black uppercase tracking-[0.15em] text-slate-400">
                            <span>Gap: ₹{(goal.targetAmount - goal.currentAmount).toLocaleString()}</span>
                            <span className="text-orange-500">₹{reqMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50 dark:border-white/5">
                          <button
                            onClick={() => { setTopUpGoal(goal); setIsTopUpModalOpen(true); }}
                            className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-[8px] font-black uppercase py-1.5 rounded-lg transition-all"
                          >
                            Top Up
                          </button>
                          <button
                            onClick={() => { setEditingGoal(goal); setIsGoalModalOpen(true); }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 p-1.5 rounded-lg text-slate-500 transition-all"
                          >
                            <Pencil className="size-3" />
                          </button>
                          <button
                            onClick={() => { setGoalToDelete(goal); setIsGoalDeleteModalOpen(true); }}
                            className="bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 p-1.5 rounded-lg text-rose-500 transition-all"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              {remindersLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={`reminder-skeleton-${i}`} className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-4 rounded-xl space-y-4 h-full min-h-[140px]">
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
                <div className="bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 p-2">
                  <ReminderCountdown
                    reminders={reminders}
                    onEdit={(reminder) => { setSelectedReminder(reminder); setIsReminderModalOpen(true); }}
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
        onConfirm={() => { if (planToDelete) { dispatch(deletePlanAction(planToDelete)); setPlanToDelete(null); } }}
        title="Destroy Simulation"
        message="This will completely remove this simulated environment and all child nodes."
      />

      {/* Modals - Goals */}
      <EditGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        editingGoal={editingGoal}
        onSave={async (id, data) => {
          if (id) {
            await dispatch(updateGoalAction({ id, data })).unwrap();
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
            toast.success("Goal added");
          }
        }}
      />

      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        goal={topUpGoal}
        onSave={async (amount) => {
          if (topUpGoal) {
            await dispatch(updateGoalAction({ id: topUpGoal.id, data: { currentAmount: topUpGoal.currentAmount + amount } })).unwrap();
            toast.success(`Invested ₹${amount.toLocaleString()} in ${topUpGoal.name}`);
          }
        }}
      />

      <ConfirmModal
        isOpen={isGoalDeleteModalOpen}
        onCancel={() => setIsGoalDeleteModalOpen(false)}
        onConfirm={async () => {
          if (goalToDelete) {
            await dispatch(deleteGoalAction(goalToDelete.id)).unwrap();
            toast.success("Goal removed");
            setIsGoalDeleteModalOpen(false);
          }
        }}
        title="Remove Goal"
        message="Permanently remove this financial target from your trajectory?"
      />

      <AddReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => { setIsReminderModalOpen(false); setSelectedReminder(null); }}
        onSave={async (data) => {
          if (selectedReminder) {
            await dispatch(updateReminder({ id: selectedReminder.id, data })).unwrap();
            toast.success("Expiry updated.");
          } else {
            await dispatch(createReminder(data)).unwrap();
            toast.success("Expiry added.");
          }
        }}
        reminder={selectedReminder}
      />
    </PageContainer>
  );
}

function EmptyState({ icon, title, subtitle, actionText, onAction }: any) {
  return (
    <div className="py-20 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] bg-white/50 dark:bg-slate-900/50">
      <div className="size-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-black uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto mb-6">{subtitle}</p>
      <Button onClick={onAction} variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} className="w-auto">
        {actionText}
      </Button>
    </div>
  );
}
