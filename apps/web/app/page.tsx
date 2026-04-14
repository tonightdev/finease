"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Zap,
  Activity,
  Box,
  LayoutDashboard,
  Target
} from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#020408] selection:bg-primary/30">

      {/* Hero Section */}
      <section className="relative pt-4 pb-6 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-30 dark:opacity-20 translate-y-[-50%]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] opacity-20 translate-x-[20%]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                The Ultimate Financial Command Center
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1] max-w-4xl mx-auto"
            >
              Architect Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                Wealth Ecosystem
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium"
            >
              Commandeer your capital with live ledger analytics, strategic adherence limits, and isolated event simulations. Tactical control for the modern architect.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Access System
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Actual Features Setup */}
      <section className="py-6 relative overflow-hidden">
        <div className="mx-auto max-w-[95%] sm:max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-4 space-y-1">
            <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">
              Core Network
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Six Live Modules
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Wealth Dashboard */}
            <div className="md:col-span-6 group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 p-4 overflow-hidden hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between">
              <div className="relative z-10">
                <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">
                  Wealth Command
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  The centralized hub syncing Net Worth trajectories, Liability aggregates, and live liquidity metrics across all attached nodes.
                </p>
              </div>
            </div>

            {/* Strategies & Simulations */}
            <div className="md:col-span-6 group relative bg-amber-500 text-white rounded-3xl p-4 overflow-hidden hover:scale-[1.02] transition-all shadow-lg flex flex-col">
              <div className="relative z-10">
                <div className="size-8 rounded-xl bg-white/20 flex items-center justify-center mb-2 backdrop-blur-sm shadow-inner">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black mb-2 uppercase tracking-tighter">
                  Live Strategies Matrix
                </h3>
                <p className="text-xs font-medium leading-relaxed opacity-90">
                  Experiment with dual perspective parameters (yearly/monthly) and zero-latency simulations to construct precise capital strategies before deploying funds.
                </p>
              </div>
            </div>

            {/* Macro Planning Space */}
            <div className="md:col-span-4 group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 p-4 overflow-hidden hover:border-emerald-500/50 transition-all shadow-sm">
              <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-2">
                <Box className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">
                Short Term Hubs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Persisted Firebase-driven micro-ledgers. Spin up transient architectures for trips and events to verify exactly which accounts liquidate to hit targets.
              </p>
            </div>

            {/* Goal Target Engine */}
            <div className="md:col-span-4 group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 p-4 overflow-hidden hover:border-fuchsia-500/50 transition-all shadow-sm">
              <div className="size-8 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-500 mb-2">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">
                Goal Execution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Lock your trajectories to strict end-dates. The engine paces real-world savings against calculated velocities to ensure retirement and assets land perfectly.
              </p>
            </div>

            {/* Deep Portfolio */}
            <div className="md:col-span-4 group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 p-4 overflow-hidden hover:border-sky-500/50 transition-all shadow-sm">
              <div className="size-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 mb-2">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">
                Asset Portfolio
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Deep tracking into fixed deposits, equities, and real estate vectors. Automatically map the delta between input capital against massive long-term valuations.
              </p>
            </div>

            {/* Automated Synchronization */}
            <div className="md:col-span-12 group relative bg-slate-900 dark:bg-slate-800 text-white rounded-3xl border border-slate-700/50 dark:border-slate-700 p-6 sm:p-8 overflow-hidden hover:border-primary/50 transition-all shadow-inner flex flex-col sm:flex-row gap-6 items-center">
              <div className="size-14 rounded-3xl bg-primary flex flex-shrink-0 items-center justify-center text-white mb-2 sm:mb-0">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black mb-2 uppercase tracking-tighter">
                  Universal Ledgers (Integrated Hub)
                </h3>
                <p className="text-xs font-medium leading-relaxed opacity-80 max-w-3xl">
                  Commandeer your fiscal state with high-fidelity ledger tracking. Utilize advanced category splitting and native historical analytics via our integrated Intelligence hub—fully optimized for high-density professional monitoring.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section - Compact */}
      <section className="py-6 bg-white dark:bg-slate-950/50">
        <div className="mx-auto max-w-[95%] sm:max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Zero Fees. <span className="text-primary italic">Absolute Privacy.</span>
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "No generic \"Budgeting\"",
                  "Pure Cloud Data Sync",
                  "Universal Platform Scaling",
                  "End-to-End Encryption"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-4 rounded-2xl flex items-center gap-4">
              <ShieldCheck className="w-8 h-8 text-emerald-500 flex-shrink-0" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sovereignty Enforced</p>
                <p className="text-[10px] font-medium text-slate-500 italic">&quot;Data rests fully obfuscated. We intercept zero transactions.&quot;</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer-Banner */}
      <section className="py-6 border-t border-slate-200 dark:border-white/5">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-black uppercase tracking-[0.3em] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Initialize Interface
          </Link>
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
            Designed in India. © 2026 FinEase.
          </p>
        </div>
      </section>
    </div>
  );
}
