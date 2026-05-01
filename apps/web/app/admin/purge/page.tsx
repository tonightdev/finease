"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import {
  Database,
  Users as UsersIcon,
  Search,
  Loader2,
  AlertTriangle,
  History,
  UserPlus,
  RefreshCw,
  ShieldCheck,
  UserCog,
  ShieldHalf,
  Mail,
  Zap,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  photoURL?: string;
  lastActiveAt?: string;
}

interface DeletedItem {
  id: string;
  collection: string;
  deletedAt: string;
  description?: string;
  name?: string;
  amount?: number;
  [key: string]: string | number | boolean | null | undefined | object;
}

export default function AdminPurgePage() {
  const { user: currentUser, accounts: localAccounts, switchAccount, authorizeSubNode } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [purgingId, setPurgingId] = useState<string | null>(null);
  const [authorizingId, setAuthorizingId] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    item: DeletedItem | null;
  }>({
    isOpen: false,
    item: null,
  });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get<User[]>("/admin/users");
      setUsers(res.data);
    } catch {
      toast.error("Failed to fetch user list");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeletedItems = useCallback(async (uid: string) => {
    if (!uid) {
      setDeletedItems([]);
      return;
    }
    setItemsLoading(true);
    try {
      const res = await api.get<DeletedItem[]>(`/admin/users/${uid}/deleted-items`);
      setDeletedItems(res.data);
    } catch {
      toast.error("Failed to fetch deleted items for user");
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  useEffect(() => {
    if (selectedUserId) {
      fetchDeletedItems(selectedUserId);
    }
  }, [selectedUserId, fetchDeletedItems]);

  const handlePurge = useCallback(async () => {
    if (!confirmModal.item) return;

    const { id, collection } = confirmModal.item;
    setPurgingId(id);
    try {
      await api.delete(`/admin/purge/${collection}/${id}`);
      setDeletedItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Item permanently removed from ledger");
    } catch {
      toast.error("Failed to purge item");
    } finally {
      setPurgingId(null);
      setConfirmModal({ isOpen: false, item: null });
    }
  }, [confirmModal.item]);

  const handleAuthorizeNode = async (uid: string) => {
    setAuthorizingId(uid);
    try {
      await authorizeSubNode(uid);
      toast.success("Sub-Node Authorization Protocol Complete");
    } catch {
      toast.error("Authorization sync failed");
    } finally {
      setAuthorizingId(null);
    }
  };

  const handleNuclearPurge = async (uid?: string) => {
    const targetId = uid || selectedUserId;
    if (!targetId) return;
    
    const confirmed = window.confirm("Execute NUCLEAR PURGE? All financial data for this user will be destroyed, but the account will remain. Proceed?");
    if (!confirmed) return;

    setItemsLoading(true);
    try {
      await api.post(`/admin/users/${targetId}/nuclear-purge`);
      if (targetId === selectedUserId) {
        setDeletedItems([]);
      }
      toast.success("Nuclear Purge Complete: Sector Reset");
    } catch {
      toast.error("Protocol failure: Reset aborted");
    } finally {
      setItemsLoading(false);
    }
  };

  const handleHardDelete = async (uid?: string) => {
    const targetId = uid || selectedUserId;
    if (!targetId) return;
    
    const confirmed = window.confirm("WARNING: This will permanently destroy the identity and all associated data. This action is irreversible. Proceed?");
    if (!confirmed) return;

    setItemsLoading(true);
    try {
      await api.delete(`/admin/users/${targetId}`);
      setUsers(prev => prev.filter(u => u.id !== targetId));
      if (targetId === selectedUserId) {
        setSelectedUserId("");
        setDeletedItems([]);
      }
      toast.success("Identity Neutralized: Total Erasure");
    } catch {
      toast.error("Erasure failure: Identity remains active");
    } finally {
      setItemsLoading(false);
    }
  };

  const filteredItems = deletedItems.filter((item) => {
    const searchStr = (item.description || item.name || item.id || "").toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const filteredUsers = users.filter((u) => {
    const isCurrentUser = u.id === currentUser?.uid;
    const searchStr = (u.displayName || u.email || "").toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase()) && !isCurrentUser;
  });

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
        title="Protocol Purge"
        subtitle="Command terminal for permanent ledger sanitation"
        backHref="/admin/dashboard"
      />

      <div className="flex flex-wrap gap-6 lg:items-start relative z-10">

        {/* User Dropdown / Listing Sidebar */}
        <div className="flex-1 lg:flex-[4] min-w-[300px]">
          {/* Mobile Dropdown Selector */}
          <div className="lg:hidden">
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-5 text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-xl"
              >
                <option value="">Select Identity Cluster...</option>
                {filteredUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.displayName} ({u.email})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none flex flex-col lg:h-[calc(100dvh-12rem)] hidden lg:flex">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <UsersIcon className="size-4" />
                  </div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    Identity Clusters
                  </h3>
                </div>
                <button onClick={fetchUsers} className="text-slate-400 hover:text-primary transition-colors">
                  <RefreshCw className="size-3.5" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl pl-11 text-xs font-bold ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner"
                  placeholder="Scan Identities..."
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
              {filteredUsers.map((u) => {
                const isActive = selectedUserId === u.id;
                const isLocal = localAccounts.some(la => la.uid === u.id);

                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className={`w-full group rounded-2xl p-3 flex items-center gap-4 transition-all relative overflow-hidden ${isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400"}`}
                  >
                    <div className={`size-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${isActive ? "bg-white/20" : "bg-slate-100 dark:bg-white/5"}`}>
                      {u.photoURL ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={u.photoURL} alt="" className="size-full rounded-xl object-cover" loading="lazy" />
                      ) : (
                        u.displayName.charAt(0)
                      )}
                    </div>
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 w-full">
                        <span className={`text-[11px] font-black uppercase truncate ${isActive ? "text-white" : "text-slate-900 dark:text-white"}`}>
                          {u.displayName}
                        </span>
                        {u.role === "admin" && (
                          <ShieldCheck className={`size-3 shrink-0 ${isActive ? "text-white/70" : "text-primary/50"}`} />
                        )}
                        {isLocal && (
                          <div className={`size-1.5 rounded-full shrink-0 ${isActive ? "bg-white" : "bg-primary"}`} title="Authorized locally" />
                        )}
                      </div>
                      <span className={`text-[9px] font-bold truncate opacity-70 ${isActive ? "text-white" : "text-slate-400"}`}>
                        {u.email}
                      </span>
                    </div>

                    {u.id === currentUser?.uid && (
                      <div className={`text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>Current</div>
                    )}

                    {isActive && (
                      <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-1 bg-white" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-white/5 mt-auto">
              <button
                onClick={() => router.push('/login?mode=add')}
                className="w-full h-11 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 dark:border-white/5 hover:border-primary/50 hover:text-primary transition-all font-sans"
              >
                <UserPlus className="size-4" />
                Authorize Sub-Node
              </button>
            </div>
          </div>
        </div>

        {/* Data Fragments Panel */}
        <div className="flex-1 lg:flex-[8] min-w-[300px] space-y-6">
          <AnimatePresence mode="wait">
            {!selectedUserId ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div className="lg:h-[calc(100dvh-12rem)] bg-slate-50/50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] flex flex-col items-center justify-center p-8 lg:p-12 text-center min-h-[400px]">
                  <div className="size-24 rounded-[2.5rem] bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-8 border border-white/10 shadow-2xl">
                    <Zap className="size-12 fill-current" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.3em] mb-3">
                    Terminal Standby
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[280px] leading-relaxed">
                    Interface ready for identity synchronization. Select a target cluster from the matrix to begin fragmentation scan.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selectedUserId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Active Selection Hero */}
                <div className="relative p-3 sm:p-8 rounded-[2rem] sm:rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="size-16 sm:size-20 rounded-2xl sm:rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary text-xl sm:text-2xl font-black border-2 border-primary/20 shadow-xl shadow-primary/20 shrink-0">
                        {users.find(u => u.id === selectedUserId)?.displayName.charAt(0)}
                      </div>
                      <div className="space-y-0.5 sm:space-y-1 min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                          {users.find(u => u.id === selectedUserId)?.displayName}
                        </h2>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span className="flex items-center gap-1 text-primary">
                            <UserCog className="size-3" />
                            {users.find(u => u.id === selectedUserId)?.role}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" />
                            {users.find(u => u.id === selectedUserId)?.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {localAccounts.some(a => a.uid === selectedUserId) ? (
                        <button
                          onClick={() => switchAccount(selectedUserId)}
                          className="flex-1 sm:flex-initial px-4 h-9 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all border border-primary/20"
                        >
                          <Zap className="size-3" />
                          Switch
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAuthorizeNode(selectedUserId)}
                          disabled={authorizingId === selectedUserId}
                          className="flex-1 sm:flex-initial px-4 h-9 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100 dark:border-white/10 hover:border-primary/50 hover:text-primary transition-all disabled:opacity-50"
                        >
                          {authorizingId === selectedUserId ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <ShieldHalf className="size-3" />
                          )}
                          Authorize
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6 w-full">
                    <StatItem label="Fragment Count" value={deletedItems.length} color="text-rose-500" />
                    <StatItem label="Auth Status" value={localAccounts.some(a => a.uid === selectedUserId) ? "RECOGNIZED" : "UNAUTHORIZED"} color={localAccounts.some(a => a.uid === selectedUserId) ? "text-emerald-500" : "text-amber-500"} />
                    <StatItem label="Sector Safety" value={deletedItems.length > 10 ? "CRITICAL" : "STABLE"} color={deletedItems.length > 10 ? "text-rose-500" : "text-emerald-500"} />
                  </div>

                  <div className="absolute bottom-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Database className="size-64" />
                  </div>
                </div>

                {/* Listing of fragments */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2">
                    <div className="flex items-center gap-2">
                      <Database className="size-4 shrink-0 text-rose-500" />
                      <h3 className="text-[9px] sm:text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">
                        Data Cleanup Queue
                        <span className="ml-1 sm:ml-2 text-slate-400">({filteredItems.length})</span>
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 self-end sm:self-auto">
                      <button
                        onClick={() => handleNuclearPurge()}
                        disabled={itemsLoading}
                        className="text-[8px] sm:text-[10px] font-black text-amber-500 uppercase tracking-widest hover:text-amber-600 disabled:opacity-30 flex items-center gap-1 whitespace-nowrap"
                        title="Delete all data but keep user account"
                      >
                        <Zap className="size-3 fill-current shrink-0" />
                        Nuclear Reset
                      </button>
                      <button
                        onClick={() => handleHardDelete()}
                        disabled={itemsLoading}
                        className="text-[8px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 disabled:opacity-30 flex items-center gap-1 whitespace-nowrap"
                        title="Delete everything including user account"
                      >
                        <AlertTriangle className="size-3 fill-current shrink-0" />
                        Hard Delete
                      </button>
                    </div>
                  </div>

                  <div className="min-h-[300px] space-y-3 relative">
                    {itemsLoading ? (
                      <div className="flex items-center justify-center p-20">
                        <Loader2 className="size-8 text-primary animate-spin" />
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 bg-emerald-500/[0.02] border-2 border-dashed border-emerald-500/10 rounded-[3rem]">
                        <div className="size-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <CheckCircle2 className="size-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                            Ledger Synchronized
                          </h4>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            No soft-deleted artifacts found in this sector
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <AnimatePresence mode="popLayout">
                          {filteredItems.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              layout
                            >
                              <div className="flex-1 min-w-[200px]">
                                <Card className="border-slate-100 dark:border-white/5 hover:border-rose-500/20 transition-all group relative overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                                  <div className="flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-5 min-w-0">
                                      <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center text-[8px] font-black uppercase text-slate-400 shrink-0 border border-slate-100 dark:border-white/5 group-hover:bg-rose-500/5 group-hover:border-rose-500/10 transition-colors">
                                        <span className="text-[7px]">TYP</span>
                                        <span className="text-primary group-hover:text-rose-500">{item.collection.charAt(0).toUpperCase()}</span>
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <span className="text-[9px] font-black text-primary group-hover:text-rose-500 transition-colors uppercase tracking-[0.2em]">
                                            {item.collection}
                                          </span>
                                          <span className="text-[8px] text-slate-400 font-bold opacity-50">•</span>
                                          <span className="text-[8px] text-slate-400 font-bold uppercase">
                                            ID: {item.id.slice(0, 8)}
                                          </span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
                                          {item.description || item.name || "Untitled Fragment"}
                                        </span>
                                        <div className="flex items-center gap-3 mt-1.5">
                                          <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-black uppercase tracking-widest">
                                            <History className="size-2.5" />
                                            {new Date(item.deletedAt).toLocaleDateString()}
                                          </div>
                                          {item.amount !== undefined && (
                                            <div className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase">
                                              ₹{item.amount.toLocaleString()}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => setConfirmModal({ isOpen: true, item })}
                                      disabled={purgingId === item.id}
                                      className="px-5 h-10 rounded-xl bg-slate-50 dark:bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-slate-100 dark:border-white/5 active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest shrink-0 shadow-sm"
                                    >
                                      {purgingId === item.id ? (
                                        <Loader2 className="size-4 animate-spin mx-auto" />
                                      ) : (
                                        "Sanitize"
                                      )}
                                    </button>
                                  </div>
                                </Card>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Sanitize Protocol"
        message={
          <div className="space-y-4">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3">
              <AlertTriangle className="size-5 text-rose-500 shrink-0" />
              <p className="text-xs font-bold text-rose-500/80 leading-relaxed uppercase tracking-widest italic">
                Attention: Executing this command will result in permanent binary destruction of the fragment. Data is not recoverable after sanitation.
              </p>
            </div>
            {confirmModal.item && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[10px] space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-slate-400 uppercase font-black tracking-widest">Source Cluster</span>
                  <span className="text-primary font-black uppercase bg-primary/10 px-2 py-1 rounded-lg">{confirmModal.item.collection}</span>
                </div>
                <div className="flex justify-between items-center px-1">
                  <span className="text-slate-400 uppercase font-black tracking-widest">Unique Address</span>
                  <span className="dark:text-white font-black bg-slate-200 dark:bg-white/10 px-2 py-1 rounded-lg truncate max-w-[150px]">{confirmModal.item.id}</span>
                </div>
              </div>
            )}
          </div>
        }
        onConfirm={handlePurge}
        onCancel={() => setConfirmModal({ isOpen: false, item: null })}
      />
    </PageContainer>
  );
}

function StatItem({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex-1 p-2.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex flex-col gap-1 items-center justify-center text-center">
      <span className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">{label}</span>
      <span className={`text-[10px] sm:text-xs font-black uppercase truncate w-full ${color}`}>{value}</span>
    </div>
  );
}
