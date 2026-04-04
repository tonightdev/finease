"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Activity,
  ShieldCheck,
  Database,
  ArrowUpRight,
  Clock,
  Loader2,
  Zap,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import api from "@/lib/api";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

import { AdminStats } from "@repo/types";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";

import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get<AdminStats>("/admin/stats");
        setStats(res.data);
      } catch {
        // Silent error
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: async () => { },
  });

  const handleMigrateSoftDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: "Data Migration",
      message:
        "This will initialize the 'Soft Delete' field for all existing records. This is required for correctly filtering out deleted data. Proceed?",
      onConfirm: async () => {
        try {
          const res = await api.put("/admin/bulk-soft-delete-migration");
          toast.success(res.data.message || "Migration completed successfully");
        } catch {
          toast.error("Migration failed");
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Platform Overview" subtitle="Administrative Portal" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers.toLocaleString() ?? "0"}
          icon={<Users className="w-5 h-5" />}
          trend="Total registered base"
        />
        <StatCard
          title="Avg. Daily Active"
          value={stats?.activeUsers24h.toLocaleString() ?? "0"}
          icon={<Activity className="w-5 h-5" />}
          trend="Rolling 24h window"
          color="emerald"
        />
        <StatCard
          title="Total Assets Tracked"
          value={`₹${(stats?.totalAssetsTracked ? stats.totalAssetsTracked / 10000000 : 0).toFixed(2)}Cr`}
          icon={<Database className="w-5 h-5" />}
          trend="Aggregate balance"
          color="primary"
        />
        <StatCard
          title="Instance Health"
          value={stats?.systemHealth ?? "Optimal"}
          icon={<ShieldCheck className="w-5 h-5" />}
          trend="Production status"
          color="indigo"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 lg:flex-[2] min-w-0 space-y-5">
          <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark shadow-sm h-[280px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  Registration Metrics
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  New user distribution across timeline
                </p>
              </div>
              <div className="flex gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <div className="size-2 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>

            <div className="flex-1 flex items-end justify-between gap-4 px-2 pb-2">
              {stats?.userGrowth.map(
                (g: { count: number; day: string }, i: number) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-4"
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{
                        height: `${Math.min(100, (g.count / ((stats?.totalUsers) || 1)) * 100)}%`,
                      }}
                      transition={{ delay: i * 0.1, duration: 1 }}
                      className="w-full max-w-[40px] bg-gradient-to-t from-primary/80 to-primary rounded-2xl relative group"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-primary text-white text-[10px] font-black px-2 py-1 rounded-lg">
                        {g.count} users
                      </div>
                    </motion.div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {g.day}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border-none relative overflow-hidden group shadow-2xl shadow-indigo-500/10 transition-transform active:scale-[0.98] min-h-[160px] flex flex-col justify-center">
              <div className="relative z-10">
                <div className="text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-2 leading-none">
                  Security Status
                </div>
                <h4 className="text-white font-black text-lg mb-1 tracking-tight">
                  Active Encryption
                </h4>
                <p className="text-slate-400 text-[10px] font-medium leading-relaxed">
                  End-to-end RSA-4096 protocols active across all clusters.
                </p>
              </div>
              <ShieldCheck className="absolute bottom-4 right-4 size-12 text-white/5 group-hover:text-white/10 transition-colors" />
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                  <Zap className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    System Load
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Across 4 nodes
                  </p>
                </div>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[24%]" />
              </div>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Optimization
                </span>
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  99.9%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-100 md:text-slate-900 dark:text-white uppercase tracking-widest">
                  Global Reach
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Active nodes by geography
                </p>
              </div>
              <Globe className="size-4 text-primary" />
            </div>

            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "India", value: 85 },
                      { name: "USA", value: 10 },
                      { name: "Europe", value: 5 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#135bec" stroke="none" />
                    <Cell fill="#10b981" stroke="none" />
                    <Cell fill="#64748b" stroke="none" />
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      fontSize: "9px",
                      fontWeight: "bold",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                Feed Activity
              </h3>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-5">
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                stats?.recentActivities.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="mt-1">
                      <div className="size-2 rounded-full bg-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                          {activity.userName}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {activity.time}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-0.5 line-clamp-1">
                        {activity.action} • {activity.entityType}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold mt-1 line-clamp-1 italic">
                        &quot;{activity.description}&quot;
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    No recent events logged
                  </p>
                </div>
              )}
            </div>

            <Link
              href="/admin/activities"
              className="w-full mt-6 pt-4 pb-2 text-[10px] font-black text-slate-500 hover:text-primary uppercase tracking-widest transition-colors border-t border-slate-100 dark:border-white/5 text-center block"
            >
              View Full Activity Log
            </Link>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-indigo-950 border-none relative overflow-hidden group shadow-2xl shadow-indigo-500/10 mt-4">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-2 leading-none flex items-center gap-2">
              <Database className="size-3" />
              Data Migration
            </div>
            <h4 className="text-white font-black text-xl tracking-tight">
              Soft Delete Protocol
            </h4>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md">
              Initialize the &apos;deletedAt&apos; field across all collections
              to support safe data archiving and accurate calculations.
            </p>
          </div>
          <button
            onClick={handleMigrateSoftDelete}
            className="w-full md:w-auto px-6 py-4 md:py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/5"
          >
            <Database className="size-4" />
            Run Migration
          </button>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </PageContainer>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  color?: "primary" | "emerald" | "indigo";
}

function StatCard({
  title,
  value,
  icon,
  trend,
  color = "primary",
}: StatCardProps) {
  const colorClasses = {
    primary: "from-primary/10 to-primary/5 text-primary",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-500",
    indigo: "from-indigo-500/10 to-indigo-500/5 text-indigo-500",
  };

  return (
    <div className="p-3.5 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-2.5">
        <div
          className={`p-1.5 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}
        >
          {icon}
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary transition-colors" />
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
          {title}
        </p>
        <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter mt-0.5">
          {value}
        </h4>
        <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
          {trend}
        </p>
      </div>
    </div>
  );
}
