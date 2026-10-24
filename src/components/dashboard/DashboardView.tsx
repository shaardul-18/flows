import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/math';
import { Expense } from '../../types';

interface DashboardViewProps {
  onOpenLogCash: () => void;
  onOpenNewSplit: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenLogCash,
  onOpenNewSplit,
}) => {
  const {
    currentUser,
    expenses,
    totalYouAreOwed,
    totalYouOwe,
    netBalance,
    isBalanceHidden,
    toggleBalanceVisibility,
    microLeaks,
    microLeaksTotal,
    monthlyBudget,
    monthlySpent,
    monthlyRemaining,
    setActiveTab,
    setSelectedExpenseForSplit,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filterChips = [
    { id: 'all', label: 'All Activity' },
    { id: 'splits', label: 'Pending Splits' },
    { id: 'upi', label: 'UPI Rails' },
    { id: 'cash', label: 'Cash Only' },
    { id: 'leak', label: '⚡ Under ₹200' },
  ];

  const filteredExpenses = expenses.filter((exp) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = exp.title.toLowerCase().includes(q);
      const matchCategory = exp.category.toLowerCase().includes(q);
      const matchAccount = (exp.upiAccount || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCategory && !matchAccount) return false;
    }

    // Filter chip
    if (activeFilter === 'splits') {
      return exp.status === 'pending' && exp.splits.length > 1;
    }
    if (activeFilter === 'upi') {
      return exp.paymentRail === 'UPI';
    }
    if (activeFilter === 'cash') {
      return exp.paymentRail === 'CASH';
    }
    if (activeFilter === 'leak') {
      return exp.isMicroLeak || exp.amount <= 200;
    }
    return true;
  });

  const handleExpenseClick = (exp: Expense) => {
    setSelectedExpenseForSplit(exp);
    setActiveTab('splits');
  };

  const budgetPercent = Math.min(100, Math.round((monthlySpent / monthlyBudget) * 100));

  return (
    <div className="flex flex-col w-full space-y-4 max-w-4xl mx-auto pb-12">
      {/* User Header Context */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col">
          <span className="font-body-sm text-xs text-on-surface-variant">
            Good evening,
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="font-headline-md text-xl sm:text-2xl text-on-surface tracking-tight font-bold">
              Hey {currentUser.name.split(' ')[0]}
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-secondary/20 animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            aria-label="Sync Ledger"
            title="Refresh Ledger"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">sync</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface border border-outline-variant/30">
            <span
              className="material-symbols-outlined text-secondary text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield_with_heart
            </span>
            <span className="font-mono text-[10px] text-secondary uppercase font-bold tracking-wider">
              Synced
            </span>
          </div>
        </div>
      </div>

      {/* Balance Overview Card matching Stitch */}
      <section className="relative overflow-hidden rounded-2xl bg-surface-container p-5 shadow-xl border border-outline-variant/30">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-36 h-36 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Total Available Treasury
            </span>
            <button
              onClick={toggleBalanceVisibility}
              aria-label="Toggle Balance Visibility"
              className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isBalanceHidden ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          <div className="flex items-baseline gap-2 my-1">
            <span className="font-mono text-3xl sm:text-4xl text-on-surface font-bold tracking-tight">
              {isBalanceHidden ? '₹ ••••••••' : '₹1,42,850.00'}
            </span>
            <span className="font-mono text-[11px] text-secondary font-semibold px-2 py-0.5 rounded-full bg-secondary/15 border border-secondary/20">
              +2.4% vs last wk
            </span>
          </div>

          {/* Sub-breakdown Row */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {/* Left Pill: Bank & UPI Balance */}
            <div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest/80 backdrop-blur-sm border border-outline-variant/20">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-primary-container" />
                <span className="text-xs text-on-surface-variant font-medium">Bank & UPI</span>
              </div>
              <span className="font-mono text-sm sm:text-base text-on-surface font-semibold truncate">
                {isBalanceHidden ? '₹ •••••' : '₹1,38,350.00'}
              </span>
              <span className="font-mono text-[10px] text-primary mt-0.5 font-semibold">
                3 Accounts Linked
              </span>
            </div>

            {/* Right Pill: Cash in Hand */}
            <div className="flex flex-col p-3 rounded-xl bg-surface-container-lowest/80 backdrop-blur-sm border border-outline-variant/20">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-xs text-on-surface-variant font-medium">Cash in Hand</span>
              </div>
              <span className="font-mono text-sm sm:text-base text-on-surface font-semibold truncate">
                {isBalanceHidden ? '₹ •••••' : '₹4,500.00'}
              </span>
              <span className="font-mono text-[10px] text-secondary mt-0.5 font-semibold">
                Reconciled Today
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Net Split Cards: You are Owed vs You Owe */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* You Are Owed */}
        <div
          onClick={() => setActiveTab('debts')}
          className="group cursor-pointer p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all border border-secondary/20 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-secondary mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
              You Are Owed
            </span>
            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-secondary">
            +{formatINR(totalYouAreOwed)}
          </div>
          <span className="text-[11px] text-on-surface-variant mt-1 block">
            Across 3 friends (Click to Settle)
          </span>
        </div>

        {/* You Owe */}
        <div
          onClick={() => setActiveTab('debts')}
          className="group cursor-pointer p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all border border-tertiary-container/20 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-tertiary mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
              You Owe
            </span>
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-tertiary">
            -{formatINR(totalYouOwe)}
          </div>
          <span className="text-[11px] text-on-surface-variant mt-1 block">
            Flatmates & Goa Airbnb
          </span>
        </div>

        {/* Net Split Balance */}
        <div
          onClick={() => setActiveTab('debts')}
          className="group cursor-pointer p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all border border-outline-variant/30 shadow-sm"
        >
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
              Net Balance
            </span>
            <span className="material-symbols-outlined text-[18px] text-primary">balance</span>
          </div>
          <div
            className={`font-mono text-xl sm:text-2xl font-bold ${
              netBalance >= 0 ? 'text-secondary' : 'text-tertiary'
            }`}
          >
            {netBalance >= 0 ? '+' : ''}
            {formatINR(netBalance)}
          </div>
          <span className="text-[11px] text-on-surface-variant mt-1 block">
            Simplified debt network
          </span>
        </div>
      </section>

      {/* Monthly Budget Utilization & Leak Banner */}
      <section className="rounded-xl bg-surface-container p-4 shadow-md border border-outline-variant/20 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">pie_chart</span>
            <span className="font-headline-sm text-sm text-on-surface font-bold">
              October Treasury Budget
            </span>
          </div>
          <div className="flex items-center px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary border border-secondary/20">
            <span className="font-mono text-xs font-bold">{budgetPercent}% Used</span>
          </div>
        </div>

        {/* Segmented sleek progress bar */}
        <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden flex">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${budgetPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-on-surface-variant font-mono">
          <span>{formatINR(monthlySpent, false)} spent</span>
          <span className="text-secondary font-semibold">
            {formatINR(monthlyRemaining, false)} remaining
          </span>
        </div>

        {/* Micro-Leak Alert Banner matching Stitch */}
        <div className="flex items-start gap-3 mt-2 p-3 rounded-xl bg-tertiary-container/15 border border-tertiary-container/30 text-on-surface">
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-tertiary-container/30 flex items-center justify-center text-tertiary mt-0.5">
            <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-tertiary uppercase tracking-wider">
                Micro-Leak Detected
              </span>
              <span className="font-mono text-[10px] text-tertiary/90">
                {microLeaks.length} small txns
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">
              You spent{' '}
              <span className="font-mono text-on-surface font-bold">
                {formatINR(microLeaksTotal)}
              </span>{' '}
              on Chai, Autos & Snacks (
              <span className="font-mono text-tertiary">under ₹200</span>) this month.
            </p>
          </div>
        </div>
      </section>

      {/* Primary Action Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Log Cash */}
        <button
          onClick={onOpenLogCash}
          className="h-12 px-3 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary font-headline-sm text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">payments</span>
          <span className="truncate">+ Log Cash</span>
        </button>

        {/* Split a Bill */}
        <button
          onClick={onOpenNewSplit}
          className="h-12 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-primary font-headline-sm text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all border border-primary/20"
        >
          <span className="material-symbols-outlined text-[20px]">group_add</span>
          <span className="truncate">Split a Bill</span>
        </button>

        {/* Scan Receipt OCR */}
        <button
          onClick={() => setActiveTab('scanner')}
          className="h-12 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline-sm text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all border border-outline-variant/30"
        >
          <span className="material-symbols-outlined text-[20px] text-secondary">
            document_scanner
          </span>
          <span className="truncate">Scan Receipt</span>
        </button>

        {/* Settle Up */}
        <button
          onClick={() => setActiveTab('debts')}
          className="h-12 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-secondary-fixed font-headline-sm text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all border border-outline-variant/30"
        >
          <span className="material-symbols-outlined text-[20px]">handshake</span>
          <span className="truncate">Settle Up</span>
        </button>
      </div>

      {/* Quick Category Snapshot Carousel */}
      <div className="flex items-center gap-2.5 overflow-x-auto py-1 no-scrollbar">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/20 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[18px]">trending_down</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold">
              Daily Run Rate
            </span>
            <span className="font-mono text-xs font-bold text-on-surface">₹980 / day</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/20 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold">
              Pending Splits
            </span>
            <span className="font-mono text-xs font-bold text-primary">
              {formatINR(totalYouAreOwed)} owed
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-container border border-outline-variant/20 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-secondary-fixed">
            <span className="material-symbols-outlined text-[18px]">savings</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase font-semibold">
              Auto-Save Vault
            </span>
            <span className="font-mono text-xs font-bold text-on-surface">₹12,400</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <section className="flex flex-col space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-headline-sm text-base text-on-surface font-bold">
              Recent Activity
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-mono text-[10px]">
              {filteredExpenses.length} Transactions
            </span>
          </div>
          <button
            onClick={() => setActiveTab('analytics')}
            className="font-mono text-xs text-primary hover:text-primary-fixed transition-colors flex items-center gap-0.5 font-semibold"
          >
            <span>See Ledger</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Filter Chips & Search */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search merchants, VPAs, or notes..."
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-surface-container text-xs text-on-surface placeholder:text-outline border border-outline-variant/20 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {filterChips.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id)}
                className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all shrink-0 ${
                  activeFilter === chip.id
                    ? 'bg-secondary text-surface font-bold shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex flex-col space-y-2">
          {filteredExpenses.map((exp) => {
            const isPayer = exp.payerId === currentUser.id;
            const mySplit = exp.splits.find((s) => s.memberId === currentUser.id);
            const isSettled = exp.status === 'settled';

            return (
              <div
                key={exp.id}
                onClick={() => handleExpenseClick(exp)}
                className="group flex items-center justify-between p-3.5 rounded-xl bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer border border-outline-variant/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                      exp.category === 'Food' || exp.category === 'Dining'
                        ? 'bg-tertiary-container/20 text-tertiary'
                        : exp.category === 'Transit'
                        ? 'bg-primary/20 text-primary'
                        : exp.category === 'Travel'
                        ? 'bg-secondary/20 text-secondary'
                        : 'bg-surface-container-highest text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {exp.category === 'Food' || exp.category === 'Dining'
                        ? 'restaurant'
                        : exp.category === 'Transit'
                        ? 'directions_subway'
                        : exp.category === 'Travel'
                        ? 'flight_takeoff'
                        : exp.paymentRail === 'CASH'
                        ? 'payments'
                        : 'receipt'}
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm text-on-surface truncate group-hover:text-secondary transition-colors">
                      {exp.title}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          exp.paymentRail === 'CASH'
                            ? 'bg-secondary/15 text-secondary'
                            : 'bg-primary/15 text-primary'
                        }`}
                      >
                        {exp.paymentRail === 'CASH' ? 'CASH' : exp.upiAccount || 'UPI'}
                      </span>
                      <span className="text-[11px] text-on-surface-variant font-mono">
                        {new Date(exp.date).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {exp.isMicroLeak && (
                        <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-tertiary/15 text-tertiary">
                          ⚡ Micro-Leak
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="font-mono text-sm sm:text-base font-bold text-on-surface">
                    - {formatINR(exp.amount)}
                  </span>
                  <div className="flex items-center gap-1 mt-0.5">
                    {exp.splits.length > 1 ? (
                      <span className="text-secondary font-mono text-[10px] flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">people</span>
                        <span>Split ({exp.splits.length})</span>
                      </span>
                    ) : (
                      <span className="text-on-surface-variant font-mono text-[10px]">
                        Personal
                      </span>
                    )}
                    <span
                      className={`font-mono text-[9px] px-1 rounded uppercase ${
                        isSettled
                          ? 'bg-secondary/15 text-secondary'
                          : 'bg-tertiary-container/20 text-tertiary'
                      }`}
                    >
                      {isSettled ? 'Settled' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
