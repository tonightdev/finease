"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Home,
  IndianRupee,
  TrendingUp,
  FileText,
  Users,
  BarChart3,
  Trash2,
  Zap,
  Layers
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
    { href: "/transactions", label: "Transact", Icon: IndianRupee },
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-[#020408]/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/5 px-4 mb-0 flex justify-between items-center z-50 transition-all duration-300"
         style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)', paddingTop: '0.5rem' }}>
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
            <link.Icon className="w-4.5 h-4.5" />
            <span className="text-[8px] font-black uppercase tracking-tighter">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
