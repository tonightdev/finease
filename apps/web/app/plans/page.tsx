"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import { createPlanAction, deletePlanAction, fetchPlans } from "@/store/slices/plansSlice";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Trash2, FileText, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function PlansDirectoryPage() {
  const plans = useSelector((state: RootState) => state.plans.items);
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { user } = useAuth();
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      dispatch(fetchPlans());
    }
  }, [user, dispatch]);

  const handleCreatePlan = async () => {
    const newPlan = {
      name: `Plan ${plans.length + 1}`,
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
        title="Short Term Plans"
        subtitle="Simulated architectural space for events and micro-budgets"
        actions={
          <Button
            onClick={handleCreatePlan}
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="w-full sm:w-auto"
          >
            Initialize Plan
          </Button>
        }
      />

      <div className="mt-2 space-y-4">
        {plans.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 mx-0">
            <div className="size-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <FileText className="size-8" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-1">No active plans</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto mb-6">Create your first short term plan to mock accounts and expenses.</p>
            <Button
              onClick={handleCreatePlan}
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="w-auto"
            >
              Initialize your first plan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mx-0">
            <AnimatePresence>
              {plans.map(plan => (
                <motion.div
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className="group cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 overflow-hidden relative flex flex-col h-full min-h-[150px]"
                    onClick={() => router.push(`/plans/${plan.id}`)}
                  >
                    <div className="p-1 flex-1 flex flex-col mb-2">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="flex flex-col">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight line-clamp-2 uppercase leading-none">{plan.name}</h4>
                          <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mt-1">
                            {new Date(plan.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 -mr-1.5 -mt-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/plans/${plan.id}`);
                            }}
                            className="p-1.5 text-slate-400 transition-colors hover:text-primary hover:bg-primary/10 rounded-lg"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlanToDelete(plan.id);
                            }}
                            className="p-1.5 text-slate-400 transition-colors hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-auto space-y-3">
                        <div className="flex justify-between items-end gap-2">
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black uppercase tracking-widest text-slate-400">Yield / Target</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-sm font-black text-emerald-500 leading-none">
                                ₹{plan.accounts.reduce((acc, a) => acc + a.balance, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">
                                / ₹{plan.expenses.reduce((acc, e) => acc + e.amount, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                          <div
                            className="absolute h-full bg-primary rounded-full transition-all duration-1000"
                            style={{
                              width: `${Math.min(100, Math.max(0, (plan.accounts.reduce((acc, a) => acc + a.balance, 0) / (plan.expenses.reduce((acc, e) => acc + e.amount, 0) || 1)) * 100))}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="px-3 py-2 border-t border-slate-50 dark:border-white/5 bg-slate-50 dark:bg-slate-800/20 flex flex-wrap gap-2">
                      <span className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 text-[8px] font-black uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-900">
                        {plan.accounts.length} Nodes
                      </span>
                      <span className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 text-[8px] font-black uppercase tracking-widest text-slate-500 bg-white dark:bg-slate-900">
                        {plan.expenses.length} Vectors
                      </span>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-primary/50 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!planToDelete}
        onCancel={() => setPlanToDelete(null)}
        onConfirm={() => {
          if (planToDelete) {
            dispatch(deletePlanAction(planToDelete));
            setPlanToDelete(null);
          }
        }}
        title="Delete Workspace?"
        message="This will completely destroy this simulated plan and wipe all nodes and vectors within it."
        confirmText="Confirm Deletion"
      />
    </PageContainer>
  );
}
