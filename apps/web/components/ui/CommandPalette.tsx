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
  Command,
  TrendingUp
} from "lucide-react";

interface CommandItem {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const isOpen = useSelector((state: RootState) => state.ui.commandPalette.isOpen);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const commands: CommandItem[] = [
    // Navigation
    { id: "nav-dash", name: "Dashboard", category: "Pages", icon: <Home className="w-4 h-4" />, action: () => router.push("/dashboard") },
    { id: "nav-plans", name: "Plans & Goals", category: "Pages", icon: <Layout className="w-4 h-4" />, action: () => router.push("/plans") },
    { id: "nav-port", name: "Accounts & Assets", category: "Pages", icon: <Wallet className="w-4 h-4" />, action: () => router.push("/portfolio") },
    { id: "nav-sett", name: "Settings", category: "Pages", icon: <Settings className="w-4 h-4" />, action: () => router.push("/settings") },
    
    // Actions
    { id: "act-acc", name: "Add New Account", category: "Actions", icon: <Plus className="w-4 h-4" />, action: () => dispatch(openModal("isAccountModalOpen")) },
    { id: "act-goal", name: "Create New Goal", category: "Actions", icon: <Target className="w-4 h-4" />, action: () => dispatch(openModal("isGoalModalOpen")) },
    { id: "act-exp", name: "Set Reminder", category: "Actions", icon: <Bell className="w-4 h-4" />, action: () => dispatch(openModal("isExpiryModalOpen")) },
    { id: "act-sim", name: "Start Budget Plan", category: "Actions", icon: <TrendingUp className="w-4 h-4" />, action: () => dispatch(openModal("isSimulationModalOpen")) },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(query.toLowerCase()) || 
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

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
  }, [dispatch, isOpen, filteredCommands, selectedIndex]);

  const handleAction = async (action: () => void) => {
    // For navigation, we want to close the palette first to avoid layout shift 
    // or interference with the new page's focus.
    dispatch(setCommandPalette(false));
    
    // Small delay to allow the palette to start closing before navigation
    setTimeout(() => {
      action();
      setQuery("");
    }, 50);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(setCommandPalette(false))}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100]"
          />

          {/* Palette container */}
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl shadow-black/40 pointer-events-auto overflow-hidden flex flex-col"
            >
              {/* Search Header */}
              <div className="flex items-center px-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  autoFocus
                  placeholder="Type a command or search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 px-4 py-5 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 font-medium"
                />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-300 dark:border-white/10">
                  <span className="text-[12px]">⎋</span> Esc
                </div>
              </div>

              {/* Commands List */}
              <div className="max-h-[60vh] overflow-y-auto py-2">
                {filteredCommands.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-400">
                    <Command className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">No results found</p>
                  </div>
                ) : (
                  Object.entries(
                    filteredCommands.reduce((acc, cmd) => {
                      if (!acc[cmd.category]) acc[cmd.category] = [];
                      acc[cmd.category]!.push(cmd);
                      return acc;
                    }, {} as Record<string, CommandItem[]>)
                  ).map(([category, items]) => (
                    <div key={category} className="px-2 mb-2">
                      <h3 className="px-4 py-2 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                        {category}
                      </h3>
                      {items.map((cmd) => {
                        const globalIdx = filteredCommands.findIndex(c => c.id === cmd.id);
                        const isSelected = globalIdx === selectedIndex;
                        
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => handleAction(cmd.action)}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group ${
                              isSelected 
                                ? "bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white ring-1 ring-primary/20" 
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg transition-colors ${
                                isSelected ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-primary"
                              }`}>
                                {cmd.icon}
                              </div>
                              <span className={`text-sm font-bold transition-colors ${
                                isSelected ? "text-slate-900 dark:text-white" : "group-hover:text-slate-900 dark:group-hover:text-white"
                              }`}>
                                {cmd.name}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-slate-400 tracking-widest">
                    <span className="p-0.5 px-1 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/10">↑↓</span> Navigate
                  </div>
                  <div className="flex items-center gap-1.5 text-[8px] font-black uppercase text-slate-400 tracking-widest">
                    <span className="p-0.5 px-1.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/10">⏎</span> Select
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black text-slate-300 uppercase italic">FinEase Smart Wealth</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
