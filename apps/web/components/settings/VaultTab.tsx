"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  KeyRound,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Plus,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Edit3,
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
import { SettingsCard } from "./SettingsCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/components/auth/AuthProvider";
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
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.websiteUrl &&
          item.websiteUrl.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  // Loading Skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <SettingsCard>
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
        </SettingsCard>
      </div>
    );
  }

  // State 1: Vault not configured yet
  if (!settings) {
    return (
      <div className="space-y-6">
        <SettingsCard
          icon={ShieldAlert}
          title="Password Protector & Vault"
          subtitle="End-to-End Encrypted Storage"
        >
          <div className="w-full space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Never forget your app or website logins again. Store your IDs,
              passwords, and PINs in an encrypted vault.
            </p>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="size-4 text-amber-500 shrink-0" />
                Zero-Knowledge Privacy Guarantee
              </div>
              <p>
                Your credentials are encrypted directly in your browser using{" "}
                <strong>AES-256-GCM</strong>. Your Master Password is{" "}
                <strong>never sent to our servers</strong> or saved in the
                database. Only you can unlock and read your credentials.
              </p>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row sm:items-center">
              <Button
                variant="primary"
                onClick={() => setShowSetupModal(true)}
                className="w-full sm:w-auto justify-center gap-2 py-3 sm:py-2.5 text-xs sm:text-sm font-bold active:scale-98 transition-all"
              >
                <KeyRound className="size-4" />
                Set Up Password Protector
              </Button>
            </div>
          </div>
        </SettingsCard>

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
          <form onSubmit={handleSetupVault} className="space-y-4 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Choose a strong Master Password. This single password will encrypt
              and decrypt all your stored logins.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Master Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newMasterPassword}
                onChange={(e) => setNewMasterPassword(e.target.value)}
                placeholder="At least 8 characters..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-base sm:text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Confirm Master Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmMasterPassword}
                onChange={(e) => setConfirmMasterPassword(e.target.value)}
                placeholder="Re-enter master password..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-base sm:text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex gap-2.5">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> If you forget this Master Password, it
                cannot be recovered or reset by anyone because it is strictly
                zero-knowledge.
              </span>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowSetupModal(false)}
                className="w-full sm:w-auto h-11 sm:h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={settingUp}
                className="w-full sm:w-auto h-11 sm:h-9 font-bold"
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
      <div className="space-y-6">
        <SettingsCard
          icon={Lock}
          title="Password Protector (Locked)"
          subtitle="Protected by Master Encryption Key"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 gap-1.5"
            >
              <Trash2 className="size-3.5" />
              Reset Vault
            </Button>
          }
        >
          <div className="w-full sm:max-w-md space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/5 border border-primary/10">
              <ShieldCheck className="size-6 text-primary shrink-0" />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Your vault is locked. Enter your Master Password to decrypt your
                credentials in this browser session.
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Master Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    autoFocus
                    value={unlockPassword}
                    onChange={(e) => {
                      setUnlockPassword(e.target.value);
                      setUnlockError("");
                    }}
                    placeholder="Enter Master Password..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-base sm:text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                {unlockError && (
                  <p className="text-xs font-medium text-rose-500 mt-1">
                    {unlockError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={unlocking}
                className="w-full gap-2 justify-center py-3.5 h-12 text-sm font-bold active:scale-98 transition-transform"
              >
                <Unlock className="size-4" />
                {unlocking ? "Decrypting..." : "Unlock Vault"}
              </Button>
            </form>
          </div>
        </SettingsCard>

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
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <SettingsCard
        icon={Unlock}
        title="Password Protector & Vault"
        subtitle="End-to-End Encrypted Logins"
        headerAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={lockVault}
              className="gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 h-9 px-2.5 sm:px-3 active:scale-95 transition-transform"
            >
              <Lock className="size-3.5 text-amber-500" />
              <span className="hidden sm:inline">Lock Vault</span>
              <span className="sm:hidden">Lock</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              className="gap-1.5 text-xs font-bold h-9 px-3 sm:px-3.5 active:scale-95 transition-transform"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add Credential</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Search bar & Category filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or website..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 shrink-0">
              <Shield className="size-3.5 text-emerald-500" />
              <span>
                {itemsLoading
                  ? "Decrypting credentials..."
                  : `${items.length} items secured`}
              </span>
            </div>
          </div>

          {/* Category Filter Pills (Horizontal swipeable on mobile) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1.5 -mx-1 px-1 touch-pan-x">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? "bg-primary text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SettingsCard>

      {/* Items Grid / List */}
      {itemsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-3 sm:p-4 space-y-3 shadow-xs"
            >
              {/* Header: Avatar + Title/Category + Action buttons */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <Skeleton className="size-8 sm:size-9 rounded-xl shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <Skeleton className="h-3.5 w-24 sm:w-28" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Skeleton className="size-7 rounded-lg" />
                  <Skeleton className="size-7 rounded-lg" />
                </div>
              </div>

              {/* Username row */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1 border border-slate-100 dark:border-white/5">
                <Skeleton className="h-2 w-12" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-28 sm:w-32" />
                  <Skeleton className="size-5 rounded-md" />
                </div>
              </div>

              {/* Password row */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 space-y-1 border border-slate-100 dark:border-white/5">
                <Skeleton className="h-2 w-12" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24 sm:w-28" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="size-5 rounded-md" />
                    <Skeleton className="size-5 rounded-md" />
                  </div>
                </div>
              </div>

              {/* Footer: timestamp / website */}
              <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-2.5 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <SettingsCard>
          <div className="text-center py-10 space-y-3">
            <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <KeyRound className="size-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {searchQuery
                ? "No matching credentials"
                : "No credentials stored yet"}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? "Try adjusting your search query or category filter."
                : "Save your bank accounts, email IDs, apps, and website passwords safely."}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAdd}
                className="gap-2 mt-2"
              >
                <Plus className="size-4" />
                Store First Password
              </Button>
            )}
          </div>
        </SettingsCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredItems.map((item) => {
            const isRevealed = Boolean(revealedPasswords[item.id]);
            const cached = decryptedValues[item.id];
            const displayUsername = cached ? cached.username : "••••••••";
            const displayPassword = isRevealed
              ? cached?.password || "••••••••"
              : "••••••••••••";

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-white/10 p-3 sm:p-4 space-y-3 hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between"
              >
                {/* Header: Title + Category + Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <div className="size-8 sm:size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm">
                      {item.title.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize shrink-0 font-semibold border border-slate-200 dark:border-white/10">
                          {item.category}
                        </span>
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
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 truncate"
                        >
                          <span className="truncate">{item.websiteUrl}</span>
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      title="Edit item"
                      className="p-2 sm:p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 transition-all"
                      aria-label="Edit credential"
                    >
                      <Edit3 className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingItem(item)}
                      title="Delete item"
                      className="p-2 sm:p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-90 transition-all"
                      aria-label="Delete credential"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* ID / Username Field */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    ID / Username / Email
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5">
                    <span className="text-xs sm:text-sm font-mono font-medium text-slate-800 dark:text-slate-200 truncate select-all">
                      {cached
                        ? displayUsername || "(none)"
                        : "Click copy or reveal to load"}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const dec = await getOrDecryptItem(item);
                        if (dec?.username) {
                          copyToClipboard(
                            dec.username,
                            "Username",
                            `${item.id}-user`,
                          );
                        } else {
                          toast.error("No username saved for this item");
                        }
                      }}
                      title="Copy Username"
                      className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-200/50 dark:hover:bg-slate-700/50 active:scale-90 transition-all shrink-0"
                      aria-label="Copy username"
                    >
                      {copiedId === `${item.id}-user` ? (
                        <Check className="size-4 text-emerald-500" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Password
                  </div>
                  <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5">
                    <span className="text-xs sm:text-sm font-mono font-medium text-slate-800 dark:text-slate-200 truncate select-all tracking-wider">
                      {displayPassword}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => togglePasswordReveal(item)}
                        title={isRevealed ? "Hide Password" : "Show Password"}
                        className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-200/50 dark:hover:bg-slate-700/50 active:scale-90 transition-all"
                        aria-label={
                          isRevealed ? "Hide password" : "Show password"
                        }
                      >
                        {isRevealed ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const dec = await getOrDecryptItem(item);
                          if (dec?.password) {
                            copyToClipboard(
                              dec.password,
                              "Password",
                              `${item.id}-pass`,
                            );
                          }
                        }}
                        title="Copy Password"
                        className="p-2 rounded-xl text-slate-400 hover:text-primary hover:bg-slate-200/50 dark:hover:bg-slate-700/50 active:scale-90 transition-all"
                        aria-label="Copy password"
                      >
                        {copiedId === `${item.id}-pass` ? (
                          <Check className="size-4 text-emerald-500" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notes (if decrypted and exists) */}
                {cached?.notes && (
                  <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-white/5">
                    <span className="font-bold text-slate-400 uppercase text-[9px] block">
                      Notes
                    </span>
                    <p className="line-clamp-2 mt-0.5 italic">{cached.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
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
        <form onSubmit={handleSaveItem} className="space-y-4 pt-2">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Title / Account Name *
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Netflix, HDFC Bank, Gmail"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <Select
                value={formCategory}
                onValueChange={(val) => setFormCategory(val as VaultCategory)}
              >
                <SelectTrigger className="w-full h-[42px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all">
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
                          <div className="flex items-center gap-2.5">
                            <CatIcon className="size-4 text-slate-500 dark:text-slate-400" />
                            <span>{cat.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ID / Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Login ID / Username / Email
            </label>
            <input
              type="text"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="e.g. john.doe@gmail.com or user123"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Password with Generator trigger */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Password *
              </label>
              <button
                type="button"
                onClick={() => setShowGenerator(!showGenerator)}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline active:scale-95 transition-transform"
              >
                <Sparkles className="size-3.5" />
                <span>
                  {showGenerator ? "Hide Generator" : "Generate Strong"}
                </span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-primary outline-none font-mono transition-all"
              />
            </div>
          </div>

          {/* Inline Generator Panel */}
          {showGenerator && (
            <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Password Length ({genLength})
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyGeneratedPassword}
                  className="gap-1.5 text-xs h-8 px-2.5 active:scale-95"
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
                className="w-full accent-primary cursor-pointer h-2 rounded-lg"
              />

              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/10 active:scale-95 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={genUppercase}
                    onChange={(e) => setGenUppercase(e.target.checked)}
                    className="accent-primary size-3.5"
                  />
                  <span>A-Z</span>
                </label>
                <label className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/10 active:scale-95 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={genNumbers}
                    onChange={(e) => setGenNumbers(e.target.checked)}
                    className="accent-primary size-3.5"
                  />
                  <span>0-9</span>
                </label>
                <label className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/10 active:scale-95 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={genSymbols}
                    onChange={(e) => setGenSymbols(e.target.checked)}
                    className="accent-primary size-3.5"
                  />
                  <span>!@#$</span>
                </label>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Encrypted Notes / Recovery Codes (Optional)
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Security questions, backup codes, or account number..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-base sm:text-sm focus:ring-2 focus:ring-primary outline-none resize-none transition-all"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAddEditModal(false)}
              className="w-full sm:w-auto h-11 sm:h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={savingItem}
              className="w-full sm:w-auto h-11 sm:h-9 font-bold"
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
