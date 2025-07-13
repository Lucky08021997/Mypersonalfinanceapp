import { AppState, ColorPalette } from './types';

export const CURRENCIES = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: '$' },
];

export const PALETTES: Record<ColorPalette, Record<string, string>> = {
  blue: { "50":"#eff6ff", "100":"#dbeafe", "200":"#bfdbfe", "300":"#93c5fd", "400":"#60a5fa", "500":"#3b82f6", "600":"#2563eb", "700":"#1d4ed8", "800":"#1e40af", "900":"#1e3a8a", "950":"#172554" },
  green: { "50": "#f0fdf4", "100": "#dcfce7", "200": "#bbf7d0", "300": "#86efac", "400": "#4ade80", "500": "#22c55e", "600": "#16a34a", "700": "#15803d", "800": "#166534", "900": "#14532d", "950": "#052e16" },
  orange: { "50": "#fff7ed", "100": "#ffedd5", "200": "#fed7aa", "300": "#fdba74", "400": "#fb923c", "500": "#f97316", "600": "#ea580c", "700": "#c2410c", "800": "#9a3412", "900": "#7c2d12", "950": "#431407" },
  purple: { "50": "#f5f3ff", "100": "#ede9fe", "200": "#ddd6fe", "300": "#c4b5fd", "400": "#a78bfa", "500": "#8b5cf6", "600": "#7c3aed", "700": "#6d28d9", "800": "#5b21b6", "900": "#4c1d95", "950": "#2e1065" },
  pink: { "50": "#fdf2f8", "100": "#fce7f3", "200": "#fbcfe8", "300": "#f9a8d4", "400": "#f472b6", "500": "#ec4899", "600": "#db2777", "700": "#be185d", "800": "#9d174d", "900": "#831843", "950": "#500724" },
  cyan: { "50": "#ecfeff", "100": "#cffafe", "200": "#a5f3fd", "300": "#67e8f9", "400": "#22d3ee", "500": "#06b6d4", "600": "#0891b2", "700": "#0e7490", "800": "#155e75", "900": "#164e63", "950": "#083344" }
};

