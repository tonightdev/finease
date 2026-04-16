"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { AppDispatch } from "@/store";
import {
  updateSimulationAction, fetchSimulations
} from "@/store/slices/simulationsSlice";
import { SimAccount, SimExpense } from "@repo/types";
import { Plus, Trash2, Wallet, Receipt, TrendingUp, CheckCircle2, RefreshCw, Loader2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

export default function TacticalSimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const planId = resolvedParams.id;
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { items, loading } = useSelector((state: RootState) => state.simulations);
  const plan = items.find(p => p.id === planId);

  const [planName, setPlanName] = useState(plan?.name || "");
  const [newAccName, setNewAccName] = useState("");
  const [newAccBalance, setNewAccBalance] = useState("");

  const [newExpName, setNewExpName] = useState("");
  const [newExpAmount, setNewExpAmount] = useState("");
  const [newExpAccount, setNewExpAccount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Editing state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editNodeForm, setEditNodeForm] = useState({ name: "", balance: "" });
  const [editingVectorId, setEditingVectorId] = useState<string | null>(null);
  const [editVectorForm, setEditVectorForm] = useState({ name: "", amount: "", accountId: "" });

  useEffect(() => {
    dispatch(fetchSimulations());
  }, [dispatch]);

  useEffect(() => {
    if (!plan && typeof window !== "undefined" && !loading) {
      router.push("/plans");
    }
  }, [plan, router, loading]);

  useEffect(() => {
    if (plan) setPlanName(plan.name);
  }, [plan]);

  if (loading && !plan) {
    return (
      <PageContainer>
        <div className="space-y-3 mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!plan) return null;

  const handleSaveName = async () => {
    const newName = planName.trim();
    if (!newName) {
      toast.error("Plan name cannot be empty");
      setPlanName(plan.name);
      return;
    }
    if (newName !== plan.name) {
      setIsProcessing(true);
      try {
        await dispatch(updateSimulationAction({ id: planId, data: { name: newName } })).unwrap();
        toast.success("Renamed simulation");
      } catch {
        toast.error("Failed to rename simulation");
        setPlanName(plan.name);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleAddAccount = async () => {
    if (!newAccName || !newAccBalance) return;
    setIsProcessing(true);
    try {
      const account: SimAccount = {
        id: Math.random().toString(36).substring(7),
        name: newAccName,
        balance: parseFloat(newAccBalance)
      };
      await dispatch(updateSimulationAction({ id: planId, data: { accounts: [...plan.accounts, account] } })).unwrap();
      setNewAccName("");
      setNewAccBalance("");
      toast.success("Liquidity node added");
    } catch {
      toast.error("Failed to add node");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateNode = async (id: string) => {
    if (!editNodeForm.name || !editNodeForm.balance) return;
    setIsProcessing(true);
    try {
      const updatedAccounts = plan!.accounts.map(a =>
        a.id === id ? { ...a, name: editNodeForm.name, balance: parseFloat(editNodeForm.balance) } : a
      );
      await dispatch(updateSimulationAction({ id: planId, data: { accounts: updatedAccounts } })).unwrap();
      setEditingNodeId(null);
      toast.success("Node configuration updated");
    } catch {
      toast.error("Failed to update node");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateVector = async (id: string) => {
    if (!editVectorForm.name || !editVectorForm.amount || !editVectorForm.accountId) return;
    setIsProcessing(true);
    try {
      const updatedExpenses = plan!.expenses.map(e =>
        e.id === id ? { ...e, name: editVectorForm.name, amount: parseFloat(editVectorForm.amount), accountId: editVectorForm.accountId } : e
      );
      await dispatch(updateSimulationAction({ id: planId, data: { expenses: updatedExpenses } })).unwrap();
      setEditingVectorId(null);
      toast.success("Vector parameters updated");
    } catch {
      toast.error("Failed to update vector");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpName || !newExpAmount || !newExpAccount) return;
    setIsProcessing(true);
    try {
      const expense: SimExpense = {
        id: Math.random().toString(36).substring(7),
        name: newExpName,
        amount: parseFloat(newExpAmount),
        accountId: newExpAccount,
        isPaid: false
      };
      await dispatch(updateSimulationAction({ id: planId, data: { expenses: [...plan.expenses, expense] } })).unwrap();
      setNewExpName("");
      setNewExpAmount("");
      setNewExpAccount("");
      toast.success("Expense vector added");
    } catch {
      toast.error("Failed to add vector");
    } finally {
      setIsProcessing(false);
    }
  };

  const totalBalance = plan.accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = plan.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingLiquidity = totalBalance - totalExpenses;

  // Compute stats per account
  const accountStats = plan.accounts.map(acc => {
    const accExpenses = plan.expenses.filter(e => e.accountId === acc.id);
    const spent = accExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = acc.balance - spent;
    const pct = acc.balance > 0 ? Math.min(100, Math.max(0, (spent / acc.balance) * 100)) : 100;
    return { ...acc, spent, remaining, pct };
  });

  return (
    <PageContainer>
      <PageHeader
        backHref="/plans"
        backLabel="Back to Directory"
        title={
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            onBlur={handleSaveName}
            className="bg-transparent text-[15px] md:text-lg font-black tracking-tight border-none outline-none w-auto max-w-[240px] shrink truncate focus:ring-0 p-0"
          />
        }
        subtitle=""
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto h-11 sm:h-auto">
            {plan.status === "completed" && (
              <span className="shrink-0 px-2.5 py-1 bg-slate-100 dark:bg-white/10 text-slate-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200 dark:border-white/10">
                Completed
              </span>
            )}
            <Button
              size="sm"
              variant={plan.status === "completed" ? "outline" : "primary"}
              disabled={isProcessing}
              onClick={async () => {
                setIsProcessing(true);
                try {
                  const newStatus: "ongoing" | "completed" = plan.status === "completed" ? "ongoing" : "completed";
                  await dispatch(updateSimulationAction({ id: planId, data: { status: newStatus } })).unwrap();
                  toast.success(newStatus === "completed" ? "Simulation marked as completed" : "Simulation reopened");
                } catch {
                  toast.error("Failed to update simulation state");
                } finally {
                  setIsProcessing(false);
                }
              }}
              className="flex-1 sm:flex-initial shrink-0 h-full sm:h-8 text-[9px] font-black uppercase tracking-widest px-4 shadow-sm"
              leftIcon={isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : (plan.status === "completed" ? <RefreshCw className="size-3.5" /> : <CheckCircle2 className="size-3.5" />)}
            >
              {isProcessing ? "Processing..." : (plan.status === "completed" ? "Reopen Simulation" : "Mark as Completed")}
            </Button>
          </div>
        }
        className="mb-1"
      />

      <div className="space-y-6 sm:space-y-4 mt-2">
        {/* Top Section: Flow Visualizer */}
        <div className={`pt-2 px-3 pb-3 sm:p-5 sm:border sm:bg-white sm:dark:bg-slate-900 border-none bg-transparent shadow-none sm:shadow-sm sm:rounded-[2rem] rounded-none -mx-2 sm:mx-0 w-auto sm:w-full space-y-4 border-t-4 ${plan.status === 'completed' ? 'sm:border-t-slate-400' : 'sm:border-t-emerald-500'} ${plan.status === 'completed' ? 'opacity-90' : ''}`}>
          <div className="flex items-center gap-2.5 py-1 mb-2 border-b border-slate-100 dark:border-white/5 sm:border-none">
            <TrendingUp className="size-5 text-emerald-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Flow Visualizer</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Total Liquidity</p>
              <p className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-300">₹{totalBalance.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 mb-1">Net Flow</p>
              <p className={`text-sm font-black font-mono ${remainingLiquidity >= 0 ? "text-slate-700 dark:text-white" : "text-rose-500"}`}>
                ₹{remainingLiquidity.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">Burn Rate</p>
              <p className="text-sm font-black font-mono text-rose-700 dark:text-rose-300">₹{totalExpenses.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-primary mb-1">Nodes Active</p>
              <p className="text-sm font-black font-mono text-primary">{plan.accounts.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accountStats.map(stat => (
              <div key={stat.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider">{stat.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Spent: ₹{stat.spent.toLocaleString()}
                    </p>
                  </div>
                  <p className={`text-[11px] font-black font-mono ${stat.remaining >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {stat.remaining >= 0 ? 'Balance' : 'Deficit'}: ₹{Math.abs(stat.remaining).toLocaleString()}
                  </p>
                </div>

                <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, 100 - stat.pct))}%` }}
                    className={`absolute top-0 bottom-0 left-0 ${stat.remaining >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.pct}%` }}
                    className="absolute top-0 bottom-0 right-0 bg-rose-400/50"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Left Column: Accounts */}
          <div className="lg:col-span-6 space-y-4">
            <div className="pt-2 px-3 pb-3 sm:p-5 sm:border sm:bg-white sm:dark:bg-slate-900 border-none bg-transparent shadow-none sm:shadow-sm sm:rounded-[2rem] rounded-none -mx-2 sm:mx-0 w-auto sm:w-full space-y-4">
              <div className="flex items-center gap-2.5 py-1 mb-2 border-b border-slate-100 dark:border-white/5 sm:border-none">
                <Wallet className="size-5 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Nodes (Liquidity)</h3>
              </div>

              <div className="space-y-3 mb-2">
                <AnimatePresence>
                  {plan.accounts.map(acc => (
                    <motion.div
                      layout
                      key={acc.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-white/5 shadow-sm"
                    >
                      {editingNodeId === acc.id ? (
                        <div className="space-y-2">
                          <input
                            autoFocus
                            type="text"
                            value={editNodeForm.name}
                            onChange={e => setEditNodeForm({ ...editNodeForm, name: e.target.value })}
                            className="w-full text-[10px] font-black p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none"
                          />
                          <input
                            type="number"
                            value={editNodeForm.balance}
                            onChange={e => setEditNodeForm({ ...editNodeForm, balance: e.target.value })}
                            className="w-full text-[10px] font-black p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none"
                          />
                          <div className="flex gap-1 pt-1">
                            <Button size="sm" onClick={() => handleUpdateNode(acc.id)} className="h-7 text-[8px] flex-1">Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingNodeId(null)} className="h-7 text-[8px] flex-1">Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-black uppercase tracking-wider truncate">{acc.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 font-mono">₹{acc.balance.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingNodeId(acc.id);
                                setEditNodeForm({ name: acc.name, balance: acc.balance.toString() });
                              }}
                              className="p-2 text-slate-400 hover:text-primary bg-slate-100 dark:bg-white/10 rounded-xl transition-colors"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              onClick={async () => {
                                setIsProcessing(true);
                                try {
                                  await dispatch(updateSimulationAction({
                                    id: planId,
                                    data: {
                                      accounts: plan.accounts.filter(a => a.id !== acc.id),
                                      expenses: plan.expenses.map(e => e.accountId === acc.id ? { ...e, accountId: '' } : e)
                                    }
                                  })).unwrap();
                                  toast.success("Node removed");
                                } catch {
                                  toast.error("Failed to remove node");
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                              disabled={isProcessing}
                              className="p-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-colors rounded-xl disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {plan.accounts.length === 0 && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center py-4">No accounts listed</p>
                )}
              </div>

              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                <input
                  type="text"
                  placeholder="Node Name (e.g. Savings)"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  className="w-full text-[10px] font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-primary"
                />
                <input
                  type="number"
                  placeholder="Balance Amount"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                  className="w-full text-[10px] font-bold font-mono p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-primary"
                />
                <Button onClick={handleAddAccount} className="w-full mt-2 font-black text-[10px] uppercase tracking-wider h-9" disabled={!newAccName || !newAccBalance || isProcessing}>
                  {isProcessing ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Plus className="size-3.5 mr-1" />}
                  {isProcessing ? "Adding..." : "Add Node"}
                </Button>
              </div>
            </div>
          </div>

          {/* Center Column: Expenses */}
          <div className="lg:col-span-6 space-y-4">
            <div className="pt-2 px-3 pb-3 sm:p-5 sm:border sm:bg-white sm:dark:bg-slate-900 border-none bg-transparent shadow-none sm:shadow-sm sm:rounded-[2rem] rounded-none -mx-2 sm:mx-0 w-auto sm:w-full space-y-4 h-full">
              <div className="flex items-center gap-2.5 py-1 mb-2 border-b border-slate-100 dark:border-white/5 sm:border-none">
                <Receipt className="size-5 text-rose-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Vectors (Expenses)</h3>
              </div>

              <div className="space-y-3 mb-2">
                <AnimatePresence>
                  {plan.expenses.map(exp => {
                    const linkedAcc = plan.accounts.find(a => a.id === exp.accountId);
                    return (
                      <motion.div
                        layout
                        key={exp.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-white/5 shadow-sm"
                      >
                        {editingVectorId === exp.id ? (
                          <div className="space-y-2">
                            <input
                              autoFocus
                              type="text"
                              value={editVectorForm.name}
                              onChange={e => setEditVectorForm({ ...editVectorForm, name: e.target.value })}
                              className="w-full text-[10px] font-black p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                value={editVectorForm.amount}
                                onChange={e => setEditVectorForm({ ...editVectorForm, amount: e.target.value })}
                                className="w-full text-[10px] font-black p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none"
                              />
                              <Select
                                value={editVectorForm.accountId}
                                onValueChange={id => setEditVectorForm({ ...editVectorForm, accountId: id })}
                              >
                                <SelectTrigger className="h-8 text-[9px] font-black bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10">
                                  <SelectValue placeholder="Node..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10">
                                  {plan.accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id} className="text-[10px]">{acc.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex gap-1 pt-1">
                              <Button size="sm" onClick={() => handleUpdateVector(exp.id)} className="h-7 text-[8px] flex-1">Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingVectorId(null)} className="h-7 text-[8px] flex-1">Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-black uppercase tracking-wider truncate">{exp.name}</p>
                              <div className="flex gap-2 items-center mt-0.5">
                                <span className="text-[10px] font-bold text-rose-500 font-mono">₹{exp.amount.toLocaleString()}</span>
                                <span className="text-[8px] bg-slate-100 dark:bg-slate-800/80 px-1.5 rounded text-slate-500 font-black uppercase tracking-widest truncate max-w-[80px]">
                                  {linkedAcc?.name || "Unknown"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingVectorId(exp.id);
                                  setEditVectorForm({ name: exp.name, amount: exp.amount.toString(), accountId: exp.accountId });
                                }}
                                className="p-2 text-slate-400 hover:text-primary bg-slate-100 dark:bg-white/10 rounded-xl transition-colors"
                              >
                                <Edit2 className="size-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  setIsProcessing(true);
                                  try {
                                    await dispatch(updateSimulationAction({ id: planId, data: { expenses: plan.expenses.filter(e => e.id !== exp.id) } })).unwrap();
                                    toast.success("Vector removed");
                                  } catch {
                                    toast.error("Failed to remove vector");
                                  } finally {
                                    setIsProcessing(false);
                                  }
                                }}
                                disabled={isProcessing}
                                className="p-2 text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-colors rounded-xl disabled:opacity-50"
                              >
                                {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {plan.expenses.length === 0 && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center py-4">No expenses listed</p>
                )}
              </div>

              <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                <input
                  type="text"
                  placeholder="Vector Name (e.g. Flight Ticket)"
                  value={newExpName}
                  onChange={(e) => setNewExpName(e.target.value)}
                  className="w-full text-[10px] font-bold p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-rose-500"
                />
                <input
                  type="number"
                  placeholder="Estimated Amount"
                  value={newExpAmount}
                  onChange={(e) => setNewExpAmount(e.target.value)}
                  className="w-full text-[10px] font-bold font-mono p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 outline-none focus:border-rose-500"
                />
                <Select
                  value={newExpAccount}
                  onValueChange={setNewExpAccount}
                >
                  <SelectTrigger className="w-full text-[10px] font-bold h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-xl">
                    <SelectValue placeholder="Select Node Config..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 rounded-2xl">
                    {plan.accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id} className="text-[10px]">
                        {acc.name} (₹{acc.balance.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddExpense} variant="outline" className="w-full mt-2 font-black text-[10px] uppercase tracking-wider h-9 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white" disabled={!newExpName || !newExpAmount || !newExpAccount || isProcessing}>
                  {isProcessing ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Plus className="size-3.5 mr-1" />}
                  {isProcessing ? "Adding..." : "Add Vector"}
                </Button>
              </div>
            </div>
          </div>


        </div>
      </div>
    </PageContainer>
  );
}
