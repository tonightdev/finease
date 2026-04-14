"use client";

import { useAuth } from "./AuthProvider";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loading from "@/app/loading";

import toast from "react-hot-toast";

const PUBLIC_ROUTES = ["/", "/login", "/signup"];

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (authLoading || !isHydrated) return;

    if (
      !user &&
      pathname &&
      !PUBLIC_ROUTES.includes(pathname)
    ) {
      toast.error("Logged out");
      router.push("/");
      return;
    }

    // Admin route protection: Kicking non-admins out of /admin routes
    if (
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
    ];
    if (
      user &&
      user.role === "admin" &&
      USER_ONLY_ROUTES.some((route) => pathname?.startsWith(route))
    ) {
      router.push("/admin/dashboard");
      return;
    }

    // Auto-redirect logged-in users from public routes to their respective dashboards
    if (user && pathname && PUBLIC_ROUTES.includes(pathname)) {
      // Special case: /login?mode=add allows logged-in users to add another account
      if (pathname === "/login" && searchParams.get("mode") === "add") {
        return;
      }

      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, pathname, router, searchParams, isHydrated]);

  if (authLoading || !isHydrated) {
    return <Loading />;
  }

  // If not user, and is not public route, it will redirect, but meanwhile return null to prevent flash
  if (!user && pathname && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  // If logged in and on a public route, prevent flashing public content while redirecting
  // EXCEPT for /login?mode=add which is allowed for logged-in users
  if (user && pathname && PUBLIC_ROUTES.includes(pathname)) {
    if (pathname === "/login" && searchParams.get("mode") === "add") {
      return <>{children}</>;
    }
    return null;
  }

  // User route protection in render body to prevent flash/API calls
  if (user) {
    if (pathname?.startsWith("/admin") && user.role !== "admin") {
      return null;
    }
    const USER_ONLY_ROUTES = ["/dashboard", "/transactions", "/accounts", "/portfolio", "/goals"];
    if (user.role === "admin" && USER_ONLY_ROUTES.some((route) => pathname?.startsWith(route))) {
      return null;
    }
  }

  return <>{children}</>;
}
