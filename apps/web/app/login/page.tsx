"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const { loginWithGoogle, user } = useAuth();
  const [userEmail, setUserEmail] = useState("dhavalpithwa@gmail.com");
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithGoogle(userEmail).then(() => {
      router.push("/dashboard");
    });
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-4 sm:p-8">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark p-8 rounded-2xl shadow-xl flex flex-col gap-6">
        <div className="flex flex-col items-center mb-2 gap-3 text-center">
          <Logo className="w-12 h-12 mb-2" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Welcome back.</h1>
          <p className="text-sm font-medium text-slate-500">Sign in to your FinEase command center.</p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Email Address</label>
            <input 
               type="email" 
               value={userEmail}
               onChange={(e) => setUserEmail(e.target.value)}
               className="w-full bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Password</span>
              <button type="button" className="text-primary hover:underline lowercase font-medium tracking-normal">Forgot?</button>
            </label>
            <input 
               type="password" 
               defaultValue="password123"
               className="w-full bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
            />
          </div>

          <button type="submit" className="w-full mt-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-[0.98]">
            Sign In Securely
          </button>
        </form>

        <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          Don&apos;t have an account? <Link href="/signup" className="text-primary font-bold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
