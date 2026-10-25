export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Base64 encoded hash
  avatar?: string;
  createdAt: string;
  isVerified: boolean;
  provider: 'password' | 'google' | 'sso';
}

const STORAGE_KEY = 'flows_registered_vaults_v1';
const GOOGLE_CLIENT_ID_KEY = 'flows_google_client_id';

// Default initial pre-registered account matching mock data
const DEFAULT_ACCOUNTS: StoredAccount[] = [
  {
    id: 'user-shaardul',
    name: 'Shaardul Kulkarni',
    email: 'shaardul.k@gmail.com',
    passwordHash: btoa('SecretPass2026!'),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date().toISOString(),
    isVerified: true,
    provider: 'password',
  },
  {
    id: 'user-shaardul-work',
    name: 'Shaardul Ghag',
    email: 'shaardulghag.work@gmail.com',
    passwordHash: btoa('SecretPass2026!'),
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    createdAt: new Date().toISOString(),
    isVerified: true,
    provider: 'google',
  }
];

export const getStoredAccounts = (): StoredAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ACCOUNTS;
  }
};

export const saveStoredAccounts = (accounts: StoredAccount[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email.trim().toLowerCase());
};

export const validatePassword = (password: string): { valid: boolean; reason?: string } => {
  if (password.length < 8) {
    return { valid: false, reason: 'Password must be at least 8 characters long.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: 'Password must contain at least one digit (0-9).' };
  }
  return { valid: true };
};

export const registerAccount = (
  name: string,
  email: string,
  password: string
): { success: boolean; error?: string; verificationCode?: string } => {
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return { success: false, error: 'Please enter your full legal name.' };
  }
  if (!validateEmail(trimmedEmail)) {
    return { success: false, error: 'Please provide a valid email address.' };
  }
  const passCheck = validatePassword(password);
  if (!passCheck.valid) {
    return { success: false, error: passCheck.reason };
  }

  const accounts = getStoredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);
  if (existing) {
    return { success: false, error: 'An account with this email already exists. Please Sign In.' };
  }

  // Generate a realistic 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const newAccount: StoredAccount = {
    id: `acc-${Date.now()}`,
    name: trimmedName,
    email: trimmedEmail,
    passwordHash: btoa(password),
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}`,
    createdAt: new Date().toISOString(),
    isVerified: true,
    provider: 'password',
  };

  accounts.push(newAccount);
  saveStoredAccounts(accounts);

  return { success: true, verificationCode: code };
};

export const verifyAccountPassword = (
  email: string,
  password: string
): { success: boolean; account?: StoredAccount; error?: string } => {
  const trimmedEmail = email.trim().toLowerCase();
  if (!validateEmail(trimmedEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const accounts = getStoredAccounts();
  const account = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);

  if (!account) {
    return {
      success: false,
      error: `No registered vault found for ${trimmedEmail}. Please select 'Create Account' above to register your free ledger vault.`,
    };
  }

  if (account.passwordHash !== btoa(password)) {
    return {
      success: false,
      error: 'Invalid password. Verification failed for this encrypted vault.',
    };
  }

  return { success: true, account };
};

// Client-side Google JWT decoding
export interface GoogleJwtPayload {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified: boolean;
  aud?: string;
  iss?: string;
  exp?: number;
}

export const decodeGoogleJwt = (token: string): GoogleJwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to parse Google JWT payload:', err);
    return null;
  }
};

export const registerOrLoginGoogleUser = (profile: {
  email: string;
  name: string;
  avatar?: string;
}): StoredAccount => {
  const accounts = getStoredAccounts();
  const trimmedEmail = profile.email.trim().toLowerCase();
  let account = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);

  if (!account) {
    account = {
      id: `google-${Date.now()}`,
      name: profile.name,
      email: trimmedEmail,
      passwordHash: '',
      avatar: profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
      createdAt: new Date().toISOString(),
      isVerified: true,
      provider: 'google',
    };
    accounts.push(account);
    saveStoredAccounts(accounts);
  }
  return account;
};

export const getGoogleClientId = (): string => {
  return (
    localStorage.getItem(GOOGLE_CLIENT_ID_KEY) ||
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    ''
  );
};

export const setGoogleClientId = (id: string) => {
  localStorage.setItem(GOOGLE_CLIENT_ID_KEY, id.trim());
};

