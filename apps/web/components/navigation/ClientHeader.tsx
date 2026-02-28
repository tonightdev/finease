"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { TopNav } from "@/components/navigation/TopNav";
import { useAuth } from "@/components/auth/AuthProvider";

export function ClientHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-border-dark bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <Logo className="w-8 h-8 transition-transform group-hover:scale-105" />
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">FinEase</span>
          </Link>
          
          {user && (
            <div className="hidden md:flex relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                placeholder="Search assets..." 
                className="bg-slate-100 dark:bg-surface-dark border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary transition-all w-64 outline-none text-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>
        
        {user && <TopNav />}
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {!loading && !user && (
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:inline-block text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300 dark:hover:text-white transition-colors">
                Log in
              </Link>
              <Link href="/signup" className="flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark shadow-sm">
                Sign Up
              </Link>
            </div>
          )}

          {user && <UserMenu />}
        </div>
      </div>
    </header>
  );
}
