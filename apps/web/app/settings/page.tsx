"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Phone,
  Mail,
  UserCog,
  Target,
  ChevronDown,
  Save,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Shield,
  Fingerprint,
  Key,
  X,
  Delete,
  Plus,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { SessionList } from "@/components/dashboard/SessionList";
import { useSecurity } from "@/components/providers/SecurityProvider";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const { user, updateProfile, accounts, switchAccount } = useAuth();
  const { isLockEnabled, toggleLock, lockType } = useSecurity();
  const router = useRouter();
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const checkPWA = () => {
      const nav = window.navigator as Navigator & { standalone?: boolean };
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        || nav.standalone
        || document.referrer.includes('android-app://');
      setIsPWA(!!isStandalone);
    };
    checkPWA();
  }, []);

  const [formData, setFormData] = useState({
    needsTarget: 50,
    wantsTarget: 30,
    savingsTarget: 20,
    name: "",
    email: "",
    phone: "",
    gender: "Not Specified",
    dob: "1990-01-01",
    monthStartDate: 1,
  });

  const [showPinModal, setShowPinModal] = useState(false);
  const [tempPin, setTempPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinStep, setPinStep] = useState(1);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.displayName || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "Not Specified",
        dob: user.dob || "1990-01-01",
        monthStartDate: user.monthStartDate || 1,
        needsTarget: user.budgetTargets?.needs ?? 50,
        wantsTarget: user.budgetTargets?.wants ?? 30,
        savingsTarget: user.budgetTargets?.savings ?? 20,
      });
    }
  }, [user]);

  const saveIdentity = async () => {
    if (formData.phone && !/^\+?\d{10,15}$/.test(formData.phone.replace(/\s/g, ""))) {
      toast.error("Invalid phone number format");
      return;
    }

    await updateProfile({
      phone: formData.phone,
      gender: formData.gender,
      dob: formData.dob,
      monthStartDate: formData.monthStartDate,
    });
    toast.success("Identity profile updated");
  };

  const saveBudgets = async () => {
    const total = formData.needsTarget + formData.wantsTarget + formData.savingsTarget;
    if (total !== 100) {
      toast.error(`Targets must sum to 100%. Currently: ${total}%`);
      return;
    }

    await updateProfile({
      budgetTargets: {
        needs: formData.needsTarget,
        wants: formData.wantsTarget,
        savings: formData.savingsTarget,
      },
    });
    toast.success("Budget Strategy Synchronized");
  };

  const handlePinAction = (num: string) => {
    if (pinStep === 1) {
      if (tempPin.length < 4) {
        const next = tempPin + num;
        setTempPin(next);
        if (next.length === 4) setPinStep(2);
      }
    } else {
      if (confirmPin.length < 4) {
        const next = confirmPin + num;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === tempPin) {
            toggleLock(true, "pin", next).then(() => {
              setShowPinModal(false);
              resetPinModal();
            });
          } else {
            toast.error("PINs do not match");
            setConfirmPin("");
          }
        }
      }
    }
  };

  const resetPinModal = () => {
    setTempPin("");
    setConfirmPin("");
    setPinStep(1);
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 space-y-8 pb-32 lg:pb-12">
      <PageHeader
        title="Protocol Settings"
        subtitle="Manage your financial operating system"
      />

      <div className="space-y-6 sm:gap-8">
        {/* Profile Card (Full Width) */}
        <SectionCard
          title="Identity Profile"
          subtitle="Core personal metadata"
          icon={<UserCog className="w-4 h-4" />}
          onSave={saveIdentity}
          isDirty={
            formData.phone !== (user.phone || "") ||
            formData.gender !== (user.gender || "Not Specified") ||
            formData.dob !== (user.dob || "1990-01-01") ||
            formData.monthStartDate !== (user.monthStartDate || 1)
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Identity
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  disabled
                  className="w-full h-11 pl-11 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-400 opacity-60 cursor-not-allowed text-xs font-black ring-1 ring-slate-100 dark:ring-white/5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Communication
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full h-11 pl-11 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-slate-400 opacity-60 cursor-not-allowed text-xs font-black ring-1 ring-slate-100 dark:ring-white/5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Mobile Uplink
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full h-11 pl-11 bg-white dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white text-xs font-black ring-1 ring-slate-100 dark:ring-white/5 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Gender Identity
              </label>
              <div className="relative">
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-11 px-4 pr-10 appearance-none bg-white dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white text-xs font-black ring-1 ring-slate-100 dark:ring-white/5 transition-all"
                >
                  <option>Not Specified</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Fiscal Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={formData.monthStartDate}
                  onChange={(e) => setFormData({ ...formData, monthStartDate: parseInt(e.target.value) })}
                  className="w-full h-11 pl-11 appearance-none bg-white dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white text-xs font-black ring-1 ring-slate-100 dark:ring-white/5 transition-all"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>Day {d}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 pl-1">
                Sets the first day of your financial month
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                Biological Origin
              </label>
              <div className="relative group">
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full h-11 pl-11 pr-4 bg-white dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white text-xs font-black ring-1 ring-slate-100 dark:ring-white/5 transition-all appearance-none"
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Side-by-Side Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Budget Protocol */}
          {user.role !== "admin" && (
            <SectionCard
              title="Budget Protocol"
              subtitle="Resource allocation targets"
              icon={<Target className="w-4 h-4" />}
              onSave={saveBudgets}
              isDirty={
                formData.needsTarget !== (user.budgetTargets?.needs ?? 50) ||
                formData.wantsTarget !== (user.budgetTargets?.wants ?? 30) ||
                formData.savingsTarget !== (user.budgetTargets?.savings ?? 20)
              }
            >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">
                    Essentials
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.needsTarget}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          needsTarget: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full h-11 px-4 pr-10 bg-indigo-50/30 dark:bg-indigo-500/5 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white text-xs font-black ring-1 ring-indigo-500/20 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400/50 font-black text-xs">
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-pink-500 uppercase tracking-widest pl-1">
                    Aspirations
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.wantsTarget}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          wantsTarget: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full h-11 px-4 pr-10 bg-pink-50/30 dark:bg-pink-500/5 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none text-slate-900 dark:text-white text-xs font-black ring-1 ring-pink-500/20 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400/50 font-black text-xs">
                      %
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest pl-1">
                    Capital
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.savingsTarget}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          savingsTarget: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full h-11 px-4 pr-10 bg-emerald-50/30 dark:bg-emerald-500/5 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-xs font-black ring-1 ring-emerald-500/20 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400/50 font-black text-xs">
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`mt-4 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 ${formData.needsTarget + formData.wantsTarget + formData.savingsTarget === 100 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}
              >
                {formData.needsTarget +
                  formData.wantsTarget +
                  formData.savingsTarget ===
                  100 ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                <span>
                  Equilibrium:{" "}
                  {formData.needsTarget +
                    formData.wantsTarget +
                    formData.savingsTarget}
                  % / 100%
                </span>
              </div>
            </SectionCard>
          )}

          {/* Identity Switcher */}
          <SectionCard
            title="Identity Switcher"
            subtitle="Switch between authorized account nodes"
            icon={<UserIcon className="w-4 h-4" />}
          >
            <div className="space-y-4">
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Authorized Nodes active on this bridge
              </p>

              <div className="space-y-2">
                {accounts.map((acc) => (
                  <button
                    key={acc.uid}
                    onClick={() =>
                      acc.uid !== user?.uid && switchAccount(acc.uid)
                    }
                    disabled={acc.uid === user?.uid}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group ${acc.uid === user?.uid ? "bg-primary/5 border-primary/20 cursor-default" : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 hover:border-primary/50 hover:bg-primary/5"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`size-8 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 ${acc.uid === user?.uid ? "bg-primary/10 text-primary" : "bg-slate-200 dark:bg-white/10 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors"}`}
                      >
                        {acc.photoURL ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={acc.photoURL}
                            className="size-full rounded-xl object-cover"
                            alt=""
                          />
                        ) : (
                          (acc.displayName || "U").charAt(0)
                        )}
                      </div>
                      <div className="min-w-0 text-left">
                        <p
                          className={`text-[10px] font-black uppercase truncate ${acc.uid === user?.uid ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-primary"}`}
                        >
                          {acc.displayName}
                        </p>
                        <p
                          className={`text-[7px] font-black uppercase tracking-widest ${acc.uid === user?.uid ? "text-primary" : "text-slate-400"}`}
                        >
                          {acc.uid === user?.uid
                            ? "Primary Node"
                            : acc.role === "admin"
                              ? "Privileged Access"
                              : "Authorized Sync"}
                        </p>
                      </div>
                    </div>
                    {acc.uid === user?.uid ? (
                      <div className="size-1.5 rounded-full bg-primary animate-pulse mr-1" />
                    ) : (
                      <Zap className="size-3 text-slate-300 group-hover:text-primary transition-colors" />
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => router.push('/login?mode=add')}
                className="w-full h-10 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase text-slate-400 hover:text-primary hover:border-primary/50 transition-all font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                Authorize Sub-Node
              </button>
            </div>
          </SectionCard>
        </div>

        {/* Security Lattice (Full Width) */}
        {isPWA && (
          <SectionCard
            title="Security Lattice"
            subtitle="Biometric and cryptographic access controls"
            icon={<Shield className="w-4 h-4" />}
          >
            <div className="space-y-3">
              <button
                onClick={() => toggleLock(!isLockEnabled || lockType !== "biometric", "biometric")}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${isLockEnabled && lockType === "biometric" ? "border-primary bg-primary/5" : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Fingerprint className={`w-5 h-5 ${isLockEnabled && lockType === "biometric" ? "text-primary" : "text-slate-400"}`} />
                  <div className={`size-4 rounded-full border-2 flex items-center justify-center ${isLockEnabled && lockType === "biometric" ? "border-primary bg-primary" : "border-slate-300 dark:border-slate-600"}`}>
                    {isLockEnabled && lockType === "biometric" && <div className="size-1 bg-white rounded-full" />}
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Biometric Access</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">FaceID / TouchID</p>
              </button>

              <button
                onClick={() => {
                  if (isLockEnabled && lockType === "pin") toggleLock(false);
                  else setShowPinModal(true);
                }}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${isLockEnabled && lockType === "pin" ? "border-indigo-500 bg-indigo-500/5" : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Key className={`w-5 h-5 ${isLockEnabled && lockType === "pin" ? "text-indigo-500" : "text-slate-400"}`} />
                  <div className={`size-4 rounded-full border-2 flex items-center justify-center ${isLockEnabled && lockType === "pin" ? "border-indigo-500 bg-indigo-500" : "border-slate-300 dark:border-slate-600"}`}>
                    {isLockEnabled && lockType === "pin" && <div className="size-1 bg-white rounded-full" />}
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Secure PIN</p>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">4-Digit Verification</p>
              </button>
            </div>
          </SectionCard>
        )}
      </div>

      {/* Session List (Full Width) */}
      <SessionList />

      {/* Security Pin Modal */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#0f1115] w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
            >
              <button
                onClick={() => {
                  setShowPinModal(false);
                  resetPinModal();
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center">
                <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-6">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                  {pinStep === 1 ? "Set Security PIN" : "Confirm Security PIN"}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-10">
                  {pinStep === 1 ? "Enter a 4-digit code" : "Re-enter your 4-digit code"}
                </p>

                <div className="flex gap-4 mb-12">
                  {[0, 1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className={`size-3 rounded-full border-2 transition-all ${(pinStep === 1 ? tempPin : confirmPin).length > idx
                        ? "bg-indigo-500 border-indigo-500 scale-125"
                        : "border-slate-200 dark:border-white/10"
                        }`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3 w-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handlePinAction(num.toString())}
                      className="h-14 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-black text-lg hover:bg-slate-100 dark:hover:bg-white/10 active:scale-90 transition-all"
                    >
                      {num}
                    </button>
                  ))}
                  <div />
                  <button
                    onClick={() => handlePinAction("0")}
                    className="h-14 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-black text-lg hover:bg-slate-100 dark:hover:bg-white/10 active:scale-90 transition-all"
                  >
                    0
                  </button>
                  <button
                    onClick={() => {
                      if (pinStep === 1) setTempPin(tempPin.slice(0, -1));
                      else setConfirmPin(confirmPin.slice(0, -1));
                    }}
                    className="h-14 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  children,
  onSave,
  isDirty
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onSave?: () => void;
  isDirty?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6 shadow-2xl shadow-slate-200/50 dark:shadow-none transition-all overflow-hidden lg:overflow-visible flex flex-col">
      <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest truncate">{title}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{subtitle}</p>
        </div>
      </div>
      
      <div className="pt-2 flex-grow">
        {children}
      </div>

      {onSave && (
        <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end">
          <button
            onClick={onSave}
            disabled={!isDirty}
            className="h-11 px-8 w-full sm:w-auto bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100 flex items-center justify-center gap-2 group whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
            Commit Changes
          </button>
        </div>
      )}
    </div>
  );
}
