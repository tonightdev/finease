"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, updateUserProfile as reduxUpdateUserProfile } from "@/store/slices/userSlice";
import { RootState } from "@/store";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  gender?: string;
  dob?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (email?: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.profile);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const loginWithGoogle = async (email?: string, name?: string) => {
    const cleanName = name || (email ? (email.split("@")[0] || "User") : "Dhaval Pithwa");
    const cleanEmail = email || "dhavalpithwa@gmail.com";
    
    const mockUser: User = {
      uid: "local-mock-uid",
      email: cleanEmail,
      displayName: cleanName,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanName)}`,
    };
    dispatch(setUser(mockUser));
  };

  const logout = async () => {
    dispatch(setUser(null));
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!user) return;
    dispatch(reduxUpdateUserProfile(updates));
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateProfile }}>
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
