"use client";

import { useEffect, useState, useCallback } from "react";
import { Share, PlusSquare, Share2, Download, X, Sparkles } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { motion, AnimatePresence } from "framer-motion";
import { haptics } from "@/lib/haptics";

interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallGuide() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<"ios" | "android" | "other" | null>(
    null,
  );

  useEffect(() => {
    // Check if user dismissed or closed it
    if (typeof window !== "undefined") {
      const isDismissed =
        localStorage.getItem("finease_pwa_install_dismissed") === "true" ||
        Boolean(localStorage.getItem("pwa-guide-dismissal"));
      if (isDismissed) {
        return; // Permanently closed by user - do not show again
      }
    }

    // Check if already installed
    const nav = window.navigator as NavigatorStandalone;
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      !!nav.standalone ||
      document.referrer.includes("android-app://");

    if (isPWA) {
      setShow(false);
      localStorage.setItem("finease_pwa_install_dismissed", "true");
      return;
    }

    // Capture standard PWA install prompt on Android / Chromium
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPlatform("android");
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Detect platform for manual instructions if prompt not fired yet
    const timer = setTimeout(() => {
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setPlatform("ios");
        setShow(true);
      } else if (/android/.test(ua)) {
        setPlatform("android");
        setShow(true);
      }
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    haptics.tick();
    setShow(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("finease_pwa_install_dismissed", "true");
    }
  }, []);

  const handleInstallClick = useCallback(async () => {
    haptics.impact();
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setShow(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("finease_pwa_install_dismissed", "true");
        }
        if (choice.outcome === "accepted") {
          haptics.success();
        }
      } catch {
        // Fallback to manual guide
      }
    }
  }, [deferredPrompt]);

  if (!platform && !deferredPrompt) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-20 left-4 right-4 z-[100] lg:bottom-6 lg:left-auto lg:right-6 lg:w-80"
        >
          <Card className="bg-slate-900 border-none shadow-2xl relative overflow-hidden group">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-slate-400 hover:text-white hover:bg-white/10 h-7 w-7 p-0 rounded-full z-[110]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm uppercase tracking-tight">
                    Install FinEase
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Pure Sovereign App Experience
                  </p>
                </div>
              </div>

              {deferredPrompt ? (
                <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
                    Install FinEase on your home screen for instantaneous 0ms
                    launches, offline access, and haptic feedback.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleInstallClick}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white font-black text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-lg shadow-primary/25"
                      leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                    >
                      Install App
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleDismiss}
                      className="text-slate-400 hover:text-white hover:bg-white/10 font-bold text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl"
                    >
                      Not Now
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  {platform === "ios" ? (
                    <div className="space-y-3 text-[11px] font-medium text-slate-300 leading-relaxed">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 bg-white/10 rounded-lg">
                          <Share className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p>
                          Tap the{" "}
                          <span className="text-white font-bold">Share</span>{" "}
                          button in Safari.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 bg-white/10 rounded-lg">
                          <PlusSquare className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p>
                          Scroll down and select{" "}
                          <span className="text-white font-bold">
                            Add to Home Screen
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-[11px] font-medium text-slate-300 leading-relaxed">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 bg-white/10 rounded-lg">
                          <Share2 className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p>
                          Tap the{" "}
                          <span className="text-white font-bold">
                            Menu (three dots)
                          </span>{" "}
                          in Chrome.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 p-1 bg-white/10 rounded-lg">
                          <Download className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p>
                          Select{" "}
                          <span className="text-white font-bold">
                            Install App
                          </span>{" "}
                          or{" "}
                          <span className="text-white font-bold">
                            Add to Home screen
                          </span>
                          .
                        </p>
                      </div>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleDismiss}
                    className="w-full text-slate-400 hover:text-white hover:bg-white/10 font-bold text-[10px] uppercase tracking-widest py-2 rounded-xl mt-1 border border-white/5"
                  >
                    Got It • Don&apos;t Show Again
                  </Button>
                </div>
              )}

              <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest">
                Fast • Biometrics • Haptics • Offline
              </p>
            </div>

            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/30 transition-all duration-700 pointer-events-none" />
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
