"use client";

import { useState, useEffect } from "react";
import { DateInput } from "@/components/ui/DateInput";
import { Card } from "@/components/ui/Card";
import {
  Shield,
  User,
  Settings as SettingsIcon,
  Database,
  ArrowRight,
  Check,
  Calendar,
  Moon,
  Sun,
  Plus,
  Trash2,
  UserPlus,
  Download,
  RefreshCw,
  TrendingUp,
  Fingerprint,
  Bell
} from "lucide-react";
import { useSecurity } from "@/components/providers/SecurityProvider";
import { useSignals } from "@/components/providers/SignalProvider";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "../../components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/Select";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { SessionList } from "@/components/dashboard/SessionList";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import api from "@/lib/api";
import {
  User as UserType,
  Account,
  Transaction,
  FinancialGoal,
  Reminder,
  Category,
  AssetClass
} from "@repo/types";

type TabType = "profile" | "preferences" | "security" | "identities" | "data";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const { user, loading: authLoading, updateProfile, accounts, switchAccount, removeAccount } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [gender, setGender] = useState(user?.gender || "not_specified");
  const [phone, setPhone] = useState(user?.phone || "");
  const [dob, setDob] = useState(user?.dob || "");
  const [monthStartDate, setMonthStartDate] = useState(user?.monthStartDate || 1);
  const [needsTarget, setNeedsTarget] = useState(user?.budgetTargets?.needs || 50);
  const [wantsTarget, setWantsTarget] = useState(user?.budgetTargets?.wants || 30);
  const [savingsTarget, setSavingsTarget] = useState(user?.budgetTargets?.savings || 20);
  const [isUpdating, setIsUpdating] = useState(false);

  // Security Lock State
  const { isLockEnabled, lockType, toggleLock } = useSecurity();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [setupPin, setSetupPin] = useState("");

  const { permission, requestPermission } = useSignals();

  const [isExporting, setIsExporting] = useState(false);

  // Sync theme with persistent preferences
  useEffect(() => {
    if (user?.preferences?.theme && user.preferences.theme !== theme) {
      setTheme(user.preferences.theme);
    }
  }, [user?.preferences?.theme, theme, setTheme]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setEmail(user.email || "");
      setGender(user.gender || "not_specified");
      setPhone(user.phone || "");
      setDob(user.dob || "");
      setMonthStartDate(user.monthStartDate || 1);
      setNeedsTarget(user.budgetTargets?.needs || 50);
      setWantsTarget(user.budgetTargets?.wants || 30);
      setSavingsTarget(user.budgetTargets?.savings || 20);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    const total = needsTarget + wantsTarget + savingsTarget;
    if (total > 100) {
      toast.error("Budget Protocol total cannot exceed 100%");
      return;
    }
    setIsUpdating(true);
    try {
      await updateProfile({
        displayName,
        email,
        gender,
        phone,
        dob,
        monthStartDate,
        budgetTargets: {
          needs: needsTarget,
          wants: wantsTarget,
          savings: savingsTarget
        }
      });
      toast.success("Identity profile synchronized");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Profile synchronization failure");
    } finally {
      setIsUpdating(false);
    }
  };

  const hasChanges =
    displayName !== (user?.displayName || "") ||
    email !== (user?.email || "") ||
    gender !== (user?.gender || "not_specified") ||
    phone !== (user?.phone || "") ||
    dob !== (user?.dob || "") ||
    monthStartDate !== (user?.monthStartDate || 1) ||
    needsTarget !== (user?.budgetTargets?.needs || 50) ||
    wantsTarget !== (user?.budgetTargets?.wants || 30) ||
    savingsTarget !== (user?.budgetTargets?.savings || 20);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const [
        profile,
        accountsRes,
        transactionsRes,
        goalsRes,
        remindersRes,
        categoriesRes,
        assetClassesRes
      ] = await Promise.all([
        api.get("/finance/profile").then(res => res.data as UserType),
        api.get("/finance/accounts").then(res => res.data as Account[]),
        api.get("/finance/transactions").then(res => res.data as Transaction[]),
        api.get("/finance/goals").then(res => res.data as FinancialGoal[]),
        api.get("/finance/reminders").then(res => res.data as Reminder[]),
        api.get("/finance/categories").then(res => res.data as Category[]),
        api.get("/finance/asset-classes").then(res => res.data as AssetClass[])
      ]);

      const data = {
        profile,
        accounts: accountsRes,
        transactions: transactionsRes,
        goals: goalsRes,
        reminders: remindersRes,
        categories: categoriesRes,
        assetClasses: assetClassesRes,
        exportedAt: new Date().toISOString(),
        version: "1.1.0"
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finease_full_archive_${new Date().getTime()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Full identity dataset archived and downloaded");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Dataset serialization failure");
    } finally {
      setIsExporting(false);
    }
  };


  const handleAddIdentity = () => {
    window.location.href = "/login?mode=add";
  };

  const tabs = [
    { id: "profile", label: "Identity Profile", icon: User, subtitle: "Manage your primary account credentials" },
    { id: "preferences", label: "Preferences", icon: SettingsIcon, subtitle: "Configure the visual parameters of the system" },
    { id: "security", label: "Security Lattice", icon: Shield, subtitle: "Monitoring active identity nodes and sessions" },
    { id: "identities", label: "Identity Switcher", icon: UserPlus, subtitle: "Hot-swap between linked identity nodes" },
    { id: "data", label: "Data Archive", icon: Database, subtitle: "Manage your identity's historical footprint" },
  ];

  if (authLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            <Skeleton className="h-64 lg:col-span-1" />
            <Skeleton className="h-[600px] lg:col-span-3" />
          </div>
        </div>
      </PageContainer>
    );
  }

  const activeTabData = tabs.find(t => t.id === activeTab)!;

  return (
    <PageContainer>
      <PageHeader
        title="System Settings"
        subtitle="Identity Configuration & Security Lattice Control"
        className="mb-2"
        actions={
          <div className="w-full lg:hidden">
            <Select
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as TabType)}
            >
              <SelectTrigger className="h-10 rounded-xl border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 font-black text-[9px] uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  {(() => {
                    const active = tabs.find(t => t.id === activeTab);
                    const Icon = active?.icon || User;
                    return <Icon className="size-3.5 text-primary" />;
                  })()}
                  <SelectValue placeholder="Select Tab" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 shadow-2xl">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <SelectItem
                      key={tab.id}
                      value={tab.id}
                      className="py-2.5 focus:bg-primary/5 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="size-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                        <span className="font-black text-[9px] uppercase tracking-widest">{tab.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-1 sm:mt-2">
        {/* Sidebar Tabs - Desktop Only */}
        <div className="hidden lg:block lg:col-span-1">
          <Card className="space-y-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-100 dark:border-white/5 shadow-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest ${activeTab === tab.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                    }`}
                >
                  <Icon className="size-4" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="ml-auto"
                    >
                      <Check className="size-4" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </Card>

        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card className="space-y-4 flex flex-col shadow-none border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4 -mx-1">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
                    <activeTabData.icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {activeTabData.label}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {activeTabData.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex-1">
                  {activeTab === "profile" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                            Full Name
                          </label>
                          <Input
                            placeholder="Your full name"
                            value={displayName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                            Email Address
                          </label>
                          <Input
                            placeholder="Email address"
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                            Mobile Number
                          </label>
                          <Input
                            placeholder="+91 XXXXX XXXXX"
                            value={phone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <DateInput
                          label="Date of Birth"
                          value={dob}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDob(e.target.value)}
                        />
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                            Gender Identity
                          </label>
                          <Select value={gender} onValueChange={setGender}>
                            <SelectTrigger className="h-10 font-bold text-xs">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 shadow-2xl">
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="not_specified">Not Specified</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Fiscal Cycle Reset Day
                          </label>
                          <div className="relative group">
                            <input
                              type="number"
                              min="1"
                              max="28"
                              value={monthStartDate}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const val = parseInt(e.target.value);
                                if (isNaN(val)) setMonthStartDate(1);
                                else setMonthStartDate(Math.max(1, Math.min(28, val)));
                              }}
                              className="w-full h-12 p-3 pl-10 bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-sm font-medium text-slate-900 dark:text-white disabled:opacity-50"
                            />
                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10 relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-primary">
                                  <span className="size-1.5 rounded-full bg-primary" /> Protocol
                                </div>
                                {/* Mobile-only compact total pill */}
                                <div className={`sm:hidden text-[9px] font-black uppercase ${needsTarget + wantsTarget + savingsTarget === 100 ? "text-emerald-500" : "text-rose-500"}`}>
                                  Total: {needsTarget + wantsTarget + savingsTarget}%
                                </div>
                              </div>
                              <h4 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Financial Adherence Rules</h4>
                              <p className="text-slate-500 dark:text-slate-400 text-[10px] font-medium leading-relaxed max-w-sm">
                                Configure your primary budget targets for balanced fiscal synchronization.
                              </p>
                            </div>
                            <div className="hidden sm:flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm min-w-[110px]">
                              <div className="flex-1">
                                <div className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total</div>
                                <div className={`text-base font-black ${needsTarget + wantsTarget + savingsTarget === 100 ? "text-emerald-500" : "text-rose-500"}`}>
                                  {needsTarget + wantsTarget + savingsTarget}%
                                </div>
                              </div>
                              <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10" />
                              <TrendingUp className="size-4 text-primary" />
                            </div>
                          </div>

                          {/* Minimal Progress Bar */}
                          <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden flex shadow-inner">
                            <motion.div animate={{ width: `${needsTarget}%` }} className="h-full bg-emerald-500" />
                            <motion.div animate={{ width: `${wantsTarget}%` }} className="h-full bg-amber-500" />
                            <motion.div animate={{ width: `${savingsTarget}%` }} className="h-full bg-indigo-500" />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            {[
                              { label: "Needs", val: needsTarget, set: setNeedsTarget, color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/10" },
                              { label: "Wants", val: wantsTarget, set: setWantsTarget, color: "text-amber-500", bg: "bg-amber-500/5", border: "border-amber-500/10" },
                              { label: "Savings", val: savingsTarget, set: setSavingsTarget, color: "text-indigo-500", bg: "bg-indigo-500/5", border: "border-indigo-500/10" },
                            ].map((field) => (
                              <div key={field.label} className={`px-4 py-3 rounded-xl ${field.bg} border ${field.border}`}>
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">{field.label}</label>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={field.val}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.set(parseInt(e.target.value) || 0)}
                                    className="w-full h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black text-center text-xs rounded-lg px-1"
                                  />
                                  <div className={`text-xs font-black ${field.color}`}>%</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                        <Button
                          onClick={handleUpdateProfile}
                          disabled={isUpdating || !hasChanges}
                          className="w-full sm:w-auto px-10 h-10 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 text-[10px] disabled:opacity-50 disabled:shadow-none"
                        >
                          {isUpdating ? "Synchronizing..." : "Apply Transformations"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeTab === "preferences" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { id: "light", label: "Brilliant", icon: Sun, desc: "High-contrast daylight optimization" },
                          { id: "dark", label: "Abyssal", icon: Moon, desc: "Low-light OLED-ready obsidian interface" },
                        ].map((mode) => {
                          const Icon = mode.icon;
                          const isSelected = theme === mode.id;

                          return (
                            <button
                              key={mode.id}
                              onClick={() => {
                                setTheme(mode.id);
                                updateProfile({ preferences: { ...user?.preferences, theme: mode.id as "light" | "dark" | "system" } });
                              }}
                              className={`flex flex-col items-start gap-4 p-5 rounded-3xl border-2 transition-all group relative overflow-hidden ${isSelected
                                ? "bg-primary/5 border-primary shadow-2xl shadow-primary/5 scale-[1.02]"
                                : "bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-white/10"
                                }`}
                            >
                              <div className={`size-12 rounded-xl flex items-center justify-center transition-all ${isSelected ? "bg-primary text-white" : "bg-white dark:bg-slate-900 text-slate-400 group-hover:scale-110"
                                }`}>
                                <Icon className="size-6" />
                              </div>
                              <div className="text-left">
                                <span className={`text-xs font-black uppercase tracking-[0.2em] block ${isSelected ? "text-primary" : "text-slate-900 dark:text-white"}`}>
                                  {mode.label}
                                </span>
                                <p className="text-[10px] font-bold text-slate-400 mt-1">{mode.desc}</p>
                              </div>
                              {isSelected && <Check className="absolute top-6 right-6 size-6 text-primary" />}
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 pb-1 block">
                          Standard Fiscal Currency (Locked)
                        </label>
                        <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10">
                          <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/10 flex items-center justify-center text-xl font-black text-primary">₹</div>
                            <div>
                              <span className="text-sm font-black text-slate-900 dark:text-white block">Indian Rupee (INR)</span>
                              <span className="text-[10px] font-bold text-slate-400">Primary localized denomination</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">Active Node</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "security" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-400">
                      {/* App Lock Configuration */}
                      <Card className="border-slate-200 dark:border-white/10 rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none">

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className={`size-2 rounded-full ${isLockEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Security Protocol</span>
                            </div>
                            <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Application Vault Lock</h4>
                            <p className="text-[10px] font-medium text-slate-400 max-w-[240px]">Architectural device-level authentication for your identity node.</p>
                          </div>
                          {isLockEnabled && (
                            <Button
                              onClick={() => toggleLock(false)}
                              variant="outline"
                              className="h-8 px-4 rounded-xl font-black text-[8px] uppercase tracking-widest border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Biometric Option */}
                          <button
                            onClick={() => toggleLock(true, "biometric")}
                            className={`relative overflow-hidden group p-4 rounded-2xl border-2 transition-all flex flex-col items-start gap-4 ${isLockEnabled && lockType === "biometric" ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-primary/30'}`}
                          >
                            <div className={`size-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${isLockEnabled && lockType === "biometric" ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-400'}`}>
                              <Fingerprint size={20} />
                            </div>
                            <div className="text-left">
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Biometric</div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase">FaceID / TouchID</div>
                            </div>
                            {isLockEnabled && lockType === "biometric" && (
                              <div className="absolute top-4 right-4">
                                <div className="size-5 rounded-full bg-primary text-white flex items-center justify-center">
                                  <Check size={12} />
                                </div>
                              </div>
                            )}
                          </button>

                          {/* PIN Option */}
                          <button
                            onClick={() => setShowPinSetup(true)}
                            className={`relative overflow-hidden group p-4 rounded-2xl border-2 transition-all flex flex-col items-start gap-4 ${isLockEnabled && lockType === "pin" ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-primary/30'}`}
                          >
                            <div className={`size-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${isLockEnabled && lockType === "pin" ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-400'}`}>
                              <Shield size={20} />
                            </div>
                            <div className="text-left">
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Security PIN</div>
                              <div className="text-[8px] font-bold text-slate-400 uppercase">4-Digit Access Code</div>
                            </div>
                            {isLockEnabled && lockType === "pin" && (
                              <div className="absolute top-4 right-4">
                                <div className="size-5 rounded-full bg-primary text-white flex items-center justify-center">
                                  <Check size={12} />
                                </div>
                              </div>
                            )}
                          </button>
                        </div>

                        {/* PIN Setup Modal Overlay */}
                        <AnimatePresence>
                          {showPinSetup && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                            >
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                                onClick={() => setShowPinSetup(false)}
                              />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-white/10 p-8 overflow-hidden"
                              >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                                  <Shield size={160} />
                                </div>

                                <div className="relative space-y-8 text-center">
                                  <div className="space-y-2">
                                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                      <Shield size={24} />
                                    </div>
                                    <h5 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Configure Vault PIN</h5>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Define your 4-digit master access code</p>
                                  </div>

                                  <div className="flex justify-center gap-4">
                                    {[0, 1, 2, 3].map((i) => (
                                      <div
                                        key={i}
                                        className={`size-4 rounded-full border-2 transition-all duration-300 ${setupPin.length > i ? 'bg-primary border-primary scale-110 shadow-lg shadow-primary/30' : 'border-slate-200 dark:border-white/10'}`}
                                      />
                                    ))}
                                  </div>

                                  <div className="grid grid-cols-3 gap-3">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"].map((btn) => (
                                      <button
                                        key={btn}
                                        onClick={async () => {
                                          if (btn === "C") setSetupPin("");
                                          else if (btn === "OK") {
                                            if (setupPin.length === 4) {
                                              const success = await toggleLock(true, "pin", setupPin);
                                              if (success) {
                                                setShowPinSetup(false);
                                                setSetupPin("");
                                                toast.success("Security PIN configured");
                                              }
                                            } else {
                                              toast.error("PIN must be 4 digits");
                                            }
                                          } else if (typeof btn === "number" && setupPin.length < 4) {
                                            setSetupPin(setupPin + btn);
                                          }
                                        }}
                                        className={`h-12 rounded-2xl font-black text-sm transition-all active:scale-95 ${btn === "OK" ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary'}`}
                                      >
                                        {btn}
                                      </button>
                                    ))}
                                  </div>

                                  <button
                                    onClick={() => {
                                      setShowPinSetup(false);
                                      setSetupPin("");
                                    }}
                                    className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
                                  >
                                    Cancel Operation
                                  </button>
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>

                      {/* Signal Protocol Configuration */}
                      <Card className="bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                          <Bell size={120} />
                        </div>

                        <div className="relative z-10 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className={`size-2 rounded-full ${permission === 'granted' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">Signal Protocol</span>
                              </div>
                              <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Intelligent Signals</h4>
                              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 max-w-sm">Receive architectural reminders and synchronization alerts directly to your device.</p>
                            </div>

                            <Button
                              onClick={requestPermission}
                              disabled={permission === 'granted'}
                              variant={permission === 'granted' ? "outline" : "primary"}
                              className={`h-10 px-6 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${permission === 'granted' ? 'border-emerald-500/20 text-emerald-500 cursor-default opacity-80' : 'shadow-lg shadow-primary/20'}`}
                            >
                              {permission === 'granted' ? "Signals Operational" : "Authorize Signals"}
                            </Button>
                          </div>

                          {permission === 'denied' && (
                            <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                              Access Denied. Please enable notifications in your browser/device settings to resume synchronization.
                            </p>
                          )}
                        </div>
                      </Card>

                      <div className="pt-2">
                        <SessionList />
                      </div>
                    </div>
                  )}

                  {activeTab === "identities" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Active Identity Nodes</h4>
                        <Button
                          onClick={handleAddIdentity}
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest gap-2"
                        >
                          <Plus size={14} /> Add Identity
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {accounts.map((acc) => (
                          <Card
                            key={acc.uid}
                            className={`flex items-center justify-between group transition-all duration-300 relative overflow-hidden shadow-none ${acc.uid === user?.uid
                              ? "border-primary ring-1 ring-primary/20 bg-primary/5"
                              : "hover:border-primary/50 border-slate-100 dark:border-white/5"
                              }`}
                          >
                            <div className="flex items-center gap-3 relative z-10">
                              <div className={`size-10 rounded-xl flex items-center justify-center text-sm font-black uppercase transition-all duration-500 ${acc.uid === user?.uid ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:scale-110"
                                }`}>
                                {acc.displayName?.[0] || acc.email?.[0] || "?"}
                              </div>
                              <div>
                                <h4 className="font-black text-[13px] text-slate-900 dark:text-white uppercase tracking-tight">
                                  {acc.displayName || "Linked Node"}
                                </h4>
                                <p className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">
                                  {acc.email}
                                </p>
                                {acc.uid === user?.uid && (
                                  <span className="text-[7px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded tracking-widest mt-0.5 inline-block">
                                    Primary Active
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 relative z-10">
                              {acc.uid !== user?.uid && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => switchAccount(acc.uid)}
                                  className="h-8 px-3 rounded-lg border-slate-200 dark:border-white/5 font-black text-[8px] uppercase tracking-widest hover:bg-primary hover:text-white group"
                                >
                                  Switch <ArrowRight className="size-2.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeAccount(acc.uid)}
                                className="size-8 rounded-lg border-rose-500 bg-rose-500/10 p-0 hover:bg-rose-500 hover:text-white text-rose-500 transition-all shadow-none flex items-center justify-center"
                                title="Remove Identity"
                              >
                                <Trash2 className="size-[18px] stroke-[2px]" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === "data" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                      <button
                        className="w-full text-left max-w-sm"
                        onClick={handleExportData}
                      >
                        <Card className="p-3.5 space-y-2.5 group hover:border-primary/50 transition-all cursor-pointer shadow-none border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                          <div className={`size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary transition-all group-hover:scale-110 ${isExporting ? 'animate-bounce' : ''}`}>
                            {isExporting ? <RefreshCw className="size-4 animate-spin" /> : <Download size={16} />}
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">Export Repository</h4>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 leading-relaxed">Full high-fidelity archive of identity datasets.</p>
                          </div>
                          <div className="pt-1 flex items-center gap-1.5 text-[8px] font-black uppercase text-primary tracking-widest group-hover:translate-x-0.5 transition-transform">
                            Initialize <ArrowRight size={10} />
                          </div>
                        </Card>
                      </button>

                      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-10 transition-transform group-hover:rotate-12 duration-1000">
                          <Shield size={160} />
                        </div>
                        <div className="relative z-10 max-w-lg space-y-4">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                            <span className="size-2 rounded-full bg-primary animate-pulse" /> Security Protocol
                          </div>
                          <h4 className="text-2xl font-black tracking-tight">Identity Persistence</h4>
                          <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            FinEase uses deep-lattice encryption to protect your data. Exported archives are protected by your primary auth tokens and should be stored in a secure cold-storage node.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </PageContainer>
  );
}
