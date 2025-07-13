import React from 'react';
import type { Account, AccountType } from '../types';
import { Banknote, CreditCard, Landmark, PiggyBank, HandCoins, Plus } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

const accountIcons: Record<AccountType, React.ReactNode> = {
    'Bank': <Landmark size={24} />,
    'Credit Card': <CreditCard size={24} />,
    'Loan': <Banknote size={24} />,
    'Investment': <PiggyBank size={24} />,
    'Cash': <HandCoins size={24} />,
};

const typeColors: Record<AccountType, string> = {
    'Bank': 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-500',
    'Credit Card': 'bg-orange-50 dark:bg-orange-900/40 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-500',
    'Loan': 'bg-gray-50 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-500',
    'Investment': 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-500',
    'Cash': 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-500',
};


interface AccountCardProps {
  account: Account;
  balance: number;
  onClick: () => void;
  onAddTransaction: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({ account, balance, onClick, onAddTransaction }) => {
  const { formatCurrency } = useCurrency();
  const balanceColor = balance >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400';
  const formattedBalance = formatCurrency(balance);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddTransaction();
  };

  return (
    <div 
        onClick={onClick}
        className={`group relative p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{account.type}</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-1">{account.name}</p>
        </div>
        <div className={`p-3 rounded-full ${typeColors[account.type]}`}>
            {accountIcons[account.type]}
        </div>
      </div>
      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Closing Balance</p>
        <p className={`text-3xl font-extrabold ${balanceColor}`}>{formattedBalance}</p>
      </div>
      
      <button
        onClick={handleAddClick}
        aria-label={`Add transaction to ${account.name}`}
        className="absolute top-4 right-4 p-1.5 bg-gray-100/50 dark:bg-gray-900/30 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 hover:text-primary-600 dark:hover:text-primary-400 transition-all opacity-0 group-hover:opacity-100"
      >
        <Plus size={18} />
      </button>
    </div>
  );
};

export default AccountCard;