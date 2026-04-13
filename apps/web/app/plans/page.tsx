"use client";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { createPlan, deletePlan, ShortTermPlan } from "@/store/slices/plansSlice";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Trash2, Calendar, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function PlansDirectoryPage() {
  const plans = useSelector((state: RootState) => state.plans.items);
  const dispatch = useDispatch();
  const router = useRouter();

  const handleCreatePlan = () => {
    const newId = Math.random().toString(36).substring(7);
    const newPlan: ShortTermPlan = {
      id: newId,
      name: `Plan ${plans.length + 1}`,
      createdAt: new Date().toISOString(),
      accounts: [],
      expenses: []
    };
    dispatch(createPlan(newPlan));
    router.push(`/plans/${newId}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Short Term Plans"
        subtitle="Simulated architectural space for events and micro-budgets"
        actions={
          <Button
            onClick={handleCreatePlan}
            className="gap-2 shrink-0 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            <Plus className="size-4" /> Initialize Plan
          </Button>
        }
      />

      <div className="mt-8 space-y-4">
        {plans.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 mx-4 sm:mx-0">
            <div className="size-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <FileText className="size-8" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-1">No active plans</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto mb-6">Create your first short term plan to mock accounts and expenses.</p>
            <Button onClick={handleCreatePlan} variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest border-primary text-primary hover:bg-primary hover:text-white">
              Initialize your first plan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mx-4 sm:mx-0">
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
                    className="group cursor-pointer hover:border-primary/50 transition-all shadow-none bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 overflow-hidden relative flex flex-col h-full min-h-[160px]"
                    onClick={() => router.push(`/plans/${plan.id}`)}
                  >
                    <div className="p-5 flex-1 space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight line-clamp-2 leading-snug">{plan.name}</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(deletePlan(plan.id));
                          }}
                          className="p-1.5 -mr-1.5 -mt-1.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-500 hover:bg-rose-500/10 rounded-lg shrink-0"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                        <Calendar className="size-3" />
                        <span>{new Date(plan.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {plan.accounts.length} Nodes
                      </div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        {plan.expenses.length} Vectors
                      </div>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
