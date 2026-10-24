import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, PaymentRail, SplitMethod, SplitParticipant } from '../../types';
import { calculateEqualSplit, formatINR } from '../../utils/math';

interface CreateSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateSplitModal: React.FC<CreateSplitModalProps> = ({ isOpen, onClose }) => {
  const { addExpense, currentUser, users, groups, setSelectedExpenseForSplit, setActiveTab } = useApp();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Dining');
  const [paymentRail, setPaymentRail] = useState<PaymentRail>('UPI');
  const [upiAccount, setUpiAccount] = useState('HDFC UPI');
  const [payerId, setPayerId] = useState(currentUser.id);
  const [groupId, setGroupId] = useState<string>('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('EQUAL');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    users.slice(0, 4).map((u) => u.id)
  );

  // Exact split custom inputs
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  // Percentage split custom inputs
  const [percentages, setPercentages] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const categories: ExpenseCategory[] = ['Dining', 'Food', 'Transit', 'Groceries', 'Travel', 'Rent', 'Utilities', 'Shopping'];

  const toggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      if (selectedMemberIds.length > 1) {
        setSelectedMemberIds(selectedMemberIds.filter((m) => m !== id));
      }
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const handleGroupSelect = (gId: string) => {
    setGroupId(gId);
    if (gId) {
      const g = groups.find((grp) => grp.id === gId);
      if (g) setSelectedMemberIds(g.memberIds);
    }
  };

  const numAmount = parseFloat(amount) || 0;

  // Validation
  let isValid = numAmount > 0 && title.trim().length > 0 && selectedMemberIds.length > 0;
  let exactTotal = 0;
  let percentTotal = 0;

