"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store";
import {
  setUser,
  updateUserProfile as reduxUpdateUserProfile,
} from "@/store/slices/userSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchAssetClasses } from "@/store/slices/assetClassesSlice";
import { fetchGoals } from "@/store/slices/goalsSlice";
import { RootState } from "@/store";
import api from "@/lib/api";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  gender?: string;
  dob?: string;
  phone?: string;
  monthStartDate?: number;
  role?: string;
  budgetTargets?: {
    needs: number;
    wants: number;
    savings: number;
  };
  hasOnboarded?: boolean;
}

interface ApiUserResponse {
  id?: string;
  uid?: string;
  email: string;
  displayName: string;
  role?: string;
  photoURL?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  monthStartDate?: number;
  budgetTargets?: {
    needs: number;
    wants: number;
    savings: number;
  };
  hasOnboarded?: boolean;
}

interface ApiAuthResponse {
  user: ApiUserResponse;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginWithGoogle: (
    email?: string,
    name?: string,
    password?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => void;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  accounts: AuthUser[];
  switchAccount: (uid: string) => Promise<void>;
  authorizeSubNode: (uid: string) => Promise<void>;
  removeAccount: (uid: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildUser(userData: ApiUserResponse): AuthUser {
  const uid = userData.id ?? userData.uid;
  if (!uid) {
    console.warn("API returned user without ID/UID, generating fallback", userData.email);
  }
  return {
    uid: uid || `tmp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: userData.email,
    displayName: userData.displayName,
    role: userData.role,
    photoURL:
      userData.photoURL ??
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.displayName || "User")}`,
    gender: userData.gender,
    dob: userData.dob,
    phone: userData.phone,
    monthStartDate: userData.monthStartDate,
    budgetTargets: userData.budgetTargets,
    hasOnboarded: userData.hasOnboarded,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.profile);
  const [accounts, setAccounts] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("finease_token");
      
      const storedAccounts = localStorage.getItem("finease_multi_accounts");
      
      if (storedAccounts) {
        try {
          const parsed = JSON.parse(storedAccounts);
          if (Array.isArray(parsed)) {
            // Sanitize: filter out entries with empty UIDs
            const sanitized = parsed.filter(a => !!a.uid);
            setAccounts(sanitized);
          }
        } catch (e) {
          console.error("Failed to parse stored accounts", e);
        }
      }

      if (token) {
        try {
          const res = await api.get<ApiUserResponse>("/finance/profile");
          const activeUser = buildUser(res.data);
          dispatch(setUser(activeUser));
          
          // Sync accounts list
          setAccounts(prev => {
            const exists = prev.find(a => a.uid === activeUser.uid);
            const updated = exists 
              ? prev.map(a => a.uid === activeUser.uid ? { ...a, ...activeUser } : a)
              : [...prev, activeUser];
            localStorage.setItem("finease_multi_accounts", JSON.stringify(updated));
            return updated;
          });

          // Fetch data in background without blocking initial render
          void dispatch(fetchCategories());
          void dispatch(fetchAssetClasses());
          void dispatch(fetchGoals());
        } catch (err: unknown) {
          const axiosError = err as { response?: { status?: number } };
          // Only logout on 401 Unauthorized
          // Handle 401 Unauthorized
          if (axiosError.response?.status === 401) {
            localStorage.removeItem("finease_token");
            dispatch({ type: "USER_LOGOUT" });
          }
          // Handle 403 Forbidden (Role mismatch during switch)
          if (axiosError.response?.status === 403) {
            window.location.href = "/dashboard";
          }
          console.error("Profile fetch failed:", err);
        }
      }
      setLoading(false);
    };

    const handleAuthFailure = () => {
      dispatch({ type: "USER_LOGOUT" });
      dispatch(setUser(null));
    };

    window.addEventListener("finease-auth-failure", handleAuthFailure);
    void initAuth();
    return () => {
      window.removeEventListener("finease-auth-failure", handleAuthFailure);
    };
  }, [dispatch]);

