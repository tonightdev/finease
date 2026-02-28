"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useAuth } from "@/components/auth/AuthProvider";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = [
    { href: "/dashboard", label: "Home", icon: "home" },
    { href: "/transactions", label: "Transact", icon: "currency_rupee" },
    { href: "/goals", label: "Goals", icon: "track_changes" },
    { href: "/portfolio", label: "Portfolio", icon: "trending_up" },
    { href: "/reports", label: "Reports", icon: "description" },
  ];

  if (!user) return null;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-border-dark px-6 py-3 flex justify-between items-center z-50">
      {links.map((link) => {
        const isActive = pathname?.startsWith(link.href) || (link.href === '/dashboard' && pathname === '/');
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "flex flex-col items-center gap-1 group transition-colors",
              isActive ? "text-primary" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
            )}
          >
            <span className="material-symbols-outlined">{link.icon}</span>
            <span className="text-[10px] font-medium">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
