"use client";

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchAccounts, createAccount, updateAccount, deleteAccount } from "@/store/slices/accountsSlice";
import { AddInvestmentModal } from "@/components/portfolio/AddInvestmentModal";
import { AddLiabilityModal } from "@/components/portfolio/AddLiabilityModal";
import { AddAssetTypeModal } from "@/components/portfolio/AddAssetTypeModal";
import { AddAssetModal } from "@/components/portfolio/AddAssetModal";

import { addAssetClassAction, updateAssetClassAction, removeAssetClassAction } from "@/store/slices/assetClassesSlice";
import { Account } from "@repo/types";
import { Edit2, Trash2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageHeader } from "@/components/ui/PageHeader";

export default function PortfolioPageClient() {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  
  useEffect(() => {
    if (user) {
      dispatch(fetchAccounts());
    }
  }, [dispatch, user]);

  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);
  const [isAssetTypeModalOpen, setIsAssetTypeModalOpen] = useState(false);
  const [editingAssetType, setEditingAssetType] = useState<{ id: string; name: string; color: string } | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Account | null>(null);
  const [isAddLiabilityOpen, setIsAddLiabilityOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Account | null>(null);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Account | null>(null);
  
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const assetTypes = useSelector((state: RootState) => state.assetClasses.items);

  const [investmentPage, setInvestmentPage] = useState(1);
  const [liabilityPage, setLiabilityPage] = useState(1);
  const itemsPerPage = 10;

  const investments = accounts.filter(a => a.type === 'investment');
  const debts = accounts.filter(a => a.type === 'debt');
  const otherAssets = accounts.filter(a => a.type === 'asset');

  const totalInvestmentPages = Math.ceil(investments.length / itemsPerPage);
  const paginatedInvestments = investments.slice((investmentPage - 1) * itemsPerPage, investmentPage * itemsPerPage);

  const totalDebtPages = Math.ceil(debts.length / itemsPerPage);
  const paginatedDebts = debts.slice((liabilityPage - 1) * itemsPerPage, liabilityPage * itemsPerPage);
  
  const assets = accounts.filter(a => a.type !== 'debt').reduce((sum, item) => sum + item.balance, 0);
  const totalCapitalInvested = investments.reduce((sum, item) => sum + (item.investedAmount || item.balance), 0);
  const liabilities = Math.abs(debts.reduce((sum, item) => sum + item.balance, 0));
  const netWorth = assets - liabilities;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-4 pb-12 lg:pb-8 pt-0">
      {/* Sticky Top Section */}
      <PageHeader
        title="Portfolio"
        subtitle="Unified wealth command"
        className="space-y-3"
        actions={
          <div className="grid grid-cols-2 lg:flex items-center gap-2 w-full lg:w-auto">
            <button 
              onClick={() => { setEditingAssetType(null); setIsAssetTypeModalOpen(true); }}
              className="flex items-center justify-center h-8 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-primary" />
              Class
            </button>
            <button 
              onClick={() => setIsAddInvestmentOpen(true)}
              className="flex items-center justify-center h-8 px-3 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Invest
            </button>
            <button 
              onClick={() => setIsAddLiabilityOpen(true)}
              className="flex items-center justify-center h-8 px-3 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-500/20"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Debt
            </button>
            <button 
              onClick={() => setIsAddAssetOpen(true)}
              className="flex items-center justify-center h-8 px-3 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Asset
            </button>
          </div>
        }
      >
        {/* Sticky Asset Classes Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {assetTypes.map(c => (
            <div key={c.id} className="relative group/asset shrink-0">
              <button 
                onClick={() => { setEditingAssetType(c); setIsAssetTypeModalOpen(true); }}
                className="whitespace-nowrap flex items-center gap-2 pl-3 pr-7 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm transition-all"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${c.color}`} />
                <span className="font-bold text-[9px] uppercase tracking-widest text-slate-600 dark:text-slate-400">{c.name}</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingAssetType(c); setIsAssetTypeModalOpen(true); }}
                className="absolute top-1/2 -translate-y-1/2 right-1.5 p-1 bg-white dark:bg-slate-800 rounded-full shadow-lg opacity-100 lg:opacity-0 lg:group-hover/asset:opacity-100 transition-opacity border border-slate-100 dark:border-white/5 z-10 hover:scale-110 active:scale-90"
              >
                <Edit2 className="w-2.5 h-2.5 text-primary" />
              </button>
            </div>
          ))}
        </div>
      </PageHeader>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Net Worth</div>
          <div className="text-base font-black text-slate-900 dark:text-white mt-1 tracking-tighter">₹{netWorth.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Capital</div>
          <div className="text-base font-black text-slate-900 dark:text-white mt-1 tracking-tighter">₹{totalCapitalInvested.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Valuation</div>
          <div className="text-base font-black text-emerald-500 mt-1 tracking-tighter">₹{investments.reduce((sum, item) => sum + item.balance, 0).toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-3 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Liabilities</div>
          <div className="text-base font-black text-rose-500 mt-1 tracking-tighter">₹{liabilities.toLocaleString()}</div>
        </div>
      </div>

      {/* Investments Section */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Growth Index</h3>
        
        {/* Mobile & Tablet: Card View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
            {paginatedInvestments.length === 0 ? (
                <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No growth assets</p>
                </div>
            ) : (
                paginatedInvestments.map(inv => (
                    <div 
                      key={inv.id} 
                      onClick={() => { setEditingInvestment(inv); setIsAddInvestmentOpen(true); }}
                      className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all flex flex-col gap-3"
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-0.5 min-w-0">
                                <span className={`text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5`}>
                                    <div className={`w-1 h-1 rounded-full ${assetTypes.find(a => a.id === inv.assetType)?.color || 'bg-slate-400'}`} />
                                    {assetTypes.find(a => a.id === inv.assetType)?.name || inv.assetType || 'General'}
                                </span>
                                <h4 className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight truncate">{inv.name}</h4>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Valuation</span>
                                <span className="text-sm font-black text-emerald-500 tracking-tighter">₹{inv.balance.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50 dark:border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Capital</span>
                                <span className="text-[10px] font-bold text-slate-900 dark:text-slate-200">₹{(inv.investedAmount || inv.balance).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Yield</span>
                                <span className={`text-[10px] font-black ${inv.balance >= (inv.investedAmount || inv.balance) ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {((((inv.balance - (inv.investedAmount || inv.balance)) / (inv.investedAmount || inv.balance)) * 100) || 0).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Desktop: Table View (1024px+) */}
        <div className="hidden lg:block overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-white/5 dark:bg-slate-900 dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:bg-slate-800/50">
                <tr>
                  <th className="px-8 py-6" scope="col">Investment Identity</th>
                  <th className="px-8 py-6" scope="col">Asset Class</th>
                  <th className="px-8 py-6 text-right" scope="col">Deployed Capital</th>
                  <th className="px-8 py-6 text-right" scope="col">Current Valuation</th>
                  <th className="px-8 py-6 text-right w-36" scope="col">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {paginatedInvestments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">No active wealth nodes.</td>
                  </tr>
                ) : (
                  paginatedInvestments.map(inv => (
                    <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                      <td className="px-8 py-5">
                        <div className="font-black text-slate-900 dark:text-white tracking-tight">{inv.name}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="inline-flex items-center rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600 dark:bg-slate-800/50 dark:border-white/5 dark:text-slate-400">
                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${assetTypes.find(a => a.id === inv.assetType)?.color || 'bg-slate-400'}`} />
                            {assetTypes.find(a => a.id === inv.assetType)?.name || inv.assetType || inv.type}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{(inv.investedAmount || inv.balance).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="font-black text-emerald-500 text-base tracking-tighter">
                          ₹{inv.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                           <button onClick={() => { setEditingInvestment(inv); setIsAddInvestmentOpen(true); }} className="p-2.5 rounded-xl hover:bg-primary/10 text-slate-400 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                             <Edit2 className="w-3.5 h-3.5" />
                           </button>
                           <button onClick={() => dispatch(deleteAccount(inv.id))} className="p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20">
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalInvestmentPages > 1 && (
            <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{investmentPage} / {totalInvestmentPages}</p>
                <div className="flex gap-2">
                    <button onClick={() => setInvestmentPage(p => Math.max(p - 1, 1))} disabled={investmentPage === 1} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setInvestmentPage(p => Math.min(p + 1, totalInvestmentPages))} disabled={investmentPage === totalInvestmentPages} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>
        )}
      </div>

      {/* Liabilities Section */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Debt Burn-down</h3>
        
        {/* Mobile & Tablet: Card View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
            {paginatedDebts.length === 0 ? (
                <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No debt nodes</p>
                </div>
            ) : (
                paginatedDebts.map(debt => (
                    <div 
                      key={debt.id} 
                      onClick={() => { setEditingLiability(debt); setIsAddLiabilityOpen(true); }}
                      className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm active:scale-[0.98] transition-all flex flex-col gap-3"
                    >
                         <div className="flex justify-between items-start">
                             <div className="space-y-0.5 min-w-0">
                                 <span className="text-[8px] font-black uppercase tracking-widest text-rose-400">{debt.type}</span>
                                 <h4 className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight truncate">{debt.name}</h4>
                             </div>
                             <div className="flex flex-col items-end shrink-0">
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Balance</span>
                                 <span className="text-sm font-black text-rose-500 tracking-tighter">₹{Math.abs(debt.balance).toLocaleString()}</span>
                             </div>
                         </div>
                         <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 dark:border-white/5">
                             <div className="flex flex-col">
                                 <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Limit</span>
                                 <span className="text-[9px] font-bold text-slate-900 dark:text-slate-200">₹{(debt.initialAmount || (Math.abs(debt.balance) + (debt.paidAmount || 0))).toLocaleString()}</span>
                             </div>
                             <div className="flex flex-col items-center">
                                 <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Paid</span>
                                 <span className="text-[9px] font-bold text-emerald-500">₹{(debt.paidAmount || 0).toLocaleString()}</span>
                             </div>
                             <div className="flex flex-col items-end">
                                 <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Cost</span>
                                 <span className="text-[9px] font-bold text-orange-500">₹{(debt.interestPaid || 0).toLocaleString()}</span>
                             </div>
                         </div>
                    </div>
                ))
            )}
        </div>

        {/* Desktop: Table View (1024px+) */}
        <div className="hidden lg:block overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-white/5 dark:bg-slate-900 dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:bg-slate-800/50">
                <tr>
                  <th className="px-8 py-6" scope="col">Liability Identity</th>
                  <th className="px-8 py-6" scope="col">Exposure Class</th>
                  <th className="px-8 py-6 text-right" scope="col">Principal Debt</th>
                  <th className="px-8 py-6 text-right" scope="col">Repaid Capital</th>
                  <th className="px-8 py-6 text-right" scope="col">Burned Interest</th>
                  <th className="px-8 py-6 text-right" scope="col">Current Balance</th>
                  <th className="px-8 py-6 text-right w-36" scope="col">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {paginatedDebts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">No active debt cycles.</td>
                  </tr>
                ) : (
                  paginatedDebts.map(debt => (
                    <tr key={debt.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                      <td className="px-8 py-5">
                        <div className="font-black text-slate-900 dark:text-white tracking-tight">{debt.name}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/5 px-2.5 py-1 rounded-lg border border-rose-500/10">{debt.type}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{(debt.initialAmount || (Math.abs(debt.balance) + (debt.paidAmount || 0))).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right text-emerald-500">
                        <span className="font-bold">
                          ₹{(debt.paidAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right text-orange-500">
                        <span className="font-bold">
                          ₹{(debt.interestPaid || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="font-black text-rose-500 text-base tracking-tighter">
                          ₹{Math.abs(debt.balance).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                           <button onClick={() => { setEditingLiability(debt); setIsAddLiabilityOpen(true); }} className="p-2.5 rounded-xl hover:bg-primary/10 text-slate-400 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                             <Edit2 className="w-3.5 h-3.5" />
                           </button>
                           <button onClick={() => dispatch(deleteAccount(debt.id))} className="p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20">
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalDebtPages > 1 && (
            <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{liabilityPage} / {totalDebtPages}</p>
                <div className="flex gap-2">
                    <button onClick={() => setLiabilityPage(p => Math.max(p - 1, 1))} disabled={liabilityPage === 1} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setLiabilityPage(p => Math.min(p + 1, totalDebtPages))} disabled={liabilityPage === totalDebtPages} className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>
        )}
      </div>

      {/* Other Assets Section */}
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-slate-400 px-1">Misc Asset Storage</h3>
        
        {/* Mobile & Tablet: Card View */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
            {otherAssets.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No misc assets</p>
                </div>
            ) : (
                otherAssets.map(asset => (
                    <div 
                      key={asset.id} 
                      onClick={() => { setEditingAsset(asset); setIsAddAssetOpen(true); }}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm active:scale-95 transition-all flex items-center justify-between"
                    >
                        <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{asset.name}</h4>
                        <span className="text-base font-black text-emerald-500 tracking-tighter">₹{asset.balance.toLocaleString()}</span>
                    </div>
                ))
            )}
        </div>

        {/* Desktop: Table View (1024px+) */}
        <div className="hidden lg:block overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/50 dark:border-white/5 dark:bg-slate-900 dark:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:bg-slate-800/50">
                <tr>
                  <th className="px-8 py-6" scope="col">Asset Identity</th>
                  <th className="px-8 py-6 text-right" scope="col">Current Valuation</th>
                  <th className="px-8 py-6 text-right w-36" scope="col">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {otherAssets.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">No auxiliary wealth clusters.</td>
                  </tr>
                ) : (
                  otherAssets.map(asset => (
                    <tr key={asset.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all">
                      <td className="px-8 py-5">
                        <div className="font-black text-slate-900 dark:text-white tracking-tight">{asset.name}</div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="font-black text-emerald-500 text-base tracking-tighter">
                          ₹{asset.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 transition-opacity">
                           <button onClick={() => { setEditingAsset(asset); setIsAddAssetOpen(true); }} className="p-2.5 rounded-xl hover:bg-primary/10 text-slate-400 hover:text-primary transition-all border border-transparent hover:border-primary/20">
                             <Edit2 className="w-3.5 h-3.5" />
                           </button>
                           <button onClick={() => dispatch(deleteAccount(asset.id))} className="p-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20">
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddInvestmentModal 
        isOpen={isAddInvestmentOpen}
        investment={editingInvestment}
        onClose={() => {
          setIsAddInvestmentOpen(false);
          setEditingInvestment(null);
        }}
        onSave={(data) => {
          if (editingInvestment) {
             dispatch(updateAccount({
                id: editingInvestment.id,
                data: {
                  name: data.assetName,
                  assetType: data.assetType || "",
                  balance: parseFloat(data.currentAmount) || editingInvestment.balance,
                  investedAmount: parseFloat(data.investedAmount) || editingInvestment.investedAmount || editingInvestment.balance
                }
             }));
          } else {
             dispatch(createAccount({
              name: data.assetName,
              type: "investment",
              assetType: data.assetType ??"",
              balance: parseFloat(data.currentAmount) || 0,
              investedAmount: parseFloat(data.investedAmount) || 0,
              currency: "INR",
            }));
          }
          setIsAddInvestmentOpen(false);
          setEditingInvestment(null);
        }}
      />
      
      <AddLiabilityModal
        isOpen={isAddLiabilityOpen}
        liability={editingLiability || undefined}
        onClose={() => {
          setIsAddLiabilityOpen(false);
          setEditingLiability(null);
        }}
        onSave={(data) => {
          const totalLoan = parseFloat(data.initialAmount) || 0;
          const paidAmt = parseFloat(data.paidAmount) || 0;
          const interestPaidVal = parseFloat(data.interestPaid) || 0;
          const remainingBalance = totalLoan - paidAmt;
          
          if (editingLiability) {
             dispatch(updateAccount({
                id: editingLiability.id,
                data: {
                  name: data.name,
                  type: data.type as "debt",
                  initialAmount: totalLoan,
                  paidAmount: paidAmt,
                  interestPaid: interestPaidVal,
                  balance: -remainingBalance
                }
             }));
          } else {
             dispatch(createAccount({
              name: data.name,
              type: "debt",
              assetType: "",
              initialAmount: totalLoan,
              paidAmount: paidAmt,
              interestPaid: interestPaidVal,
              balance: -remainingBalance,
              currency: "INR",
            }));
          }
          setIsAddLiabilityOpen(false);
          setEditingLiability(null);
        }}
      />

      <AddAssetModal
        isOpen={isAddAssetOpen}
        asset={editingAsset || undefined}
        onClose={() => {
          setIsAddAssetOpen(false);
          setEditingAsset(null);
        }}
        onSave={(data) => {
          if (editingAsset) {
             dispatch(updateAccount({
                id: editingAsset.id,
                data: {
                  name: data.name,
                  balance: parseFloat(data.balance) || editingAsset.balance
                }
             }));
          } else {
             dispatch(createAccount({
              name: data.name,
              type: "asset",
              assetType: "",
              balance: parseFloat(data.balance) || 0,
              currency: "INR",
            }));
          }
          setIsAddAssetOpen(false);
          setEditingAsset(null);
        }}
      />
      
      <AddAssetTypeModal 
        isOpen={isAssetTypeModalOpen}
        assetType={editingAssetType}
        onClose={() => setIsAssetTypeModalOpen(false)}
        onSave={(data) => {
          const isNameDuplicate = assetTypes.some(a => a.name.toLowerCase() === data.name.trim().toLowerCase() && a.id !== data.id);
          const isColorDuplicate = assetTypes.some(a => a.color === data.color && a.id !== data.id);
          
          if (isNameDuplicate) {
            toast.error("Asset Class name already exists");
            return;
          }
          if (isColorDuplicate) {
            toast.error("Color theme is already used by another asset class");
            return;
          }
          if (data.id) {
            dispatch(updateAssetClassAction({
              id: data.id,
              data: {
                name: data.name,
                color: data.color
              }
            }));
          } else {
            dispatch(addAssetClassAction({
              name: data.name,
              color: data.color
            }));
          }
          setIsAssetTypeModalOpen(false);
          toast.success(data.id ? "Asset Class updated" : "Asset Class added");
        }}
        onDelete={(id) => {
          dispatch(removeAssetClassAction(id));
          setIsAssetTypeModalOpen(false);
          toast.success("Asset Class deleted");
        }}
      />
    </div>
  );
}
