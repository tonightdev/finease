"use client";

import { useState, useEffect, useMemo } from "react";
import { ActivityLog } from "@repo/types";
import api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { 
  Zap, 
  Shield, 
  Activity, 
  LogIn, 
  Settings, 
  ArrowRightLeft, 
  PlusCircle, 
  Trash2,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ActivityFeeds() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await api.get<ActivityLog[]>("/auth/activity");
        setActivities(res.data);
      } catch (error) {
        console.error("Failed to fetch activity", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const feedActivity = useMemo(() => {
    return activities.filter(a => 
      a.entityType === 'transaction' || 
      a.entityType === 'account' || 
      a.entityType === 'category'
    ).slice(0, 4);
  }, [activities]);

  const platformEvents = useMemo(() => {
    return activities.filter(a => 
      a.action === 'login' || 
      a.action === 'signup' || 
      a.entityType === 'session' ||
      a.entityType === 'user'
    ).slice(0, 4);
  }, [activities]);

  if (loading && activities.length === 0) {
    return (
      <div className="space-y-6">
        <FeedSkeleton title="Feed Activity" />
        <FeedSkeleton title="Platform Events" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FeedSection 
        title="Feed Activity" 
        icon={<Activity className="w-3.5 h-3.5" />}
        data={feedActivity} 
      />
      <FeedSection 
        title="Platform Events" 
        icon={<Zap className="w-3.5 h-3.5 text-amber-500" />}
        data={platformEvents} 
        variant="amber"
      />
    </div>
  );
}

function FeedSection({ title, icon, data, variant = "primary" }: { 
  title: string; 
  icon: React.ReactNode;
  data: ActivityLog[];
  variant?: "primary" | "amber";
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          {icon}
          {title}
        </h3>
      </div>
      
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {data.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-4 rounded-2xl border border-dashed border-slate-100 dark:border-white/5 flex flex-col items-center justify-center gap-2"
            >
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">No recent data</p>
            </motion.div>
          ) : (
            data.map((item, idx) => (
              <motion.div
                key={(item as ActivityLog & { id?: string }).id || idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-3 bg-white dark:bg-slate-900/50 border-slate-100 dark:border-white/5 hover:border-primary/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                      variant === 'amber' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'
                    }`}>
                      <ActivityIcon action={item.action} entityType={item.entityType} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate leading-tight">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="size-2 text-slate-300" />
                          {formatRelativeTime(item.timestamp)}
                        </span>
                        <span className={`text-[6px] font-black uppercase px-1 rounded ${
                          variant === 'amber' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                        }`}>
                          {item.entityType}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ActivityIcon({ action, entityType }: { action: string; entityType: string }) {
  if (action === 'login') return <LogIn size={14} />;
  if (action === 'delete') return <Trash2 size={14} />;
  if (entityType === 'transaction') return <ArrowRightLeft size={14} />;
  if (entityType === 'account') return <PlusCircle size={14} />;
  if (entityType === 'session') return <Shield size={14} />;
  return <Settings size={14} />;
}

function FeedSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-3 w-24 bg-slate-100 dark:bg-white/5 rounded mx-1 mb-2 flex items-center gap-2">
        <div className="size-3.5 rounded-full bg-slate-200 dark:bg-white/10" />
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">{title}</span>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5" />
        ))}
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}
