import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { MobileNav } from './components/common/MobileNav';
import { DesktopSidebar } from './components/common/DesktopSidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { ItemizedSplitCalculator } from './components/splits/ItemizedSplitCalculator';
import { ReceiptOcrScanner } from './components/scanner/ReceiptOcrScanner';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { DebtSettlementView } from './components/settlements/DebtSettlementView';
import { DesktopLedgerView } from './components/desktop/DesktopLedgerView';
import { LogCashModal } from './components/modals/LogCashModal';
import { CreateSplitModal } from './components/modals/CreateSplitModal';
import { ExportModal } from './components/modals/ExportModal';
import { InstallAppModal } from './components/modals/InstallAppModal';
import { TreasurySetupModal } from './components/modals/TreasurySetupModal';
import { SignInView } from './components/auth/SignInView';

export const App: React.FC = () => {
  const { activeTab, setActiveTab, isDesktopMode, isAuthenticated, treasurySettings } = useApp();

  const [isLogCashOpen, setIsLogCashOpen] = useState(false);
  const [isCreateSplitOpen, setIsCreateSplitOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isTreasuryOpen, setIsTreasuryOpen] = useState(false);

  // Automatically trigger Treasury setup wizard for newly registered users
  React.useEffect(() => {
    if (isAuthenticated && !treasurySettings.isSetupComplete) {
      setIsTreasuryOpen(true);
    }
  }, [isAuthenticated, treasurySettings.isSetupComplete]);

  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase().replace('#', '');
      const search = window.location.search.toLowerCase();
      // Ignore Supabase OAuth tokens in hash
      if (hash.includes('access_token') || hash.includes('refresh_token')) {
        return;
      }
      if (hash === 'login' || hash === 'signin' || search.includes('login') || search.includes('signin')) {
        setActiveTab('login');
      } else if (hash && ['dashboard', 'splits', 'scanner', 'analytics', 'debts'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [setActiveTab]);

  // If user is not authenticated or explicitly visiting login tab
  if (!isAuthenticated || activeTab === 'login') {
    return <SignInView />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return isDesktopMode ? (
          <DesktopLedgerView
            onOpenLogCash={() => setIsLogCashOpen(true)}
            onOpenNewSplit={() => setIsCreateSplitOpen(true)}
            onOpenExport={() => setIsExportOpen(true)}
            onOpenTreasury={() => setIsTreasuryOpen(true)}
          />
        ) : (
          <DashboardView
            onOpenLogCash={() => setIsLogCashOpen(true)}
            onOpenNewSplit={() => setIsCreateSplitOpen(true)}
            onOpenTreasury={() => setIsTreasuryOpen(true)}
          />
        );
      case 'splits':
        return <ItemizedSplitCalculator />;
      case 'scanner':
        return <ReceiptOcrScanner />;
      case 'analytics':
        return <AnalyticsView />;
      case 'debts':
        return <DebtSettlementView />;
      default:
        return <DashboardView onOpenLogCash={() => setIsLogCashOpen(true)} onOpenNewSplit={() => setIsCreateSplitOpen(true)} />;
    }
  };

  const getSubtitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return isDesktopMode ? 'FINTECH ENGINE' : 'Home';
      case 'splits':
        return 'Splits & WhatsApp';
      case 'scanner':
        return 'Receipt OCR Vault';
      case 'analytics':
        return 'Analytics & Leaks';
      case 'debts':
        return 'Debt Simplification';
      default:
        return 'Treasury';
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-sans selection:bg-secondary selection:text-on-secondary w-full max-w-full overflow-x-hidden">
      {/* If desktop mode is active, render desktop sidebar layout */}
      {isDesktopMode ? (
        <div className="flex w-full min-h-screen max-w-full overflow-x-hidden">
          <DesktopSidebar
            onOpenExport={() => setIsExportOpen(true)}
            onOpenLogCash={() => setIsLogCashOpen(true)}
            onOpenNewSplit={() => setIsCreateSplitOpen(true)}
            onOpenInstall={() => setIsInstallOpen(true)}
          />
          <div className="lg:pl-72 flex-1 flex flex-col min-h-screen bg-surface w-full max-w-full overflow-x-hidden">
            <Header
              title="Flows"
              subtitle={getSubtitle()}
              onOpenInstall={() => setIsInstallOpen(true)}
              onOpenTreasury={() => setIsTreasuryOpen(true)}
            />
            <main className="flex-1 w-full pt-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto overflow-x-hidden">
              {renderContent()}
            </main>
          </div>
        </div>
      ) : (
        /* Mobile-First Layout matching Google Stitch */
        <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-hidden relative">
          <Header
            title="Flows"
            subtitle={getSubtitle()}
            onOpenInstall={() => setIsInstallOpen(true)}
            onOpenTreasury={() => setIsTreasuryOpen(true)}
          />
          <main className="flex-1 w-full pt-20 pb-24 px-3 sm:px-4 max-w-2xl mx-auto overflow-x-hidden">
            {renderContent()}
          </main>
          <MobileNav onOpenInstall={() => setIsInstallOpen(true)} />
        </div>
      )}

      {/* Global Modals */}
      <LogCashModal
        isOpen={isLogCashOpen}
        onClose={() => setIsLogCashOpen(false)}
      />
      <CreateSplitModal
        isOpen={isCreateSplitOpen}
        onClose={() => setIsCreateSplitOpen(false)}
      />
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
      <InstallAppModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />
      <TreasurySetupModal
        isOpen={isTreasuryOpen}
        onClose={() => setIsTreasuryOpen(false)}
      />
    </div>
  );
};
