import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenInstall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title = 'Flows', subtitle = 'Home', onOpenInstall }) => {
  const { currentUser, isDesktopMode, setIsDesktopMode, logout, setActiveTab } = useApp();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className={`fixed top-0 right-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/20 pt-safe ${isDesktopMode ? 'left-72' : 'left-0'}`}>
      <div className="h-16 px-4 md:px-6 flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand Logo & Context */}
        <div className="flex items-center gap-3">
          {!isDesktopMode && (
            <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center shadow-inner border border-outline-variant/30">
              <span className="material-symbols-outlined text-secondary text-[22px]">waves</span>
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">
                {title}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-mono font-semibold">
                v2.4
              </span>
            </div>
            <span className="font-label-caps text-[10px] text-secondary uppercase tracking-wider font-semibold">
              {subtitle}
            </span>
          </div>
        </div>

        {/* Action Controls & Profile */}
        <div className="flex items-center gap-2">
          {/* Install on Phone Button */}
          {onOpenInstall && (
            <button
              onClick={onOpenInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container/25 hover:bg-secondary-container text-xs font-mono text-secondary hover:text-on-secondary border border-secondary/40 shadow-[0_0_12px_rgba(78,222,163,0.15)] transition-all active:scale-95"
              title="Install Flows App on Phone"
            >
              <span className="material-symbols-outlined text-[16px]">install_mobile</span>
              <span className="font-bold">Install App</span>
            </button>
          )}

          {/* Responsive View Switcher Toggle */}
          <button
            onClick={() => setIsDesktopMode(!isDesktopMode)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all text-xs font-mono border border-outline-variant/30"
            title="Toggle between Mobile view and Desktop Ledger layout"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">
              {isDesktopMode ? 'smartphone' : 'desktop_windows'}
            </span>
            <span>{isDesktopMode ? 'Mobile View' : 'Desktop Ledger'}</span>
          </button>

          {/* Direct Sign In / Vault Switcher Button */}
          <button
            onClick={() => {
              setActiveTab('login');
              logout();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-mono text-on-surface-variant hover:text-secondary border border-outline-variant/30 transition-all"
            title="Switch to Login / Web Sync Page"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
            <span className="hidden sm:inline">Sign In / Vault</span>
          </button>

          {/* Sync Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-xs font-mono text-secondary border border-secondary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Synced</span>
          </div>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface" />
          </button>

          {/* User Profile with Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-surface-container transition-colors"
              title="User Account"
            >
              <div className="relative">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-high"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-surface" />
              </div>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                arrow_drop_down
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-container-high p-3 shadow-2xl border border-outline-variant/30 flex flex-col gap-2 z-50 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 pb-2 border-b border-outline-variant/20">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-on-surface truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] font-mono text-on-surface-variant truncate">
                      {currentUser.email}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-on-surface hover:bg-surface-container hover:text-secondary transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <span>Lock Vault & Sign Out</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-on-surface hover:bg-surface-container hover:text-primary transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px]">switch_account</span>
                    <span>Switch User / Login</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
