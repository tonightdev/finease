"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import type { AxiosError } from "axios";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { loginWithGoogle, user, resetPassword } = useAuth();
  const [userEmail, setUserEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot password state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle(userEmail, undefined, password);
      router.push("/dashboard");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message ?? axiosErr.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !newPassword) {
      toast.error("Please provide both email and new password");
      return;
    }
    setIsResetting(true);
    try {
      await resetPassword(resetEmail, newPassword);
      toast.success("Password reset successfully! You can now log in.");
      setIsForgotModalOpen(false);
      setResetEmail("");
      setNewPassword("");
    } catch {
      toast.error("Failed to reset password. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4 sm:p-8">
      <div className="w-full max-w-md bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark p-8 rounded-2xl shadow-xl flex flex-col gap-6 -mt-8 sm:-mt-12">
        <div className="flex flex-col items-center mb-2 gap-3 text-center">
          <Logo className="w-12 h-12 mb-2" />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Welcome back.</h1>
          <p className="text-sm font-medium text-slate-500">Sign in to your FinEase command center.</p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-3 rounded-xl text-xs font-bold text-red-500 text-center animate-shake">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Email Address</label>
            <input 
             type="email" 
               value={userEmail}
               onChange={(e) => setUserEmail(e.target.value)}
               placeholder="you@example.com"
               className="w-full bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Password</span>
              <button 
                type="button" 
                onClick={() => {
                  setResetEmail(userEmail); 
                  setIsForgotModalOpen(true);
                }}
                className="text-primary hover:underline lowercase font-medium tracking-normal"
              >
                Forgot?
              </button>
            </label>
            <input 
             type="password" 
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               placeholder="Enter your password"
               className="w-full bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
            />
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full mt-2 h-10">
            Sign In Securely
          </Button>
        </form>

        <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
          Don&apos;t have an account? <Link href="/signup" className="text-primary font-bold hover:underline">Sign up</Link>
        </p>
      </div>

      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-border-dark flex flex-col p-6 animate-scale-in">
            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2">Reset Password</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">Enter your email and a new password to reset your account.</p>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 tracking-tight ml-1">Email</label>
                <input 
                  type="email" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 tracking-tight ml-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <Button 
                  type="submit"
                  isLoading={isResetting}
                  className="flex-1 py-3 px-4 h-auto"
                >
                  Reset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
