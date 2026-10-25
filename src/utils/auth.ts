import { TreasurySettings } from '../types';

export interface StoredAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // Base64 encoded hash
  avatar?: string;
  createdAt: string;
  isVerified: boolean;
  provider: 'password' | 'google' | 'sso';
  googleConnected?: boolean;
  googleEmail?: string;
  treasurySettings?: TreasurySettings;
}

const STORAGE_KEY = 'flows_registered_vaults_v1';
const GOOGLE_CLIENT_ID_KEY = 'flows_google_client_id';
const PURGE_FLAG_KEY = 'flows_purged_legacy_bogus_v3';

// Clean database: no hardcoded bogus accounts!
const DEFAULT_ACCOUNTS: StoredAccount[] = [];

/**
 * Automatically purge any legacy bogus accounts (e.g. Shaardul Kulkarni with hardcoded ₹1,42,850)
 * from localStorage so that the app starts completely clean.
 */
export const purgeLegacyBogusData = () => {
  if (typeof window === 'undefined') return;
  try {
    const alreadyPurged = localStorage.getItem(PURGE_FLAG_KEY);
    if (alreadyPurged === 'true') return;

    const rawVaults = localStorage.getItem(STORAGE_KEY);
    const rawUsers = localStorage.getItem('flows_users_v1');
    const rawExpenses = localStorage.getItem('flows_expenses_v1');

    const hasBogusUser =
      (rawVaults && rawVaults.includes('user-shaardul')) ||
      (rawUsers && rawUsers.includes('user-shaardul')) ||
      (rawVaults && rawVaults.includes('shaardul.k@gmail.com'));
    
    const hasBogusExpenses =
      rawExpenses &&
      (rawExpenses.includes('exp-swiggy') || rawExpenses.includes('Mainland China'));

    if (hasBogusUser || hasBogusExpenses) {
      console.log('Purging legacy bogus accounts and mock transactions from database...');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('flows_users_v1');
      localStorage.removeItem('flows_groups_v1');
      localStorage.removeItem('flows_expenses_v1');
      localStorage.removeItem('flows_settlements_v1');
      localStorage.removeItem('flows_auth_v1');
      localStorage.removeItem('flows_treasury_settings_v1');
    }

    localStorage.setItem(PURGE_FLAG_KEY, 'true');
  } catch (err) {
    console.warn('Notice while inspecting legacy data:', err);
  }
};

export const getStoredAccounts = (): StoredAccount[] => {
  try {
    purgeLegacyBogusData();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed: StoredAccount[] = JSON.parse(raw);
    // Filter out any lingering bogus user-shaardul records
    const cleaned = parsed.filter(
      (a) => a.id !== 'user-shaardul' && a.id !== 'user-shaardul-work' && a.email !== 'shaardul.k@gmail.com'
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
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
  password: string,
  googleInfo?: { googleConnected: boolean; googleEmail?: string; avatar?: string }
): { success: boolean; account?: StoredAccount; error?: string } => {
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

  const newAccount: StoredAccount = {
    id: `acc-${Date.now()}`,
    name: trimmedName,
    email: trimmedEmail,
    passwordHash: btoa(password),
    avatar:
      googleInfo?.avatar ||
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}`,
    createdAt: new Date().toISOString(),
    isVerified: true,
    provider: googleInfo?.googleConnected ? 'google' : 'password',
    googleConnected: !!googleInfo?.googleConnected,
    googleEmail: googleInfo?.googleEmail,
    treasurySettings: {
      bankBalance: 0,
      cashBalance: 0,
      monthlyBudget: 0,
      isSetupComplete: false,
    },
  };

  accounts.push(newAccount);
  saveStoredAccounts(accounts);

  return { success: true, account: newAccount };
};

export const updateAccountTreasury = (email: string, settings: TreasurySettings): boolean => {
  const accounts = getStoredAccounts();
  const trimmed = email.trim().toLowerCase();
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === trimmed);
  if (idx !== -1) {
    accounts[idx].treasurySettings = settings;
    saveStoredAccounts(accounts);
    return true;
  }
  return false;
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
      error: `No registered vault found for ${trimmedEmail}. Please click 'Create Account' above to register your free ledger vault.`,
    };
  }

  if (account.passwordHash && account.passwordHash !== btoa(password)) {
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
      googleConnected: true,
      googleEmail: trimmedEmail,
      treasurySettings: {
        bankBalance: 0,
        cashBalance: 0,
        monthlyBudget: 0,
        isSetupComplete: false,
      },
    };
    accounts.push(account);
    saveStoredAccounts(accounts);
  } else {
    // Ensure googleConnected is updated
    account.googleConnected = true;
    account.googleEmail = trimmedEmail;
    if (profile.avatar) account.avatar = profile.avatar;
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
