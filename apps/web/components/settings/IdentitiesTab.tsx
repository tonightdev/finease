import React from "react";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

export function IdentitiesTab() {
  const {
    user,
    accounts: authAccounts,
    switchAccount,
    removeAccount,
  } = useAuth();

  const handleAddIdentity = () => {
    window.location.href = "/login?mode=add";
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Active Identity Nodes
        </h4>
        <Button
          onClick={handleAddIdentity}
          variant="outline"
          size="sm"
          className="h-9 px-4 rounded-xl border-dashed border-primary/40 text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest gap-2 shadow-none"
        >
          <Plus size={14} /> Add Identity
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {authAccounts.map((acc) => {
          const isPrimary = acc.uid === user?.uid;

          return (
            <div
              key={acc.uid}
              className={`p-4 sm:p-5 rounded-2xl flex items-center justify-between group transition-all duration-200 relative overflow-hidden border ${
                isPrimary
                  ? "border-primary ring-1 ring-primary/20 bg-primary/5 shadow-xs"
                  : "hover:border-primary/50 border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xs"
              }`}
            >
              <div className="flex items-center gap-3 relative z-10 min-w-0 flex-1 pr-3">
                <div
                  className={`size-11 rounded-xl flex items-center justify-center text-sm font-black uppercase transition-all duration-300 shrink-0 ${
                    isPrimary
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:scale-105"
                  }`}
                >
                  {acc.displayName?.[0] || acc.email?.[0] || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-[13px] text-slate-900 dark:text-white uppercase tracking-tight truncate">
                    {acc.displayName || "Linked Node"}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 truncate w-full">
                    {acc.email}
                  </p>
                  {isPrimary && (
                    <span className="text-[7px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded tracking-widest mt-1 inline-block">
                      Primary Active
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 relative z-10 shrink-0">
                {!isPrimary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => switchAccount(acc.uid)}
                    className="h-8 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest border-slate-200 dark:border-white/10 hover:border-primary hover:text-primary transition-all gap-1 shadow-none"
                  >
                    Switch <ArrowRight size={10} />
                  </Button>
                )}

                {authAccounts.length > 1 && !isPrimary && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (
                        confirm(
                          `Remove linked identity node (${acc.email || acc.displayName}) from this device?`,
                        )
                      ) {
                        removeAccount(acc.uid);
                      }
                    }}
                    className="size-8 rounded-lg border-rose-500/30 bg-rose-500/10 p-0 hover:bg-rose-500 hover:text-white text-rose-500 transition-all shadow-none flex items-center justify-center shrink-0 cursor-pointer"
                    title="Remove Identity"
                  >
                    <Trash2 className="size-3.5 stroke-[2.5px]" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
