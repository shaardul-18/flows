import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { setAppInstalled } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>('android');
  const [copiedLink, setCopiedLink] = useState(false);

  const appUrl = 'https://shaardul-18.github.io/flows/';
  const apkDownloadUrl = 'https://github.com/shaardul-18/flows/releases';

  useEffect(() => {
    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setActivePlatform('ios');
    } else if (/android/.test(ua)) {
      setActivePlatform('android');
    } else {
      setActivePlatform('desktop');
    }

    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      setAppInstalled(true);
    }

    // Capture beforeinstallprompt event on Chromium
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setAppInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [setAppInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setAppInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback alert or guidance
      alert('To install, tap your browser menu (⋮) and select "Install app" or "Add to Home screen"');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-high rounded-3xl p-6 max-w-md w-full border border-outline-variant/30 shadow-2xl relative flex flex-col space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shadow-inner border border-outline-variant/30 overflow-hidden">
              <img src="./favicon.png" alt="Flows Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-sm font-bold text-on-surface">
                Install Flows on Phone
              </span>
              <span className="font-mono text-[10px] text-secondary font-semibold uppercase tracking-wider">
                Full-Screen Mobile App
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="grid grid-cols-3 bg-surface-container p-1 rounded-xl text-center text-xs font-semibold border border-outline-variant/20">
          <button
            onClick={() => setActivePlatform('android')}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activePlatform === 'android'
                ? 'bg-secondary-container text-on-secondary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">android</span>
            <span>Android</span>
          </button>
          <button
            onClick={() => setActivePlatform('ios')}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activePlatform === 'ios'
                ? 'bg-secondary-container text-on-secondary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">phone_iphone</span>
            <span>iPhone / iOS</span>
          </button>
          <button
            onClick={() => setActivePlatform('desktop')}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activePlatform === 'desktop'
                ? 'bg-secondary-container text-on-secondary shadow-sm font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
            <span>Scan QR</span>
          </button>
        </div>

        {/* Content per Platform */}
        {activePlatform === 'android' && (
          <div className="flex flex-col space-y-3.5">
            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col space-y-3">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-[20px]">download_for_offline</span>
                <span className="text-xs font-bold text-on-surface">Option 1: Instant 1-Tap PWA Install</span>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Install directly from the browser onto your Android home screen. Runs in full-screen standalone mode with native performance and offline ledger sync.
              </p>

              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-2.5 rounded-xl bg-secondary text-on-secondary font-headline-sm text-xs font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add_to_home_screen</span>
                  <span>Install Flows App Now</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-xl bg-surface-container text-[11px] text-on-surface-variant flex flex-col space-y-1.5 border border-outline-variant/20">
                  <div className="flex items-center gap-1.5 text-primary font-semibold">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    <span>To install in Chrome / Brave on Android:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-on-surface pl-1">
                    <li>Tap the <strong>three dots (⋮)</strong> at top right.</li>
                    <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                    <li>Confirm <strong>"Install"</strong>. Flows will appear on your app drawer!</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Option 2: APK Download */}
            <div className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Option 2: Android APK (.apk)</span>
                <span className="text-[10px] text-on-surface-variant">Direct sideload download from GitHub</span>
              </div>
              <a
                href={apkDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 rounded-lg bg-surface-container hover:bg-surface-bright text-xs font-mono text-primary flex items-center gap-1 border border-outline-variant/30 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                <span>Releases</span>
              </a>
            </div>
          </div>
        )}

        {activePlatform === 'ios' && (
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-col space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-[20px]">ios_share</span>
              <span className="text-xs font-bold text-on-surface">Install on iPhone / iPad (Safari)</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Apple allows installing any web app directly onto your iOS home screen via Safari:
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-surface-container border border-outline-variant/15">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-mono text-[10px] flex items-center justify-center font-bold shrink-0">1</span>
                <span className="text-[11px] text-on-surface">
                  Open <strong>https://shaardul-18.github.io/flows/</strong> in <strong>Safari</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-surface-container border border-outline-variant/15">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-mono text-[10px] flex items-center justify-center font-bold shrink-0">2</span>
                <span className="text-[11px] text-on-surface">
                  Tap the <strong>Share</strong> button (box with upward arrow <span className="text-primary font-bold">⎋</span>) at the bottom.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-surface-container border border-outline-variant/15">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-mono text-[10px] flex items-center justify-center font-bold shrink-0">3</span>
                <span className="text-[11px] text-on-surface">
                  Scroll down and tap <strong>"Add to Home Screen"</strong> (with <strong>⊞</strong> icon).
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-surface-container border border-outline-variant/15">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-mono text-[10px] flex items-center justify-center font-bold shrink-0">4</span>
                <span className="text-[11px] text-on-surface">
                  Tap <strong>"Add"</strong> in the top right corner. The Flows app icon will now sit on your home screen!
                </span>
              </div>
            </div>
          </div>
        )}

        {activePlatform === 'desktop' && (
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-white rounded-2xl shadow-inner border border-outline-variant/30">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(appUrl)}`}
                alt="Scan to open on phone"
                className="w-40 h-40"
              />
            </div>
            <p className="text-xs text-on-surface font-medium">
              Scan with your phone's camera to open Flows and install it instantly.
            </p>
            <div className="flex items-center gap-2 w-full">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="flex-1 h-9 bg-surface-container text-[11px] font-mono text-on-surface-variant px-3 rounded-lg border border-outline-variant/30 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="h-9 px-3 rounded-lg bg-surface-container hover:bg-surface-bright text-xs font-mono text-secondary flex items-center gap-1 border border-outline-variant/30 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {copiedLink ? 'check' : 'content_copy'}
                </span>
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Value badges & dismissal footer */}
        <div className="pt-3 border-t border-outline-variant/15 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            onClick={() => {
              setAppInstalled(true);
              onClose();
            }}
            className="w-full sm:w-auto py-1.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-highest text-[11px] font-mono text-on-surface-variant hover:text-secondary flex items-center justify-center gap-1.5 transition-colors border border-outline-variant/30 active:scale-95"
            title="Permanently hide the install button if you already have the app on your home screen"
          >
            <span className="material-symbols-outlined text-[15px] text-secondary">check_circle</span>
            <span>Already Installed? Hide Button</span>
          </button>

          <div className="flex items-center gap-2.5 text-[10px] font-mono text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Standalone
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Offline Ready
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
