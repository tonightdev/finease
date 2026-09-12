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
    <header className="sticky top-0 w-full z-50 border-b border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-black/40 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
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

        <div className="flex items-center gap-3 sm:gap-4">
          {user && (
            <>
              {/* Mobile Search Icon */}
              <button
                type="button"
                onClick={() => dispatch(setCommandPalette(true))}
                className="flex items-center justify-center size-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-primary transition-all active:scale-90 sm:hidden cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-4.5 h-4.5" />
              </button>

              {/* Web/Desktop Search Input Box */}
              <button
                type="button"
                onClick={() => dispatch(setCommandPalette(true))}
                className="hidden sm:flex items-center gap-2.5 h-9 px-3.5 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium transition-all cursor-pointer shadow-sm group w-44 md:w-56 lg:w-64"
                aria-label="Search commands"
              >
                <Search className="size-3.5 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
                <span className="flex-1 text-left truncate text-slate-400">
                  Search commands...
                </span>
                <kbd className="text-[10px] font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 text-slate-400 shadow-2xs shrink-0">
                  ⌘K
                </kbd>
              </button>
            </>
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