  if (splitMethod === 'EXACT') {
    exactTotal = selectedMemberIds.reduce((sum, id) => sum + (parseFloat(exactAmounts[id] || '0') || 0), 0);
    isValid = isValid && Math.abs(exactTotal - numAmount) < 0.05;
  } else if (splitMethod === 'PERCENTAGE') {
    percentTotal = selectedMemberIds.reduce((sum, id) => sum + (parseFloat(percentages[id] || '0') || 0), 0);
    isValid = isValid && Math.abs(percentTotal - 100) < 0.1;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    let splits: SplitParticipant[] = [];

    if (splitMethod === 'EQUAL') {
      splits = calculateEqualSplit(numAmount, selectedMemberIds, payerId);
    } else if (splitMethod === 'EXACT') {
      splits = selectedMemberIds.map((id) => {
        const val = parseFloat(exactAmounts[id] || '0') || 0;
        return {
          memberId: id,
          amount: val,
          percentage: numAmount > 0 ? Number(((val / numAmount) * 100).toFixed(1)) : 0,
          isSettled: id === payerId,
        };
      });
    } else if (splitMethod === 'PERCENTAGE') {
      splits = selectedMemberIds.map((id) => {
        const pct = parseFloat(percentages[id] || '0') || 0;
        const val = Number(((pct / 100) * numAmount).toFixed(2));
        return {
          memberId: id,
          amount: val,
          percentage: pct,
          isSettled: id === payerId,
        };
      });
    }

    const created = addExpense({
      title: title.trim(),
      amount: numAmount,
      category,
      paymentRail,
      upiAccount: paymentRail === 'UPI' ? upiAccount : undefined,
      payerId,
      groupId: groupId || undefined,
      splitMethod,
      status: 'pending',
      splits,
      notes: `Split via ${splitMethod} across ${selectedMemberIds.length} friends`,
    });

    onClose();
    setSelectedExpenseForSplit(created);
    setActiveTab('splits');
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-surface-container-high rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl border border-outline-variant/30 flex flex-col space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">group_add</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                New Split Expense
              </h3>
              <span className="text-[11px] font-mono text-primary">
                Instant Settlement & WhatsApp Engine
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
          {/* Title & Amount Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="font-mono text-xs text-on-surface-variant uppercase font-semibold">
                Expense Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Swiggy Dinner, Groceries, Villa"
                className="w-full bg-surface-container-lowest px-4 py-2.5 rounded-xl text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:outline-none placeholder:text-outline"
                required
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="font-mono text-xs text-on-surface-variant uppercase font-semibold">
                Total Bill Amount (₹)
              </label>
              <div className="flex items-center bg-surface-container-lowest px-3 py-2 rounded-xl border border-outline-variant/30 focus-within:border-secondary">
                <span className="font-mono text-lg text-secondary font-bold">₹</span>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent font-mono text-lg text-on-surface ml-2 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Group and Payer Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="font-mono text-xs text-on-surface-variant uppercase font-semibold">
                Group (Optional)
              </label>
              <select
                value={groupId}
                onChange={(e) => handleGroupSelect(e.target.value)}
                className="w-full bg-surface-container-lowest px-3 py-2.5 rounded-xl text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:outline-none"
              >
                <option value="">Non-Group (Individual Friends)</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.memberIds.length} members)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="font-mono text-xs text-on-surface-variant uppercase font-semibold">
                Paid By
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full bg-surface-container-lowest px-3 py-2.5 rounded-xl text-sm text-on-surface border border-outline-variant/30 focus:border-secondary focus:outline-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.id === currentUser.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Rail & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col space-y-1">
              <label className="font-mono text-xs text-on-surface-variant uppercase font-semibold">
                Payment Rail
              </label>
              <div className="flex gap-2">
                {(['UPI', 'CASH', 'CARD'] as PaymentRail[]).map((rail) => (
                  <button
                    type="button"
                    key={rail}
                    onClick={() => setPaymentRail(rail)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                      paymentRail === rail
                        ? 'bg-secondary text-surface shadow-sm'
                        : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {rail}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="font-mono text-xs text-on-surface-variant uppercase font-semibold">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-surface-container-lowest px-3 py-2 rounded-xl text-sm text-on-surface border border-outline-variant/30 focus:border-primary focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Method Tabs */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs text-on-surface-variant uppercase font-semibold">
                Split Method
              </label>
              <span className="font-mono text-[10px] text-secondary">
                {splitMethod === 'EQUAL' && 'Equally Divided'}
                {splitMethod === 'EXACT' && `Sum: ${formatINR(exactTotal)} of ${formatINR(numAmount)}`}
                {splitMethod === 'PERCENTAGE' && `Total: ${percentTotal}% of 100%`}
              </span>
            </div>

            <div className="bg-surface-container-lowest p-1 rounded-xl flex gap-1 border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setSplitMethod('EQUAL')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  splitMethod === 'EQUAL'
                    ? 'bg-secondary-container text-on-secondary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Split Equally
              </button>
              <button
                type="button"
                onClick={() => setSplitMethod('EXACT')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  splitMethod === 'EXACT'
                    ? 'bg-secondary-container text-on-secondary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Exact (₹)
              </button>
              <button
                type="button"
                onClick={() => setSplitMethod('PERCENTAGE')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  splitMethod === 'PERCENTAGE'
                    ? 'bg-secondary-container text-on-secondary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Percentage (%)
              </button>
            </div>
          </div>

          {/* Participants Picker & Custom Values */}
          <div className="flex flex-col space-y-2 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20">
            <span className="font-mono text-[11px] text-on-surface-variant uppercase font-semibold">
              Participants ({selectedMemberIds.length})
            </span>

            <div className="flex flex-col space-y-2">
              {users.map((u) => {
                const isSelected = selectedMemberIds.includes(u.id);
                const equalShare = numAmount > 0 && selectedMemberIds.length > 0
                  ? numAmount / selectedMemberIds.length
                  : 0;

                return (
                  <div
                    key={u.id}
                    className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-surface-container-high border border-outline-variant/30'
                        : 'bg-surface-container/50 opacity-60'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMember(u.id)}
                        className="w-4 h-4 rounded text-secondary focus:ring-secondary cursor-pointer"
                      />
                      <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-on-surface font-semibold truncate">
                          {u.name} {u.id === currentUser.id ? '(You)' : ''}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant">
                          {u.upiId}
                        </span>
                      </div>
                    </label>

                    {isSelected && (
                      <div className="flex items-center gap-2 shrink-0">
                        {splitMethod === 'EQUAL' && (
                          <span className="font-mono text-xs font-bold text-secondary">
                            {formatINR(equalShare)}
                          </span>
                        )}

                        {splitMethod === 'EXACT' && (
                          <div className="flex items-center bg-surface-container-lowest px-2 py-1 rounded-lg border border-outline-variant/30">
                            <span className="text-xs font-mono text-secondary mr-1">₹</span>
                            <input
                              type="number"
                              step="any"
                              value={exactAmounts[u.id] || ''}
                              onChange={(e) =>
                                setExactAmounts({ ...exactAmounts, [u.id]: e.target.value })
                              }
                              placeholder="0"
                              className="w-16 bg-transparent font-mono text-xs text-on-surface focus:outline-none"
                            />
                          </div>
                        )}

                        {splitMethod === 'PERCENTAGE' && (
                          <div className="flex items-center bg-surface-container-lowest px-2 py-1 rounded-lg border border-outline-variant/30">
                            <input
                              type="number"
                              step="any"
                              value={percentages[u.id] || ''}
                              onChange={(e) =>
                                setPercentages({ ...percentages, [u.id]: e.target.value })
                              }
                              placeholder="0"
                              className="w-12 bg-transparent font-mono text-xs text-on-surface focus:outline-none text-right"
                            />
                            <span className="text-xs font-mono text-primary ml-1">%</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid}
            className={`w-full h-12 rounded-xl font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
              isValid
                ? 'bg-secondary-container hover:bg-secondary text-on-secondary active:scale-98'
                : 'bg-surface-container text-on-surface-variant cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
            <span>Create Expense & Generate Splits</span>
          </button>
        </form>
      </div>
    </div>
  );
};
