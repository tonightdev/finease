"use client";

import { motion } from "framer-motion";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#050505] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[25%] w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(19,91,236,0.03)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(19,91,236,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative flex flex-col items-center -mt-12 lg:-mt-16">
        {/* Core Architectural Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 1.5,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative w-48 h-30 flex items-center justify-center"
        >
          {/* Animated Rings */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: 360, opacity: 1 }}
              transition={{
                rotate: {
                  duration: 15 + i * 5,
                  repeat: Infinity,
                  ease: "linear",
                },
                opacity: { duration: 1, delay: i * 0.2 },
              }}
              className="absolute border border-primary/10 dark:border-primary/5 rounded-[3rem]"
              style={{
                inset: i * 12,
                borderRadius: `${40 - i * 5}%`,
              }}
            />
          ))}

          {/* Central Monolith */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="size-24 rounded-[2rem] bg-gradient-to-br from-primary via-blue-700 to-indigo-900 shadow-[0_20px_50px_rgba(19,91,236,0.3)] flex items-center justify-center relative z-10 overflow-hidden"
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />

            {/* Dynamic Core */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 90, 180, 270, 360],
              }}
              transition={{
                scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              }}
              className="size-10 border-2 border-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm"
            >
              <div className="size-3 bg-white rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Brand Typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-center"
        >
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
            Fin
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-emerald-500">
              Ease
            </span>
          </h1>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 40 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="h-1 bg-gradient-to-r from-primary to-emerald-500 mx-auto mt-2 rounded-full"
          />
          <p className="mt-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.6em] ml-[0.6em]">
            Architectural Wealth
          </p>
        </motion.div>
      </div>

      {/* Modern Status Loader */}
      <div className="absolute bottom-24 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              height: [8, 24, 8],
              opacity: [0.3, 1, 0.3],
              backgroundColor: ["#135bec", "#10b981", "#135bec"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
            className="w-1 rounded-full"
          />
        ))}
      </div>

      {/* Security Signature */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 text-[8px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]"
      >
        Verified Sovereign Instance
      </motion.div>
    </div>
  );
}
