
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import type { Transaction, Category, TransactionClassification, DashboardType, Budget } from '../types';
import { Trash2, X, TrendingDown, TrendingUp, ArrowRightLeft, AlertTriangle, Save, Plus } from 'lucide-react';
import { TransactionClassifications } from '../../types';
import TagSelector from './TagSelector';
import {
    endOfMonth,
    endOfWeek,
    endOfYear,
    startOfMonth,
    startOfWeek,
    startOfYear,
} from 'date-fns';
import * as icons from 'lucide-react';


const DynamicIcon = ({ name, ...props }: { name: string; [key: string]: any }) => {
    const LucideIcon = (icons as any)[name] || icons.Tag;
    return <LucideIcon {...props} />;
};
interface TransactionModalProps {
  onClose: () => void;
  transaction?: Transaction;
  defaultAccountId?: string;
}

const modeColors = {
  expense: {
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500',
    bg: 'bg-red-600',
    hoverBg: 'hover:bg-red-700',
    focusRing: 'focus:ring-red-500',
    focusBorder: 'focus:border-red-500',
  },
  income: {
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500',
    bg: 'bg-green-600',
    hoverBg: 'hover:bg-green-700',
    focusRing: 'focus:ring-green-500',
    focusBorder: 'focus:border-green-500',
  },
  transfer: {
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500',
    bg: 'bg-blue-600',
    hoverBg: 'hover:bg-blue-700',
    focusRing: 'focus:ring-blue-500',
    focusBorder: 'focus:border-blue-500',
  },
  default: {
    text: 'text-primary-600 dark:text-primary-400',
    border: 'border-primary-500',
    bg: 'bg-primary-600',
    hoverBg: 'hover:bg-primary-700',
    focusRing: 'focus:ring-primary-500',
    focusBorder: 'focus:border-primary-500',
  }
};

