import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'flows_supabase_url';
const STORAGE_ANON_KEY = 'flows_supabase_anon_key';

export const getSupabaseConfig = () => {
  const url =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    localStorage.getItem(STORAGE_URL_KEY) ||
    '';
  const anonKey =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    localStorage.getItem(STORAGE_ANON_KEY) ||
    '';
  return {
    url: url.trim(),
    anonKey: anonKey.trim(),
    isConfigured: Boolean(url.trim() && anonKey.trim()),
  };
};

export const setSupabaseConfig = (url: string, anonKey: string) => {
  if (url.trim()) localStorage.setItem(STORAGE_URL_KEY, url.trim());
  if (anonKey.trim()) localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
  supabaseInstance = null; // Reset instance to recreate with new credentials
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

/**
 * Initiates the authentic Google Sign-In OAuth flow via Supabase.
 * This opens Google's official accounts.google.com authentication page.
 */
export const signInWithGoogleOAuth = async (): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      error: 'Supabase credentials not configured. Please supply your Supabase Project URL and Anon Key.',
    };
  }

  try {
    // Current window URL without query/hash for redirect
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
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
      console.warn('Supabase sign out error:', err);
    }
  }
};
