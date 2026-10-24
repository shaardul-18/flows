import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/math';
import { openWhatsApp } from '../../utils/whatsapp';

export const DebtSettlementView: React.FC = () => {
  const {
    currentUser,
    users,
    peerBalances,
    simplifiedDebts,
    recordSettlement,
    settlements,
  } = useApp();

  const [settledSuccessToast, setSettledSuccessToast] = useState<string | null>(null);
  const [selectedUpiFriend, setSelectedUpiFriend] = useState<string | null>(null);

  const handleMarkSettled = (fromId: string, toId: string, amount: number) => {
    const fromUser = users.find((u) => u.id === fromId);
    const toUser = users.find((u) => u.id === toId);

    recordSettlement({
      fromMemberId: fromId,
      toMemberId: toId,
      amount,
      paymentRail: 'UPI',
      upiReference: `UPI-${Date.now().toString().slice(-6)}`,
      notes: 'Settled via Flows Debt Simplification Engine',
      isConfirmed: true,
    });

    const msg = `${fromUser?.name || 'Friend'} settled ${formatINR(amount)} with ${toUser?.name || 'Friend'}!`;
    setSettledSuccessToast(msg);
    setTimeout(() => setSettledSuccessToast(null), 3000);
  };

  const handleWhatsAppNudge = (friendId: string, amount: number) => {
    const friend = users.find((u) => u.id === friendId);
    if (!friend) return;
    const text = `Hey ${friend.name.split(' ')[0]}! According to our Flows split ledger, your balance settlement is ${formatINR(amount)}. Please UPI me at ${currentUser.upiId} when convenient! Cheers!`;
    openWhatsApp(friend.phone || '', text);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto pb-16 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <div className="flex flex-col">
          <h1 className="font-headline-md text-xl sm:text-2xl text-on-surface font-bold">
            Debt Simplification & Settlements
          </h1>
          <span className="font-mono text-xs text-secondary font-semibold">
            Graph Reduction Engine • Minimum Necessary Transfers
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-secondary border border-secondary/20">
          <span className="material-symbols-outlined text-[16px]">account_tree</span>
          <span className="font-mono text-xs font-bold">Optimized</span>
        </div>
      </div>

      {/* Success Banner */}
      {settledSuccessToast && (
        <div className="p-3 rounded-2xl bg-secondary/20 border border-secondary text-secondary text-sm font-semibold flex items-center gap-2.5 animate-in fade-in duration-300">
          <span className="material-symbols-outlined text-[22px]">celebration</span>
          <span>{settledSuccessToast}</span>
        </div>
      )}

      {/* Debt Simplification Highlight Card */}
      <section className="relative overflow-hidden rounded-2xl bg-surface-container p-5 shadow-xl border border-outline-variant/30">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-secondary/10 blur-2xl pointer-events-none" />
        <div className="flex items-start justify-between relative z-10">
          <div className="flex flex-col">
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
              Simplified Settlement Flow
            </span>
            <h2 className="font-headline-sm text-base sm:text-lg text-on-surface font-bold mt-0.5">
              Optimized to {simplifiedDebts.length} Transfers
            </h2>
            <p className="text-xs text-on-surface-variant mt-1 max-w-lg">
              Instead of each person making multiple cross-payments, our graph algorithm cancels out redundant peer debts to achieve full equity with the fewest physical transactions.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center text-secondary border border-secondary/30 shrink-0">
            <span className="material-symbols-outlined text-[28px]">hub</span>
          </div>
        </div>

        {/* Simplified Debt Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {simplifiedDebts.length === 0 ? (
            <div className="col-span-2 p-6 rounded-xl bg-surface-container-low text-center text-on-surface-variant text-sm font-mono">
              🎉 All debts are fully settled! No outstanding balances.
            </div>
          ) : (
            simplifiedDebts.map((debt, idx) => {
              const fromUser = users.find((u) => u.id === debt.fromMemberId);
              const toUser = users.find((u) => u.id === debt.toMemberId);
              const isCurrentUserDebtor = debt.fromMemberId === currentUser.id;
              const isCurrentUserCreditor = debt.toMemberId === currentUser.id;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                    isCurrentUserDebtor
                      ? 'bg-tertiary-container/10 border-tertiary/30'
                      : isCurrentUserCreditor
                      ? 'bg-secondary/10 border-secondary/30'
                      : 'bg-surface-container-high border-outline-variant/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={fromUser?.avatar}
                        alt={fromUser?.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-xs font-bold text-on-surface">
                        {isCurrentUserDebtor ? 'You' : fromUser?.name.split(' ')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <span className="text-[11px] font-mono">pays</span>
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        arrow_forward
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <img
                        src={toUser?.avatar}
                        alt={toUser?.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-xs font-bold text-on-surface">
                        {isCurrentUserCreditor ? 'You' : toUser?.name.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20">
                    <div>
                      <span className="font-mono text-lg font-bold text-on-surface">
                        {formatINR(debt.amount)}
                      </span>
                      <span className="block text-[10px] font-mono text-on-surface-variant">
                        via UPI or Cash
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          handleMarkSettled(debt.fromMemberId, debt.toMemberId, debt.amount)
                        }
                        className="px-3 py-1.5 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary text-xs font-mono font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        <span>Settle</span>
                      </button>

                      {isCurrentUserCreditor && (
                        <button
                          onClick={() => handleWhatsAppNudge(debt.fromMemberId, debt.amount)}
                          className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-secondary hover:bg-surface-bright transition-colors"
                          title="Send WhatsApp Nudge"
                        >
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Individual Friend Balance Cards */}
      <section className="bg-surface-container rounded-2xl p-4 sm:p-5 shadow-lg border border-outline-variant/30 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">contacts</span>
            <h2 className="font-headline-sm text-sm sm:text-base text-on-surface font-bold">
              Individual Friend Ledgers
            </h2>
          </div>
          <span className="font-mono text-xs text-on-surface-variant">Real-time bilateral status</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {users
            .filter((u) => u.id !== currentUser.id)
            .map((friend) => {
              const balance = peerBalances[friend.id] || 0; // >0: friend owes currentUser, <0: currentUser owes friend
              const isOwed = balance > 0;
              const owes = balance < 0;

              return (
                <div
                  key={friend.id}
                  className="p-3.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/20 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-on-surface truncate">
                        {friend.name}
                      </span>
                      <span className="text-xs font-mono text-on-surface-variant truncate">
                        {friend.upiId}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`font-mono text-[10px] font-bold ${
                            isOwed
                              ? 'text-secondary'
                              : owes
                              ? 'text-tertiary'
                              : 'text-on-surface-variant'
                          }`}
                        >
                          {isOwed
                            ? `Owes you ${formatINR(balance)}`
                            : owes
                            ? `You owe ${formatINR(Math.abs(balance))}`
                            : 'All settled up'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {Math.abs(balance) > 0 && (
                      <button
                        onClick={() =>
                          isOwed
                            ? handleMarkSettled(friend.id, currentUser.id, balance)
                            : handleMarkSettled(currentUser.id, friend.id, Math.abs(balance))
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-bright text-xs font-mono font-bold text-secondary border border-secondary/30 transition-all"
                      >
                        Settle
                      </button>
                    )}

                    {isOwed && (
                      <button
                        onClick={() => handleWhatsAppNudge(friend.id, balance)}
                        className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary hover:bg-surface-bright transition-colors"
                        title="Send WhatsApp Reminder"
                      >
                        <span className="material-symbols-outlined text-[16px]">send</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Past Settlement Audit Log */}
      <section className="bg-surface-container rounded-2xl p-4 sm:p-5 shadow-lg border border-outline-variant/30 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">verified</span>
            <h2 className="font-headline-sm text-sm sm:text-base text-on-surface font-bold">
              Settlement History & Audit Trail
            </h2>
          </div>
          <span className="font-mono text-xs text-on-surface-variant">
            {settlements.length} verified transactions
          </span>
        </div>

        <div className="flex flex-col space-y-2">
          {settlements.map((s) => {
            const fromUser = users.find((u) => u.id === s.fromMemberId)?.name || s.fromMemberId;
            const toUser = users.find((u) => u.id === s.toMemberId)?.name || s.toMemberId;

            return (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">done_all</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm text-on-surface font-semibold">
                      {fromUser} paid {toUser}
                    </span>
                    <span className="text-[11px] font-mono text-on-surface-variant">
                      {new Date(s.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {s.upiReference || s.paymentRail}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-sm sm:text-base font-bold text-secondary">
                    {formatINR(s.amount)}
                  </span>
                  <span className="block text-[10px] font-mono text-secondary font-bold uppercase">
                    CONFIRMED
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
