"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  ShieldCheck,
  Target,
  TrendingUp,
  Compass,
  Zap,
  UserCircle2,
  Activity,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  selector?: string; // For highlighting elements later if needed
}

export function FeatureTour() {
  const { user, updateProfile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Show tour if user is logged in and hasn't onboarded yet
    if (user && user.hasOnboarded === false) {
      setIsVisible(true);
    }
  }, [user]);

  const steps: TourStep[] = [
    {
      title: "Welcome to FinEase",
      description:
        "Your financial engine is now online. Let's take a quick look at the controls of your new wealth command center.",
      icon: <Sparkles className="w-10 h-10 text-primary" />,
    },
    {
      title: "Unified Liquidity",
      description:
        "Monitor your cash flow and bank balances in real-time. Link your units of capital to see your immediate buying power.",
      icon: <Zap className="w-10 h-10 text-emerald-500" />,
    },
    {
      title: "Growth Portfolio",
      description:
        "Track your investments across stocks, mutual funds, and assets. Watch your net worth evolve through our automated tracking.",
      icon: <TrendingUp className="w-10 h-10 text-indigo-500" />,
    },
    {
      title: "Strategies Hub",
      description:
        "Experiment with your capital without risk. Our hybrid engine lets you project future net worth based on custom adherence rules.",
      icon: <Activity className="w-10 h-10 text-amber-500" />,
    },
    {
      title: "Wealth Mapping",
      description:
        "Define your 'Financial North Star' by setting goals. We'll calculate the exact velocity needed to reach your targets.",
      icon: <Target className="w-10 h-10 text-rose-500" />,
    },
    {
      title: "Predictive Intelligence",
      description:
        "Our analytical engine synthesizes your data to project future wealth. See your FIRE date and capital retention rates in real-time.",
      icon: <Compass className="w-10 h-10 text-primary" />,
    },
    {
      title: "Privacy Protocol",
      description:
        "Your data is encrypted and private. Use biometric locks or PINs to secure your financial architecture on any device.",
      icon: <ShieldCheck className="w-10 h-10 text-primary" />,
    },
    {
      title: "Identity Gateway",
      description:
        "Switch profiles instantly. Manage your family's or business's ledgers under one master identity without logging out.",
      icon: <UserCircle2 className="w-10 h-10 text-primary" />,
    },
    {
      title: "Ready for Launch",
      description:
        "You're now ready to pilot your financial future. Sync your data and let FinEase guide you to absolute clarity.",
      icon: <Sparkles className="w-10 h-10 text-emerald-500" />,
    },
  ];

  const handleComplete = () => {
    setIsVisible(false);
    updateProfile({ hasOnboarded: true });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="bg-white/80 dark:bg-[#0f1115]/80 w-full max-w-lg rounded-[2.5rem] md:rounded-[3rem] p-6 sm:p-8 md:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-white/20 dark:border-white/5 relative overflow-hidden backdrop-blur-2xl"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-100 dark:bg-white/5">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "0%" }}
              animate={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <button
            onClick={handleComplete}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center relative z-10">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              className="size-20 sm:size-24 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-6 sm:mb-8 shadow-2xl border border-slate-200 dark:border-white/10 relative group"
            >
              <div className="absolute inset-0 bg-primary/5 rounded-[1.5rem] sm:rounded-[2rem] blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
              <div className="scale-90 sm:scale-100">
                {steps[currentStep]?.icon}
              </div>
            </motion.div>

            <motion.div
              key={`text-${currentStep}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              className="space-y-3 sm:space-y-4"
            >
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                {steps[currentStep]?.title}
              </h2>
              <p className="text-xs sm:text-base font-bold text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs sm:max-w-sm mx-auto mb-8 sm:mb-10">
                {steps[currentStep]?.description}
              </p>
            </motion.div>

            <div className="flex items-center justify-between w-full pt-6 sm:pt-8 gap-4">
              <div className="flex-1 flex justify-start">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="flex items-center justify-center size-10 sm:size-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-0 transition-all shadow-sm hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="flex gap-1.5 sm:gap-2 bg-slate-100 dark:bg-white/10 p-2.5 rounded-full shadow-inner">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`size-1.5 sm:size-2 rounded-full transition-all duration-500 ${i === currentStep ? "bg-primary w-5 sm:w-8 shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]" : "bg-slate-300 dark:bg-white/20"}`}
                  />
                ))}
              </div>

              <div className="flex-1 flex justify-end">
                <button
                  onClick={handleNext}
                  className="flex items-center justify-center size-10 sm:size-12 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Decorative background elements */}
          <div className="absolute -bottom-24 -right-24 size-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -top-24 -left-24 size-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
