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
import { fetchAccounts } from "@/store/slices/accountsSlice";
import { fetchTransactions } from "@/store/slices/transactionsSlice";
import {
  fetchExpiries,
  createExpiryAction,
  updateExpiryAction,
} from "@/store/slices/expiriesSlice";
import { EditGoalModal } from "@/components/goals/EditGoalModal";
import { ExpiryCountdown } from "@/components/expiries/ExpiryCountdown";
import { AddExpiryModal } from "@/components/expiries/AddExpiryModal";
import { FinancialGoal, Expiry } from "@repo/types";
import { TopUpModal } from "@/components/goals/TopUpModal";
import { GoalCard } from "@/components/goals/GoalCard";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/ui/PageContainer";
import { useAuth } from "@/components/auth/AuthProvider";
import { Plus, Target } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function GoalsPageClient() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);
  const [selectedExpiry, setSelectedExpiry] = useState<Expiry | null>(null);
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

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      }),
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
              {totalRequiredMonthly.toLocaleString("en-IN", {
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
              onClick={() => {
                setSelectedExpiry(null);
                setIsExpiryModalOpen(true);
              }}
              className="flex-1 sm:flex-initial"
              leftIcon={<Plus className="w-3.5 h-3.5 text-primary" />}
            >
              Add Expiry
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
          <div className="flex items-center justify-between px-1 py-1">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Active Goals
            </h3>
            <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded tracking-[0.1em]">
              {goals.length} Targets
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
              sortedGoals.map((goal: FinancialGoal) => (
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
                    setIsDeleteModalOpen(true);
                  }}
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 py-1">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Financial Expiries
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-orange-500 uppercase bg-orange-500/10 px-1.5 py-0.5 rounded tracking-[0.1em]">
                {expiries.length} Alerts
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedExpiry(null);
                  setIsExpiryModalOpen(true);
                }}
                className="size-6 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors cursor-pointer"
                title="Add Expiry"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
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
              `Invested ₹${amount.toLocaleString("en-IN")} in ${topUpGoal.name}`,
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
            await dispatch(
              updateExpiryAction({ id: selectedExpiry.id, data }),
            ).unwrap();
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
