

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { AppState, DashboardType, Transaction, Account, Category, SubCategory, Notification, DashboardData, TrashedTransaction, Budget, WidgetSettings, User, ThemeConfig, AppContextType } from '../types';
import { INITIAL_APP_STATE, PALETTES, CATEGORY_COLORS } from '../constants';

const USERS_STORAGE_KEY = 'finance-app-users';
const SESSION_STORAGE_KEY = 'finance-app-session';
const DATA_STORAGE_KEY_PREFIX = 'finance-app-data-';

const hexToRgb = (hex: string) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) { // #f03
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) { // #ff0033
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
  return `${r} ${g} ${b}`;
};

const applyTheme = (theme: ThemeConfig) => {
    // Mode
    document.documentElement.classList.toggle('dark', theme.mode === 'dark');
    // Palette
    const palette = PALETTES[theme.palette];
    const root = document.documentElement;
    for (const [shade, color] of Object.entries(palette)) {
      root.style.setProperty(`--color-primary-${shade}`, hexToRgb(color));
    }
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(INITIAL_APP_STATE);
  const [isReady, setIsReady] = useState(false);

  const removeNotification = useCallback((id: number) => {
    setState(s => ({ ...s, notifications: s.notifications.filter(n => n.id !== id) }));
  }, []);
  
  const addNotification = useCallback((
      message: string,
      type: 'success' | 'error' | 'info' = 'info',
      actionDetails?: { label: string; onClick: () => void }
  ) => {
      const id = Date.now();
      const notification: Notification = { id, message, type };
      
      if (actionDetails) {
          notification.action = {
              label: actionDetails.label,
              onClick: () => {
                  actionDetails.onClick();
                  removeNotification(id);
              }
          };
      }
      
      const duration = actionDetails ? 7000 : 5000;
      setState(s => ({ ...s, notifications: [...s.notifications, notification] }));
      setTimeout(() => removeNotification(id), duration);
  }, [removeNotification]);

  const loadUserData = useCallback((user: User) => {
    const userDataKey = `${DATA_STORAGE_KEY_PREFIX}${user.email}`;
    const userDataString = localStorage.getItem(userDataKey);
    let userData;

    const cleanupData = (data: DashboardData | undefined, type: DashboardType): DashboardData => {
        // If data from storage is faulty, start fresh for that dashboard type.
        if (!data || typeof data !== 'object') {
            return INITIAL_APP_STATE[type];
        }

        // Ensure top-level arrays exist, falling back to an empty array.
        const sanitized: DashboardData = {
            accounts: Array.isArray(data.accounts) ? data.accounts : [],
            transactions: Array.isArray(data.transactions) ? data.transactions : [],
            categories: Array.isArray(data.categories) ? data.categories : [],
            trash: Array.isArray(data.trash) ? data.trash : [],
            trashedAccounts: Array.isArray(data.trashedAccounts) ? data.trashedAccounts : [],
            budgets: Array.isArray(data.budgets) ? data.budgets : [],
            widgetSettings: { ...INITIAL_APP_STATE[type].widgetSettings, ...(data.widgetSettings || {})},
        };

        // Deeper sanitation for nested structures
        sanitized.categories = sanitized.categories.map(c => ({
            ...c,
            subcategories: Array.isArray(c.subcategories) ? c.subcategories : []
        }));

        sanitized.transactions = sanitized.transactions.map(t => ({
            ...t,
            tags: Array.isArray(t.tags) ? t.tags : []
        }));

        // Now, run the time-based cleanup on sanitized data.
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        sanitized.trash = sanitized.trash.filter(item => item && item.transaction && item.deletedAt > sevenDaysAgo);

        const expiredTrashedAccounts = sanitized.trashedAccounts.filter(item => item && item.account && item.deletedAt <= sevenDaysAgo);
        sanitized.trashedAccounts = sanitized.trashedAccounts.filter(item => item && item.account && item.deletedAt > sevenDaysAgo);

        if (expiredTrashedAccounts.length > 0) {
            const expiredAccountIds = new Set(expiredTrashedAccounts.map(item => item.account.id));
            sanitized.transactions = sanitized.transactions.filter(t => !expiredAccountIds.has(t.accountId));
        }

        sanitized.accounts = sanitized.accounts.map(acc => ({...acc, isArchived: acc.isArchived ?? false }));

        return sanitized;
    };

    if (userDataString) {
      userData = JSON.parse(userDataString);
      userData.personal = cleanupData(userData.personal, 'personal');
      userData.home = cleanupData(userData.home, 'home');
      userData.theme = userData.theme || INITIAL_APP_STATE.theme;
      
    } else {
        const { currentUser, notifications, activeDashboard, ...initialData } = INITIAL_APP_STATE;
        userData = initialData;
    }
    
    applyTheme(userData.theme);

    setState({
        ...userData,
        currentUser: user,
        activeDashboard: userData.activeDashboard || null,
        notifications: [],
    });
  }, [addNotification]);

  useEffect(() => {
    try {
        const storedUsersString = localStorage.getItem(USERS_STORAGE_KEY);
        const loadedUsers = storedUsersString ? JSON.parse(storedUsersString) : [];

        const session = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (session) {
            const { email } = JSON.parse(session);
            const user = loadedUsers.find((u: User) => u.email === email);
            if (user) {
                loadUserData(user);
            } else {
                // Session exists for a user that doesn't exist anymore. Clean up.
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
        }
    } catch (error) {
        console.error("Failed to initialize from storage", error);
    } finally {
        setIsReady(true);
    }
  }, [loadUserData]);

  const saveUserData = useCallback((stateToSave: AppState) => {
    if (stateToSave.currentUser) {
        const { currentUser, notifications, ...data } = stateToSave;
        localStorage.setItem(`${DATA_STORAGE_KEY_PREFIX}${currentUser.email}`, JSON.stringify(data));
    }
  }, []);
  
  useEffect(() => {
    if (isReady && state.currentUser) {
      saveUserData(state);
    }
  }, [state, isReady, saveUserData]);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    const storedUsers: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    if (storedUsers.some(u => u.email === email)) {
        addNotification('User with this email already exists.', 'error');
        return false;
    }
    const newUser: User = { id: `user-${Date.now()}`, name, email, password, needsOnboarding: true };
    const newUsers = [...storedUsers, newUser];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newUsers));

    const { currentUser, notifications, ...initialData } = INITIAL_APP_STATE;
    localStorage.setItem(`${DATA_STORAGE_KEY_PREFIX}${email}`, JSON.stringify(initialData));
    
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ email: newUser.email }));
    loadUserData(newUser);
    
    addNotification(`Registration successful! Welcome, ${name}.`, 'success');
    return true;
  }, [addNotification, loadUserData]);
  
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const storedUsers: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    const user = storedUsers.find(u => u.email === email && u.password === password);
    if (user) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ email: user.email }));
        loadUserData(user);
        // Force dashboard selection after every login
        setState(s => ({...s, activeDashboard: null}));
        return true;
    } else {
        addNotification('Invalid email or password.', 'error');
        return false;
    }
  }, [loadUserData, addNotification]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setState({ ...INITIAL_APP_STATE, currentUser: null, activeDashboard: null });
    applyTheme(INITIAL_APP_STATE.theme);
  }, []);

  const completeOnboarding = useCallback(() => {
    setState(s => {
        if (!s.currentUser) return s;

        const updatedUser = { ...s.currentUser, needsOnboarding: false };

        try {
            const storedUsers: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
            const userIndex = storedUsers.findIndex(u => u.id === updatedUser.id);

            if (userIndex > -1) {
                storedUsers[userIndex] = updatedUser;
                localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(storedUsers));
            }
        } catch (error) {
            console.error("Failed to update user onboarding status in storage", error);
        }

        return { ...s, currentUser: updatedUser };
    });
  }, []);
  
  const selectDashboard = useCallback((type: DashboardType) => {
    setState(s => ({ ...s, activeDashboard: type }));
  }, []);

  const activeDashboardData = useMemo<DashboardData>(() => {
    if (!state.activeDashboard) {
      return { accounts: [], transactions: [], categories: [], trash: [], trashedAccounts: [], budgets: [], widgetSettings: INITIAL_APP_STATE.personal.widgetSettings };
    }
    const data = state[state.activeDashboard];
    return {
      ...data,
      accounts: data.accounts.filter(acc => !acc.isArchived)
    };
  }, [state.activeDashboard, state.personal, state.home]);


  const modifyDashboardData = useCallback((modifier: (data: DashboardData) => DashboardData, dashboard: DashboardType) => {
      setState(s => ({
        ...s,
        [dashboard]: modifier(s[dashboard])
      }));
  }, []);

  const modifyActiveDashboardData = useCallback((modifier: (data: DashboardData) => DashboardData) => {
    if (state.activeDashboard) {
        modifyDashboardData(modifier, state.activeDashboard);
    }
  }, [state.activeDashboard, modifyDashboardData]);
  
  const addTransaction = useCallback((transaction: Omit<Transaction, 'id'>) => {
    modifyActiveDashboardData(data => ({
      ...data,
      transactions: [...data.transactions, { ...transaction, id: `txn-${Date.now()}` }]
    }));
    addNotification('Transaction added successfully.', 'success');
  }, [modifyActiveDashboardData, addNotification]);
  
  const addInterDashboardTransfer = useCallback((details: { fromAccountId: string; toAccountId: string; amount: number; date: string; notes?: string; fromDashboard: DashboardType; toDashboard: DashboardType; }) => {
    const { fromAccountId, toAccountId, amount, date, notes, fromDashboard, toDashboard } = details;
    const transferAmount = Math.abs(amount);
    const uniqueIdPart = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    modifyDashboardData(data => {
        const fromAccount = data.accounts.find(a => a.id === fromAccountId);
        if (!fromAccount) return data;
        const newTx: Omit<Transaction, 'id'> = {
            accountId: fromAccountId,
            date: new Date(date).toISOString(),
            description: `Transfer to ${toDashboard.charAt(0).toUpperCase() + toDashboard.slice(1)}`,
            amount: -transferAmount,
            notes,
            isTransfer: true,
        };
        return {
            ...data,
            transactions: [...data.transactions, { ...newTx, id: `txn-${uniqueIdPart}-from` }]
        };
    }, fromDashboard);
    
    modifyDashboardData(data => {
        const toAccount = data.accounts.find(a => a.id === toAccountId);
        if (!toAccount) return data;
         const newTx: Omit<Transaction, 'id'> = {
            accountId: toAccountId,
            date: new Date(date).toISOString(),
            description: `Transfer from ${fromDashboard.charAt(0).toUpperCase() + fromDashboard.slice(1)}`,
            amount: transferAmount,
            notes,
            isTransfer: true,
        };
        return {
            ...data,
            transactions: [...data.transactions, { ...newTx, id: `txn-${uniqueIdPart}-to` }]
        };
    }, toDashboard);

    addNotification('Transfer completed successfully.', 'success');
  }, [modifyDashboardData, addNotification]);

  const addTransfer = useCallback((details: { fromAccountId: string, toAccountId: string, amount: number, date: string, notes?: string}) => {
    const { fromAccountId, toAccountId, amount, date, notes } = details;
    
    modifyActiveDashboardData(data => {
      const fromAccount = data.accounts.find(a => a.id === fromAccountId);
      const toAccount = data.accounts.find(a => a.id === toAccountId);

      if (!fromAccount || !toAccount) {
        addNotification("One or both accounts in the transfer could not be found.", "error");
        return data;
      }
      
      const transferAmount = Math.abs(amount);
      const uniqueIdPart = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const newTransactions: Transaction[] = [
        {
          id: `txn-${uniqueIdPart}-from`,
          accountId: fromAccountId,
          date: new Date(date).toISOString(),
          description: `Transfer to ${toAccount.name}`,
          amount: -transferAmount,
          notes: notes,
          isTransfer: true,
        },
        {
          id: `txn-${uniqueIdPart}-to`,
          accountId: toAccountId,
          date: new Date(date).toISOString(),
          description: `Transfer from ${fromAccount.name}`,
          amount: transferAmount,
          notes: notes,
          isTransfer: true,
        }
      ];

      return {
          ...data,
          transactions: [...data.transactions, ...newTransactions]
      };
    });

    addNotification('Transfer completed successfully.', 'success');
  }, [modifyActiveDashboardData, addNotification]);

  const addMultipleTransactions = useCallback((transactions: Omit<Transaction, 'id'>[]) => {
    if (transactions.length === 0) return;
    
    modifyActiveDashboardData(data => {
        const newTransactions = transactions.map(t => ({
            ...t,
            id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        }));
        
        return {
            ...data,
            transactions: [...data.transactions, ...newTransactions]
        };
    });
}, [modifyActiveDashboardData]);

  const updateTransaction = useCallback((updatedTxn: Transaction) => {
    modifyActiveDashboardData(data => ({
      ...data,
      transactions: data.transactions.map(t => t.id === updatedTxn.id ? updatedTxn : t)
    }));
     addNotification('Transaction updated successfully.', 'success');
  }, [modifyActiveDashboardData, addNotification]);
  
  const restoreTransactions = useCallback((transactionIds: string[]) => {
    if (transactionIds.length === 0) return;

    modifyActiveDashboardData(data => {
        const itemsToRestore: Transaction[] = [];
        const trashToKeep = (data.trash || []).filter(item => {
            if (transactionIds.includes(item.transaction.id)) {
                itemsToRestore.push(item.transaction);
                return false;
            }
            return true;
        });
        
        const restoredTransactions = [...data.transactions, ...itemsToRestore]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
            ...data,
            transactions: restoredTransactions,
            trash: trashToKeep,
        };
    });
    addNotification(`${transactionIds.length} transaction(s) restored.`, 'success');
  }, [modifyActiveDashboardData, addNotification]);

  const deleteMultipleTransactions = useCallback((transactionIds: string[]) => {
    if (transactionIds.length === 0) return;

    modifyActiveDashboardData(data => {
      const itemsToTrash: TrashedTransaction[] = [];
      const transactionsToKeep = data.transactions.filter(t => {
        if (transactionIds.includes(t.id)) {
          itemsToTrash.push({ transaction: t, deletedAt: new Date().toISOString() });
          return false;
        }
        return true;
      });

      const currentTrash = data.trash || [];
      return {
        ...data,
        transactions: transactionsToKeep,
        trash: [...currentTrash, ...itemsToTrash]
      };
    });
    addNotification(
      `${transactionIds.length} transaction(s) moved to Trash.`,
      'success',
      {
        label: 'Undo',
        onClick: () => restoreTransactions(transactionIds)
      }
    );
  }, [modifyActiveDashboardData, addNotification, restoreTransactions]);

  const deleteTransaction = useCallback((transactionId: string) => {
    deleteMultipleTransactions([transactionId]);
  }, [deleteMultipleTransactions]);

  const permanentlyDeleteTransactions = useCallback((transactionIds: string[]) => {
    if (transactionIds.length === 0) return;
    
    modifyActiveDashboardData(data => {
        const trashToKeep = (data.trash || []).filter(item => !transactionIds.includes(item.transaction.id));
        return {
            ...data,
            trash: trashToKeep
        };
    });
    addNotification(`${transactionIds.length} transaction(s) permanently deleted.`, 'success');
  }, [modifyActiveDashboardData, addNotification]);

  const emptyTrash = useCallback(() => {
    modifyActiveDashboardData(data => ({
        ...data,
        trash: []
    }));
    addNotification('Trash has been emptied.', 'success');
  }, [modifyActiveDashboardData, addNotification]);

  const updateMultipleTransactions = useCallback((transactionIds: string[], updates: Partial<Pick<Transaction, 'categoryId' | 'subCategoryId' | 'notes' | 'classification'>>) => {
    modifyActiveDashboardData(data => ({
        ...data,
        transactions: data.transactions.map(t => 
            transactionIds.includes(t.id) ? { ...t, ...updates } : t
        )
    }));
    addNotification(`${transactionIds.length} transaction(s) updated.`, 'success');
  }, [modifyActiveDashboardData, addNotification]);

  const updateMultipleIndividualTransactions = useCallback((transactionsToUpdate: Transaction[]) => {
    modifyActiveDashboardData(data => {
        const updatesMap = new Map(transactionsToUpdate.map(t => [t.id, t]));
        const newTransactions = data.transactions.map(t => updatesMap.get(t.id) || t);
        return {
            ...data,
            transactions: newTransactions,
        };
    });
    addNotification(`${transactionsToUpdate.length} transaction(s) updated successfully.`, 'success');
  }, [modifyActiveDashboardData, addNotification]);

  const addAccount = useCallback((account: Omit<Account, 'id'>, openingBalance: number) => {
    const newAccountId = `acc-${Date.now()}`;
    modifyActiveDashboardData(data => {
      const newAccount = { ...account, id: newAccountId, isArchived: false };
      let newTransactions = data.transactions;

      if (openingBalance !== 0) {
        const balanceAmount = account.type === 'Loan' ? -Math.abs(openingBalance) : openingBalance;
        const openingTxn: Transaction = {
          id: `txn-${Date.now()}-opening`,
          accountId: newAccountId,
          date: new Date().toISOString(),
          description: "Opening Balance",
          amount: balanceAmount,
          isTransfer: false,
        };
        newTransactions = [...data.transactions, openingTxn];
      }

      return {
        ...data,
        accounts: [...data.accounts, newAccount],
        transactions: newTransactions
      };
    });
  }, [modifyActiveDashboardData]);

  const updateAccount = useCallback((updatedAcc: Account) => {
    modifyActiveDashboardData(data => ({
      ...data,
      accounts: data.accounts.map(a => a.id === updatedAcc.id ? updatedAcc : a)
    }));
     addNotification('Account updated successfully.', 'success');
  }, [modifyActiveDashboardData, addNotification]);

   const archiveAccount = useCallback((accountId: string) => {
      modifyActiveDashboardData(data => ({
        ...data,
        accounts: data.accounts.map(a => a.id === accountId ? { ...a, isArchived: true } : a)
      }));
      addNotification('Account archived.', 'success');
    }, [modifyActiveDashboardData, addNotification]);

    const unarchiveAccount = useCallback((accountId: string) => {
      modifyActiveDashboardData(data => ({
        ...data,
        accounts: data.accounts.map(a => a.id === accountId ? { ...a, isArchived: false } : a)
      }));
      addNotification('Account restored.', 'success');
    }, [modifyActiveDashboardData, addNotification]);


  const deleteAccount = useCallback((accountId: string) => {
    modifyActiveDashboardData(data => ({
      ...data,
      accounts: data.accounts.filter(a => a.id !== accountId),
      transactions: data.transactions.filter(t => t.accountId !== accountId)
    }));
    addNotification('Account and associated transactions deleted.', 'success');
  }, [modifyActiveDashboardData, addNotification]);

  const trashAccount = useCallback((accountId: string) => {
    modifyActiveDashboardData(data => {
        const accountToTrash = data.accounts.find(a => a.id === accountId);
        if (!accountToTrash) return data;

        return {
            ...data,
            accounts: data.accounts.filter(a => a.id !== accountId),
            trashedAccounts: [...(data.trashedAccounts || []), { account: accountToTrash, deletedAt: new Date().toISOString() }],
        };
    });
    addNotification('Account moved to trash.', 'success');
  }, [modifyActiveDashboardData, addNotification]);

  const restoreAccount = useCallback((accountId: string) => {
    modifyActiveDashboardData(data => {
        const itemToRestore = (data.trashedAccounts || []).find(item => item.account.id === accountId);
        if (!itemToRestore) return data;
        
        return {
            ...data,
            accounts: [...data.accounts, itemToRestore.account],
            trashedAccounts: (data.trashedAccounts || []).filter(item => item.account.id !== accountId),
        };
    });
    addNotification('Account restored.', 'success');
  }, [modifyActiveDashboardData, addNotification]);
  
  const permanentlyDeleteAccount = useCallback((accountId: string) => {
    modifyActiveDashboardData(data => ({
        ...data,
        trashedAccounts: (data.trashedAccounts || []).filter(a => a.account.id !== accountId),
        transactions: data.transactions.filter(t => t.accountId !== accountId),
    }));
    addNotification('Account permanently deleted.', 'success');
  }, [modifyActiveDashboardData, addNotification]);

  const emptyAccountTrash = useCallback(() => {
    modifyActiveDashboardData(data => {
        if (!data.trashedAccounts || data.trashedAccounts.length === 0) return data;
        const accountIdsToDelete = new Set(data.trashedAccounts.map(a => a.account.id));
        return {
            ...data,
            trashedAccounts: [],
            transactions: data.transactions.filter(t => !accountIdsToDelete.has(t.accountId)),
        };
    });
    addNotification('Account trash has been emptied.', 'success');
  }, [modifyActiveDashboardData, addNotification]);


  const addCategory = useCallback((category: Omit<Category, 'id' | 'subcategories'>) => {
    modifyActiveDashboardData(data => {
        const newCategory = {
            ...category,
            id: `cat-${Date.now()}`,
            subcategories: [],
            color: category.color || CATEGORY_COLORS[data.categories.length % CATEGORY_COLORS.length]
        };
        return {
            ...data,
            categories: [newCategory, ...data.categories]
        }
    });
  }, [modifyActiveDashboardData]);

  const updateCategory = useCallback((updatedCat: Omit<Category, 'subcategories'>) => {
    modifyActiveDashboardData(data => ({
      ...data,
      categories: data.categories.map(c => 
        c.id === updatedCat.id 
        ? { ...c, name: updatedCat.name, icon: updatedCat.icon, color: updatedCat.color } 
        : c
      )
    }));
  }, [modifyActiveDashboardData]);

  const deleteCategory = useCallback((categoryId: string) => {
    modifyActiveDashboardData(data => ({
      ...data,
      categories: data.categories.filter(c => c.id !== categoryId),
      transactions: data.transactions.map(t => t.categoryId === categoryId ? { ...t, categoryId: undefined, subCategoryId: undefined } : t)
    }));
  }, [modifyActiveDashboardData]);

  const reorderCategory = useCallback((categoryId: string, direction: 'up' | 'down') => {
    modifyActiveDashboardData(data => {
        const index = data.categories.findIndex(c => c.id === categoryId);
        if (index === -1) return data;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= data.categories.length) return data;

        const newCategories = [...data.categories];
        const temp = newCategories[index];
        newCategories[index] = newCategories[newIndex];
        newCategories[newIndex] = temp;

        return { ...data, categories: newCategories };
    });
  }, [modifyActiveDashboardData]);

  const addSubCategory = useCallback((categoryId: string, subCategory: Omit<SubCategory, 'id'>) => {
    modifyActiveDashboardData(data => ({
      ...data,
      categories: data.categories.map(c => 
        c.id === categoryId 
        ? { ...c, subcategories: [...c.subcategories, { ...subCategory, id: `subcat-${Date.now()}` }] } 
        : c
      )
    }));
  }, [modifyActiveDashboardData]);

  const updateSubCategory = useCallback((categoryId: string, updatedSubCat: SubCategory) => {
    modifyActiveDashboardData(data => ({
      ...data,
      categories: data.categories.map(c => 
        c.id === categoryId 
        ? { ...c, subcategories: c.subcategories.map(sc => sc.id === updatedSubCat.id ? updatedSubCat : sc) }
        : c
      )
    }));
  }, [modifyActiveDashboardData]);

  const deleteSubCategory = useCallback((categoryId: string, subCategoryId: string) => {
     modifyActiveDashboardData(data => ({
      ...data,
      categories: data.categories.map(c => 
        c.id === categoryId 
        ? { ...c, subcategories: c.subcategories.filter(sc => sc.id !== subCategoryId) }
        : c
      ),
      transactions: data.transactions.map(t => t.subCategoryId === subCategoryId ? { ...t, subCategoryId: undefined } : t)
    }));
  }, [modifyActiveDashboardData]);
  
  const importCategories = useCallback((dataToImport: { category: string; subcategory?: string }[]) => {
      let newCats = 0;
      let newSubCats = 0;

      modifyActiveDashboardData(data => {
        let newCategories = [...data.categories];
        const categoryMap = new Map(newCategories.map(c => [c.name.trim().toLowerCase(), c]));

        for (const item of dataToImport) {
          const categoryName = item.category?.trim();
          const subCategoryName = item.subcategory?.trim();

          if (!categoryName) continue;
          
          const categoryNameLower = categoryName.toLowerCase();
          let category = categoryMap.get(categoryNameLower);

          if (!category) {
            const newId = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            const newCategory: Category = {
              id: newId,
              name: categoryName,
              icon: 'Tag',
              subcategories: [],
            };
            newCategories.push(newCategory);
            categoryMap.set(categoryNameLower, newCategory);
            category = newCategory;
            newCats++;
          }

          if (subCategoryName) {
            const subCategoryExists = category.subcategories.some(sc => sc.name.trim().toLowerCase() === subCategoryName.toLowerCase());
            if (!subCategoryExists) {
              const newSubId = `subcat-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
              const newSubCategory: SubCategory = {
                id: newSubId,
                name: subCategoryName,
              };
              const catIndex = newCategories.findIndex(c => c.id === category!.id);
              if (catIndex > -1) {
                newCategories[catIndex].subcategories.push(newSubCategory);
                newSubCats++;
              }
            }
          }
        }
        
        return { ...data, categories: newCategories };
      });
      addNotification(`Import complete. Added ${newCats} new categories and ${newSubCats} new subcategories.`, 'success');
  }, [modifyActiveDashboardData, addNotification]);

  const addBudget = useCallback((budget: Omit<Budget, 'id'>) => {
    modifyActiveDashboardData(data => ({
        ...data,
        budgets: [...(data.budgets || []), { ...budget, id: `budget-${Date.now()}` }],
    }));
    addNotification('Budget created successfully.', 'success');
  }, [modifyActiveDashboardData, addNotification]);
  
  const updateBudget = useCallback((updatedBudget: Budget) => {
    modifyActiveDashboardData(data => ({
        ...data,
        budgets: (data.budgets || []).map(b => b.id === updatedBudget.id ? updatedBudget : b),
    }));
    addNotification('Budget updated successfully.', 'success');
  }, [modifyActiveDashboardData, addNotification]);
  
  const deleteBudget = useCallback((budgetId: string) => {
    modifyActiveDashboardData(data => ({
        ...data,
        budgets: (data.budgets || []).filter(b => b.id !== budgetId),
    }));
    addNotification('Budget deleted.', 'success');
  }, [modifyActiveDashboardData, addNotification]);
  
  const setWidgetSettings = useCallback((settings: WidgetSettings) => {
    modifyActiveDashboardData(data => ({
        ...data,
        widgetSettings: settings,
    }));
  }, [modifyActiveDashboardData]);

  const setTheme = useCallback((theme: ThemeConfig) => {
    applyTheme(theme);
    setState(s => ({ ...s, theme }));
  }, []);

  const setCurrency = useCallback((currency: string) => {
    setState(s => ({ ...s, currency }));
    addNotification(`Currency successfully changed to ${currency}.`, 'success');
  }, [addNotification]);

  const contextValue: AppContextType = useMemo(() => ({
    state,
    isReady,
    activeDashboardData,
    register,
    login,
    logout,
    selectDashboard,
    completeOnboarding,
    addTransaction,
    addTransfer,
    addInterDashboardTransfer,
    updateTransaction,
    deleteTransaction,
    deleteMultipleTransactions,
    restoreTransactions,
    permanentlyDeleteTransactions,
    emptyTrash,
    addMultipleTransactions,
    updateMultipleTransactions,
    updateMultipleIndividualTransactions,
    addAccount,
    updateAccount,
    archiveAccount,
    unarchiveAccount,
    deleteAccount,
    trashAccount,
    restoreAccount,
    permanentlyDeleteAccount,
    emptyAccountTrash,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    importCategories,
    setTheme,
    setCurrency,
    addBudget,
    updateBudget,
    deleteBudget,
    setWidgetSettings,
    addNotification,
    removeNotification,
  }), [state, isReady, activeDashboardData, register, login, logout, selectDashboard, completeOnboarding, addTransaction, addTransfer, addInterDashboardTransfer, updateTransaction, deleteTransaction, deleteMultipleTransactions, restoreTransactions, permanentlyDeleteTransactions, emptyTrash, addMultipleTransactions, updateMultipleTransactions, updateMultipleIndividualTransactions, addAccount, updateAccount, archiveAccount, unarchiveAccount, deleteAccount, trashAccount, restoreAccount, permanentlyDeleteAccount, emptyAccountTrash, addCategory, updateCategory, deleteCategory, reorderCategory, addSubCategory, updateSubCategory, deleteSubCategory, importCategories, setTheme, setCurrency, addBudget, updateBudget, deleteBudget, setWidgetSettings, addNotification, removeNotification]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export const useIsAppReady = () => {
    const context = React.useContext(AppContext);
    if (context === undefined) {
        throw new Error('useIsAppReady must be used within a AppContextProvider');
    }
    return context.isReady;
}