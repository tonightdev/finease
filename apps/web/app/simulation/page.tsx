"use client";

import { useState, useMemo, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchAccounts } from "@/store/slices/accountsSlice";
import { fetchSimulation, saveSimulation, addSimEntry, updateSimEntry, removeSimEntry, setSimulationBasis } from "@/store/slices/simulationSlice";
import { Card } from "@/components/ui/Card";
import {
  Plus,
  Target,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Trash2,
  Edit2,
  PieChart,
  Activity,
  AlertCircle,
  Save,
  Calendar,
  Clock
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
  SelectValue
} from "@/components/ui/Select";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { SimEntry, Account } from "@repo/types";

export default function SimulationPage() {
  const { user, loading: authLoading } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const categories = useSelector((state: RootState) => state.categories.items);
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const { current, loading: simLoading, lastFetched } = useSelector((state: RootState) => state.simulation);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchAccounts());
    dispatch(fetchSimulation());
  }, [dispatch]);

  // Local state for sandbox simulation
  const [entries, setEntries] = useState<SimEntry[]>([]);
  const [protocol, setProtocol] = useState({ needs: 50, wants: 30, savings: 20 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mobileTab, setMobileTab] = useState<"matrix" | "controls">("matrix");

  // New entry form state
  const [newEntry, setNewEntry] = useState<{
    amount: string;
    description: string;
    categoryId: string;
    type: "income" | "outflow";
    accountId: string;
    isMonthly: boolean;
  }>({
    amount: "",
    description: "",
    categoryId: "",
    type: "outflow",
    accountId: "",
    isMonthly: true
  });

  // Load persistence state locally
  useEffect(() => {
    // Wait for the simulation to finish loading from the backend
    if (simLoading || lastFetched === null) return;

    // Only auto-initialize if we haven't already or if we are stuck in an empty state while data is available
    const hasCloudData = current && (current.entries?.length > 0 || (current.userId && current.userId !== ""));
    const isSandboxEmpty = entries.length === 0;

    if (hasCloudData && (isSandboxEmpty || !isInitialized)) {
      setEntries(current.entries || []);
      setProtocol(current.protocol || { needs: 50, wants: 30, savings: 20 });
      setIsInitialized(true);
    } else if (current?.userId === "" && !isInitialized) {
      // Handle case where simulation is truly empty/new (after first fetch)
      if (user?.budgetTargets) {
        setProtocol(user.budgetTargets);
      }
      setIsInitialized(true);
    }
  }, [current, isInitialized, simLoading, user, lastFetched, entries.length]);

  const isProtocolValid = useMemo(() => {
    const { needs, wants, savings } = protocol;
    return (needs + wants + savings) === 100;
  }, [protocol]);

  const isProtocolDirty = useMemo(() => {
    if (!current?.protocol) return true; // Show enable if no current protocol
    return (
      protocol.needs !== current.protocol.needs ||
      protocol.wants !== current.protocol.wants ||
      protocol.savings !== current.protocol.savings
    );
  }, [protocol, current?.protocol]);

  // Auto-save logic removed in favor of granular entry persistence


  const handleBasisToggle = (newBasis: "monthly" | "yearly") => {
    if (newBasis === current?.basis) return;
    dispatch(setSimulationBasis(newBasis));
    // Persistence for the basis choice is handled during the next entry/protocol save
    // as per user request to keep filtering lightning-fast and local-only for now.
    toast.success(`Switched to ${newBasis} view`);
  };

  const handleSaveProtocol = async () => {
    if (!isProtocolValid) {
      toast.error("Protocol must total exactly 100% before saving.");
      return;
    }
    try {
      await dispatch(saveSimulation({
        protocol,
        entries
      })).unwrap();
      toast.success("Strategy protocol synced to cloud.");
    } catch {
      toast.error("Failed to sync strategy.");
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter(c =>
      newEntry.type === "income"
        ? (c.type === "income" || c.parentType === "income")
        : (c.type !== "income" && c.parentType !== "income")
    );
  }, [categories, newEntry.type]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((a: Account) => {
      const type = a.type?.toLowerCase() || "";
      return !['asset', 'debt', 'investment', 'card'].includes(type);
    });
  }, [accounts]);

  // Derived calculations (Real-time)
  const simulationMetrics = useMemo(() => {
    let income = 0;
    let needsTotal = 0;
    let wantsTotal = 0;
    let savingsTotal = 0;

    const accountFlows: Record<string, { name: string, netFlow: number }> = {};

    entries.forEach(entry => {
      let amt = parseFloat(entry.amount) || 0;

      // Dynamic Scaling: Normalize to the current global basis
      if (current?.basis === "yearly" && (entry.isMonthly ?? true)) {
        amt *= 12;
      } else if (current?.basis === "monthly" && !(entry.isMonthly ?? true)) {
        amt /= 12;
      }

      if (!accountFlows[entry.accountId]) {
        accountFlows[entry.accountId] = { name: entry.accountName, netFlow: 0 };
      }

      const flow = accountFlows[entry.accountId];
      if (flow) {
        if (entry.type === "income") {
          income += amt;
          flow.netFlow += amt;
        } else {
          flow.netFlow -= amt;
          if (entry.parentType === "needs") needsTotal += amt;
          else if (entry.parentType === "wants") wantsTotal += amt;
          else if (entry.parentType === "savings") savingsTotal += amt;
          else needsTotal += amt;
        }
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
      suggestions.push("CRITICAL WARNING: No income detected. Ensure you add Income vectors to balance your simulation.");
      efficiency = 0;
    } else {
      if (needsPct > protocol.needs) {
        suggestions.push(`Your essential Needs (${needsPct.toFixed(1)}%) exceed the ${protocol.needs}% target. Look for ways to lower fixed costs.`);
        efficiency -= (needsPct - protocol.needs);
      }
      if (wantsPct > protocol.wants) {
        suggestions.push(`Discretionary Wants spending (${wantsPct.toFixed(1)}%) is above the ${protocol.wants}% target. Consider cutting back to improve efficiency.`);
        efficiency -= (wantsPct - protocol.wants);
      }
      if (savingsPct < protocol.savings) {
        suggestions.push(`Your current Savings allocation (${savingsPct.toFixed(1)}%) falls short of your ${protocol.savings}% goal.`);
        efficiency -= (protocol.savings - savingsPct);
      }

      if (surplus < 0) {
        suggestions.unshift("CRITICAL WARNING: You are operating at a deficit. Your outflows exceed your income vector.");
        efficiency = Math.max(0, efficiency - 30);
      }
    }

    const activeAccounts = Object.entries(accountFlows).map(([id, data]) => ({
      id,
      name: data.name,
      netFlow: data.netFlow
    })).sort((a, b) => b.netFlow - a.netFlow);

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
      suggestions,
      efficiency: Math.max(0, Math.min(100, Math.round(efficiency))),
      activeAccounts
    };
  }, [entries, protocol, current?.basis]);

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
    const selectedAcc = accounts.find(a => a.id === newEntry.accountId);
    const selectedCat = categories.find(c => c.id === newEntry.categoryId);
    if (!selectedAcc || !selectedCat) {
      toast.error("Invalid account or classification.");
      return;
    }

    if (editingId) {
      const entryData = {
        amount: newEntry.amount,
        isMonthly: newEntry.isMonthly,
        description: newEntry.description.trim(),
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        accountId: selectedAcc.id,
        accountName: selectedAcc.name,
        parentType: selectedCat.parentType || (newEntry.type === "income" ? "income" : "needs"),
        type: newEntry.type
      };
      setEntries(prev => prev.map(e => e.id === editingId ? { ...e, ...entryData } : e));
      dispatch(updateSimEntry({ id: editingId, data: entryData }));
      setEditingId(null);
      toast.success("Vector updated.");
    } else {
      const newSimEntry: SimEntry = {
        id: Math.random().toString(36).substring(7),
        amount: newEntry.amount,
        isMonthly: newEntry.isMonthly,
        description: newEntry.description.trim(),
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        accountId: selectedAcc.id,
        accountName: selectedAcc.name,
        parentType: selectedCat.parentType || (newEntry.type === "income" ? "income" : "needs"),
        type: newEntry.type
      };
      setEntries(prev => [...prev, newSimEntry]);
      dispatch(addSimEntry(newSimEntry));
      toast.success("Vector recorded.");
    }
    setNewEntry({ amount: "", description: "", categoryId: "", accountId: "", type: "outflow", isMonthly: true });
  };

  const handleEditEntry = (entry: SimEntry) => {
    setEditingId(entry.id);
    setNewEntry({
      amount: entry.amount,
      description: entry.description,
      categoryId: entry.categoryId,
      accountId: entry.accountId || "",
      type: entry.type,
      isMonthly: entry.isMonthly ?? true
    });
    setMobileTab('controls');
  };

  const handleRemoveEntry = (id: string) => {
    setEntries(prev => prev.filter(o => o.id !== id));
    dispatch(removeSimEntry(id));
  };



  const handleProtocolChange = (key: keyof typeof protocol, value: number) => {
    setProtocol(prev => ({ ...prev, [key]: value }));
  };

  if (authLoading || (simLoading && !isInitialized)) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-[600px] lg:col-span-1" />
            <Skeleton className="h-[600px] lg:col-span-2" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Strategy Hub"
        subtitle="Standalone sandbox for real-time predictive financial modeling."
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Desktop Basis Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
              <button
                onClick={() => handleBasisToggle("monthly")}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${current?.basis === "monthly" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                <Clock className="size-3" /> Monthly
              </button>
              <button
                onClick={() => handleBasisToggle("yearly")}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${current?.basis === "yearly" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                <Calendar className="size-3" /> Yearly
              </button>
            </div>

            {/* Mobile Basis Toggle */}
            <div className="sm:hidden flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
              <button
                onClick={() => handleBasisToggle("monthly")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${current?.basis === "monthly" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500"}`}
              >
                <Clock className="size-3" /> Monthly
              </button>
              <button
                onClick={() => handleBasisToggle("yearly")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${current?.basis === "yearly" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500"}`}
              >
                <Calendar className="size-3" /> Yearly
              </button>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="xl:hidden flex bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-sm sm:w-[240px]">
              <button
                onClick={() => setMobileTab('matrix')}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${mobileTab === 'matrix' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Matrix
              </button>
              <button
                onClick={() => setMobileTab('controls')}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${mobileTab === 'controls' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Editor
              </button>
            </div>
          </div>
        }
      />



      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-8 items-start">
        <div className={`xl:col-span-4 space-y-6 w-full min-w-0 ${mobileTab === 'controls' ? 'block' : 'hidden xl:block'}`}>
          <Card className="p-4 sm:p-5 space-y-5 border-slate-100 dark:border-white/5 shadow-none w-full">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Vector Injection</h3>
                <p className="text-[10px] font-bold text-slate-400">Add conceptual flows</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setNewEntry({ ...newEntry, type: "income", categoryId: "" })}
                className={`py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${newEntry.type === "income"
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                  : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
              >
                Income
              </button>
              <button
                onClick={() => setNewEntry({ ...newEntry, type: "outflow", categoryId: "" })}
                className={`py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border ${newEntry.type === "outflow"
                  ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20"
                  : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
              >
                Outflow
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Amount</label>
                <div className="relative group">
                  <Input
                    type="number"
                    placeholder={`Enter amount...`}
                    value={newEntry.amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, amount: e.target.value })}
                    className={`font-mono h-10 text-xs font-bold pr-16 ${newEntry.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}
                  />
                  <div className="absolute right-1 top-1 bottom-1 flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-white/5">
                    <button
                      onClick={() => setNewEntry({ ...newEntry, isMonthly: true })}
                      className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all ${newEntry.isMonthly ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500"}`}
                    >MO</button>
                    <button
                      onClick={() => setNewEntry({ ...newEntry, isMonthly: false })}
                      className={`px-2 py-1 text-[8px] font-black uppercase rounded-md transition-all ${!newEntry.isMonthly ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500"}`}
                    >YR</button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Description</label>
                <Input
                  placeholder="E.g., Salary, Rent..."
                  value={newEntry.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, description: e.target.value })}
                  className="h-10 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Routing</label>
                  <Select value={newEntry.accountId} onValueChange={(val: string) => setNewEntry({ ...newEntry, accountId: val })}>
                    <SelectTrigger className="h-10 text-xs font-bold truncate">
                      <SelectValue placeholder="Account..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {filteredAccounts.map((acc: Account) => (
                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Classification</label>
                  <Select value={newEntry.categoryId} onValueChange={(val: string) => setNewEntry({ ...newEntry, categoryId: val })}>
                    <SelectTrigger className="h-10 text-xs font-bold truncate">
                      <SelectValue placeholder="Category..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {filteredCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleAddEntry}
                className={`w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] mt-2 gap-2 shadow-lg transition-all ${newEntry.type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white' : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 text-white'}`}
              >
                {editingId ? "Update" : "Inject"} {newEntry.type === 'income' ? 'Income' : 'Outflow'} <ArrowRight className="size-3.5" />
              </Button>
              {editingId && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingId(null);
                    setNewEntry({ amount: "", description: "", categoryId: "", accountId: "", type: "outflow", isMonthly: true });
                  }}
                  className="w-full h-8 text-[10px] font-bold text-slate-400 mt-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel Edit
                </Button>
              )}
            </div>

            {entries.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 relative">
                <div className="space-y-2 pb-6">
                  <AnimatePresence>
                    {entries.map(entry => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 overflow-hidden"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate">{entry.description}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-widest truncate ${entry.type === 'income' ? 'text-emerald-500' : entry.parentType === 'needs' ? 'text-amber-500' : 'text-rose-500'}`}>
                            {entry.categoryName} <span className="opacity-50">/</span> {entry.accountName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <div className="text-right mr-2">
                            <div className={`text-xs font-mono font-bold ${entry.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {entry.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(entry.amount) || 0)}
                            </div>
                            <div className="text-[8px] font-black uppercase tracking-tighter text-slate-400 opacity-70">
                              {entry.isMonthly ?? true ? "Monthly Vector" : "Yearly Vector"}
                            </div>
                          </div>
                          <button onClick={() => handleEditEntry(entry)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <Edit2 className="size-3.5" />
                          </button>
                          <button onClick={() => handleRemoveEntry(entry.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {entries.length > 4 && (
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-[#0B1120] to-transparent flex items-end justify-center pointer-events-none pb-1 rounded-b-xl px-2">
                    <span className="text-[8px] font-black uppercase text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full backdrop-blur-md">Scroll to see more</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-5 bg-slate-900 border-0 text-white w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Target className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Target Protocol</h3>
                  <p className="text-[10px] font-bold text-slate-400">Sandbox constraints</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-xs font-black ${isProtocolValid ? "text-emerald-500" : "text-rose-500 animate-pulse"}`}>
                  {protocol.needs + protocol.wants + protocol.savings}%
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { id: "needs" as const, label: "Needs", val: protocol.needs, color: "text-amber-400", bg: "bg-amber-400" },
                { id: "wants" as const, label: "Wants", val: protocol.wants, color: "text-rose-400", bg: "bg-rose-400" },
                { id: "savings" as const, label: "Savings", val: protocol.savings, color: "text-indigo-400", bg: "bg-indigo-400" },
              ].map(target => (
                <div key={target.id} className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-white/70">
                    <span className={target.color}>{target.label}</span>
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg border border-white/10 px-2 py-1 focus-within:ring-1 focus-within:ring-white/30 transition-all">
                      <input
                        type="number"
                        value={target.val}
                        onChange={(e) => handleProtocolChange(target.id, parseInt(e.target.value) || 0)}
                        className="w-8 bg-transparent text-right font-mono text-white outline-none appearance-none"
                      />
                      <span>%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={false} animate={{ width: `${target.val}%` }} className={`h-full ${target.bg} rounded-full`} />
                  </div>
                </div>
              ))}

              {!isProtocolValid && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-[9px] font-bold text-rose-300 leading-tight">
                  <AlertCircle className="size-3 shrink-0 mt-0.5" />
                  Protocol must total 100%. Adjust sliders.
                </div>
              )}

              <Button
                variant="primary"
                onClick={handleSaveProtocol}
                disabled={!isProtocolValid || !isProtocolDirty}
                isLoading={simLoading}
                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] mt-2 gap-3 shadow-2xl shadow-primary/40 transition-all border-0 bg-primary text-white hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
              >
                <Save className="size-4" /> Save Strategy
              </Button>
            </div>
          </Card>
        </div>

        <div className={`xl:col-span-8 w-full min-w-0 ${mobileTab === 'matrix' ? 'block' : 'hidden xl:block'}`}>
          <Card className="h-full min-h-[400px] sm:min-h-[600px] flex flex-col p-4 sm:p-6 border-slate-100 dark:border-white/5 w-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-white/5 shrink-0">
                  <TrendingUp className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Live Strategy Matrix</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time analysis hub</p>
                </div>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest animate-pulse shrink-0 hidden sm:block">
                Live Signal
              </div>
            </div>

            {!isProtocolValid ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="size-24 rounded-[3rem] bg-rose-500/10 flex items-center justify-center border border-dashed border-rose-500/30">
                  <AlertCircle className="size-10 text-rose-500" />
                </div>
                <div className="max-w-sm space-y-2">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Protocol Invalid ({protocol.needs + protocol.wants + protocol.savings}%)</h4>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400">Strategy allocations must total exactly 100%.</p>
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="size-24 rounded-[3rem] bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center border border-dashed border-slate-200 dark:border-white/10 relative">
                  <Activity className="size-10 text-slate-300 dark:text-slate-600 animate-pulse" />
                  <div className="absolute inset-0 rounded-[3rem] border-2 border-primary/10 animate-ping" />
                </div>
                <div className="max-w-sm space-y-2">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Awaiting Injection</h4>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400">Add Income and Outflow vectors to start building your simulation model.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className={`p-4 rounded-[1.25rem] border transition-all ${simulationMetrics.surplus < 0 ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'}`}>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Projected {current?.basis === "yearly" ? "Annual" : "Monthly"} Surplus</span>
                    <div className={`text-xl font-black mt-1 truncate ${simulationMetrics.surplus < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(simulationMetrics.surplus)}</div>
                  </div>
                  <div className="p-4 rounded-[1.25rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-all">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Efficiency Index</span>
                    <div className="flex items-end gap-1.5 mt-1">
                      <div className="text-xl font-black text-primary">{simulationMetrics.efficiency}</div>
                      <div className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-widest">/ 100</div>
                    </div>
                  </div>
                  <div className="p-4 rounded-[1.25rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                      <span>In / Out</span>
                      <span className="truncate ml-2 font-mono text-primary">{formatCurrency(simulationMetrics.income)} / {formatCurrency(simulationMetrics.totalOutflows)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><PieChart className="size-4 text-primary shrink-0" /> Categorical Adherence Structure</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: "needs", label: "Needs", actual: simulationMetrics.needsPct, target: protocol.needs, color: "bg-amber-500", textColor: "text-amber-500" },
                      { id: "wants", label: "Wants", actual: simulationMetrics.wantsPct, target: protocol.wants, color: "bg-rose-500", textColor: "text-rose-500" },
                      { id: "savings", label: "Savings", actual: simulationMetrics.savingsPct, target: protocol.savings, color: "bg-indigo-500", textColor: "text-indigo-500" },
                    ].map(stat => (
                      <div key={stat.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 min-w-0 gap-2">
                          <div className="flex items-center gap-3 shrink-0">
                            <div className={`size-2.5 rounded-full ${stat.color}`} />
                            <span className="text-xs font-black text-slate-900 dark:text-white">{stat.label}</span>
                          </div>
                          <div className={`text-sm font-black ${stat.textColor} truncate`}>{stat.actual.toFixed(1)}% <span className="text-[9px] text-slate-400 ml-1">/ {stat.target}% target</span></div>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden relative">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, stat.actual)}%` }} className={`absolute left-0 top-0 bottom-0 ${stat.color} rounded-full`} />
                          <div className="absolute h-full w-[2px] bg-slate-500/50 z-20" style={{ left: `${stat.target}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {simulationMetrics.activeAccounts.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><Activity className="size-4 text-primary shrink-0" /> Simulated Account Flows</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {simulationMetrics.activeAccounts.map(acc => (
                        <div key={acc.id} className="p-3 border border-slate-100 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between min-w-0">
                          <div className="text-xs font-black truncate pr-2 text-slate-900 dark:text-white">{acc.name}</div>
                          <div className={`text-[11px] font-mono font-bold truncate ${acc.netFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {acc.netFlow > 0 ? '+' : ''}{formatCurrency(acc.netFlow)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3"><Lightbulb className="size-5 text-primary" /> Strategem Recommendations</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {simulationMetrics.suggestions.map((suggestion, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5">
                        <ArrowRight className="size-4 text-primary shrink-0" />
                        <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-200">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
