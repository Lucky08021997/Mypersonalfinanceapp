
import React, { useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useCurrency } from '../hooks/useCurrency';
import type { Category, Transaction } from '../types';
import { ArrowLeft } from 'lucide-react';
import * as icons from 'lucide-react';

const DynamicIcon = ({ name, ...props }: { name: string; [key: string]: any }) => {
    const LucideIcon = (icons as any)[name] || icons.Tag;
    return <LucideIcon {...props} />;
};

const TransactionListRow: React.FC<{ transaction: Transaction; accountName?: string; category?: Category; }> = ({ transaction, accountName, category }) => {
    const { formatCurrency } = useCurrency();
    const isIncome = transaction.amount >= 0;
    const formattedAmount = formatCurrency(transaction.amount);
    const subCategory = category?.subcategories.find(sc => sc.id === transaction.subCategoryId);

    return (
        <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{new Date(transaction.date).toLocaleDateString()}</td>
            <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-100">{transaction.description}</td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{accountName}</td>
            <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">
                {transaction.isTransfer ? (
                    <div className="flex items-center gap-2">
                        <icons.ArrowRightLeft size={16} className="text-blue-500" />
                        <span>Transfer</span>
                    </div>
                ) : (
                    <div>
                        <div>{category?.name || 'Uncategorized'}</div>
                        {subCategory && <div className="text-xs text-gray-400">{subCategory.name}</div>}
                    </div>
                )}
            </td>
            <td className={`py-3 px-4 font-semibold text-right ${isIncome ? 'text-green-500' : 'text-red-500'}`}>{formattedAmount}</td>
        </tr>
    );
};

const TransactionListView: React.FC<{ title: string; transactions: Transaction[]; onBack: () => void }> = ({ title, transactions, onBack }) => {
    const { activeDashboardData } = useAppContext();
    const { accounts, categories } = activeDashboardData;

    const accountMap = useMemo(() => new Map<string, string>(accounts.map(a => [a.id, a.name])), [accounts]);
    const categoryMap = useMemo(() => new Map<string, Category>(categories.map(c => [c.id, c])), [categories]);

    return (
        <div className="min-h-screen">
            <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeft size={20} /></button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {title}
                    </h1>
                </div>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(txn => (
                                    <TransactionListRow
                                        key={txn.id}
                                        transaction={txn}
                                        accountName={accountMap.get(txn.accountId)}
                                        category={txn.categoryId ? categoryMap.get(txn.categoryId) : undefined}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                     {transactions.length === 0 && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p>No transactions to display.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TransactionListView;