  const loginWithGoogle = async (
    email?: string,
    name?: string,
    password?: string,
  ) => {
    const endpoint = name ? "/auth/signup" : "/auth/login";
    const payload = name
      ? { email, name, password: password ?? "password123" }
      : { email, password: password ?? "password123" };

    const res = await api.post<ApiAuthResponse>(endpoint, payload);
    const { user: userData, token } = res.data;

    const loggedUser = buildUser(userData);
    localStorage.setItem("finease_token", token);
    
    // Store token-mapping for switching
    const tokenMap = JSON.parse(localStorage.getItem("finease_token_map") || "{}");
    tokenMap[loggedUser.uid] = token;
    localStorage.setItem("finease_token_map", JSON.stringify(tokenMap));

    dispatch(setUser(loggedUser));
    setAccounts(prev => {
        const updated = prev.find(a => a.uid === loggedUser.uid) 
            ? prev.map(a => a.uid === loggedUser.uid ? loggedUser : a)
            : [...prev, loggedUser];
        localStorage.setItem("finease_multi_accounts", JSON.stringify(updated));
        return updated;
    });

    void dispatch(fetchCategories());
    void dispatch(fetchAssetClasses());
    void dispatch(fetchGoals());
  };

  const logout = async () => {
    const currentUid = user?.uid;
    localStorage.removeItem("finease_token");
    
    if (currentUid) {
      const tokenMap = JSON.parse(localStorage.getItem("finease_token_map") || "{}");
      delete tokenMap[currentUid];
      localStorage.setItem("finease_token_map", JSON.stringify(tokenMap));
      
      const remainingUids = Object.keys(tokenMap);
      if (remainingUids.length > 0) {
        // Switch to the next available account
        const nextUid = remainingUids[0];
        const nextToken = tokenMap[nextUid!];
        localStorage.setItem("finease_token", nextToken);
        
        setAccounts(prev => {
          const updated = prev.filter(a => a.uid !== currentUid);
          localStorage.setItem("finease_multi_accounts", JSON.stringify(updated));
          return updated;
        });
        
        window.location.reload();
        return;
      }
    }

    // Full sign out if no other accounts
    setAccounts([]);
    localStorage.removeItem("finease_multi_accounts");
    localStorage.removeItem("finease_token_map");
    dispatch({ type: "USER_LOGOUT" });
    dispatch(setUser(null));
  };

  const switchAccount = async (uid: string) => {
    const tokenMap = JSON.parse(
      localStorage.getItem("finease_token_map") || "{}",
    );
    const token = tokenMap[uid];
    if (token) {
      localStorage.setItem("finease_token", token);
      window.location.reload(); // Simplest way to re-init everything with new token
    }
  };

  const removeAccount = (uid: string) => {
    const tokenMap = JSON.parse(localStorage.getItem("finease_token_map") || "{}");
    const activeUid = user?.uid;

    if (uid === activeUid) {
      // If we're removing the active account, just perform a logout (which handles switching)
      void logout();
      return;
    }

    // Otherwise, just remove it from the background list
    delete tokenMap[uid];
    localStorage.setItem("finease_token_map", JSON.stringify(tokenMap));

    setAccounts(prev => {
      const updated = prev.filter(a => a.uid !== uid);
      localStorage.setItem("finease_multi_accounts", JSON.stringify(updated));
      return updated;
    });
  };

  const authorizeSubNode = async (uid: string) => {
    try {
      const res = await api.post<{ token: string }>(`/admin/impersonate/${uid}`);
      const { token } = res.data;

      // Temporarily swap tokens to fetch the new profile
      const originalToken = localStorage.getItem("finease_token");
      localStorage.setItem("finease_token", token);
      const profileRes = await api.get<ApiUserResponse>("/finance/profile");
      const subUser = buildUser(profileRes.data);

      // Restore original token
      if (originalToken) localStorage.setItem("finease_token", originalToken);
      else localStorage.removeItem("finease_token");

      // Store in token map
      const tokenMap = JSON.parse(
        localStorage.getItem("finease_token_map") || "{}",
      );
      tokenMap[subUser.uid] = token;
      localStorage.setItem("finease_token_map", JSON.stringify(tokenMap));

      // Add to accounts
      setAccounts((prev) => {
        const updated = prev.find((a) => a.uid === subUser.uid)
          ? prev.map((a) => (a.uid === subUser.uid ? subUser : a))
          : [...prev, subUser];
        localStorage.setItem("finease_multi_accounts", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Sub-Node Authorization Failed", err);
      throw err;
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return;
    try {
      await api.put("/finance/profile", updates);
      dispatch(reduxUpdateUserProfile(updates));
    } catch {
      // Failed to update profile
    }
  };

  const resetPassword = async (email: string, newPassword: string) => {
    await api.post("/auth/reset-password", { email, newPassword });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        logout,
        updateProfile,
        resetPassword,
        accounts,
        switchAccount,
        authorizeSubNode,
        removeAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
