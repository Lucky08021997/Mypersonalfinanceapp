import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useCurrency } from '../hooks/useCurrency';
import type { TrashedTransaction, TrashedAccount } from '../types';
import { X, RotateCw, Trash2, AlertTriangle, Landmark, CircleSlash } from 'lucide-react';

const timeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "just now";
    
    let interval = seconds / 86400;
    if (interval > 1) {
        const days = Math.floor(interval);
        return days === 1 ? "1 day ago" : `${days} days ago`;
    }
    
    interval = seconds / 3600;
    if (interval > 1) {
        const hours = Math.floor(interval);
        return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }

    interval = seconds / 60;
    if (interval > 1) {
        const minutes = Math.floor(interval);
        return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    }
    return Math.floor(seconds) + " seconds ago";
};

const getDaysLeftText = (deletedAt: string) => {
    const deleteDate = new Date(new Date(deletedAt).getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = deleteDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Deletes today";
    if (diffDays === 1) return "1 day left";
    return `${diffDays} days left`;
};

interface TrashModalProps {
  onClose: () => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({ onClose }) => {
    const { activeDashboardData, restoreTransactions, permanentlyDeleteTransactions, emptyTrash, restoreAccount, permanentlyDeleteAccount, emptyAccountTrash } = useAppContext();
    const { formatCurrency } = useCurrency();
    const { trash, trashedAccounts, accounts } = activeDashboardData;

    const [activeTab, setActiveTab] = useState<'transactions' | 'accounts'>('transactions');
    
    const [selectedTxnIds, setSelectedTxnIds] = useState<string[]>([]);
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

    const accountMap = useMemo(() => new Map<string, string>(accounts.map(acc => [acc.id, acc.name])), [accounts]);
    
    const sortedTrash = useMemo(() => {
        return [...(trash || [])].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
    }, [trash]);

    const sortedTrashedAccounts = useMemo(() => {
        return [...(trashedAccounts || [])].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
    }, [trashedAccounts]);

    // Handlers for transaction selection
    const handleSelectTxn = (id: string) => {
        setSelectedTxnIds(prev => prev.includes(id) ? prev.filter(txnId => txnId !== id) : [...prev, id]);
    };
    const handleSelectAllTxns = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedTxnIds(sortedTrash.map(item => item.transaction.id));
        } else {
            setSelectedTxnIds([]);
        }
    };
    
    // Handlers for account selection
    const handleSelectAccount = (id: string) => {
        setSelectedAccountIds(prev => prev.includes(id) ? prev.filter(accId => accId !== id) : [...prev, id]);
    };
    const handleSelectAllAccounts = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedAccountIds(sortedTrashedAccounts.map(item => item.account.id));
        } else {
            setSelectedAccountIds([]);
        }
    };
    
    const handleRestoreSelected = () => {
        if(activeTab === 'transactions') {
            restoreTransactions(selectedTxnIds);
            setSelectedTxnIds([]);
        } else {
            selectedAccountIds.forEach(id => restoreAccount(id));
            setSelectedAccountIds([]);
        }
    };
    
    const handleDeleteSelected = () => {
        if(activeTab === 'transactions') {
            permanentlyDeleteTransactions(selectedTxnIds);
            setSelectedTxnIds([]);
        } else {
            selectedAccountIds.forEach(id => permanentlyDeleteAccount(id));
            setSelectedAccountIds([]);
        }
    }

    const renderTransactionContent = () => (
        <>
            {sortedTrash.length > 0 && selectedTxnIds.length > 0 && (
                <div className="bg-gray-100 dark:bg-gray-900/50 p-2 flex justify-between items-center mb-4 rounded-lg">
                    <span className="text-sm font-medium px-2">{selectedTxnIds.length} selected</span>
                    <div className="flex items-center gap-2">
                        <button onClick={handleRestoreSelected} className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-semibold p-2 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50">
                            <RotateCw size={16}/> Restore
                        </button>
                        <button onClick={handleDeleteSelected} className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-500 font-semibold p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50">
                            <Trash2 size={16}/> Delete Permanently
                        </button>
                    </div>
                </div>
            )}
             <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="py-3 px-4 text-left"><input type="checkbox" onChange={handleSelectAllTxns} checked={sortedTrash.length > 0 && selectedTxnIds.length === sortedTrash.length} className="form-checkbox h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/></th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</th>
                                <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deleted</th>
                                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedTrash.map(item => {
                                const txn = item.transaction;
                                const isIncome = txn.amount >= 0;
                                return (
                                    <tr key={txn.id}>
                                        <td className="py-3 px-4"><input type="checkbox" checked={selectedTxnIds.includes(txn.id)} onChange={() => handleSelectTxn(txn.id)} className="form-checkbox h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/></td>
                                        <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-100">{txn.description}</td>
                                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{accountMap.get(txn.accountId) || 'N/A'}</td>
                                        <td className={`py-3 px-4 font-semibold text-right ${isIncome ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(txn.amount)}</td>
                                        <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{timeAgo(item.deletedAt)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <button onClick={() => restoreTransactions([txn.id])} title="Restore" className="p-2 text-gray-500 hover:text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50"><RotateCw size={16}/></button>
                                            <button onClick={() => permanentlyDeleteTransactions([txn.id])} title="Delete Permanently" className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                {sortedTrash.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        <p className="font-semibold">Transaction trash is empty.</p>
                    </div>
                )}
            </div>
        </>
    );

    const renderAccountContent = () => (
        <>
            {sortedTrashedAccounts.length > 0 && selectedAccountIds.length > 0 && (
                <div className="bg-gray-100 dark:bg-gray-900/50 p-2 flex justify-between items-center mb-4 rounded-lg">
                    <span className="text-sm font-medium px-2">{selectedAccountIds.length} selected</span>
                    <div className="flex items-center gap-2">
                        <button onClick={handleRestoreSelected} className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400 font-semibold p-2 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50">
                            <RotateCw size={16}/> Restore
                        </button>
                        <button onClick={handleDeleteSelected} className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-500 font-semibold p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50">
                            <Trash2 size={16}/> Delete Permanently
                        </button>
                    </div>
                </div>
            )}
             <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="py-3 px-4 text-left"><input type="checkbox" onChange={handleSelectAllAccounts} checked={sortedTrashedAccounts.length > 0 && selectedAccountIds.length === sortedTrashedAccounts.length} className="form-checkbox h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/></th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account Name</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deletion Countdown</th>
                                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {sortedTrashedAccounts.map(item => (
                                <tr key={item.account.id}>
                                    <td className="py-3 px-4"><input type="checkbox" checked={selectedAccountIds.includes(item.account.id)} onChange={() => handleSelectAccount(item.account.id)} className="form-checkbox h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"/></td>
                                    <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-100">{item.account.name}</td>
                                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{item.account.type}</td>
                                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">{getDaysLeftText(item.deletedAt)}</td>
                                    <td className="py-3 px-4 text-center">
                                        <button onClick={() => restoreAccount(item.account.id)} title="Restore" className="p-2 text-gray-500 hover:text-green-500 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50"><RotateCw size={16}/></button>
                                        <button onClick={() => permanentlyDeleteAccount(item.account.id)} title="Delete Permanently" className="p-2 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {sortedTrashedAccounts.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                         <p className="font-semibold">Account trash is empty.</p>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Trash</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={24} /></button>
                </div>
                
                 <div className="p-6 pb-0">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('transactions')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'transactions' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                Transactions
                            </button>
                            <button
                                onClick={() => setActiveTab('accounts')}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'accounts' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                Accounts
                            </button>
                        </nav>
                    </div>
                </div>

                <div className="p-6 flex-grow overflow-y-auto">
                    <div className="bg-blue-50 dark:bg-blue-900/40 border-l-4 border-blue-500 text-blue-800 dark:text-blue-200 p-4 rounded-md mb-4" role="alert">
                        <p className="font-bold">Heads up!</p>
                        <p className="text-sm">Items in the Trash will be permanently deleted after 7 days.</p>
                    </div>

                    {activeTab === 'transactions' ? renderTransactionContent() : renderAccountContent()}

                    {activeTab === 'transactions' && sortedTrash.length === 0 && sortedTrashedAccounts.length === 0 && (
                         <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-4 font-semibold">The Trash is empty.</p>
                            <p className="text-sm">Deleted items will appear here.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                     <button 
                        type="button" 
                        onClick={() => {
                            const action = activeTab === 'transactions' ? emptyTrash : emptyAccountTrash;
                            const itemType = activeTab === 'transactions' ? 'transactions' : 'accounts';
                            if (window.confirm(`Are you sure you want to permanently delete all ${itemType} in the trash? This action cannot be undone.`)) {
                                action();
                            }
                        }}
                        disabled={activeTab === 'transactions' ? sortedTrash.length === 0 : sortedTrashedAccounts.length === 0}
                        className="bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 dark:hover:bg-red-900 transition-colors text-sm disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-300 dark:disabled:border-gray-600"
                    >
                        Empty {activeTab === 'transactions' ? 'Transaction' : 'Account'} Trash
                    </button>
                    <button type="button" onClick={onClose} className="bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors">Done</button>
                </div>
            </div>
        </div>
    );
};