import React, { useState, useEffect } from "react";
import { User, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Input } from "@/components/ui/Input";
import { DateInput } from "@/components/ui/DateInput";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { SettingsCard } from "./SettingsCard";
import { SettingsSection } from "./SettingsSection";
import { SettingsField } from "./SettingsField";

export function ProfileTab() {
  const { user, updateProfile } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [gender, setGender] = useState(user?.gender || "not_specified");
  const [phone, setPhone] = useState(user?.phone || "");
  const [dob, setDob] = useState(user?.dob || "");
  const [monthStartDate, setMonthStartDate] = useState(
    user?.monthStartDate || 1,
  );
  const [needsTarget, setNeedsTarget] = useState(
    user?.budgetTargets?.needs || 50,
  );
  const [wantsTarget, setWantsTarget] = useState(
    user?.budgetTargets?.wants || 30,
  );
  const [savingsTarget, setSavingsTarget] = useState(
    user?.budgetTargets?.savings || 20,
  );
  const [isUpdating, setIsUpdating] = useState(false);

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
          savings: savingsTarget,
        },
      });
      toast.success("Identity profile synchronized");
    } catch (err) {
      console.error("Failed to update profile:", err);
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

  const totalAllocated = needsTarget + wantsTarget + savingsTarget;

  return (
    <SettingsCard
      icon={User}
      title="Identity Profile"
      subtitle="Primary account credentials"
      footer={
        <Button
          onClick={handleUpdateProfile}
          disabled={isUpdating || !hasChanges}
          className="w-full sm:w-auto px-8 h-10 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 text-[10px] disabled:opacity-50 disabled:shadow-none"
        >
          {isUpdating ? "Synchronizing..." : "Apply Transformations"}
        </Button>
      }
    >
      {/* 6-Field Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SettingsField label="Full Name">
          <Input
            placeholder="Your full name"
            value={displayName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDisplayName(e.target.value)
            }
            className="h-10 rounded-xl"
          />
        </SettingsField>

        <SettingsField label="Email Address">
          <Input
            placeholder="Email address"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            className="h-10 rounded-xl"
          />
        </SettingsField>

        <SettingsField label="Mobile Number">
          <Input
            placeholder="+91 XXXXX XXXXX"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPhone(e.target.value)
            }
            className="h-10 rounded-xl"
          />
        </SettingsField>

        <SettingsField label="Date of Birth">
          <DateInput
            value={dob}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setDob(e.target.value)
            }
            className="h-10 py-2 rounded-xl"
          />
        </SettingsField>

        <SettingsField label="Gender Identity">
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger className="h-10 font-bold text-xs rounded-xl">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-white/10 shadow-2xl">
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="not_specified">Not Specified</SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>

        <SettingsField label="Fiscal Cycle Reset Day">
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
              className="w-full h-10 px-3 pl-10 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-xs font-semibold text-slate-900 dark:text-white disabled:opacity-50"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
          </div>
        </SettingsField>
      </div>

      {/* Financial Adherence Rules Section */}
      <SettingsSection
        tag="Protocol"
        title="Financial Adherence Rules"
        description="Configure target budget distribution across essential, discretionary, and investment nodes."
        rightElement={
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-white/10">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Total Allocated:
            </div>
            <div
              className={`text-sm font-black ${
                totalAllocated === 100 ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {totalAllocated}%
            </div>
          </div>
        }
      >
        {/* Minimal Multi-Segment Progress Bar */}
        <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex">
          <motion.div
            animate={{ width: `${needsTarget}%` }}
            className="h-full bg-emerald-500 transition-all duration-300"
          />
          <motion.div
            animate={{ width: `${wantsTarget}%` }}
            className="h-full bg-amber-500 transition-all duration-300"
          />
          <motion.div
            animate={{ width: `${savingsTarget}%` }}
            className="h-full bg-indigo-500 transition-all duration-300"
          />
        </div>

        {/* 3 Metric Allocations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Needs",
              val: needsTarget,
              set: setNeedsTarget,
              color: "text-emerald-500",
              bg: "bg-emerald-500/5",
              border: "border-emerald-500/20",
            },
            {
              label: "Wants",
              val: wantsTarget,
              set: setWantsTarget,
              color: "text-amber-500",
              bg: "bg-amber-500/5",
              border: "border-amber-500/20",
            },
            {
              label: "Savings",
              val: savingsTarget,
              set: setSavingsTarget,
              color: "text-indigo-500",
              bg: "bg-indigo-500/5",
              border: "border-indigo-500/20",
            },
          ].map((field) => (
            <div
              key={field.label}
              className={`p-3.5 rounded-xl ${field.bg} border ${field.border} space-y-2`}
            >
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  {field.label}
                </label>
                <span className={`text-xs font-black ${field.color}`}>
                  {field.val}%
                </span>
              </div>
              <Input
                type="number"
                min="0"
                max="100"
                value={field.val}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.set(parseInt(e.target.value) || 0)
                }
                className="w-full h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold text-xs rounded-lg"
              />
            </div>
          ))}
        </div>
      </SettingsSection>
    </SettingsCard>
  );
}
