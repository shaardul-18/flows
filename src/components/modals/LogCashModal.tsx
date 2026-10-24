import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory } from '../../types';

interface LogCashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogCashModal: React.FC<LogCashModalProps> = ({ isOpen, onClose }) => {
  const { addExpense, currentUser, users } = useApp();
  const [amount, setAmount] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Transit');
  const [isSplit, setIsSplit] = useState<boolean>(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([currentUser.id]);

  if (!isOpen) return null;

  const categories: ExpenseCategory[] = ['Food', 'Transit', 'Groceries', 'Micro-Leak', 'Shopping', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const participants = isSplit && selectedMembers.length > 0 ? selectedMembers : [currentUser.id];
    const perPerson = numAmount / participants.length;

    addExpense({
      title: title.trim() || 'Cash Expense',
      amount: numAmount,
      category,
      paymentRail: 'CASH',
      payerId: currentUser.id,
      splitMethod: 'EQUAL',
      status: isSplit ? 'pending' : 'settled',
      isMicroLeak: numAmount <= 200,
      splits: participants.map((id) => ({
        memberId: id,
        amount: Number(perPerson.toFixed(2)),
        percentage: Number(((1 / participants.length) * 100).toFixed(1)),
        isSettled: id === currentUser.id,
      })),
      notes: 'Logged via Quick Cash Sheet',
    });

    setAmount('');
    setTitle('');
    setIsSplit(false);
    onClose();
  };

  const toggleMember = (id: string) => {
    if (selectedMembers.includes(id)) {
      if (selectedMembers.length > 1) {
        setSelectedMembers(selectedMembers.filter((m) => m !== id));
      }
    } else {
      setSelectedMembers([...selectedMembers, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface-container-high rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Record Cash Expense
              </h3>
              <span className="text-[11px] font-mono text-secondary">
                Physical Cash-in-Hand Ledger
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {/* Amount Input */}
          <div className="flex flex-col space-y-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Amount Spent
            </label>
            <div className="flex items-center bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 focus-within:border-secondary transition-colors">
              <span className="font-mono text-2xl text-secondary font-bold">₹</span>
              <input
                autoFocus
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-transparent font-mono text-2xl text-on-surface ml-2 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Note or Merchant */}
          <div className="flex flex-col space-y-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Note or Merchant
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chai Tapri, Auto Fare, Snacks, Groceries"
              className="w-full bg-surface-container-lowest px-4 py-3 rounded-xl text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:outline-none placeholder:text-outline"
              required
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-col space-y-1.5">
            <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === cat
                      ? 'bg-secondary text-surface font-bold shadow-sm'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Split with Friends toggle */}
          <div className="p-3 rounded-xl bg-surface-container-lowest flex flex-col gap-2.5 border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">group</span>
                <span className="text-xs text-on-surface font-semibold">Split this cash payment?</span>
              </div>
              <input
                type="checkbox"
                checked={isSplit}
                onChange={(e) => setIsSplit(e.target.checked)}
                className="w-4 h-4 rounded text-secondary focus:ring-secondary cursor-pointer"
              />
            </div>

            {isSplit && (
              <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-on-surface-variant">Select participants:</span>
                <div className="flex flex-wrap gap-1.5">
                  {users.map((u) => {
                    const isSelected = selectedMembers.includes(u.id);
                    return (
                      <button
                        type="button"
                        key={u.id}
                        onClick={() => toggleMember(u.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        <img src={u.avatar} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                        <span>{u.name.split(' ')[0]}</span>
                        {isSelected && <span className="text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full h-12 bg-secondary-container hover:bg-secondary text-on-secondary-container font-headline-sm text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>Save Cash Expense to Ledger</span>
          </button>
        </form>
      </div>
    </div>
  );
};
