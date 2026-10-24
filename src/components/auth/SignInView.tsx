import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const SignInView: React.FC = () => {
  const { login, isAuthenticated, setActiveTab } = useApp();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('Shaardul Kulkarni');
  const [email, setEmail] = useState('shaardul.k@gmail.com');
  const [password, setPassword] = useState('SecretPass2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      login(email, fullName);
      setActiveTab('dashboard');
      setIsSubmitting(false);
      showToast(authMode === 'signin' ? 'Signed in successfully!' : 'Account vault created!');
    }, 500);
  };

  const handleGoogleSignIn = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      login('shaardul.k@gmail.com', 'Shaardul Kulkarni');
      setActiveTab('dashboard');
      setIsSubmitting(false);
      showToast('Authenticated via Google Sign-In');
    }, 400);
  };

  const handleSsoSignIn = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      login('shaardul@company.corp', 'Shaardul Kulkarni (Enterprise)');
      setActiveTab('dashboard');
      setIsSubmitting(false);
      showToast('SSO Corporate Ledger Verified');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased flex flex-col justify-between selection:bg-secondary selection:text-on-secondary">
      {/* Toast Alert */}
      {feedbackToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-secondary text-on-secondary font-mono text-xs font-bold shadow-xl animate-in fade-in slide-in-from-top-4 duration-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Top Header matching Stitch sign_in_web_sync */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 pt-safe">
        <div className="h-16 px-4 md:px-6 flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/30 shadow-inner">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              Flows
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-xs text-primary font-mono transition-colors border border-primary/20"
                title="Return to Dashboard"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                <span>Dashboard</span>
              </button>
            )}
            <div className="flex items-center gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span className="font-label-caps text-[11px] tracking-widest uppercase font-semibold">
                Encrypted
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative w-full px-4 pt-20 pb-8 max-w-lg mx-auto">
        {/* Header Pill & Hero matching Stitch */}
        <div className="flex flex-col items-center text-center mt-3 mb-5">
          <div className="inline-flex items-center gap-2 bg-surface-container-high px-3 py-1 rounded-full mb-3 shadow-sm border border-outline-variant/30">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
              FLOWS SECURE ONBOARDING
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span className="font-label-caps text-[10px] text-secondary font-bold">
              v2.4 Live
            </span>
          </div>

          <h1 className="font-headline-lg text-2xl sm:text-3xl text-on-surface font-bold tracking-tight mb-1.5">
            {authMode === 'signin' ? 'Welcome to Flows' : 'Start with Flows'}
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant max-w-xs leading-relaxed">
            {authMode === 'signin'
              ? 'Your unified private wealth ledger, cash tracker, and real-time bank vault.'
              : 'Create your private encrypted ledger vault in under 60 seconds.'}
          </p>
        </div>

        {/* Auth Box Container */}
        <div className="bg-surface-container-low rounded-2xl p-5 shadow-xl mb-5 border border-outline-variant/30">
          {/* Segmented Tab Switcher: Sign In vs Create Account */}
          <div className="grid grid-cols-2 bg-surface-container-highest p-1 rounded-xl mb-5 text-center border border-outline-variant/20">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className={`py-2 rounded-lg font-headline-sm text-xs font-bold transition-all ${
                authMode === 'signin'
                  ? 'bg-surface-container text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`py-2 rounded-lg font-headline-sm text-xs font-bold transition-all ${
                authMode === 'signup'
                  ? 'bg-surface-container text-on-surface shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name Field (Register Mode Only) */}
            {authMode === 'signup' && (
              <div className="flex flex-col gap-1.5 animate-in fade-in duration-200">
                <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                    person
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Shaardul Kulkarni"
                    className="w-full h-11 bg-surface-container text-on-surface pl-10 pr-3 rounded-xl text-xs font-medium border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors placeholder:text-outline"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                Email Address
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shaardul.k@gmail.com"
                  className="w-full h-11 bg-surface-container text-on-surface pl-10 pr-3 rounded-xl text-xs font-medium border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors placeholder:text-outline"
                  required
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  Password
                </label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => showToast('Password reset link sent to registered email!')}
                    className="text-primary text-xs hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 bg-surface-container text-on-surface pl-10 pr-10 rounded-xl text-xs font-medium border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors placeholder:text-outline"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-outline hover:text-on-surface transition-colors p-1"
                  aria-label="Toggle password visibility"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me / Terms Checkbox */}
            <div className="flex items-center justify-between pt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-surface-container border-outline-variant/50 text-secondary accent-secondary cursor-pointer"
                />
                <span className="text-xs text-on-surface-variant">
                  {authMode === 'signin'
                    ? 'Remember me for 30 days'
                    : 'I agree to Terms & Privacy Policy'}
                </span>
              </label>
              <span className="font-currency-sm text-[11px] text-secondary flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                256-Bit Vault
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline-sm text-sm font-bold rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all mt-2"
            >
              <span>
                {isSubmitting
                  ? 'Verifying Ledger Credentials...'
                  : authMode === 'signin'
                  ? 'Sign In to Flows'
                  : 'Create Free Account'}
              </span>
              <span className="material-symbols-outlined text-[19px]">
                {isSubmitting ? 'sync' : 'arrow_forward'}
              </span>
            </button>
          </form>

          {/* OR CONTINUE WITH Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-outline-variant/40" />
            <span className="flex-shrink mx-3 text-on-surface-variant font-label-caps text-[10px] tracking-widest uppercase font-semibold">
              or continue with
            </span>
            <div className="flex-grow border-t border-outline-variant/40" />
          </div>

          {/* 1-Tap Google Sign-In Button matching Stitch */}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full h-12 bg-on-surface text-surface font-headline-sm text-sm font-bold rounded-full flex items-center justify-between px-5 shadow-lg active:scale-[0.98] transition-all hover:bg-inverse-surface"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="tracking-tight font-semibold">Continue with Google</span>
              </div>
              <span className="material-symbols-outlined text-surface text-[20px]">
                chevron_right
              </span>
            </button>

            {/* Secondary Workspace / SSO Option matching Stitch */}
            <button
              type="button"
              onClick={handleSsoSignIn}
              className="w-full h-11 bg-surface-container text-on-surface font-body-md text-xs font-semibold rounded-full flex items-center justify-center gap-2 active:bg-surface-container-high hover:bg-surface-container-high transition-colors border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">domain</span>
              <span>Use Work or Workspace Account (SSO)</span>
            </button>

            {/* QR Sync / Pair with Web Device button */}
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="w-full h-11 bg-surface-container text-on-surface text-xs font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-secondary text-[18px]">qr_code_scanner</span>
              <span>Pair with Mobile / Desktop Web Sync</span>
            </button>
          </div>
        </div>

        {/* Value Proposition Feature Card matching Stitch */}
        <div className="bg-surface-container-low rounded-2xl p-5 shadow-sm border border-outline-variant/20">
          <div className="flex items-center gap-2 mb-3 text-secondary">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span className="font-label-caps text-xs uppercase tracking-wider text-on-surface font-bold">
              Why Choose Flows
            </span>
          </div>

          <div className="space-y-3.5">
            {/* Prop 1 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary border border-secondary/20">
                <span className="material-symbols-outlined text-[19px]">shield_lock</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface font-headline-sm">Zero-Knowledge Encryption</span>
                <span className="text-[11px] text-on-surface-variant leading-relaxed">
                  Client-side AES-256 keys. Only your device decrypts receipts, accounts, and portfolio logs.
                </span>
              </div>
            </div>

            {/* Prop 2 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary border border-primary/20">
                <span className="material-symbols-outlined text-[19px]">devices</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface font-headline-sm">Web & Desktop Sync</span>
                <span className="text-[11px] text-on-surface-variant leading-relaxed">
                  Instant live synchronization with <span className="text-primary font-mono font-semibold">web.flows.money</span> across macOS, Windows, and iPad.
                </span>
              </div>
            </div>

            {/* Prop 3 */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary-fixed border border-secondary/20">
                <span className="material-symbols-outlined text-[19px]">receipt_long</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface font-headline-sm">Offline Cash + UPI Ledger</span>
                <span className="text-[11px] text-on-surface-variant leading-relaxed">
                  Record split-second cash adjustments and scans even without an active internet connection.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* QR Pairing Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-surface-container-high rounded-2xl p-6 max-w-sm w-full border border-outline-variant/30 text-center flex flex-col items-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between w-full">
              <span className="font-headline-sm text-sm font-bold text-on-surface">Web Pair QR</span>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-inner">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=flows://auth-sync?token=flows_demo_session_2026"
                alt="QR Code"
                className="w-44 h-44"
              />
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Open Flows mobile app on your phone, go to Settings &gt; Link Device, and scan this QR code.
            </p>

            <button
              onClick={() => {
                setShowQrModal(false);
                login('shaardul.k@gmail.com', 'Shaardul Kulkarni');
                setActiveTab('dashboard');
                showToast('Paired & Synced successfully!');
              }}
              className="w-full py-2.5 rounded-xl bg-secondary-container hover:bg-secondary text-on-secondary text-xs font-mono font-bold transition-all shadow-md active:scale-95"
            >
              Simulate Instant QR Scan Pair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
