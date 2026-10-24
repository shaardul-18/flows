import React from 'react';
import { useApp } from '../../context/AppContext';

export const MobileNav: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: 'home' },
    { id: 'splits', label: 'Splits', icon: 'group' },
    { id: 'scanner', label: 'Scan OCR', icon: 'document_scanner', isAction: true },
    { id: 'analytics', label: 'Insights', icon: 'bar_chart' },
    { id: 'debts', label: 'Settle', icon: 'handshake' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl border-t border-outline-variant/20 shadow-2xl">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative -top-3 flex flex-col items-center group active:scale-95 transition-transform"
                title="Scan Receipt OCR"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-secondary-container to-secondary text-surface flex items-center justify-center shadow-[0_0_18px_rgba(78,222,163,0.5)] group-hover:shadow-[0_0_24px_rgba(78,222,163,0.7)] transition-all">
                  <span className="material-symbols-outlined text-[24px] font-bold text-surface">
                    {item.icon}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-secondary mt-0.5">
                  Scan
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
                isActive
                  ? 'text-secondary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="font-label-sm text-[11px] mt-0.5">{item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-secondary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
