"use client";

import { useAuth } from "./AuthProvider";
import { LogIn, LogOut, User as UserIcon, Settings, Zap, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export function UserMenu() {
  const { user, logout, loading, accounts, switchAccount, removeAccount } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition-all"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Sign In</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4" ref={menuRef}>
      <div className="hidden sm:block text-right">
        <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">
          {user.displayName}
        </p>
        <p className="text-[10px] text-slate-500 font-medium">{user.email}</p>
      </div>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="size-8 rounded-full bg-gradient-to-tr from-primary to-emerald-400 p-[1px] overflow-hidden flex items-center justify-center transition-colors"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="w-full h-full rounded-full bg-white dark:bg-background-dark flex items-center justify-center text-primary">
            <UserIcon className="w-5 h-5" />
          </div>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-2xl shadow-2xl py-3 z-[100]">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-border-dark mb-2 sm:hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                {user.displayName}
              </p>
              <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wider truncate">
                {user.email}
              </p>
            </div>

              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Control Center
              </Link>

            {accounts.length > 1 && (
                <div className="mt-2 py-2 border-t border-slate-100 dark:border-border-dark">
                    <p className="px-4 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Switch Identity</p>
                    <div className="space-y-0.5">
                        {accounts.map((acc, index) => (
                            <div key={acc.uid || index} className="flex items-center group/item px-2">
                                <button
                                    onClick={() => {
                                        if (acc.uid !== user.uid) {
                                            setIsOpen(false);
                                            switchAccount(acc.uid);
                                        }
                                    }}
                                    disabled={acc.uid === user.uid}
                                    className={`flex-1 flex items-center gap-2.5 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${acc.uid === user.uid ? "bg-primary/5 text-primary cursor-default" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                                >
                                    <div className={`size-5 rounded-md flex items-center justify-center font-black text-[8px] shrink-0 ${acc.uid === user.uid ? "bg-primary/10 text-primary" : "bg-slate-100 dark:bg-white/5"}`}>
                                        {acc.displayName?.charAt(0) || "U"}
                                    </div>
                                    <span className="truncate flex-1 text-left">{acc.displayName}</span>
                                    {acc.uid === user.uid && <div className="size-1.5 rounded-full bg-primary animate-pulse" />}
                                    {acc.uid !== user.uid && <Zap className="size-3 opacity-20 group-hover/item:opacity-50 transition-opacity" />}
                                </button>
                                
                                {acc.uid !== user.uid && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeAccount(acc.uid);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-rose-500 transition-all rounded-lg hover:bg-rose-500/5 group-hover/item:opacity-100"
                                        title="Forget Identity"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mt-1"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
