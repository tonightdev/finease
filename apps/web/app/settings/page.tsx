"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect } from "react";
import { User as UserIcon, Phone, Mail, Calendar, UserCog, Target, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
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

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.displayName || "",
        email: user.email || "",
        phone: user.phone || "+91 9876543210",
        gender: user.gender || "Not Specified",
        dob: user.dob || "1990-01-01",
        needsTarget: user.budgetTargets?.needs ?? 50,
        wantsTarget: user.budgetTargets?.wants ?? 30,
        savingsTarget: user.budgetTargets?.savings ?? 20,
      });
    }
  }, [user]);

  const handleSave = () => {
    const total = formData.needsTarget + formData.wantsTarget + formData.savingsTarget;
    if (total !== 100) {
      toast.error(`Targets must sum to 100%. Currently: ${total}%`);
      return;
    }

    updateProfile({
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

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 font-medium mt-1">Manage your personal profile and preferences</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm dark:border-border-dark dark:bg-surface-dark space-y-8">
        
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-border-dark pb-8">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {formData.gender === "Male" ? (
              <span className="material-symbols-outlined !text-[32px]">face</span>
            ) : formData.gender === "Female" ? (
              <span className="material-symbols-outlined !text-[32px]">face_3</span>
            ) : (
              <UserIcon className="w-8 h-8" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{formData.name}</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Basic Member</p>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" /> Profile Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={formData.name}
                  disabled
                  className="w-full p-3 pl-10 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-border-dark rounded-xl text-slate-500 dark:text-slate-400 opacity-70 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  value={formData.email}
                  disabled
                  className="w-full p-3 pl-10 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-border-dark rounded-xl text-slate-500 dark:text-slate-400 opacity-70 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="tel" 
                  value={formData.phone}
                  disabled
                  className="w-full p-3 pl-10 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-border-dark rounded-xl text-slate-500 dark:text-slate-400 opacity-70 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-primary">Gender (Editable)</label>
              <div className="relative">
                <select 
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full p-3 pr-10 appearance-none bg-slate-50 dark:bg-[#0b0d12] border border-primary/50 dark:border-primary/50 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                >
                  <option>Not Specified</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-primary">Date of Birth (Editable)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="date" 
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full p-3 pl-10 bg-slate-50 dark:bg-[#0b0d12] border border-primary/50 dark:border-primary/50 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-border-dark mt-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-emerald-500" /> Budget Targets (%)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-indigo-500">Needs Target</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.needsTarget}
                    onChange={(e) => setFormData({ ...formData, needsTarget: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-indigo-500/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-pink-500">Wants Target</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.wantsTarget}
                    onChange={(e) => setFormData({ ...formData, wantsTarget: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-pink-500/50 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1 text-emerald-500">Savings Target</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.savingsTarget}
                    onChange={(e) => setFormData({ ...formData, savingsTarget: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 dark:bg-[#0b0d12] border border-emerald-500/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>

            <div className={`mt-3 text-xs font-bold ${formData.needsTarget + formData.wantsTarget + formData.savingsTarget === 100 ? 'text-emerald-500' : 'text-rose-500'}`}>
              Total: {formData.needsTarget + formData.wantsTarget + formData.savingsTarget}% 
              {formData.needsTarget + formData.wantsTarget + formData.savingsTarget !== 100 && ' (Must equal 100%)'}
            </div>
          </div>

          <div className="pt-6">
            <button 
              onClick={handleSave}
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
            >
              Save Changes
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
