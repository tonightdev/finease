"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import type { AxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";


export default function SignupPage() {
  const { loginWithGoogle, user } = useAuth();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle(userEmail, userName, password);
      router.push("/dashboard");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message ?? axiosErr.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4 sm:p-8">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark p-8 rounded-2xl shadow-xl flex flex-col gap-6 -mt-8 sm:-mt-12">
        <div className="flex flex-col items-center mb-2 gap-3 text-center">
          <Logo className="w-12 h-12 mb-2" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Join FinEase.</h1>
          <p className="text-sm font-medium text-slate-500">Your journey to financial clarity starts here.</p>
        </div>
        
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-3 rounded-xl text-xs font-bold text-red-500 text-center animate-shake">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-tight">Full Name</label>
            <input 
               type="text" 
               value={userName}
               onChange={(e) => setUserName(e.target.value)}
               placeholder="John Doe"
               className="w-full bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-tight">Email Address</label>
            <input 
               type="email" 
               value={userEmail}
               onChange={(e) => setUserEmail(e.target.value)}
               placeholder="you@example.com"
               className="w-full bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-tight">Password</label>
            <PasswordInput 
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               placeholder="Create a strong password"
            />
          </div>


          <Button type="submit" isLoading={isLoading} className="w-full mt-2 h-10">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          Already have an account? <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
