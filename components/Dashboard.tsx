
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import AccountCard from './AccountCard';
import type { Account, Transaction } from '../types';
import { LogOut, Moon, Sun, ArrowLeft, Settings, LayoutDashboard, Banknote, CandlestickChart, List, Target, Home, Briefcase, Sparkles } from 'lucide-react';
import TransactionModal from './TransactionModal';
import { FileUploadModal } from './FileUploadModal';
import { AccountDetailView } from './AccountDetailView';
import AddAccountModal from './AddAccountModal';
import { CategoryManagerModal } from './CategoryManagerModal';
import { TrashModal } from './TrashModal';
import TransactionListView from './TransactionListView';
import { SettingsView } from './SettingsView';
import DebtView from './DebtView';
import CashflowQuadrant from './CashflowQuadrant';
import MultiActionButton from './MultiActionButton';
import AnalyticsView from './AnalyticsView';
import AllTransactionsView from './AllTransactionsView';
import BudgetsView from './BudgetsView';
import HelpTooltip from './HelpTooltip';

const DashboardHeader: React.FC<{ onBack?: () => void; onLogout: () => void; onOpenAiChat: () => void; }> = ({ onBack, onLogout, onOpenAiChat }) => {
    const { state, selectDashboard, setTheme } = useAppContext();
    
    const handleToggleTheme = () => {
        setTheme({
            ...state.theme,
            mode: state.theme.mode === 'light' ? 'dark' : 'light'
        });
    };
    
    return (
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 z-20">
            <div className="flex items-center gap-4">
                {onBack && <button onClick={onBack} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowLeft size={20} /></button>}
                 <div className="flex items-center bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                    <button 
                        onClick={() => selectDashboard('personal')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${state.activeDashboard === 'personal' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        <Briefcase size={16} /> Personal
                    </button>
                    <button 
                        onClick={() => selectDashboard('home')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center gap-2 ${state.activeDashboard === 'home' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}
                    >
                        <Home size={16} /> Home
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                 <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:block">
                   Welcome, {state.currentUser?.name}
                 </p>
                 <button onClick={onOpenAiChat} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-primary-500" title="AI Assistant">
                    <Sparkles size={20} />
                 </button>
                 <button onClick={handleToggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    {state.theme.mode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
                <button onClick={onLogout} className="flex items-center gap-2 text-sm p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
};

type Tab = 'overview' | 'transactions' | 'analytics' | 'debts' | 'budgets' | 'settings';

const TabButton: React.FC<{ label: string; icon: React.ElementType; isActive: boolean; onClick: () => void; }> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
            isActive
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
        }`}
    >
        <Icon size={18} />
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const Dashboard: React.FC<{ onOpenAiChat: () => void }> = ({ onOpenAiChat }) => {
    const { activeDashboardData, logout } = useAppContext();
    const { accounts, transactions } = activeDashboardData;
    
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [isTxnModalOpen, setTxnModalOpen] = useState(false);
    const [defaultAccountIdForNewTxn, setDefaultAccountIdForNewTxn] = useState<string | undefined>();
    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [isAccountModalOpen, setAccountModalOpen] = useState(false);
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [isTrashModalOpen, setTrashModalOpen] = useState(false);
    const [listView, setListView] = useState<{ type: 'income' | 'expenses' | 'total' | 'assets' | 'liabilities', title: string } | null>(null);

    const [activeTab, setActiveTab] = useState<Tab>('overview');
    
    const accountBalances = useMemo(() => {
        const balances = new Map<string, number>();
        accounts.forEach(acc => {
            const accountTransactions = transactions.filter(t => t.accountId === acc.id);
            const balance = accountTransactions.reduce((sum, txn) => sum + txn.amount, 0);
            balances.set(acc.id, balance);
        });
        return balances;
    }, [accounts, transactions]);

    const handleOpenTxnModal = (accountId?: string) => {
        setDefaultAccountIdForNewTxn(accountId);
        setTxnModalOpen(true);
    };

    const handleCloseTxnModal = () => {
        setDefaultAccountIdForNewTxn(undefined);
        setTxnModalOpen(false);
    };
    
    const handleDrillDown = (type: string, title: string) => {
        if (['income', 'expenses', 'assets', 'liabilities'].includes(type)) {
            setListView({ type: type as any, title });
        } else {
            setListView({ type: 'total', title });
        }
    };

    if (listView) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        let filteredTransactions: Transaction[] = [];

        switch(listView.type) {
            case 'income':
                filteredTransactions = transactions.filter(t => new Date(t.date) >= startOfMonth && t.amount > 0 && !t.isTransfer);
                break;
            case 'expenses':
                filteredTransactions = transactions.filter(t => new Date(t.date) >= startOfMonth && t.amount < 0 && !t.isTransfer);
                break;
            case 'assets':
                const assetAccountIds = new Set(accounts.filter(a => ['Bank', 'Investment', 'Cash'].includes(a.type)).map(a => a.id));
                filteredTransactions = transactions.filter(t => assetAccountIds.has(t.accountId));
                break;
            case 'liabilities':
                const liabilityAccountIds = new Set(accounts.filter(a => ['Credit Card', 'Loan'].includes(a.type)).map(a => a.id));
                 filteredTransactions = transactions.filter(t => liabilityAccountIds.has(t.accountId));
                break;
            default: // 'total'
                filteredTransactions = [...transactions];
                break;
        }
        
        const sortedTransactions = filteredTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        return <TransactionListView title={listView.title} transactions={sortedTransactions} onBack={() => setListView(null)} />;
    }

    if (selectedAccount) {
        return (
            <div className="min-h-screen">
                <DashboardHeader onBack={() => setSelectedAccount(null)} onLogout={logout} onOpenAiChat={onOpenAiChat} />
                <AccountDetailView account={selectedAccount} />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <DashboardHeader onLogout={logout} onBack={selectedAccount ? () => setSelectedAccount(null) : undefined} onOpenAiChat={onOpenAiChat} />
            
            <div className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-[73px] z-10">
                <nav className="flex space-x-1 sm:space-x-4 px-4 sm:px-6 lg:px-8 -mb-px">
                    <TabButton label="Overview" icon={LayoutDashboard} isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                    <TabButton label="Transactions" icon={List} isActive={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} />
                    <TabButton label="Analytics" icon={CandlestickChart} isActive={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
                    <TabButton label="Debts" icon={Banknote} isActive={activeTab === 'debts'} onClick={() => setActiveTab('debts')} />
                    <TabButton label="Budgets" icon={Target} isActive={activeTab === 'budgets'} onClick={() => setActiveTab('budgets')} />
                    <TabButton label="Settings" icon={Settings} isActive={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>
            </div>
            
            <main className="p-4 sm:p-6 lg:p-8">
                {activeTab === 'overview' && (
                    <>
                        <CashflowQuadrant onDrillDown={handleDrillDown} />

                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    Accounts
                                    <HelpTooltip text="This section lists all your non-loan accounts like bank, credit card, and cash. Click on any account to see its detailed transaction history." />
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {accounts.filter(acc => acc.type !== 'Loan').map(account => (
                                    <AccountCard 
                                        key={account.id} 
                                        account={account} 
                                        balance={accountBalances.get(account.id) || 0}
                                        onClick={() => setSelectedAccount(account)}
                                        onAddTransaction={() => handleOpenTxnModal(account.id)}
                                    />
                                ))}
                                 {accounts.filter(acc => acc.type !== 'Loan').length === 0 && (
                                    <div className="col-span-full text-center py-12 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                                        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">No accounts yet!</h3>
                                        <p className="text-gray-600 dark:text-gray-400 mt-1">Click the '+' button to add an account.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
                
                {activeTab === 'transactions' && (
                    <AllTransactionsView />
                )}

                {activeTab === 'analytics' && (
                    <AnalyticsView handleDrillDown={handleDrillDown} onOpenAiChat={onOpenAiChat} />
                )}

                {activeTab === 'debts' && (
                    <DebtView onSelectAccount={setSelectedAccount} onAddDebt={() => setAccountModalOpen(true)} />
                )}

                {activeTab === 'budgets' && (
                    <BudgetsView />
                )}
                
                {activeTab === 'settings' && (
                    <SettingsView 
                        onManageCategories={() => setCategoryModalOpen(true)}
                        onViewTrash={() => setTrashModalOpen(true)}
                        onImport={() => setUploadModalOpen(true)}
                    />
                )}
            </main>
            
            <MultiActionButton
                onAddTransaction={() => handleOpenTxnModal()}
                onImport={() => setUploadModalOpen(true)}
                onAddAccount={() => setAccountModalOpen(true)}
            />

            {isTxnModalOpen && <TransactionModal onClose={handleCloseTxnModal} defaultAccountId={defaultAccountIdForNewTxn} />}
            {isUploadModalOpen && <FileUploadModal onClose={() => setUploadModalOpen(false)} />}
            {isAccountModalOpen && <AddAccountModal onClose={() => setAccountModalOpen(false)} defaultType={activeTab === 'debts' ? 'Loan' : undefined} />}
            {isCategoryModalOpen && <CategoryManagerModal onClose={() => setCategoryModalOpen(false)} />}
            {isTrashModalOpen && <TrashModal onClose={() => setTrashModalOpen(false)} />}
        </div>
    );
};

export default Dashboard;