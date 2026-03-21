"use client";

import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  fetchGoals,
  addGoalAction,
  updateGoalAction,
  deleteGoalAction,
} from "@/store/slices/goalsSlice";
import {
  fetchAccounts,
} from "@/store/slices/accountsSlice";
import {
  fetchTransactions,
} from "@/store/slices/transactionsSlice";
import {
  fetchReminders,
  createReminder,
  Reminder,
} from "@/store/slices/remindersSlice";
import { EditGoalModal } from "@/components/goals/EditGoalModal";
import { ReminderCountdown } from "@/components/reminders/ReminderCountdown";
import { AddReminderModal } from "@/components/reminders/AddReminderModal";
import { FinancialGoal } from "@repo/types";
import { formatDate } from "@/lib/utils";
import { TopUpModal } from "@/components/goals/TopUpModal";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Edit2, Trash2, Plus, Wallet, Pencil, Target } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function GoalsPageClient() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(
    null,
  );
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [topUpGoal, setTopUpGoal] = useState<FinancialGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const goals = useSelector((state: RootState) => state.goals.items);
  const loading = useSelector((state: RootState) => state.goals.loading);
  const reminders = useSelector((state: RootState) => state.reminders.items);

  useEffect(() => {
    if (user) {
      dispatch(fetchGoals({ force: true }));
      dispatch(fetchReminders());
      dispatch(fetchAccounts({ force: true }));
      dispatch(fetchTransactions({ force: true }));
    }
  }, [dispatch, user]);

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
    return goals.reduce(
      (acc: number, goal: FinancialGoal) => acc + calculateGap(goal),
      0,
    );
  }, [goals]);

  if (loading && goals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-4 sm:space-y-6 pb-20 lg:pb-8 pt-0">
      <PageHeader
        title="Goals"
        subtitle={
          <>
            Need{" "}
            <span className="text-primary font-bold">
              ₹
              {totalRequiredMonthly.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
              /mo
            </span>{" "}
            to meet all targets.
          </>
        }
        className="space-y-3"
        actions={
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReminderModalOpen(true)}
              className="flex-1 sm:flex-initial"
              leftIcon={<Edit2 className="w-3.5 h-3.5 text-primary" />}
            >
              Expiries
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingGoal(null);
                setIsGoalModalOpen(true);
              }}
              className="flex-1 sm:flex-initial"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Goal
            </Button>
          </div>
        }
      />

      <div className="space-y-6 lg:space-y-10">
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-white/5 -mx-4 px-4 py-1.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Active Milestones
            </h3>
            <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded tracking-[0.1em]">
              {goals.length} Targets
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {goals.length === 0 ? (
              <div className="col-span-2 text-center py-12 px-6 sm:py-20 bg-white dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
                <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  No Goals Set
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Define your first milestone to start tracking progress.
                </p>
              </div>
            ) : (
              goals.map((goal: FinancialGoal) => {
                const reqMonthly = calculateGap(goal);
                const percent = Math.min(
                  100,
                  (goal.currentAmount / goal.targetAmount) * 100,
                ).toFixed(1);

                return (
                  <div
                    key={goal.id}
                    className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-4 rounded-3xl shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-full"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between min-w-0">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-slate-900 dark:text-white font-black text-sm tracking-tight truncate leading-none uppercase">
                            {goal.name}
                          </h3>
                          <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-1.5">
                            {formatDate(goal.targetDate)}
                          </p>
                        </div>
                        <div className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10 tracking-widest">
                          {percent}%
                        </div>
                      </div>

                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-900 dark:text-white font-black text-sm tracking-tighter">
                            ₹{goal.currentAmount.toLocaleString()}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400">
                            Target ₹{goal.targetAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="relative h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="absolute h-full bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-widest text-slate-400">
                          <span>
                            Gap: ₹
                            {Math.round(
                              goal.targetAmount - goal.currentAmount,
                            ).toLocaleString()}
                          </span>
                          <span className="text-orange-500">
                            ₹
                            {reqMonthly.toLocaleString(undefined, {
                              maximumFractionDigits: 0,
                            })}
                            /mo
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-50 dark:border-white/5">
                      <button
                        onClick={() => {
                          setTopUpGoal(goal);
                          setIsTopUpModalOpen(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors active:bg-primary/20"
                      >
                        <Wallet className="w-3 h-3" />
                      </button>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setEditingGoal(goal);
                            setIsGoalModalOpen(true);
                          }}
                          className="flex-1 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center transition-colors active:bg-slate-200 dark:active:bg-slate-700"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setGoalToDelete(goal);
                            setIsDeleteModalOpen(true);
                          }}
                          className="flex-1 p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center transition-colors active:bg-rose-100 dark:active:bg-rose-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-white/5 -mx-4 px-4 py-1.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Financial Expiries
            </h3>
            <span className="text-[8px] font-black text-orange-500 uppercase bg-orange-500/10 px-1.5 py-0.5 rounded tracking-[0.1em]">
              {reminders.length} Alerts
            </span>
          </div>
          <ReminderCountdown
            reminders={reminders}
            onEdit={(reminder) => {
              setSelectedReminder(reminder);
              setIsReminderModalOpen(true);
            }}
          />
        </div>
      </div>

      <EditGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        editingGoal={editingGoal}
        onSave={async (id, data) => {
          if (id) {
            await dispatch(updateGoalAction({ id, data })).unwrap();
            toast.success("Goal updated");
          } else {
            if (!user) return;
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
            toast.success("Goal created");
          }
          dispatch(fetchAccounts({ force: true }));
          dispatch(fetchTransactions({ force: true }));
          dispatch(fetchGoals({ force: true }));
        }}
      />

      <TopUpModal
        isOpen={isTopUpModalOpen}
        onClose={() => setIsTopUpModalOpen(false)}
        goal={topUpGoal}
        onSave={async (amount) => {
          if (topUpGoal) {
            await dispatch(
              updateGoalAction({
                id: topUpGoal.id,
                data: {
                  currentAmount: topUpGoal.currentAmount + amount,
                },
              }),
            ).unwrap();
            toast.success(
              `Invested ₹${amount.toLocaleString()} in ${topUpGoal.name}`,
            );
            dispatch(fetchAccounts({ force: true }));
            dispatch(fetchTransactions({ force: true }));
            dispatch(fetchGoals({ force: true }));
          }
        }}
      />

      <AddReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setSelectedReminder(null);
        }}
        onSave={async (data) => {
          await dispatch(createReminder(data)).unwrap();
          toast.success("Signal established.");
        }}
        reminder={selectedReminder}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setGoalToDelete(null);
        }}
        onConfirm={async () => {
          if (!goalToDelete) return;
          await dispatch(deleteGoalAction(goalToDelete.id)).unwrap();
          toast.success("Milestone decommissioned");
          dispatch(fetchAccounts({ force: true }));
          dispatch(fetchTransactions({ force: true }));
          dispatch(fetchGoals({ force: true }));
          setIsDeleteModalOpen(false);
          setGoalToDelete(null);
        }}
        title="Sanitize Milestone"
        message="This operation will permanently remove this financial goal from your roadmap. All historical tracking for this target will be lost."
        confirmText="Confirm Purge"
      />
    </div>
  );
}
