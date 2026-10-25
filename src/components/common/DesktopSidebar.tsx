import React from 'react';
import { useApp } from '../../context/AppContext';

interface DesktopSidebarProps {
  onOpenExport: () => void;
  onOpenLogCash: () => void;
  onOpenNewSplit: () => void;
  onOpenInstall?: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  onOpenExport,
  onOpenLogCash,
  onOpenNewSplit,
  onOpenInstall,
}) => {
  const { activeTab, setActiveTab, currentUser, logout } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard / Overview', icon: 'grid_view' },
    { id: 'splits', label: 'Split Bills & Groups', icon: 'group' },
    { id: 'scanner', label: 'Receipt OCR Vault', icon: 'document_scanner' },
    { id: 'analytics', label: 'Transactions & Leaks', icon: 'receipt_long' },
    { id: 'debts', label: 'Debt Simplification', icon: 'account_tree' },
    { id: 'login', label: 'Sign In & Web Sync', icon: 'login' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-40 flex flex-col justify-between border-r border-outline-variant/30 shadow-[0_1px_12px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col">
        {/* Top Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center shadow-inner border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-[22px]">waves</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold leading-none">
                Flows
              </span>
              <span className="font-label-caps text-[10px] text-secondary leading-none mt-1 uppercase font-semibold">
                FINTECH ENGINE
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-[10px] border border-outline-variant/30 font-semibold">
            WEB VAULT
          </span>
        </div>

        {/* Quick Action Buttons */}
        <div className="p-4 grid grid-cols-2 gap-2 border-b border-outline-variant/15">
          <button
            onClick={onOpenNewSplit}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-secondary-container text-on-secondary text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">group_add</span>
            <span>Split Bill</span>
          </button>
          <button
            onClick={onOpenLogCash}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-bright text-xs font-semibold active:scale-95 transition-all border border-outline-variant/20"
          >
            <span className="material-symbols-outlined text-secondary text-[16px]">payments</span>
            <span>Log Cash</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 flex flex-col gap-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all text-left ${
                  isActive
                    ? 'bg-surface-container-high text-primary font-semibold shadow-sm border border-primary/20'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${
                    isActive ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={onOpenExport}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all text-left mt-1"
          >
            <span className="material-symbols-outlined text-[20px] text-secondary">table_chart</span>
            <span>Export & Reports (.xlsx)</span>
          </button>

          {onOpenInstall && (
            <button
              onClick={onOpenInstall}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm text-secondary hover:bg-secondary-container/20 transition-all text-left mt-1 border border-secondary/30 bg-secondary-container/10"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary">install_mobile</span>
              <span>Install on Phone</span>
            </button>
          )}
        </nav>
      </div>

      {/* Connected Account & Live Sync */}
      <div className="p-4 flex flex-col gap-3 bg-surface-container-low/40 border-t border-outline-variant/20">
        <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/20">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              CONNECTED ACCOUNT
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-secondary font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              LIVE SYNC 2.0
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-1.5">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-secondary/40"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-on-surface font-semibold truncate leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[11px] font-mono text-on-surface-variant truncate leading-tight">
                {currentUser.upiId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-outline-variant/15">
            <button
              onClick={logout}
              className="flex-1 py-1.5 px-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-mono text-on-surface-variant hover:text-secondary flex items-center justify-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">lock</span>
              <span>Lock Vault</span>
            </button>
            <button
              onClick={logout}
              className="py-1.5 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-mono text-on-surface-variant hover:text-primary flex items-center justify-center gap-1 transition-colors"
              title="Sign Out / Switch Account"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
