"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  Fingerprint,
  ScanFace,
  MonitorSmartphone,
  Lock,
  Delete,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SplashScreen } from "@/components/ui/SplashScreen";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

export type LockType = "fingerprint" | "facelock" | "pin" | "biometric";

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

const DIAL_KEYS = [
  { num: "1", sub: "" },
  { num: "2", sub: "ABC" },
  { num: "3", sub: "DEF" },
  { num: "4", sub: "GHI" },
  { num: "5", sub: "JKL" },
  { num: "6", sub: "MNO" },
  { num: "7", sub: "PQRS" },
  { num: "8", sub: "TUV" },
  { num: "9", sub: "WXYZ" },
];

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isLockEnabled, setIsLockEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("finease_app_lock") === "true";
    }
    return false;
  });

  const [lockType, setLockType] = useState<LockType>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("finease_lock_type") as LockType;
      return stored || "biometric";
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
  const [isShake, setIsShake] = useState(false);
  const [isError, setIsError] = useState(false);
  const [usePinFallback, setUsePinFallback] = useState(false);
  const isAuthenticatingRef = useRef(false);

  const hasStoredPin =
    typeof window !== "undefined" && !!localStorage.getItem("finease_pin");

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

    if (
      isLocked &&
      (lockType === "fingerprint" ||
        lockType === "facelock" ||
        lockType === "biometric")
    ) {
      timer = setTimeout(() => {
        void authenticate();
      }, 500);
    } else {
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          const enabled = localStorage.getItem("finease_app_lock") === "true";
          const sessionAuthenticated =
            sessionStorage.getItem("finease_session_authenticated") === "true";
          if (enabled && !sessionAuthenticated) {
            setIsLocked(true);
            if (
              lockType === "fingerprint" ||
              lockType === "facelock" ||
              lockType === "biometric"
            ) {
              void authenticate();
            }
          }
        }
      };
      window.addEventListener("visibilitychange", handleVisibilityChange);

      const isAuthReady = !authLoading;
      const isDataReady = user ? accountsCount > 0 || !accountsLoading : true;

      if (isAuthReady && isDataReady) {
        timer = setTimeout(() => {
          setIsChecking(false);
        }, 600);
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
      if (typeof window === "undefined" || !window.PublicKeyCredential) {
        toast.error("Biometrics not supported on this browser");
        return false;
      }

      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        toast.error("No biometric sensor detected on this device");
        return false;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // WebAuthn configuration specifically enforcing local platform biometric
      // residentKey: "discouraged" prevents prompting for cloud passkeys in Google Password Manager
      const options: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: { name: "FinEase Vault" },
          user: {
            id: new Uint8Array(16),
            name: "vault@finease.local",
            displayName: "FinEase Vault",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 }, // ES256
            { type: "public-key", alg: -257 }, // RS256
          ],
          timeout: 60000,
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "discouraged",
            requireResidentKey: false,
          },
          attestation: "none",
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
    } catch (err: unknown) {
      const error = err as Error;
      if (error?.name === "NotAllowedError") {
        toast.error("Biometric authentication was cancelled");
      } else {
        toast.error("Biometric registration failed");
      }
      return false;
    }
  };

  const toggleLock = async (
    enabled: boolean,
    type: LockType = "fingerprint",
    pin?: string,
  ): Promise<boolean> => {
    if (enabled) {
      if (
        type === "fingerprint" ||
        type === "facelock" ||
        type === "biometric"
      ) {
        const isAppleFaceDevice =
          typeof window !== "undefined" &&
          /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
        const targetType =
          type === "facelock"
            ? "facelock"
            : type === "fingerprint"
              ? "fingerprint"
              : "biometric";
        const success = await registerCredential();
        if (success) {
          setIsLockEnabled(true);
          setLockType(targetType);
          localStorage.setItem("finease_app_lock", "true");
          localStorage.setItem("finease_lock_type", targetType);
          toast.success(
            targetType === "facelock" ||
              (targetType === "biometric" && isAppleFaceDevice)
              ? "Face Lock Activated"
              : "Biometric Lock Activated",
          );
          return true;
        }
        return false;
      } else if (type === "pin" && pin) {
        setIsLockEnabled(true);
        setLockType("pin");
        localStorage.setItem("finease_app_lock", "true");
        localStorage.setItem("finease_lock_type", "pin");
        localStorage.setItem("finease_pin", pin);
        toast.success("Security PIN Activated");
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
      toast.success("Vault Lock Deactivated");
      return true;
    }
  };

  const handlePinInput = useCallback((num: string) => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }

    setEnteredPin((prev) => {
      if (prev.length >= 4) return prev;
      const next = prev + num;

      if (next.length === 4) {
        const storedPin = localStorage.getItem("finease_pin");
        if (next === storedPin) {
          setIsLocked(false);
          sessionStorage.setItem("finease_session_authenticated", "true");
          toast.success("Vault Unlocked");
          return "";
        } else {
          setIsShake(true);
          setIsError(true);
          if (typeof window !== "undefined" && window.navigator?.vibrate) {
            window.navigator.vibrate([80, 50, 80]);
          }
          toast.error("Incorrect PIN. Try again.");
          setTimeout(() => setIsShake(false), 450);
          setTimeout(() => {
            setIsError(false);
            setEnteredPin("");
          }, 600);
          return next;
        }
      }
      return next;
    });
  }, []);

  const handleDeleteDigit = useCallback(() => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
    setEnteredPin((prev) => prev.slice(0, -1));
  }, []);

  // Physical Keyboard Listener for Web/Desktop
  useEffect(() => {
    if (!isLocked) return;
    const isShowingPin = lockType === "pin" || usePinFallback;
    if (!isShowingPin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when modifier keys are active
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handlePinInput(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleDeleteDigit();
      } else if (e.key === "Escape" && usePinFallback) {
        e.preventDefault();
        setUsePinFallback(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked, lockType, usePinFallback, handlePinInput, handleDeleteDigit]);

  const isAppleFaceDevice =
    typeof window !== "undefined" &&
    /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  const effectiveLockMode =
    lockType === "biometric"
      ? isAppleFaceDevice
        ? "facelock"
        : "fingerprint"
      : lockType;

  const activeLockMode = usePinFallback ? "pin" : effectiveLockMode;

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
            className="fixed inset-0 z-[200] bg-slate-50/95 dark:bg-[#050505]/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-y-auto"
          >
            <div className="w-full max-w-sm flex flex-col items-center my-auto">
              {/* Vault Header Icon */}
              <div className="relative mb-6">
                <div className="size-16 sm:size-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl shadow-primary/10">
                  {activeLockMode === "facelock" ? (
                    <ScanFace className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  ) : activeLockMode === "fingerprint" ? (
                    <Fingerprint className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  ) : (
                    <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2 text-center">
                FinEase Vault
              </h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-8 text-center">
                {activeLockMode === "facelock"
                  ? "Face Lock Verification"
                  : activeLockMode === "fingerprint"
                    ? "Fingerprint Verification"
                    : "Enter Security PIN"}
              </p>

              {/* View 1: PIN Unlock Pad (Web + Mobile) */}
              {activeLockMode === "pin" ? (
                <div className="w-full flex flex-col items-center space-y-8 sm:space-y-10">
                  {/* 4 Animated Indicator Dots */}
                  <motion.div
                    animate={isShake ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="flex justify-center gap-5 sm:gap-6"
                  >
                    {[0, 1, 2, 3].map((idx) => (
                      <motion.div
                        key={idx}
                        animate={{ scale: enteredPin.length > idx ? 1.15 : 1 }}
                        className={`size-4 sm:size-4.5 rounded-full border-2 transition-all duration-200 ${
                          isError
                            ? "border-rose-500 bg-rose-500 shadow-lg shadow-rose-500/40"
                            : enteredPin.length > idx
                              ? "bg-primary border-primary shadow-lg shadow-primary/30"
                              : "border-slate-300 dark:border-white/20 bg-transparent"
                        }`}
                      />
                    ))}
                  </motion.div>

                  {/* 3x4 Responsive Keypad Grid */}
                  <div className="grid grid-cols-3 gap-y-3.5 sm:gap-y-4 gap-x-5 sm:gap-x-7 w-full max-w-[280px] sm:max-w-[320px] mx-auto">
                    {DIAL_KEYS.map(({ num, sub }) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handlePinInput(num)}
                        className="size-16 sm:size-18 rounded-full mx-auto flex flex-col items-center justify-center bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 active:bg-primary/20 active:text-primary active:scale-95 transition-all shadow-sm hover:shadow select-none cursor-pointer"
                      >
                        <span className="text-2xl sm:text-[26px] font-black text-slate-800 dark:text-white leading-none">
                          {num}
                        </span>
                        {sub && (
                          <span className="text-[7.5px] sm:text-[8.5px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mt-0.5">
                            {sub}
                          </span>
                        )}
                      </button>
                    ))}

                    {/* Bottom Row: Quick Biometric Switch / Empty Slot */}
                    <div className="size-16 sm:size-18 mx-auto flex items-center justify-center">
                      {usePinFallback &&
                      (lockType === "fingerprint" ||
                        lockType === "facelock" ||
                        lockType === "biometric") ? (
                        <button
                          type="button"
                          onClick={() => {
                            setUsePinFallback(false);
                            setEnteredPin("");
                            void authenticate();
                          }}
                          className="size-14 sm:size-16 rounded-full flex items-center justify-center text-slate-500 hover:text-primary hover:bg-primary/10 active:scale-95 transition-all"
                          title="Switch back to Biometrics"
                        >
                          {lockType === "facelock" ? (
                            <ScanFace className="w-6 h-6 text-primary" />
                          ) : (
                            <Fingerprint className="w-6 h-6 text-primary" />
                          )}
                        </button>
                      ) : null}
                    </div>

                    {/* Digit 0 */}
                    <button
                      type="button"
                      onClick={() => handlePinInput("0")}
                      className="size-16 sm:size-18 rounded-full mx-auto flex flex-col items-center justify-center bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 active:bg-primary/20 active:text-primary active:scale-95 transition-all shadow-sm hover:shadow select-none cursor-pointer"
                    >
                      <span className="text-2xl sm:text-[26px] font-black text-slate-800 dark:text-white leading-none">
                        0
                      </span>
                    </button>

                    {/* Backspace / Delete Key */}
                    <button
                      type="button"
                      onClick={handleDeleteDigit}
                      className="size-16 sm:size-18 rounded-full mx-auto flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-90 transition-all select-none cursor-pointer"
                      aria-label="Delete digit"
                    >
                      <Delete className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>
                  </div>

                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                    Type on keyboard or tap numbers
                  </p>
                </div>
              ) : activeLockMode === "facelock" ? (
                /* View 2: Face Lock Screen */
                <div className="w-full flex flex-col items-center space-y-6">
                  <div className="relative size-36 sm:size-44 rounded-3xl bg-primary/5 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden">
                    {/* Scanner line animation */}
                    <motion.div
                      animate={{ y: [-50, 50, -50] }}
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_#135bec]"
                    />
                    <ScanFace className="w-20 h-20 text-primary opacity-80" />
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Facial Biometrics Active
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Looking for registered Face ID...
                    </p>
                  </div>

                  <div className="w-full space-y-3 pt-2">
                    <button
                      disabled={authenticating}
                      onClick={async () => {
                        const success = await authenticate();
                        if (!success) toast.error("Face authentication failed");
                      }}
                      className="w-full h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {authenticating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Face...</span>
                        </>
                      ) : (
                        <>
                          <ScanFace className="w-4 h-4" />
                          <span>Scan Face Again</span>
                        </>
                      )}
                    </button>

                    {hasStoredPin && (
                      <button
                        onClick={() => {
                          setUsePinFallback(true);
                          setEnteredPin("");
                        }}
                        className="w-full h-11 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-slate-400" />
                        <span>Use Security PIN Instead</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* View 3: Fingerprint Lock Screen */
                <div className="w-full flex flex-col items-center space-y-6">
                  <div className="relative size-36 sm:size-44 rounded-full flex items-center justify-center">
                    {/* Animated Pulsing Rings */}
                    <motion.div
                      animate={{
                        scale: [1, 1.25, 1],
                        opacity: [0.6, 0.15, 0.6],
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 rounded-full border-2 border-primary"
                    />
                    <motion.div
                      animate={{
                        scale: [1, 1.45, 1],
                        opacity: [0.4, 0.05, 0.4],
                      }}
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        delay: 0.3,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-0 rounded-full border border-primary/50"
                    />
                    <div className="size-24 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20">
                      <Fingerprint className="w-14 h-14 text-primary" />
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Fingerprint Scanner Active
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      Touch the biometric sensor to unlock
                    </p>
                  </div>

                  <div className="w-full space-y-3 pt-2">
                    <button
                      disabled={authenticating}
                      onClick={async () => {
                        const success = await authenticate();
                        if (!success) toast.error("Fingerprint scan failed");
                      }}
                      className="w-full h-12 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {authenticating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Verifying Fingerprint...</span>
                        </>
                      ) : (
                        <>
                          <Fingerprint className="w-4 h-4" />
                          <span>Touch to Scan</span>
                        </>
                      )}
                    </button>

                    {hasStoredPin && (
                      <button
                        onClick={() => {
                          setUsePinFallback(true);
                          setEnteredPin("");
                        }}
                        className="w-full h-11 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-slate-400" />
                        <span>Use Security PIN Instead</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Security Footer */}
              <div className="mt-8 sm:mt-10 flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                  <MonitorSmartphone className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-center">
                    Device-Level Sovereign Hardware Protection
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
                  className="text-[9px] font-bold text-rose-500/70 uppercase tracking-widest hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Sign out of this device
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
