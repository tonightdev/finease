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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full overflow-hidden space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Portfolio</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium uppercase tracking-widest text-xs">Aesthet Asset Command Center</p>
        </div>
        <div className="grid grid-cols-2 lg:flex lg:flex-row items-stretch gap-3 w-full lg:w-auto">
          <button 
            onClick={() => { setEditingAssetType(null); setIsAssetTypeModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm hover:bg-slate-200"
          >
            <Plus className="w-4 h-4 text-primary" />
            Class
          </button>
          <button 
            onClick={() => setIsAddInvestmentOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Invest
          </button>
          <button 
            onClick={() => setIsAddLiabilityOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Debt
          </button>
          <button 
            onClick={() => setIsAddAssetOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Asset
          </button>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8" />
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] relative">Net Worth</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 relative tracking-tighter">₹ {netWorth.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-8 -mt-8" />
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] relative">Capital</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 relative tracking-tighter">₹ {totalCapitalInvested.toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8" />
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] relative">Valuation</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-500 mt-1 relative tracking-tighter">₹ {investments.reduce((sum, item) => sum + item.balance, 0).toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-8 -mt-8" />
          <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] relative">Liabilities</div>
          <div className="text-xl sm:text-2xl font-black text-rose-500 mt-1 relative tracking-tighter">₹ {liabilities.toLocaleString()}</div>
        </div>
      </div>

      {/* Asset Classes Section - Synced Design */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Asset Classes</h3>
            <div className="h-px w-8 bg-slate-200 dark:bg-slate-800" />
          </div>
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:block">Double-tap or click icon to manage</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 py-2">
          {assetTypes.map(c => (
            <div key={c.id} className="relative group/chip">
              <button 
                onClick={() => { 
                  setEditingAssetType(c); 
                  setIsAssetTypeModalOpen(true); 
                }}
                onDoubleClick={() => { setEditingAssetType(c); setIsAssetTypeModalOpen(true); }}
                className="pl-4 pr-10 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 flex items-center gap-3 transition-all hover:border-slate-300 dark:hover:border-white/20 relative overflow-hidden backdrop-blur-sm group/btn"
              >
                <div className={`w-2 h-2 rounded-full shadow-sm ${c.color} group-hover/btn:scale-110 group-hover/btn:ring-4 group-hover/btn:ring-primary/20 transition-all`} />
                <span className="font-bold text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400">{c.name}</span>
              </button>
              
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setEditingAssetType(c); 
                  setIsAssetTypeModalOpen(true); 
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary dark:hover:text-primary-light transition-all rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 opacity-100 sm:opacity-0 group-hover/chip:opacity-100 focus:opacity-100 z-10"
                title="Edit asset class"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button 
             onClick={() => { setEditingAssetType(null); setIsAssetTypeModalOpen(true); }}
             className="px-5 py-2.5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/5 transition-all flex items-center gap-2"
          >
             <Plus className="w-3 h-3" />
             New Entity
          </button>
        </div>
      </div>

      {/* Investments Section */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Your Growth Engine (Investments)</h3>
        
        {/* Mobile & Tablet: Card View */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
            {paginatedInvestments.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No investments active</p>
                </div>
            ) : (
                paginatedInvestments.map(inv => (
                    <div 
                      key={inv.id} 
                      onClick={() => { setEditingInvestment(inv); setIsAddInvestmentOpen(true); }}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm active:scale-95 transition-all flex flex-col gap-5"
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${assetTypes.find(a => a.id === inv.assetType)?.color || 'bg-slate-400'}`} />
                                    {assetTypes.find(a => a.id === inv.assetType)?.name || inv.assetType || 'General'}
                                </span>
                                <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{inv.name}</h4>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valuation</span>
                                <span className="text-lg font-black text-emerald-500 tracking-tighter">₹{inv.balance.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Capital</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-slate-200 mt-1">₹{(inv.investedAmount || inv.balance).toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Yield</span>
                                <span className={`text-xs font-black mt-1 ${inv.balance >= (inv.investedAmount || inv.balance) ? 'text-emerald-500' : 'text-rose-500'}`}>
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
      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Active Debt Burners (Liabilities)</h3>
        
        {/* Mobile & Tablet: Card View */}
        <div className="grid grid-cols-1 gap-4 lg:hidden">
            {paginatedDebts.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active liabilities</p>
                </div>
            ) : (
                paginatedDebts.map(debt => (
                    <div 
                      key={debt.id} 
                      onClick={() => { setEditingLiability(debt); setIsAddLiabilityOpen(true); }}
                      className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm active:scale-95 transition-all flex flex-col gap-5"
                    >
                         <div className="flex justify-between items-start">
                             <div className="space-y-1">
                                 <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">{debt.type}</span>
                                 <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">{debt.name}</h4>
                             </div>
                             <div className="flex flex-col items-end">
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Remaining</span>
                                 <span className="text-lg font-black text-rose-500 tracking-tighter">₹{Math.abs(debt.balance).toLocaleString()}</span>
                             </div>
                         </div>
                         <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50 dark:border-white/5">
                             <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Total</span>
                                 <span className="text-[10px] font-bold text-slate-900 dark:text-slate-200 mt-1">₹{(debt.initialAmount || (Math.abs(debt.balance) + (debt.paidAmount || 0))).toLocaleString()}</span>
                             </div>
                             <div className="flex flex-col items-center">
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Paid</span>
                                 <span className="text-[10px] font-bold text-emerald-500 mt-1">₹{(debt.paidAmount || 0).toLocaleString()}</span>
                             </div>
                             <div className="flex flex-col items-end">
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Interest</span>
                                 <span className="text-[10px] font-bold text-orange-500 mt-1">₹{(debt.interestPaid || 0).toLocaleString()}</span>
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
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Misc Asset Storage</h3>
        
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
