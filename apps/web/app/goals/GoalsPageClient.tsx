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
  fetchExpiries,
  createExpiryAction,
  updateExpiryAction,
} from "@/store/slices/expiriesSlice";
import { EditGoalModal } from "@/components/goals/EditGoalModal";
import { ExpiryCountdown } from "@/components/expiries/ExpiryCountdown";
import { AddExpiryModal } from "@/components/expiries/AddExpiryModal";
import { FinancialGoal, Expiry } from "@repo/types";
import { formatDate } from "@/lib/utils";
import { TopUpModal } from "@/components/goals/TopUpModal";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/ui/PageContainer";
import { useAuth } from "@/components/auth/AuthProvider";
import { Edit2, Trash2, Plus, Wallet, Pencil, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function GoalsPageClient() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState<Expiry | null>(
    null,
  );
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [topUpGoal, setTopUpGoal] = useState<FinancialGoal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const goals = useSelector((state: RootState) => state.goals.items);
  const loading = useSelector((state: RootState) => state.goals.loading);
  const expiries = useSelector((state: RootState) => state.expiries.items);

  useEffect(() => {
    if (user) {
      dispatch(fetchGoals());
      dispatch(fetchExpiries());
      dispatch(fetchAccounts());
      dispatch(fetchTransactions());
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
    <PageContainer>
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
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpiryModalOpen(true)}
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
              Active Goals
            </h3>
            <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded tracking-[0.1em]">
              {goals.length} Targets
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {goals.length === 0 ? (
              <div className="col-span-full text-center py-12 px-6 sm:py-20 bg-white dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-white/5">
                <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  No Goals Set
                </h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Define your first goal to start tracking progress.
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
                    className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between h-full min-w-0"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between min-w-0 gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-slate-900 dark:text-white font-black text-[11px] sm:text-sm tracking-tight truncate leading-none uppercase">
                            {goal.name}
                          </h3>
                          <p className="text-slate-400 text-[7px] font-bold uppercase tracking-widest mt-1.5">
                            {formatDate(goal.targetDate)}
                          </p>
                        </div>
                        <div className="text-[8px] sm:text-[10px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-full border border-primary/10 tracking-widest">
                          {percent}%
                        </div>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        <div className="flex justify-between items-baseline gap-1">
                          <span className="text-slate-900 dark:text-white font-black text-[11px] sm:text-sm tracking-tighter">
                            ₹{goal.currentAmount.toLocaleString()}
                          </span>
                          <span className="text-[7px] font-bold text-slate-400 truncate">
                            Target ₹{goal.targetAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="relative h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="absolute h-full bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-slate-400 mt-2">
                          <span className="truncate border-r border-slate-100 dark:border-white/5 pr-2.5">
                            Gap ₹{Math.round(goal.targetAmount - goal.currentAmount).toLocaleString()}
                          </span>
                          <span className="text-orange-500 pl-2.5 shrink-0">
                            ₹{reqMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}/mo
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col xs:flex-row gap-2 pt-3 border-t border-slate-50 dark:border-white/5">
                      <button
                        onClick={() => {
                          setTopUpGoal(goal);
                          setIsTopUpModalOpen(true);
                        }}
                        className="px-2 py-1.5 rounded-lg bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors active:bg-primary/20"
                      >
                        <Wallet className="w-3 h-3" /> <span className="xs:hidden">Top Up</span>
                      </button>
                      <div className="flex flex-1 gap-2">
                        <button
                          onClick={() => {
                            setEditingGoal(goal);
                            setIsGoalModalOpen(true);
                          }}
                          className="flex-1 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center transition-colors active:bg-slate-200 dark:active:bg-slate-700"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setGoalToDelete(goal);
                            setIsDeleteModalOpen(true);
                          }}
                          className="flex-1 p-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center transition-colors active:bg-rose-100 dark:active:bg-rose-500/20"
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
              {expiries.length} Alerts
            </span>
          </div>
          <ExpiryCountdown
            expiries={expiries}
            onEdit={(expiry) => {
              setSelectedExpiry(expiry);
              setIsExpiryModalOpen(true);
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

          }
        }}
      />

      <AddExpiryModal
        isOpen={isExpiryModalOpen}
        onClose={() => {
          setIsExpiryModalOpen(false);
          setSelectedExpiry(null);
        }}
        onSave={async (data) => {
          if (selectedExpiry) {
            await dispatch(updateExpiryAction({ id: selectedExpiry.id, data })).unwrap();
            toast.success("Expiry updated.");
          } else {
            await dispatch(createExpiryAction(data)).unwrap();
            toast.success("Expiry added.");
          }
        }}
        expiry={selectedExpiry}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setGoalToDelete(null);
        }}
        onConfirm={async () => {
          if (!goalToDelete) return;
          await dispatch(deleteGoalAction({ id: goalToDelete.id })).unwrap();
          toast.success("Goal decommissioned");

          setIsDeleteModalOpen(false);
          setGoalToDelete(null);
        }}
        title="Sanitize Goal"
        message="This operation will permanently remove this financial goal from your roadmap. All historical tracking for this target will be lost."
        confirmText="Confirm Purge"
      />
    </PageContainer>
  );
}
