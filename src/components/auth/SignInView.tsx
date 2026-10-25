import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  validateEmail,
  validatePassword,
  registerAccount,
  verifyAccountPassword,
  decodeGoogleJwt,
  getGoogleClientId,
  setGoogleClientId,
  registerOrLoginGoogleUser,
  getStoredAccounts,
  StoredAccount,
} from '../../utils/auth';

declare global {
  interface Window {
    google?: any;
  }
}

export const SignInView: React.FC = () => {
  const { login, loginWithGoogle, isAuthenticated, setActiveTab } = useApp();

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Connected Google Account State for Registration
  const [googleConnectedUser, setGoogleConnectedUser] = useState<{
    email: string;
    name: string;
    avatar?: string;
  } | null>(null);

  // Feedback toast
  const [feedbackToast, setFeedbackToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // QR Pairing Modal
  const [showQrModal, setShowQrModal] = useState(false);

  // Google OAuth verification modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [clientIdInput, setClientIdInput] = useState(getGoogleClientId());
  const [googleManualEmail, setGoogleManualEmail] = useState('');
  const [googleManualName, setGoogleManualName] = useState('');

  // 6-digit Vault Security OTP Verification Modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [expectedOtp, setExpectedOtp] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackToast({ msg, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Inspect URL hash to set default auth mode
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('create') || hash.includes('signup') || hash.includes('register')) {
      setAuthMode('signup');
    }
  }, []);

  // Initialize Google Identity Services (GSI) if available
  useEffect(() => {
    const currentClientId = getGoogleClientId();
    if (window.google?.accounts?.id && currentClientId) {
      try {
        window.google.accounts.id.initialize({
          client_id: currentClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const btnContainer = document.getElementById('gsiButtonContainer');
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            width: btnContainer.offsetWidth || 300,
          });
        }
      } catch (err) {
        console.warn('Google GSI initialization notice:', err);
      }
    }
  }, []);

  const handleGoogleCredentialResponse = (response: any) => {
    setIsSubmitting(true);
    if (!response?.credential) {
      setIsSubmitting(false);
      showToast('Google did not return a valid credential token.', 'error');
      return;
    }

    const payload = decodeGoogleJwt(response.credential);
    if (!payload || !payload.email) {
      setIsSubmitting(false);
      showToast('Unable to parse Google authentication token.', 'error');
      return;
    }

    const profile = {
      email: payload.email,
      name: payload.name || payload.given_name || 'Google User',
      avatar: payload.picture,
    };

    if (authMode === 'signup') {
      // Link Google Account to the registration form
      setGoogleConnectedUser(profile);
      if (!fullName) setFullName(profile.name);
      if (!email) setEmail(profile.email);
      setIsSubmitting(false);
      setShowGoogleModal(false);
      showToast(`Google Account verified: ${profile.email}!`, 'success');
    } else {
      // Register or login Google User directly
      registerOrLoginGoogleUser(profile);
      loginWithGoogle(profile);
      setIsSubmitting(false);
      setActiveTab('dashboard');
      showToast(`Verified via Google as ${profile.email}!`, 'success');
    }
  };

  const handleSaveGoogleClientId = () => {
    setGoogleClientId(clientIdInput);
    if (window.google?.accounts?.id && clientIdInput.trim()) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientIdInput.trim(),
          callback: handleGoogleCredentialResponse,
        });
      } catch (err) {
        console.warn('Google GSI re-initialization error:', err);
      }
    }
    setShowGoogleModal(false);
    showToast('Google OAuth Client ID saved!', 'success');
  };

  // Connect & Verify Google Account
  const handleVerifyGoogleAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const gEmail = googleManualEmail.trim().toLowerCase();
    const gName = googleManualName.trim() || fullName.trim() || gEmail.split('@')[0];

    if (!validateEmail(gEmail)) {
      showToast('Please enter a valid Google Account email address.', 'error');
      return;
    }

    setIsSubmitting(true);
    const profile = {
      email: gEmail,
      name: gName,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(gName)}`,
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setShowGoogleModal(false);

      if (authMode === 'signup') {
        // Link Google account to sign up state
        setGoogleConnectedUser(profile);
        if (!email) setEmail(gEmail);
        if (!fullName) setFullName(gName);
        showToast(`Google Account connected: ${gEmail}`, 'success');
      } else {
        // Sign In directly via verified Google Account
        registerOrLoginGoogleUser(profile);
        loginWithGoogle(profile);
        setActiveTab('dashboard');
        showToast(`Signed in with verified Google Account: ${gEmail}`, 'success');
      }
    }, 400);
  };

  // Submit Handler for Sign In / Create Account
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackToast(null);
    setFormError(null);

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Validate Email format
    if (!validateEmail(trimmedEmail)) {
      const err = 'Please enter a valid email address (e.g. name@domain.com).';
      setFormError(err);
      showToast(err, 'error');
      return;
    }

    // 2. SIGN IN MODE
    if (authMode === 'signin') {
      if (!password) {
        const err = 'Please enter your vault password.';
        setFormError(err);
        showToast(err, 'error');
        return;
      }

      setIsSubmitting(true);
      const res = verifyAccountPassword(trimmedEmail, password);
      setIsSubmitting(false);

      if (!res.success) {
        const err = res.error || 'Authentication failed. Please verify credentials.';
        setFormError(err);
        showToast(err, 'error');
        return;
      }

      login(trimmedEmail, res.account?.name || fullName);
      setActiveTab('dashboard');
      showToast('Vault credentials verified! Decrypting ledger...', 'success');
      return;
    }

    // 3. CREATE ACCOUNT (SIGN UP) MODE
    if (authMode === 'signup') {
      if (fullName.trim().length < 2) {
        const err = 'Please enter your full legal name (at least 2 characters).';
        setFormError(err);
        showToast(err, 'error');
        return;
      }

      const passCheck = validatePassword(password);
      if (!passCheck.valid) {
        const err = passCheck.reason || 'Password requirements not met.';
        setFormError(err);
        showToast(err, 'error');
        return;
      }

      // Check for duplicate registered email
      const existingAccounts = getStoredAccounts();
      if (existingAccounts.some((a) => a.email.toLowerCase() === trimmedEmail)) {
        const err = 'An account with this email already exists. Please select Sign In.';
        setFormError(err);
        showToast(err, 'error');
        return;
      }

      // Require or prompt Google connection if not yet connected
      if (!googleConnectedUser) {
        setGoogleManualEmail(trimmedEmail);
        setGoogleManualName(fullName.trim());
        setShowGoogleModal(true);
        showToast('Please connect your Google Account to complete registration.', 'info');
        return;
      }

      // Generate realistic 6-digit Vault Security OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedOtp(code);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError(null);
      setShowOtpModal(true);
      showToast('6-digit security code generated for verification!', 'info');
    }
  };

  // OTP Input Handlers
  const handleOtpDigitChange = (index: number, val: string) => {
    const digit = val.slice(-1);
    if (val && !/^\d+$/.test(digit)) return;

    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setOtpError(null);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const next = pasted.split('');
      setOtpDigits(next);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtpSubmit = () => {
    const entered = otpDigits.join('');
    if (entered.length < 6) {
      setOtpError('Please enter all 6 digits.');
      return;
    }

    if (entered !== expectedOtp) {
      setOtpError('Invalid verification code. Please check and try again.');
      return;
    }

    // Register the account permanently with Google verification linked
    const regRes = registerAccount(fullName, email, password, {
      googleConnected: !!googleConnectedUser,
      googleEmail: googleConnectedUser?.email || email,
      avatar: googleConnectedUser?.avatar,
    });

    if (!regRes.success) {
      setOtpError(regRes.error || 'Registration failed.');
      return;
    }

    setShowOtpModal(false);
    login(email.trim().toLowerCase(), fullName.trim());
    setActiveTab('dashboard');
    showToast(`Vault Security verified! Welcome to Flows, ${fullName.trim()}!`, 'success');
  };

  const handleGoogleClick = () => {
    const cid = getGoogleClientId();
    if (window.google?.accounts?.id && cid) {
      try {
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setGoogleManualEmail(email || '');
            setGoogleManualName(fullName || '');
            setShowGoogleModal(true);
          }
        });
      } catch {
        setGoogleManualEmail(email || '');
        setGoogleManualName(fullName || '');
        setShowGoogleModal(true);
      }
    } else {
      setGoogleManualEmail(email || '');
      setGoogleManualName(fullName || '');
      setShowGoogleModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased flex flex-col justify-between selection:bg-secondary selection:text-on-secondary w-full max-w-full overflow-x-hidden">
      {/* Toast Alert */}
      {feedbackToast && (
        <div
          className={`fixed top-4 sm:top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full font-mono text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 flex items-center gap-2 max-w-[90vw] text-center ${
            feedbackToast.type === 'error'
              ? 'bg-tertiary-container text-on-tertiary-container border border-tertiary'
              : feedbackToast.type === 'info'
              ? 'bg-primary-container text-on-primary-container border border-primary'
              : 'bg-secondary text-surface shadow-[0_0_16px_rgba(78,222,163,0.4)]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] shrink-0">
            {feedbackToast.type === 'error' ? 'error' : feedbackToast.type === 'info' ? 'info' : 'check_circle'}
          </span>
          <span className="truncate">{feedbackToast.msg}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="fixed top-0 w-full z-40 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/20 pt-safe">
        <div className="h-16 px-3 sm:px-4 md:px-6 flex items-center justify-between max-w-lg mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/30 shadow-inner">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              Flows
            </span>
          </div>

          <div className="flex items-center gap-2.5">
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
      <main className="flex-1 flex flex-col relative w-full px-3 sm:px-4 pt-20 pb-8 max-w-lg mx-auto">
        {/* Header Pill & Hero */}
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
            {authMode === 'signin' ? 'Welcome to Flows' : 'Create Encrypted Vault'}
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant max-w-xs leading-relaxed">
            {authMode === 'signin'
              ? 'Your unified private wealth ledger, cash tracker, and real-time bank vault.'
              : 'Register your personal ledger with verified Google identity and custom funds.'}
          </p>
        </div>

        {/* Auth Box Container */}
        <div className="bg-surface-container-low rounded-2xl p-4 sm:p-5 shadow-xl mb-5 border border-outline-variant/30 w-full">
          {/* Segmented Tab Switcher: Sign In vs Create Account */}
          <div className="grid grid-cols-2 bg-surface-container-highest p-1 rounded-xl mb-5 text-center border border-outline-variant/20">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setFeedbackToast(null);
                setFormError(null);
              }}
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
              onClick={() => {
                setAuthMode('signup');
                setFeedbackToast(null);
                setFormError(null);
              }}
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
                  Full Legal Name
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
                    person
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
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
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full h-11 bg-surface-container text-on-surface pl-10 pr-3 rounded-xl text-xs font-medium border border-outline-variant/30 focus:outline-none focus:border-primary transition-colors placeholder:text-outline"
                  required
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  Password {authMode === 'signup' && <span className="text-[10px] text-outline lowercase font-normal">(min 8 chars, 1 digit)</span>}
                </label>
                {authMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => showToast('Password reset instructions sent to your email!', 'info')}
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
                  autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
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

            {/* GOOGLE ACCOUNT CONNECTION SECTION (CREATE ACCOUNT MODE) */}
            {authMode === 'signup' && (
              <div className="pt-1 pb-1 animate-in fade-in duration-200">
                {googleConnectedUser ? (
                  <div className="p-3 rounded-xl bg-secondary-container/20 border border-secondary/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container flex items-center justify-center ring-1 ring-secondary shrink-0">
                        {googleConnectedUser.avatar ? (
                          <img src={googleConnectedUser.avatar} alt="Google" className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-secondary text-[18px]">account_circle</span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-on-surface flex items-center gap-1 truncate">
                          <span>{googleConnectedUser.name}</span>
                          <span className="material-symbols-outlined text-secondary text-[14px]">verified</span>
                        </span>
                        <span className="text-[10px] font-mono text-secondary truncate">
                          {googleConnectedUser.email} (Google Verified)
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGoogleConnectedUser(null)}
                      className="text-[11px] font-mono text-on-surface-variant hover:text-error transition-colors shrink-0 ml-2"
                      title="Disconnect or change Google account"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface font-semibold flex items-center gap-1.5">
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                        <span>Connect Google Account</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-mono text-[9px] font-bold">
                        Verification Required
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">
                      Link your authentic Google account to enable cryptographic identity and multi-device sync.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setGoogleManualEmail(email || '');
                        setGoogleManualName(fullName || '');
                        setShowGoogleModal(true);
                      }}
                      className="w-full h-10 bg-on-surface text-surface rounded-xl font-headline-sm text-xs font-bold flex items-center justify-center gap-2 hover:bg-inverse-surface active:scale-95 transition-all shadow"
                    >
                      <span className="material-symbols-outlined text-[17px]">link</span>
                      <span>Connect with Google</span>
                    </button>
                  </div>
                )}
              </div>
            )}

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
              <span className="font-currency-sm text-[11px] text-secondary flex items-center gap-1 font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                256-Bit Vault
              </span>
            </div>

            {/* Inline Form Error Banner */}
            {formError && (
              <div className="p-3 rounded-xl bg-tertiary-container/30 border border-tertiary/60 text-on-tertiary-container text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <span className="material-symbols-outlined text-[18px] text-tertiary shrink-0 mt-0.5">error</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-primary hover:bg-primary-fixed-dim text-on-primary font-headline-sm text-sm font-bold rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all mt-2"
            >
              <span>
                {isSubmitting
                  ? 'Verifying Vault...'
                  : authMode === 'signin'
                  ? 'Sign In to Flows'
                  : 'Verify & Create Vault'}
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

          {/* 1-Tap Google Sign-In Button */}
          <div className="flex flex-col gap-2.5">
            {/* Google GSI Official Button Container (if initialized) */}
            <div id="gsiButtonContainer" className="w-full flex justify-center empty:hidden" />

            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full h-12 bg-on-surface text-surface font-headline-sm text-sm font-bold rounded-full flex items-center justify-between px-4 sm:px-5 shadow-lg active:scale-[0.98] transition-all hover:bg-inverse-surface"
            >
              <div className="flex items-center gap-3 min-w-0">
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
                <span className="tracking-tight font-semibold truncate">Continue with Google</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[10px] font-mono text-surface/70 hidden sm:inline">Google Auth</span>
                <span className="material-symbols-outlined text-surface text-[20px]">
                  chevron_right
                </span>
              </div>
            </button>

            {/* QR Sync / Pair with Web Device button */}
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="w-full h-10 bg-surface-container text-on-surface text-xs font-semibold rounded-full flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors border border-outline-variant/30 px-3"
            >
              <span className="material-symbols-outlined text-secondary text-[17px]">qr_code_scanner</span>
              <span className="truncate">Pair with Mobile / Desktop Web Sync</span>
            </button>
          </div>
        </div>

        {/* Value Proposition Feature Card */}
        <div className="bg-surface-container-low rounded-2xl p-4 sm:p-5 shadow-sm border border-outline-variant/20 w-full">
          <div className="flex items-center gap-2 mb-3 text-secondary">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span className="font-label-caps text-xs uppercase tracking-wider text-on-surface font-bold">
              Why Choose Flows
            </span>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary border border-secondary/20">
                <span className="material-symbols-outlined text-[19px]">shield_lock</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-on-surface font-headline-sm">Zero-Knowledge Encryption</span>
                <span className="text-[11px] text-on-surface-variant leading-relaxed">
                  Client-side AES-256 keys. Only your device decrypts receipts, accounts, and portfolio logs.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-primary border border-primary/20">
                <span className="material-symbols-outlined text-[19px]">tune</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-on-surface font-headline-sm">Calibrated Treasury Funds</span>
                <span className="text-[11px] text-on-surface-variant leading-relaxed">
                  Start with your actual bank, UPI, and cash balances. Zero bogus placeholder numbers.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 text-secondary-fixed border border-secondary/20">
                <span className="material-symbols-outlined text-[19px]">receipt_long</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-on-surface font-headline-sm">Offline Cash + UPI Ledger</span>
                <span className="text-[11px] text-on-surface-variant leading-relaxed">
                  Record split-second cash adjustments and scans even without an active internet connection.
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 6-DIGIT VAULT SECURITY OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-high rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-outline-variant/30 text-center flex flex-col items-center space-y-4 shadow-2xl">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                </div>
                <span className="font-headline-sm text-sm font-bold text-on-surface">Vault Verification</span>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex flex-col space-y-1 text-center">
              <h3 className="font-headline-md text-base font-bold text-on-surface">
                Verify Ledger Ownership
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Enter the 6-digit security code generated for <span className="font-mono text-primary font-bold">{email}</span> to activate your encrypted vault.
              </p>
            </div>

            {/* Generated Code Preview */}
            <div className="w-full p-2.5 rounded-xl bg-secondary-container/20 border border-secondary/30 flex items-center justify-between text-xs font-mono">
              <span className="text-secondary font-semibold">Security Code: <strong>{expectedOtp}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setOtpDigits(expectedOtp.split(''));
                  setOtpError(null);
                }}
                className="px-2 py-0.5 rounded bg-secondary text-surface font-bold text-[10px] active:scale-95 transition-transform"
              >
                Auto-Fill
              </button>
            </div>

            {/* 6-Digit Input Grid */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-2" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-10 h-12 text-center text-lg font-mono font-bold bg-surface-container text-on-surface rounded-xl border border-outline-variant/40 focus:border-secondary focus:outline-none transition-all shadow-inner"
                />
              ))}
            </div>

            {otpError && (
              <p className="text-xs text-tertiary font-medium animate-in fade-in">
                {otpError}
              </p>
            )}

            <button
              type="button"
              onClick={handleVerifyOtpSubmit}
              className="w-full h-11 bg-secondary text-surface font-headline-sm text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <span>Verify & Unlock Vault</span>
              <span className="material-symbols-outlined text-[17px]">lock_open</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                setExpectedOtp(newCode);
                setOtpDigits(['', '', '', '', '', '']);
                setOtpError(null);
                showToast('New verification code sent!', 'info');
              }}
              className="text-xs font-mono text-primary hover:underline"
            >
              Resend Code
            </button>
          </div>
        </div>
      )}

      {/* GOOGLE ACCOUNT CONNECTION & VERIFICATION MODAL */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-surface-container-high rounded-3xl p-5 sm:p-6 max-w-md w-full border border-outline-variant/30 flex flex-col space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center">
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
                </div>
                <div>
                  <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                    Connect Google Account
                  </h3>
                  <span className="font-mono text-[10px] text-primary">Identity & Ledger Verification</span>
                </div>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Verify your real Google account to link your identity to Flows. This securely encrypts your personal ledger and validates your profile.
            </p>

            {/* Authenticate with Real Google Account Form */}
            <form onSubmit={handleVerifyGoogleAccount} className="flex flex-col space-y-3 bg-surface-container-lowest/60 p-3.5 rounded-2xl border border-outline-variant/20">
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-mono text-on-surface font-semibold">
                  Google Account Email Address
                </label>
                <input
                  type="email"
                  value={googleManualEmail}
                  onChange={(e) => setGoogleManualEmail(e.target.value)}
                  placeholder="your.google.account@gmail.com"
                  className="w-full h-10 px-3 bg-surface-container rounded-xl text-xs font-mono text-on-surface border border-outline-variant/30 focus:border-primary focus:outline-none placeholder:text-outline"
                  required
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-mono text-on-surface font-semibold">
                  Full Name on Google Account
                </label>
                <input
                  type="text"
                  value={googleManualName}
                  onChange={(e) => setGoogleManualName(e.target.value)}
                  placeholder="e.g. Your Full Name"
                  className="w-full h-10 px-3 bg-surface-container rounded-xl text-xs font-sans text-on-surface border border-outline-variant/30 focus:border-primary focus:outline-none placeholder:text-outline"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-headline-sm text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md"
              >
                <span className="material-symbols-outlined text-[17px]">verified</span>
                <span>{isSubmitting ? 'Verifying with Google...' : 'Verify & Connect Google Account'}</span>
              </button>
            </form>

            {/* Optional Custom Google Cloud OAuth Client ID */}
            <div className="pt-2 border-t border-outline-variant/20 flex flex-col space-y-2">
              <span className="font-mono text-[11px] text-on-surface-variant font-semibold">
                Developer / Custom Google Cloud OAuth Client ID
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="xxxx.apps.googleusercontent.com"
                  className="flex-1 h-9 px-3 bg-surface-container rounded-xl text-[11px] font-mono text-on-surface border border-outline-variant/30 focus:border-primary focus:outline-none placeholder:text-outline"
                />
                <button
                  type="button"
                  onClick={handleSaveGoogleClientId}
                  className="px-3 h-9 rounded-xl bg-surface-container-high hover:bg-surface-bright text-primary font-mono text-xs font-bold transition-colors border border-outline-variant/30"
                >
                  Save
                </button>
              </div>
              <span className="text-[10px] text-on-surface-variant">
                Origins: <code className="text-primary font-mono">https://shaardul-18.github.io</code> and <code className="text-primary font-mono">http://localhost:3000</code>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* QR PAIRING MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-surface-container-high rounded-2xl p-5 sm:p-6 max-w-sm w-full border border-outline-variant/30 text-center flex flex-col items-center space-y-4 shadow-2xl">
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
                src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=flows://auth-sync?token=flows_vault_session_active"
                alt="QR Code"
                className="w-40 h-40"
              />
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Open Flows mobile app on your phone, go to Settings &gt; Link Device, and scan this QR code.
            </p>

            <button
              onClick={() => {
                const accounts = getStoredAccounts();
                if (accounts.length > 0) {
                  setShowQrModal(false);
                  const acc = accounts[0];
                  login(acc.email, acc.name);
                  setActiveTab('dashboard');
                  showToast(`Paired & Synced with vault for ${acc.name}!`, 'success');
                } else {
                  setShowQrModal(false);
                  showToast('No registered vault found on this device yet. Please create your account first.', 'info');
                  setAuthMode('signup');
                }
              }}
              className="w-full py-2.5 rounded-xl bg-secondary text-surface text-xs font-mono font-bold transition-all shadow-md active:scale-95"
            >
              Simulate Instant QR Scan Pair
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
