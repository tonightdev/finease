"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

export function TopNav() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Command Center" },
    { href: "/goals", label: "North Star" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/transactions", label: "Transactions" },
    { href: "/reports", label: "Reports" },
  ];

  return (
    <nav className="hidden lg:flex items-center gap-8">
      {navLinks.map((link) => {
        const isActive = pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "text-sm transition-colors",
              isActive
                ? "font-bold text-primary"
                : "font-medium text-slate-500 hover:text-primary"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
