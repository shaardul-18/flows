import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Expense,
  Group,
  Settlement,
  SimplifiedDebt,
  SplitMethod,
  TreasurySettings,
  User,
} from '../types';
import { INITIAL_EXPENSES, INITIAL_GROUPS, INITIAL_SETTLEMENTS, INITIAL_USERS } from '../data/mockData';
import { calculateEqualSplit, simplifyDebts, toPaisa, fromPaisa } from '../utils/math';
import { purgeLegacyBogusData } from '../utils/auth';
import { getSupabaseClient, signOutSupabase } from '../utils/supabase';

interface AppContextType {
  currentUser: User;
  users: User[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedExpenseForSplit: Expense | null;
  setSelectedExpenseForSplit: (expense: Expense | null) => void;
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  isDesktopMode: boolean;
  setIsDesktopMode: (val: boolean) => void;
  isBalanceHidden: boolean;
  toggleBalanceVisibility: () => void;
  isAuthenticated: boolean;
  isAppInstalled: boolean;
  setAppInstalled: (val: boolean) => void;
  login: (email: string, name?: string) => void;
  loginWithGoogle: (profile: { email: string; name: string; avatar?: string }) => void;
  logout: () => void;

  // Real Treasury Settings & Dynamic Balances
  treasurySettings: TreasurySettings;
  updateTreasurySettings: (settings: Partial<TreasurySettings>) => void;
  totalAvailableTreasury: number;
  totalBankBalance: number;
  totalCashBalance: number;
  
  // Actions
  addExpense: (expense: Omit<Expense, 'id' | 'date'> & { date?: string }) => Expense;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  settleExpenseShare: (expenseId: string, memberId: string) => void;
  recordSettlement: (settlement: Omit<Settlement, 'id' | 'date'>) => void;
  addGroup: (group: Omit<Group, 'id' | 'createdAt'>) => Group;
  addUser: (user: Omit<User, 'id' | 'initials'>) => User;
  resetAllData: () => void;
  
  // Computed Balances & Insights
  totalYouAreOwed: number;
  totalYouOwe: number;
  netBalance: number;
  peerBalances: Record<string, number>;
  simplifiedDebts: SimplifiedDebt[];
  microLeaks: Expense[];
  microLeaksTotal: number;
  monthlyBudget: number;
  monthlySpent: number;
  monthlyRemaining: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'flows_users_v1',
  GROUPS: 'flows_groups_v1',
  EXPENSES: 'flows_expenses_v1',
  SETTLEMENTS: 'flows_settlements_v1',
  DESKTOP_MODE: 'flows_desktop_mode_v1',
  AUTH: 'flows_auth_v1',
  INSTALLED: 'flows_app_installed',
  TREASURY: 'flows_treasury_settings_v1',
};

const DEFAULT_TREASURY_SETTINGS: TreasurySettings = {
  bankBalance: 0,
  cashBalance: 0,
  monthlyBudget: 0,
  upiId: '',
  isSetupComplete: false,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge legacy bogus data on startup
  if (typeof window !== 'undefined') {
    purgeLegacyBogusData();
  }

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GROUPS);
    return saved ? JSON.parse(saved) : INITIAL_GROUPS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [settlements, setSettlements] = useState<Settlement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTLEMENTS);
    return saved ? JSON.parse(saved) : INITIAL_SETTLEMENTS;
  });

  const [treasurySettings, setTreasurySettings] = useState<TreasurySettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TREASURY);
    return saved ? JSON.parse(saved) : DEFAULT_TREASURY_SETTINGS;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedExpenseForSplit, setSelectedExpenseForSplit] = useState<Expense | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Desktop mode: ALWAYS false on mobile screens (<1024px) to prevent layout blowouts
  const [isDesktopMode, setIsDesktopMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return false;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.DESKTOP_MODE);
    return saved ? JSON.parse(saved) : (typeof window !== 'undefined' && window.innerWidth >= 1024);
  });

  // App Installed Detection
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    
    // Check Capacitor native app
    if ((window as any).Capacitor?.isNativePlatform?.()) return true;
    if (window.location.protocol === 'capacitor:' || (window.location.hostname === 'localhost' && !window.location.port)) return true;
    
    // Check Android WebView or Capacitor user agent
    const ua = (window.navigator?.userAgent || '').toLowerCase();
    if (ua.includes('capacitor') || ua.includes('wv') || ua.includes('crosswalk')) return true;

    // Check PWA display modes
    if (window.matchMedia) {
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
      if (window.matchMedia('(display-mode: fullscreen)').matches) return true;
      if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
      if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return true;
    }

    // iOS Safari standalone
    if ((window.navigator as any).standalone === true) return true;
    
    // Android TWA / Installed referrer
    if (document.referrer && document.referrer.includes('android-app://')) return true;
    
    const saved = localStorage.getItem(STORAGE_KEYS.INSTALLED);
    return saved === 'true' || saved === '"true"';
  });

  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Auto-adapt if user resizes or rotates phone
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && isDesktopMode) {
        setIsDesktopMode(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDesktopMode]);

  // Monitor PWA installation events
  useEffect(() => {
    const handleInstalled = () => {
      setIsAppInstalled(true);
      localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
    };
    window.addEventListener('appinstalled', handleInstalled);

    if (window.matchMedia) {
      const mqlStandalone = window.matchMedia('(display-mode: standalone)');
      const mqlFullscreen = window.matchMedia('(display-mode: fullscreen)');
      const handleModeChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          setIsAppInstalled(true);
          localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
        }
      };
      mqlStandalone.addEventListener('change', handleModeChange);
      mqlFullscreen.addEventListener('change', handleModeChange);
      return () => {
        window.removeEventListener('appinstalled', handleInstalled);
        mqlStandalone.removeEventListener('change', handleModeChange);
        mqlFullscreen.removeEventListener('change', handleModeChange);
      };
    }
    return () => window.removeEventListener('appinstalled', handleInstalled);
  }, []);

  const setAppInstalled = (val: boolean) => {
    setIsAppInstalled(val);
    localStorage.setItem(STORAGE_KEYS.INSTALLED, JSON.stringify(val));
  };

  const updateTreasurySettings = (settings: Partial<TreasurySettings>) => {
    setTreasurySettings((prev) => {
      const updated = { ...prev, ...settings };
      localStorage.setItem(STORAGE_KEYS.TREASURY, JSON.stringify(updated));
      return updated;
    });
  };

  const login = (email: string, name?: string) => {
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(true));
    const trimmedEmail = email.trim().toLowerCase();
    const displayName = name || 'User';

    setUsers((prev) => {
      const existingIdx = prev.findIndex((u) => u.email.toLowerCase() === trimmedEmail);
      if (existingIdx !== -1) {
        return prev.map((u, i) =>
          i === existingIdx
            ? { ...u, name: displayName, isCurrentUser: true }
            : { ...u, isCurrentUser: false }
        );
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: displayName,
        email: trimmedEmail,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
        initials: displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
        upiId: treasurySettings.upiId || '',
        isCurrentUser: true,
      };
      return [newUser, ...prev.map((u) => ({ ...u, isCurrentUser: false }))];
    });
  };

  const loginWithGoogle = (googleProfile: { email: string; name: string; avatar?: string }) => {
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(true));
    const trimmedEmail = googleProfile.email.trim().toLowerCase();

    setUsers((prev) => {
      const existingIdx = prev.findIndex((u) => u.email.toLowerCase() === trimmedEmail);
      if (existingIdx !== -1) {
        return prev.map((u, i) =>
          i === existingIdx
            ? {
                ...u,
                name: googleProfile.name,
                avatar: googleProfile.avatar || u.avatar,
                googleConnected: true,
                googleEmail: trimmedEmail,
                isCurrentUser: true,
              }
            : { ...u, isCurrentUser: false }
        );
      }
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: googleProfile.name,
        email: trimmedEmail,
        avatar:
          googleProfile.avatar ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleProfile.name)}`,
        initials: googleProfile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
        upiId: treasurySettings.upiId || '',
        isCurrentUser: true,
        googleConnected: true,
        googleEmail: trimmedEmail,
      };
      return [newUser, ...prev.map((u) => ({ ...u, isCurrentUser: false }))];
    });
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(false));
    signOutSupabase();
  };

  // Listen to Supabase OAuth Google Sign-In redirect and session
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const name =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          (u.email ? u.email.split('@')[0] : 'Google User');
        const avatar = u.user_metadata?.avatar_url || u.user_metadata?.picture;
        if (u.email) {
          loginWithGoogle({ email: u.email, name, avatar });
          setActiveTab('dashboard');
          if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname + '#dashboard');
          }
        }
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        const u = session.user;
        const name =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          (u.email ? u.email.split('@')[0] : 'Google User');
        const avatar = u.user_metadata?.avatar_url || u.user_metadata?.picture;
        if (u.email) {
          loginWithGoogle({ email: u.email, name, avatar });
          setActiveTab('dashboard');
          if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname + '#dashboard');
          }
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
  }, [settlements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DESKTOP_MODE, JSON.stringify(isDesktopMode));
  }, [isDesktopMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TREASURY, JSON.stringify(treasurySettings));
  }, [treasurySettings]);

  const currentUser = useMemo(() => {
    const found = users.find((u) => u.isCurrentUser) || users[0];
    if (found) return found;
    return {
      id: 'guest',
      name: 'Flows User',
      email: '',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Flows',
      initials: 'FU',
      upiId: treasurySettings.upiId || '',
      isCurrentUser: true,
    };
  }, [users, treasurySettings.upiId]);

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden((prev) => !prev);
  };

  // Add new expense
  const addExpense = (newExpData: Omit<Expense, 'id' | 'date'> & { date?: string }) => {
    const id = `exp-${Date.now()}`;
    const date = newExpData.date || new Date().toISOString();
    const isMicroLeak = newExpData.amount <= 200 || newExpData.category === 'Micro-Leak';

    const newExpense: Expense = {
      ...newExpData,
      id,
      date,
      isMicroLeak,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  const settleExpenseShare = (expenseId: string, memberId: string) => {
    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.id !== expenseId) return exp;
        const updatedSplits = exp.splits.map((s) =>
          s.memberId === memberId
            ? { ...s, isSettled: true, settledAt: new Date().toISOString() }
            : s
        );
        const allSettled = updatedSplits.every((s) => s.isSettled);
        return {
          ...exp,
          splits: updatedSplits,
          status: allSettled ? 'settled' : 'pending',
        };
      })
    );
  };

  const recordSettlement = (data: Omit<Settlement, 'id' | 'date'>) => {
    const id = `stl-${Date.now()}`;
    const date = new Date().toISOString();
    const newSettlement: Settlement = {
      ...data,
      id,
      date,
    };

    setSettlements((prev) => [newSettlement, ...prev]);

    // Also mark corresponding expenses as settled if exact match
    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.payerId === data.toMemberId) {
          const split = exp.splits.find((s) => s.memberId === data.fromMemberId && !s.isSettled);
          if (split && split.amount <= data.amount) {
            const updatedSplits = exp.splits.map((s) =>
              s.memberId === data.fromMemberId
                ? { ...s, isSettled: true, settledAt: date }
                : s
            );
            return {
              ...exp,
              splits: updatedSplits,
              status: updatedSplits.every((s) => s.isSettled) ? 'settled' : 'pending',
            };
          }
        }
        return exp;
      })
    );
  };

  const addGroup = (data: Omit<Group, 'id' | 'createdAt'>) => {
    const newGroup: Group = {
      ...data,
      id: `group-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setGroups((prev) => [...prev, newGroup]);
    return newGroup;
  };

  const addUser = (userData: Omit<User, 'id' | 'initials'>) => {
    const id = `user-${Date.now()}`;
    const initials = userData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const newUser: User = {
      ...userData,
      id,
      initials,
    };

    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  const resetAllData = () => {
    localStorage.clear();
    setUsers([]);
    setGroups([]);
    setExpenses([]);
    setSettlements([]);
    setTreasurySettings(DEFAULT_TREASURY_SETTINGS);
    setIsAuthenticated(false);
  };

  // Dynamic Peer Balances & Debt Simplification
  const { totalYouAreOwed, totalYouOwe, peerBalances } = useMemo(() => {
    let owedToYouPaisa = 0;
    let youOwePaisa = 0;
    const peerBalanceMap: Record<string, number> = {};

    users.forEach((u) => {
      peerBalanceMap[u.id] = 0;
    });

    expenses.forEach((exp) => {
      if (exp.status === 'settled') return;

      const payerId = exp.payerId;
      const isCurrentUserPayer = payerId === currentUser.id;

      exp.splits.forEach((split) => {
        if (split.isSettled) return;
        const memberId = split.memberId;
        const amountPaisa = toPaisa(split.amount);

        if (payerId === memberId) return;

        if (isCurrentUserPayer) {
          owedToYouPaisa += amountPaisa;
          peerBalanceMap[memberId] = (peerBalanceMap[memberId] || 0) + amountPaisa;
        } else if (memberId === currentUser.id) {
          youOwePaisa += amountPaisa;
          peerBalanceMap[payerId] = (peerBalanceMap[payerId] || 0) - amountPaisa;
        } else {
          peerBalanceMap[memberId] = (peerBalanceMap[memberId] || 0) + amountPaisa;
          peerBalanceMap[payerId] = (peerBalanceMap[payerId] || 0) - amountPaisa;
        }
      });
    });

    settlements.forEach((s) => {
      const amountPaisa = toPaisa(s.amount);
      if (s.fromMemberId === currentUser.id) {
        peerBalanceMap[s.toMemberId] = (peerBalanceMap[s.toMemberId] || 0) + amountPaisa;
      }
    });

    const peerBalancesInRupees: Record<string, number> = {};
    Object.keys(peerBalanceMap).forEach((id) => {
      peerBalancesInRupees[id] = fromPaisa(peerBalanceMap[id]);
    });

    return {
      totalYouAreOwed: fromPaisa(owedToYouPaisa),
      totalYouOwe: fromPaisa(youOwePaisa),
      peerBalances: peerBalancesInRupees,
    };
  }, [expenses, settlements, currentUser, users]);

  const netBalance = useMemo(() => {
    return totalYouAreOwed - totalYouOwe;
  }, [totalYouAreOwed, totalYouOwe]);

  const simplifiedDebts = useMemo(() => {
    const allUserIds = users.map((u) => u.id);
    return simplifyDebts(allUserIds, peerBalances);
  }, [users, peerBalances]);

  const microLeaks = useMemo(() => {
    return expenses.filter(
      (exp) => exp.payerId === currentUser.id && (exp.isMicroLeak || exp.amount <= 200)
    );
  }, [expenses, currentUser]);

  const microLeaksTotal = useMemo(() => {
    return microLeaks.reduce((sum, exp) => sum + exp.amount, 0);
  }, [microLeaks]);

  // Real Dynamic Treasury Calculations based on User's Actual Starting Funds
  const totalBankExpenses = useMemo(() => {
    return expenses
      .filter((exp) => exp.payerId === currentUser.id && exp.paymentRail !== 'CASH')
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses, currentUser.id]);

  const totalBankSettlementsReceived = useMemo(() => {
    return settlements
      .filter((s) => s.toMemberId === currentUser.id && s.paymentRail !== 'CASH')
      .reduce((sum, s) => sum + s.amount, 0);
  }, [settlements, currentUser.id]);

  const totalBankBalance = useMemo(() => {
    const base = treasurySettings.bankBalance || 0;
    return Math.max(0, base - totalBankExpenses + totalBankSettlementsReceived);
  }, [treasurySettings.bankBalance, totalBankExpenses, totalBankSettlementsReceived]);

  const totalCashExpenses = useMemo(() => {
    return expenses
      .filter((exp) => exp.payerId === currentUser.id && exp.paymentRail === 'CASH')
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses, currentUser.id]);

  const totalCashSettlementsReceived = useMemo(() => {
    return settlements
      .filter((s) => s.toMemberId === currentUser.id && s.paymentRail === 'CASH')
      .reduce((sum, s) => sum + s.amount, 0);
  }, [settlements, currentUser.id]);

  const totalCashBalance = useMemo(() => {
    const base = treasurySettings.cashBalance || 0;
    return Math.max(0, base - totalCashExpenses + totalCashSettlementsReceived);
  }, [treasurySettings.cashBalance, totalCashExpenses, totalCashSettlementsReceived]);

  const totalAvailableTreasury = useMemo(() => {
    return totalBankBalance + totalCashBalance;
  }, [totalBankBalance, totalCashBalance]);

  const monthlyBudget = treasurySettings.monthlyBudget || 0;
  const monthlySpent = useMemo(() => {
    return expenses
      .filter((exp) => exp.payerId === currentUser.id)
      .reduce((sum, exp) => {
        const mySplit = exp.splits.find((s) => s.memberId === currentUser.id);
        const myAmount = mySplit ? mySplit.amount : exp.amount;
        return sum + myAmount;
      }, 0);
  }, [expenses, currentUser.id]);

  const monthlyRemaining = Math.max(0, monthlyBudget - monthlySpent);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        groups,
        expenses,
        settlements,
        activeTab,
        setActiveTab,
        selectedExpenseForSplit,
        setSelectedExpenseForSplit,
        selectedGroupId,
        setSelectedGroupId,
        isDesktopMode,
        setIsDesktopMode,
        isBalanceHidden,
        toggleBalanceVisibility,
        isAuthenticated,
        isAppInstalled,
        setAppInstalled,
        login,
        loginWithGoogle,
        logout,
        treasurySettings,
        updateTreasurySettings,
        totalAvailableTreasury,
        totalBankBalance,
        totalCashBalance,
        addExpense,
        updateExpense,
        deleteExpense,
        settleExpenseShare,
        recordSettlement,
        addGroup,
        addUser,
        resetAllData,
        totalYouAreOwed,
        totalYouOwe,
        netBalance,
        peerBalances,
        simplifiedDebts,
        microLeaks,
        microLeaksTotal,
        monthlyBudget,
        monthlySpent,
        monthlyRemaining,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
