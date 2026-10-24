import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseItem, SplitMethod, User } from '../../types';
import { calculateEqualSplit, calculateItemizedSplit, formatINR } from '../../utils/math';
import { generateWhatsAppGroupSummary, generateWhatsAppPersonalMessage, openWhatsApp } from '../../utils/whatsapp';

export const ItemizedSplitCalculator: React.FC = () => {
  const {
    selectedExpenseForSplit,
    expenses,
    users,
    currentUser,
    updateExpense,
    settleExpenseShare,
    setActiveTab,
  } = useApp();

  // If no expense selected, pick the first one
  const activeExpense = selectedExpenseForSplit || expenses[0];

  const [splitMode, setSplitMode] = useState<SplitMethod>(
    activeExpense?.splitMethod || 'ITEMIZED'
  );

  // Sub-mode under custom: 'EXACT' | 'PERCENTAGE' | 'ITEMIZED'
  const [customType, setCustomType] = useState<'EXACT' | 'PERCENTAGE' | 'ITEMIZED'>('ITEMIZED');

  // WhatsApp target recipient: 'group' or specific userId
  const [targetRecipientId, setTargetRecipientId] = useState<string>('user-rahul');
  const [copiedToast, setCopiedToast] = useState(false);

  // Editable items state
  const [items, setItems] = useState<ExpenseItem[]>(
    activeExpense?.items && activeExpense.items.length > 0
      ? activeExpense.items
      : [
          {
            id: 'item-1',
            name: 'Butter Chicken + Naan',
            price: 420,
            quantity: 1,
            assignedMemberIds: ['user-rahul'],
          },
          {
            id: 'item-2',
            name: 'Paneer Tikka Platter',
            price: 280,
            quantity: 1,
            assignedMemberIds: ['user-ananya'],
          },
          {
            id: 'item-3',
            name: 'Hyderabadi Biryani + Beverage',
            price: 240,
            quantity: 1,
            assignedMemberIds: ['user-siddharth'],
          },
          {
            id: 'item-4',
            name: 'Dal Makhani & Roti',
            price: 180,
            quantity: 1,
            assignedMemberIds: [currentUser.id],
          },
        ]
  );

  const [tax, setTax] = useState<number>(activeExpense?.tax ?? 80);
  const [tip, setTip] = useState<number>(activeExpense?.tip ?? 0);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // All participants in this bill
  const participantIds = useMemo(() => {
    if (activeExpense?.splits && activeExpense.splits.length > 0) {
      return activeExpense.splits.map((s) => s.memberId);
    }
    return [currentUser.id, 'user-rahul', 'user-ananya', 'user-siddharth'];
  }, [activeExpense, currentUser.id]);

  // Recalculate itemized split with proportional tax
  const calculation = useMemo(() => {
    return calculateItemizedSplit(
      items,
      tax,
      tip,
      0,
      participantIds,
      activeExpense?.payerId || currentUser.id
    );
  }, [items, tax, tip, participantIds, activeExpense, currentUser.id]);

  // Handle dish assignment toggle
  const toggleItemMember = (itemId: string, memberId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.assignedMemberIds.includes(memberId);
        const newAssigned = exists
          ? item.assignedMemberIds.filter((id) => id !== memberId)
          : [...item.assignedMemberIds, memberId];
        return {
          ...item,
          assignedMemberIds: newAssigned.length > 0 ? newAssigned : [memberId],
        };
      })
    );
  };

  // Add new dish item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(newItemPrice);
    if (!newItemName.trim() || isNaN(p) || p <= 0) return;

    const newItem: ExpenseItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      price: p,
      quantity: 1,
      assignedMemberIds: [currentUser.id],
    };

    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemPrice('');
  };

  // Delete dish item
  const handleDeleteItem = (itemId: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((i) => i.id !== itemId));
  };

  // Nudge participant share
  const handleNudge = (memberId: string, deltaPercent: number) => {
    // Fine-tune by adjusting split percentage
    const currentSplit = calculation.splits.find((s) => s.memberId === memberId);
    if (!currentSplit) return;
    const newPct = Math.max(5, (currentSplit.percentage || 0) + deltaPercent);
    const newAmt = Number(((newPct / 100) * calculation.total).toFixed(2));

    const updatedSplits = calculation.splits.map((s) =>
      s.memberId === memberId ? { ...s, amount: newAmt, percentage: newPct } : s
    );

    updateExpense(activeExpense.id, {
      splits: updatedSplits,
      splitMethod: 'EXACT',
    });
  };

  // WhatsApp Message Preview
  const recipientUser = users.find((u) => u.id === targetRecipientId) || users[1];
  const payerUser = users.find((u) => u.id === activeExpense.payerId) || currentUser;

  const currentRecipientSplit = calculation.splits.find(
    (s) => s.memberId === recipientUser.id
  );

  // Assigned items note for WhatsApp
  const recipientItemsNote = items
    .filter((i) => i.assignedMemberIds.includes(recipientUser.id))
    .map((i) => i.name)
    .join(', ');

  const previewMessage = useMemo(() => {
    if (targetRecipientId === 'group') {
      return generateWhatsAppGroupSummary(
        { ...activeExpense, splits: calculation.splits, items, tax, tip },
        payerUser,
        users
      );
    }
    return generateWhatsAppPersonalMessage(
      activeExpense,
      recipientUser,
      payerUser,
      currentRecipientSplit?.amount,
      recipientItemsNote ? `${recipientItemsNote} + taxes` : undefined
    );
  }, [
    targetRecipientId,
    activeExpense,
    calculation.splits,
    items,
    tax,
    tip,
    payerUser,
    users,
    recipientUser,
    currentRecipientSplit,
    recipientItemsNote,
  ]);

  const handleDispatchWhatsApp = () => {
    if (targetRecipientId === 'group') {
      openWhatsApp(previewMessage);
    } else {
      openWhatsApp(recipientUser.phone || '', previewMessage);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(previewMessage);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const unpaidCount = calculation.splits.filter((s) => !s.isSettled).length;

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto pb-16 space-y-4">
      {/* Top Navigation & Title Bar matching Stitch */}
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            aria-label="Go Back"
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface hover:text-secondary transition-colors active:scale-95 shadow-sm border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="font-headline-md text-lg sm:text-xl text-on-surface tracking-tight font-bold">
              Split Bill & Send Reminder
            </h1>
            <span className="font-mono text-xs text-on-surface-variant">
              Instant WhatsApp UPI Settlement
            </span>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('dashboard')}
          aria-label="Close"
          className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors active:scale-95 shadow-sm border border-outline-variant/30"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Selected Transaction Context Card matching Stitch */}
      <div className="bg-surface-container rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-lg border border-outline-variant/20">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-tertiary-container shrink-0 shadow-inner border border-outline-variant/30">
            <span className="material-symbols-outlined text-[26px]">restaurant</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-base text-on-surface font-bold truncate">
                {activeExpense.title}
              </span>
              <span className="font-mono text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded font-semibold">
                {activeExpense.paymentRail}
              </span>
            </div>
            <span className="text-xs text-on-surface-variant truncate mt-0.5">
              Paid by {payerUser.name} via {activeExpense.upiAccount || 'Cash'} •{' '}
              {new Date(activeExpense.date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0 pl-3">
          <span className="font-mono text-lg sm:text-xl text-on-surface font-bold tracking-tight">
            {formatINR(calculation.total)}
          </span>
          <span className="block font-mono text-[10px] text-secondary font-bold text-right uppercase mt-0.5">
            {activeExpense.status === 'settled' ? 'SETTLED' : 'ACTIVE'}
          </span>
        </div>
      </div>

      {/* Split Calculator & Mode Selector */}
      <div className="flex flex-col gap-2">
        {/* Top Split Method Switcher */}
        <div className="bg-surface-container-lowest p-1 rounded-xl flex gap-1 shadow-inner border border-outline-variant/20">
          <button
            onClick={() => setSplitMode('EQUAL')}
            className={`font-mono text-xs py-2 px-3 rounded-lg flex-1 text-center font-semibold transition-all ${
              splitMode === 'EQUAL'
                ? 'bg-secondary-container text-on-secondary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Split Equally ({participantIds.length} People)
          </button>
          <button
            onClick={() => setSplitMode('ITEMIZED')}
            className={`font-mono text-xs py-2 px-3 rounded-lg flex-1 text-center font-semibold transition-all flex items-center justify-center gap-1.5 ${
              splitMode === 'ITEMIZED'
                ? 'bg-secondary-container text-on-secondary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Custom / Itemized</span>
          </button>
        </div>

        {/* Sub-mode selector if Custom */}
        {splitMode === 'ITEMIZED' && (
          <div className="bg-surface-container p-1 rounded-lg flex gap-1 text-xs font-mono shadow-sm border border-outline-variant/20">
            <button
              onClick={() => setCustomType('ITEMIZED')}
              className={`flex-1 py-1.5 px-2 text-center rounded transition-all flex items-center justify-center gap-1 text-[11px] font-semibold ${
                customType === 'ITEMIZED'
                  ? 'bg-secondary-container text-on-secondary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">restaurant_menu</span>
              <span>Itemized Dishes</span>
            </button>
            <button
              onClick={() => setCustomType('EXACT')}
              className={`flex-1 py-1.5 px-2 text-center rounded transition-all flex items-center justify-center gap-1 text-[11px] font-semibold ${
                customType === 'EXACT'
                  ? 'bg-secondary-container text-on-secondary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">currency_rupee</span>
              <span>Exact (₹)</span>
            </button>
            <button
              onClick={() => setCustomType('PERCENTAGE')}
              className={`flex-1 py-1.5 px-2 text-center rounded transition-all flex items-center justify-center gap-1 text-[11px] font-semibold ${
                customType === 'PERCENTAGE'
                  ? 'bg-secondary-container text-on-secondary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">percent</span>
              <span>Percentage (%)</span>
            </button>
          </div>
        )}
      </div>

      {/* Per-Person Calculation Highlight Banner with Segmented Bar matching Stitch */}
      <div className="relative overflow-hidden bg-surface-container-high rounded-2xl p-4 sm:p-5 shadow-lg border border-outline-variant/30">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Split Allocation Tracker
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-2xl font-bold text-secondary">
                {formatINR(calculation.total)}
              </span>
              <span className="text-xs text-on-surface-variant font-mono">
                of {formatINR(calculation.total)} (100%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary-container/20 text-secondary text-xs font-mono font-bold border border-secondary/30 shadow-sm">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Fully Balanced</span>
          </div>
        </div>

        {/* Multi-Segmented sleek progress bar */}
        <div className="w-full bg-surface-container-lowest h-3 rounded-full overflow-hidden flex gap-0.5 mb-2.5 p-0.5">
          {calculation.splits.map((s, idx) => {
            const colors = ['bg-secondary', 'bg-primary', 'bg-secondary-container', 'bg-outline'];
            const colorClass = colors[idx % colors.length];
            const member = users.find((u) => u.id === s.memberId);
            return (
              <div
                key={s.memberId}
                className={`${colorClass} h-full rounded-full transition-all duration-300`}
                style={{ width: `${s.percentage || 25}%` }}
                title={`${member?.name || s.memberId}: ${formatINR(s.amount)} (${s.percentage}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-mono flex-wrap gap-1">
          {calculation.splits.map((s, idx) => {
            const dotColors = ['bg-secondary', 'bg-primary', 'bg-secondary-container', 'bg-outline'];
            const user = users.find((u) => u.id === s.memberId);
            const name = user?.id === currentUser.id ? 'You' : user?.name.split(' ')[0] || s.memberId;
            return (
              <span key={s.memberId} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${dotColors[idx % dotColors.length]}`} />
                <span>
                  {name} {s.percentage}%
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Itemized Receipt Breakdown matching Stitch */}
      {splitMode === 'ITEMIZED' && customType === 'ITEMIZED' && (
        <div className="bg-surface-container rounded-2xl p-4 sm:p-5 shadow-md border border-outline-variant/30 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">
                receipt_long
              </span>
              <span className="font-headline-sm text-sm text-on-surface font-bold">
                Itemized Receipt Breakdown
              </span>
            </div>
            <span className="font-mono text-[10px] text-secondary bg-secondary/10 px-2 py-0.5 rounded font-bold">
              Subtotal: {formatINR(calculation.subtotal)}
            </span>
          </div>

          {/* Dish items list */}
          <div className="flex flex-col gap-2">
            {items.map((item, idx) => {
              const dotColors = ['bg-secondary', 'bg-primary', 'bg-secondary-container', 'bg-outline'];
              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        dotColors[idx % dotColors.length]
                      }`}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-on-surface font-semibold truncate">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-secondary">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>

                  {/* Assignees avatars / chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-on-surface-variant mr-1">
                      Assigned to:
                    </span>
                    {users
                      .filter((u) => participantIds.includes(u.id))
                      .map((u) => {
                        const isAssigned = item.assignedMemberIds.includes(u.id);
                        return (
                          <button
                            type="button"
                            key={u.id}
                            onClick={() => toggleItemMember(item.id, u.id)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all ${
                              isAssigned
                                ? 'bg-secondary text-surface shadow-sm'
                                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            {u.id === currentUser.id ? 'You' : u.name.split(' ')[0]}
                          </button>
                        );
                      })}
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-on-surface-variant hover:text-error ml-1 p-1"
                      title="Remove dish"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add dish inline form */}
          <form onSubmit={handleAddItem} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Add another dish (e.g. Masala Dosa)"
              className="flex-1 h-9 px-3 rounded-xl bg-surface-container-lowest text-xs text-on-surface border border-outline-variant/30 focus:border-secondary focus:outline-none"
            />
            <div className="flex items-center bg-surface-container-lowest px-2 h-9 rounded-xl border border-outline-variant/30 w-24">
              <span className="font-mono text-xs text-secondary">₹</span>
              <input
                type="number"
                step="any"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent font-mono text-xs text-on-surface ml-1 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-9 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-secondary text-xs font-mono font-bold flex items-center gap-1 border border-secondary/30"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add</span>
            </button>
          </form>

          {/* Proportional Tax & Delivery Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-outline-variant/20 text-xs text-on-surface-variant gap-2">
            <div className="flex items-center gap-2">
              <span>Taxes, GST & Packaging:</span>
              <div className="flex items-center bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/30 w-20">
                <span className="font-mono text-xs text-secondary">₹</span>
                <input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-mono text-xs text-on-surface ml-1 focus:outline-none"
                />
              </div>
            </div>
            <span className="font-mono text-secondary text-[11px]">
              Split proportionally based on dish total share
            </span>
          </div>
        </div>
      )}

      {/* Participant Selection List matching Stitch */}
      <div className="flex flex-col space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-headline-sm text-sm text-on-surface font-bold">
            Participants ({participantIds.length})
          </span>
          <span className="font-mono text-xs text-primary cursor-pointer hover:underline font-semibold">
            + Add Split Member
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {calculation.splits.map((s) => {
            const user = users.find((u) => u.id === s.memberId);
            if (!user) return null;
            const isCurrentUser = user.id === currentUser.id;
            const isHost = activeExpense.payerId === user.id;

            // Dishes assigned to this user
            const userDishes = items
              .filter((i) => i.assignedMemberIds.includes(user.id))
              .map((i) => i.name)
              .join(' + ');

            const userSubtotal = calculation.memberSubtotals[user.id] || 0;
            const userTax = calculation.memberTaxes[user.id] || 0;

            return (
              <div
                key={user.id}
                className="bg-surface-container rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm border border-outline-variant/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover shadow"
                      />
                      {s.isSettled && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary-container text-on-secondary rounded-full flex items-center justify-center text-[10px]">
                          <span className="material-symbols-outlined text-[10px]">check</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-headline-sm text-sm text-on-surface font-bold truncate">
                          {isCurrentUser ? 'You' : user.name}
                        </span>
                        {isHost && (
                          <span className="font-mono text-[10px] text-secondary-container bg-surface-container-high px-1.5 py-0.2 rounded font-bold">
                            Host
                          </span>
                        )}
                        <span
                          className={`font-mono text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            s.isSettled
                              ? 'bg-secondary/15 text-secondary'
                              : 'bg-tertiary-container/20 text-tertiary'
                          }`}
                        >
                          {s.isSettled ? 'PAID' : 'UNPAID'}
                        </span>
                      </div>
                      <span className="text-xs text-on-surface-variant truncate mt-0.5">
                        {userDishes || 'Equal share'} (+taxes)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-base font-bold text-on-surface">
                          {formatINR(s.amount)}
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant px-1 rounded bg-surface-container-high font-semibold">
                          {s.percentage}%
                        </span>
                      </div>
                      <span className="block font-mono text-[10px] text-secondary text-right font-bold">
                        {isHost ? 'PAID VIA HDFC' : s.isSettled ? 'SETTLED' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub row with dish breakdown and fine tune nudge buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-mono">
                    <span className="material-symbols-outlined text-[14px] text-secondary">
                      fastfood
                    </span>
                    <span>
                      Dish ({formatINR(userSubtotal, false)}) + Tax ({formatINR(userTax, false)})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleNudge(user.id, -5)}
                      className="w-7 h-7 rounded bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-on-surface font-mono font-bold text-xs transition-colors"
                      title="Nudge share down 5%"
                    >
                      -5%
                    </button>
                    <button
                      onClick={() => handleNudge(user.id, 5)}
                      className="w-7 h-7 rounded bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-on-surface font-mono font-bold text-xs transition-colors"
                      title="Nudge share up 5%"
                    >
                      +5%
                    </button>

                    {!s.isSettled && (
                      <button
                        onClick={() => settleExpenseShare(activeExpense.id, user.id)}
                        className="px-2 py-1 rounded bg-secondary/15 hover:bg-secondary/25 text-secondary text-[11px] font-mono font-bold transition-all ml-1"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WhatsApp Message Preview Section matching Stitch */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-secondary">
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider">
              WhatsApp Message Preview
            </span>
          </div>

          {/* Target recipient selector */}
          <div className="flex items-center gap-1 bg-surface-container px-2.5 py-1 rounded-lg text-xs font-mono border border-outline-variant/30">
            <span className="text-on-surface-variant">Send to:</span>
            <select
              value={targetRecipientId}
              onChange={(e) => setTargetRecipientId(e.target.value)}
              className="bg-transparent text-secondary font-bold focus:outline-none cursor-pointer"
            >
              <option value="group" className="bg-surface-container text-on-surface">
                Group Summary (All Members)
              </option>
              {users
                .filter((u) => u.id !== currentUser.id && participantIds.includes(u.id))
                .map((u) => {
                  const share = calculation.splits.find((s) => s.memberId === u.id)?.amount || 0;
                  return (
                    <option key={u.id} value={u.id} className="bg-surface-container text-on-surface">
                      {u.name} ({formatINR(share, false)})
                    </option>
                  );
                })}
            </select>
          </div>
        </div>

        {/* Chat Bubble Mockup with authentic tail indicator */}
        <div className="relative bg-surface-container-lowest rounded-2xl rounded-tl-sm p-4 shadow-xl border border-outline-variant/20">
          <div className="absolute -top-1.5 left-2 w-3 h-3 bg-surface-container-lowest rotate-45 transform origin-bottom-left border-l border-t border-outline-variant/20" />

          <div className="flex items-start gap-2.5 mb-2">
            <div className="w-6 h-6 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">payments</span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface leading-relaxed whitespace-pre-line font-sans">
              {previewMessage}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15 text-on-surface-variant">
            <span className="font-mono text-[11px] text-primary flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
              <span>Proportional mathematical equity guaranteed</span>
            </span>

            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span>10:42 PM</span>
              <span
                className="material-symbols-outlined text-[16px] text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                done_all
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Copy notification */}
      {copiedToast && (
        <div className="p-2.5 rounded-xl bg-secondary/15 text-secondary text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Message and UPI link copied to clipboard!</span>
        </div>
      )}

      {/* Primary WhatsApp Dispatch CTAs */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <button
          onClick={handleDispatchWhatsApp}
          className="flex-1 py-3.5 px-4 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-xl active:scale-98 transition-all"
        >
          <span className="material-symbols-outlined text-[22px]">send</span>
          <span>
            Dispatch WhatsApp Reminder ({unpaidCount} Unpaid)
          </span>
        </button>

        <button
          onClick={handleCopyMessage}
          className="py-3.5 px-4 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline-sm text-sm font-bold flex items-center justify-center gap-2 active:scale-98 transition-all border border-outline-variant/30"
        >
          <span className="material-symbols-outlined text-[20px]">content_copy</span>
          <span>Copy Text</span>
        </button>
      </div>

      <p className="text-center text-xs text-on-surface-variant font-mono">
        Directly opens WhatsApp chat with pre-filled message, breakdown, and UPI deep link.
      </p>
    </div>
  );
};
