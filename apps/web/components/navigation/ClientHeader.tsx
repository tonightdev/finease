"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import { RefreshButton } from "@/components/navigation/RefreshButton";
import { UserMenu } from "@/components/auth/UserMenu";
import { TopNav } from "@/components/navigation/TopNav";
import { useAuth } from "@/components/auth/AuthProvider";
import { Wallet, Search } from "lucide-react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { setCommandPalette } from "@/store/slices/uiSlice";

export function ClientHeader() {
  const { user, loading } = useAuth();
  const dispatch = useDispatch<AppDispatch>();

  return (
    <header className="sticky top-0 w-full z-50 border-b border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link
            href={
              user
                ? user.role === "admin"
                  ? "/admin/dashboard"
                  : "/dashboard"
                : "/"
            }
            className="flex items-center gap-2 group transition-all active:scale-95"
          >
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
              Fin<span className="text-primary">Ease</span>
            </span>
          </Link>
        </div>

        {user && <TopNav />}

        <div className="flex items-center gap-4">
          {user && (
            <button
              onClick={() => dispatch(setCommandPalette(true))}
              className="flex items-center justify-center size-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-primary transition-all active:scale-90 sm:hidden"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          
          {user && <RefreshButton />}
          <ThemeToggle />

          {!loading && !user && (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all active:scale-95 shadow-xl shadow-slate-200 dark:shadow-none"
              >
                Get Started
              </Link>
            </div>
          )}

          {user && <UserMenu />}
        </div>
      </div>
    </header>
  );
}
