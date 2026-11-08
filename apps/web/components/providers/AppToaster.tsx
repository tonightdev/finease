"use client";

import React, { useState, useEffect } from "react";
import { Toaster, resolveValue, Toast, toast } from "react-hot-toast";
import { CheckCircle2, AlertCircle, Loader2, Info, X } from "lucide-react";

interface TouchState {
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  isSwiping: boolean;
}

interface ToastCardProps {
  toast: Toast;
}

export function ToastCard({ toast: t }: ToastCardProps) {
  const [touchState, setTouchState] = useState<TouchState>({
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    isSwiping: false,
  });
  const [isDismissing, setIsDismissing] = useState(false);
  const [dismissTransform, setDismissTransform] = useState(
    "translate3d(0, 0, 0)",
  );

  // Strict 3-second timer fallback for each and every toast (except active loading toasts)
  useEffect(() => {
    if (t.type === "loading") return;
    const timer = setTimeout(() => {
      toast.dismiss(t.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [t.id, t.type]);

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setTouchState({
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      isSwiping: true,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState.isSwiping) return;
    const touch = e.touches[0];
    if (!touch) return;
    const deltaX = touch.clientX - touchState.startX;
    const deltaY = touch.clientY - touchState.startY;
    setTouchState((prev) => ({ ...prev, deltaX, deltaY }));
  };

  const handleTouchEnd = () => {
    if (!touchState.isSwiping) return;
    const { deltaX, deltaY } = touchState;

    // Dismiss threshold: horizontal swipe > 35px or vertical swipe (up > 25px, down > 35px)
    if (Math.abs(deltaX) > 35 || deltaY < -25 || deltaY > 35) {
      setIsDismissing(true);
      if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        setDismissTransform(
          deltaX > 0 ? "translate3d(120%, 0, 0)" : "translate3d(-120%, 0, 0)",
        );
      } else {
        setDismissTransform(
          deltaY < 0 ? "translate3d(0, -120%, 0)" : "translate3d(0, 120%, 0)",
        );
      }
      toast.dismiss(t.id);
    } else {
      setTouchState({
        startX: 0,
        startY: 0,
        deltaX: 0,
        deltaY: 0,
        isSwiping: false,
      });
    }
  };

  // Determine appearance based on toast state
  const isVisible = t.visible && !isDismissing;

  const currentTransform = isDismissing
    ? dismissTransform
    : touchState.isSwiping
      ? `translate3d(${touchState.deltaX}px, ${touchState.deltaY}px, 0)`
      : isVisible
        ? "translate3d(0, 0, 0) scale(1)"
        : "translate3d(0, -12px, 0) scale(0.92)";

  const currentOpacity = isDismissing
    ? 0
    : touchState.isSwiping
      ? Math.max(
          0.15,
          1 - Math.hypot(touchState.deltaX, touchState.deltaY) / 160,
        )
      : isVisible
        ? 1
        : 0;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        setTouchState({
          startX: 0,
          startY: 0,
          deltaX: 0,
          deltaY: 0,
          isSwiping: false,
        });
      }}
      style={{
        transform: currentTransform,
        opacity: currentOpacity,
        transition: touchState.isSwiping
          ? "none"
          : "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out",
        willChange: "transform, opacity",
      }}
      className={`pointer-events-auto flex items-center justify-between gap-2.5 p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-xl border shadow-xl max-w-[92vw] sm:max-w-md w-fit select-none transition-colors ${
        t.type === "success"
          ? "border-emerald-500/30 shadow-[0_10px_30px_-5px_rgba(16,185,129,0.22)]"
          : t.type === "error"
            ? "border-rose-500/30 shadow-[0_10px_30px_-5px_rgba(244,63,94,0.22)]"
            : t.type === "loading"
              ? "border-primary/30 shadow-[0_10px_30px_-5px_rgba(19,91,236,0.22)]"
              : "border-white/10 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* Toast Type Icon */}
      <div className="shrink-0 flex items-center justify-center">
        {t.icon ? (
          typeof t.icon === "string" ? (
            <span className="text-base select-none leading-none px-0.5">
              {t.icon}
            </span>
          ) : (
            t.icon
          )
        ) : t.type === "success" ? (
          <div className="size-6 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="size-3.5" />
          </div>
        ) : t.type === "error" ? (
          <div className="size-6 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center border border-rose-500/20">
            <AlertCircle className="size-3.5" />
          </div>
        ) : t.type === "loading" ? (
          <div className="size-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center border border-primary/20">
            <Loader2 className="size-3.5 animate-spin" />
          </div>
        ) : (
          <div className="size-6 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <Info className="size-3.5" />
          </div>
        )}
      </div>

      {/* Toast Message */}
      <div className="flex-1 min-w-0 px-1 py-0.5 text-xs font-semibold text-slate-100 leading-snug whitespace-pre-line break-words">
        {resolveValue(t.message, t)}
      </div>

      {/* Dismiss Cross Icon Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toast.dismiss(t.id);
        }}
        aria-label="Dismiss toast"
        className="size-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all shrink-0 cursor-pointer -mr-0.5"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      gutter={8}
      containerStyle={{
        top: "calc(env(safe-area-inset-top, 0px) + 12px)",
        zIndex: 999999,
      }}
      toastOptions={{
        duration: 3000,
        success: { duration: 3000 },
        error: { duration: 3000 },
        blank: { duration: 3000 },
      }}
    >
      {(t) => <ToastCard key={t.id} toast={t} />}
    </Toaster>
  );
}

export { toast };
