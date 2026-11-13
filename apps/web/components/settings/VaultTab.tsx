"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Unlock,
  Plus,
  Search,
  Trash2,
  RefreshCw,
  Sparkles,
  Globe,
  Mail,
  Building2,
  Smartphone,
  Briefcase,
  Wrench,
  AlertTriangle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  setupNewVault,
  verifyMasterPassword,
  encryptText,
  decryptText,
  generateIv,
  generateSecurePassword,
} from "@/lib/vaultCrypto";
import type {
  VaultItem,
  VaultSettings,
  VaultCategory,
  CreateVaultItemDto,
  UpdateVaultItemDto,
} from "@repo/types";
import { VaultItemCard } from "./VaultItemCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";

const CATEGORIES: {
  id: VaultCategory | "all";
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "all", label: "All Items", icon: KeyRound },
  { id: "bank", label: "Banking & Finance", icon: Building2 },
  { id: "email", label: "Email", icon: Mail },
  { id: "social", label: "Social", icon: Globe },
  { id: "app", label: "Apps & Software", icon: Smartphone },
  { id: "work", label: "Work & Business", icon: Briefcase },
  { id: "utility", label: "Utilities", icon: Wrench },
  { id: "other", label: "Other", icon: KeyRound },
];

export function VaultTab() {
  const { user } = useAuth();

  // Vault state
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<VaultSettings | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultKey, setVaultKey] = useState<CryptoKey | null>(null);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Unlock state
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState("");

  // Setup state
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [newMasterPassword, setNewMasterPassword] = useState("");
  const [confirmMasterPassword, setConfirmMasterPassword] = useState("");
  const [settingUp, setSettingUp] = useState(false);

  // Decrypted values in memory cache
  const [decryptedValues, setDecryptedValues] = useState<
    Record<string, { username: string; password: string; notes?: string }>
  >({});
  const [revealedPasswords, setRevealedPasswords] = useState<
    Record<string, boolean>
  >({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    VaultCategory | "all"
  >("all");

  // Add / Edit Modal state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<VaultCategory>("other");
  const [formWebsiteUrl, setFormWebsiteUrl] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [savingItem, setSavingItem] = useState(false);

  // Password Generator state
  const [showGenerator, setShowGenerator] = useState(false);
  const [genLength, setGenLength] = useState(16);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [genUppercase, setGenUppercase] = useState(true);

  // Delete & Reset state
  const [deletingItem, setDeletingItem] = useState<VaultItem | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load vault settings for current authenticated user
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<VaultSettings | null>("/vault/settings");
      setSettings(res.data || null);
    } catch (error) {
      console.error("Failed to load vault settings:", error);
      toast.error("Could not check vault status");
    } finally {
      setLoading(false);
    }
  }, []);

  // Isolate and lock vault whenever active user identity changes
  useEffect(() => {
    setIsUnlocked(false);
    setVaultKey(null);
    setItems([]);
    setItemsLoading(false);
    setDecryptedValues({});
    setRevealedPasswords({});
    setUnlockPassword("");
    setUnlockError("");
    setSettings(null);
    if (user?.uid) {
      void fetchSettings();
    }
  }, [user?.uid, fetchSettings]);

  // Load items when unlocked
  const fetchItems = useCallback(async () => {
    try {
      setItemsLoading(true);
      const res = await api.get<VaultItem[]>("/vault/items");
      setItems(res.data || []);
    } catch (error) {
      console.error("Failed to load vault items:", error);
      toast.error("Failed to load items");
    } finally {
      setItemsLoading(false);
    }
  }, []);

  // Lock the vault
  const lockVault = useCallback(() => {
    setIsUnlocked(false);
    setVaultKey(null);
    setDecryptedValues({});
    setRevealedPasswords({});
    setUnlockPassword("");
    setUnlockError("");
    setItemsLoading(false);
    toast.success("Vault locked securely");
  }, []);

  // Setup Vault (First Time)
  const handleSetupVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterPassword || newMasterPassword.length < 8) {
      toast.error("Master password must be at least 8 characters");
      return;
    }
    if (newMasterPassword !== confirmMasterPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setSettingUp(true);
      const { vaultSalt, passwordVerifier, verifierIv, key } =
        await setupNewVault(newMasterPassword);

      const res = await api.post<VaultSettings>("/vault/setup", {
        vaultSalt,
        passwordVerifier,
        verifierIv,
      });

      setSettings(res.data);
      setVaultKey(key);
      setIsUnlocked(true);
      setItemsLoading(true);
      setShowSetupModal(false);
      setNewMasterPassword("");
      setConfirmMasterPassword("");
      toast.success("Vault initialized! Remember your Master Password.");
      void fetchItems();
    } catch (error) {
      console.error("Failed to set up vault:", error);
      toast.error("Failed to initialize vault");
    } finally {
      setSettingUp(false);
    }
  };

  // Unlock Vault
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !unlockPassword) return;

    try {
      setUnlocking(true);
      setUnlockError("");

      const key = await verifyMasterPassword(
        unlockPassword,
        settings.vaultSalt,
        settings.passwordVerifier,
        settings.verifierIv,
      );

      if (!key) {
        setUnlockError("Incorrect master password. Please try again.");
        return;
      }

      setVaultKey(key);
      setIsUnlocked(true);
      setItemsLoading(true);
      setUnlockPassword("");
      toast.success("Vault unlocked");
      void fetchItems();
    } catch (error) {
      console.error("Unlock error:", error);
      setUnlockError("Failed to unlock vault. Check your credentials.");
    } finally {
      setUnlocking(false);
    }
  };

  // Decrypt single item on demand or when needed
  const getOrDecryptItem = useCallback(
    async (item: VaultItem) => {
      if (!vaultKey) return null;
      if (decryptedValues[item.id]) {
        return decryptedValues[item.id];
      }

      try {
        const username = item.encryptedUsername
          ? await decryptText(item.encryptedUsername, vaultKey, item.iv)
          : "";
        const password = await decryptText(
          item.encryptedPassword,
          vaultKey,
          item.iv,
        );
        const notes = item.notes
          ? await decryptText(item.notes, vaultKey, item.iv)
          : "";

        const decrypted = { username, password, notes };
        setDecryptedValues((prev) => ({ ...prev, [item.id]: decrypted }));
        return decrypted;
      } catch (err) {
        console.error("Failed to decrypt item:", err);
        return null;
      }
    },
    [vaultKey, decryptedValues],
  );

  // Toggle reveal password for an item
  const togglePasswordReveal = async (item: VaultItem) => {
    if (!revealedPasswords[item.id]) {
      // Ensure decrypted
      await getOrDecryptItem(item);
    }
    setRevealedPasswords((prev) => ({
      ...prev,
      [item.id]: !prev[item.id],
    }));
  };

  // Copy to clipboard with auto-clear warning
  const copyToClipboard = async (
    text: string,
    label: string,
    copyKey: string,
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(copyKey);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Open modal to Add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormCategory("other");
    setFormWebsiteUrl("");
    setFormUsername("");
    setFormPassword("");
    setFormNotes("");
    setShowGenerator(false);
    setShowAddEditModal(true);
  };

  // Open modal to Edit
  const handleOpenEdit = async (item: VaultItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormWebsiteUrl(item.websiteUrl || "");

    const decrypted = await getOrDecryptItem(item);
    setFormUsername(decrypted ? decrypted.username : "");
    setFormPassword(decrypted ? decrypted.password : "");
    setFormNotes(decrypted ? decrypted.notes || "" : "");
    setShowGenerator(false);
    setShowAddEditModal(true);
  };

  // Save Add or Edit Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultKey) {
      toast.error("Vault is locked");
      return;
    }
    if (!formTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formPassword) {
      toast.error("Please provide a password");
      return;
    }

    try {
      setSavingItem(true);
      const iv = generateIv(12);

      const encryptedUsername = formUsername
        ? await encryptText(formUsername, vaultKey, iv)
        : "";
      const encryptedPassword = await encryptText(formPassword, vaultKey, iv);
      const encryptedNotes = formNotes
        ? await encryptText(formNotes, vaultKey, iv)
        : "";

      if (editingItem) {
        const updatePayload: UpdateVaultItemDto = {
          title: formTitle,
          category: formCategory,
          websiteUrl: formWebsiteUrl,
          encryptedUsername,
          encryptedPassword,
          iv,
          notes: encryptedNotes,
        };
        const res = await api.put<VaultItem>(
          `/vault/items/${editingItem.id}`,
          updatePayload,
        );

        setItems((prev) =>
          prev.map((it) => (it.id === editingItem.id ? res.data : it)),
        );
        setDecryptedValues((prev) => ({
          ...prev,
          [editingItem.id]: {
            username: formUsername,
            password: formPassword,
            notes: formNotes,
          },
        }));
        toast.success("Credential updated successfully");
      } else {
        const createPayload: CreateVaultItemDto = {
          title: formTitle,
          category: formCategory,
          websiteUrl: formWebsiteUrl,
          encryptedUsername,
          encryptedPassword,
          iv,
          notes: encryptedNotes,
        };
        const res = await api.post<VaultItem>("/vault/items", createPayload);

        setItems((prev) => [res.data, ...prev]);
        setDecryptedValues((prev) => ({
          ...prev,
          [res.data.id]: {
            username: formUsername,
            password: formPassword,
            notes: formNotes,
          },
        }));
        toast.success("Credential securely stored");
      }

      setShowAddEditModal(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save item");
    } finally {
      setSavingItem(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      await api.delete(`/vault/items/${deletingItem.id}`);
      setItems((prev) => prev.filter((it) => it.id !== deletingItem.id));
      setDecryptedValues((prev) => {
        const next = { ...prev };
        delete next[deletingItem.id];
        return next;
      });
      toast.success("Credential removed");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete credential");
    } finally {
      setDeletingItem(null);
    }
  };

  // Reset entire vault
  const handleResetVault = async () => {
    try {
      await api.delete("/vault/reset");
      setSettings(null);
      setIsUnlocked(false);
      setVaultKey(null);
      setItems([]);
      setDecryptedValues({});
      setShowResetConfirm(false);
      toast.success("Vault wiped and reset successfully");
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("Failed to reset vault");
    }
  };

  // Quick generate password inside modal
  const handleApplyGeneratedPassword = () => {
    const generated = generateSecurePassword({
      length: genLength,
      numbers: genNumbers,
      symbols: genSymbols,
      uppercase: genUppercase,
      lowercase: true,
    });
    setFormPassword(generated);
    toast.success("Generated strong password!");
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      const cached = decryptedValues[item.id];
      const matchesSearch =
        item.title.toLowerCase().includes(q) ||
        (item.websiteUrl && item.websiteUrl.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        (cached?.username && cached.username.toLowerCase().includes(q));
      return matchesSearch;
    });
  }, [items, selectedCategory, searchQuery, decryptedValues]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const it of items) {
      counts[it.category] = (counts[it.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Skeleton className="h-10 w-full sm:w-72 rounded-xl" />
          <Skeleton className="h-10 w-full sm:w-44 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // State 1: Vault not configured yet
  if (!settings) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Password Protector
              </h4>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                AES-256 Client Encryption
              </p>
            </div>
          </div>

          <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            Store logins, IDs, and passwords securely in zero-knowledge
            encrypted storage.
          </p>

          <Button
            variant="primary"
            onClick={() => setShowSetupModal(true)}
            className="w-full sm:w-auto h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-xs"
          >
            <KeyRound size={14} /> Set Up Vault
          </Button>
        </div>

        {/* Setup Modal */}
        <Modal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          title={
            <div className="flex items-center gap-2">
              <KeyRound className="size-5 text-primary" />
              <span>Create Master Vault Password</span>
            </div>
          }
        >
          <form onSubmit={handleSetupVault} className="space-y-3.5 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose a strong Master Password. This single password will encrypt
              and decrypt all your stored logins.
            </p>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Master Password
              </label>
              <PasswordInput
                required
                minLength={8}
                value={newMasterPassword}
                onChange={(e) => setNewMasterPassword(e.target.value)}
                placeholder="At least 8 characters..."
                className="h-9 sm:h-10 text-xs placeholder:text-[11px]"
              />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Confirm Master Password
              </label>
              <PasswordInput
                required
                minLength={8}
                value={confirmMasterPassword}
                onChange={(e) => setConfirmMasterPassword(e.target.value)}
                placeholder="Re-enter master password..."
                className="h-9 sm:h-10 text-xs placeholder:text-[11px]"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] sm:text-[11px] flex gap-2">
              <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Cannot be recovered if forgotten
                (zero-knowledge encryption).
              </span>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowSetupModal(false)}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={settingUp}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs font-bold"
              >
                {settingUp ? "Encrypting & Setting Up..." : "Initialize Vault"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // State 2: Vault configured, but LOCKED
  if (!isUnlocked) {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-4 sm:p-5 shadow-xs space-y-3.5">
          {/* Header row: Status + Reset Action */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Lock className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Vault Locked
                </h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Master Key Decryption
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              className="text-[10px] font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 gap-1 h-7 px-2"
            >
              <Trash2 className="size-3 shrink-0" />
              <span>Reset</span>
            </Button>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3">
            <div className="space-y-1">
              <PasswordInput
                required
                autoFocus
                value={unlockPassword}
                onChange={(e) => {
                  setUnlockPassword(e.target.value);
                  setUnlockError("");
                }}
                placeholder="Enter Master Password..."
                className="h-10 text-xs placeholder:text-[11px]"
              />
              {unlockError && (
                <p className="text-[10px] font-bold text-rose-500 mt-1">
                  {unlockError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={unlocking}
              className="w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-xs"
            >
              <Unlock className="size-3.5" />
              {unlocking ? "Decrypting..." : "Unlock Vault"}
            </Button>
          </form>
        </div>

        {/* Reset Confirmation Modal */}
        <ConfirmModal
          isOpen={showResetConfirm}
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={handleResetVault}
          title="Reset Password Vault?"
          message="Are you sure you want to reset your vault? This will permanently delete all stored IDs and passwords. This action cannot be undone."
          confirmText="Yes, Wipe & Reset"
          isDestructive
        />
      </div>
    );
  }

  // State 3: Vault UNLOCKED (Manage credentials)
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Controls Row: Search Input & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by title, username, website..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-10 text-xs placeholder:text-[11px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Action Buttons: Full on mobile, inline on web, matching other pages */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={lockVault}
            className="flex-1 sm:flex-none h-10 px-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest gap-1.5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs"
          >
            <Lock className="size-3.5 text-amber-500 shrink-0" />
            <span>Lock</span>
          </Button>
          <Button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-xs"
          >
            <Plus size={14} /> Add Credential
          </Button>
        </div>
      </div>

      {/* Category Filter Pills (Horizontal swipeable on mobile) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 touch-pan-x">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;
          const count = categoryCounts[cat.id] || 0;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 active:scale-95 cursor-pointer ${
                isSelected
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              <Icon className="size-3 shrink-0" />
              <span>{cat.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      {itemsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-2.5 sm:p-3.5 space-y-2.5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Skeleton className="size-7 sm:size-8 rounded-xl shrink-0" />
                  <div className="space-y-1 min-w-0 flex-1">
                    <Skeleton className="h-3 w-16 sm:w-20" />
                    <Skeleton className="h-2 w-10 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Skeleton className="size-5 rounded-lg" />
                  <Skeleton className="size-5 rounded-lg" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-9 rounded-xl" />
                <Skeleton className="h-9 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
          <div className="size-16 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <KeyRound className="size-8 text-primary/40" />
          </div>
          <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1.5">
            {searchQuery
              ? "No matching credentials"
              : "No credentials stored yet"}
          </h5>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">
            {searchQuery
              ? "Try adjusting search or category filter."
              : "Store logins, IDs, and passwords securely."}
          </p>
          {!searchQuery && (
            <Button
              onClick={handleOpenAdd}
              className="mt-4 h-10 px-4 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-xs"
            >
              <Plus size={14} /> Add First Credential
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {filteredItems.map((item) => (
            <VaultItemCard
              key={item.id}
              item={item}
              cached={decryptedValues[item.id]}
              isRevealed={Boolean(revealedPasswords[item.id])}
              copiedId={copiedId}
              onToggleReveal={togglePasswordReveal}
              onCopyUsername={async (it) => {
                const dec = await getOrDecryptItem(it);
                if (dec?.username) {
                  copyToClipboard(dec.username, "Username", `${it.id}-user`);
                } else {
                  toast.error("No username saved for this item");
                }
              }}
              onCopyPassword={async (it) => {
                const dec = await getOrDecryptItem(it);
                if (dec?.password) {
                  copyToClipboard(dec.password, "Password", `${it.id}-pass`);
                }
              }}
              onEdit={handleOpenEdit}
              onDelete={(it) => setDeletingItem(it)}
            />
          ))}
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      <div className="fixed sm:hidden bottom-20 right-5 z-40">
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center justify-center size-14 rounded-full bg-primary text-white shadow-xl shadow-primary/40 active:scale-90 transition-transform"
          aria-label="Add new credential"
        >
          <Plus className="size-6" />
        </button>
      </div>

      {/* Add / Edit Credential Modal */}
      <Modal
        isOpen={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        maxWidth="max-w-lg"
        title={
          <div className="flex items-center gap-2">
            <KeyRound className="size-5 text-primary" />
            <span className="text-base font-bold">
              {editingItem ? "Edit Credential" : "Store New Credential"}
            </span>
          </div>
        }
      >
        <form onSubmit={handleSaveItem} className="space-y-3.5 pt-2">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Title / Account Name *
              </label>
              <Input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Netflix, HDFC Bank, Gmail"
                className="h-9 sm:h-10 text-xs placeholder:text-[11px]"
              />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Category
              </label>
              <Select
                value={formCategory}
                onValueChange={(val) => setFormCategory(val as VaultCategory)}
              >
                <SelectTrigger className="w-full h-9 sm:h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="z-[9999] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-xl">
                  {CATEGORIES.filter((c) => c.id !== "all")
                    .sort((a, b) =>
                      a.label.localeCompare(b.label, undefined, {
                        sensitivity: "base",
                      }),
                    )
                    .map((cat) => {
                      const CatIcon = cat.icon;
                      return (
                        <SelectItem
                          key={cat.id}
                          value={cat.id}
                          className="text-xs font-bold py-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <CatIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                            <span>{cat.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Website URL & Login ID / Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Website or App URL
              </label>
              <Input
                type="text"
                value={formWebsiteUrl}
                onChange={(e) => setFormWebsiteUrl(e.target.value)}
                placeholder="e.g. netflix.com or https://..."
                className="h-9 sm:h-10 text-xs placeholder:text-[11px]"
              />
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Login ID / Username / Email
              </label>
              <Input
                type="text"
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="e.g. user@gmail.com"
                className="h-9 sm:h-10 text-xs placeholder:text-[11px]"
              />
            </div>
          </div>

          {/* Password with Generator trigger */}
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password *
              </label>
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-[11px] sm:text-xs font-bold text-primary flex items-center gap-1 hover:underline active:scale-95 transition-transform cursor-pointer"
              >
                <Sparkles className="size-3" />
                <span>
                  {showGenerator ? "Hide Generator" : "Generate Strong"}
                </span>
              </button>
            </div>
            <div className="relative">
              <Input
                type="text"
                required
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Enter password..."
                className="h-9 sm:h-10 text-xs font-mono font-bold placeholder:text-[11px]"
              />
            </div>
          </div>

          {/* Inline Generator Panel */}
          {showGenerator && (
            <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">
                  Password Length ({genLength})
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyGeneratedPassword}
                  className="gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-2.5 active:scale-95 font-bold"
                >
                  <RefreshCw className="size-3" />
                  Generate & Insert
                </Button>
              </div>

              <input
                type="range"
                min="8"
                max="32"
                value={genLength}
                onChange={(e) => setGenLength(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer h-1.5 rounded-lg"
              />

              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <label className="flex items-center justify-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/10 active:scale-95 cursor-pointer text-[10px] sm:text-xs font-semibold">
                  <Checkbox
                    checked={genUppercase}
                    onChange={(e) => setGenUppercase(e.target.checked)}
                  />
                  <span>A-Z</span>
                </label>
                <label className="flex items-center justify-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/10 active:scale-95 cursor-pointer text-[10px] sm:text-xs font-semibold">
                  <Checkbox
                    checked={genNumbers}
                    onChange={(e) => setGenNumbers(e.target.checked)}
                  />
                  <span>0-9</span>
                </label>
                <label className="flex items-center justify-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/10 active:scale-95 cursor-pointer text-[10px] sm:text-xs font-semibold">
                  <Checkbox
                    checked={genSymbols}
                    onChange={(e) => setGenSymbols(e.target.checked)}
                  />
                  <span>!@#$</span>
                </label>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1 sm:space-y-1.5">
            <label className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Encrypted Notes / Recovery Codes (Optional)
            </label>
            <Textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Security questions, backup codes, or account number..."
              className="min-h-[64px] text-xs resize-none placeholder:text-[11px]"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddEditModal(false)}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={savingItem}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs font-bold"
            >
              {savingItem ? "Encrypting & Storing..." : "Save Credential"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Item Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingItem)}
        onCancel={() => setDeletingItem(null)}
        onConfirm={handleDeleteItem}
        title="Delete Credential?"
        message={`Are you sure you want to delete the credential for "${deletingItem?.title}"? This cannot be undone.`}
        confirmText="Delete Credential"
        isDestructive
      />
    </div>
  );
}
