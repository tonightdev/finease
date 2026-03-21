"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Target,
  ShieldCheck,
  TrendingUp,
  Layers,
  Zap,
  Globe,
  Lock,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#020408] selection:bg-primary/30">
      {/* Premium Navigation (Minimal) */}

      {/* Hero Section: The Architect's View */}
      <section className="relative pt-16 pb-24 sm:pt-20 sm:pb-32 lg:pt-24 lg:pb-40 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-30 dark:opacity-20 translate-y-[-50%]" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] opacity-20 translate-x-[20%]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                The Ultimate Financial Command Center
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight leading-[0.95] max-w-5xl mx-auto"
            >
              Architect Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                Wealth
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium"
            >
              Master every rupee with real-time analytics, automated
              confirmation ledgers, and goal-driven intelligence. No
              subscriptions. No ads. Just pure financial command.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link
                href="/signup"
                className="w-full sm:w-auto px-8 py-5 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                Start Constructing
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-black uppercase tracking-[0.2em] rounded-[1.5rem] border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center"
              >
                Access Interface
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="py-24 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-16 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
              Core Modules
            </h2>
            <p className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              The Architect&apos;s Toolkit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Wealth Command (Large Row) */}
            <div className="md:col-span-8 group relative bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-6 sm:p-12 overflow-hidden hover:border-primary/50 transition-all shadow-sm">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-32 h-32 text-primary" />
              </div>
              <div className="relative z-10 max-w-md">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">
                  Wealth Nexus Command
                </h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  A unified ledger for Bank Accounts, Investments, Liabilites,
                  and Hidden Assets. Track your Net Worth across the total INR
                  ecosystem with sub-second precision.
                </p>
                <div className="mt-8 flex gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[8px] font-black uppercase tracking-widest text-slate-500">
                    Real-time valuation
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[8px] font-black uppercase tracking-widest text-slate-500">
                    Asset classification
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Automated Ledger */}
            <div className="md:col-span-4 group relative bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 overflow-hidden hover:scale-[1.02] transition-all shadow-2xl">
              <div className="relative z-10">
                <div className="size-12 rounded-2xl bg-white/10 dark:bg-slate-900/10 flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">
                  Automated Ledger
                </h3>
                <p className="opacity-70 font-medium leading-relaxed">
                  Bill cycles and recurring payments detected automatically.
                  Confirm with a single tap to update balances without the
                  manual entry overhead.
                </p>
              </div>
            </div>

            {/* Goal Navigator */}
            <div className="md:col-span-4 group relative bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-6 sm:p-12 overflow-hidden hover:border-emerald-500/50 transition-all shadow-sm">
              <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">
                Goal Navigator
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Set milestones for retirement or real estate. Our engine
                calculates exactly how much you need to save per month based on
                your current asset performance.
              </p>
            </div>

            {/* Strategic Simulation (NEW) */}
            <div className="md:col-span-4 group relative bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-6 sm:p-12 overflow-hidden hover:border-amber-500/50 transition-all shadow-sm">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="w-24 h-24 text-amber-500" />
              </div>
              <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">
                Strategic Simulation
              </h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Experiment with your capital without real-world risk. Our hybrid
                simulation engine lets you project future wealth based on custom adherence rules.
              </p>
            </div>

            {/* Privacy Shield */}
            <div className="md:col-span-8 group relative bg-gradient-to-br from-primary to-emerald-500 text-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8">
                <div className="size-20 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">
                    The Sovereignty Protocol
                  </h3>
                  <p className="opacity-90 font-medium leading-relaxed">
                    Encryption is not a feature; it is our foundation. Your data
                    is encrypted locally and replicated via zero-knowledge
                    proofs. We don&apos;t just protect your data—we never see
                    it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Trust / No Subscription Section */}
      <section className="py-24 bg-white dark:bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
                Built for the <br />
                <span className="text-primary italic">Absolute</span>{" "}
                Professional
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                FinEase is not a &quot;simple app&quot;. It is a
                high-performance instrument for those who take their capital
                seriously.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  "No generic 'Budgeting'—Advanced Ledger Architecting",
                  "No recurring monthly subscription fees",
                  "Direct Firestore access with local replication",
                  "Comprehensive Multi-Asset Support (Fixed & Growth)",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-[3rem] bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center p-12 overflow-hidden shadow-inner">
                <div className="text-center space-y-4">
                  <Globe className="w-24 h-24 text-primary/20 mx-auto" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    Identity Nodes: Secured
                  </p>
                  <div className="flex gap-2 justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-4 sm:-bottom-8 sm:-left-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-4 sm:p-6 rounded-3xl shadow-2xl flex items-center gap-4 z-20">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Security Layer
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Active Encryption
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 pb-8 relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-8">
            Ready to <span className="italic font-serif">Command?</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/signup"
              className="px-10 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] rounded-3xl hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
              Request Access Node
            </Link>
          </div>
          <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Final Encryption Block Enabled
          </p>
        </div>
      </section>

      {/* Mini Footer */}
      <footer className="mt-8 border-t border-slate-200 dark:border-white/5 py-8 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 grayscale group-hover:grayscale-0 transition-all">
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">
              Fin<span className="text-primary">Ease</span>
            </span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            © 2026 Sovereign Wealth Architect. India.
          </p>
          <div className="flex gap-8">
            <a
              href="#"
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
            >
              Infrastructure
            </a>
            <a
              href="#"
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors"
            >
              Terminal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
