import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'flows_supabase_url';
const STORAGE_ANON_KEY = 'flows_supabase_anon_key';

// Default Supabase project configuration for Flows
const DEFAULT_SUPABASE_URL = 'https://evxhyumselzdvjfhpyzb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2eGh5dW1zZWx6ZHZqZmhweXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI5NTkzNTIsImV4cCI6MjEwODUzNTM1Mn0.fuZ8mW6wSsCBadKUP72VFTfAWfAMgPTv3PccUBm73V8';

/**
 * Normalizes user-provided Supabase URLs.
 * If user pastes dashboard URL: https://supabase.com/dashboard/project/evxhyumselzdvjfhpyzb
 * It extracts the project reference and converts it to https://evxhyumselzdvjfhpyzb.supabase.co
 */
export const normalizeSupabaseUrl = (inputUrl: string): string => {
  let trimmed = (inputUrl || '').trim();
  const dashboardMatch = trimmed.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  if (/^[a-z0-9]{20}$/i.test(trimmed)) {
    return `https://${trimmed}.supabase.co`;
  }
  return trimmed;
};

export const getSupabaseConfig = () => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const rawUrl =
    envUrl ||
    localStorage.getItem(STORAGE_URL_KEY) ||
    DEFAULT_SUPABASE_URL;

  const rawKey =
    envAnonKey ||
    localStorage.getItem(STORAGE_ANON_KEY) ||
    DEFAULT_SUPABASE_ANON_KEY;

  const url = normalizeSupabaseUrl(rawUrl);
  const anonKey = (rawKey || '').trim();

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
};

export const setSupabaseConfig = (url: string, anonKey: string) => {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = anonKey.trim();
  if (cleanUrl) localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
  if (cleanKey) localStorage.setItem(STORAGE_ANON_KEY, cleanKey);
  supabaseInstance = null; // Recreate instance
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (supabaseInstance) return supabaseInstance;

  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return supabaseInstance;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const getSupabaseProjectId = (): string => {
  const { url } = getSupabaseConfig();
  const match = url.match(/https:\/\/([a-zA-Z0-9_-]+)\.supabase\.co/);
  return match ? match[1] : 'evxhyumselzdvjfhpyzb';
};

/**
 * Initiates official Google Sign-In OAuth flow via Supabase.
 * Opens Google's official accounts.google.com authentication page.
 */
export const signInWithGoogleOAuth = async (): Promise<{
  success: boolean;
  error?: string;
  providerNotEnabled?: boolean;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase credentials not configured.',
    };
  }

  try {
    // Current window URL without query/hash for redirect
    const redirectTo = window.location.origin + window.location.pathname;
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true,
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.url) {
      return { success: false, error: 'No authorization URL returned from Supabase.' };
    }

    // Pre-flight check: verify if Google provider is enabled in the Supabase project
    try {
      const probe = await fetch(data.url, { redirect: 'manual' });
      if (probe.status === 400) {
        const text = await probe.text();
        if (text.includes('provider is not enabled') || text.includes('Unsupported provider')) {
          return {
            success: false,
            providerNotEnabled: true,
            error:
              'Google Provider is currently disabled in your Supabase project. Please enable Google under Authentication > Providers.',
          };
        }
      }
    } catch {
      // If probe was blocked by CORS or network, proceed to redirect directly
    }

    // Provider is enabled - navigate directly to Google OAuth
    window.location.assign(data.url);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to initiate Google OAuth with Supabase.' };
  }
};

/**
 * Signs out from Supabase Auth session.
 */
export const signOutSupabase = async () => {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (err) {
      console.warn('Supabase sign out notice:', err);
    }
  }
};
