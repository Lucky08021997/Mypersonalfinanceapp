import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import type { Transaction, Category } from '../types';
import { X, Save } from 'lucide-react';

interface BulkEditModalProps {
  onClose: () => void;
  transactionIds: string[];
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({ onClose, transactionIds }) => {
  const { activeDashboardData, updateMultipleIndividualTransactions } = useAppContext();
  const { transactions, categories } = activeDashboardData;

  const [editedData, setEditedData] = useState<Transaction[]>([]);

  useEffect(() => {
    const transactionsToEdit = transactions.filter(t => transactionIds.includes(t.id));
    setEditedData(transactionsToEdit);
  }, [transactionIds, transactions]);

  const categoryMap = useMemo(() => new Map<string, Category>(categories.map(c => [c.id, c])), [categories]);

  const handleFieldChange = (id: string, field: keyof Transaction, value: any) => {
    setEditedData(prevData =>
      prevData.map(txn => (txn.id === id ? { ...txn, [field]: value } : txn))
    );
  };
  
  const handleAmountChange = (id: string, type: 'credit' | 'debit', value: string) => {
      const numericValue = parseFloat(value) || 0;
      const amount = type === 'credit' ? numericValue : -numericValue;
      handleFieldChange(id, 'amount', amount);
  }

  const handleCategoryChange = (id: string, newCategoryId: string) => {
    setEditedData(prevData =>
      prevData.map(txn => (txn.id === id ? { ...txn, categoryId: newCategoryId, subCategoryId: undefined } : txn))
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMultipleIndividualTransactions(editedData);
    onClose();
  };
  
  const renderSubcategoryOptions = (transaction: Transaction) => {
    const category = categoryMap.get(transaction.categoryId || '');
    if (!category || category.subcategories.length === 0) {
      return [<option key="none" value="">None</option>];
    }
    return [
      <option key="none" value="">None</option>,
      ...category.subcategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)
    ];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Bulk Edit ({transactionIds.length}) Transactions</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
             <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow p-6 overflow-y-auto">
             <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                             <tr>
                                <th className="p-2 font-semibold text-left text-xs text-gray-600 dark:text-gray-300 uppercase">Date</th>
                                <th className="p-2 font-semibold text-left text-xs text-gray-600 dark:text-gray-300 uppercase">Description</th>
                                <th className="p-2 font-semibold text-left text-xs text-gray-600 dark:text-gray-300 uppercase">Category</th>
                                <th className="p-2 font-semibold text-left text-xs text-gray-600 dark:text-gray-300 uppercase">Subcategory</th>
                                <th className="p-2 font-semibold text-left text-xs text-gray-600 dark:text-gray-300 uppercase">Credit</th>
                                <th className="p-2 font-semibold text-left text-xs text-gray-600 dark:text-gray-300 uppercase">Debit</th>
                                <th className="p-2 font-semibold text-left text-xs text-gray-600 dark:text-gray-300 uppercase">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {editedData.map(txn => (
                                <tr key={txn.id}>
                                    <td className="p-1"><input type="date" value={txn.date.split('T')[0]} onChange={e => {
                                        const dateValue = e.target.value;
                                        if (dateValue) {
                                            const d = new Date(dateValue);
                                            if (!isNaN(d.getTime())) {
                                                handleFieldChange(txn.id, 'date', d.toISOString());
                                            }
                                        }
                                    }} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 text-sm"/></td>
                                    <td className="p-1"><input type="text" value={txn.description} onChange={e => handleFieldChange(txn.id, 'description', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 text-sm"/></td>
                                    <td className="p-1">
                                        <select value={txn.categoryId || ''} onChange={e => handleCategoryChange(txn.id, e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 text-sm">
                                            <option value="">Uncategorized</option>
                                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-1">
                                        <select value={txn.subCategoryId || ''} onChange={e => handleFieldChange(txn.id, 'subCategoryId', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 text-sm" disabled={!txn.categoryId}>
                                            {renderSubcategoryOptions(txn)}
                                        </select>
                                    </td>
                                    <td className="p-1"><input type="number" step="0.01" value={txn.amount > 0 ? txn.amount : ''} onChange={e => handleAmountChange(txn.id, 'credit', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 text-sm"/></td>
                                    <td className="p-1"><input type="number" step="0.01" value={txn.amount < 0 ? Math.abs(txn.amount) : ''} onChange={e => handleAmountChange(txn.id, 'debit', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 text-sm"/></td>
                                    <td className="p-1"><input type="text" value={txn.notes || ''} onChange={e => handleFieldChange(txn.id, 'notes', e.target.value)} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-1 px-2 text-sm"/></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end items-center">
            <div className="flex gap-2">
                <button type="button" onClick={onClose} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center gap-2">
                    <Save size={18}/> Save All Changes
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};