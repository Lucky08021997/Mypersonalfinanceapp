


import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useCurrency } from '../hooks/useCurrency';
import * as icons from 'lucide-react';
import type { Transaction, Category, AccountType, SubCategory } from '../types';
import { AccountTypes } from '../types';
import TagSelector from './TagSelector';
import TransactionModal from './TransactionModal';
import { exportToPdf, exportToXlsx } from '../lib/reporting';
import Papa from 'papaparse';
import { startOfMonth, endOfMonth } from 'date-fns';
import { getTagColor } from '../constants';

const DynamicIcon = ({ name, ...props }: { name: string; [key: string]: any }) => {
    const LucideIcon = (icons as any)[name] || icons.Tag;
    return <LucideIcon {...props} />;
};

const DetailedReportView: React.FC = () => {
    const { activeDashboardData, addNotification, state } = useAppContext();
    const { formatCurrency } = useCurrency();
    const { transactions, accounts, categories } = activeDashboardData;

    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()).toISOString().split('T')[0],
        end: endOfMonth(new Date()).toISOString().split('T')[0],
    });
    const [accountTypes, setAccountTypes] = useState<AccountType[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
    const [tagFilters, setTagFilters] = useState<string[]>([]);

    const subCategoriesForSelectedCategory = useMemo(() => {
        if (selectedCategory === 'all') return [];
        const cat = categories.find(c => c.id === selectedCategory);
        return cat?.subcategories || [];
    }, [selectedCategory, categories]);

    const handleAccountTypeChange = (type: AccountType) => {
        setAccountTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const txDate = new Date(t.date);
            const start = new Date(dateRange.start);
            const end = new Date(new Date(dateRange.end).setHours(23, 59, 59, 999));
            if (txDate < start || txDate > end) return false;

            if (accountTypes.length > 0) {
                const account = accounts.find(a => a.id === t.accountId);
                if (!account || !accountTypes.includes(account.type)) return false;
            }

            if (selectedCategory !== 'all' && t.categoryId !== selectedCategory) return false;
            if (selectedSubCategory !== 'all' && t.subCategoryId !== selectedSubCategory) return false;

            if (tagFilters.length > 0) {
                if (!t.tags || !tagFilters.every(ft => t.tags!.includes(ft))) return false;
            }

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, dateRange, accountTypes, selectedCategory, selectedSubCategory, tagFilters, accounts]);

    const summaryTotals = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => {
            if (t.isTransfer) acc.transfer += t.amount;
            else if (t.amount > 0) acc.income += t.amount;
            else acc.expense += t.amount;
            return acc;
        }, { income: 0, expense: 0, transfer: 0 });
    }, [filteredTransactions]);

    const handleExport = (format: 'pdf' | 'xlsx' | 'csv') => {
        if (filteredTransactions.length === 0) {
            addNotification("No data to export.", "info");
            return;
        }

        if (format === 'csv') {
            const csvData = Papa.unparse(filteredTransactions.map(t => {
                const category = t.categoryId ? categories.find(c => c.id === t.categoryId) : null;
                const subCategory = category && t.subCategoryId ? category.subcategories.find(sc => sc.id === t.subCategoryId) : null;
                return {
                    Date: new Date(t.date).toLocaleDateString(),
                    Description: t.description,
                    Account: accounts.find(a => a.id === t.accountId)?.name || 'N/A',
                    Category: category?.name || 'Uncategorized',
                    Subcategory: subCategory?.name || '',
                    Tags: t.tags?.join(', ') || '',
                    Amount: t.amount,
                    Type: t.isTransfer ? 'Transfer' : (t.amount > 0 ? 'Income' : 'Expense'),
                };
            }));
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `Detailed_Report_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } else {
            const reportData = {
                transactions: filteredTransactions,
                accounts,
                categories,
                currencyCode: state.currency,
            };
            const params = {
                reportType: 'Detailed Report',
                dateRange: { start: new Date(dateRange.start), end: new Date(dateRange.end) },
                data: reportData,
            };
            format === 'pdf' ? exportToPdf(params) : exportToXlsx(params);
        }
    };
    
    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Detailed Report</h3>
            {/* Filter Panel */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date Range</label>
                        <div className="flex items-center gap-2">
                            <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="form-input w-full bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm"/>
                            <span className="text-gray-500">-</span>
                            <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="form-input w-full bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="form-select w-full bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm">
                            <option value="all">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Subcategory</label>
                         <select value={selectedSubCategory} onChange={e => setSelectedSubCategory(e.target.value)} className="form-select w-full bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm" disabled={subCategoriesForSelectedCategory.length === 0}>
                            <option value="all">All Subcategories</option>
                            {subCategoriesForSelectedCategory.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tags</label>
                        <TagSelector selectedTags={tagFilters} onChange={setTagFilters} placeholder="Filter tags..." />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1">Account Types</label>
                    <div className="flex flex-wrap gap-2">
                        {AccountTypes.map(type => (
                            <button key={type} onClick={() => handleAccountTypeChange(type)}
                                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                    accountTypes.includes(type) 
                                    ? 'bg-primary-600 text-white' 
                                    : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Export Actions */}
            <div className="flex justify-end gap-2">
                <button onClick={() => handleExport('csv')} className="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600">
                    <icons.FileDown size={16}/> CSV
                </button>
                <button onClick={() => handleExport('xlsx')} className="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600">
                    <icons.FileDown size={16}/> Excel
                </button>
                <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600">
                    <icons.FileDown size={16}/> PDF
                </button>
            </div>
            
            {/* Report Table */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="p-3 text-left font-semibold">Date</th>
                            <th className="p-3 text-left font-semibold">Description</th>
                            <th className="p-3 text-left font-semibold">Account</th>
                            <th className="p-3 text-left font-semibold">Category</th>
                            <th className="p-3 text-right font-semibold">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map(t => {
                            const account = accounts.find(a => a.id === t.accountId);
                            const category = categories.find(c => c.id === t.categoryId);
                            const subCategory = category?.subcategories.find(sc => sc.id === t.subCategoryId);
                            return (
                                <tr key={t.id} onClick={() => setEditingTransaction(t)} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                                    <td className="p-3 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="p-3 font-medium text-gray-800 dark:text-gray-100">
                                        {t.description}
                                        {t.tags && t.tags.length > 0 && 
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {t.tags.map(tag => {
                                                    const color = getTagColor(tag);
                                                    return <span key={tag} className={`text-xs ${color.bg} ${color.text} px-2 py-0.5 rounded-full`}>#{tag}</span>
                                                })}
                                            </div>
                                        }
                                    </td>
                                    <td className="p-3">{account?.name || 'N/A'}</td>
                                    <td className="p-3">
                                        <div>
                                            <div>{category?.name || (t.isTransfer ? 'Transfer' : 'Uncategorized')}</div>
                                            {subCategory && <div className="text-xs text-gray-500">{subCategory.name}</div>}
                                        </div>
                                    </td>
                                    <td className={`p-3 text-right font-bold whitespace-nowrap ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatCurrency(t.amount)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold">
                        <tr>
                            <td colSpan={4} className="p-3 text-right">Total Income:</td>
                            <td className="p-3 text-right text-green-600">{formatCurrency(summaryTotals.income)}</td>
                        </tr>
                         <tr>
                            <td colSpan={4} className="p-3 text-right">Total Expense:</td>
                            <td className="p-3 text-right text-red-600">{formatCurrency(summaryTotals.expense)}</td>
                        </tr>
                         <tr>
                            <td colSpan={4} className="p-3 text-right">Net Change:</td>
                            <td className={`p-3 text-right ${summaryTotals.income + summaryTotals.expense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(summaryTotals.income + summaryTotals.expense)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                 {filteredTransactions.length === 0 && <div className="text-center p-8 text-gray-500">No transactions match your criteria.</div>}
            </div>

            {editingTransaction && <TransactionModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)} />}
        </div>
    );
};

export default DetailedReportView;