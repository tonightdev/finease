"use client";

import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/app/loading";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // Redux loading states
  const accountsLoading = useSelector((state: RootState) => state.accounts.loading);
  const accountsCount = useSelector((state: RootState) => state.accounts.items.length);
  const transactionsLoading = useSelector((state: RootState) => state.transactions.loading);
  const transactionsCount = useSelector((state: RootState) => state.transactions.items.length);

  useEffect(() => {
    if (!authLoading && !user && pathname && !PUBLIC_ROUTES.includes(pathname)) {
      router.push("/");
    }
    
    // Auto-redirect logged-in users from landing to dashboard
    if (!authLoading && user && pathname === "/") {
      router.push("/dashboard");
    }
  }, [user, authLoading, pathname, router]);

  // is we are on a protected route
  const isProtectedRoute = pathname && !PUBLIC_ROUTES.includes(pathname);
  
  // High-level data loading check:
  // Show loader if Auth is strictly loading
  // OR if we are on a protected route and we have NO data yet AND an API call is in progress
  const isDataFetching = isProtectedRoute && (
    (accountsCount === 0 && accountsLoading) || 
    (transactionsCount === 0 && transactionsLoading)
  );

  if (authLoading || isDataFetching) {
    return <Loading />;
  }

  // If not loading, not user, and is not public route, it will redirect, but meanwhile return null to prevent flash
  if (!user && pathname && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
