

import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useCurrency } from '../hooks/useCurrency';
import * as icons from 'lucide-react';
import Papa from 'papaparse';
import TransactionModal from './TransactionModal';
import { Transaction, Category, TransactionClassification, TransactionClassifications } from '../types';
import { format } from 'date-fns';
import { getTagColor } from '../constants';
import TagSelector from './TagSelector';
import HelpTooltip from './HelpTooltip';

type GroupByType = 'none' | 'month' | 'category' | 'account';

const DynamicIcon = ({ name, ...props }: { name: string; [key: string]: any }) => {
    const LucideIcon = (icons as any)[name] || icons.Folder;
    return <LucideIcon {...props} />;
};

const FilterPanel = ({ filters, setFilters, searchTerm, setSearchTerm, tagFilters, setTagFilters, accounts, categories, groupBy, setGroupBy, onExport, resultCount }) => {
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                 <div className="relative flex-grow col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-2">
                     <label className="text-xs font-semibold text-gray-500">Global Search</label>
                    <icons.Search className="absolute left-3 top-9 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Search description, notes, tags, category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full mt-1 form-input pl-10 bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm"/>
                </div>
                 <div className="flex items-center gap-2 col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-2">
                    <div className="flex-grow">
                        <label className="text-xs font-semibold text-gray-500">Min Amount</label>
                        <input type="number" name="minAmount" value={filters.minAmount} onChange={handleFilterChange} className="w-full mt-1 form-input bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm" placeholder="Any"/>
                    </div>
                    <div className="flex-grow">
                        <label className="text-xs font-semibold text-gray-500">Max Amount</label>
                        <input type="number" name="maxAmount" value={filters.maxAmount} onChange={handleFilterChange} className="w-full mt-1 form-input bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm" placeholder="Any"/>
                    </div>
                 </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                    <label className="text-xs font-semibold text-gray-500">From Date</label>
                    <input type="date" name="dateStart" value={filters.dateStart} onChange={handleFilterChange} className="w-full mt-1 form-input bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm"/>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500">To Date</label>
                    <input type="date" name="dateEnd" value={filters.dateEnd} onChange={handleFilterChange} className="w-full mt-1 form-input bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm"/>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500">Account</label>
                    <select name="account" value={filters.account} onChange={handleFilterChange} className="w-full mt-1 form-select bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm">
                        <option value="all">All Accounts</option>
                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                <div>
                     <label className="text-xs font-semibold text-gray-500">Type</label>
                    <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full mt-1 form-select bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm">
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                        <option value="transfer">Transfer</option>
                    </select>
                </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-500">Category</label>
                    <select name="category" value={filters.category} onChange={handleFilterChange} className="w-full mt-1 form-select bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm">
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500">Classification</label>
                    <select name="classification" value={filters.classification} onChange={handleFilterChange} className="w-full mt-1 form-select bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm">
                        <option value="all">All</option>
                        {TransactionClassifications.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                </div>
                 <div className="lg:col-span-2">
                     <label className="text-xs font-semibold text-gray-500">Filter Tags</label>
                    <TagSelector selectedTags={tagFilters} onChange={setTagFilters} placeholder="Filter by tags..." />
                 </div>
                 <div className="flex gap-4 self-end col-span-full sm:col-span-1 md:col-span-3 lg:col-span-2">
                    <div className="w-full">
                        <label className="text-xs font-semibold text-gray-500">Group By</label>
                        <select name="groupBy" value={groupBy} onChange={e => setGroupBy(e.target.value as GroupByType)} className="w-full mt-1 form-select bg-gray-50 dark:bg-gray-700/50 rounded-lg shadow-sm">
                            <option value="month">Group by Month</option>
                            <option value="category">Group by Category</option>
                            <option value="account">Group by Account</option>
                            <option value="none">No Grouping</option>
                        </select>
                    </div>
                    <div className="w-full self-end">
                        <button onClick={onExport} className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm shadow-sm">
                            <icons.Download size={16}/> Export ({resultCount})
                        </button>
                    </div>
                 </div>
            </div>
        </div>
    )
}

