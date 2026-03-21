"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { Card } from "@/components/ui/Card";
import { 
  Play, 
  RotateCcw, 
  Plus, 
  Target, 
  Lightbulb,
  ArrowRight,
  Zap,
  Calculator,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchSimulation, startSimulation, resetSimulation } from "@/store/slices/simulationSlice";
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

export default function SimulationPage() {
  const { user, loading: authLoading } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  
  const results = useSelector((state: RootState) => state.simulation.results);
  const loading = useSelector((state: RootState) => state.simulation.loading);
  const categories = useSelector((state: RootState) => state.categories.items);

  const [newEntry, setNewEntry] = useState<{
    amount: string;
    description: string;
    category: string;
    type: "income" | "outflow";
  }>({
    amount: "",
    description: "",
    category: "",
    type: "outflow"
  });

  useEffect(() => {
    dispatch(fetchSimulation());
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleRunSimulation = () => {
    dispatch(startSimulation());
    toast.success("Numerical crunching complete");
  };

  const handleReset = () => {
    dispatch(resetSimulation());
    toast.success("Simulation node reset");
  };

  const handleAddEntry = () => {
    if (!newEntry.amount || isNaN(parseFloat(newEntry.amount))) return;
    toast.success("Hypothetical flow vector injected");
    setNewEntry({
      amount: "",
      description: "",
      category: "",
      type: "outflow"
    });
  };

  const budgetTargets = user?.budgetTargets || {
    needs: 50,
    wants: 30,
    savings: 20
  };

  if (authLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-[500px] lg:col-span-1" />
            <Skeleton className="h-[500px] lg:col-span-2" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Strategy Engine"
        subtitle="Predictive financial modeling & advanced fiscal architecture."
        actions={
          <div className="flex items-center gap-3">
             <Button 
               variant="outline" 
               onClick={handleReset}
               className="gap-2 font-black text-[10px] uppercase tracking-widest h-10 rounded-xl"
             >
                <RotateCcw className="size-3.5" /> Reset Node
             </Button>
             <Button 
               onClick={handleRunSimulation}
               disabled={loading}
               className="gap-2 font-black text-[10px] uppercase tracking-widest h-10 rounded-xl shadow-lg shadow-primary/20"
             >
                <Play className="size-3.5" /> Engage Strategy
             </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Parameters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <Card className="space-y-6">
             <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                   <Plus className="size-5 text-primary" />
                </div>
                <div>
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Entry Injection</h3>
                   <p className="text-[10px] font-bold text-slate-400">Insert hypothetical flow vectors</p>
                </div>
             </div>

             <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-2">
                   <button 
                     onClick={() => setNewEntry({ ...newEntry, type: "income" })}
                     className={`py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                       newEntry.type === "income" 
                         ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                         : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-transparent"
                     }`}
                   >
                     Income
                   </button>
                   <button 
                     onClick={() => setNewEntry({ ...newEntry, type: "outflow" })}
                     className={`py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${
                       newEntry.type === "outflow" 
                         ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20" 
                         : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-transparent"
                     }`}
                   >
                     Outflow
                   </button>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Magnitude</label>
                      <Input 
                        placeholder="0.00" 
                        value={newEntry.amount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, amount: e.target.value })}
                        className="font-mono h-11"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Identifier</label>
                      <Input 
                        placeholder="Description..." 
                        value={newEntry.description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEntry({ ...newEntry, description: e.target.value })}
                        className="h-11"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">Classification</label>
                      <Select 
                        value={newEntry.category}
                        onValueChange={(val: string) => setNewEntry({ ...newEntry, category: val })}
                      >
                         <SelectTrigger className="h-11 font-bold text-xs">
                            <SelectValue placeholder="Select Sector" />
                         </SelectTrigger>
                         <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </div>
                   <Button onClick={handleAddEntry} className="w-full h-11 rounded-2xl font-black uppercase tracking-widest text-[11px] gap-2 mt-2">
                      Inject Vector <Zap className="size-3.5" />
                   </Button>
                </div>
             </div>
           </Card>

           <Card className="bg-slate-900 border-0 p-6 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="size-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <Target className="size-5 text-white" />
                 </div>
                 <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Target Protocol</h3>
                    <p className="text-[10px] font-bold text-slate-400">Current active constraints</p>
                 </div>
              </div>

              <div className="space-y-4">
                 {[
                   { label: "Needs", val: budgetTargets.needs, color: "bg-emerald-500" },
                   { label: "Wants", val: budgetTargets.wants, color: "bg-blue-500" },
                   { label: "Savings", val: budgetTargets.savings, color: "bg-primary" },
                 ].map(target => (
                   <div key={target.label} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/70">
                         <span>{target.label}</span>
                         <span>{target.val}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${target.val}%` }}
                           className={`h-full ${target.color} rounded-full`} 
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </Card>
        </div>

        {/* Results Visualizer */}
        <div className="lg:col-span-2 space-y-6">
           <Card className="min-h-[600px] flex flex-col p-8">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-white/5">
                       <Calculator className="size-6 text-primary" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 dark:text-white">Analysis Hub</h3>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Synthesized engine output</p>
                    </div>
                 </div>
                 {results && (
                   <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest animate-pulse">
                      Simulation Valid
                   </div>
                 )}
              </div>

              {!results ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8">
                   <div className="size-32 rounded-[3.5rem] bg-slate-50 dark:bg-slate-800/30 flex items-center justify-center border border-dashed border-slate-200 dark:border-white/10 relative">
                      <Sparkles className="size-12 text-slate-300 dark:text-slate-600 animate-pulse" />
                      <div className="absolute inset-0 rounded-[3.5rem] border-2 border-primary/10 animate-ping" />
                   </div>
                   <div className="max-w-xs space-y-3">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Awaiting Command</h4>
                      <p className="text-xs font-bold text-slate-400 leading-relaxed">Initialize engine to generate predictive trajectories and saving recommendations based on your unique fiscal profile.</p>
                   </div>
                   <Button onClick={handleRunSimulation} disabled={loading} className="font-black text-[11px] uppercase tracking-[0.2em] px-10 h-14 rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 transition-all">
                      {loading ? "Engaging..." : "Engage Engine"}
                   </Button>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-2 group hover:border-emerald-500/30 transition-all">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Projected Surplus</span>
                         <div className="text-3xl font-black text-emerald-500">{formatCurrency(results.surplus)}</div>
                      </div>
                      <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-2 group hover:border-primary/30 transition-all">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rule Adherence</span>
                         <div className="text-3xl font-black text-primary">{results.adherence}%</div>
                      </div>
                      <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-2 group hover:border-blue-500/30 transition-all">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency Index</span>
                         <div className="text-3xl font-black text-blue-500">{results.efficiency}/100</div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                         <Lightbulb className="size-5 text-primary" /> Strategem Recommendations
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                         {results.suggestions.map((suggestion: string, i: number) => (
                           <motion.div 
                             key={i}
                             initial={{ opacity: 0, x: -20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: i * 0.1 }}
                             className="flex items-center gap-5 p-5 rounded-[1.75rem] bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors group cursor-default"
                           >
                              <div className="size-11 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center border border-primary/20 shadow-sm group-hover:scale-110 transition-transform">
                                 <ArrowRight className="size-5 text-primary" />
                              </div>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                 {suggestion}
                              </p>
                           </motion.div>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-3">
                         <TrendingUp className="size-5 text-emerald-500" /> Fiscal Trajectory
                      </h4>
                      <div className="h-72 w-full bg-slate-900 rounded-[3rem] border border-white/5 flex items-center justify-center p-12 relative overflow-hidden">
                         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                         <div className="relative w-full h-full flex items-end gap-3">
                            {[40, 65, 45, 80, 55, 95, 65, 110, 85, 130].map((h, i) => (
                              <motion.div 
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h / 1.5}%` }}
                                transition={{ delay: i * 0.08, type: "spring", damping: 15 }}
                                className="flex-1 bg-gradient-to-t from-primary/80 to-primary rounded-xl relative group"
                              >
                                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[9px] font-black text-white bg-primary px-2 py-1 rounded">
                                    Vector {i + 1}
                                 </div>
                              </motion.div>
                            ))}
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