const TabButton: React.FC<{
  label: string;
  mode: 'expense' | 'income' | 'transfer';
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, mode, icon: Icon, isActive, onClick, disabled }) => {
    const colors = modeColors[mode];

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`flex-1 justify-center py-3 px-1 text-sm font-medium flex items-center gap-2 border-b-4 transition-colors duration-200 ${
                isActive 
                ? `${colors.border} ${colors.text}`
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-current={isActive ? 'page' : undefined}
        >
            <Icon size={18} className={isActive ? 'opacity-100' : 'opacity-75'} />
            <span className="font-semibold">{label}</span>
        </button>
    );
};

const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, transaction, defaultAccountId }) => {
  const { state, addTransaction, updateTransaction, deleteTransaction, addTransfer, addInterDashboardTransfer, addNotification } = useAppContext();
  const { activeDashboard, personal, home } = state;
  const activeDashboardData = activeDashboard ? state[activeDashboard] : personal;
  const { categories, budgets } = activeDashboardData;

  const allAccounts = useMemo(() => [
      ...personal.accounts.filter(a => !a.isArchived).map(a => ({...a, dashboard: 'personal' as DashboardType})),
      ...home.accounts.filter(a => !a.isArchived).map(a => ({...a, dashboard: 'home' as DashboardType})),
  ], [personal.accounts, home.accounts]);
  
  const isEditing = !!transaction;
  
  const getInitialMode = () => {
      if (!isEditing) return 'expense';
      if (transaction?.isTransfer) return 'transfer';
      return (transaction.amount >= 0) ? 'income' : 'expense';
  };

  const [mode, setMode] = useState<'expense' | 'income' | 'transfer'>(getInitialMode());
  
  const activeColorSet = modeColors[mode] || modeColors.default;
  const inputClasses = `mt-1 block w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm ${activeColorSet.focusRing} ${activeColorSet.focusBorder}`;
  
  const [formData, setFormData] = useState({
    accountId: transaction?.accountId || defaultAccountId || (activeDashboardData.accounts[0]?.id || ''),
    description: transaction?.description || '',
    categoryId: transaction?.categoryId || '',
    subCategoryId: transaction?.subCategoryId || '',
    fromAccountId: transaction?.accountId || defaultAccountId || (allAccounts[0]?.id || ''),
    toAccountId: allAccounts.length > 1 ? allAccounts.find(a => a.id !== (transaction?.accountId || defaultAccountId))?.id || allAccounts[1].id : (allAccounts[0]?.id || ''),
    date: transaction ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
    amount: transaction ? Math.abs(transaction.amount) : 0,
    notes: transaction?.notes || '',
    classification: transaction?.classification,
    budgetId: transaction?.budgetId,
  });
  
  const [tags, setTags] = useState<string[]>(transaction?.tags || []);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const relevantBudgets = useMemo<Budget[]>(() => {
    if (mode !== 'expense' || !budgets) return [];
    
    const txDate = new Date(formData.date);
    if (isNaN(txDate.getTime())) return [];

    return budgets.filter(b => {
      let isDateMatch = false;
      let budgetStart, budgetEnd;
      
      switch (b.period) {
          case 'weekly':
              budgetStart = startOfWeek(txDate, { weekStartsOn: 1 });
              budgetEnd = endOfWeek(txDate, { weekStartsOn: 1 });
              break;
          case 'yearly':
              budgetStart = startOfYear(txDate);
              budgetEnd = endOfYear(txDate);
              break;
          case 'monthly':
          default:
              budgetStart = startOfMonth(txDate);
              budgetEnd = endOfMonth(txDate);
              break;
      }
      
      isDateMatch = txDate >= budgetStart && txDate <= budgetEnd;
      if (!isDateMatch) return false;

      // If budget has specific categories, check if transaction category matches
      if (b.categories.length > 0) {
        return b.categories.some(bc => bc.categoryId === formData.categoryId);
      }

      // If budget has no specific categories, it's a general budget for the period
      return true;
    });
  }, [mode, formData.date, formData.categoryId, budgets]);


  useEffect(() => {
    const cat = categories.find(c => c.id === formData.categoryId);
    setSelectedCategory(cat || null);
    if (selectedCategory && !selectedCategory.subcategories.some(sc => sc.id === formData.subCategoryId)) {
        setFormData(prev => ({...prev, subCategoryId: ''}));
    }
  }, [formData.categoryId, categories, formData.subCategoryId, selectedCategory]);

  useEffect(() => {
    if (!isEditing) {
        setFormData(prev => ({
          ...prev, description: '', categoryId: '', subCategoryId: '', notes: '', amount: 0, classification: undefined,
        }));
        setTags([]);
    }
  }, [mode, isEditing]);
  
  useEffect(() => {
      if(isEditing && transaction?.amount) {
          const newAmount = mode === 'expense' ? -Math.abs(transaction.amount) : Math.abs(transaction.amount);
          if (transaction.amount !== newAmount) {
              updateTransaction({ ...transaction, amount: newAmount });
          }
      }
  }, [mode, isEditing, transaction, updateTransaction]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && transaction) {
      const finalAmount = mode === 'expense' ? -Math.abs(formData.amount) : Math.abs(formData.amount);
      updateTransaction({
        ...transaction,
        accountId: formData.accountId,
        date: new Date(formData.date).toISOString(),
        description: formData.description,
        amount: finalAmount,
        categoryId: formData.categoryId || undefined,
        subCategoryId: formData.subCategoryId || undefined,
        notes: formData.notes || undefined,
        tags: tags,
        classification: formData.classification,
        budgetId: formData.budgetId || undefined,
      });
    } else {
        switch (mode) {
            case 'expense':
            case 'income':
                addTransaction({
                    accountId: formData.accountId,
                    date: new Date(formData.date).toISOString(),
                    description: formData.description,
                    amount: mode === 'expense' ? -Math.abs(formData.amount) : Math.abs(formData.amount),
                    categoryId: formData.categoryId || undefined,
                    subCategoryId: formData.subCategoryId || undefined,
                    notes: formData.notes || undefined,
                    isTransfer: false,
                    tags: tags,
                    classification: formData.classification,
                    budgetId: formData.budgetId || undefined,
                });
                break;
            case 'transfer':
                if (formData.fromAccountId === formData.toAccountId) {
                    addNotification("From and To accounts cannot be the same.", "error");
                    return;
                }
                const fromAccount = allAccounts.find(a => a.id === formData.fromAccountId);
                const toAccount = allAccounts.find(a => a.id === formData.toAccountId);

                if (!fromAccount || !toAccount) {
                    addNotification("Could not find transfer accounts.", "error");
                    return;
                }

                if (fromAccount.dashboard !== toAccount.dashboard) {
                    addInterDashboardTransfer({
                        fromAccountId: formData.fromAccountId,
                        toAccountId: formData.toAccountId,
                        amount: formData.amount,
                        date: formData.date,
                        notes: formData.notes || undefined,
                        fromDashboard: fromAccount.dashboard,
                        toDashboard: toAccount.dashboard
                    });
                } else {
                    addTransfer({
                        fromAccountId: formData.fromAccountId,
                        toAccountId: formData.toAccountId,
                        amount: formData.amount,
                        date: formData.date,
                        notes: formData.notes || undefined,
                    });
                }
                break;
        }
    }
    onClose();
  };
  
  const handleDelete = () => {
    if (transaction) {
      deleteTransaction(transaction.id);
      onClose();
    }
  };

  const modalTitle = isEditing ? 'Edit Transaction' : 
      mode === 'expense' ? 'Add Expense' : 
      mode === 'income' ? 'Add Income' : 'Create Transfer';

  const renderIncomeExpenseForm = () => (
    <>
      <div>
        <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account</label>
        <select name="accountId" id="accountId" value={formData.accountId} onChange={handleChange} className={inputClasses} required>
          {activeDashboardData.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className={inputClasses} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className={inputClasses} required />
          </div>
          <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input type="number" step="0.01" name="amount" id="amount" value={formData.amount} onChange={handleChange} className={inputClasses} required />
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select name="categoryId" id="categoryId" value={formData.categoryId} onChange={handleChange} className={inputClasses}>
                    <option value="">Uncategorized</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
          </div>
          <div>
                <label htmlFor="subCategoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subcategory</label>
                <select name="subCategoryId" id="subCategoryId" value={formData.subCategoryId} onChange={handleChange} className={inputClasses} disabled={!selectedCategory || selectedCategory.subcategories.length === 0}>
                    <option value="">None</option>
                    {selectedCategory?.subcategories.map(subcat => <option key={subcat.id} value={subcat.id}>{subcat.name}</option>)}
                </select>
          </div>
      </div>
      {mode === 'expense' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label htmlFor="classification" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Spending Classification</label>
                <select name="classification" id="classification" value={formData.classification || ''} onChange={handleChange} className={inputClasses}>
                    <option value="">Optional</option>
                    {TransactionClassifications.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="budgetId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Link to Budget</label>
                <select name="budgetId" id="budgetId" value={formData.budgetId || ''} onChange={handleChange} className={inputClasses} disabled={relevantBudgets.length === 0}>
                    <option value="">None</option>
                    {relevantBudgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
            </div>
        </div>
      )}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
        <TagSelector selectedTags={tags} onChange={setTags} />
      </div>
       <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
        <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputClasses} />
      </div>
    </>
  );

  const renderTransferForm = () => (
    <>
      <div>
        <label htmlFor="fromAccountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">From Account</label>
        <select name="fromAccountId" id="fromAccountId" value={formData.fromAccountId} onChange={handleChange} className={inputClasses} required>
          <optgroup label="Personal">
            {allAccounts.filter(a => a.dashboard === 'personal').map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </optgroup>
          <optgroup label="Home">
            {allAccounts.filter(a => a.dashboard === 'home').map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </optgroup>
        </select>
      </div>
      <div>
        <label htmlFor="toAccountId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">To Account</label>
        <select name="toAccountId" id="toAccountId" value={formData.toAccountId} onChange={handleChange} className={inputClasses} required>
          <optgroup label="Personal">
            {allAccounts.filter(a => a.dashboard === 'personal').map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </optgroup>
          <optgroup label="Home">
            {allAccounts.filter(a => a.dashboard === 'home').map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
          </optgroup>
        </select>
         {formData.fromAccountId === formData.toAccountId && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mt-2 text-sm">
            <AlertTriangle size={16}/>
            Accounts must be different.
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className={inputClasses} required />
          </div>
          <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
              <input type="number" step="0.01" name="amount" id="amount" value={formData.amount} onChange={handleChange} className={inputClasses} required />
          </div>
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
        <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputClasses} placeholder="Optional notes for the transfer" />
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border-t-8 ${activeColorSet.border} transition-all duration-300`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className={`text-2xl font-bold ${activeColorSet.text}`}>{modalTitle}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
             <X size={24} />
          </button>
        </div>
        
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
            <TabButton label="Expense" mode="expense" icon={TrendingDown} isActive={mode === 'expense'} onClick={() => setMode('expense')} disabled={transaction?.isTransfer} />
            <TabButton label="Income" mode="income" icon={TrendingUp} isActive={mode === 'income'} onClick={() => setMode('income')} disabled={transaction?.isTransfer} />
            <TabButton label="Transfer" mode="transfer" icon={ArrowRightLeft} isActive={mode === 'transfer'} onClick={() => setMode('transfer')} disabled={isEditing} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {mode === 'transfer' ? renderTransferForm() : renderIncomeExpenseForm()}
          </div>
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              {isEditing && !transaction.isTransfer && (
                  <button type="button" onClick={handleDelete} className="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 font-semibold p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center gap-2">
                    <Trash2 size={16}/> Delete
                  </button>
              )}
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                <button type="submit" className={`text-white px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${activeColorSet.bg} ${activeColorSet.hoverBg}`}>
                  {transaction ? <Save size={18}/> : <Plus size={18}/>}
                  {transaction ? 'Save Changes' : 'Add Transaction'}
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;