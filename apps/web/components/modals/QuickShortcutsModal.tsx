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
  shortName: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
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
      shortName: "Wealth Pulse",
      description: "Update liquid cash balances & recalculate live net worth",
      icon: <Sparkles className="size-4 text-amber-500" />,
      iconBg: "bg-amber-500/10 border-amber-500/20",
      action: () => {
        handleClose();
        dispatch(openModal("isWealthPulseOpen"));
      },
    },
    {
      id: "portfolio",
      name: "Portfolio & Assets",
      shortName: "Portfolio",
      description: "Inspect asset allocation, investments, gold, and debt",
      icon: <TrendingUp className="size-4 text-emerald-500" />,
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      action: () => {
        handleClose();
        router.push("/portfolio");
      },
    },
    {
      id: "expiries",
      name: "Expiries & Horizon",
      shortName: "Expiries",
      description: "View upcoming insurance policies and fiscal deadlines",
      icon: <Bell className="size-4 text-sky-500" />,
      iconBg: "bg-sky-500/10 border-sky-500/20",
      action: () => {
        handleClose();
        router.push("/plans?tab=Expiries");
      },
    },
    {
      id: "vault",
      name: "Password & Key Vault",
      shortName: "Vault",
      description: "Access encrypted financial credentials and recovery keys",
      icon: <Shield className="size-4 text-indigo-500" />,
      iconBg: "bg-indigo-500/10 border-indigo-500/20",
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
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
            <Zap className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Quick Shortcuts
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Direct access to vital command nodes
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-2.5 py-1">
        {shortcuts.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              haptics.tap();
              item.action();
            }}
            className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-primary/40 hover:bg-primary/[0.03] dark:hover:bg-primary/[0.06] transition-all group active:scale-[0.98] text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${item.iconBg} transition-transform group-hover:scale-105`}
              >
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                    {item.name}
                  </h4>
                  <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-white/10 text-slate-500 dark:text-slate-400">
                    {item.shortName}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="size-7 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
              <ArrowRight className="size-3.5" />
            </div>
          </button>
        ))}

        <div className="mt-4 p-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            💡{" "}
            <span className="text-slate-700 dark:text-slate-300">
              How to trigger:
            </span>{" "}
            Long-press the FinEase logo in the header or the Home icon in the
            navigation bar anytime. On Android and Desktop, long-press the
            installed app icon on your home screen.
          </p>
        </div>
      </div>
    </Modal>
  );
}