export const TAG_COLORS = [
    { bg: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-800 dark:text-blue-200' },
    { bg: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-800 dark:text-green-200' },
    { bg: 'bg-yellow-100 dark:bg-yellow-900/50', text: 'text-yellow-800 dark:text-yellow-200' },
    { bg: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-800 dark:text-purple-200' },
    { bg: 'bg-pink-100 dark:bg-pink-900/50', text: 'text-pink-800 dark:text-pink-200' },
    { bg: 'bg-indigo-100 dark:bg-indigo-900/50', text: 'text-indigo-800 dark:text-indigo-200' },
    { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-200' },
    { bg: 'bg-teal-100 dark:bg-teal-900/50', text: 'text-teal-800 dark:text-teal-200' },
    { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200' },
    { bg: 'bg-lime-100 dark:bg-lime-900/50', text: 'text-lime-800 dark:text-lime-200' },
    { bg: 'bg-sky-100 dark:bg-sky-900/50', text: 'text-sky-800 dark:text-sky-200' },
    { bg: 'bg-rose-100 dark:bg-rose-900/50', text: 'text-rose-800 dark:text-rose-200' },
];

export const CATEGORY_COLORS = [
    '#f43f5e', // rose-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
    '#84cc16', // lime-500
    '#22c55e', // green-500
    '#10b981', // emerald-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#d946ef', // fuchsia-500
    '#ec4899', // pink-500
];

const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash);
};

export const getTagColor = (tag: string) => {
    const hash = simpleHash(tag);
    return TAG_COLORS[hash % TAG_COLORS.length];
};

export const INITIAL_APP_STATE: AppState = {
  currentUser: null,
  activeDashboard: null,
  theme: {
    mode: 'light',
    palette: 'blue',
  },
  currency: 'USD',
  notifications: [],
  personal: {
    accounts: [
      { id: 'p-acc-1', name: 'Personal Checking', type: 'Bank', isArchived: false },
      { id: 'p-acc-2', name: 'Travel Rewards Card', type: 'Credit Card', creditLimit: 15000, dueDateDay: 15, isArchived: false },
      { 
        id: 'p-acc-3', 
        name: 'Car Loan', 
        type: 'Loan', 
        debtType: 'Auto Loan',
        interestRate: 4.5,
        installment: 350,
        dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5).toISOString(),
        isArchived: false
      },
       { id: 'p-acc-4', name: 'Old Savings Account', type: 'Bank', isArchived: true },
    ],
    categories: [
      { id: 'p-cat-1', name: 'Salary', icon: 'Landmark', color: '#10b981', subcategories: [] },
      { 
        id: 'p-cat-2', 
        name: 'Groceries', 
        icon: 'ShoppingCart', 
        color: '#f97316',
        subcategories: [
          { id: 'p-subcat-1', name: 'Weekly Shopping' },
          { id: 'p-subcat-2', name: 'Snacks' },
        ]
      },
      { id: 'p-cat-3', name: 'Gas', icon: 'Fuel', color: '#ef4444', subcategories: [] },
      { id: 'p-cat-4', name: 'Entertainment', icon: 'Clapperboard', color: '#8b5cf6', subcategories: [] },
      { id: 'p-cat-5', name: 'Loan Payment', icon: 'Banknote', color: '#6366f1', subcategories: [] },
    ],
    transactions: [
      { id: 'p-txn-1', accountId: 'p-acc-1', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), description: 'Paycheck', amount: 2500, categoryId: 'p-cat-1' },
      { id: 'p-txn-2', accountId: 'p-acc-2', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: 'Supermarket', amount: -75.50, categoryId: 'p-cat-2', subCategoryId: 'p-subcat-1', notes: 'Bought items for the week', tags: ['food', 'urgent'], classification: 'need' },
      { id: 'p-txn-3', accountId: 'p-acc-1', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), description: 'Fuel Station', amount: -45.00, categoryId: 'p-cat-3', tags: ['car'], classification: 'must' },
      { id: 'p-txn-ob-car', accountId: 'p-acc-3', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), description: 'Opening Balance', amount: -18000 },
      { id: 'p-txn-4', accountId: 'p-acc-3', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: 'Monthly Payment', amount: 350.00, categoryId: 'p-cat-5', classification: 'must' },
      { id: 'p-txn-5', accountId: 'p-acc-2', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), description: 'Movie Tickets', amount: -25.00, categoryId: 'p-cat-4', classification: 'want' },

    ],
    trash: [],
    trashedAccounts: [],
    budgets: [],
    widgetSettings: {
        netWorth: true,
        netWorthTrend: true,
        incomeVsExpense: true,
        spendingBreakdown: true,
        incomeBreakdown: false,
        budgetSummary: true,
        accountSummary: true,
        tagSpending: true,
        spendingClassification: true,
    }
  },
  home: {
    accounts: [
      { id: 'h-acc-1', name: 'Joint Account', type: 'Bank', isArchived: false },
      { id: 'h-acc-2', name: 'Home Depot Card', type: 'Credit Card', isArchived: false },
      { id: 'h-acc-3', name: 'Mortgage', type: 'Loan', debtType: 'Home Loan', interestRate: 3.2, installment: 1850, isArchived: false },
    ],
    categories: [
      { id: 'h-cat-1', name: 'Utilities', icon: 'Lightbulb', color: '#eab308', subcategories: [
        { id: 'h-subcat-1', name: 'Electricity'},
        { id: 'h-subcat-2', name: 'Water'},
      ] },
      { id: 'h-cat-2', name: 'Home Repair', icon: 'Wrench', color: '#f43f5e', subcategories: [] },
      { id: 'h-cat-3', name: 'Insurance', icon: 'Shield', color: '#06b6d4', subcategories: [] },
    ],
    transactions: [
        { id: 'h-txn-ob-mortgage', accountId: 'h-acc-3', date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), description: 'Opening Balance', amount: -250000 },
        { id: 'h-txn-1', accountId: 'h-acc-1', date: new Date().toISOString(), description: 'Water Bill', amount: -60, categoryId: 'h-cat-1', subCategoryId: 'h-subcat-2', tags: ['utilities', 'bill'], classification: 'must' },
        { id: 'h-txn-2', accountId: 'h-acc-2', date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), description: 'New Paint', amount: -150, categoryId: 'h-cat-2', tags: ['home-improvement'], classification: 'want' },
    ],
    trash: [],
    trashedAccounts: [],
    budgets: [],
    widgetSettings: {
        netWorth: true,
        netWorthTrend: true,
        incomeVsExpense: true,
        spendingBreakdown: true,
        incomeBreakdown: false,
        budgetSummary: true,
        accountSummary: true,
        tagSpending: true,
        spendingClassification: true,
    }
  },
};