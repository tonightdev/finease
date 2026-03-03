"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "@/store";
import { setUser, updateUserProfile as reduxUpdateUserProfile } from "@/store/slices/userSlice";
import { fetchCategories } from "@/store/slices/categoriesSlice";
import { fetchAssetClasses } from "@/store/slices/assetClassesSlice";
import { fetchGoals } from "@/store/slices/goalsSlice";
import { RootState } from "@/store";
import api from "@/lib/api";
import type { AxiosError } from "axios";

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  gender?: string;
  dob?: string;
  phone?: string;
  budgetTargets?: {
    needs: number;
    wants: number;
    savings: number;
  };
}

interface ApiUserResponse {
  id?: string;
  uid?: string;
  email: string;
  displayName: string;
  photoURL?: string;
  gender?: string;
  dob?: string;
  budgetTargets?: {
    needs: number;
    wants: number;
    savings: number;
  };
}

interface ApiAuthResponse {
  user: ApiUserResponse;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  loginWithGoogle: (email?: string, name?: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => void;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildUser(userData: ApiUserResponse): AuthUser {
  return {
    uid: userData.id ?? userData.uid ?? "",
    email: userData.email,
    displayName: userData.displayName,
    photoURL:
      userData.photoURL ??
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.displayName || "User")}`,
    gender: userData.gender,
    dob: userData.dob,
    budgetTargets: userData.budgetTargets,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user.profile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("finease_token");
      if (token) {
        try {
          const res = await api.get<ApiUserResponse>("/finance/profile");
          dispatch(setUser(buildUser(res.data)));
          void dispatch(fetchCategories());
          void dispatch(fetchAssetClasses());
          void dispatch(fetchGoals());
        } catch {
          console.error("Failed to restore session");
          localStorage.removeItem("finease_token");
        }
      }
      setLoading(false);
    };

    void initAuth();
  }, [dispatch]);

  const loginWithGoogle = async (email?: string, name?: string, password?: string) => {
    try {
      const endpoint = name ? "/auth/signup" : "/auth/login";
      const payload = name
        ? { email, name, password: password ?? "password123" }
        : { email, password: password ?? "password123" };

      const res = await api.post<ApiAuthResponse>(endpoint, payload);
      const { user: userData, token } = res.data;

      localStorage.setItem("finease_token", token);
      dispatch(setUser(buildUser(userData)));

      void dispatch(fetchCategories());
      void dispatch(fetchAssetClasses());
      void dispatch(fetchGoals());
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message ?? axiosError.message;
      console.error("Auth error:", message);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem("finease_token");
    dispatch(setUser(null));
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    if (!user) return;
    try {
      await api.put("/finance/profile", updates);
      dispatch(reduxUpdateUserProfile(updates));
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const resetPassword = async (email: string, newPassword: string) => {
    try {
      await api.post("/auth/reset-password", { email, newPassword });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message ?? axiosError.message;
      console.error("Reset password error:", message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateProfile, resetPassword }}>
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
