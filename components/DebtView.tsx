
import React, { useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { useCurrency } from '../hooks/useCurrency';
import type { Account } from '../types';
import DebtCard from './DebtCard';
import { PiggyBank, Landmark, Plus, ArchiveX } from 'lucide-react';
import HelpTooltip from './HelpTooltip';

interface DebtViewProps {
    onSelectAccount: (account: Account) => void;
    onAddDebt: () => void;
}

const DebtView: React.FC<DebtViewProps> = ({ onSelectAccount, onAddDebt }) => {
    const { activeDashboardData } = useAppContext();
    const { formatCurrency } = useCurrency();
    const { accounts, transactions } = activeDashboardData;

    const debtAccounts = useMemo(() => accounts.filter(acc => acc.type === 'Loan'), [accounts]);
    
    const accountBalances = useMemo(() => {
        const balances = new Map<string, number>();
        debtAccounts.forEach(acc => {
            const accountTransactions = transactions.filter(t => t.accountId === acc.id);
            const balance = accountTransactions.reduce((sum, txn) => sum + txn.amount, 0);
            balances.set(acc.id, balance);
        });
        return balances;
    }, [debtAccounts, transactions]);
    
    const liveDebts = useMemo(() => 
        debtAccounts
            .filter(acc => (accountBalances.get(acc.id) || 0) < 0)
            .sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime())
    , [debtAccounts, accountBalances]);

    const closedDebts = useMemo(() => 
        debtAccounts
            .filter(acc => (accountBalances.get(acc.id) || 0) >= 0)
            .sort((a, b) => a.name.localeCompare(b.name))
    , [debtAccounts, accountBalances]);

    const debtSummary = useMemo(() => {
        let totalOutstanding = 0;
        let totalPaid = 0;
        
        liveDebts.forEach(acc => {
            const balance = accountBalances.get(acc.id) || 0;
            totalOutstanding += Math.abs(balance);
        });

        transactions.forEach(txn => {
            const account = accounts.find(a => a.id === txn.accountId);
            if (account && account.type === 'Loan' && txn.description !== 'Opening Balance') {
                totalPaid += txn.amount;
            }
        })

        return { totalOutstanding, totalPaid };
    }, [liveDebts, transactions, accounts, accountBalances]);


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    Debt Dashboard
                    <HelpTooltip text="Track all your loans, including details like interest rates and payment schedules. Monitor your progress as you pay them down." />
                </h2>
                <button onClick={onAddDebt} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md">
                    <Plus size={18} /> Add Debt
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex items-center gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-full"><Landmark className="h-8 w-8 text-red-500"/></div>
                    <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-400">Total Outstanding Debt</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-500">{formatCurrency(debtSummary.totalOutstanding)}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full"><PiggyBank className="h-8 w-8 text-green-500"/></div>
                    <div>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-400">Paid Towards Debt</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-500">{formatCurrency(debtSummary.totalPaid)}</p>
                    </div>
                </div>
            </div>

            {/* Live Debts Section */}
            <div className="mb-10">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Live Debts ({liveDebts.length})</h3>
                {liveDebts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {liveDebts.map(account => (
                            <DebtCard 
                                key={account.id} 
                                account={account}
                                transactions={transactions.filter(t => t.accountId === account.id)}
                                onClick={() => onSelectAccount(account)}
                            />
                        ))}
                    </div>
                ) : debtAccounts.length > 0 ? (
                    <div className="col-span-full text-center py-12 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">No live debts!</h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Great job! Or click 'Add Debt' to track a new one.</p>
                    </div>
                ) : null }
            </div>

            {/* Closed Debts Section */}
            {closedDebts.length > 0 && (
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Closed Debts ({closedDebts.length})</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {closedDebts.map(account => (
                                <DebtCard 
                                    key={account.id} 
                                    account={account}
                                    transactions={transactions.filter(t => t.accountId === account.id)}
                                    onClick={() => onSelectAccount(account)}
                                />
                            ))}
                        </div>
                </div>
            )}


            {debtAccounts.length === 0 && (
                <div className="col-span-full text-center py-12 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <ArchiveX className="mx-auto h-10 w-10 text-gray-400 mb-2"/>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">No debts tracked yet!</h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Click the 'Add Debt' button to get started.</p>
                </div>
            )}
        </div>
    );
};

export default DebtView;