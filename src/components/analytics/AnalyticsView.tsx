import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/math';
import { ExpenseCategory } from '../../types';

export const AnalyticsView: React.FC = () => {
  const { expenses, currentUser, users, deleteExpense, setSelectedExpenseForSplit, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filterChips = [
    { id: 'all', label: 'All' },
    { id: 'upi', label: 'UPI Only' },
    { id: 'cash', label: 'Cash Only' },
    { id: 'food', label: 'Food & Dining' },
    { id: 'transit', label: 'Transit' },
    { id: 'leak', label: '⚡ Under ₹200' },
  ];

  // Category breakdown calculation
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {
      Food: 0,
      Transit: 0,
      Shopping: 0,
      Groceries: 0,
      Travel: 0,
      Other: 0,
    };

    let totalSpent = 0;

    expenses.forEach((exp) => {
      // Current user's share or full expense if personal
      const mySplit = exp.splits.find((s) => s.memberId === currentUser.id);
      const myAmt = mySplit ? mySplit.amount : (exp.payerId === currentUser.id ? exp.amount : 0);

      if (myAmt > 0) {
        totalSpent += myAmt;
        const cat = exp.category === 'Dining' ? 'Food' : exp.category in stats ? exp.category : 'Other';
        stats[cat] = (stats[cat] || 0) + myAmt;
      }
    });

    const categoriesWithPct = Object.entries(stats).map(([cat, amount]) => ({
      name: cat,
      amount,
      percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0,
    }));

    return { totalSpent, categoriesWithPct };
  }, [expenses, currentUser]);

  // Micro-leaks (transactions under ₹200)
  const microLeaks = useMemo(() => {
    return expenses.filter((e) => (e.isMicroLeak || e.amount <= 200) && e.payerId === currentUser.id);
  }, [expenses, currentUser]);

  const microLeaksSum = microLeaks.reduce((sum, e) => sum + e.amount, 0);

  // Filtered transactions
  const filteredList = useMemo(() => {
    return expenses.filter((exp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = exp.title.toLowerCase().includes(q);
        const matchCat = exp.category.toLowerCase().includes(q);
        const matchNotes = (exp.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchNotes) return false;
      }

      if (selectedFilter === 'upi') return exp.paymentRail === 'UPI';
      if (selectedFilter === 'cash') return exp.paymentRail === 'CASH';
      if (selectedFilter === 'food') return exp.category === 'Food' || exp.category === 'Dining';
      if (selectedFilter === 'transit') return exp.category === 'Transit';
      if (selectedFilter === 'leak') return exp.isMicroLeak || exp.amount <= 200;

      return true;
    });
  }, [expenses, searchQuery, selectedFilter]);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-16 space-y-4">
      {/* Search & Filter Bar matching Stitch */}
      <div className="relative w-full">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchants, notes, or VPAs..."
            className="w-full h-12 pl-10 pr-12 rounded-xl bg-surface-container text-on-surface placeholder:text-on-surface-variant font-body-md text-sm shadow-sm outline-none transition-all duration-200 focus:bg-surface-container-high border border-outline-variant/30"
          />
          <button
            aria-label="Filter transactions"
            className="absolute right-1.5 w-9 h-9 rounded-lg bg-surface-container-highest text-on-surface flex items-center justify-center transition-transform active:scale-95 hover:bg-surface-bright"
          >
            <span className="material-symbols-outlined text-[19px]">tune</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Filter Chips matching Stitch */}
      <div className="w-full overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-2 min-w-max">
          {filterChips.map((chip) => {
            const isActive = selectedFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedFilter(chip.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold transition-all ${
                  isActive
                    ? 'bg-secondary text-surface shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown Analytics Card matching Stitch */}
      <section className="w-full bg-surface-container rounded-2xl p-4 sm:p-5 shadow-lg border border-outline-variant/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">donut_small</span>
            <h2 className="font-headline-sm text-sm sm:text-base text-on-surface font-bold">
              Monthly Category Breakdown
            </h2>
          </div>
          <div className="flex items-center gap-1 bg-surface-container-highest text-on-surface font-mono text-[11px] font-bold px-3 py-1 rounded-lg border border-outline-variant/30">
            <span>OCT 2026</span>
          </div>
        </div>

        {/* Stacked Category Proportion Bar */}
        <div className="h-4 w-full bg-surface-container-lowest rounded-full p-0.5 flex gap-1 overflow-hidden my-3 border border-outline-variant/20">
          <div
            className="h-full bg-tertiary-container rounded-l-full transition-all duration-500"
            style={{ width: '42%' }}
            title="Food & Dining 42%"
          />
          <div
            className="h-full bg-secondary-container transition-all duration-500"
            style={{ width: '28%' }}
            title="Transit 28%"
          />
          <div
            className="h-full bg-primary-container transition-all duration-500"
            style={{ width: '18%' }}
            title="Shopping 18%"
          />
          <div
            className="h-full bg-surface-container-highest rounded-r-full transition-all duration-500"
            style={{ width: '12%' }}
            title="Others 12%"
          />
        </div>

        {/* Category Legend & Data Columns matching Stitch */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="flex flex-col bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container shrink-0" />
              <span className="text-xs text-on-surface-variant font-medium truncate">Food & Dining</span>
            </div>
            <span className="font-mono text-sm sm:text-base text-on-surface font-bold">₹13,020</span>
            <span className="font-mono text-[11px] text-tertiary mt-0.5 font-semibold">42%</span>
          </div>

          <div className="flex flex-col bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary-container shrink-0" />
              <span className="text-xs text-on-surface-variant font-medium truncate">Transit & Commute</span>
            </div>
            <span className="font-mono text-sm sm:text-base text-on-surface font-bold">₹8,680</span>
            <span className="font-mono text-[11px] text-secondary mt-0.5 font-semibold">28%</span>
          </div>

          <div className="flex flex-col bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container shrink-0" />
              <span className="text-xs text-on-surface-variant font-medium truncate">Shopping & Groceries</span>
            </div>
            <span className="font-mono text-sm sm:text-base text-on-surface font-bold">₹5,580</span>
            <span className="font-mono text-[11px] text-primary mt-0.5 font-semibold">18%</span>
          </div>
        </div>
      </section>

      {/* Micro-Expense Leak Tracker Banner matching Stitch */}
      <section className="relative overflow-hidden w-full bg-surface-container-high rounded-2xl p-4 sm:p-5 shadow-lg border border-outline-variant/30">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-tertiary-container/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-tertiary-container/20 text-tertiary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-sm sm:text-base text-tertiary font-bold tracking-tight">
                Daily Micro-Leaks Tracker
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                AI detection active on repetitive sub-₹200 tap transactions
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] bg-surface-container text-tertiary px-2.5 py-1 rounded-full font-bold border border-tertiary/20">
            ACTIVE SCAN
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-outline-variant/20">
          <div className="p-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase">30-Day Sum</span>
            <div className="font-mono text-base font-bold text-tertiary">{formatINR(microLeaksSum)}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase">Txn Volume</span>
            <div className="font-mono text-base font-bold text-on-surface">{microLeaks.length} Micro Txns</div>
          </div>
          <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20">
            <span className="text-[10px] font-mono text-on-surface-variant uppercase">Est. Annual Leak</span>
            <div className="font-mono text-base font-bold text-secondary">₹17,040 / yr</div>
          </div>
        </div>
      </section>

      {/* Comprehensive Transactions Ledger Table */}
      <section className="bg-surface-container rounded-2xl p-4 sm:p-5 shadow-lg border border-outline-variant/30 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">receipt_long</span>
            <h2 className="font-headline-sm text-sm sm:text-base text-on-surface font-bold">
              Ledger Stream ({filteredList.length})
            </h2>
          </div>
          <span className="font-mono text-xs text-on-surface-variant">Tap transaction to inspect splits</span>
        </div>

        <div className="flex flex-col space-y-2">
          {filteredList.map((exp) => {
            const payer = users.find((u) => u.id === exp.payerId)?.name || 'Unknown';
            const isSettled = exp.status === 'settled';

            return (
              <div
                key={exp.id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high transition-all border border-outline-variant/20"
              >
                <div
                  onClick={() => {
                    setSelectedExpenseForSplit(exp);
                    setActiveTab('splits');
                  }}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-secondary shrink-0">
                    <span className="material-symbols-outlined text-[18px]">
                      {exp.paymentRail === 'CASH' ? 'payments' : 'account_balance_wallet'}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-on-surface truncate">
                      {exp.title}
                    </span>
                    <span className="text-xs font-mono text-on-surface-variant">
                      {new Date(exp.date).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      • Paid by {payer} • {exp.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-mono text-sm sm:text-base font-bold text-on-surface">
                      {formatINR(exp.amount)}
                    </span>
                    <span
                      className={`block font-mono text-[10px] font-bold uppercase ${
                        isSettled ? 'text-secondary' : 'text-tertiary'
                      }`}
                    >
                      {isSettled ? 'Settled' : 'Unpaid'}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteExpense(exp.id)}
                    className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error transition-colors"
                    title="Delete transaction"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
