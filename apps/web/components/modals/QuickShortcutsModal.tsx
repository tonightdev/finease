"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState, AppDispatch } from "@/store";
import { closeModal, openModal } from "@/store/slices/uiSlice";
import { Modal } from "@/components/ui/Modal";
import {
  Sparkles,
  TrendingUp,
  Bell,
  Shield,
  ArrowRight,
  Zap,
} from "lucide-react";
import { haptics } from "@/lib/haptics";

interface ShortcutItem {
  id: string;
  name: string;
  badge: string;
  shortcutKey: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  badgeBg: string;
  action: () => void;
}

export function QuickShortcutsModal() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const isOpen = useSelector(
    (state: RootState) => state.ui.modals.isQuickShortcutsOpen,
  );

  const handleClose = () => {
    dispatch(closeModal("isQuickShortcutsOpen"));
  };

  const shortcuts: ShortcutItem[] = [
    {
      id: "wealth-pulse",
      name: "Monthly Wealth Pulse",
      badge: "",
      shortcutKey: "⌥W",
      description: "Update liquid cash balances & recalculate live net worth",
      icon: <Sparkles className="size-4 sm:size-4.5 text-amber-500" />,
      iconBg: "bg-amber-500/10 border-amber-500/20",
      badgeBg:
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      action: () => {
        handleClose();
        dispatch(openModal("isWealthPulseOpen"));
      },
    },
    {
      id: "portfolio",
      name: "Portfolio & Assets",
      badge: "",
      shortcutKey: "⌥P",
      description: "Inspect asset allocation, investments, gold, and debt",
      icon: <TrendingUp className="size-4 sm:size-4.5 text-emerald-500" />,
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      badgeBg:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      action: () => {
        handleClose();
        router.push("/portfolio");
      },
    },
    {
      id: "expiries",
      name: "Expiries & Horizon",
      badge: "",
      shortcutKey: "⌥E",
      description: "View upcoming insurance policies and fiscal deadlines",
      icon: <Bell className="size-4 sm:size-4.5 text-sky-500" />,
      iconBg: "bg-sky-500/10 border-sky-500/20",
      badgeBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      action: () => {
        handleClose();
        router.push("/plans?tab=Expiries");
      },
    },
    {
      id: "vault",
      name: "Password & Key Vault",
      badge: "",
      shortcutKey: "⌥V",
      description: "Access encrypted financial credentials and recovery keys",
      icon: <Shield className="size-4 sm:size-4.5 text-indigo-500" />,
      iconBg: "bg-indigo-500/10 border-indigo-500/20",
      badgeBg:
        "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      action: () => {
        handleClose();
        router.push("/settings?tab=vault");
      },
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
            <Zap className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
              Quick Shortcuts
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
              Direct access to vital command nodes
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-2 py-1">
        {shortcuts.map((item, idx) => (
          <button
            key={item.id || `shortcut-${idx}`}
            type="button"
            onClick={() => {
              haptics.tap();
              item.action();
            }}
            className="w-full flex items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 hover:border-primary/40 hover:bg-primary/[0.03] dark:hover:bg-primary/[0.06] transition-all group active:scale-[0.98] text-left cursor-pointer"
          >
            {/* Left Section: Icon & Info */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div
                className={`size-9 sm:size-10 rounded-xl flex items-center justify-center shrink-0 border ${item.iconBg} transition-transform group-hover:scale-105 shadow-xs`}
              >
                {item.icon}
              </div>

              <div className="min-w-0 flex-1">
                {/* Header row: Title + Pill Badge */}
                <div className="flex items-baseline justify-between gap-1.5 mb-0.5">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.badge && (
                      <span
                        className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border shrink-0 ${item.badgeBg}`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <kbd className="hidden sm:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-400">
                      {item.shortcutKey}
                    </kbd>
                  </div>
                </div>

                {/* Description: full readable 2 lines */}
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                  {item.description}
                </p>
              </div>
            </div>

            {/* Right Arrow Action */}
            <div className="size-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
              <ArrowRight className="size-3.5" />
            </div>
          </button>
        ))}

        {/* Informational Guidance Box */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-start gap-2.5">
          <span className="text-sm shrink-0 leading-none mt-0.5">💡</span>
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Quick Access:
            </span>{" "}
            Hold the FinEase logo or tap the{" "}
            <Zap className="inline size-3 text-amber-500 -mt-0.5" /> icon in the
            header anytime. On mobile home screen, press and hold the app icon.
          </p>
        </div>
      </div>
    </Modal>
  );
}
