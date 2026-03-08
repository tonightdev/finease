"use client";

import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/app/loading";


const PUBLIC_ROUTES = ["/", "/login", "/signup"];

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      !authLoading &&
      !user &&
      pathname &&
      !PUBLIC_ROUTES.includes(pathname)
    ) {
      router.push("/");
      return;
    }

    // Admin route protection: Kicking non-admins out of /admin routes
    if (
      !authLoading &&
      user &&
      pathname?.startsWith("/admin") &&
      user.role !== "admin"
    ) {
      router.push("/dashboard");
      return;
    }

    // User route protection: Kicking admins out of regular user routes
    const USER_ONLY_ROUTES = [
      "/dashboard",
      "/transactions",
      "/accounts",
      "/portfolio",
      "/goals",
      "/settings",
    ];
    if (
      !authLoading &&
      user &&
      user.role === "admin" &&
      USER_ONLY_ROUTES.some((route) => pathname?.startsWith(route))
    ) {
      router.push("/admin/dashboard");
      return;
    }

    // Auto-redirect logged-in users from public routes to their respective dashboards
    if (!authLoading && user && pathname && PUBLIC_ROUTES.includes(pathname)) {
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, pathname, router]);

  if (authLoading) {
    return <Loading />;
  }

  // If not loading, not user, and is not public route, it will redirect, but meanwhile return null to prevent flash
  if (!user && pathname && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  // If logged in and on a public route, prevent flashing public content while redirecting
  if (user && pathname && PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
