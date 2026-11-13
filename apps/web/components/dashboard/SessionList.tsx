"use client";

import { useState, useEffect } from "react";
import { UserSession } from "@repo/types";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Smartphone, Monitor, LogOut, Loader2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate, parseUserAgent } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function SessionList() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);
  const [sessionToRevoke, setSessionToRevoke] = useState<UserSession | null>(
    null,
  );

  const fetchSessions = async () => {
    try {
      const res = await api.get<UserSession[]>("/auth/sessions");
      // Sort by last active (newest first)
      setSessions(
        res.data.sort(
          (a, b) =>
            new Date(b.lastActiveAt).getTime() -
            new Date(a.lastActiveAt).getTime(),
        ),
      );
    } catch (error) {
      console.error("Failed to fetch sessions", error);
      toast.error("Cloud node sync failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();

    const handleTokenRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent<{
        oldToken?: string;
        newToken?: string;
      }>;
      const oldToken = customEvent.detail?.oldToken;
      if (oldToken) {
        setSessions((prev) =>
          prev.filter((s) => s.token !== oldToken && s.id !== oldToken),
        );
      }
      void fetchSessions();
    };

    window.addEventListener("finease-token-refreshed", handleTokenRefreshed);
    return () => {
      window.removeEventListener(
        "finease-token-refreshed",
        handleTokenRefreshed,
      );
    };
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
      const currentToken = localStorage.getItem("finease_token");
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

  const otherSessionsCount = sessions.filter((s) => {
    const isCurrent =
      typeof window !== "undefined" &&
      localStorage.getItem("finease_token") === s.token;
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {sessions.map((session) => {
          const {
            isMobile,
            isPWA: uaIsPWA,
            browser,
            os,
          } = parseUserAgent(session.userAgent || "");
          const isPWA = session.isPWA ?? uaIsPWA;
          const isCurrent =
            typeof window !== "undefined" &&
            localStorage.getItem("finease_token") === session.token;

          return (
            <div
              key={session.token}
              className={`p-2.5 sm:p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                isCurrent
                  ? "border-primary ring-1 ring-primary/20 bg-primary/5 shadow-xs"
                  : "border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xs hover:border-primary/40"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <div
                    className={`size-7 sm:size-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? "bg-primary text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isMobile ? (
                      <Smartphone size={14} />
                    ) : (
                      <Monitor size={14} />
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isPWA && (
                      <span className="text-[7px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded uppercase">
                        PWA
                      </span>
                    )}
                    {isCurrent ? (
                      <span className="text-[7px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase">
                        Current
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] sm:text-xs font-bold text-slate-900 dark:text-white truncate">
                    {browser || "Browser"} • {os || "Device"}
                  </div>
                  <div className="text-[8px] sm:text-[9px] text-slate-400 truncate mt-0.5">
                    {formatDate(session.lastActiveAt)}
                  </div>
                </div>
              </div>

              {!isCurrent ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSessionToRevoke(session)}
                  disabled={revokingToken === session.token}
                  className="w-full h-7 rounded-lg text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-rose-500 hover:bg-rose-500 hover:text-white border-rose-500/20 transition-all gap-1"
                >
                  {revokingToken === session.token ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="size-3" />
                      <span>Revoke</span>
                    </>
                  )}
                </Button>
              ) : (
                <div className="text-[8px] font-bold uppercase tracking-wider text-emerald-500 text-center py-1">
                  Active Device
                </div>
              )}
            </div>
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
