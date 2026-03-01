"use client";

import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { addAccount } from "@/store/slices/accountsSlice";
import { AddInvestmentModal } from "@/components/portfolio/AddInvestmentModal";
import { AddLiabilityModal } from "@/components/portfolio/AddLiabilityModal";
import { AddAssetTypeModal } from "@/components/portfolio/AddAssetTypeModal";
import { addAssetType, updateAssetType, removeAssetType } from "@/store/slices/assetTypesSlice";
import { updateAccount, removeAccount } from "@/store/slices/accountsSlice";
import { Account } from "@repo/types";
import { Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function PortfolioPageClient() {
  const dispatch = useDispatch();
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);
  const [isAssetTypeModalOpen, setIsAssetTypeModalOpen] = useState(false);
  const [editingAssetType, setEditingAssetType] = useState<{ id: string; name: string; color: string } | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Account | null>(null);
  const [isAddLiabilityOpen, setIsAddLiabilityOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Account | null>(null);
  
  const accounts = useSelector((state: RootState) => state.accounts.items);
  const assetTypes = useSelector((state: RootState) => state.assetTypes.items);

  const [investmentPage, setInvestmentPage] = useState(1);
  const [liabilityPage, setLiabilityPage] = useState(1);
  const itemsPerPage = 10;

  const investments = accounts.filter(a => a.type === 'investment');
  const loans = accounts.filter(a => a.type === 'loan');

  const totalInvestmentPages = Math.ceil(investments.length / itemsPerPage);
  const paginatedInvestments = investments.slice((investmentPage - 1) * itemsPerPage, investmentPage * itemsPerPage);

  const totalLiabilityPages = Math.ceil(loans.length / itemsPerPage);
  const paginatedLoans = loans.slice((liabilityPage - 1) * itemsPerPage, liabilityPage * itemsPerPage);
  
  const assets = accounts.filter(a => a.type !== 'loan').reduce((sum, item) => sum + item.balance, 0);
  const totalCapitalInvested = investments.reduce((sum, item) => sum + (item.investedAmount || item.balance), 0);
  const liabilities = Math.abs(loans.reduce((sum, item) => sum + item.balance, 0));
  const netWorth = assets - liabilities;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Investment Portfolio</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your wealth growth across all asset classes.</p>
        </div>
        <div className="grid grid-cols-2 md:flex md:flex-row items-stretch gap-3 w-full md:w-auto mt-4 md:mt-0">
          <button 
            onClick={() => { setEditingAssetType(null); setIsAssetTypeModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-lg transition-colors shadow-sm w-full md:w-auto"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Asset Class
          </button>
          <button 
            onClick={() => setIsAddInvestmentOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary rounded-lg text-sm font-medium text-white hover:bg-primary-dark transition shadow-lg shadow-primary/25 w-full md:w-auto"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Investment
          </button>
          <button 
            onClick={() => setIsAddLiabilityOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 rounded-lg text-sm font-medium text-white hover:bg-red-600 transition shadow-sm w-full md:w-auto"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Liability
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Net Worth</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹ {(netWorth).toLocaleString()}</div>
        </div>
        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Capital Invested</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹ {totalCapitalInvested.toLocaleString()}</div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Current Value</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹ {investments.reduce((sum, item) => sum + item.balance, 0).toLocaleString()}</div>
        </div>

        <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-border-dark p-5 rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
              <span className="material-symbols-outlined">credit_card</span>
            </div>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Liabilities</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹ {liabilities.toLocaleString()}</div>
        </div>
      </div>

      <div className="space-y-6 mb-8 mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Asset Classes</h3>
          <button 
             onClick={() => { setEditingAssetType(null); setIsAssetTypeModalOpen(true); }}
             className="text-sm font-bold text-primary hover:underline"
          >
             Add New
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {assetTypes.map(c => (
            <div 
              key={c.id} 
              onClick={() => { setEditingAssetType(c); setIsAssetTypeModalOpen(true); }}
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#0b0d12] border border-slate-200 dark:border-border-dark flex items-center justify-between cursor-pointer hover:border-primary transition-colors group"
            >
               <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{c.name}</span>
               <div className={`w-3 h-3 rounded-full ${c.color}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Investments</h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-[#0b0d12] dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4" scope="col">Name</th>
                  <th className="px-6 py-4" scope="col">Type</th>
                  <th className="px-6 py-4 text-right" scope="col">Invested Amount</th>
                  <th className="px-6 py-4 text-right" scope="col">Current Amount</th>
                  <th className="px-6 py-4 text-right" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                {paginatedInvestments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-slate-500">No investments added yet.</td>
                  </tr>
                ) : (
                  paginatedInvestments.map(inv => (
                    <tr key={inv.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{inv.name}</div>
                      </td>
                      <td className="px-6 py-4 uppercase text-xs font-bold text-slate-500">
                        {inv.assetType || inv.type}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{(inv.investedAmount || inv.balance).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white">
                          ₹{inv.balance.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={() => { setEditingInvestment(inv); setIsAddInvestmentOpen(true); }} className="p-2 text-slate-400 hover:text-primary transition-colors">
                             <Edit2 className="w-4 h-4" />
                           </button>
                           <button onClick={() => dispatch(removeAccount(inv.id))} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalInvestmentPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-[#0b0d12] px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setInvestmentPage(prev => Math.max(prev - 1, 1))}
                  disabled={investmentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-border-dark dark:bg-surface-dark dark:text-slate-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setInvestmentPage(prev => Math.min(prev + 1, totalInvestmentPages))}
                  disabled={investmentPage === totalInvestmentPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-border-dark dark:bg-surface-dark dark:text-slate-300"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Showing <span className="font-medium">{(investmentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(investmentPage * itemsPerPage, investments.length)}</span> of <span className="font-medium">{investments.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    {Array.from({ length: totalInvestmentPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setInvestmentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${investmentPage === i + 1 ? 'z-10 bg-primary text-white' : 'text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-border-dark hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>

    <div className="space-y-6 mt-8">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Liabilities</h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:bg-[#0b0d12] dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4" scope="col">Name</th>
                  <th className="px-6 py-4" scope="col">Type</th>
                  <th className="px-6 py-4 text-right" scope="col">Total Loan</th>
                  <th className="px-6 py-4 text-right" scope="col">Paid</th>
                  <th className="px-6 py-4 text-right" scope="col">Interest Paid</th>
                  <th className="px-6 py-4 text-right" scope="col">Remaining Balance</th>
                  <th className="px-6 py-4 text-right" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border-dark">
                {paginatedLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-center text-slate-500">No liabilities added yet.</td>
                  </tr>
                ) : (
                  paginatedLoans.map(loan => (
                    <tr key={loan.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">{loan.name}</div>
                      </td>
                      <td className="px-6 py-4 uppercase text-xs font-bold text-slate-500">
                        {loan.type}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          ₹{(loan.initialAmount || (Math.abs(loan.balance) + (loan.paidAmount || 0))).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-500">
                        <span className="font-bold">
                          ₹{(loan.paidAmount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-orange-500">
                        <span className="font-bold">
                          ₹{(loan.interestPaid || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-red-500">
                          ₹{Math.abs(loan.balance).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={() => { setEditingLiability(loan); setIsAddLiabilityOpen(true); }} className="p-2 text-slate-400 hover:text-primary transition-colors">
                             <Edit2 className="w-4 h-4" />
                           </button>
                           <button onClick={() => dispatch(removeAccount(loan.id))} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalLiabilityPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-border-dark bg-slate-50 dark:bg-[#0b0d12] px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setLiabilityPage(prev => Math.max(prev - 1, 1))}
                  disabled={liabilityPage === 1}
                  className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-border-dark dark:bg-surface-dark dark:text-slate-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setLiabilityPage(prev => Math.min(prev + 1, totalLiabilityPages))}
                  disabled={liabilityPage === totalLiabilityPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-border-dark dark:bg-surface-dark dark:text-slate-300"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    Showing <span className="font-medium">{(liabilityPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(liabilityPage * itemsPerPage, loans.length)}</span> of <span className="font-medium">{loans.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    {Array.from({ length: totalLiabilityPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setLiabilityPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${liabilityPage === i + 1 ? 'z-10 bg-primary text-white' : 'text-slate-900 dark:text-white ring-1 ring-inset ring-slate-300 dark:ring-border-dark hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
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
                ...editingInvestment,
                name: data.assetName,
                assetType: data.assetType || "",
                balance: parseFloat(data.currentAmount) || editingInvestment.balance,
                investedAmount: parseFloat(data.investedAmount) || editingInvestment.investedAmount || editingInvestment.balance
             }));
          } else {
             dispatch(addAccount({
              id: `inv-${Date.now()}`,
              userId: "user-1",
              name: data.assetName,
              type: "investment",
              assetType: data.assetType ??"",
              balance: parseFloat(data.currentAmount) || 0,
              investedAmount: parseFloat(data.investedAmount) || 0,
              currency: "INR",
              lastSyncedAt: new Date().toISOString()
            }));
          }
          setIsAddInvestmentOpen(false);
          setEditingInvestment(null);
        }}
      />
      
      <AddLiabilityModal
        isOpen={isAddLiabilityOpen}
        liability={editingLiability}
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
                ...editingLiability,
                name: data.name,
                type: data.type as "loan",
                initialAmount: totalLoan,
                paidAmount: paidAmt,
                interestPaid: interestPaidVal,
                balance: -remainingBalance
             }));
          } else {
             dispatch(addAccount({
              id: `loan-${Date.now()}`,
              userId: "user-1",
              name: data.name,
              type: "loan",
              assetType: "",
              initialAmount: totalLoan,
              paidAmount: paidAmt,
              interestPaid: interestPaidVal,
              balance: -remainingBalance,
              currency: "INR",
              lastSyncedAt: new Date().toISOString()
            }));
          }
          setIsAddLiabilityOpen(false);
          setEditingLiability(null);
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
            dispatch(updateAssetType({
              id: data.id,
              name: data.name,
              color: data.color
            }));
          } else {
            dispatch(addAssetType({
              id: `ast-${Date.now()}`,
              name: data.name,
              color: data.color
            }));
          }
          setIsAssetTypeModalOpen(false);
          toast.success(data.id ? "Asset Class updated" : "Asset Class added");
        }}
        onDelete={(id) => {
          dispatch(removeAssetType(id));
          setIsAssetTypeModalOpen(false);
          toast.success("Asset Class deleted");
        }}
      />
    </div>
  );
}
