"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Home,
  TrendingUp,
  FileText,
  Users,
  BarChart3,
  Trash2,
  Zap,
  Layers,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const userLinks = [
    { href: "/dashboard", label: "Home", Icon: Home },
    { href: "/portfolio", label: "Portfolio", Icon: TrendingUp },
    { href: "/strategies", label: "Strategies", Icon: Zap },
    { href: "/plans", label: "Plans", Icon: Layers },
    { href: "/reports", label: "Review", Icon: FileText },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Admin", Icon: BarChart3 },
    { href: "/admin/users", label: "Users", Icon: Users },
    { href: "/admin/purge", label: "Purge", Icon: Trash2 },
    { href: "/admin/reports", label: "Reports", Icon: FileText },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/85 dark:bg-[#020408]/85 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 px-2 sm:px-4 mb-0 flex justify-around items-center z-50 transition-all duration-300"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 0.4rem)",
        paddingTop: "0.45rem",
      }}
    >
      {links.map((link) => {
        const isActive =
          pathname?.startsWith(link.href) ||
          (link.href === "/dashboard" && pathname === "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "flex flex-col items-center justify-center gap-1 py-1 px-1.5 min-w-[48px] rounded-xl transition-all active:scale-90 touch-manipulation select-none",
              isActive
                ? "text-primary"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
            )}
          >
            <div className="relative">
              <link.Icon className="w-5 h-5 transition-transform" />
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-1 rounded-full bg-primary" />
              )}
            </div>
            <span
              className={clsx(
                "text-[9px] uppercase tracking-tight transition-colors",
                isActive ? "font-black text-primary" : "font-semibold",
              )}
            >
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
