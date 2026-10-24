import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR, formatCompactINR } from '../../utils/math';
import { Expense } from '../../types';

interface DesktopLedgerViewProps {
  onOpenLogCash: () => void;
  onOpenNewSplit: () => void;
  onOpenExport: () => void;
}

export const DesktopLedgerView: React.FC<DesktopLedgerViewProps> = ({
  onOpenLogCash,
  onOpenNewSplit,
  onOpenExport,
}) => {
  const {
    currentUser,
    expenses,
    users,
    groups,
    totalYouAreOwed,
    totalYouOwe,
    monthlySpent,
    monthlyRemaining,
    monthlyBudget,
    isBalanceHidden,
    toggleBalanceVisibility,
    setSelectedExpenseForSplit,
    setActiveTab,
    deleteExpense,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredExpenses = expenses.filter((exp) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = exp.title.toLowerCase().includes(q);
      const matchCat = exp.category.toLowerCase().includes(q);
      const matchNotes = (exp.notes || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCat && !matchNotes) return false;
    }
    if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  const handleRowClick = (exp: Expense) => {
    setSelectedExpenseForSplit(exp);
    setActiveTab('splits');
  };

  return (
    <div className="flex flex-col w-full space-y-6 pb-20">
      {/* Top Action & Context Header matching Stitch */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
            <span className="font-mono text-xs text-secondary uppercase tracking-widest font-bold">
              Personal Treasury Pulse
            </span>
            <span className="text-outline-variant font-mono text-xs">•</span>
            <span className="font-mono text-xs text-on-surface-variant">
              Real-Time Aggregation (IST)
            </span>
          </div>

          <h1 className="font-headline-lg text-2xl sm:text-3xl text-on-surface font-bold tracking-tight flex items-baseline gap-3">
            <span>October 2026 Cashflow</span>
            <span className="font-mono text-xs text-secondary bg-surface-container-high px-2.5 py-0.5 rounded-full border border-secondary/30">
              Automated via UPI Webhook
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-surface-container px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-mono text-on-surface border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-[18px]">calendar_month</span>
            <span>Oct 1 – Oct 24, 2026</span>
          </div>

          <button
            onClick={onOpenNewSplit}
            className="h-10 px-4 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary font-headline-sm text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">group_add</span>
            <span>Split a Bill</span>
          </button>

          <button
            onClick={onOpenLogCash}
            className="h-10 px-4 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline-sm text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-secondary text-[18px]">payments</span>
            <span>Quick Cash</span>
          </button>

          <button
            onClick={onOpenExport}
            className="h-10 px-4 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline-sm text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-secondary text-[18px]">table_chart</span>
            <span>Export (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Bento Stats Ribbon matching Stitch */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3.5">
        {/* Card 1: Total Net Liquidity */}
        <div className="lg:col-span-4 bg-surface-container rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-md border border-outline-variant/30">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none group-hover:bg-primary/20 transition-all" />
          <div>
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                Total Net Liquidity
              </span>
              <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-mono text-[11px] font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>+2.4% vs lw
              </span>
            </div>
            <div className="font-mono text-3xl font-bold text-on-surface tracking-tight mt-1">
              {isBalanceHidden ? '₹ ••••••••' : '₹1,42,850.00'}
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-on-surface-variant border-t border-outline-variant/20 font-mono">
            <span className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-[16px]">verified_user</span> 3 Banks Active
            </span>
            <span className="text-secondary font-bold">₹3,400.00 today</span>
          </div>
        </div>

        {/* Card 2: Bank & UPI Stack */}
        <div className="lg:col-span-3 bg-surface-container rounded-2xl p-5 flex flex-col justify-between shadow-md border border-outline-variant/30">
          <div>
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-mono text-xs uppercase font-semibold">UPI & Bank Stack</span>
              <span className="material-symbols-outlined text-primary text-[18px]">account_balance</span>
            </div>
            <div className="font-mono text-2xl font-bold text-on-surface">
              {isBalanceHidden ? '₹ •••••' : '₹1,38,350.00'}
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <div className="flex-1 bg-surface-container-high rounded-xl p-2 flex flex-col border border-outline-variant/20">
              <span className="font-mono text-[10px] text-on-surface-variant">HDFC</span>
              <span className="font-mono text-xs font-bold text-on-surface">₹84.2k</span>
            </div>
            <div className="flex-1 bg-surface-container-high rounded-xl p-2 flex flex-col border border-outline-variant/20">
              <span className="font-mono text-[10px] text-on-surface-variant">ICICI</span>
              <span className="font-mono text-xs font-bold text-on-surface">₹41.1k</span>
            </div>
            <div className="flex-1 bg-surface-container-high rounded-xl p-2 flex flex-col border border-outline-variant/20">
              <span className="font-mono text-[10px] text-on-surface-variant">PhonePe</span>
              <span className="font-mono text-xs font-bold text-on-surface">₹13.0k</span>
            </div>
          </div>
        </div>

        {/* Card 3: Physical Cash */}
        <div className="lg:col-span-2 bg-surface-container rounded-2xl p-5 flex flex-col justify-between shadow-md border border-outline-variant/30">
          <div>
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-mono text-xs uppercase font-semibold">Cash In Hand</span>
              <span className="material-symbols-outlined text-secondary text-[18px]">payments</span>
            </div>
            <div className="font-mono text-2xl font-bold text-on-surface">
              {isBalanceHidden ? '₹ •••••' : '₹4,500.00'}
            </div>
          </div>
          <div className="flex items-center justify-between bg-surface-container-high px-2.5 py-1.5 rounded-xl border border-outline-variant/20 mt-3 font-mono text-xs">
            <span className="text-secondary flex items-center gap-1 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />Reconciled
            </span>
            <span className="text-on-surface-variant text-[10px]">Today</span>
          </div>
        </div>

        {/* Card 4: Budget Utilization */}
        <div className="lg:col-span-3 bg-surface-container rounded-2xl p-5 flex flex-col justify-between shadow-md border border-outline-variant/30">
          <div>
            <div className="flex items-center justify-between text-on-surface-variant mb-1">
              <span className="font-mono text-xs uppercase font-semibold">Monthly Budget</span>
              <span className="font-mono text-xs text-secondary bg-secondary/15 px-2 py-0.5 rounded-full font-bold">
                62% Used
              </span>
            </div>
            <div className="font-mono text-2xl font-bold text-on-surface">
              {formatINR(monthlySpent, false)}
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden flex">
              <div className="h-full bg-secondary rounded-full" style={{ width: '62%' }} />
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px] font-mono text-on-surface-variant">
              <span>Spent {formatINR(monthlySpent, false)}</span>
              <span className="text-secondary font-bold">Rem. {formatINR(monthlyRemaining, false)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Large Desktop Ledger Table matching Stitch */}
      <div className="bg-surface-container rounded-2xl p-5 shadow-xl border border-outline-variant/30 flex flex-col space-y-4">
        {/* Table Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter transactions, merchants, or notes..."
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-surface-container-lowest text-xs text-on-surface placeholder:text-outline border border-outline-variant/30 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {['ALL', 'Dining', 'Transit', 'Groceries', 'Travel', 'Micro-Leak'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-semibold transition-all shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-secondary text-surface shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest text-[11px] font-mono uppercase text-on-surface-variant border-b border-outline-variant/20">
                <th className="py-3 px-4">Date & Rail</th>
                <th className="py-3 px-4">Description / Merchant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Paid By</th>
                <th className="py-3 px-4">Split Method</th>
                <th className="py-3 px-4 text-right">Total Bill</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15 text-xs">
              {filteredExpenses.map((exp) => {
                const payer = users.find((u) => u.id === exp.payerId)?.name || 'Unknown';
                const isSettled = exp.status === 'settled';

                return (
                  <tr
                    key={exp.id}
                    className="hover:bg-surface-container-high/60 transition-colors group cursor-pointer"
                  >
                    <td onClick={() => handleRowClick(exp)} className="py-3 px-4 font-mono text-on-surface-variant whitespace-nowrap">
                      <div>
                        {new Date(exp.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </div>
                      <span className="text-[10px] text-primary font-semibold">
                        {exp.paymentRail} ({exp.upiAccount || 'Cash'})
                      </span>
                    </td>

                    <td onClick={() => handleRowClick(exp)} className="py-3 px-4 font-semibold text-on-surface">
                      <div className="flex items-center gap-2">
                        <span>{exp.title}</span>
                        {exp.isMicroLeak && (
                          <span className="px-1.5 py-0.2 rounded bg-tertiary/15 text-tertiary font-mono text-[9px]">
                            Micro-Leak
                          </span>
                        )}
                      </div>
                      {exp.notes && (
                        <span className="text-[11px] text-on-surface-variant block font-normal truncate max-w-xs">
                          {exp.notes}
                        </span>
                      )}
                    </td>

                    <td onClick={() => handleRowClick(exp)} className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-[10px]">
                        {exp.category}
                      </span>
                    </td>

                    <td onClick={() => handleRowClick(exp)} className="py-3 px-4 font-mono whitespace-nowrap text-on-surface">
                      {payer}
                    </td>

                    <td onClick={() => handleRowClick(exp)} className="py-3 px-4 font-mono text-[11px] text-secondary whitespace-nowrap">
                      {exp.splitMethod} ({exp.splits.length} pers.)
                    </td>

                    <td onClick={() => handleRowClick(exp)} className="py-3 px-4 font-mono text-right font-bold text-on-surface whitespace-nowrap">
                      {formatINR(exp.amount)}
                    </td>

                    <td onClick={() => handleRowClick(exp)} className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                          isSettled
                            ? 'bg-secondary/15 text-secondary'
                            : 'bg-tertiary-container/20 text-tertiary'
                        }`}
                      >
                        {isSettled ? 'Settled' : 'Unpaid'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleRowClick(exp)}
                          className="p-1 rounded-lg bg-surface-container hover:bg-surface-bright text-secondary transition-colors"
                          title="View / Edit Split"
                        >
                          <span className="material-symbols-outlined text-[16px]">tune</span>
                        </button>
                        <button
                          onClick={() => deleteExpense(exp.id)}
                          className="p-1 rounded-lg bg-surface-container hover:bg-surface-bright text-on-surface-variant hover:text-error transition-colors"
                          title="Delete entry"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