const TransactionCard = ({ transaction, category, accountName, onEdit, onDelete, isExpanded, onExpand }) => {
    const { formatCurrency } = useCurrency();
    const type = transaction.isTransfer ? 'transfer' : transaction.amount >= 0 ? 'income' : 'expense';

    const typeClasses = {
        income: { border: 'border-green-500', bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', icon: icons.TrendingUp },
        expense: { border: 'border-red-500', bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', icon: icons.TrendingDown },
        transfer: { border: 'border-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', icon: icons.ArrowRightLeft },
    };
    
    const classificationColors = {
        need: 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
        want: 'bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300',
        must: 'bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300',
    };

    const { border, bg, text } = typeClasses[type];

    return (
        <div className={`group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg border-l-4 ${border} transition-all duration-300`}>
            <div className="p-4 cursor-pointer" onClick={onExpand}>
                <div className="flex items-start gap-4">
                     <div className={`p-2 rounded-full ${bg}`}>
                        <DynamicIcon name={category?.icon || 'Folder'} size={24} className={text} />
                    </div>
                    <div className="flex-grow">
                         <div className="flex justify-between items-start">
                             <p className="font-bold text-gray-800 dark:text-gray-100">{transaction.description}</p>
                             <p className={`font-bold text-lg ${text}`}>{formatCurrency(transaction.amount)}</p>
                         </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            <span className="flex items-center gap-1.5"><icons.Calendar size={14}/> {new Date(transaction.date).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1.5"><icons.Landmark size={14}/> {accountName}</span>
                            {!transaction.isTransfer && <span className="flex items-center gap-1.5"><icons.FolderOpen size={14}/> {category?.name || 'Uncategorized'}</span>}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${bg} ${text} capitalize`}>{type}</span>
                             {transaction.classification && <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${classificationColors[transaction.classification]} capitalize`}>{transaction.classification}</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600"><icons.Edit size={16}/></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600"><icons.Trash2 size={16}/></button>
                    </div>
                </div>
            </div>
            {isExpanded && (transaction.notes || transaction.tags?.length) && (
                <div className="px-4 pb-4 pl-16 space-y-2 border-t border-gray-100 dark:border-gray-700/50 pt-3">
                    {transaction.notes && <p className="text-sm text-gray-600 dark:text-gray-300">{transaction.notes}</p>}
                    {transaction.tags && transaction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {transaction.tags.map(tag => {
                                const color = getTagColor(tag);
                                return (
                                    <span key={tag} className={`text-xs ${color.bg} ${color.text} px-2 py-1 rounded-full`}>#{tag}</span>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const AllTransactionsView: React.FC = () => {
    const { activeDashboardData, deleteTransaction, addNotification } = useAppContext();
    const { formatCurrency } = useCurrency();
    const { transactions, accounts, categories } = activeDashboardData;

    const [searchTerm, setSearchTerm] = useState('');
    const [tagFilters, setTagFilters] = useState<string[]>([]);
    const [filters, setFilters] = useState({ dateStart: '', dateEnd: '', account: 'all', type: 'all', category: 'all', classification: 'all', minAmount: '', maxAmount: '' });
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [groupBy, setGroupBy] = useState<GroupByType>('month');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ [format(new Date(), 'MMMM yyyy')]: true });
    const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);
    
    const accountMap = useMemo(() => new Map(accounts.map(a => [a.id, a.name])), [accounts]);
    const categoryMap = useMemo(() => new Map<string, Category>(categories.map(c => [c.id, c])), [categories]);
    
    const sortedTransactions = useMemo(() => {
        const minAmount = filters.minAmount !== '' ? parseFloat(filters.minAmount) : null;
        const maxAmount = filters.maxAmount !== '' ? parseFloat(filters.maxAmount) : null;
        const searchTermLower = searchTerm.toLowerCase();

        let filtered = transactions.filter(t => {
            const date = new Date(t.date);
            if (filters.dateStart && date < new Date(filters.dateStart)) return false;
            if (filters.dateEnd && date > new Date(new Date(filters.dateEnd).setHours(23, 59, 59, 999))) return false;
            if (filters.account !== 'all' && t.accountId !== filters.account) return false;
            if (filters.type !== 'all') {
                if (filters.type === 'income' && t.amount < 0) return false;
                if (filters.type === 'expense' && t.amount >= 0) return false;
                if (filters.type === 'transfer' && !t.isTransfer) return false;
            }
            if (filters.category !== 'all' && t.categoryId !== filters.category) return false;
            if (filters.classification !== 'all' && t.classification !== filters.classification) return false;
            
            if (tagFilters.length > 0) {
                if (!t.tags || !tagFilters.every(ft => t.tags!.includes(ft))) return false;
            }
            
            if (minAmount !== null && Math.abs(t.amount) < minAmount) return false;
            if (maxAmount !== null && Math.abs(t.amount) > maxAmount) return false;
            
            if (searchTermLower) {
                const category = t.categoryId ? categoryMap.get(t.categoryId) : null;
                const subCategory = category && t.subCategoryId ? category.subcategories.find(sc => sc.id === t.subCategoryId) : null;
                const account = accountMap.get(t.accountId);

                const inDescription = t.description.toLowerCase().includes(searchTermLower);
                const inNotes = t.notes?.toLowerCase().includes(searchTermLower);
                const inTags = t.tags?.some(tag => tag.toLowerCase().includes(searchTermLower));
                const inCategory = category?.name.toLowerCase().includes(searchTermLower);
                const inSubCategory = subCategory?.name.toLowerCase().includes(searchTermLower);
                const inAccount = account?.toLowerCase().includes(searchTermLower);
                
                if (!(inDescription || inNotes || inTags || inCategory || inSubCategory || inAccount)) return false;
            }

            return true;
        });
        return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filters, searchTerm, tagFilters, accounts, categories]);

    const groupedTransactions: Record<string, Transaction[]> = useMemo(() => {
        if (groupBy === 'none') return { 'All Transactions': sortedTransactions };
        return sortedTransactions.reduce((acc, t) => {
            let key = 'Uncategorized';
            if (groupBy === 'month') key = format(new Date(t.date), 'MMMM yyyy');
            else if (groupBy === 'category') key = t.isTransfer ? 'Transfers' : categoryMap.get(t.categoryId || '')?.name || 'Uncategorized';
            else if (groupBy === 'account') key = accountMap.get(t.accountId) || 'Unknown Account';
            if (!acc[key]) acc[key] = [];
            acc[key].push(t);
            return acc;
        }, {} as Record<string, Transaction[]>);
    }, [sortedTransactions, groupBy, categoryMap, accountMap]);

    const toggleGroup = (key: string) => setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleExpandTxn = (id: string) => setExpandedTxnId(prev => prev === id ? null : id);
    
    const handleExport = () => {
        if(sortedTransactions.length === 0) {
            addNotification("No transactions to export.", "info");
            return;
        }
        const dataToExport = sortedTransactions.map(t => {
            const cat = t.categoryId ? categoryMap.get(t.categoryId) : null;
            return {
                Date: new Date(t.date).toLocaleDateString(),
                Description: t.description,
                Account: accountMap.get(t.accountId) || 'N/A',
                Category: t.isTransfer ? 'Transfer' : cat?.name || 'Uncategorized',
                Subcategory: t.subCategoryId && cat ? cat.subcategories.find(sc => sc.id === t.subCategoryId)?.name || '' : '',
                Tags: t.tags?.join(', ') || '',
                Amount: t.amount,
                Classification: t.classification || '',
                Notes: t.notes || ''
            };
        });
        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to move this transaction to trash?")) {
            deleteTransaction(id);
        }
    }

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                All Transactions
                <HelpTooltip text="View, search, and filter all your transactions across all accounts. Use the powerful filters to drill down into your financial data." />
            </h3>
            <FilterPanel {...{ filters, setFilters, searchTerm, setSearchTerm, tagFilters, setTagFilters, accounts, categories, groupBy, setGroupBy, onExport: handleExport, resultCount: sortedTransactions.length }} />
            <div className="space-y-6">
                {Object.entries(groupedTransactions).map(([groupKey, groupTransactions]) => {
                    const groupTotal = groupTransactions.reduce((sum, t) => sum + t.amount, 0);
                    return (
                        <div key={groupKey} className="bg-gray-100 dark:bg-gray-800/50 rounded-xl">
                            <div className="p-3 flex justify-between items-center cursor-pointer" onClick={() => toggleGroup(groupKey)}>
                                <div className="flex items-center gap-2">
                                    <icons.ChevronDown className={`transition-transform ${expandedGroups[groupKey] ? '' : '-rotate-90'}`} size={20} />
                                    <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100">{groupKey}</h4>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">({groupTransactions.length} transactions)</span>
                                </div>
                                <div className="font-semibold text-gray-700 dark:text-gray-200">{formatCurrency(groupTotal)}</div>
                            </div>
                            
                            {expandedGroups[groupKey] && (
                                <div className="p-2 md:p-4 space-y-3">
                                    {groupTransactions.map(t => (
                                        <TransactionCard
                                            key={t.id}
                                            transaction={t}
                                            category={t.isTransfer ? undefined : categoryMap.get(t.categoryId || '')}
                                            accountName={accountMap.get(t.accountId) || 'N/A'}
                                            onEdit={() => setEditingTransaction(t)}
                                            onDelete={() => handleDelete(t.id)}
                                            isExpanded={expandedTxnId === t.id}
                                            onExpand={() => toggleExpandTxn(t.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
                {sortedTransactions.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        No transactions match your filters.
                    </div>
                )}
            </div>
            {editingTransaction && <TransactionModal transaction={editingTransaction} onClose={() => setEditingTransaction(null)}/>}
        </div>
    );
};

export default AllTransactionsView;