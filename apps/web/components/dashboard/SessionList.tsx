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

  const handleRevokeOthers = async () => {
    try {
      await api.post("/auth/sessions/revoke-others");
      toast.success("Other identity nodes revoked");
      const currentToken = localStorage.getItem('finease_token');
      setSessions(sessions.filter((s) => s.token === currentToken));
    } catch (error) {
      console.error("Failed to revoke other sessions", error);
      toast.error("Mass revocation failure");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  const otherSessionsCount = sessions.filter(s => {
      const isCurrent = typeof window !== 'undefined' && localStorage.getItem('finease_token') === s.token;
      return !isCurrent;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 pb-1">
        <div className="space-y-0.5">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            Identity Nodes
            <span className="text-[7px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded tracking-[0.1em]">
            {sessions.length} Active
            </span>
          </h3>
          <p className="text-[7px] font-medium normal-case tracking-normal text-slate-400 opacity-80">
            Active authorization sessions for {user?.displayName}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            {otherSessionsCount > 0 && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRevokeOthers}
                    className="h-8 px-4 flex-1 sm:flex-none rounded-xl border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white font-black text-[9px] uppercase tracking-widest gap-2 transition-all shadow-none"
                >
                    <Shield className="size-3.5" /> Revoke All Others
                </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sessions.map((session) => {
            const { isMobile, isPWA: uaIsPWA, browser, os } = parseUserAgent(session.userAgent || "");
            const isPWA = session.isPWA ?? uaIsPWA;
            const isCurrent = typeof window !== 'undefined' && localStorage.getItem('finease_token') === session.token;

            return (
              <Card
                key={session.token}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 hover:border-primary/30 transition-all p-3 ${isCurrent ? 'ring-1 ring-primary/20 shadow-lg shadow-primary/5' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${isCurrent ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-primary uppercase tracking-tight truncate">
                        {session.userName || user?.displayName}
                      </span>
                      {isCurrent && (
                        <span className="text-[7px] font-black text-emerald-500 uppercase bg-emerald-500/10 px-1 py-0.5 rounded tracking-widest shrink-0">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-2 mt-0.5">
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
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Globe className="size-3" />
                        {session.ipAddress || "Unknown IP"}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock className="size-3" />
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
                  className={`h-8 sm:h-9 px-3 rounded-xl transition-all flex items-center justify-center gap-2 font-black text-[9px] uppercase tracking-widest w-full sm:w-auto ${isCurrent
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
                      <span>{isCurrent ? "Active" : "Revoke"}</span>
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
