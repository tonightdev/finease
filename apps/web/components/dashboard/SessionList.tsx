"use client";

import { useState, useEffect } from "react";
import { UserSession } from "@repo/types";
import api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Smartphone, Monitor, LogOut, Loader2, Clock, Globe, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate, parseUserAgent } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function SessionList() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);
  const [sessionToRevoke, setSessionToRevoke] = useState<UserSession | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await api.get<UserSession[]>("/auth/sessions");
      // Sort by last active (newest first)
      setSessions(res.data.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()));
    } catch (error) {
      console.error("Failed to fetch sessions", error);
      toast.error("Cloud node sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (token: string) => {
    setRevokingToken(token);
    try {
      await api.post("/auth/sessions/revoke", { token });
      toast.success("Identity revoked from device");
      setSessions(sessions.filter((s) => s.token !== token));
    } catch (error) {
      console.error("Failed to revoke session", error);
      toast.error("Revocation failure");
    } finally {
      setRevokingToken(null);
      setSessionToRevoke(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          Identity Nodes
          <span className="text-[7px] font-medium normal-case tracking-normal text-slate-400">Active authorization sessions for {user?.displayName}</span>
        </h3>
        <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded tracking-[0.1em]">
          {sessions.length} Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((session) => {
            const { isMobile, isPWA: uaIsPWA, browser, os } = parseUserAgent(session.userAgent || "");
            const isPWA = session.isPWA ?? uaIsPWA;
            const isCurrent = typeof window !== 'undefined' && localStorage.getItem('finease_token') === session.token;

            return (
              <Card
                key={session.token}
                className={`flex items-center justify-between border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 hover:border-primary/30 transition-all ${isCurrent ? 'ring-1 ring-primary/20 shadow-lg shadow-primary/5' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-2xl flex items-center justify-center ${isCurrent ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {isMobile ? <Smartphone size={20} /> : <Monitor size={20} />}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-primary uppercase tracking-tight">
                        {session.userName || user?.displayName}
                      </span>
                      {isCurrent && (
                        <span className="text-[7px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-1 py-0.5 rounded tracking-widest">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                        {os} • {browser}
                      </span>
                      {isPWA && (
                        <span className="text-[7px] font-black text-primary uppercase bg-primary/10 px-1 py-0.5 rounded tracking-widest flex items-center gap-0.5">
                          <Shield className="size-2" />
                          PWA
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Globe className="w-3 h-3" />
                        {session.ipAddress || "Unknown IP"}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {formatDate(session.lastActiveAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSessionToRevoke(session)}
                  disabled={revokingToken === session.token || isCurrent}
                  className={`h-10 px-4 rounded-xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${isCurrent
                    ? 'opacity-40 cursor-not-allowed border-slate-100 dark:border-white/5'
                    : 'hover:bg-rose-500 hover:text-white border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/50 text-rose-500'
                    }`}
                  title={isCurrent ? "Cannot revoke current session" : "Revoke identity node"}
                >
                  {revokingToken === session.token ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isCurrent ? "Active" : "Revoke"}</span>
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
      </div>

      <ConfirmModal
        isOpen={!!sessionToRevoke}
        title="Revoke Identity Node?"
        message={`This will sign out user ${user?.displayName} from the device (${parseUserAgent(sessionToRevoke?.userAgent || "").os}) immediately.`}
        confirmText="Revoke"
        onConfirm={async () => {
          if (sessionToRevoke) {
            await handleRevoke(sessionToRevoke.token);
          }
        }}
        onCancel={() => setSessionToRevoke(null)}
        isDestructive
      />
    </div>
  );
}
