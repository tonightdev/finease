"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Clock,
  Loader2,
  Search,
  User,
  Info,
  ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { ActivityLog } from "@repo/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<(ActivityLog & { id: string })[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<(ActivityLog & { id: string }) | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await api.get<(ActivityLog & { id: string })[]>(
          "/admin/activities",
        );
        setActivities(res.data);
      } catch (error) {
        console.error("Failed to fetch activities", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const filteredActivities = activities.filter(
    (a) =>
      a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.entityType.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "text-emerald-500 bg-emerald-500/10";
      case "update":
        return "text-amber-500 bg-amber-500/10";
      case "delete":
        return "text-rose-500 bg-rose-500/10";
      default:
        return "text-primary bg-primary/10";
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 space-y-6 pb-20 lg:pb-8">
      <PageHeader
        title="Activity Feed"
        subtitle="System-wide audit trail"
        backHref="/admin/dashboard"
      />

      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search activities, users, or entities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Timeline
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Identity
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Action
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Log Detail
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                  Audit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <tr
                    key={activity.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {formatDate(activity.timestamp)}
                        </span>
                        <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          {new Date(activity.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <User className="size-4 text-slate-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {activity.userName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {activity.userEmail}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={`inline-flex items-center py-0.5 px-2 rounded text-[9px] font-black uppercase tracking-widest w-fit ${getActionColor(activity.action)}`}
                        >
                          {activity.action}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          {activity.entityType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300 max-w-md line-clamp-2">
                        {activity.description}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                        <Info className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="size-8 text-slate-200 dark:text-slate-800" />
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        No activities matched your search
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => setSelectedActivity(activity)}
              className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-[2rem] p-5 shadow-sm active:scale-[0.98] transition-all space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <User className="size-5 text-slate-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      {activity.userName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[140px]">
                      {activity.userEmail}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`inline-flex items-center py-0.5 px-2 rounded text-[8px] font-black uppercase tracking-widest ${getActionColor(activity.action)}`}
                  >
                    {activity.action}
                  </span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {activity.entityType}
                  </span>
                </div>
              </div>

              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                {activity.description}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
                      Timeline
                    </span>
                    <span className="text-[10px] font-bold text-slate-900 dark:text-white mt-1">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                  <div className="w-px h-6 bg-slate-100 dark:bg-white/5" />
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(activity.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark rounded-[2rem] p-12 text-center shadow-sm">
            <Activity className="size-12 text-slate-100 dark:text-slate-800 mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Acquisition channel empty
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        title="Activity Audit"
        maxWidth="max-w-2xl"
      >
        {selectedActivity && (
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Timeline
                </span>
                <p className="text-xs font-black text-slate-900 dark:text-white">
                  {formatDate(selectedActivity.timestamp)}
                </p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                  {new Date(selectedActivity.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Identity
                </span>
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {selectedActivity.userName}
                </p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5 truncate">
                  {selectedActivity.userEmail}
                </p>
              </div>
            </div>

            <div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">
                Narration
              </span>
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl shadow-inner">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                  {selectedActivity.description}
                </p>
              </div>
            </div>

            {!!(selectedActivity.previousState || selectedActivity.newState) && (
              <div className="space-y-4">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block px-1">
                  State Delta
                </span>
                <div className="grid grid-cols-1 gap-4">
                  {!!selectedActivity.previousState && (
                    <div className="space-y-2">
                      <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest px-1">
                        Previous Config
                      </span>
                      <pre className="p-4 bg-slate-900 text-slate-300 rounded-2xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedActivity.previousState, null, 2)}
                      </pre>
                    </div>
                  )}
                  {!!selectedActivity.newState && (
                    <div className="space-y-2">
                      <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest px-1">
                        New Config
                      </span>
                      <pre className="p-4 bg-slate-900 text-slate-300 rounded-2xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedActivity.newState, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Action
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${getActionColor(selectedActivity.action)}`}>
                  {selectedActivity.action}
                </span>
              </div>
              <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-center">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Entity
                </span>
                <span className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                  {selectedActivity.entityType}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
