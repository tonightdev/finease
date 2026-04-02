"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Fingerprint, MonitorSmartphone, Lock, Delete } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SplashScreen } from "@/components/ui/SplashScreen";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

type LockType = "biometric" | "pin";

interface SecurityContextType {
  isLocked: boolean;
  isLockEnabled: boolean;
  lockType: LockType;
  toggleLock: (
    enabled: boolean,
    type?: LockType,
    pin?: string,
  ) => Promise<boolean>;
  authenticate: () => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(
  undefined,
);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isLockEnabled, setIsLockEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("finease_app_lock") === "true";
    }
    return false;
  });
  const [lockType, setLockType] = useState<LockType>(() => {
    if (typeof window !== "undefined") {
      return (
        (localStorage.getItem("finease_lock_type") as LockType) || "biometric"
      );
    }
    return "biometric";
  });
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window !== "undefined") {
      const enabled = localStorage.getItem("finease_app_lock") === "true";
      const sessionAuthenticated =
        sessionStorage.getItem("finease_session_authenticated") === "true";
      return enabled && !sessionAuthenticated;
    }
    return false;
  });
  const [isChecking, setIsChecking] = useState(true);
  const [enteredPin, setEnteredPin] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const isAuthenticatingRef = React.useRef(false);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (lockType === "pin" || isAuthenticatingRef.current) return false;

    try {
      isAuthenticatingRef.current = true;
      setAuthenticating(true);

      if (typeof window === "undefined" || !window.PublicKeyCredential) {
        setIsLocked(false);
        isAuthenticatingRef.current = false;
        setAuthenticating(false);
        return true;
      }

      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setIsLocked(false);
        isAuthenticatingRef.current = false;
        setAuthenticating(false);
        return true;
      }

      const credentialId = localStorage.getItem("finease_credential_id");
      if (!credentialId) {
        isAuthenticatingRef.current = false;
        setAuthenticating(false);
        return false;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const uint8Id = Uint8Array.from(atob(credentialId), (c) =>
        c.charCodeAt(0),
      );
      const options: CredentialRequestOptions = {
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: uint8Id,
              type: "public-key",
              transports: ["internal"],
            },
          ],
          userVerification: "required",
          timeout: 60000,
        },
      };

      const assertion = await navigator.credentials.get(options);
      if (assertion) {
        setIsLocked(false);
        sessionStorage.setItem("finease_session_authenticated", "true");
        isAuthenticatingRef.current = false;
        setAuthenticating(false);
        return true;
      }

      isAuthenticatingRef.current = false;
      setAuthenticating(false);
      return false;
    } catch {
      isAuthenticatingRef.current = false;
      setAuthenticating(false);
      return false;
    }
  }, [lockType]);

  const { user, loading: authLoading } = useAuth();
  const accountsLoading = useSelector(
    (state: RootState) => state.accounts.loading,
  );
  const accountsCount = useSelector(
    (state: RootState) => state.accounts.items.length,
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (isLocked && lockType === "biometric") {
      timer = setTimeout(() => {
        void authenticate();
      }, 500); // Give some time for the screen to mount
    } else {
      // Re-check lock status on visibility change (for PWA resume)
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          const enabled = localStorage.getItem("finease_app_lock") === "true";
          const sessionAuthenticated = sessionStorage.getItem("finease_session_authenticated") === "true";
          if (enabled && !sessionAuthenticated) {
             setIsLocked(true);
             if (lockType === "biometric") void authenticate();
          }
        }
      };
      window.addEventListener("visibilitychange", handleVisibilityChange);
      
      // Wait for Auth AND Data (if logged in) to prevent "blink"
      const isAuthReady = !authLoading;
      const isDataReady = user ? accountsCount > 0 || !accountsLoading : true;

      if (isAuthReady && isDataReady) {
        timer = setTimeout(() => {
          setIsChecking(false);
        }, 600); // Buffer for animations
      }
      return () => {
        window.removeEventListener("visibilitychange", handleVisibilityChange);
        if (timer) clearTimeout(timer);
      };
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    authenticate,
    isLocked,
    lockType,
    authLoading,
    user,
    accountsLoading,
    accountsCount,
  ]);

  const registerCredential = async (): Promise<boolean> => {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const options: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: { name: "FinEase" },
          user: {
            id: new Uint8Array(16),
            name: "user@finease.io",
            displayName: "FinEase User",
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          excludeCredentials: localStorage.getItem("finease_credential_id")
            ? [
                {
                  id: Uint8Array.from(
                    atob(localStorage.getItem("finease_credential_id")!),
                    (c) => c.charCodeAt(0),
                  ),
                  type: "public-key",
                },
              ]
            : [],
        },
      };

      const credential = (await navigator.credentials.create(
        options,
      )) as PublicKeyCredential;
      if (credential) {
        const idBase64 = btoa(
          String.fromCharCode(...new Uint8Array(credential.rawId)),
        );
        localStorage.setItem("finease_credential_id", idBase64);
        setIsLocked(false);
        sessionStorage.setItem("finease_session_authenticated", "true");
        return true;
      }
      return false;
    } catch {
      // Local registration failure. Handled via false return.
      return false;
    }
  };

  const toggleLock = async (
    enabled: boolean,
    type: LockType = "biometric",
    pin?: string,
  ): Promise<boolean> => {
    if (enabled) {
      if (type === "biometric") {
        const success = await registerCredential();
        if (success) {
          setIsLockEnabled(true);
          setLockType("biometric");
          localStorage.setItem("finease_app_lock", "true");
          localStorage.setItem("finease_lock_type", "biometric");
          toast.success("Security Shield Activated");
          return true;
        }
        toast.error("Biometric registration failed");
        return false;
      } else if (type === "pin" && pin) {
        setIsLockEnabled(true);
        setLockType("pin");
        localStorage.setItem("finease_app_lock", "true");
        localStorage.setItem("finease_lock_type", "pin");
        localStorage.setItem("finease_pin", pin);
        toast.success("PIN Security Activated");
        return true;
      }
      return false;
    } else {
      setIsLockEnabled(false);
      localStorage.removeItem("finease_app_lock");
      localStorage.removeItem("finease_credential_id");
      localStorage.removeItem("finease_lock_type");
      localStorage.removeItem("finease_pin");
      sessionStorage.removeItem("finease_session_authenticated");
      toast.success("App Lock Deactivated");
      return true;
    }
  };

  const handlePinInput = (num: string) => {
    if (enteredPin.length < 4) {
      const newPin = enteredPin + num;
      setEnteredPin(newPin);

      if (newPin.length === 4) {
        const storedPin = localStorage.getItem("finease_pin");
        if (newPin === storedPin) {
          setIsLocked(false);
          sessionStorage.setItem("finease_session_authenticated", "true");
          setEnteredPin("");
        } else {
          toast.error("Invalid PIN");
          setEnteredPin("");
          if (window.navigator?.vibrate) window.navigator.vibrate(200);
        }
      }
    }
  };

  return (
    <SecurityContext.Provider
      value={{ isLocked, isLockEnabled, lockType, toggleLock, authenticate }}
    >
      <AnimatePresence mode="wait">
        {isChecking ? (
          <motion.div
            key="loading"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999]"
          >
            <SplashScreen />
          </motion.div>
        ) : isLocked ? (
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white dark:bg-[#050505] flex flex-col items-center justify-center p-6 select-none"
          >
            <div className="w-full max-w-sm flex flex-col items-center">
              <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Lock className="w-8 h-8" />
              </div>

              <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                Vault Locked
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10">
                {lockType === "biometric"
                  ? "Biometric verification required"
                  : "Enter security PIN"}
              </p>

              {lockType === "pin" ? (
                <div className="w-full space-y-12">
                  <div className="flex justify-center gap-6">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`size-4 rounded-full border-2 transition-all duration-200 ${
                          enteredPin.length > idx
                            ? "bg-primary border-primary scale-110 shadow-lg shadow-primary/20"
                            : "border-slate-200 dark:border-white/10"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => handlePinInput(num.toString())}
                        className="aspect-square rounded-full flex items-center justify-center text-xl font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 active:bg-primary/10 active:text-primary transition-all"
                      >
                        {num}
                      </button>
                    ))}
                    <div />
                    <button
                      onClick={() => handlePinInput("0")}
                      className="aspect-square rounded-full flex items-center justify-center text-xl font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 active:bg-primary/10 active:text-primary transition-all"
                    >
                      0
                    </button>
                    <button
                      onClick={() => setEnteredPin(enteredPin.slice(0, -1))}
                      className="aspect-square rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                    >
                      <Delete className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <Fingerprint className="w-12 h-12 text-primary opacity-50" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Waiting for biometrics...</span>
                  </div>
                  
                  <button
                    disabled={authenticating}
                    onClick={async () => {
                      const success = await authenticate();
                      if (!success) toast.error("Authentication Failed");
                    }}
                    className="mt-4 text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                  >
                    {authenticating ? "Verifying..." : "Retry Biometrics"}
                  </button>
                </div>
              )}

              <div className="mt-12 flex flex-col items-center gap-6">
                <div className="flex items-center gap-2 text-slate-400">
                  <MonitorSmartphone className="w-4 h-4" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-center">
                    Protected via Sovereign AES-256
                  </span>
                </div>

                <button
                  onClick={() => {
                    localStorage.removeItem("finease_app_lock");
                    localStorage.removeItem("finease_lock_type");
                    localStorage.removeItem("finease_pin");
                    sessionStorage.removeItem("finease_session_authenticated");
                    window.location.href = "/login";
                  }}
                  className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest hover:text-rose-500 transition-colors"
                >
                  Sign out of device
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          children
        )}
      </AnimatePresence>
    </SecurityContext.Provider>
  );
}

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context)
    throw new Error("useSecurity must be used within SecurityProvider");
  return context;
};
