"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  setCommandPalette,
  openModal
} from "@/store/slices/uiSlice";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Home,
  Layout,
  Target,
  Bell,
  Settings,
  Plus,
  Wallet,
  TrendingUp,
  RefreshCw,
  Download,
  Moon,
  Sun,
  Shield,
  Zap,
  Layers,
  Sparkles
} from "lucide-react";
import { useTheme } from "next-themes";

interface CommandItem {
  id: string;
  name: string;
  description: string;
  category: "Navigation" | "Financial Lab" | "System Control" | "Global Actions";
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
  color?: string; // HSL color for the icon background
}

export function CommandPalette() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useSelector((state: RootState) => state.user.profile);
  const isOpen = useSelector((state: RootState) => state.ui.commandPalette.isOpen);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const handleAction = React.useCallback(async (action: () => void) => {
    dispatch(setCommandPalette(false));
    setTimeout(() => {
      action();
      setQuery("");
    }, 50);
  }, [dispatch]);

  const commands = React.useMemo((): CommandItem[] => [
    // Navigation - Engine Core
    { id: "nav-dash", name: "Status Dashboard", description: "Real-time wealth metrics & node status", category: "Navigation", icon: <Home className="w-4 h-4" />, action: () => router.push("/dashboard"), color: "bg-blue-500" },
    { id: "nav-plans", name: "Lattice Mapping", description: "Long-term goals & yearly commitment protocol", category: "Navigation", icon: <Layout className="w-4 h-4" />, action: () => router.push("/plans"), color: "bg-indigo-500" },
    { id: "nav-goals", name: "Financial Terminals", description: "Direct access to mapped wealth objectives", category: "Navigation", icon: <Target className="w-4 h-4" />, action: () => router.push("/plans?tab=Goals"), color: "bg-rose-500" },
    { id: "nav-port", name: "Account Matrix", description: "Manage capital nodes & liquid assets", category: "Navigation", icon: <Wallet className="w-4 h-4" />, action: () => router.push("/portfolio"), color: "bg-violet-500" },
    { id: "nav-strat", name: "Strategy Lab", description: "Simulate financial scenarios & burn rates", category: "Navigation", icon: <Zap className="w-4 h-4" />, action: () => router.push("/strategies"), color: "bg-amber-500" },
    { id: "nav-sett", name: "Protocol Settings", description: "Global configuration & identity access", category: "Navigation", icon: <Settings className="w-4 h-4" />, action: () => router.push("/settings"), color: "bg-slate-500" },

    // Financial Lab - Creation
    { id: "act-acc", name: "Initialize Account", description: "Register a new capital node in the lattice", category: "Financial Lab", icon: <Plus className="w-4 h-4" />, action: () => dispatch(openModal("isAccountModalOpen")), color: "bg-emerald-500" },
    { id: "act-goal", name: "Map New Goal", description: "Define a financial terminal objective", category: "Financial Lab", icon: <Target className="w-4 h-4" />, action: () => dispatch(openModal("isGoalModalOpen")), color: "bg-rose-500" },
    { id: "act-exp", name: "Commit Expenditure", description: "Set a recurring yearly burden node", category: "Financial Lab", icon: <Bell className="w-4 h-4" />, action: () => dispatch(openModal("isExpiryModalOpen")), color: "bg-orange-500" },
    { id: "act-sim", name: "Launch Simulation", description: "Start a new project lifecycle forecast", category: "Financial Lab", icon: <TrendingUp className="w-4 h-4" />, action: () => dispatch(openModal("isSimulationModalOpen")), color: "bg-cyan-500" },

    // System Control
    { id: "sys-theme", name: "Toggle Visual Protocol", description: `Switch to ${theme === "dark" ? "Light" : "Dark"} mode radiation`, category: "System Control", icon: theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />, action: () => setTheme(theme === "dark" ? "light" : "dark"), color: "bg-slate-700" },
    { id: "sys-sync", name: "Synchronize Nodes", description: "Force refresh all financial data streams", category: "System Control", icon: <RefreshCw className="w-4 h-4" />, action: () => window.location.reload(), color: "bg-sky-600" },
    { id: "sys-export", name: "Archive Identity", description: "Export full financial dataset as JSON", category: "System Control", icon: <Download className="w-4 h-4" />, action: () => router.push("/settings?tab=data"), color: "bg-fuchsia-600" },
  ], [dispatch, router, theme, setTheme]);

  const filteredCommands = React.useMemo(() => commands.filter(cmd =>
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  ), [commands, query]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        dispatch(setCommandPalette(true));
        return;
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        dispatch(setCommandPalette(false));
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      }

      if (e.key === "Enter" && filteredCommands[selectedIndex]) {
        e.preventDefault();
        handleAction(filteredCommands[selectedIndex].action);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, isOpen, filteredCommands, selectedIndex, handleAction]);

  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(setCommandPalette(false))}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100]"
          />

          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[12vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -40, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, y: -40, filter: "blur(10px)" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden flex flex-col backdrop-blur-3xl ring-1 ring-black/5 dark:ring-white/5"
            >
              {/* Header Header */}
              <div className="relative">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
                <div className="flex items-center px-8 py-6">
                  <div className="relative mr-4">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    <Search className="w-6 h-6 text-primary relative z-10" />
                  </div>
                  <input
                    autoFocus
                    placeholder="Search commands, nodes, or protocols..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-white placeholder-slate-400 font-black tracking-tight"
                  />
                  <div className="flex items-center gap-2 group">
                    <div className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-white/10 group-hover:text-primary transition-colors">
                      <span className="text-xs">⎋</span> ESC
                    </div>
                  </div>
                </div>
              </div>

              {/* Commands List */}
              <div className="max-h-[60vh] overflow-y-auto px-4 py-4 scroll-smooth">
                {filteredCommands.length === 0 ? (
                  <div className="px-10 py-20 text-center">
                    <div className="size-16 mx-auto mb-6 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-xs font-black uppercase text-slate-400 tracking-[0.3em]">No matching protocols found</p>
                  </div>
                ) : (
                  Object.entries(
                    filteredCommands.reduce((acc, cmd) => {
                      if (!acc[cmd.category]) acc[cmd.category] = [];
                      acc[cmd.category]!.push(cmd);
                      return acc;
                    }, {} as Record<string, CommandItem[]>)
                  ).map(([category, items]) => (
                    <div key={category} className="mb-6 last:mb-2">
                      <div className="px-4 mb-3 flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">
                          {category}
                        </h3>
                        {category === "Navigation" && <Layers className="size-3 text-slate-300" />}
                        {category === "Financial Lab" && <Zap className="size-3 text-amber-400" />}
                        {category === "System Control" && <Shield className="size-3 text-indigo-400" />}
                      </div>
                      <div className="space-y-1">
                        {items.map((cmd) => {
                          const globalIdx = filteredCommands.findIndex(c => c.id === cmd.id);
                          const isSelected = globalIdx === selectedIndex;

                          return (
                            <button
                              key={cmd.id}
                              onClick={() => handleAction(cmd.action)}
                              onMouseEnter={() => setSelectedIndex(globalIdx)}
                              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-left relative group ${isSelected
                                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-lg shadow-black/20"
                                : "text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                                }`}
                            >
                              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-500 ${isSelected ? "scale-110 rotate-3 shadow-xl" : "bg-slate-100 dark:bg-white/5"
                                }`}>
                                <div className={`p-2 rounded-lg ${isSelected ? "text-inherit" : "text-slate-500"}`}>
                                  {cmd.icon}
                                </div>
                                {isSelected && (
                                  <motion.div
                                    layoutId="glow"
                                    className={`absolute inset-0 blur-xl opacity-40 rounded-full ${cmd.color}`}
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={`block text-sm font-black tracking-tight ${isSelected ? "text-inherit" : "text-slate-900 dark:text-white"
                                  }`}>
                                  {cmd.name}
                                </span>
                                <span className={`block text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isSelected ? "opacity-70" : "text-slate-400 dark:text-slate-500"
                                  }`}>
                                  {cmd.description}
                                </span>
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  className="shrink-0"
                                >
                                  <div className="size-8 rounded-full border border-current opacity-20 flex items-center justify-center">
                                    <span className="text-[10px] font-black italic">Enter</span>
                                  </div>
                                </motion.div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Advanced Footer */}
              <div className="px-8 py-5 bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[9px] font-black shadow-sm">↑↓</kbd>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Control</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[9px] font-black shadow-sm">⏎</kbd>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Execute Node</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] italic">FinEase Sovereign Engine v1.0</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
