
export type DashboardType = 'personal' | 'home';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // INSECURE: For demonstration purposes only.
  needsOnboarding?: boolean;
}

export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id:string;
  name: string;
  icon?: string; // e.g. 'ShoppingCart'
  color?: string; // e.g. '#ff0000'
  subcategories: SubCategory[];
}

export const AccountTypes = ['Bank', 'Credit Card', 'Loan', 'Investment', 'Cash'] as const;
export type AccountType = typeof AccountTypes[number];

export const DebtTypes = ['Personal Loan', 'Credit Card', 'Home Loan', 'Auto Loan', 'Student Loan', 'Other'] as const;
export type DebtType = typeof DebtTypes[number];

export interface Account {
  id: string;
  name: string; // Will be used as Lender Name for loans
  type: AccountType;
  notes?: string;
  // Debt-specific fields
  interestRate?: number; // Annual percentage rate
  installment?: number; // Monthly payment amount
  dueDate?: string; // Next payment due date (ISO string)
  debtType?: DebtType;
  // New fields
  creditLimit?: number;
  dueDateDay?: number;
  isArchived?: boolean;
}

export const TransactionClassifications = ['need', 'want', 'must'] as const;
export type TransactionClassification = typeof TransactionClassifications[number];

export interface Transaction {
  id: string;
  accountId: string;
  date: string; // ISO string
  description: string;
  amount: number; // positive for income, negative for expense
  categoryId?: string;
  subCategoryId?: string;
  notes?: string;
  isTransfer?: boolean;
  tags?: string[];
  classification?: TransactionClassification;
  budgetId?: string;
}

export interface TrashedTransaction {
  transaction: Transaction;
  deletedAt: string; // ISO string
}

export interface TrashedAccount {
  account: Account;
  deletedAt: string; // ISO string
}

export interface BudgetCategory {
    categoryId: string;
    amount: number;
}

export interface Budget {
    id: string;
    name: string;
    amount: number;
    period: 'monthly' | 'yearly' | 'weekly';
    categories: BudgetCategory[];
}

export interface WidgetSettings {
    [key: string]: boolean;
    tagSpending: boolean;
    spendingClassification: boolean;
}

export interface DashboardData {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  trash: TrashedTransaction[];
  trashedAccounts: TrashedAccount[];
  budgets: Budget[];
  widgetSettings: WidgetSettings;
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type ThemeMode = 'light' | 'dark';
export type ColorPalette = 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'cyan';

export interface ThemeConfig {
    mode: ThemeMode;
    palette: ColorPalette;
}

export interface AppState {
  currentUser: User | null;
  activeDashboard: DashboardType | null;
  theme: ThemeConfig;
  currency: string; // e.g., 'USD', 'INR', 'EUR'
  personal: DashboardData;
  home: DashboardData;
  notifications: Notification[];
}

export interface AppContextType {
  state: AppState;
  isReady: boolean;
  activeDashboardData: DashboardData;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  selectDashboard: (type: DashboardType) => void;
  completeOnboarding: () => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addTransfer: (details: { fromAccountId: string; toAccountId: string; amount: number; date: string; notes?: string }) => void;
  addInterDashboardTransfer: (details: { fromAccountId: string; toAccountId: string; amount: number; date: string; notes?: string; fromDashboard: DashboardType; toDashboard: DashboardType; }) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (transactionId: string) => void;
  deleteMultipleTransactions: (transactionIds: string[]) => void;
  restoreTransactions: (transactionIds: string[]) => void;
  permanentlyDeleteTransactions: (transactionIds: string[]) => void;
  emptyTrash: () => void;
  addMultipleTransactions: (transactions: Omit<Transaction, 'id'>[]) => void;
  updateMultipleTransactions: (transactionIds: string[], updates: Partial<Pick<Transaction, 'categoryId' | 'subCategoryId' | 'notes' | 'classification'>>) => void;
  updateMultipleIndividualTransactions: (transactions: Transaction[]) => void;
  addAccount: (account: Omit<Account, 'id'>, openingBalance: number) => void;
  updateAccount: (account: Account) => void;
  archiveAccount: (accountId: string) => void;
  unarchiveAccount: (accountId: string) => void;
  deleteAccount: (accountId: string) => void;
  trashAccount: (accountId: string) => void;
  restoreAccount: (accountId: string) => void;
  permanentlyDeleteAccount: (accountId: string) => void;
  emptyAccountTrash: () => void;
  addCategory: (category: Omit<Category, 'id' | 'subcategories'>) => void;
  updateCategory: (category: Omit<Category, 'subcategories'>) => void;
  deleteCategory: (categoryId: string) => void;
  reorderCategory: (categoryId: string, direction: 'up' | 'down') => void;
  addSubCategory: (categoryId: string, subCategory: Omit<SubCategory, 'id'>) => void;
  updateSubCategory: (categoryId: string, subCategory: SubCategory) => void;
  deleteSubCategory: (categoryId: string, subCategoryId: string) => void;
  importCategories: (data: { category: string; subcategory?: string }[]) => void;
  setTheme: (theme: ThemeConfig) => void;
  setCurrency: (currency: string) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (budgetId: string) => void;
  setWidgetSettings: (settings: WidgetSettings) => void;
  addNotification: (message: string, type?: 'success' | 'error' | 'info', actionDetails?: { label: string; onClick: () => void; }) => void;
  removeNotification: (id: number) => void;
}