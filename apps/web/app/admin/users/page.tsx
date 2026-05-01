"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import api from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import {
  User as UserIcon,
  Shield,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Zap,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  status?: "active" | "inactive";
  createdAt: string;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
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

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get<User[]>("/admin/users");
      // Filter out current user from the list
      const filtered = res.data.filter((u: User) => u.id !== currentUser?.uid);
      setUsers(filtered);
    } catch {
      toast.error("Failed to fetch user list");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  const toggleUserStatus = (uid: string, currentStatus: string) => {
    const newStatus = currentStatus === "inactive" ? "active" : "inactive";
    setConfirmModal({
      isOpen: true,
      title: `${newStatus === "active" ? "Activate" : "Deactivate"} Identity`,
      message: `Are you sure you want to ${newStatus === "active" ? "restore" : "suspend"} access for this identity?`,
      onConfirm: async () => {
        try {
          await api.put(`/admin/users/${uid}`, { status: newStatus });
          setUsers((prev) =>
            prev.map((u) =>
              u.id === uid ? { ...u, status: newStatus as User["status"] } : u,
            ),
          );
          toast.success(`User set to ${newStatus}`);
        } catch {
          toast.error("Failed to update user status");
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const changeUserRole = (uid: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setConfirmModal({
      isOpen: true,
      title: "Modify Clearance Level",
      message: `Are you sure you want to change this identity's clearance to ${newRole.toUpperCase()}? This grants/revokes administrative protocols.`,
      onConfirm: async () => {
        try {
          await api.put(`/admin/users/${uid}`, { role: newRole });
          setUsers((prev) =>
            prev.map((u) =>
              u.id === uid ? { ...u, role: newRole as User["role"] } : u,
            ),
          );
          toast.success(`Clearance updated to ${newRole}`);
        } catch {
          toast.error("Failed to update clearance");
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };
  const resetUserTour = (uid: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Reset Neural Interface",
      message:
        "Force the 'Feature Tour' to appear for this user on their next neural-link session? This is useful for onboarding refreshes.",
      onConfirm: async () => {
        try {
          await api.put(`/admin/users/${uid}/reset-onboarding`);
          toast.success("Feature tour reset for identity");
        } catch {
          toast.error("Failed to reset feature tour");
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const nuclearPurgeUserData = (uid: string) => {
    setConfirmModal({
      isOpen: true,
      title: "NUCLEAR PURGE PROTOCOL",
      message:
        "Execute absolute sanitization for this identity? This will permanently delete all Bank Accounts, Transactions, Goals, and Expiries. The user account will be preserved but reset to a fresh state.",
      onConfirm: async () => {
        try {
          await api.post(`/admin/users/${uid}/nuclear-purge`);
          toast.success("Identity node sanitized: Data fragments destroyed");
        } catch {
          toast.error("Critical: Purge operation failure");
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const hardDeleteUser = (uid: string) => {
    setConfirmModal({
      isOpen: true,
      title: "IDENTITY NEUTRALIZATION",
      message:
        "DANGER: This will permanently destroy this identity and ALL associated data. This action is absolute and irreversible. Proceed with total erasure?",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${uid}`);
          setUsers(prev => prev.filter(u => u.id !== uid));
          toast.success("Identity neutralized: Total erasure complete");
        } catch {
          toast.error("Critical: Erasure protocol failure");
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const enableGlobalTour = () => {
    setConfirmModal({
      isOpen: true,
      title: "Global Protocol Reset",
      message:
        "This will force the 'Feature Tour' for every registered identity in the system. Are you absolutely certain? This impact is platform-wide.",
      onConfirm: async () => {
        try {
          await api.post("/admin/users/enable-tour");
          toast.success("Feature tour enabled for all users");
        } catch {
          toast.error("Failed to enable global feature tour");
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [users, searchTerm]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="User Governance"
        subtitle={`Commanding ${users.length} registered identities`}
        actions={
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              onClick={enableGlobalTour}
              className="w-full sm:w-auto h-9 px-4 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Zap className="size-3.5 fill-current" />
              Global Tour Reset
            </button>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 bg-white dark:bg-slate-900 border-none rounded-xl pl-9 text-[10px] font-bold ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                placeholder="Search identities..."
              />
            </div>
          </div>
        }
      />

      <div className="hidden lg:block overflow-hidden rounded-[2rem] border border-slate-100 dark:border-white/5 bg-white dark:bg-surface-dark shadow-2xl shadow-slate-200/50 dark:shadow-none">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Identity
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Authorization
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-6 py-6" title={u.id}>
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
                        <UserIcon className="size-5 text-slate-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                          {u.displayName}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {u.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <button
                      onClick={() => changeUserRole(u.id, u.role)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${u.role === "admin"
                        ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                        : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                        }`}
                    >
                      {u.role === "admin" ? (
                        <ShieldAlert className="size-3" />
                      ) : (
                        <Shield className="size-3" />
                      )}
                      {u.role}
                    </button>
                  </td>
                  <td className="px-6 py-6">
                    <div
                      className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${u.status === "inactive"
                        ? "text-rose-500"
                        : "text-emerald-500"
                        }`}
                    >
                      {u.status === "inactive" ? (
                        <XCircle className="size-3" />
                      ) : (
                        <CheckCircle2 className="size-3" />
                      )}
                      {u.status || "active"}
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => resetUserTour(u.id)}
                        className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 hover:bg-indigo-500/20"
                        title="Reset Feature Tour"
                      >
                        Reset Tour
                      </button>
                      <button
                        onClick={() => nuclearPurgeUserData(u.id)}
                        className="size-8 rounded-lg flex items-center justify-center transition-all bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white"
                        title="Nuclear Reset (Data Only)"
                      >
                        <Zap className="size-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => hardDeleteUser(u.id)}
                        className="size-8 rounded-lg flex items-center justify-center transition-all bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white"
                        title="Hard Delete (Identity + Data)"
                      >
                        <AlertTriangle className="size-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          toggleUserStatus(u.id, u.status || "active")
                        }
                        className={`h-8 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${u.status === "inactive"
                          ? "bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                          : "bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-white/5 hover:text-rose-500 hover:border-rose-500/20"
                          }`}
                      >
                        {u.status === "inactive" ? "Activate" : "Deactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile-friendly card list */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredUsers.map((u) => (
          <Card
            key={u.id}
            className="p-4 space-y-4 border-slate-100 dark:border-white/5 shadow-sm bg-white dark:bg-slate-900 rounded-[1.5rem]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center border border-slate-200 dark:border-white/10">
                  <UserIcon className="size-5 text-slate-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                    {u.displayName}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">
                    {u.email}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${u.status === "inactive" ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}>
                  {u.status || "active"}
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${u.role === "admin" ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20" : "bg-slate-500/10 text-slate-500 border border-slate-500/20"}`}>
                  {u.role}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 dark:border-white/5">
              <button
                onClick={() => changeUserRole(u.id, u.role)}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-white/5"
              >
                {u.role === "admin" ? <ShieldAlert className="size-3" /> : <Shield className="size-3" />}
                Mod Role
              </button>

              <button
                onClick={() => toggleUserStatus(u.id, u.status || "active")}
                className={`p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${u.status === "inactive" ? "bg-emerald-500 text-white border-emerald-600" : "bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5"}`}
              >
                {u.status === "inactive" ? "Activate" : "Suspend"}
              </button>

              <button
                onClick={() => nuclearPurgeUserData(u.id)}
                className="p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all bg-amber-500/10 text-amber-500 border border-amber-500/20 active:bg-amber-500 active:text-white flex items-center justify-center gap-2"
              >
                <Zap className="size-3 fill-current" /> Reset Data
              </button>

              <button
                onClick={() => hardDeleteUser(u.id)}
                className="p-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all bg-rose-500/10 text-rose-500 border border-rose-500/20 active:bg-rose-500 active:text-white flex items-center justify-center gap-2"
              >
                <AlertTriangle className="size-3" /> Hard Delete
              </button>
            </div>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="p-20 text-center font-bold text-slate-400 uppercase tracking-widest text-xs">
          No other identities detected in this sector
        </div>
      )}

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
