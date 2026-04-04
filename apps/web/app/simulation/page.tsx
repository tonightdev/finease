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
  Clock,
  Zap
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
  const [isSwitching, setIsSwitching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mobileTab, setMobileTab] = useState<"matrix" | "controls">("matrix");
  const [sortBy, setSortBy] = useState<"type" | "amount" | "none">("none");

  // Helper for protocol colors
  const getProtocolColor = (parentType: string) => {
    switch (parentType?.toLowerCase()) {
      case 'needs': return 'text-amber-500';
      case 'wants': return 'text-rose-500';
      case 'savings': return 'text-indigo-500';
      case 'income': return 'text-emerald-500';
      default: return 'text-slate-400';
    }
  };

  const sortedEntries = useMemo(() => {
    const list = [...entries];
    if (sortBy === "type") {
      return list.sort((a, b) => a.parentType.localeCompare(b.parentType));
    }
    if (sortBy === "amount") {
      return list.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
    }
    return list;
  }, [entries, sortBy]);

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
    setIsSwitching(true);
    dispatch(setSimulationBasis(newBasis));
    toast.success(`Switched to ${newBasis} view`);
    setTimeout(() => setIsSwitching(false), 400);
  };

  const handleSaveProtocol = async () => {
    if (!isProtocolValid) {
      toast.error("Protocol must total exactly 100% before saving.");
      return;
    }
    if (!isProtocolDirty) {
      toast.success("Protocol is already finalized and up to date.");
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

    const accountFlows: Record<string, { name: string, netFlow: number, income: number, outflow: number }> = {};

    entries.forEach(entry => {
      let amt = parseFloat(entry.amount) || 0;

      // Dynamic Scaling
      if (current?.basis === "yearly" && (entry.isMonthly ?? true)) {
        amt *= 12;
      } else if (current?.basis === "monthly" && !(entry.isMonthly ?? true)) {
        amt /= 12;
      }

      if (!accountFlows[entry.accountId]) {
        accountFlows[entry.accountId] = { name: entry.accountName, netFlow: 0, income: 0, outflow: 0 };
      }

      const flow = accountFlows[entry.accountId];
      if (flow) {
        if (entry.type === "income") {
          income += amt;
          flow.netFlow += amt;
          flow.income += amt;
        } else {
          flow.netFlow -= amt;
          flow.outflow += amt;
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
      suggestions.push("CRITICAL: Zero income injection detected. Your strategy architecture cannot sustain these outflows without an active income vector.");
      efficiency = 0;
    } else {
      // AI-Logic: Needs Analysis
      if (needsPct > protocol.needs) {
        const excess = needsTotal - (income * (protocol.needs / 100));
        suggestions.push(`High Fixed Costs: Needs are ${needsPct.toFixed(1)}% of income (Target: ${protocol.needs}%). Consider redirecting ${formatCurrency(excess)} to Savings to achieve protocol alignment.`);
        efficiency -= (needsPct - protocol.needs);
      }

      // AI-Logic: Wants Analysis
      if (wantsPct > protocol.wants) {
        const luxuryExcess = wantsTotal - (income * (protocol.wants / 100));
        suggestions.push(`Lifestyle Inflation: Wants are currently consuming ${formatCurrency(luxuryExcess)} more than your ${protocol.wants}% protocol allowance.`);
        efficiency -= (wantsPct - protocol.wants);
      }

      // AI-Logic: Savings Velocity
      if (savingsPct < protocol.savings) {
        const gap = (income * (protocol.savings / 100)) - savingsTotal;
        suggestions.push(`Savings Deficit: To hit your ${protocol.savings}% goal, you need to increase your savings vector by ${formatCurrency(gap)} per ${current?.basis === 'yearly' ? 'year' : 'month'}.`);
        efficiency -= (protocol.savings - savingsPct);
      }

      if (surplus < 0) {
        suggestions.unshift(`ALARM: Simulated Deficit of ${formatCurrency(Math.abs(surplus))}. Your current lifestyle/overhead vectors are mathematically unsustainable.`);
        efficiency = Math.max(0, efficiency - 40);
      } else if (surplus > 0 && efficiency > 90) {
        suggestions.push("Optimal Configuration: Your current vectors and protocol are perfectly aligned. You are maximizing capital efficiency.");
      }
    }

    const activeAccounts = Object.entries(accountFlows).map(([id, data]) => ({
      id,
      name: data.name,
      netFlow: data.netFlow,
      income: data.income,
      outflow: data.outflow
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
      suggestions: suggestions.slice(0, 4), // Keep it concise
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
          <div className="flex flex-col lg:flex-row gap-8">
            <Skeleton className="h-[600px] flex-1" />
            <Skeleton className="h-[600px] flex-[2]" />
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
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
              <button
                onClick={() => handleBasisToggle("monthly")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${(current?.basis || "monthly") === "monthly" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                <Clock className="size-3" /> Monthly
              </button>
              <button
                onClick={() => handleBasisToggle("yearly")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${current?.basis === "yearly" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                <Calendar className="size-3" /> Yearly
              </button>
            </div>

            <div className="sm:hidden flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
              <button
                onClick={() => handleBasisToggle("monthly")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${(current?.basis || "monthly") === "monthly" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500"}`}
              >
                <Clock className="size-3" /> Monthly
              </button>
              <button
                onClick={() => handleBasisToggle("yearly")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${current?.basis === "yearly" ? "bg-white dark:bg-slate-800 text-primary shadow-sm" : "text-slate-500"}`}
              >
                <Calendar className="size-3" /> Yearly
              </button>
            </div>

            <div className="xl:hidden flex bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-sm sm:w-[240px]">
              <button
                onClick={() => setMobileTab('matrix')}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${mobileTab === 'matrix' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Matrix
              </button>
              <button
                onClick={() => setMobileTab('controls')}
                className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${mobileTab === 'controls' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Editor
              </button>
            </div>
          </div>
        }
      />



      <div className="flex flex-col xl:flex-row gap-4 xl:gap-8 items-start">
        <div className={`xl:w-[380px] shrink-0 space-y-6 w-full min-w-0 ${mobileTab === 'controls' ? 'block' : 'hidden xl:block'}`}>
          <Card className="p-4 space-y-5 border-slate-100 dark:border-white/5 shadow-none w-full">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Vector Injection</h3>
                <p className="text-[10px] font-bold text-slate-400">Add conceptual flows</p>
              </div>
            </div>

            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-white/5">
              <button
                onClick={() => setNewEntry({ ...newEntry, type: "income", categoryId: "" })}
                className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${newEntry.type === "income"
                  ? "bg-white dark:bg-emerald-500 text-emerald-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
              >
                Inflow
              </button>
              <button
                onClick={() => setNewEntry({ ...newEntry, type: "outflow", categoryId: "" })}
                className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${newEntry.type === "outflow"
                  ? "bg-white dark:bg-rose-500 text-rose-600 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
                  <div className="absolute right-1 top-1 bottom-1 flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-white/5">
                    <button
                      onClick={() => setNewEntry({ ...newEntry, isMonthly: true })}
                      className={`px-2 py-1 text-[8px] font-black uppercase rounded-xl transition-all ${newEntry.isMonthly ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500"}`}
                    >MO</button>
                    <button
                      onClick={() => setNewEntry({ ...newEntry, isMonthly: false })}
                      className={`px-2 py-1 text-[8px] font-black uppercase rounded-xl transition-all ${!newEntry.isMonthly ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500"}`}
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

              <div className="flex flex-row gap-3">
                <div className="flex-1 space-y-1.5 min-w-0">
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
                <div className="flex-1 space-y-1.5 min-w-0">
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
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Traction Matrix</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSortBy(sortBy === 'type' ? 'none' : 'type')}
                      className={`text-[8px] font-black uppercase px-2 py-1 rounded-xl transition-all ${sortBy === 'type' ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >Type</button>
                  </div>
                </div>
                <div className="max-h-[320px] overflow-y-auto pr-1 space-y-2 pb-2 no-scrollbar">
                  <AnimatePresence mode="popLayout">
                    {sortedEntries.map(entry => (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 shadow-sm group/item"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-[11px] font-black text-slate-900 dark:text-white truncate">{entry.description}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest truncate ${getProtocolColor(entry.parentType)}`}>
                            {entry.categoryName} <span className="opacity-30">/</span> {entry.accountName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <div className="text-right mr-3">
                            <div className={`text-[11px] font-mono font-black ${entry.type === 'income' ? 'text-emerald-500' : getProtocolColor(entry.parentType)}`}>
                              {entry.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(entry.amount) || 0)}
                            </div>
                            <div className="text-[8px] font-black uppercase tracking-tighter text-slate-400 opacity-70">
                              {entry.isMonthly ?? true ? "Monthly" : "Yearly"} Flow
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-100 transition-opacity">
                            <button onClick={() => handleEditEntry(entry)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                              <Edit2 className="size-3.5" />
                            </button>
                            <button onClick={() => handleRemoveEntry(entry.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-5 bg-slate-900 border-0 text-white w-full">
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
              <div className="flex items-center gap-2">
                <div className={`text-xs font-black ${isProtocolValid ? "text-emerald-500" : "text-rose-500"}`}>
                  {protocol.needs + protocol.wants + protocol.savings}%
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {(['needs', 'wants', 'savings'] as const).map((key) => {
                const item = {
                  needs: { label: 'Needs', theme: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                  wants: { label: 'Wants', theme: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
                  savings: { label: 'Savings', theme: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' }
                }[key];
                const target = protocol[key];
                return (
                  <div key={key} className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${item.theme}`}>{item.label} Target</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={target}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const val = parseInt(e.target.value) || 0;
                            handleProtocolChange(key, val);
                          }}
                          className={`w-16 h-8 text-[11px] font-black ${item.bg} ${item.border} ${item.theme} text-center rounded-xl border-2 transition-all focus:ring-2 focus:ring-white/20`}
                        />
                        <span className={`text-[10px] font-black ${item.theme} opacity-60`}>%</span>
                      </div>
                    </div>
                    <div className="px-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={target}
                        onChange={(e) => handleProtocolChange(key, parseInt(e.target.value))}
                        className={`w-full h-1.5 ${item.bg} rounded-xl appearance-none cursor-pointer accent-white`}
                      />
                    </div>
                  </div>
                )
              })}

              {!isProtocolValid && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-400 leading-tight">
                  <div className="size-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="size-4" />
                  </div>
                  <span>Protocol distribution must total 100% current: {protocol.needs + protocol.wants + protocol.savings}%</span>
                </div>
              )}

              <Button
                variant="primary"
                onClick={handleSaveProtocol}
                isLoading={simLoading}
                className={`w-full h-12 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] mt-2 gap-3 shadow-2xl transition-all border-0 ${isProtocolDirty ? 'bg-white text-slate-900 shadow-primary/40 hover:bg-slate-50' : 'bg-slate-800/20 text-slate-400 shadow-none'} hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100`}
              >
                <Save className="size-4 text-primary" /> Finalize Protocol
              </Button>
            </div>
          </Card>
        </div>

        <div className={`flex-1 w-full min-w-0 ${mobileTab === 'matrix' ? 'block' : 'hidden xl:block'}`}>
          <Card className="h-full min-h-[400px] sm:min-h-[600px] flex flex-col p-4 sm:p-5 border-slate-100 dark:border-white/5 w-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-white/5 shrink-0">
                  <TrendingUp className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Live Strategy Matrix</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time analysis hub</p>
                </div>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest shrink-0 hidden sm:block">
                Live Signal
              </div>
            </div>

            {isSwitching ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="size-24 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center border border-dashed border-slate-200 dark:border-white/10 relative">
                  <Activity className="size-10 text-primary/40" />
                </div>
                <div className="max-w-sm space-y-2">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Syncing Timeline...</h4>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400">Processing vector re-hydration.</p>
                </div>
              </div>
            ) : !isProtocolValid ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="size-24 rounded-xl bg-rose-500/10 flex items-center justify-center border border-dashed border-rose-500/30">
                  <AlertCircle className="size-10 text-rose-500" />
                </div>
                <div className="max-w-sm space-y-2">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Protocol Invalid ({protocol.needs + protocol.wants + protocol.savings}%)</h4>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400">Strategy allocations must total exactly 100%.</p>
                </div>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="size-24 rounded-xl bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center border border-dashed border-slate-200 dark:border-white/10 relative">
                  <Activity className="size-10 text-slate-300 dark:text-slate-600" />
                </div>
                <div className="max-w-sm space-y-2">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Awaiting Injection</h4>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400">Add Income and Outflow vectors to start building your simulation model.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
                {/* 1. Primary Metrics Grid (2x2) */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-8">
                  <div className={`p-3 sm:p-4 rounded-xl border transition-all flex flex-col justify-between min-h-[90px] ${simulationMetrics.surplus < 0 ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-200/50 dark:border-rose-500/10' : 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200/50 dark:border-emerald-500/10'}`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Net {current?.basis === "yearly" ? "Annual" : "Monthly"} Flow</span>
                    <div className="mt-auto">
                      <div className={`text-lg sm:text-xl font-black tracking-tighter truncate w-full ${simulationMetrics.surplus < 0 ? 'text-rose-500' : 'text-emerald-500'}`} title={formatCurrency(simulationMetrics.surplus)}>{formatCurrency(simulationMetrics.surplus)}</div>
                      <div className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{simulationMetrics.surplus >= 0 ? 'Surplus Projection' : 'Deficit Detected'}</div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-white/5 flex flex-col justify-between min-h-[100px]">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Flow Magnitude</span>
                    <div className="space-y-3 mt-auto">
                      <div className="text-xs sm:text-sm font-mono font-black text-emerald-500 truncate sm:max-w-max" title={formatCurrency(simulationMetrics.income)}>{formatCurrency(simulationMetrics.income)}</div>
                      <div className="text-xs sm:text-sm font-mono font-black text-rose-500 truncate sm:max-w-max" title={formatCurrency(simulationMetrics.totalOutflows)}>{formatCurrency(simulationMetrics.totalOutflows)}</div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-white/5 relative overflow-hidden group flex flex-col justify-between min-h-[100px]">
                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Efficiency Score</span>
                      <div className="mt-auto">
                        <div className="flex items-baseline justify-start w-full">
                          <div className="text-lg sm:text-xl font-black text-primary tracking-tighter truncate mr-2" title={simulationMetrics.efficiency.toString()}>{simulationMetrics.efficiency}</div>
                          <div className="text-[10px] font-black text-slate-400 tracking-widest">/ 100</div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mt-2">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${simulationMetrics.efficiency}%` }} className="h-full bg-primary shadow-[0_0_12px_rgba(19,91,236,0.5)]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-white/5 flex flex-col justify-between min-h-[100px]">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Surplus Velocity</span>
                    <div className="mt-auto">
                      <div className="text-lg sm:text-xl font-black text-emerald-500 tracking-tighter truncate w-full sm:w-auto" title={`+${((simulationMetrics.surplus / (simulationMetrics.income || 1)) * 100).toFixed(1)}%`}>+{((simulationMetrics.surplus / (simulationMetrics.income || 1)) * 100).toFixed(1)}%</div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mt-2">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (simulationMetrics.surplus / (simulationMetrics.income || 1)) * 100)}%` }} className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Horizon Composition Matrix */}
                <div className="space-y-6 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3">
                      <Activity className="size-4 text-primary" /> Horizon Composition Matrix
                    </h4>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="p-4 rounded-xl bg-slate-50/30 dark:bg-slate-800/10 border border-slate-100 dark:border-white/5 space-y-8">
                      <div className="space-y-4 mb-3">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Allocation Flow</span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">Needs Focus</span>
                        </div>
                        <div className="flex h-12 w-full rounded-xl overflow-hidden shadow-inner bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 p-1">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${simulationMetrics.needsPct}%` }}
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 relative group shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                          >
                            <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center pointer-events-none opacity-40 group-hover:hidden transition-opacity">
                              <AlertCircle className="size-3 text-amber-900" />
                            </div>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-amber-900 opacity-0 group-hover:opacity-100 transition-opacity">NEEDS</span>
                          </motion.div>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${simulationMetrics.wantsPct}%` }}
                            className="h-full bg-gradient-to-r from-rose-400 to-rose-500 relative group shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                          >
                            <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center pointer-events-none opacity-40 group-hover:hidden transition-opacity">
                              <Activity className="size-3 text-rose-900" />
                            </div>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-rose-900 opacity-0 group-hover:opacity-100 transition-opacity">WANTS</span>
                          </motion.div>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(0, 100 - simulationMetrics.needsPct - simulationMetrics.wantsPct)}%` }}
                            className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 relative group shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                          >
                            <div className="absolute inset-y-0 left-0 w-8 flex items-center justify-center pointer-events-none opacity-40 group-hover:hidden transition-opacity">
                              <TrendingUp className="size-3 text-indigo-900" />
                            </div>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-indigo-900 opacity-0 group-hover:opacity-100 transition-opacity">SAVINGS</span>
                          </motion.div>
                        </div>
                        <div className="flex justify-between px-1">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Needs</span>
                            <span className="text-[11px] font-mono font-black text-amber-500">{simulationMetrics.needsPct.toFixed(1)}%</span>
                            <span className={`text-[8px] font-black uppercase ${simulationMetrics.needsPct > protocol.needs ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {simulationMetrics.needsPct > protocol.needs ? `+${(simulationMetrics.needsPct - protocol.needs).toFixed(1)}% Delta` : 'Within Protocol'}
                            </span>
                          </div>
                          <div className="flex flex-col text-center">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Wants</span>
                            <span className="text-[11px] font-mono font-black text-rose-500">{simulationMetrics.wantsPct.toFixed(1)}%</span>
                            <span className={`text-[8px] font-black uppercase ${simulationMetrics.wantsPct > protocol.wants ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {simulationMetrics.wantsPct > protocol.wants ? `+${(simulationMetrics.wantsPct - protocol.wants).toFixed(1)}% Delta` : 'Within Protocol'}
                            </span>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Savings</span>
                            <span className="text-[11px] font-mono font-black text-indigo-500">{simulationMetrics.savingsPct.toFixed(1)}%</span>
                            <span className={`text-[8px] font-black uppercase ${simulationMetrics.savingsPct >= protocol.savings ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {simulationMetrics.savingsPct >= protocol.savings ? 'Protocol Met' : `-${(protocol.savings - simulationMetrics.savingsPct).toFixed(1)}% Gap`}
                            </span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Zap className="size-3 text-amber-500" /> Stress Test
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 leading-tight">
                              If income drops by 20%, your Needs would consume <span className="text-rose-500">{((simulationMetrics.needsTotal / (simulationMetrics.income * 0.8 || 1)) * 100).toFixed(1)}%</span> of total flow.
                            </p>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                              <TrendingUp className="size-3 text-indigo-500" /> Savings Velocity
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 leading-tight">
                              At current rates, you reaching your next <span className="text-indigo-500">$100k</span> milestone in <span className="text-white">{(100000 / (simulationMetrics.savingsTotal || 1)).toFixed(1)} {current?.basis === "yearly" ? "years" : "months"}</span>.
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3">
                    <PieChart className="size-4 text-primary" /> Target vs Actual Variance
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {[
                      { id: "needs", label: "Needs", actual: simulationMetrics.needsPct, target: protocol.needs, color: "bg-amber-400" },
                      { id: "wants", label: "Wants", actual: simulationMetrics.wantsPct, target: protocol.wants, color: "bg-rose-400" },
                      { id: "savings", label: "Savings", actual: simulationMetrics.savingsPct, target: protocol.savings, color: "bg-indigo-400" },
                    ].map(stat => (
                      <div key={stat.id} className="p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/10 flex flex-col justify-between min-h-[90px]">
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${stat.color}`} />
                            <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest truncate">{stat.label}</span>
                          </div>
                          <div className="text-[8px] font-black text-slate-400 tracking-widest shrink-0">
                            {stat.actual.toFixed(0)}% <span className="opacity-50">/ {stat.target}%</span>
                          </div>
                        </div>
                        <div className="h-1 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden relative mt-auto">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, stat.actual)}%` }} className={`absolute h-full ${stat.color} shadow-[0_0_12px_rgba(var(--primary),0.3)]`} />
                          <div className="absolute h-full w-1 bg-primary/40 z-10 border-x border-white/20 shadow-[0_0_8px_rgba(var(--primary),0.5)]" style={{ left: `${stat.target}%`, transform: 'translateX(-50%)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Active Vector Flows (Consolidated) */}
                {simulationMetrics.activeAccounts.length > 0 && (
                  <div className="space-y-4 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3">
                        <Activity className="size-4 text-primary" /> Simulated Account Vectors
                      </h4>
                      <div className="text-[8px] font-black text-slate-400 tracking-widest uppercase bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200 dark:border-white/5 w-fit">Net Impact / Account</div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {simulationMetrics.activeAccounts.map(acc => (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          key={acc.id}
                          className="p-2.5 sm:p-3 border border-slate-100 dark:border-white/5 rounded-xl bg-white dark:bg-slate-800/40 shadow-sm flex flex-col justify-between min-h-[110px]"
                        >
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 truncate flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-primary shrink-0" /> {acc.name}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between p-1.5 rounded-md bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 min-w-0">
                              <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest truncate mr-1">In</span>
                              <span className="text-[9px] font-mono font-black text-emerald-500 shrink-0">+{formatCurrency(acc.income)}</span>
                            </div>
                            <div className="flex items-center justify-between p-1.5 rounded-md bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 min-w-0">
                              <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest truncate mr-1">Out</span>
                              <span className="text-[9px] font-mono font-black text-rose-500 shrink-0">-{formatCurrency(acc.outflow)}</span>
                            </div>
                            <div className="pt-1 border-t border-slate-100 dark:border-white/5 flex items-center justify-between px-0.5 mt-1 min-w-0">
                              <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest truncate mr-1">Net</span>
                              <span className={`text-[9px] font-mono font-black shrink-0 ${acc.netFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {acc.netFlow > 0 ? '+' : ''}{formatCurrency(acc.netFlow)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Strategem Signals (Bottom) */}
                <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3">
                      <Lightbulb className="size-4 text-primary" /> Strategem Signal Hub
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {simulationMetrics.suggestions.length > 0 ? (
                        simulationMetrics.suggestions.map((suggestion, i) => (
                          <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={i}
                            className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 shadow-sm min-h-[70px]"
                          >
                            <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <ArrowRight className="size-3 text-primary" />
                            </div>
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-tight">{suggestion}</p>
                          </motion.div>
                        ))
                      ) : (
                        <div className="col-span-full py-8 text-center bg-slate-50/50 dark:bg-slate-800/10 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                          <p className="text-[10px] font-bold text-slate-400 text-center">All systems optimal. No adjustments required.</p>
                        </div>
                      )}
                    </div>
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
