"use client";

import React from "react";
import {
  ExternalLink,
  Edit3,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import type { VaultItem } from "@repo/types";

export interface VaultItemCardProps {
  item: VaultItem;
  cached?: { username: string; password: string; notes?: string };
  isRevealed: boolean;
  copiedId: string | null;
  onToggleReveal: (item: VaultItem) => void;
  onCopyUsername: (item: VaultItem) => void;
  onCopyPassword: (item: VaultItem) => void;
  onEdit: (item: VaultItem) => void;
  onDelete: (item: VaultItem) => void;
}

export function VaultItemCard({
  item,
  cached,
  isRevealed,
  copiedId,
  onToggleReveal,
  onCopyUsername,
  onCopyPassword,
  onEdit,
  onDelete,
}: VaultItemCardProps) {
  const displayUsername = cached ? cached.username : "••••••••";
  const displayPassword = isRevealed
    ? cached?.password || "••••••••"
    : "••••••••••••";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-2.5 sm:p-3.5 space-y-2.5 hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between">
      {/* Top row: Avatar + Title & Category + Edit / Delete */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-1.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="size-7 sm:size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
              {item.title.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug break-words">
                {item.title}
              </h4>
              <span className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 capitalize font-bold inline-block truncate mt-0.5">
                {item.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(item)}
              title="Edit credential"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all cursor-pointer"
              aria-label="Edit credential"
            >
              <Edit3 className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(item)}
              title="Delete credential"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-90 transition-all cursor-pointer"
              aria-label="Delete credential"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        {item.websiteUrl && (
          <a
            href={
              item.websiteUrl.startsWith("http")
                ? item.websiteUrl
                : `https://${item.websiteUrl}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline flex items-center gap-1 truncate"
          >
            <span className="truncate">{item.websiteUrl}</span>
            <ExternalLink className="size-2.5 shrink-0" />
          </a>
        )}
      </div>

      {/* Credentials Blocks */}
      <div className="space-y-1.5">
        {/* Username */}
        <div className="space-y-0.5">
          <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">
            ID / Username
          </div>
          <div className="flex items-center justify-between gap-1 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5">
            <span className="text-[10px] sm:text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate select-all">
              {cached ? displayUsername || "(none)" : "Tap copy to decrypt"}
            </span>
            <button
              type="button"
              onClick={() => onCopyUsername(item)}
              title="Copy Username"
              className="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-200/50 dark:hover:bg-slate-700/50 active:scale-90 transition-all shrink-0 cursor-pointer"
              aria-label="Copy username"
            >
              {copiedId === `${item.id}-user` ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-0.5">
          <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Password
          </div>
          <div className="flex items-center justify-between gap-1 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5">
            <span className="text-[10px] sm:text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate select-all tracking-wider">
              {displayPassword}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => onToggleReveal(item)}
                title={isRevealed ? "Hide Password" : "Show Password"}
                className="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-200/50 dark:hover:bg-slate-700/50 active:scale-90 transition-all cursor-pointer"
                aria-label={isRevealed ? "Hide password" : "Show password"}
              >
                {isRevealed ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onCopyPassword(item)}
                title="Copy Password"
                className="p-1 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-200/50 dark:hover:bg-slate-700/50 active:scale-90 transition-all shrink-0 cursor-pointer"
                aria-label="Copy password"
              >
                {copiedId === `${item.id}-pass` ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes preview */}
      {cached?.notes && (
        <div className="pt-1 text-[9px] sm:text-[10px] text-slate-400 border-t border-slate-100 dark:border-white/5 line-clamp-1 italic">
          {cached.notes}
        </div>
      )}
    </div>
  );
}
