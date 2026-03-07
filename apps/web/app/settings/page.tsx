"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect } from "react";
import { User as UserIcon, Phone, Mail, UserCog, Target, ChevronDown, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";

import { useSecurity } from "@/components/providers/SecurityProvider";
import { Shield, Fingerprint, Key, X, Delete } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { isLockEnabled, toggleLock, lockType } = useSecurity();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    needsTarget: 50,
    wantsTarget: 30,
    savingsTarget: 20,
    name: "",
    email: "",
    phone: "+91 ",
    gender: "Not Specified",
    dob: "",
  });

  const [showPinModal, setShowPinModal] = useState(false);
  const [tempPin, setTempPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinStep, setPinStep] = useState(1); // 1 = entry, 2 = confirmation

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.displayName || "",
        email: user.email || "",
        phone: user.phone || "+91 ",
        gender: user.gender || "Not Specified",
        dob: user.dob || "1990-01-01",
        needsTarget: user.budgetTargets?.needs ?? 50,
        wantsTarget: user.budgetTargets?.wants ?? 30,
        savingsTarget: user.budgetTargets?.savings ?? 20,
      });
    }
  }, [user]);

  const isDirty = (
    String(formData.name || "").trim() !== String(user?.displayName || "").trim() ||
    String(formData.email || "").trim() !== String(user?.email || "").trim() ||
    String(formData.phone || "+91 ").trim() !== String(user?.phone || "+91 ").trim() ||
    String(formData.gender || "Not Specified") !== String(user?.gender || "Not Specified") ||
    String(formData.dob || "1990-01-01") !== String(user?.dob || "1990-01-01") ||
    Math.round(Number(formData.needsTarget ?? 50)) !== Math.round(Number(user?.budgetTargets?.needs ?? 50)) ||
    Math.round(Number(formData.wantsTarget ?? 30)) !== Math.round(Number(user?.budgetTargets?.wants ?? 30)) ||
    Math.round(Number(formData.savingsTarget ?? 20)) !== Math.round(Number(user?.budgetTargets?.savings ?? 20))
  );

  const handleSave = () => {
    // Phone validation (Optional but good: 10 digits prefixed with +91)
    const phoneRegex = /^\+91\s\d{10}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      toast.error("Mobile number must be in '+91 XXXXXXXXXX' format");
      return;
    }

    const total = formData.needsTarget + formData.wantsTarget + formData.savingsTarget;
    if (total !== 100) {
      toast.error(`Targets must sum to 100%. Currently: ${total}%`);
      return;
    }

    updateProfile({
      phone: formData.phone,
      gender: formData.gender,
      dob: formData.dob,
      budgetTargets: {
        needs: formData.needsTarget,
        wants: formData.wantsTarget,
        savings: formData.savingsTarget,
      }
    });
    toast.success("Profile Updated Successfully!");
    
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
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
            toggleLock(true, "pin", next);
            setShowPinModal(false);
            resetPinModal();
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
    <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 space-y-4 sm:space-y-6 pb-20 lg:pb-8 pt-0">
      {/* Sticky Header */}
      <PageHeader
        title="Architect Settings"
        subtitle="Configure your financial engine"
        className="space-y-1 mb-4"
      />

      <div className="rounded-3xl border border-slate-200 bg-white p-5 md:p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none dark:border-white/5 dark:bg-slate-900 space-y-6 md:space-y-8">
        
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-6 md:pb-8">
          <div className="size-14 md:size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 relative overflow-hidden group">
            {formData.gender === "Male" ? (
              <UserIcon className="w-6 h-6 md:w-8 md:h-8" />
            ) : formData.gender === "Female" ? (
              <UserIcon className="w-6 h-6 md:w-8 md:h-8" />
            ) : (
              <UserIcon className="w-6 h-6 md:w-8 md:h-8" />
            )}
            <div className="absolute inset-0 bg-primary/20 scale-0 group-hover:scale-150 transition-transform duration-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900 dark:text-white truncate tracking-tight">{formData.name}</h2>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">Primary Node</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCog className="w-5 h-5 text-primary" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Profile Core</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Legal Identity</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={formData.name}
                  disabled
                  className="w-full h-12 pl-11 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed text-xs font-black ring-1 ring-slate-100 dark:ring-white/5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Communication Node</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={formData.email}
                  disabled
                  className="w-full h-12 pl-11 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed text-xs font-black ring-1 ring-slate-100 dark:ring-white/5"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mobile Uplink</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full h-12 pl-11 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white text-xs font-black ring-1 ring-slate-100 dark:ring-white/5 transition-all"
                />
              </div>
            </div>


            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Gender Identity</label>
              <div className="relative">
                <select 
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full h-12 px-4 pr-10 appearance-none bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white text-xs font-black ring-1 ring-slate-100 dark:ring-white/5 transition-all min-w-0"
                >
                  <option>Not Specified</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Biological Horizon (DOB)</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <select 
                    value={formData.dob.split('-')[2] || "01"}
                    onChange={(e) => {
                      const parts = formData.dob.split('-');
                      parts[2] = e.target.value.padStart(2, '0');
                      setFormData({ ...formData, dob: parts.join('-') });
                    }}
                    className="w-full h-12 px-4 appearance-none bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white text-xs font-black ring-1 ring-slate-100 dark:ring-white/5 transition-all"
                  >
                    {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative flex-[1.5]">
                  <select 
                    value={formData.dob.split('-')[1] || "01"}
                    onChange={(e) => {
                      const parts = formData.dob.split('-');
                      parts[1] = e.target.value.padStart(2, '0');
                      setFormData({ ...formData, dob: parts.join('-') });
                    }}
                    className="w-full h-12 px-4 appearance-none bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white text-xs font-black ring-1 ring-slate-100 dark:ring-white/5 transition-all"
                  >
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                      <option key={m} value={(i + 1).toString().padStart(2, '0')}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <div className="relative flex-[1.2]">
                  <select 
                    value={formData.dob.split('-')[0] || "1990"}
                    onChange={(e) => {
                      const parts = formData.dob.split('-');
                      parts[0] = e.target.value;
                      setFormData({ ...formData, dob: parts.join('-') });
                    }}
                    className="w-full h-12 px-4 appearance-none bg-slate-50 dark:bg-slate-950 border-none rounded-2xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white text-xs font-black ring-1 ring-slate-100 dark:ring-white/5 transition-all"
                  >
                    {Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-white/5 mt-8">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-indigo-500" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Security & Privacy</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Biometrics Toggle */}
              <div className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${isLockEnabled && lockType === 'biometric' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50'}`}
                onClick={() => {
                  if (isLockEnabled && lockType === 'biometric') {
                    toggleLock(false);
                  } else {
                    toggleLock(true, 'biometric');
                  }
                }}
              >
                 <div className="flex items-center justify-between mb-4">
                    <div className="size-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-primary shadow-sm">
                       <Fingerprint className="w-5 h-5" />
                    </div>
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${isLockEnabled && lockType === 'biometric' ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                      {isLockEnabled && lockType === 'biometric' && <div className="size-1.5 rounded-full bg-white" />}
                    </div>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Biometric Lock</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">FaceID or Fingerprint</p>
                 </div>
              </div>

              {/* PIN Toggle */}
              <div className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${isLockEnabled && lockType === 'pin' ? 'border-primary bg-primary/5' : 'border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50'}`}
                onClick={() => {
                  if (isLockEnabled && lockType === 'pin') {
                    toggleLock(false);
                  } else {
                    setShowPinModal(true);
                  }
                }}
              >
                 <div className="flex items-center justify-between mb-4">
                    <div className="size-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-indigo-500 shadow-sm">
                       <Key className="w-5 h-5" />
                    </div>
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${isLockEnabled && lockType === 'pin' ? 'border-primary bg-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                      {isLockEnabled && lockType === 'pin' && <div className="size-1.5 rounded-full bg-white" />}
                    </div>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">PIN Lock</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">4-Digit Security Code</p>
                 </div>
              </div>
            </div>
            {isLockEnabled && (
              <div className="mt-4">
                 <button 
                   onClick={() => toggleLock(false)}
                   className="w-full p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-900/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px]"
                 >
                   <Shield className="w-4 h-4" />
                   Turn Off Security and Privacy
                 </button>
              </div>
            )}
          </div>

          {/* PIN Modal */}
          <AnimatePresence>
            {showPinModal && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-md bg-black/40">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white dark:bg-[#0f1115] w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative"
                >
                  <button onClick={() => { setShowPinModal(false); resetPinModal(); }} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex flex-col items-center">
                    <div className="size-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-6">
                      <Key className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-2">
                      {pinStep === 1 ? 'Set Security PIN' : 'Confirm Security PIN'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-10">
                      {pinStep === 1 ? 'Enter a 4-digit code' : 'Re-enter your 4-digit code'}
                    </p>

                    <div className="flex gap-4 mb-12">
                      {[0, 1, 2, 3].map((idx) => (
                        <div 
                          key={idx} 
                          className={`size-3 rounded-full border-2 transition-all ${
                            (pinStep === 1 ? tempPin : confirmPin).length > idx 
                            ? 'bg-indigo-500 border-indigo-500 scale-125' 
                            : 'border-slate-200 dark:border-white/10'
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

          <div className="pt-8 border-t border-slate-100 dark:border-white/5 mt-8">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-emerald-500" />
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Budget Protocol Targets</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest pl-1">Essential Needs</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.needsTarget}
                    onChange={(e) => setFormData({ ...formData, needsTarget: parseFloat(e.target.value) || 0 })}
                    className="w-full h-12 px-4 pr-10 bg-indigo-50/30 dark:bg-indigo-500/5 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white text-sm font-black ring-1 ring-indigo-500/20 transition-all font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400/50 font-black text-xs">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-pink-500 uppercase tracking-widest pl-1">Discretionary wants</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.wantsTarget}
                    onChange={(e) => setFormData({ ...formData, wantsTarget: parseFloat(e.target.value) || 0 })}
                    className="w-full h-12 px-4 pr-10 bg-pink-50/30 dark:bg-pink-500/5 border-none rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none text-slate-900 dark:text-white text-sm font-black ring-1 ring-pink-500/20 transition-all font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400/50 font-black text-xs">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest pl-1">Capital Savings</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.savingsTarget}
                    onChange={(e) => setFormData({ ...formData, savingsTarget: parseFloat(e.target.value) || 0 })}
                    className="w-full h-12 px-4 pr-10 bg-emerald-50/30 dark:bg-emerald-500/5 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white text-sm font-black ring-1 ring-emerald-500/20 transition-all font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400/50 font-black text-xs">%</span>
                </div>
              </div>
            </div>

            <div className={`mt-4 px-4 py-2 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex md:inline-flex items-center justify-center md:justify-start gap-2 ${formData.needsTarget + formData.wantsTarget + formData.savingsTarget === 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {formData.needsTarget + formData.wantsTarget + formData.savingsTarget === 100 ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>Configuration Equilibrium: {formData.needsTarget + formData.wantsTarget + formData.savingsTarget}% </span>
              {formData.needsTarget + formData.wantsTarget + formData.savingsTarget !== 100 && <span className="hidden sm:inline">(Must equal 100%)</span>}
            </div>
          </div>

          <div className="pt-6">
            <button 
              onClick={handleSave}
              disabled={!isDirty}
              className="w-full md:w-auto h-11 px-8 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <Save className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Sync Architecture
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
