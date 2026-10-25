import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatINR } from '../../utils/math';

interface TreasurySetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TreasurySetupModal: React.FC<TreasurySetupModalProps> = ({ isOpen, onClose }) => {
  const { treasurySettings, updateTreasurySettings, currentUser, addUser } = useApp();

  const [bankBalance, setBankBalance] = useState<string>('');
  const [cashBalance, setCashBalance] = useState<string>('');
  const [monthlyBudget, setMonthlyBudget] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setBankBalance(treasurySettings.bankBalance ? String(treasurySettings.bankBalance) : '');
      setCashBalance(treasurySettings.cashBalance ? String(treasurySettings.cashBalance) : '');
      setMonthlyBudget(treasurySettings.monthlyBudget ? String(treasurySettings.monthlyBudget) : '');
      setUpiId(treasurySettings.upiId || currentUser.upiId || '');
      setError(null);
    }
  }, [isOpen, treasurySettings, currentUser.upiId]);

  if (!isOpen) return null;

  const numBank = parseFloat(bankBalance) || 0;
  const numCash = parseFloat(cashBalance) || 0;
  const numBudget = parseFloat(monthlyBudget) || 0;
  const totalStarting = numBank + numCash;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (numBank < 0 || numCash < 0 || numBudget < 0) {
      setError('Balances cannot be negative numbers.');
      return;
    }

    updateTreasurySettings({
      bankBalance: numBank,
      cashBalance: numCash,
      monthlyBudget: numBudget,
      upiId: upiId.trim(),
      isSetupComplete: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface-container-high rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border border-outline-variant/30 flex flex-col space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">account_balance</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-base sm:text-lg text-on-surface font-bold">
                Calibrate Treasury Funds
              </h3>
              <span className="text-[11px] font-mono text-secondary">
                Set Real Starting Balances (No Bogus Data)
              </span>
            </div>
          </div>
          {treasurySettings.isSetupComplete && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Please enter your actual financial starting values. Flows calculates your private net worth and expense splits from these real funds.
        </p>

        <form onSubmit={handleSave} className="flex flex-col space-y-4">
          {/* Bank & UPI Balance */}
          <div className="flex flex-col space-y-1.5">
            <label className="font-label-caps text-xs text-on-surface uppercase tracking-wider font-bold flex items-center justify-between">
              <span>1. Bank & UPI Accounts Balance</span>
              <span className="text-[10px] text-primary lowercase font-mono">checking & savings</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-mono text-sm font-bold text-primary">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                value={bankBalance}
                onChange={(e) => setBankBalance(e.target.value)}
                placeholder="0"
                className="w-full h-11 bg-surface-container text-on-surface font-mono pl-9 pr-3 rounded-xl text-sm font-bold border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors placeholder:text-outline"
                required
              />
            </div>
            <span className="text-[10px] text-on-surface-variant">
              Actual liquid money currently held in your bank accounts and UPI-linked cards.
            </span>
          </div>

          {/* Cash in Hand */}
          <div className="flex flex-col space-y-1.5">
            <label className="font-label-caps text-xs text-on-surface uppercase tracking-wider font-bold flex items-center justify-between">
              <span>2. Physical Cash in Hand</span>
              <span className="text-[10px] text-secondary lowercase font-mono">wallet & cash drawer</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-mono text-sm font-bold text-secondary">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                value={cashBalance}
                onChange={(e) => setCashBalance(e.target.value)}
                placeholder="0"
                className="w-full h-11 bg-surface-container text-on-surface font-mono pl-9 pr-3 rounded-xl text-sm font-bold border border-outline-variant/30 focus:outline-none focus:border-secondary transition-colors placeholder:text-outline"
                required
              />
            </div>
            <span className="text-[10px] text-on-surface-variant">
              Physical cash bills and coins currently in your wallet or pocket.
            </span>
          </div>

          {/* Monthly Spending Budget */}
          <div className="flex flex-col space-y-1.5">
            <label className="font-label-caps text-xs text-on-surface uppercase tracking-wider font-bold flex items-center justify-between">
              <span>3. Target Monthly Expense Budget</span>
              <span className="text-[10px] text-outline lowercase font-mono">monthly ceiling</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-mono text-sm font-bold text-on-surface-variant">₹</span>
              <input
                type="number"
                min="0"
                step="any"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                placeholder="25000"
                className="w-full h-11 bg-surface-container text-on-surface font-mono pl-9 pr-3 rounded-xl text-sm font-bold border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors placeholder:text-outline"
                required
              />
            </div>
            <span className="text-[10px] text-on-surface-variant">
              Used to calculate monthly budget utilization and alert you to micro-leaks.
            </span>
          </div>

          {/* Primary UPI VPA */}
          <div className="flex flex-col space-y-1.5">
            <label className="font-label-caps text-xs text-on-surface uppercase tracking-wider font-bold flex items-center justify-between">
              <span>4. Your UPI VPA (Optional)</span>
              <span className="text-[10px] text-outline lowercase font-mono">for WhatsApp settlements</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                qr_code
              </span>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourname@okhdfcbank or 9820011223@paytm"
                className="w-full h-11 bg-surface-container text-on-surface font-mono pl-10 pr-3 rounded-xl text-xs font-medium border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors placeholder:text-outline"
              />
            </div>
          </div>

          {/* Live Calculated Starting Treasury Preview */}
          <div className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-on-surface-variant uppercase font-semibold">
                Initial Total Available Treasury
              </span>
              <span className="font-mono text-lg font-bold text-secondary">
                {formatINR(totalStarting)}
              </span>
            </div>
            <div className="text-right text-[11px] font-mono text-on-surface-variant">
              <div>Bank: <span className="text-primary font-bold">{formatINR(numBank)}</span></div>
              <div>Cash: <span className="text-secondary font-bold">{formatINR(numCash)}</span></div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-tertiary font-medium animate-in fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full h-12 bg-secondary text-surface font-headline-sm text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all mt-2"
          >
            <span>{treasurySettings.isSetupComplete ? 'Update Treasury Funds' : 'Launch My Private Ledger'}</span>
            <span className="material-symbols-outlined text-[19px]">rocket_launch</span>
          </button>
        </form>
      </div>
    </div>
  );
};
