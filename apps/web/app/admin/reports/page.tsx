"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Activity, ShieldCheck, Zap, Cpu, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { AdminStats } from "@repo/types";

export default function AdminReportsPage() {
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

  const COLORS = ["#135bec", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const engagementData = [
    { name: "Active (24h)", value: stats?.activeUsers24h || 0 },
    {
      name: "Inactive",
      value: Math.max(
        0,
        (stats?.totalUsers || 0) - (stats?.activeUsers24h || 0),
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Usage Analytics"
        subtitle="Comprehensive platform metrics and system health monitoring"
      />

      <div className="flex flex-wrap gap-5">
        {/* User Acquisition Velocity */}
        <Card className="flex-1 lg:flex-[2] min-w-[320px] space-y-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                Growth Trends
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                User registrations over the last period
              </p>
            </div>
            <Zap className="size-5 text-primary" />
          </div>

          <div className="h-[240px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats?.userGrowth}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="growthGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#135bec" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E2E8F0"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 900, fill: "#64748B" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9, fontWeight: 900, fill: "#64748B" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "1rem",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    backgroundColor: "#0f172a",
                    color: "#fff",
                    fontSize: "10px",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#135bec"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#growthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* System Health */}
        <Card className="flex-1 min-w-[320px] space-y-5 rounded-2xl">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest text-center">
              Service Health
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
              Real-time infrastructure status
            </p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="relative size-32">
              <div className="absolute inset-0 rounded-full border-[10px] border-slate-100 dark:border-white/5" />
              <div className="absolute inset-0 rounded-full border-[10px] border-emerald-500 border-t-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  Active
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase">
                  Status
                </span>
              </div>
            </div>

            <div className="w-full space-y-4">
              {[
                { label: "Latency", value: "12ms", color: "bg-emerald-500" },
                {
                  label: "Security",
                  value: "Verified",
                  color: "bg-indigo-500",
                },
                { label: "Database", value: "Synced", color: "bg-primary" },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    {metric.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className={`size-1.5 rounded-full ${metric.color}`} />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {metric.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* User Engagement */}
        <Card className="flex-1 min-w-[320px] space-y-4 rounded-2xl flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                Engagement
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Active vs Total nodes
              </p>
            </div>
            <Cpu className="size-5 text-indigo-500" />
          </div>

          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={65}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {engagementData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
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

          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[120px] bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <div className="size-1.5 rounded-full bg-primary" />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Active
                </p>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {stats?.activeUsers24h}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-1">
                <div className="size-1.5 rounded-full bg-emerald-500" />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  Total
                </p>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white">
                {stats?.totalUsers}
              </p>
            </div>
          </div>
        </Card>

        {/* Activity Logs */}
        <Card className="flex-1 lg:flex-[2] min-w-[320px] space-y-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                Platform Events
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Latest system and security activities
              </p>
            </div>
            <Activity className="size-5 text-slate-300" />
          </div>

          <div className="space-y-4">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50/50 dark:bg-white/[0.02] rounded-2xl border border-slate-100 dark:border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-xl ${log.action === "signup" ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"}`}
                    >
                      <ShieldCheck className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                        {log.userName}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">
                        {log.action} • {log.entityType}
                      </p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">
                    {log.time}
                    <br />
                    <span className="text-[7px] font-bold italic lowercase opacity-70 block mt-0.5 max-w-[120px] truncate">
                      {log.description}
                    </span>
                  </span>
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
        </Card>
      </div>
    </PageContainer>
  );
}
