
import React, { useState, useMemo, useCallback } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useCurrency } from '../hooks/useCurrency';
import type { Account, Transaction, Category } from '../types';
import TransactionModal from './TransactionModal';
import { BulkEditModal } from './BulkEditModal';
import { ExportModal } from './ExportModal';
import EditAccountModal from './EditAccountModal';
import * as icons from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { getTagColor } from '../constants';

const DynamicIcon = ({ name, ...props }: { name: string; [key: string]: any }) => {
    const LucideIcon = (icons as any)[name] || icons.Tag;
    return <LucideIcon {...props} />;
};

const TransactionRow: React.FC<{ transaction: Transaction; category?: Category; balance: number; isSelected: boolean; onSelect: () => void; onRowClick: () => void; }> = ({ transaction, category, balance, isSelected, onSelect, onRowClick }) => {
    const { formatCurrency } = useCurrency();
    const isIncome = transaction.amount >= 0;
    const formattedAmount = formatCurrency(Math.abs(transaction.amount));
    const formattedBalance = formatCurrency(balance);
    const subCategory = category?.subcategories.find(sc => sc.id === transaction.subCategoryId);

    return (
        <tr 
            className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 group ${!transaction.isTransfer ? 'cursor-pointer' : 'cursor-default'}`} 
            onClick={!transaction.isTransfer ? onRowClick : undefined}
        >
            <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={isSelected} onChange={onSelect} className="form-checkbox h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            </td>
            <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{new Date(transaction.date).toLocaleDateString()}</td>
            <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-100">
                {transaction.description}
                <div className="flex flex-wrap gap-1 mt-1">
                    {transaction.tags?.map(tag => {
                        const color = getTagColor(tag);
                        return (
                           <span key={tag} className={`text-xs ${color.bg} ${color.text} px-2 py-0.5 rounded-full`}>#{tag}</span>
                        )
                    })}
                </div>
            </td>
            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                {transaction.isTransfer ? (
                    <div className="flex items-center gap-2">
                        <icons.ArrowRightLeft size={16} className="text-blue-500" />
                        <span>Transfer</span>
                    </div>
                ) : (
                    <div>
                        <div>{category?.name || 'Uncategorized'}</div>
                        {subCategory && <div className="text-xs text-gray-500">{subCategory.name}</div>}
                    </div>
                )}
            </td>
            <td className={`py-3 px-4 font-semibold text-right ${isIncome ? 'text-green-600' : 'text-red-600'}`}>{isIncome ? formattedAmount : ''}</td>
            <td className={`py-3 px-4 font-semibold text-right ${!isIncome ? 'text-red-600' : 'text-green-600'}`}>{!isIncome ? formattedAmount : ''}</td>
            <td className={`py-3 px-4 font-semibold text-right ${balance >= 0 ? 'text-gray-800 dark:text-gray-200' : 'text-red-500'}`}>{formattedBalance}</td>
        </tr>
    );
};

export const AccountDetailView: React.FC<{ account: Account }> = ({ account }) => {
    const { activeDashboardData, deleteMultipleTransactions, addNotification } = useAppContext();
    const { formatCurrency } = useCurrency();
    const { transactions, categories } = activeDashboardData;

    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isNewTxnModalOpen, setNewTxnModalOpen] = useState(false);
    const [selectedTxnIds, setSelectedTxnIds] = useState<string[]>([]);
    const [isBulkEditOpen, setBulkEditOpen] = useState(false);
    const [isExportModalOpen, setExportModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [visibleCount, setVisibleCount] = useState(50);

    const categoryMap = useMemo(() => new Map<string, Category>(categories.map(c => [c.id, c])), [categories]);

    const openingBalance = useMemo(() => 
        transactions.find(t => t.accountId === account.id && t.description === 'Opening Balance')?.amount || 0,
    [transactions, account.id]);
    
    const accountTransactions = useMemo(() => {
        return transactions
            .filter(t => t.accountId === account.id)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [transactions, account.id]);

    const filteredTransactions = useMemo(() => {
        if (!dateRange.start && !dateRange.end) return accountTransactions;
        const start = dateRange.start ? new Date(dateRange.start).getTime() : 0;
        const end = dateRange.end ? new Date(dateRange.end).setHours(23, 59, 59, 999) : Infinity;
        return accountTransactions.filter(t => {
            const time = new Date(t.date).getTime();
            return time >= start && time <= end;
        });
    }, [accountTransactions, dateRange]);
    
    const transactionsWithBalance = useMemo(() => {
        let currentBalance = 0;
        // Find if an opening balance exists outside the filtered range to start from
        const nonFilteredOpening = accountTransactions
            .filter(t => new Date(t.date).getTime() < (dateRange.start ? new Date(dateRange.start).getTime() : 0))
            .reduce((acc, curr) => acc + curr.amount, 0);
        
        currentBalance = nonFilteredOpening;

        return filteredTransactions.map(txn => {
            currentBalance += txn.amount;
            return { ...txn, balance: currentBalance };
        });
    }, [filteredTransactions, dateRange.start, accountTransactions]);

    const visibleTransactions = useMemo(() => transactionsWithBalance.slice(0, visibleCount), [transactionsWithBalance, visibleCount]);

    const finalBalance = transactionsWithBalance.length > 0 
        ? transactionsWithBalance[transactionsWithBalance.length - 1].balance 
        : openingBalance;

    const totals = useMemo(() => {
        return transactionsWithBalance.reduce((acc, txn) => {
            if (txn.isTransfer) return acc;
            if (txn.amount > 0) acc.credit += txn.amount;
            else acc.debit += Math.abs(txn.amount);
            return acc;
        }, {debit: 0, credit: 0});
    }, [transactionsWithBalance]);

    const handleSelect = (id: string) => {
        setSelectedTxnIds(prev => prev.includes(id) ? prev.filter(txnId => txnId !== id) : [...prev, id]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedTxnIds(visibleTransactions.map(t => t.id));
        } else {
            setSelectedTxnIds([]);
        }
    };
    
    const handleBulkDelete = () => {
        deleteMultipleTransactions(selectedTxnIds);
        setSelectedTxnIds([]);
    };
    
    const handleExport = (mode: 'filtered' | 'selected', format: 'csv' | 'pdf' | 'xlsx') => {
        if (mode === 'selected' && selectedTxnIds.length === 0) {
            addNotification('⚠️ Please select at least one transaction.', 'error');
            return;
        }

        const transactionsToExport = mode === 'selected'
            ? transactionsWithBalance.filter(t => selectedTxnIds.includes(t.id))
            : transactionsWithBalance;

        if (transactionsToExport.length === 0) {
            addNotification('No transactions to export.', 'info');
            return;
        }

        const dataToExport = transactionsToExport.map(txn => {
            const category = categoryMap.get(txn.categoryId || '');
            const subCategory = category?.subcategories.find(sc => sc.id === txn.subCategoryId);
            return {
                'Date': new Date(txn.date).toLocaleDateString(),
                'Description': txn.description,
                'Debit': txn.amount < 0 ? Math.abs(txn.amount).toFixed(2) : '',
                'Credit': txn.amount >= 0 ? txn.amount.toFixed(2) : '',
                'Category': txn.isTransfer ? 'Transfer' : (category?.name || 'N/A'),
                'Subcategory': txn.isTransfer ? '' : (subCategory?.name || 'N/A'),
                'Tags': txn.tags?.join(', ') || '',
                'Notes': txn.notes || ''
            };
        });

        const month = new Date().toLocaleString('default', { month: 'long' });
        const year = new Date().getFullYear();
        const filename = `${account.name.replace(/\s/g, '_')}_Transactions_${month}${year}`;

        if (format === 'csv') {
            const csvContent = Papa.unparse(dataToExport);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}.csv`;
            link.click();
        } else if (format === 'xlsx') {
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
            XLSX.writeFile(workbook, `${filename}.xlsx`);
        } else { // PDF
            const doc = new jsPDF();
            doc.text(`${account.name} - Transactions`, 14, 16);
            autoTable(doc, {
                head: [['Date', 'Description', 'Category', 'Subcategory', 'Debit', 'Credit', 'Notes']],
                body: dataToExport.map(row => [row.Date, row.Description, row.Category, row.Subcategory, row.Debit, row.Credit, row.Notes]),
                startY: 20
            });
            doc.save(`${filename}.pdf`);
        }
        addNotification(`✅ Export started for ${transactionsToExport.length} transaction(s).`, 'success');
        setExportModalOpen(false);
    }


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                 <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{account.name}</h2>
                            <button onClick={() => setEditModalOpen(true)} title="Edit Account" className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                                <icons.Edit size={18}/>
                            </button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">{account.type}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Current Balance</p>
                        <p className={`text-3xl font-extrabold ${finalBalance >= 0 && account.type !== 'Loan' ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(account.type === 'Loan' ? Math.abs(finalBalance) : finalBalance)}
                        </p>
                    </div>
                 </div>

                 {account.type === 'Loan' && (
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 font-semibold">Debt Type</p>
                            <p className="font-bold text-gray-800 dark:text-gray-100">{account.debtType || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 font-semibold">Interest Rate</p>
                            <p className="font-bold text-gray-800 dark:text-gray-100">{account.interestRate ? `${account.interestRate}%` : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 font-semibold">Installment</p>
                            <p className="font-bold text-gray-800 dark:text-gray-100">{account.installment ? formatCurrency(account.installment) : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 font-semibold">Next Due Date</p>
                            <p className="font-bold text-gray-800 dark:text-gray-100">{account.dueDate ? new Date(account.dueDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                 )}
            </div>

             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
                 <div className="flex flex-wrap justify-end items-center gap-4">
                    {/* Filters and Actions */}
                    <div className="flex items-center gap-4">
                        <button onClick={() => setNewTxnModalOpen(true)} className="flex items-center gap-2 bg-primary-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-sm shadow-sm">
                            <icons.Plus size={16}/> {account.type === 'Loan' ? 'Log Payment' : 'Add Transaction'}
                        </button>
                        <div className="flex items-center gap-2">
                             <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({...p, start: e.target.value}))} className="form-input text-sm py-1 px-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md"/>
                             <span className="text-gray-500">-</span>
                             <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({...p, end: e.target.value}))} className="form-input text-sm py-1 px-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md"/>
                        </div>
                        <button onClick={() => setExportModalOpen(true)} className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm">
                            <icons.Download size={16}/> Export
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                {selectedTxnIds.length > 0 && (
                    <div className="bg-gray-100 dark:bg-gray-900/50 p-2 flex justify-between items-center">
                        <span className="text-sm font-medium px-2">{selectedTxnIds.length} selected</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setBulkEditOpen(true)} className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 font-semibold p-2 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                <icons.Edit size={16}/> Edit
                            </button>
                            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-500 font-semibold p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50">
                                <icons.Trash2 size={16}/> Delete
                            </button>
                        </div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700/50">
                            <tr>
                                <th className="py-3 px-4 text-left"><input type="checkbox" onChange={handleSelectAll} checked={selectedTxnIds.length > 0 && selectedTxnIds.length === visibleTransactions.length} className="form-checkbox h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/></th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Category</th>
                                <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                                <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Withdrawal</th>
                                <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleTransactions.map(txn => (
                                <TransactionRow 
                                    key={txn.id}
                                    transaction={txn}
                                    category={txn.categoryId ? categoryMap.get(txn.categoryId) : undefined}
                                    balance={txn.balance}
                                    isSelected={selectedTxnIds.includes(txn.id)}
                                    onSelect={() => handleSelect(txn.id)}
                                    onRowClick={() => setEditingTransaction(txn)}
                                />
                            ))}
                        </tbody>
                         <tfoot className="bg-gray-100 dark:bg-gray-700/50 font-bold">
                            <tr>
                                <td colSpan={4} className="py-3 px-4 text-right text-gray-700 dark:text-gray-200">Totals</td>
                                <td className="py-3 px-4 text-right text-green-600">{formatCurrency(totals.credit)}</td>
                                <td className="py-3 px-4 text-right text-red-600">{formatCurrency(totals.debit)}</td>
                                <td className="py-3 px-4"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                 {visibleTransactions.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p>No transactions found for this period.</p>
                    </div>
                )}
                 {transactionsWithBalance.length > visibleCount && (
                    <div className="text-center py-4 bg-gray-50 dark:bg-gray-900/20">
                        <button 
                            onClick={() => setVisibleCount(c => c + 50)}
                            className="bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-lg font-semibold hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors text-sm"
                        >
                            Load More Transactions
                        </button>
                    </div>
                )}
            </div>


            {editingTransaction && (
                <TransactionModal
                    transaction={editingTransaction}
                    onClose={() => setEditingTransaction(null)}
                />
            )}
            {isNewTxnModalOpen && (
                <TransactionModal
                    onClose={() => setNewTxnModalOpen(false)}
                    defaultAccountId={account.id}
                />
            )}
            {isBulkEditOpen && (
                <BulkEditModal 
                    transactionIds={selectedTxnIds} 
                    onClose={() => {
                        setBulkEditOpen(false);
                        setSelectedTxnIds([]);
                    }}
                />
            )}
            {isExportModalOpen && (
                <ExportModal
                    onClose={() => setExportModalOpen(false)}
                    onExport={handleExport}
                    selectedCount={selectedTxnIds.length}
                    filteredCount={transactionsWithBalance.length}
                />
            )}
             {isEditModalOpen && (
                <EditAccountModal account={account} onClose={() => setEditModalOpen(false)} />
            )}
        </div>
    );
};