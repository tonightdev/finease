"use client";

import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname && !PUBLIC_ROUTES.includes(pathname)) {
      router.push("/");
    }
    
    // Auto-redirect logged-in users from landing to dashboard
    if (!loading && user && pathname === "/") {
      router.push("/dashboard");
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="size-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not loading, not user, and is not public route, it will redirect, but meanwhile return null to prevent flash
  if (!user && pathname && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
