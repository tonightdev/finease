"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
  netWorth: number;
  bounceEnabled: boolean;
  onToggleBounce: () => void;
  reconciliationStatus: 'matched' | 'mismatch';
}

export function DashboardHeader({ 
  netWorth, 
  bounceEnabled, 
  onToggleBounce,
  reconciliationStatus 
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Financial Command Center</h1>
        <p className="text-gray-400 mt-1">Welcome back, Architect. Your wealth is under management.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* Reconciliation Module */}
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${
          reconciliationStatus === 'matched' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
            : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
        }`}>
          {reconciliationStatus === 'matched' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <div className="text-xs">
            <p className="font-bold uppercase tracking-wider">Reconciliation</p>
            <p className="opacity-80">{reconciliationStatus === 'matched' ? 'Cash Matches Bank' : 'Verify Withdrawals'}</p>
          </div>
        </div>

        {/* Bounce Toggle */}
        <div className="flex items-center gap-3 px-4 py-2 glass-card border-white/10 rounded-xl">
          <div className="text-xs">
            <p className="font-bold text-white uppercase tracking-wider">Bounce Filter</p>
            <p className="text-gray-400">{bounceEnabled ? 'Including Windfalls' : 'Organic Growth Only'}</p>
          </div>
          <button 
            onClick={onToggleBounce}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 outline-none ${bounceEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}
          >
            <motion.div 
              animate={{ x: bounceEnabled ? 26 : 2 }}
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
        </div>

        {/* Quick Worth */}
        <div className="px-6 py-2 bg-brand-accent rounded-xl text-white shadow-lg shadow-brand-accent/20">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Total Net Worth</p>
          <p className="text-xl font-black">${netWorth.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
