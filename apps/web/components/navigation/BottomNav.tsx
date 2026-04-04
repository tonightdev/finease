"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Home,
  IndianRupee,
  Target,
  TrendingUp,
  FileText,
  Users,
  BarChart3,
  Trash2,
  Zap,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const userLinks = [
    { href: "/dashboard", label: "Dashboard", Icon: Home },
    { href: "/simulation", label: "Strategy", Icon: Zap },
    { href: "/transactions", label: "Transact", Icon: IndianRupee },
    { href: "/goals", label: "Goals", Icon: Target },
    { href: "/portfolio", label: "Portfolio", Icon: TrendingUp },
    { href: "/reports", label: "Reports", Icon: FileText },
  ];

  const adminLinks = [
    { href: "/admin/dashboard", label: "Admin", Icon: BarChart3 },
    { href: "/admin/users", label: "Users", Icon: Users },
    { href: "/admin/purge", label: "Purge", Icon: Trash2 },
    { href: "/admin/reports", label: "Reports", Icon: FileText },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-border-dark px-6 py-3 flex justify-between items-center z-50">
      {links.map((link) => {
        const isActive =
          pathname?.startsWith(link.href) ||
          (link.href === "/dashboard" && pathname === "/");
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "flex flex-col items-center gap-1 group transition-colors",
              isActive
                ? "text-primary"
                : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white",
            )}
          >
            <link.Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
