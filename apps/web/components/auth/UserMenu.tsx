"use client";

import { useAuth } from "./AuthProvider";
import { LogIn, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { user, loginWithGoogle, logout, loading } = useAuth();

  if (loading) {
    return <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />;
  }

  if (!user) {
    return (
      <Link href="/login" className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all">
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="hidden sm:block text-right">
        <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user.displayName}</p>
        <p className="text-[10px] text-slate-500 font-medium">{user.email}</p>
      </div>
      <div className="relative group">
        <button className="size-8 rounded-full bg-gradient-to-tr from-primary to-emerald-400 p-[px] overflow-hidden">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || ""} 
              className="w-full h-full rounded-full object-cover" 
              referrerPolicy="no-referrer"
            />

          ) : (
            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-slate-400" />
            </div>
          )}
        </button>
        
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
