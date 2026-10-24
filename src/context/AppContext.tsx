import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Expense,
  Group,
  Settlement,
  SimplifiedDebt,
  SplitMethod,
  User,
} from '../types';
import { INITIAL_EXPENSES, INITIAL_GROUPS, INITIAL_SETTLEMENTS, INITIAL_USERS } from '../data/mockData';
import { calculateEqualSplit, simplifyDebts, toPaisa, fromPaisa } from '../utils/math';

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
  login: (email: string, name?: string) => void;
  logout: () => void;
  
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
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedExpenseForSplit, setSelectedExpenseForSplit] = useState<Expense | null>(INITIAL_EXPENSES[0]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isDesktopMode, setIsDesktopMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DESKTOP_MODE);
    return saved ? JSON.parse(saved) : (typeof window !== 'undefined' && window.innerWidth >= 1024);
  });
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const login = (email: string, name?: string) => {
    setIsAuthenticated(true);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(true));
    if (name) {
      setUsers((prev) =>
        prev.map((u) => (u.isCurrentUser ? { ...u, name, email } : u))
      );
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(false));
  };

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

  const currentUser = useMemo(() => {
    return users.find((u) => u.isCurrentUser) || users[0];
  }, [users]);

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden((prev) => !prev);
  };

  // Add new expense
  const addExpense = (newExpData: Omit<Expense, 'id' | 'date'> & { date?: string }) => {
    const id = `exp-${Date.now()}`;
    const date = newExpData.date || new Date().toISOString();
    const isMicroLeak = newExpData.amount <= 200 || newExpData.category === 'Micro-Leak';

    const completeExpense: Expense = {
      ...newExpData,
      id,
      date,
      isMicroLeak: newExpData.isMicroLeak ?? isMicroLeak,
    };

    setExpenses((prev) => [completeExpense, ...prev]);
    return completeExpense;
  };

  // Update expense
  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    );
    if (selectedExpenseForSplit?.id === id) {
      setSelectedExpenseForSplit((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  // Delete expense
  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    if (selectedExpenseForSplit?.id === id) {
      setSelectedExpenseForSplit(null);
    }
  };

  // Settle individual expense share
  const settleExpenseShare = (expenseId: string, memberId: string) => {
    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.id !== expenseId) return exp;
        const newSplits = exp.splits.map((s) =>
          s.memberId === memberId
            ? { ...s, isSettled: true, settledAt: new Date().toISOString() }
            : s
        );
        const allSettled = newSplits.every((s) => s.isSettled);
        return {
          ...exp,
          splits: newSplits,
          status: allSettled ? 'settled' : exp.status,
        };
      })
    );
  };

  // Record a peer settlement
  const recordSettlement = (settlementData: Omit<Settlement, 'id' | 'date'>) => {
    const newSettlement: Settlement = {
      ...settlementData,
      id: `settle-${Date.now()}`,
      date: new Date().toISOString(),
    };

    setSettlements((prev) => [newSettlement, ...prev]);

    // Automatically mark matching pending splits between these two members as settled
    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.payerId === settlementData.toMemberId) {
          const updatedSplits = exp.splits.map((s) => {
            if (s.memberId === settlementData.fromMemberId && !s.isSettled) {
              return { ...s, isSettled: true, settledAt: new Date().toISOString() };
            }
            return s;
          });
          const allSettled = updatedSplits.every((s) => s.isSettled);
          return { ...exp, splits: updatedSplits, status: allSettled ? 'settled' : exp.status };
        }
        return exp;
      })
    );
  };

  // Add group
  const addGroup = (groupData: Omit<Group, 'id' | 'createdAt'>): Group => {
    const newGroup: Group = {
      ...groupData,
      id: `group-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setGroups((prev) => [...prev, newGroup]);
    return newGroup;
  };

  // Add contact user
  const addUser = (userData: Omit<User, 'id' | 'initials'>): User => {
    const initials = userData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      initials,
    };
    setUsers((prev) => [...prev, newUser]);
    return newUser;
  };

  // Reset to initial
  const resetAllData = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setGroups(INITIAL_GROUPS);
    setExpenses(INITIAL_EXPENSES);
    setSettlements(INITIAL_SETTLEMENTS);
    setSelectedExpenseForSplit(INITIAL_EXPENSES[0]);
  };

  // Computed: Real-time net balances
  const { totalYouAreOwed, totalYouOwe, peerBalances } = useMemo(() => {
    let owedToYouPaisa = 0;
    let youOwePaisa = 0;
    const peerBalanceMap: Record<string, number> = {}; // in paisa: >0 means peer owes currentUser

    users.forEach((u) => {
      if (u.id !== currentUser.id) {
        peerBalanceMap[u.id] = 0;
      }
    });

    expenses.forEach((exp) => {
      if (exp.status === 'settled') return;

      const payerIsCurrent = exp.payerId === currentUser.id;

      exp.splits.forEach((split) => {
        if (split.isSettled) return;

        if (payerIsCurrent && split.memberId !== currentUser.id) {
          // Others owe currentUser
          const sharePaisa = toPaisa(split.amount);
          owedToYouPaisa += sharePaisa;
          peerBalanceMap[split.memberId] = (peerBalanceMap[split.memberId] || 0) + sharePaisa;
        } else if (!payerIsCurrent && split.memberId === currentUser.id) {
          // CurrentUser owes the payer
          const sharePaisa = toPaisa(split.amount);
          youOwePaisa += sharePaisa;
          peerBalanceMap[exp.payerId] = (peerBalanceMap[exp.payerId] || 0) - sharePaisa;
        }
      });
    });

    // Account for direct settlements
    settlements.forEach((s) => {
      if (!s.isConfirmed) return;
      const amountPaisa = toPaisa(s.amount);
      if (s.toMemberId === currentUser.id && s.fromMemberId !== currentUser.id) {
        // Someone paid currentUser
        peerBalanceMap[s.fromMemberId] = (peerBalanceMap[s.fromMemberId] || 0) - amountPaisa;
      } else if (s.fromMemberId === currentUser.id && s.toMemberId !== currentUser.id) {
        // CurrentUser paid someone
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

  // Computed simplified debts
  const simplifiedDebts = useMemo(() => {
    const allUserIds = users.map((u) => u.id);
    return simplifyDebts(allUserIds, peerBalances);
  }, [users, peerBalances]);

  // Micro-leaks detection
  const microLeaks = useMemo(() => {
    return expenses.filter(
      (exp) => exp.payerId === currentUser.id && (exp.isMicroLeak || exp.amount <= 200)
    );
  }, [expenses, currentUser]);

  const microLeaksTotal = useMemo(() => {
    return microLeaks.reduce((sum, exp) => sum + exp.amount, 0);
  }, [microLeaks]);

  // Monthly budget
  const monthlyBudget = 50000;
  const monthlySpent = useMemo(() => {
    // Current month expenses paid by currentUser
    return expenses
      .filter((exp) => exp.payerId === currentUser.id)
      .reduce((sum, exp) => {
        // Find current user's personal share
        const mySplit = exp.splits.find((s) => s.memberId === currentUser.id);
        const myAmount = mySplit ? mySplit.amount : exp.amount;
        return sum + myAmount;
      }, 0);
  }, [expenses, currentUser]);

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
        login,
        logout,
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
