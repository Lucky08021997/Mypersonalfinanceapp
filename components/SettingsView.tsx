
import React, { useState, useMemo } from 'react';
import { Settings, Trash2, Upload, Edit, Plus, Wrench, Palette, Archive, RotateCcw, Calculator } from 'lucide-react';
import { useAppContext } from '../hooks/useAppContext';
import type { Account } from '../types';
import AddAccountModal from './AddAccountModal';
import EditAccountModal from './EditAccountModal';
import ConfirmDeleteAccountModal from './ConfirmDeleteAccountModal';
import { CURRENCIES } from '../constants';
import { useCurrency } from '../hooks/useCurrency';
import ThemeCustomizationModal from './ThemeCustomizationModal';
import CalculatorsModal from './CalculatorsModal';
import HelpTooltip from './HelpTooltip';


const AccountList: React.FC = () => {
    const { activeDashboardData, trashAccount } = useAppContext();
    const { accounts, transactions } = activeDashboardData; // This now only returns non-archived accounts
    const { formatCurrency } = useCurrency();

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

    const accountBalances = useMemo(() => {
        const balances = new Map<string, number>();
        accounts.forEach(acc => {
            const balance = transactions
                .filter(t => t.accountId === acc.id)
                .reduce((sum, txn) => sum + txn.amount, 0);
            balances.set(acc.id, balance);
        });
        return balances;
    }, [accounts, transactions]);

    const transactionCounts = useMemo(() => {
        const counts = new Map<string, number>();
        accounts.forEach(acc => {
            counts.set(acc.id, transactions.filter(t => t.accountId === acc.id).length);
        });
        return counts;
    }, [accounts, transactions]);

    const handleDeleteClick = (account: Account) => {
        setDeletingAccount(account);
    };

    const confirmDelete = () => {
        if (deletingAccount) {
            trashAccount(deletingAccount.id);
            setDeletingAccount(null);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Active Accounts</h3>
                    <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm">
                        <Plus size={18} /> Add Account
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700/50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Name</th>
                                <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Type</th>
                                <th className="py-3 px-4 text-right text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Balance</th>
                                <th className="py-3 px-4 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {accounts.map(account => {
                                const balance = accountBalances.get(account.id) || 0;
                                const isNegative = balance < 0;
                                const displayBalance = account.type === 'Loan' ? Math.abs(balance) : balance;
                                let balanceColor = 'text-gray-800 dark:text-gray-200';
                                if (account.type === 'Loan') {
                                    balanceColor = isNegative ? 'text-red-600' : 'text-green-600';
                                } else {
                                    balanceColor = isNegative ? 'text-red-600' : 'text-green-600';
                                }

                                return (
                                    <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-100">{account.name}</td>
                                        <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{account.type}</td>
                                        <td className={`py-3 px-4 text-right font-semibold ${balanceColor}`}>{formatCurrency(displayBalance)}</td>
                                        <td className="py-3 px-4 text-center">
                                            <button onClick={() => setEditingAccount(account)} title="Edit" className="p-2 text-gray-500 hover:text-blue-500 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/50"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteClick(account)} title="Delete" className="p-2 text-gray-500 hover:text-red-500 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50"><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {accounts.length === 0 && <div className="text-center py-8 text-gray-500">No active accounts found.</div>}
                </div>
            </div>

            {isAddModalOpen && <AddAccountModal onClose={() => setAddModalOpen(false)} />}
            {editingAccount && <EditAccountModal account={editingAccount} onClose={() => setEditingAccount(null)} />}
            {deletingAccount && (
                <ConfirmDeleteAccountModal
                    account={deletingAccount}
                    transactionCount={transactionCounts.get(deletingAccount.id) || 0}
                    onClose={() => setDeletingAccount(null)}
                    onConfirm={confirmDelete}
                />
            )}
        </>
    );
};

const ArchivedAccountsList: React.FC = () => {
    const { state, unarchiveAccount } = useAppContext();
    const archivedAccounts = useMemo(() => {
        const dashboard = state.activeDashboard ? state[state.activeDashboard] : null;
        return dashboard ? dashboard.accounts.filter(acc => acc.isArchived) : [];
    }, [state.activeDashboard, state.personal, state.home]);

    if(archivedAccounts.length === 0) return null;

    return (
         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Archived Accounts</h3>
             <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700/50">
                        <tr>
                            <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Name</th>
                            <th className="py-3 px-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Type</th>
                            <th className="py-3 px-4 text-center text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {archivedAccounts.map(account => (
                            <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="py-3 px-4 font-medium text-gray-800 dark:text-gray-100">{account.name}</td>
                                <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{account.type}</td>
                                <td className="py-3 px-4 text-center">
                                    <button onClick={() => unarchiveAccount(account.id)} title="Restore" className="flex items-center gap-2 mx-auto text-sm text-green-600 font-semibold p-2 rounded-md hover:bg-green-100 dark:hover:bg-green-900/50">
                                        <RotateCcw size={16}/> Restore
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
         </div>
    )
}

interface SettingsActionProps {
    icon: React.ElementType;
    title: string;
    description: string;
    onClick?: () => void;
    children?: React.ReactNode;
}

const SettingsAction: React.FC<SettingsActionProps> = ({ icon: Icon, title, description, onClick, children }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Icon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            <div>
                <h4 className="font-bold text-gray-800 dark:text-gray-100">{title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
            </div>
        </div>
        {children || (
            <button onClick={onClick} className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm">
                Manage
            </button>
        )}
    </div>
);

interface SettingsViewProps {
    onManageCategories: () => void;
    onViewTrash: () => void;
    onImport: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onManageCategories, onViewTrash, onImport }) => {
    const { state, setCurrency } = useAppContext();
    const [isThemeModalOpen, setThemeModalOpen] = useState(false);
    const [isCalculatorsModalOpen, setCalculatorsModalOpen] = useState(false);
    
    return (
        <div>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    Settings
                    <HelpTooltip text="Manage your app's configuration. Here you can handle accounts, categories, data import/export, and customize the app's appearance." />
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your accounts, data, and application settings.</p>
            </div>
            
            <AccountList />
            <ArchivedAccountsList />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Data & Customization</h3>
                <div className="space-y-6">
                    <SettingsAction
                        icon={Palette}
                        title="Theme & Appearance"
                        description="Customize the look and feel of the application."
                        onClick={() => setThemeModalOpen(true)}
                    />
                    <hr className="border-gray-200 dark:border-gray-700"/>
                     <SettingsAction
                        icon={Wrench}
                        title="Currency"
                        description="Set the default currency for the entire app."
                    >
                         <select
                            id="currency-select"
                            value={state.currency}
                            onChange={e => setCurrency(e.target.value)}
                            className="form-select w-auto max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md bg-white dark:bg-gray-700"
                        >
                            {CURRENCIES.map(c => (
                                <option key={c.code} value={c.code}>
                                    {c.symbol} {c.code} - {c.name}
                                </option>
                            ))}
                        </select>
                    </SettingsAction>
                    <hr className="border-gray-200 dark:border-gray-700"/>
                    <SettingsAction
                        icon={Calculator}
                        title="Financial Tools"
                        description="Access calculators for loans, investments, and more."
                        onClick={() => setCalculatorsModalOpen(true)}
                    />
                    <hr className="border-gray-200 dark:border-gray-700"/>
                    <SettingsAction
                        icon={Settings}
                        title="Manage Categories"
                        description="Edit, delete, or import spending categories."
                        onClick={onManageCategories}
                    />
                    <hr className="border-gray-200 dark:border-gray-700"/>
                    <SettingsAction
                        icon={Trash2}
                        title="View Trash"
                        description="Restore or permanently delete items."
                        onClick={onViewTrash}
                    />
                    <hr className="border-gray-200 dark:border-gray-700"/>
                    <SettingsAction
                        icon={Upload}
                        title="Import Data"
                        description="Import transactions from CSV, XLSX, etc."
                        onClick={onImport}
                    />
                </div>
            </div>

            {isThemeModalOpen && <ThemeCustomizationModal onClose={() => setThemeModalOpen(false)} />}
            {isCalculatorsModalOpen && <CalculatorsModal onClose={() => setCalculatorsModalOpen(false)} />}
        </div>
    );
};