"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-[#0f1115] transition-colors duration-500">
      <div className="relative flex flex-col items-center">
        {/* Modern Animated Loading Icon */}
        <div className="relative size-20">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-primary/20 animate-ping duration-1000" />
          
          {/* Rotating gradient square */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-primary to-emerald-400 opacity-20 animate-pulse" />
          
          {/* The Core Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="size-12 rounded-2xl bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center transform transition-transform animate-bounce duration-[2000ms]">
                <div className="size-6 rounded-lg bg-gradient-to-tr from-primary to-emerald-500 animate-pulse rotate-45" />
             </div>
          </div>
          
          {/* Orbiting particles */}
          <div className="absolute -inset-4 border border-primary/10 rounded-full animate-spin duration-[4000ms] border-dashed" />
          <div className="absolute -inset-8 border border-emerald-500/5 rounded-full animate-spin duration-[6000ms] border-dotted" />
        </div>
        
        {/* Premium Text */}
        <div className="mt-10 text-center space-y-2">
          <div className="text-[10px] font-black text-primary uppercase tracking-[0.4em] animate-pulse">
            Initializing Systems
          </div>
          <div className="flex gap-1 justify-center">
             <div className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
             <div className="w-1 h-1 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
             <div className="w-1 h-1 rounded-full bg-primary/40 animate-bounce" />
          </div>
          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-4">
            Securing Financial Architecture
          </p>
        </div>
      </div>
    </div>
  );
}
