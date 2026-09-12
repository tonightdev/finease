import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Fingerprint,
  ScanFace,
  KeyRound,
  ArrowLeft,
  Delete,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useSecurity } from "@/components/providers/SecurityProvider";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { Button } from "@/components/ui/Button";
import { SessionList } from "@/components/dashboard/SessionList";
import { SettingsCard } from "./SettingsCard";
import { SettingsOptionCard } from "./SettingsOptionCard";

export function SecurityTab() {
  const { isLockEnabled, lockType, toggleLock } = useSecurity();
  const { permission, requestPermission } = useNotifications();

  // PIN Setup Modal state
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [setupPin, setSetupPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [setupStep, setSetupStep] = useState<1 | 2>(1);
  const [setupError, setSetupError] = useState(false);

  // Dynamic device-based biometric detection
  const [deviceBiometric, setDeviceBiometric] = useState<{
    label: string;
    sublabel: string;
    isFace: boolean;
  }>({
    label: "Biometric Lock",
    sublabel: "Touch ID / Face ID / Sensor",
    isFace: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(ua);
      const isMac = /macintosh|mac os x/.test(ua) && !isIOS;
      const isAndroid = /android/.test(ua);
      const isWindows = /windows/.test(ua);

      if (isIOS) {
        setDeviceBiometric({
          label: "Face ID / Touch ID",
          sublabel: "Apple Hardware Authentication",
          isFace: true,
        });
      } else if (isMac) {
        setDeviceBiometric({
          label: "Touch ID / Sensor",
          sublabel: "macOS Biometric Sensor",
          isFace: false,
        });
      } else if (isWindows) {
        setDeviceBiometric({
          label: "Windows Hello",
          sublabel: "Facial / Fingerprint Sensor",
          isFace: false,
        });
      } else if (isAndroid) {
        setDeviceBiometric({
          label: "Fingerprint / Face",
          sublabel: "Android Biometrics",
          isFace: false,
        });
      } else {
        setDeviceBiometric({
          label: "Biometric Hardware",
          sublabel: "Device Sensor Authentication",
          isFace: false,
        });
      }
    }
  }, []);

  const handleClosePinSetup = useCallback(() => {
    setShowPinSetup(false);
    setSetupPin("");
    setConfirmPin("");
    setSetupStep(1);
    setSetupError(false);
  }, []);

  const handleSetupPinInput = useCallback(
    async (num: string) => {
      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate(10);
      }

      if (setupStep === 1) {
        if (setupPin.length < 4) {
          const next = setupPin + num;
          setSetupPin(next);
          if (next.length === 4) {
            setTimeout(() => setSetupStep(2), 220);
          }
        }
      } else {
        if (confirmPin.length < 4) {
          const next = confirmPin + num;
          setConfirmPin(next);
          if (next.length === 4) {
            if (next === setupPin) {
              const success = await toggleLock(true, "pin", next);
              if (success) {
                toast.success("Security PIN configured successfully");
                handleClosePinSetup();
              }
            } else {
              setSetupError(true);
              if (typeof window !== "undefined" && window.navigator?.vibrate) {
                window.navigator.vibrate([80, 50, 80]);
              }
              toast.error("PINs do not match. Please try again.");
              setTimeout(() => {
                setSetupError(false);
                setConfirmPin("");
                setSetupPin("");
                setSetupStep(1);
              }, 600);
            }
          }
        }
      }
    },
    [setupStep, setupPin, confirmPin, toggleLock, handleClosePinSetup],
  );

  const handleSetupPinDelete = useCallback(() => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      window.navigator.vibrate(10);
    }
    if (setupStep === 1) {
      setSetupPin((p) => p.slice(0, -1));
    } else {
      if (confirmPin.length > 0) {
        setConfirmPin((p) => p.slice(0, -1));
      } else {
        setSetupStep(1);
      }
    }
  }, [setupStep, confirmPin.length]);

  // Physical Keyboard Listener during PIN Setup
  useEffect(() => {
    if (!showPinSetup) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        void handleSetupPinInput(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleSetupPinDelete();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClosePinSetup();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showPinSetup,
    handleSetupPinInput,
    handleSetupPinDelete,
    handleClosePinSetup,
  ]);

  const isBiometricActive =
    isLockEnabled &&
    (lockType === "biometric" ||
      lockType === "fingerprint" ||
      lockType === "facelock");

  const isPinActive = isLockEnabled && lockType === "pin";

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. App Vault Lock Card */}
      <SettingsCard
        icon={Shield}
        title="Application Vault Lock"
        subtitle="Hardware-level authentication for your identity node"
        headerAction={
          isLockEnabled ? (
            <Button
              onClick={() => toggleLock(false)}
              variant="outline"
              className="h-8 px-4 rounded-xl font-black text-[8px] uppercase tracking-widest border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-none"
            >
              Deactivate
            </Button>
          ) : undefined
        }
      >
        {/* Exactly 2 Cards: Dynamic Biometric Card & PIN Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SettingsOptionCard
            icon={deviceBiometric.isFace ? ScanFace : Fingerprint}
            title={deviceBiometric.label}
            subtitle={deviceBiometric.sublabel}
            selected={isBiometricActive}
            onClick={() => toggleLock(true, "biometric")}
          />

          <SettingsOptionCard
            icon={Shield}
            title="Security PIN"
            subtitle="4-Digit Master Code"
            selected={isPinActive}
            onClick={() => {
              setSetupStep(1);
              setSetupPin("");
              setConfirmPin("");
              setShowPinSetup(true);
            }}
          />
        </div>
      </SettingsCard>

      {/* 2. Expiry Protocol Configuration Card */}
      <SettingsCard
        icon={Bell}
        title="Intelligent Expiries"
        subtitle="Receive architectural reminders and synchronization alerts directly to your device"
        headerAction={
          <Button
            onClick={requestPermission}
            disabled={permission === "granted"}
            variant={permission === "granted" ? "outline" : "primary"}
            className={`h-9 px-5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
              permission === "granted"
                ? "border-emerald-500/20 text-emerald-500 cursor-default opacity-80"
                : "shadow-md shadow-primary/20"
            }`}
          >
            {permission === "granted" ? "Operational" : "Authorize"}
          </Button>
        }
      >
        {permission === "denied" && (
          <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20">
            Access Denied. Please enable notifications in your browser/device
            settings to resume synchronization.
          </p>
        )}
      </SettingsCard>

      {/* 3. Active Authorization Sessions */}
      <SessionList />

      {/* 2-Step PIN Setup Modal */}
      <AnimatePresence>
        {showPinSetup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
              onClick={handleClosePinSetup}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 overflow-hidden select-none"
            >
              <div className="relative space-y-6 text-center">
                {/* Header Icon & Step Badge */}
                <div className="space-y-2">
                  <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/10">
                    <KeyRound size={26} />
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest">
                    Step {setupStep} of 2:{" "}
                    {setupStep === 1 ? "Create PIN" : "Confirm PIN"}
                  </div>
                  <h5 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                    {setupStep === 1 ? "Set Security PIN" : "Confirm Your PIN"}
                  </h5>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    {setupStep === 1
                      ? "Choose a 4-digit code to protect your vault"
                      : "Re-enter the 4-digit code to verify"}
                  </p>
                </div>

                {/* 4 Animated PIN Dots */}
                <motion.div
                  animate={setupError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="flex justify-center gap-4 sm:gap-5"
                >
                  {[0, 1, 2, 3].map((i) => {
                    const currentLength =
                      setupStep === 1 ? setupPin.length : confirmPin.length;
                    return (
                      <div
                        key={i}
                        className={`size-4 rounded-full border-2 transition-all duration-200 ${
                          setupError
                            ? "border-rose-500 bg-rose-500 shadow-lg shadow-rose-500/40"
                            : currentLength > i
                              ? "bg-primary border-primary scale-110 shadow-lg shadow-primary/30"
                              : "border-slate-300 dark:border-white/20"
                        }`}
                      />
                    );
                  })}
                </motion.div>

                {/* 3x4 Responsive Grid Keypad */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-[260px] mx-auto">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => void handleSetupPinInput(num)}
                      className="h-13 rounded-2xl font-black text-lg bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 active:bg-primary/20 active:text-primary active:scale-95 transition-all cursor-pointer select-none"
                    >
                      {num}
                    </button>
                  ))}

                  {/* Bottom Row: Back to step 1 (if in step 2) or Clear, 0, Delete */}
                  <div className="flex items-center justify-center">
                    {setupStep === 2 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSetupStep(1);
                          setConfirmPin("");
                        }}
                        className="size-12 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 active:scale-95 transition-all cursor-pointer"
                        title="Back to Step 1"
                      >
                        <ArrowLeft size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSetupPin("")}
                        className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSetupPinInput("0")}
                    className="h-13 rounded-2xl font-black text-lg bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 active:bg-primary/20 active:text-primary active:scale-95 transition-all cursor-pointer select-none"
                  >
                    0
                  </button>

                  <button
                    type="button"
                    onClick={handleSetupPinDelete}
                    className="h-13 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-90 transition-all cursor-pointer select-none"
                    aria-label="Delete digit"
                  >
                    <Delete size={20} />
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleClosePinSetup}
                    className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    Cancel Operation
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
